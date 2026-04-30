import { GetOwnQtsFilters, Pagination, QuotazioneDTO, QuotazioniListResponse, Scope } from "layouts/quotazioni/types/quotations";
import { useCallback, useEffect, useRef, useState } from "react";
import { getOwnQuotationsData } from "../fetchdata/get/getOwnQuotationsData";
import { useUserContext } from "context/UserContext";
import { enqueueSnackbar } from "components/MessageBox";
import { advancedQuotationSearchData } from "../fetchdata/get/advancedQuotationSearch";

// Cache LRU (in-memory) per evitare richieste duplicate con stessi filtri.
// Manteniamo TTL breve per avere dati freschi senza perdere reattività lato UI.
const CACHE_TTL_MS = 60_000;
const CACHE_MAX = 50;
const ADVANCED_SEARCH_DEBOUNCE_MS = 300;
type QtsCacheEntry = { ts: number; data: QuotazioniListResponse };
type AdvancedSearchCacheEntry = { ts: number; data: QuotazioneDTO[] };
const qtsLru = new Map<string, QtsCacheEntry>();
const advancedSearchLru = new Map<string, AdvancedSearchCacheEntry>();

function setQtsLRU(key: string, value: QtsCacheEntry) {
    qtsLru.set(key, value);
    if (qtsLru.size > CACHE_MAX) {
        const oldest = [...qtsLru.entries()].reduce((a, b) => (a[1].ts < b[1].ts ? a : b))[0];
        qtsLru.delete(oldest);
    }
}

function getQtsLRU(key: string): QuotazioniListResponse | null {
    const hit = qtsLru.get(key);
    if (!hit) return null;
    if (Date.now() - hit.ts > CACHE_TTL_MS) {
        qtsLru.delete(key);
        return null;
    }
    // touch LRU
    qtsLru.delete(key);
    qtsLru.set(key, hit);
    return hit.data;
}

function setAdvancedSearchLRU(key: string, value: AdvancedSearchCacheEntry) {
    advancedSearchLru.set(key, value);
    if (advancedSearchLru.size > CACHE_MAX) {
        const oldest = [...advancedSearchLru.entries()].reduce((a, b) => (a[1].ts < b[1].ts ? a : b))[0];
        advancedSearchLru.delete(oldest);
    }
}

function getAdvancedSearchLRU(key: string): QuotazioneDTO[] | null {
    const hit = advancedSearchLru.get(key);
    if (!hit) return null;
    if (Date.now() - hit.ts > CACHE_TTL_MS) {
        advancedSearchLru.delete(key);
        return null;
    }
    advancedSearchLru.delete(key);
    advancedSearchLru.set(key, hit);
    return hit.data;
}

