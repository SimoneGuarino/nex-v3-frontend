import React, { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CustomerItem, DocumentItemMapped, Filters, GroupBy, Pagination, ScopeTab, SortBy, SortDir } from '../types';
import { GetDataAPI } from '../fetchData/getData';
import { enqueueSnackbar } from 'components/MessageBox';
import { SerchCustomersAPI } from '../fetchData/serchCustomers';
import { MdPersonOutline } from "react-icons/md";
import { DownloadFilesAPI } from '../fetchData/download';
import { FormatDate } from 'utils/date/getDate';
import { writeRecent } from 'components/UI/search/FDSearchPanel';
import { GetCorrelatedAPI } from '../fetchData/getCorrelated';

// ——————————————————————————————————————————————————————————
// TIPI E COSTANTI
// ——————————————————————————————————————————————————————————
export type ViewMode = 'grid' | 'list';
export type QuerySource = 'debounced' | 'direct' | 'table';
export type CacheStrategy = 'separate' | 'shared' | 'bypass';

type SearchResponse = { items: any[]; counts: { raw: number; flat: number } };

type fetchSearchParams = {
    query: string;
    signal: any;
    fromDebounce?: boolean;
    fromScroll?: boolean;
};

type StoredFavoriteDocument = {
    id: string;
    element_type: 'DOCUMENT';
    type?: 'BOLLA' | 'FATTURA';
    name: string;
    date: any;
    ragione_sociale: string;
    codice_cliente: string;
    numdoc: string;
    company: string;
    favorite: true;
    sharedWith?: { id: string; initials: string }[];
};

/** finestra di debounce */
const DEBOUNCE_MS = 280;
/** 60s di cache */
const CACHE_TTL_MS = 60_000;
/** LRU size cap */
const CACHE_MAX = 50;
const ID_SCHEMA_VERSION = 3;
// Lista IDs preferiti: stato minimale usato per toggle veloce e check O(1).
const FAVORITES_STORAGE_KEY = 'fd_documentiPDF_favorites_v1';
// Snapshot documenti preferiti: serve a mantenere il tab "Preferiti" globale anche
// quando il dataset corrente (raw) cambia per filtri/ricerche/paginazione.
const FAVORITES_DOCS_STORAGE_KEY = 'fd_documentiPDF_favorite_docs_v1';

type CacheEntry = { ts: number; data: SearchResponse };
const lru = new Map<string, CacheEntry>();

const MdPersonOutlineIcon = MdPersonOutline as React.FC<{ className?: string }>;


// ——————————————————————————————————————————————————————————
// HELPERS
// ——————————————————————————————————————————————————————————
function setLRU(key: string, val: CacheEntry) {
    lru.set(key, val);
    if (lru.size > CACHE_MAX) {
        const oldest = [...lru.entries()].reduce((a, b) => (a[1].ts < b[1].ts ? a : b))[0];
        lru.delete(oldest);
    }
};

/**
 * Restituisce l'entry se valida, altrimenti null
 * @param key 
 * @returns SearchResponse | null
 */
function getLRU(key: string): SearchResponse | null {
    const hit = lru.get(key);
    if (!hit) return null;
    if (Date.now() - hit.ts > CACHE_TTL_MS) { lru.delete(key); return null; }
    lru.delete(key); lru.set(key, hit); // touch
    return hit.data;
};

const isValidISO = (v?: string) => !!(v && !Number.isNaN(new Date(v).getTime()));
const safeLower = (s?: string) => (typeof s === 'string' ? s.toLowerCase() : '');

const collator = new Intl.Collator('it', { sensitivity: 'base', numeric: true });
const toStr = (v: unknown) => (v ?? '').toString().trim();
const cmpStr = (a: unknown, b: unknown) => collator.compare(toStr(a), toStr(b));
const toTime = (v: unknown) => {
    if (!v) return 0;
    const t = new Date(v as any).getTime();
    return Number.isFinite(t) ? t : 0;
};

/**
 * Legge in modo difensivo la lista di IDs preferiti salvati localmente.
 * @returns string[]
 */
function readFavoriteIdsFromStorage(): string[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        const ids = parsed.filter((v): v is string => typeof v === 'string');
        return Array.from(new Set(ids));
    } catch {
        return [];
    }
};

