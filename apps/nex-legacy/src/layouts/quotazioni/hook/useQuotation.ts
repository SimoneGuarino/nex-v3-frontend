import { GetOwnQtsFilters, Pagination, QuotazioneDTO, QuotazioniListResponse, Scope, SortableField } from "layouts/quotazioni/types/quotations";
import { useCallback, useEffect, useRef, useState } from "react";
import { getOwnQuotationsData } from "../fetchdata/get/getOwnQuotationsData";
import { useUserContext } from "context/UserContext";
import { enqueueSnackbar } from "components/MessageBox";
import { advancedQuotationSearchData } from "../fetchdata/get/advancedQuotationSearch";
import { GetQuotationOkLinksAPI } from "../fetchdata/get/getQuotationOkLinks";
import { GetMoreOwnQuotations } from "../fetchdata/get/getMoreOwnQuotations";

// Cache LRU (in-memory) per evitare richieste duplicate con stessi filtri.
// Manteniamo TTL breve per avere dati freschi senza perdere reattività lato UI.
const CACHE_TTL_MS = 60_000;
const CACHE_MAX = 50;
const ADVANCED_SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 50;
type QtsCacheEntry = { ts: number; data: QuotazioniListResponse };
type AdvancedSearchCacheEntry = { ts: number; data: QuotazioneDTO[] };
const qtsLru = new Map<string, QtsCacheEntry>();
const advancedSearchLru = new Map<string, AdvancedSearchCacheEntry>();


type InfinitePaginationState = {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    nextPage: number | null;
};


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

const mergeUniqueRows = (prev: QuotazioneDTO[], next: QuotazioneDTO[]) => {
    const map = new Map<string, QuotazioneDTO>();

    for (const row of prev) {
        if (row?._id) map.set(row._id, row);
    }

    for (const row of next) {
        if (row?._id) map.set(row._id, row);
    }

    return Array.from(map.values());
};