export function useQuotation() {
    const [userState] = useUserContext(); // per ottenere l'agenteId

    const [raw, setRaw] = useState<any[]>([]);
    const [inpagination, setInpagination] = useState<Pagination>(); // stato della paginazione

    const [view, setView] = useState<'grid' | 'list'>('list'); // stato della visualizzazione: grid | list
    const [scope, setScope] = useState<Scope>('TUTTI');

    const [openTableRowSettings, setOpenTableRowSettings] = useState<{ indexRow: number; allData: any[] } | null>(null); // per mostrare/nascondere il pannello delle impostazioni delle righe della tabella
    const [openFilters, setOpenFilters] = useState<boolean>(false); // per mostrare/nascondere il pannello filtri
    const [openSearch, setOpenSearch] = useState<boolean>(false); // per mostrare/nascondere il pannello di ricerca
    const contextMenuRef = useRef<HTMLDivElement>(null); // per posizionare il context menu

    // stato dei filtri controllati
    // stato interno per il sort, group, ecc
    // const [filters, setFilters] = useState<Filters>({});
    // const [sortDir, setSortDir] = useState<SortDir>('desc');

    const [dateFrom, setDateFrom] = useState<string>(new Date().getFullYear() + '-01-01');
    const [dateTo, setDateTo] = useState<string>(new Date().toISOString().substring(0, 10));
    const [filterType, setFilterType] = useState<string>('');
    const [filterState, setFilterState] = useState<string>('');
    const [filterId, setFilterId] = useState<string>('');
    const [priceFrom, setPriceFrom] = useState<string>("");
    const [priceTo, setPriceTo] = useState<string>("");
    const [filterBuyerCode, setFilterBuyerCode] = useState<string>("");
    const [filterAgenteId, setFilterAgenteId] = useState<string>("");

    const [loading, setLoading] = useState(false); // stato di caricamento
    const [advancedSearchQuery, setAdvancedSearchQuery] = useState<string>("");
    const [advancedSearchRows, setAdvancedSearchRows] = useState<QuotazioneDTO[]>([]);
    const [advancedSearchLoading, setAdvancedSearchLoading] = useState<boolean>(false);
    // const [loadStatus, setLoadStatus] = useState<Record<string, boolean>>({
    //     req_customersList: false,
    // });
    const abortRef = useRef<AbortController | null>(null);
    const lastSentKeyRef = useRef<string>("");
    const advancedSearchAbortRef = useRef<AbortController | null>(null);
    const advancedSearchDebounceRef = useRef<number | null>(null);
    const advancedSearchSeqRef = useRef<number>(0);

    const [selected, setSelected] = useState<string[]>([]); // stato della selezione (IDs) nella tabella
    const isSelected = useCallback((q: QuotazioneDTO) => selected.includes(q._id), [selected]);
    const toggleSelect = useCallback((q: QuotazioneDTO, multi = false) => {
        setSelected(prev => (multi ? (prev.includes(q._id) ? prev.filter(x => x !== q._id) : [...prev, q._id]) : [q._id]));
    }, []);

    // const ChangeLoadStatus = ({ from, bool }: ChangeLoadStatusArgs) => {
    //     setLoadStatus((prev) => ({ ...prev, [from]: bool !== undefined ? bool : !prev[from] }));

    const buildFetchKey = useCallback((filters?: GetOwnQtsFilters) => {
        // La chiave include tutti i filtri server-driven.
        // Se la chiave cambia, cambia anche il dataset atteso dalla API.
        return JSON.stringify({
            stato: filters?.stato ?? null,
            tipologia: filters?.tipologia ?? null,
            prog_num: filters?.prog_num ?? null,
            dateFrom: filters?.dateFrom ?? null,
            dateTo: filters?.dateTo ?? null,
            valoreMin: filters?.valoreMin ?? null,
            valoreMax: filters?.valoreMax ?? null,
            buyerCode: filters?.buyerCode ?? null,
            agenteId: filters?.agenteId ?? null,
            limit: filters?.limit ?? null,
            page: filters?.page ?? null,
            sortBy: filters?.sortBy ?? null,
            order: filters?.order ?? null,
        });
    }, []);

    const buildAdvancedSearchKey = useCallback((query: string, filters?: GetOwnQtsFilters) => {
        return `${query.trim()}::${buildFetchKey(filters)}`;
    }, [buildFetchKey]);

    const stopAdvancedSearch = useCallback(() => {
        if (advancedSearchDebounceRef.current) {
            window.clearTimeout(advancedSearchDebounceRef.current);
            advancedSearchDebounceRef.current = null;
        }
        if (advancedSearchAbortRef.current) {
            advancedSearchAbortRef.current.abort();
            advancedSearchAbortRef.current = null;
        }
        advancedSearchSeqRef.current += 1;
        setAdvancedSearchLoading(false);
    }, []);

    const runAdvancedSearch = useCallback((query: string, filters?: GetOwnQtsFilters) => {
        setAdvancedSearchQuery(query);

        if (advancedSearchDebounceRef.current) {
            window.clearTimeout(advancedSearchDebounceRef.current);
            advancedSearchDebounceRef.current = null;
        }

        const trimmedQuery = String(query ?? "").trim();
        if (!trimmedQuery) {
            stopAdvancedSearch();
            setAdvancedSearchRows([]);
            return;
        }

        advancedSearchDebounceRef.current = window.setTimeout(async () => {
            advancedSearchDebounceRef.current = null;

            const key = buildAdvancedSearchKey(trimmedQuery, filters);
            const cached = getAdvancedSearchLRU(key);
            if (cached) {
                setAdvancedSearchRows(cached);
                setAdvancedSearchLoading(false);
                return;
            }

            advancedSearchAbortRef.current?.abort();
            const controller = new AbortController();
            advancedSearchAbortRef.current = controller;

            const requestSeq = ++advancedSearchSeqRef.current;
            setAdvancedSearchLoading(true);

            try {
                const res = await advancedQuotationSearchData({
                    abortController: controller,
                    query: trimmedQuery,
                    filters,
                });

                if (requestSeq !== advancedSearchSeqRef.current) return;
                const rows = Array.isArray(res?.data) ? res.data : [];
                setAdvancedSearchRows(rows);
                setAdvancedSearchLRU(key, { ts: Date.now(), data: rows });
            } catch (err: any) {
                if (err?.name !== "AbortError") {
                    const backendMsg =
                        typeof err?.message === "string"
                            ? err.message
                            : err?.message?.msg || "Errore durante la ricerca avanzata.";
                    enqueueSnackbar(backendMsg, {
                        title: "Ops..",
                        type: "error",
                    });
                }
            } finally {
                if (requestSeq === advancedSearchSeqRef.current && advancedSearchAbortRef.current === controller) {
                    advancedSearchAbortRef.current = null;
                    setAdvancedSearchLoading(false);
                }
            }
        }, ADVANCED_SEARCH_DEBOUNCE_MS) as unknown as number;
    }, [buildAdvancedSearchKey, stopAdvancedSearch]);

    useEffect(() => {
        return () => {
            stopAdvancedSearch();
        };
    }, [stopAdvancedSearch]);

    const runFetch = (filters?: GetOwnQtsFilters, options?: { force?: boolean; onComplete?: (res: QuotazioniListResponse) => void }) => {
        const key = buildFetchKey(filters);
        const force = Boolean(options?.force);
        // force=true: bypass cache/deduplica per aggiornare subito la lista dopo mutazioni.

        if (!force) {
            // Flusso standard: prova cache, poi rete solo se necessario.
            const cached = getQtsLRU(key);
            if (cached) {
                setRaw(cached.data);
                setInpagination(cached.pagination as any);
                lastSentKeyRef.current = key;
                // Anche in cache-hit eseguiamo onComplete per mantenere un flusso uniforme.
                options?.onComplete?.(cached);
                return;
            }

            if (lastSentKeyRef.current === key) {
                return;
            }
        }

        abortRef.current?.abort();
        abortRef.current = new AbortController();
        // Tracciamo l'ultima key inviata per deduplicare richieste identiche ravvicinate.
        lastSentKeyRef.current = key;

        getOwnQuotationsData({
            abortController: abortRef.current,
            user: userState,
            filters,
            HandleComplete: (res: QuotazioniListResponse) => {
                setRaw(res.data);
                setInpagination(res.pagination as any);
                setQtsLRU(key, { ts: Date.now(), data: res });
                // Callback post-fetch per logiche UI che dipendono dalla risposta finale.
                options?.onComplete?.(res);
            },
            HandleError: (msg: any) => enqueueSnackbar(msg ?? "Errore imprevisto", {
                title: 'Ops..',
                type: 'error',
            }),
            ChangeLoadStatus: ({ bool }) => setLoading(Boolean(bool)),
        }).catch((e) => {
            if (e?.name !== "AbortError") {
                enqueueSnackbar("Errore nel recupero delle quotazioni.", {
                    title: 'Ops..',
                    type: 'error',
                });
                setLoading(false);
            }
        });
    };

    // ====== LEGACY LOCALE (disattivata) ======
    // La vecchia pipeline filtrava/smistava i risultati *dopo* la fetch su campi non più affidabili.
    // Manteniamo questi blocchi commentati per riferimento storico, ma il comportamento corretto ora è:
    // - filtri inviati al BE tramite runFetch(filters)
    // - risposta BE già coerente con i filtri applicati server-side.
    //
    // const filtered = useMemo(() => {
    //     const { types, dateFrom, dateTo } = filters;

    //     const fromOk = isValidISO(dateFrom) ? new Date(dateFrom!) : null;
    //     const toOk = isValidISO(dateTo) ? new Date(dateTo!) : null;

    //     return raw.filter(r => {
    //         if (types?.length && !types.includes(r.tp)) return false;

    //         if (fromOk && new Date(r.date).getTime() < fromOk.getTime()) return false;
    //         if (toOk && new Date(r.date).getTime() > toOk.getTime()) return false;

    //         return true;
    //     });
    // }, [raw, filters]);

    // const sorted = useMemo(() => {
    //     const mul = sortDir === 'asc' ? 1 : -1;
    //     const cmp = (a: any, b: any) => {
    //         return (new Date(a.date).getTime() - new Date(b.date).getTime()) * mul
    //     };
    //     // copia difensiva per non mutare filtered
    //     return filtered.length > 1 ? [...filtered].sort(cmp) : filtered;
    // }, [raw, filtered, sortDir]);

    // const groups = useMemo(() => {
    //     const map = new Map<string, any[]>();
    //     const keyOf = (d: any) => {
    //         // date buckets
    //         const dt = new Date(d.date);
    //         const now = new Date();
    //         const diff = (now.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24);
    //         if (diff <= 7) return 'Ultimi 7 giorni';
    //         if (diff <= 30) return 'Ultimi 30 giorni';
    //         return 'Ultimi 3 mesi';
    //     };
    //     sorted.forEach(d => {
    //         const k = keyOf(d);
    //         const arr = map.get(k);
    //         if (arr) arr.push(d); else map.set(k, [d]);
    //     });
    //     const labels = Array.from(map.keys());
    //     const counts: number[] = [];
    //     const flat: any[] = [];
    //     labels.forEach(l => { const a = map.get(l)!; counts.push(a.length); flat.push(...a); });
    //     return { groupCounts: counts, groupLabels: labels, flat, };
    // }, [raw, sorted]);


    // Diagnostica allineata alla modalità server-driven (niente trasformazioni locali).
    const counts = { raw: raw.length, scoped: raw.length, filtered: raw.length, sorted: raw.length, flat: raw.length };

    return {
        userState,
        // dati per la UI
        setRaw,
        // items: groups.flat,
        // groupCounts: groups.groupCounts,
        // groupLabels: groups.groupLabels,
        // Lista guidata dal backend: niente grouping/sorting locale.
        items: raw,
        groupCounts: [],
        groupLabels: [],

        view, setView,
        scope, setScope,

        openTableRowSettings, setOpenTableRowSettings,
        openFilters, setOpenFilters,
        openSearch, setOpenSearch,
        contextMenuRef,

        dateFrom, setDateFrom,
        dateTo, setDateTo,
        filterType, setFilterType,
        filterState, setFilterState,
        filterId, setFilterId,
        priceFrom, setPriceFrom,
        priceTo, setPriceTo,
        filterBuyerCode, setFilterBuyerCode,
        filterAgenteId, setFilterAgenteId,

        runFetch,
        runAdvancedSearch,
        stopAdvancedSearch,

        isSelected, toggleSelect,
        selected,
        setSelected,

        // diagnostica
        counts,

        // paginazione
        inpagination, setInpagination,

        loading, setLoading,

        advancedSearchQuery,
        advancedSearchRows,
        advancedSearchLoading,
        setAdvancedSearchRows,
    };
}