// Legge in modo difensivo il dizionario dei documenti preferiti salvati localmente.
// Se il payload è corrotto o non compatibile, fallback a oggetto vuoto.
function readFavoriteDocsFromStorage(): Record<string, StoredFavoriteDocument> {
    if (typeof window === 'undefined') return {};
    try {
        const raw = window.localStorage.getItem(FAVORITES_DOCS_STORAGE_KEY);
        if (!raw) return {};
        const parsed: unknown = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return {};
        const out: Record<string, StoredFavoriteDocument> = {};
        for (const [id, v] of Object.entries(parsed as Record<string, any>)) {
            if (!v || typeof v !== 'object') continue;
            if (typeof v.id !== 'string' || v.element_type !== 'DOCUMENT') continue;
            out[id] = {
                id: v.id,
                element_type: 'DOCUMENT',
                type: v.type,
                name: String(v.name ?? ''),
                date: v.date ?? '',
                ragione_sociale: String(v.ragione_sociale ?? ''),
                codice_cliente: String(v.codice_cliente ?? ''),
                numdoc: String(v.numdoc ?? ''),
                company: String(v.company ?? 'N/A'),
                favorite: true,
                sharedWith: Array.isArray(v.sharedWith) ? v.sharedWith : [],
            };
        }
        return out;
    } catch {
        return {};
    }
};

// Normalizza il documento in forma serializzabile per localStorage.
function toStoredFavoriteDoc(doc: DocumentItemMapped): StoredFavoriteDocument {
    return {
        id: doc.id,
        element_type: 'DOCUMENT',
        type: doc.type,
        name: doc.name,
        date: doc.date,
        ragione_sociale: String(doc.ragione_sociale ?? ''),
        codice_cliente: String(doc.codice_cliente ?? ''),
        numdoc: String(doc.numdoc ?? ''),
        company: String(doc.company ?? 'N/A'),
        favorite: true,
        sharedWith: Array.isArray(doc.sharedWith) ? doc.sharedWith : [],
    };
};

/**
 * Estrae "numdoc" coerente con lo schema file:
 * es: DOC-BOLLA-027320-POSTEITALIANESPA-013468WE-171225  -> 013468WE
 * Fallback: se non matcha, ritorna "" e useremo il valore BE r.numdoc.
 */
function extractNumDocFromFileName(fileName?: string) {
    if (!fileName) return '';
    const base = String(fileName).replace(/\.pdf$/i, '').trim();
    const parts = base.split('-').filter(Boolean);
    // schema atteso: DOC, <TIPO>, <CC>, <RAGSOC...>, <NUMDOC>, <DATA>
    // => penultimo è NUMDOC
    if (parts.length >= 2) {
        const candidate = parts[parts.length - 2];
        // piccolo sanity: evitiamo che sia palesemente una data (6 cifre)
        if (candidate && !/^\d{6}$/.test(candidate)) return candidate;
    }
    return '';
};