export function useQuotation() {
    const [userState] = useUserContext(); // per ottenere l'agenteId

    const [raw, setRaw] = useState<any[]>([]);
    const [inpagination, setInpagination] = useState<InfinitePaginationState>({
        total: 0,
        page: 0,
        limit: PAGE_SIZE,
        hasMore: true,
        nextPage: 1,
    });
    const [view, setView] = useState<'grid' | 'list'>('list'); // stato della visualizzazione: grid | list
    const [scope, setScope] = useState<Scope>('TUTTI');

    const [openTableRowSettings, setOpenTableRowSettings] = useState<{ indexRow: number; allData: any[] } | null>(null); // per mostrare/nascondere il pannello delle impostazioni delle righe della tabella
    const [openFilters, setOpenFilters] = useState<boolean>(false); // per mostrare/nascondere il pannello filtri
    const [openSearch, setOpenSearch] = useState<boolean>(false); // per mostrare/nascondere il pannello di ricerca
    const contextMenuRef = useRef<HTMLDivElement | null>(null); // per posizionare il context menu

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

    //const [loading, setLoading] = useState(false); // stato di caricamento
    const [loading, setLoading] = useState<{ [key: string]: boolean }>({
        general_data: false,
        get_quotation_ok_links: false,
        more_data: false,
    }); // stato di caricamento della ricerca

    const [advancedSearchQuery, setAdvancedSearchQuery] = useState<string>("");
    const [advancedSearchRows, setAdvancedSearchRows] = useState<QuotazioneDTO[]>([]);
    const [advancedSearchLoading, setAdvancedSearchLoading] = useState<boolean>(false);

    // per gestire l'apertura del pannello dei link "OK" (es. ordine, MEPA) associati alla quotazione
    const [openOkLinksPanel, setOpenOkLinksPanel] = useState(false);
    const [okLinks, setOkLinks] = useState<any[]>([]);
    // selezione della quotazione per cui mostrare i link "OK" nel pannello laterale (null = nessuna selezione, string = _id della quotazione selezionata)
    const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(null);

    const initialAbortRef = useRef<AbortController | null>(null);
    const moreAbortRef = useRef<AbortController | null>(null);
    const currentDatasetKeyRef = useRef<string>("");
    const loadMoreSeqRef = useRef(0);

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

    // Costruiamo i filtri API a partire dai controlli UI.
    // filterId resta stringa in UI, ma qui lo convertiamo a numero perché prog_num su BE è numerico.
    const parseOptionalNumber = (raw: string): number | null => {
        const normalized = String(raw ?? "").trim().replace(",", ".");
        if (!normalized) return null;
        const n = Number(normalized);
        return Number.isFinite(n) ? n : null;
    };

    const buildApiFilters = useCallback(() => {
        const parsedProgNum = Number(filterId);
        const parsedValoreMin = parseOptionalNumber(priceFrom);
        const parsedValoreMax = parseOptionalNumber(priceTo);
        const normalizedBuyerCode = String(filterBuyerCode ?? "").trim();
        const normalizedAgenteId = String(filterAgenteId ?? "").trim();

        return {
            ...(filterState && filterState !== "TUTTE" ? { stato: filterState as any } : {}),
            ...(filterType && filterType !== "TUTTE" ? { tipologia: filterType as any } : {}),
            ...(filterId && Number.isFinite(parsedProgNum) ? { prog_num: parsedProgNum } : {}),
            ...(dateFrom ? { dateFrom } : {}),
            ...(dateTo ? { dateTo } : {}),
            ...(parsedValoreMin !== null ? { valoreMin: parsedValoreMin } : {}),
            ...(parsedValoreMax !== null ? { valoreMax: parsedValoreMax } : {}),
            ...(normalizedBuyerCode ? { buyerCode: normalizedBuyerCode } : {}),
            ...(normalizedAgenteId ? { agenteId: normalizedAgenteId } : {}),
            // offset e limit per infinite scroll, non per fetch iniziale
            limit: PAGE_SIZE,
            sortBy: "created_at" as SortableField,
            order: "desc" as const,
        };
    }, [
        filterState,
        filterType,
        filterId,
        dateFrom,
        dateTo,
        priceFrom,
        priceTo,
        filterBuyerCode,
        filterAgenteId,
    ]);

    const runFetch = useCallback((
        overrideFilters?: GetOwnQtsFilters,
        options?: { force?: boolean; onComplete?: (res: QuotazioniListResponse) => void }
    ) => {
        const filters = overrideFilters ?? buildApiFilters();
        const datasetKey = buildFetchKey(filters);
        const force = Boolean(options?.force);

        if (!force) {
            const cached = getQtsLRU(datasetKey);
            if (cached) {
                setRaw(cached.data);
                setInpagination({
                    total: cached.pagination?.total ?? cached.data.length,
                    page: cached.pagination?.page ?? 0,
                    limit: cached.pagination?.limit ?? PAGE_SIZE,
                    hasMore: Boolean(cached.pagination?.hasMore),
                    nextPage: cached.pagination?.nextPage ?? null,
                });
                currentDatasetKeyRef.current = datasetKey;
                lastSentKeyRef.current = datasetKey;
                options?.onComplete?.(cached);
                return;
            }

            if (lastSentKeyRef.current === datasetKey && raw.length > 0) {
                return;
            }
        }

        initialAbortRef.current?.abort();
        initialAbortRef.current = new AbortController();
        lastSentKeyRef.current = datasetKey;
        currentDatasetKeyRef.current = datasetKey;

        setLoading((prev) => ({ ...prev, general_data: true }));
        setRaw([]);
        setInpagination({
            total: 0,
            page: 0,
            limit: PAGE_SIZE,
            hasMore: true,
            nextPage: 1,
        });

        getOwnQuotationsData({
            abortController: initialAbortRef.current,
            user: userState,
            filters: {
                ...filters,
                osf: 0,
            },
            HandleComplete: (res: QuotazioniListResponse) => {
                setRaw(Array.isArray(res.data) ? res.data : []);
                setInpagination({
                    total: res.pagination?.total ?? 0,
                    page: res.pagination?.page ?? 0,
                    limit: res.pagination?.limit ?? PAGE_SIZE,
                    hasMore: Boolean(res.pagination?.hasMore),
                    nextPage: res.pagination?.nextPage ?? null,
                });
                setQtsLRU(datasetKey, { ts: Date.now(), data: res });
                options?.onComplete?.(res);
            },
            HandleError: (msg: any) => enqueueSnackbar(msg ?? "Errore imprevisto", {
                title: 'Ops..',
                type: 'error',
            }),
            ChangeLoadStatus: ({ bool }) => {
                setLoading((prev) => ({ ...prev, general_data: Boolean(bool) }));
            },
        }).catch((e) => {
            if (e?.name !== "AbortError") {
                enqueueSnackbar("Errore nel recupero delle quotazioni.", {
                    title: 'Ops..',
                    type: 'error',
                });
                setLoading((prev) => ({ ...prev, general_data: false }));
            }
        });
    }, [buildApiFilters, buildFetchKey, raw.length, userState]);

    const fetchQuotationOkLinks = useCallback((quotationId: string) => {
        if (!quotationId) return;

        GetQuotationOkLinksAPI({
            abortController: new AbortController(),
            quotationId,
            ChangeLoadStatus: ({ bool }) =>
                setLoading((prev) => ({ ...prev, get_quotation_ok_links: Boolean(bool) })),
        }).then((res) => {
            if (res?.data) {
                setOkLinks(res.data);
            }
        });
    }, []);

    const infiniteScroll = useCallback(async () => {
        if (loading.general_data || loading.more_data) return false;
        if (!inpagination.hasMore || inpagination.nextPage === null) return false;

        const filters = buildApiFilters();
        const datasetKey = buildFetchKey(filters);

        // se nel frattempo i filtri sono cambiati, non appendere su un dataset vecchio
        if (datasetKey !== currentDatasetKeyRef.current) {
            return false;
        }

        const requestSeq = ++loadMoreSeqRef.current;

        moreAbortRef.current?.abort();
        moreAbortRef.current = new AbortController();

        setLoading((prev) => ({ ...prev, more_data: true }));

        try {
            const res = await GetMoreOwnQuotations({
                abortController: moreAbortRef,
                page: inpagination.nextPage,
                filters,
            });

            if (requestSeq !== loadMoreSeqRef.current) {
                return false;
            }

            const nextRows = Array.isArray(res?.data) ? res.data : [];
            const nextPagination = res?.pagination ?? {};

            setRaw((prev) => mergeUniqueRows(prev, nextRows));
            setInpagination((prev) => ({
                total: nextPagination.total ?? prev.total,
                page: nextPagination.page ?? prev.page,
                limit: nextPagination.limit ?? prev.limit,
                hasMore: Boolean(nextPagination.hasMore),
                nextPage: nextPagination.nextPage ?? null,
            }));

            return nextRows.length > 0;
        } catch (e: any) {
            if (e?.name !== "AbortError") {
                enqueueSnackbar(e?.message ?? "Errore durante il caricamento di altre quotazioni.", {
                    title: "Ops..",
                    type: "error",
                });
            }
            return false;
        } finally {
            setLoading((prev) => ({ ...prev, more_data: false }));
        }
    }, [
        loading.general_data,
        loading.more_data,
        inpagination,
        buildApiFilters,
        buildFetchKey,
    ]);


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

        openOkLinksPanel, setOpenOkLinksPanel,
        okLinks, setOkLinks,
        fetchQuotationOkLinks,

        selectedQuotationId, setSelectedQuotationId,

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
        inpagination, setInpagination, infiniteScroll, buildApiFilters,

        loading, setLoading,

        advancedSearchQuery,
        advancedSearchRows,
        advancedSearchLoading,
        setAdvancedSearchRows,
    };
}