// ——————————————————————————————————————————————————————————
// HOOK PRINCIPALE
// ——————————————————————————————————————————————————————————
export function useDocuments() {
    const [raw, setRaw] = useState<DocumentItemMapped[]>([]);
    const [rawSearch, setRawSearch] = useState<DocumentItemMapped[]>([]);
    const [favoriteIds, setFavoriteIds] = useState<string[]>(() => readFavoriteIdsFromStorage());
    const [favoriteDocs, setFavoriteDocs] = useState<Record<string, StoredFavoriteDocument>>(() => readFavoriteDocsFromStorage());
    const favoriteIdsSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
    /** ricerche recenti */
    const [recentSearch, setRecentSearch] = React.useState<string[]>([]);

    const [view, setView] = useState<ViewMode>('grid');
    /** tab attivo - favorites, shared, deleted */
    const [scope, setScope] = useState<ScopeTab>('all');
    /** stato della paginazione */
    const [inpagination, setInpagination] = useState<Pagination>();
    /** mostrare/nascondere il pannello filtri */
    const [openFiltersPanel, setOpenFiltersPanel] = useState(false);

    // filtri controllati (query backend)
    const [dateFrom, setDateFrom] = useState<string>(new Date().getFullYear() + '-01-01');
    const [dateTo, setDateTo] = useState<string>(new Date().toISOString().substring(0, 10));
    const [kw, setKw] = useState<string>('');
    const [filterCompany, setFilterCompany] = useState<string>('FOCELDA');
    const [filterType, setFilterType] = useState<string>('');
    /**codice cliente */
    const [filterCc, setFilterCc] = useState<string>('');
    /*
    TASK: ricerca fatture/bolle per codice prodotto
    - "cdar" è il query-param che il BE usa per filtrare WCDAR
    - lo teniamo come filtro controllato in FE, come gli altri (cc, company, type, date)
    */
    const [filterCdar, setFilterCdar] = useState<string>('');

    // documento selezionato
    const [filterDocId, setFilterDocId] = useState<string>('');
    const [filterDocNum, setFilterDocNum] = useState<string>(''); // solo UI

    // stato interno
    const [filters, setFilters] = useState<Filters>({});
    const [sortBy, setSortBy] = useState<SortBy>('date');
    const [sortDir, setSortDir] = useState<SortDir>('desc');
    const [groupBy, setGroupBy] = useState<GroupBy>('date');

    /** stato della selezione (IDs) nella tabella */
    const [selected, setSelected] = useState<string[]>([]);
    /** stato della selezione singola nella ricerca mirata, per azioni contestuali extra */
    const [singleSelected, setSingleSelected] = useState<DocumentItemMapped[]>([]);
    /** loading per le fetch esplicite */
    const [loading, setLoading] = useState(false);
    /** loading per la ricerca debounced */
    const [loadingSearch, setLoadingSearch] = useState(false);
    /** loading per fetch more (scroll) */
    const [loadingMore, setLoadingMore] = useState(false);
    const abortdebounceRef = useRef<AbortController | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const abortRefDownload = useRef<AbortController | null>(null);

    const [q, setQ] = useState<string>("");


    // ——————————————————————————————————————————————————————————
    // MODALITÀ "CORRELATI" (BOLLA <-> FATTURA)
    // ——————————————————————————————————————————————————————————
    // Quando valorizzato, la fetch "diretta" (non-debounced) userà /pdf/v2/correlated
    // invece di /pdf/v2/search, così riusiamo tutta la UI esistente (lista, share, download, ecc.).
    type CorrelatedTarget = {
        from: string;      // "FOCELDA" | "IOT" | "ADJ" (il BE accetta anche ADJ)
        fileName: string;  // "DOC-BOLLA-..." o "DOC-FATTURA-..."
        label?: string;    // testo per chip UI (opzionale)
    };

    const correlatedRef = useRef<CorrelatedTarget | null>(null);
    const [correlatedTarget, _setCorrelatedTarget] = useState<CorrelatedTarget | null>(null);

    const setCorrelatedTarget = useCallback((next: CorrelatedTarget | null) => {
        correlatedRef.current = next;
        _setCorrelatedTarget(next);
    }, []);


    // --- Concurrency control / race guard ---
    /**1 sola fetch attiva */
    const inflight = useRef<AbortController | null>(null);
    /** id sequenziale richieste inviate */
    const seq = useRef(0);
    /** ultima risposta applicata */
    const lastApplied = useRef(0);
    const debounceId = useRef<number | null>(null);
    /** per dedupe richieste identiche */
    const lastSentKey = useRef<string>("");

    /** cleanup su unmount */
    useEffect(() => {
        return () => {
            if (debounceId.current) window.clearTimeout(debounceId.current);
            if (inflight.current) inflight.current.abort();
        };
    }, []);

    /** salva la ricerca corrente quando confermi */
    const commitSearchIfNeeded = React.useCallback((q: string) => {
        if (!q.trim()) return;
        setRecentSearch((prev: string[]) => {
            const copy = [...prev];
            const next = [q, ...copy].slice(0, 4);
            writeRecent("fd_documentiPDF_recent_docs", next);
            return next;
        });
    }, [recentSearch]);

    /**
     * serializza parametri => chiave cache/req
     * chiave cache: includo versione schema id per evitare mix
     */
    const buildKey = useCallback((query: string) => {
        return JSON.stringify({
            schema: ID_SCHEMA_VERSION,
            q: query.trim(),
            from: dateFrom ?? null,
            to: dateTo ?? null,
            cc: filterCc ?? "N/A",
            // TASK: includo cdar nella chiave cache/dedupe:
            // se cambia il codice prodotto, la richiesta NON deve riusare cache precedente
            cdar: filterCdar || null,
            company: filterCompany || null,
            type: filterType || null,
            docId: filterDocId || null,
            offset: inpagination?.nextOffset! ?? 0,
            correlated: correlatedRef.current ? { from: correlatedRef.current.from, fileName: correlatedRef.current.fileName } : null,

        });
    }, [dateFrom, dateTo, filterCompany, filterType, filterCc, filterCdar, filterDocId, inpagination, correlatedTarget]);

    // ID STABILE: company + fileName (NO date)
    const makeId = (r: any) => {
        const company = encodeURIComponent(String(r.company ?? 'N/A'));
        const fileName = encodeURIComponent(String(r.fileName ?? ''));
        return `doc::${company}::${fileName}`;
    };

    const fetchSearch = useCallback(async ({ query, signal, fromDebounce, fromScroll }: fetchSearchParams): Promise<SearchResponse> => {

        // ——————————————————————————————————————————————————————————
        // MODALITÀ CORRELATI (solo fetch DIRETTA, mai debounced)
        // ——————————————————————————————————————————————————————————
        // In questa modalità ignoriamo i filtri "normali" (date/company/type/cc/cdar),
        // perché l’endpoint /pdf/v2/correlated accetta solo { from, fileName, limit, offset }.
        // La UI resta la stessa: cambiamo solo la sorgente dati.
        const corr = correlatedRef.current;
        if (!fromDebounce && corr) {
            const corrParams = new URLSearchParams();
            corrParams.set("from", corr.from);
            corrParams.set("fileName", corr.fileName);

            // paginazione: se è scroll usiamo nextOffset, altrimenti 0
            if (fromScroll && inpagination?.nextOffset) {
                corrParams.set("offset", String(inpagination.nextOffset));
            } else {
                corrParams.set("offset", "0");
            };

            const data: any = await GetCorrelatedAPI({
                abortController: signal,
                query: corrParams.toString(),
                HandleError: console.error,
            });

            if (data && data?.pagination) {
                setInpagination(data.pagination);
            };

            if (!data || !Array.isArray(data.items)) {
                throw new Error("Errore nel recupero dei documenti correlati");
            };

            const mapped: DocumentItemMapped[] = (data.items ?? []).map((r: any) => {
                const fileName = String(r.fileName ?? '');
                const numFromName = extractNumDocFromFileName(fileName);
                const numdoc = numFromName || String(r.numdoc ?? '');

                return {
                    id: makeId(r),
                    element_type: "DOCUMENT",
                    type: String(r.tpGroup ?? ''),
                    name: fileName,
                    date: FormatDate({ date: r.date, actualFromat: 'yyyymmdd' }),
                    ragione_sociale: String(r.ragione_sociale ?? ''),
                    codice_cliente: String(r.codice_cliente ?? ''),
                    numdoc,
                    company: String(r.company ?? 'N/A'),
                    favorite: Boolean(r.favorite),
                    sharedWith: Array.isArray(r.sharedWith) ? r.sharedWith : [],
                };
            });

            return {
                items: mapped,
                counts: { raw: mapped.length, flat: mapped.length },
            };
        };


        const qTrim = query.trim();
        /**
         * Riconoscimento "codice prodotto" nella ricerca mirata:
         * - non vogliamo autocomplete
         * - vogliamo però che digitando 5 o 6 cifre numeriche, i documenti vengano cercati su WCDAR (cdar=)
         *
         * Nota:
         * - normalizziamo qui a 6 cifre (padStart) per allinearci a CHAR(6)
         * - il BE fa già normalizeQuery, ma averlo già normalizzato ci serve anche per popolare il filtro in UI
         */
        const isNumericQuery = /^\d+$/.test(qTrim);
        const cdarFromQuery =
            isNumericQuery && (qTrim.length === 5 || qTrim.length === 6)
                ? qTrim.padStart(6, "0")
                : "";
        /**
         * useCdarQuery è TRUE solo nella ricerca mirata (debounced).
         * Così NON cambiamo il comportamento della ricerca "principale" (Apply filtri / scroll),
         * e non rischiamo di rompere i flussi esistenti.
         */
        const useCdarQuery = Boolean(fromDebounce) && Boolean(cdarFromQuery);

        const params = new URLSearchParams(); //usato per query "diretta" e paginazione (documenti)
        const deb_params = new URLSearchParams(); //usato per debounce (clienti + documenti)

        if (query.trim()) deb_params.set("q", query.trim()); // deb_params serve anche per la ricerca CLIENTI.
        // Anche se per i documenti interpretiamo la query come cdar, per i clienti lasciamo q invariato
        // così l’utente continua a vedere suggerimenti cliente mentre digita numeri.
        if (filterCc) {
            deb_params.set("cc", filterCc ?? "N/A");
            params.set("cc", filterCc ?? "N/A")
        };
        if (filterCompany) {
            params.set("from", filterCompany);
            deb_params.set("from", filterCompany);
        };
        if (dateFrom) {
            params.set("da", dateFrom);
            deb_params.set("da", dateFrom);
        };
        if (dateTo) {
            params.set("a", dateTo);
            deb_params.set("a", dateTo);
        };
        if (filterType) {
            params.set("type", filterType);
            deb_params.set("type", filterType)
        };
        if (inpagination?.nextOffset && !fromDebounce && fromScroll) {
            params.set("offset", String(inpagination.nextOffset!));
        };
        /*
        TASK: filtro per codice prodotto (query-param "cdar")
        Nota importante: deb_params viene usato anche per la ricerca CLIENTI (SerchCustomersAPI).
        I clienti non hanno senso rispetto a "cdar" (è un filtro documenti)
        quindi NON lo aggiungiamo a deb_params per evitare di “sporcare” quella chiamata (o rischiare che la route clienti rigetti parametri inattesi).
        Creiamo invece docDebParams: è una copia di deb_params usata SOLO per GetDataAPI.
        */
        const docDebParams = new URLSearchParams(deb_params.toString());

        if (useCdarQuery) {
            /**
            quando interpretiamo la query come "codice prodotto", per i documenti NON vogliamo fare anche la ricerca testuale (q=),
            altrimenti rischiamo di filtrare per nome/numdoc/ragsoc e perdere risultati.
            Quindi:
            - rimuoviamo q dai parametri della chiamata documenti
            - impostiamo cdar=XXXXXX per attivare il filtro WCDAR sul BE
            */
            docDebParams.delete("q");
            docDebParams.set("cdar", cdarFromQuery);
        }

        if (filterCdar) {
            params.set("cdar", filterCdar);        // ricerca documenti "diretta" (apply / scroll)
            docDebParams.set("cdar", filterCdar);  // ricerca documenti "debounced"
        }

        let customers_data: any = [];
        if (fromDebounce && (!filterType || filterType === 'Cliente')) {
            //API call per i clienti (solo se non filtro per tipo)
            customers_data = await SerchCustomersAPI({
                abortController: signal,
                query: deb_params.toString(),
                HandleError: console.error,
                ChangeLoadStatus: () => { }
            });
        }
        // API call per i documenti
        const data: any = (!filterType || filterType !== 'Cliente') && await GetDataAPI({
            abortController: signal,
            //query: fromDebounce ? deb_params.toString() : params.toString(), //commentata e sostituita
            // fromDebounce: per i documenti usiamo docDebParams (deb_params + cdar se presente).
            // Così "cdar" arriva al BE anche in modalità debounced, senza influenzare la ricerca clienti.
            query: fromDebounce ? docDebParams.toString() : params.toString(),
            HandleError: console.error,
            ChangeLoadStatus: () => { }
        });

        if (!fromDebounce && (data && data?.pagination)) {
            setInpagination(data?.pagination);
        };

        if ((!data || !data?.items || !Array.isArray(data.items)) && (!filterType || filterType !== 'Cliente')) {
            throw new Error('Errore nel recupero dei documenti');
        };

        /** mappa i clienti in CustomerItem */
        const customers_mapped: CustomerItem[] = (customers_data ?? []).map((c: any) => ({
            id: `customer::${c.CodiceCliente?.Focelda ?? c.CodiceCliente?.IOT ?? Math.random().toString(36).substring(2, 7)}`,
            element_type: "PERSON",
            icon: createElement(MdPersonOutlineIcon, { className: "text-blue-500" }),
            tpGroup: "Cliente",
            name: c.RagioneSociale,
            codice_cliente: c.CodiceCliente,
            partita_iva: c.PartitaIva ?? undefined,
            codice_fiscale: c.CodiceFiscale ?? undefined,
            favorite: Boolean(c.favorite),
            sharedWith: Array.isArray(c.sharedWith) ? c.sharedWith : [],
            company: c.from
        }));

        /** mappa i risultati grezzi in DocumentItem */
        const mapped: DocumentItemMapped[] = (data.items ?? []).map((r: any) => {
            const fileName = String(r.fileName ?? '');
            const numFromName = extractNumDocFromFileName(fileName);
            const numdoc = numFromName || String(r.numdoc ?? '');

            return {
                id: makeId(r),
                element_type: "DOCUMENT",
                type: String(r.tpGroup ?? ''),
                name: fileName,
                date: FormatDate({ date: r.date, actualFromat: 'yyyymmdd' }),
                ragione_sociale: String(r.ragione_sociale ?? ''),
                codice_cliente: String(r.codice_cliente ?? ''),
                numdoc,
                company: String(r.company ?? 'N/A'),
                favorite: Boolean(r.favorite),
                sharedWith: Array.isArray(r.sharedWith) ? r.sharedWith : [],
                /*
                Se i documenti sono arrivati da una ricerca "per prodotto" (cdar),
                ci portiamo dietro il cdar usato: al click nel pannello mirato,
                applicheremo il filtro Codice prodotto invece di selezionare il singolo documento.
                */
                searchCdar: useCdarQuery ? cdarFromQuery : undefined,

            };
        });

        return {
            items: [...customers_mapped, ...mapped],
            counts: data.counts ?? { raw: ([...customers_mapped, ...mapped]).length, flat: ([...customers_mapped, ...mapped]).length }
        };
    }, [dateFrom, dateTo, filterCompany, filterType, filterCc, filterCdar, inpagination, correlatedTarget]);

    const applyLocalFavorites = useCallback((rows: any[]) => {
        return rows.map((r: DocumentItemMapped) => (
            r?.element_type === 'DOCUMENT'
                ? { ...r, favorite: favoriteIdsSet.has(r.id) }
                : r
        ));
    }, [favoriteIdsSet]);

    // Aggiorna lo snapshot locale dei preferiti usando i dati più recenti ricevuti dalle fetch.
    // Così il tab "Preferiti" può mostrare elementi anche fuori dal dataset corrente.
    const syncFavoriteDocsFromRows = useCallback((rows: any[]) => {
        const docs = (rows as DocumentItemMapped[]).filter((r) => r?.element_type === 'DOCUMENT' && favoriteIdsSet.has(r.id));
        if (!docs.length) return;

        setFavoriteDocs((prev) => {
            let changed = false;
            const next = { ...prev };
            for (const doc of docs) {
                const stored = toStoredFavoriteDoc(doc);
                const current = prev[doc.id];
                if (!current || JSON.stringify(current) !== JSON.stringify(stored)) {
                    next[doc.id] = stored;
                    changed = true;
                }
            }
            return changed ? next : prev;
        });
    }, [favoriteIdsSet]);

    const setData = useCallback(({ rows, fromScroll }: { rows: any[], fromScroll?: boolean }) => {
        const rowsWithFavorites = applyLocalFavorites(rows);
        syncFavoriteDocsFromRows(rowsWithFavorites);
        setRaw(prev => fromScroll ? [...prev, ...rowsWithFavorites] : rowsWithFavorites);
    }, [applyLocalFavorites, syncFavoriteDocsFromRows]);

    /** applica la risposta di una ricerca se più recente */
    const applyResponse = useCallback(({ ticket, resp, fromDebounce, fromScroll }: { ticket: number, resp: SearchResponse, fromDebounce?: boolean, fromScroll?: boolean }) => {
        if (ticket < lastApplied.current) return;
        lastApplied.current = ticket;
        if (fromDebounce) {
            const rowsWithFavorites = applyLocalFavorites(resp.items);
            syncFavoriteDocsFromRows(rowsWithFavorites);
            setRawSearch(rowsWithFavorites);
        }
        else setData({ rows: resp.items, fromScroll });
    }, [setData, applyLocalFavorites, syncFavoriteDocsFromRows]);

    /** esegue una ricerca IMMEDIATA (non debounced), rispettando abort & latest-only */
    const runSearch = useCallback(async (query: string, fromDebounce?: boolean, fromScroll?: boolean) => {
        setQ(query);
        const baseKey = buildKey(query);

        // distingue le cache: debounced vs non-debounced
        const srcTag = fromDebounce ? 'deb' : 'dir';
        const key = `${baseKey}::src=${srcTag}`;

        // dedupe: se è la stessa chiave già inviata e non sono cambiati i filtri, non rilanciare
        if (fromDebounce && lastSentKey.current === key) return;
        if (!fromDebounce && lastSentKey.current === key && !loadingSearch) return;
        if (!fromDebounce && lastSentKey.current === key && loading) return;

        // cache hit?
        const cached = getLRU(key);
        if (cached) {
            applyResponse({ ticket: seq.current, resp: cached, fromDebounce, fromScroll });
            // non setto loading qui perché è istantaneo
            lastSentKey.current = key;
            return;
        };

        // aborta la richiesta precedente (garantisce 1 attiva)
        if (inflight.current) inflight.current.abort();

        // nuova richiesta
        if (fromDebounce) {
            setLoadingSearch(true);
            abortdebounceRef.current = new AbortController();
            inflight.current = abortdebounceRef.current;
            commitSearchIfNeeded(query);
        } else {
            if (!fromScroll) setLoading(true);
            else setLoadingMore(true);

            abortRef.current = new AbortController();
            inflight.current = abortRef.current;
        };

        /** id crescente per guardare l’ordine */
        const ticket = ++seq.current;
        lastSentKey.current = key;

        try {
            const resp = await fetchSearch({ query, signal: fromDebounce ? abortdebounceRef : abortRef, fromDebounce, fromScroll });
            setLRU(key, { ts: Date.now(), data: resp });
            applyResponse({ ticket, resp, fromDebounce, fromScroll });
        } catch (err: any) {
            if (err?.name === "AbortError") return; // richiesta cancellata → silenzio
            // se nel frattempo è partita un’altra request, non sovrascrivere error/loading
            console.log(err);
            if (ticket === seq.current) enqueueSnackbar(err?.message ?? "Errore di rete", { type: 'error' });
        } finally {
            if (ticket === seq.current) {
                if (fromDebounce) setLoadingSearch(false);
                else {setLoading(false); setLoadingMore(false);};
                inflight.current = null;
            };
        };
    }, [applyResponse, buildKey, fetchSearch, loading, loadingSearch, commitSearchIfNeeded]);

    /** versione DEBOUNCED chiamata ad ogni tasto (usata da FDSearchPanel → DocumentsSearch → index) */
    const searchDebounced = useCallback((nextQ: string) => {
        setQ(nextQ); // aggiorna subito lo stato visivo della query
        if (debounceId.current) window.clearTimeout(debounceId.current);
        // trailing-only: invia 1 sola fetch dopo la pausa
        debounceId.current = window.setTimeout(() => {
            runSearch(nextQ, true);
        }, DEBOUNCE_MS) as unknown as number;
    }, [runSearch]);

    /** 
     * ricerca esplicita (es. Apply nel pannello filtri) — non debounced 
     * @param fromScroll determina se la ricerca è stata attivata dallo scroll 
    */
    const search = useCallback((fromScroll?: boolean, overrideQ?: string) => runSearch(overrideQ ?? q, false, fromScroll), [runSearch, q]);

    const downloadFiles = useCallback(async (files: string[]) => {
        const findElementById = (id: string) => raw.find(el => el.id === id);

        for (let i = 0; i < files.length; i++) {
            const id = files[i];
            const file: DocumentItemMapped | undefined = findElementById(id);
            if (!file) continue;

            // costruisci i parametri per il download
            const files_param = new URLSearchParams();
            files_param.set("name", file.name);
            files_param.set("date", file.date.toLocaleDateString('it-IT'));

            await DownloadFilesAPI({
                abortController: abortRefDownload,
                query: files_param.toString(), // usa parametri diversi per le chiamate debounced
                HandleError: console.error,
                ChangeLoadStatus: () => { }
            });
        }
    }, [raw]);

    const isSelected = useCallback((id: string) => selected.includes(id), [selected]);
    const toggleSelect = useCallback((id: string, multi = false) => {
        setSelected(prev => (multi ? (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]) : [id]));
    }, []);
    const clearSelection = useCallback(() => setSelected([]), []);

    /** Favorites toggle (client-side; collega poi API)  */
    const toggleFavorite = useCallback((id: string) => {
        const nextFavorite = !favoriteIdsSet.has(id);
        const currentDoc =
            raw.find((d) => d.id === id && d.element_type === 'DOCUMENT') ??
            rawSearch.find((d) => d.id === id && d.element_type === 'DOCUMENT');

        setFavoriteIds(prev => {
            const ret = nextFavorite ? [...prev, id] : prev.filter(x => x !== id);
            window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ret));
            return ret;
        });

        // Manteniamo allineati ID + snapshot del documento per persistenza "globale".
        setFavoriteDocs((prev) => {
            let ret;
            if (!nextFavorite) {
                if (!prev[id]) {
                    ret = prev;
                } else {
                    const next = { ...prev };
                    delete next[id];
                    ret = next;
                };
            };
            if (!currentDoc) {
                ret = prev;
            } else {
                ret = { ...prev, [id]: toStoredFavoriteDoc(currentDoc) };
            };

            window.localStorage.setItem(FAVORITES_DOCS_STORAGE_KEY, JSON.stringify(ret));
            return ret;
        });

        setRaw(prev => prev.map(d => (d.id === id ? { ...d, favorite: nextFavorite } : d)));
        setRawSearch(prev => prev.map(d => (d.id === id ? { ...d, favorite: nextFavorite } : d)));
    }, [favoriteIdsSet, raw, rawSearch]);

    // ====== DERIVED: scope + filters + sort ======
    const scoped = useMemo(() => {
        let base: DocumentItemMapped[] = [];
        switch (scope) {
            //case 'mine': return raw.filter(r => r.ownerId === 'me');
            case 'favorites': {
                // "Preferiti" = preferiti presenti in lista corrente + preferiti persistiti
                // non presenti in raw (es. salvati da una ricerca diversa).
                const fromRaw = raw.filter(r => r.favorite);
                const rawIds = new Set(fromRaw.map((r) => r.id));
                const persistedOnly = Object.values(favoriteDocs)
                    .filter((d) => !rawIds.has(d.id))
                    .map((d) => ({ ...d } as unknown as DocumentItemMapped));
                base = [...fromRaw, ...persistedOnly];
                break;
            }
            case 'shared': base = raw.filter(r => (r.sharedWith?.length ?? 0) > 0); break;
            case 'deleted': base = []; break;
            default: base = raw;
        }

        if (filterDocId) return base.filter(r => r.id === filterDocId);
        return base;
    }, [raw, scope, filterDocId, favoriteDocs]);

    const filtered = useMemo(() => {
        const { types, companies, dateFrom, dateTo, text } = filters;

        const fromOk = isValidISO(dateFrom) ? new Date(dateFrom!) : null;
        const toOk = isValidISO(dateTo) ? new Date(dateTo!) : null;
        const q = (text ?? '').trim();

        return scoped.filter(r => {
            if (types?.length && !types.includes((r as any).tp)) return false; // mantengo la logica esistente
            if (companies?.length && (!r.company || !companies.includes(r.company))) return false;

            if (fromOk && new Date(r.date).getTime() < fromOk.getTime()) return false;
            if (toOk && new Date(r.date).getTime() > toOk.getTime()) return false;

            if (q) {
                const t = q.toLowerCase();
                if (
                    !safeLower((r as any).ragione_sociale).includes(t) &&
                    !safeLower(r.name).includes(t) &&
                    !safeLower((r as any).numdoc).includes(t)
                ) return false;
            }
            return true;
        });
    }, [scoped, filters]);

    const sorted = useMemo(() => {
        const mul = sortDir === 'asc' ? 1 : -1;
        const cmp = (a: DocumentItemMapped, b: DocumentItemMapped) => {
            switch (sortBy) {
                // mantengo la semantica attuale su 'name' (ragione_sociale), ma in modo safe
                case 'name': return cmpStr((a as any).ragione_sociale, (b as any).ragione_sociale) * mul;
                case 'type': return cmpStr((a as any).type, (b as any).type) * mul;
                case 'company': return cmpStr(a.company, b.company) * mul;
                default: {
                    const ad = toTime(a.date);
                    const bd = toTime(b.date);
                    return (ad - bd) * mul;
                }
            }
        };
        // copia difensiva per non mutare filtered
        return filtered.length > 1 ? [...filtered].sort(cmp) : filtered;
    }, [filtered, sortBy, sortDir]);

    const groups = useMemo(() => {
        if (groupBy === 'none') {  // mantengo invariate altre logiche ma uso 'type'
            return { groupCounts: [], groupLabels: [] as string[], flat: sorted };
        };
        const map = new Map<string, DocumentItemMapped[]>();
        const keyOf = (d: DocumentItemMapped) => {
            if (groupBy === 'type') return (d as any).type || '—';
            if (groupBy === 'company') return d.company || '—';
            const dt = new Date(d.date);
            const now = new Date();
            const diff = (now.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24);
            if (diff <= 7) return 'Ultimi 7 giorni';
            if (diff <= 30) return 'Ultimi 30 giorni';
            return 'Ultimi 3 mesi';
        };
        sorted.forEach(d => {
            const k = keyOf(d);
            const arr = map.get(k);
            if (arr) arr.push(d); else map.set(k, [d]);
        });
        const labels = Array.from(map.keys());
        const counts: number[] = [];
        const flat: DocumentItemMapped[] = [];
        labels.forEach(l => { const a = map.get(l)!; counts.push(a.length); flat.push(...a); });
        return { groupCounts: counts, groupLabels: labels, flat };
    }, [sorted, groupBy]);

    // diagnostica utile per capire dove si svuota
    const counts = { raw: raw.length, scoped: scoped.length, filtered: filtered.length, sorted: sorted.length, flat: groups.flat.length };

    const selectedObjects = useMemo(() => sorted.filter(i => selected.includes(i.id)), [sorted, selected]);

    const resetFilters = useCallback(() => setFilters({}), []);

    return {
        // dati per la UI
        items: groups.flat,
        groupCounts: groups.groupCounts,
        groupLabels: groups.groupLabels,

        // stato base e setter
        setData,
        view, setView,
        scope, setScope,
        filters, setFilters, resetFilters,
        sortBy, setSortBy,
        sortDir, setSortDir,
        groupBy, setGroupBy,

        q, setQ, // stato della query di ricerca
        rawSearch,
        // stato delle ricerche recenti
        recentSearch, setRecentSearch,

        openFiltersPanel, setOpenFiltersPanel, // per mostrare/nascondere il pannello filtri

        // stato dei filtri controllati
        dateFrom, setDateFrom,
        dateTo, setDateTo,
        kw, setKw,
        filterCompany, setFilterCompany,
        filterType, setFilterType,
        filterCc, setFilterCc,
        // TASK: filtro FE -> BE per ricerca documenti tramite codice prodotto (WCDAR)
        filterCdar, setFilterCdar,

        filterDocId, setFilterDocId,
        filterDocNum, setFilterDocNum,

        // selezione
        selected, selectedObjects,
        isSelected, toggleSelect, clearSelection,
        singleSelected, setSingleSelected,

        // azioni
        toggleFavorite,
        loading, loadingSearch, loadingMore,
        search, searchDebounced, downloadFiles,

        // diagnostica
        counts,

        // paginazione
        inpagination, setInpagination,

        // ——————————————————————————————————————————————————————————
        // MODALITÀ CORRELATI (BOLLA <-> FATTURA)
        // ——————————————————————————————————————————————————————————
        // Esponiamo lo stato per:
        // - mostrare il chip "Correlati" in pagina
        // - poter uscire dalla modalità (setCorrelatedTarget(null))
        correlatedTarget, setCorrelatedTarget,
    };
};