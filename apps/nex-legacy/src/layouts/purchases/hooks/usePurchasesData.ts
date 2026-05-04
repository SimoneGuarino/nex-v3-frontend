import { useCallback, useEffect, useRef, useState } from "react";
import { enqueueSnackbar } from "components/MessageBox";
import { exportPurchases } from "../fetchData/exportPurchases";
import { getPurchasesFilters } from "../fetchData/getPurchasesFilters";
import { getPurchasesList } from "../fetchData/getPurchasesList";
import { getPurchasesSummary } from "../fetchData/getPurchasesSummary";
import { searchPurchaseCustomers } from "../fetchData/searchPurchaseCustomers";
import type {
    PurchaseRow,
    PurchasesFiltersResponse,
    PurchasesQuery,
    PurchasesSummaryResponse,
} from "../types";

/**
 * Numero di righe richieste per pagina quando carichiamo la lista acquisti.
 */
const PAGE_SIZE = 50;

/**
 * Valore iniziale vuoto per tutte le opzioni dei filtri.
 */
const EMPTY_FILTER_OPTIONS: PurchasesFiltersResponse = {
    brands: [],
    lines: [],
    groups: [],
    families: [],
    agents: [],
    customers: [],
};

/**
 * Valore iniziale vuoto per i KPI di testata.
 */
const EMPTY_SUMMARY: PurchasesSummaryResponse = {
    totalRows: 0,
    totalQty: 0,
    totalValue: 0,
    generatedAt: null,
    partial: false,
};

/**
 * Converte la rubrica agenti globale in opzioni `{ value, label }` per la select.
 * Viene usata come fallback quando l'endpoint acquisti non restituisce agenti.
 */
function mapGlobalAgentsToSelectOptions(globalAgents: any): PurchasesFiltersResponse["agents"] {
    if (!Array.isArray(globalAgents)) return [];

    return globalAgents
        .map((agent: any) => {
            const code = String(agent?.codici?.agente ?? "").trim();
            const nome = String(agent?.nome ?? "").trim();
            const cognome = String(agent?.cognome ?? "").trim();
            if (!code) return null;

            const fullName = [nome, cognome].filter(Boolean).join(" ").trim();
            return {
                value: code,
                label: fullName ? `${code} - ${fullName}` : code,
            };
        })
        .filter(Boolean) as PurchasesFiltersResponse["agents"];
}

/**
 * Hook dati della pagina acquisti.
 *
 * Responsabilità:
 * - chiamate rete (lista, summary, lookup filtri, ricerca clienti, export);
 * - stato di loading/paginazione/risultati;
 * - debounce e gestione abort delle chiamate concorrenti;
 * - cleanup completo al dismount.
 */
export function usePurchasesData(args: {
    userContext: any;
    globalAgents: any;
    appliedQuery: PurchasesQuery;
}) {
    const { userContext, globalAgents, appliedQuery } = args;

    const [items, setItems] = useState<PurchaseRow[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [summary, setSummary] = useState<PurchasesSummaryResponse>(EMPTY_SUMMARY);
    const [filterOptions, setFilterOptions] = useState<PurchasesFiltersResponse>(EMPTY_FILTER_OPTIONS);

    const [loadingList, setLoadingList] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loadingFilters, setLoadingFilters] = useState(false);
    const [loadingCustomerSearch, setLoadingCustomerSearch] = useState(false);
    const [loadingExport, setLoadingExport] = useState(false);
    const [loadingSummary, setLoadingSummary] = useState(false);

    const [customerSearchText, setCustomerSearchText] = useState("");

    const listAbortRef = useRef<AbortController | null>(null);
    const filtersAbortRef = useRef<AbortController | null>(null);
    const summaryAbortRef = useRef<AbortController | null>(null);
    const customerSearchAbortRef = useRef<AbortController | null>(null);
    const customerSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const exportAbortRef = useRef<AbortController | null>(null);
    const lastFiltersScopeKeyRef = useRef("");
    const inFlightFiltersScopeKeyRef = useRef<string | null>(null);

    /**
     * Chiave di "scope lookup" per deduplicare le chiamate ai filtri.
     *
     * Perché NON includiamo brand/line/group/family/sort:
     * - la cascata prodotto viene gestita lato FE dalla tassonomia ricevuta;
     * - includere quei campi porterebbe a nuove chiamate a ogni modifica bozza,
     *   ricreando lo spam che vogliamo eliminare;
     * - il sort non modifica il dominio dei lookup.
     */
    const buildFiltersScopeKey = useCallback((query: PurchasesQuery) => {
        return JSON.stringify({
            env: query.env,
            dateFrom: query.dateFrom,
            dateTo: query.dateTo,
            customerCodes: [...query.customerCodes].sort(),
            agentCodes: [...query.agentCodes].sort(),
        });
    }, []);

    /**
     * Carica la lista acquisti per la pagina richiesta.
     * Se `append` è true concatena i risultati (infinite scroll), altrimenti sostituisce.
     */
    const loadList = useCallback(
        async (targetPage: number, append = false) => {
            if (!userContext?.token) return false;

            if (append) {
                setLoadingMore(true);
            } else {
                setLoadingList(true);
            }

            try {
                listAbortRef.current?.abort();
                const controller = new AbortController();
                listAbortRef.current = controller;

                const res = await getPurchasesList({
                    userContext,
                    abortController: controller,
                    page: targetPage,
                    pageSize: PAGE_SIZE,
                    query: appliedQuery,
                });

                setItems((prev) => (append ? [...prev, ...res.items] : res.items));
                setTotal(res.total);
                setPage(res.page);
                return true;
            } catch (error: any) {
                if (error?.name !== "AbortError") {
                    enqueueSnackbar(error?.msg || error?.message || "Errore durante il recupero dati acquistato clienti.", {
                        title: "Ops..",
                        type: "error",
                    });
                }
                return false;
            } finally {
                setLoadingList(false);
                setLoadingMore(false);
            }
        },
        [appliedQuery, userContext]
    );

    /**
     * Carica i KPI di testata usando gli stessi filtri della tabella.
     */
    const loadSummary = useCallback(async () => {
        if (!userContext?.token) return;

        setLoadingSummary(true);
        try {
            summaryAbortRef.current?.abort();
            const controller = new AbortController();
            summaryAbortRef.current = controller;

            const nextSummary = await getPurchasesSummary({
                abortController: controller,
                query: appliedQuery,
            });
            setSummary(nextSummary);
        } catch (error: any) {
            if (error?.name !== "AbortError") {
                enqueueSnackbar(error?.msg || error?.message || "Errore durante il calcolo KPI acquisti.", {
                    title: "Ops..",
                    type: "error",
                });
            }
            setSummary(EMPTY_SUMMARY);
        } finally {
            setLoadingSummary(false);
        }
    }, [appliedQuery, userContext?.token]);

    /**
     * Ricarica le opzioni dei filtri in base alla query passata (tipicamente `draftQuery`).
     */
    const refreshFilters = useCallback(
        async (queryForLookups: PurchasesQuery, refreshOptions?: { force?: boolean }) => {
            if (!userContext?.token) return;
            const scopeKey = buildFiltersScopeKey(queryForLookups);
            const force = Boolean(refreshOptions?.force);

            /**
             * DEDUPLICA CHIAMATE LOOKUP:
             * se lo scope è identico all'ultimo già caricato e non siamo in "force",
             * non richiamiamo l'endpoint.
             *
             * Effetto pratico:
             * - click ripetuti su "Filtri" non generano rete inutile;
             * - sort e modifiche puramente locali della bozza non generano richieste.
             */
            if (!force && scopeKey === lastFiltersScopeKeyRef.current) return;

            /**
             * Deduplica richieste concorrenti con stesso scope:
             * se una fetch lookup per questa stessa chiave è già in corso,
             * NON ne avviamo un'altra (evita abort/restart su click ripetuti).
             */
            if (inFlightFiltersScopeKeyRef.current === scopeKey) return;

            setLoadingFilters(true);
            try {
                filtersAbortRef.current?.abort();
                const controller = new AbortController();
                filtersAbortRef.current = controller;
                inFlightFiltersScopeKeyRef.current = scopeKey;

                const nextOptions = await getPurchasesFilters({
                    abortController: controller,
                    query: queryForLookups,
                });

                const fallbackAgents = mapGlobalAgentsToSelectOptions(globalAgents);
                setFilterOptions({
                    ...nextOptions,
                    agents: nextOptions.agents.length > 0 ? nextOptions.agents : fallbackAgents,
                });
                lastFiltersScopeKeyRef.current = scopeKey;
            } catch (error: any) {
                if (error?.name !== "AbortError") {
                    enqueueSnackbar(error?.msg || error?.message || "Errore durante il caricamento filtri acquisti.", {
                        title: "Ops..",
                        type: "error",
                    });
                }
            } finally {
                /**
                 * Spegniamo il loading solo se questa è ancora la richiesta "attiva":
                 * evita flicker/stati incoerenti quando una richiesta precedente abortita
                 * termina dopo che ne è partita una nuova con scope diverso.
                 */
                if (inFlightFiltersScopeKeyRef.current === scopeKey) {
                    inFlightFiltersScopeKeyRef.current = null;
                    setLoadingFilters(false);
                }
            }
        },
        [buildFiltersScopeKey, globalAgents, userContext?.token]
    );

    /**
     * Carica la pagina successiva se disponibile.
     * Evita chiamate inutili quando è gia in corso un caricamento o non ci sono piu righe.
     */
    const loadMore = useCallback(async () => {
        if (loadingList || loadingMore) return false;
        if (total > 0 && items.length >= total) return false;
        return loadList(page + 1, true);
    }, [items.length, loadList, loadingList, loadingMore, page, total]);

    /**
     * Azzera risultati e KPI locali.
     * Usata tipicamente durante il reset filtri della pagina.
     */
    const clearResults = useCallback(() => {
        setItems([]);
        setTotal(0);
        setPage(1);
        setSummary(EMPTY_SUMMARY);
    }, []);

    /**
     * Esegue l'export CSV lato backend con i filtri correnti.
     * Restituisce `true/false` per consentire eventuale gestione futura nel chiamante.
     */
    const exportCurrentResult = useCallback(async () => {
        try {
            return await exportPurchases({
                abortController: exportAbortRef,
                query: appliedQuery,
                setLoading: setLoadingExport,
            });
        } catch {
            return false;
        }
    }, [appliedQuery]);

    /**
     * Ricarica lista e summary quando cambia la query applicata.
     */
    useEffect(() => {
        void loadList(1, false);
        void loadSummary();
    }, [appliedQuery, loadList, loadSummary]);

    /**
     * Esegue la ricerca cliente remota con debounce.
     * Manteniamo solo termini >= 3 caratteri per evitare richieste rumorose.
     */
    useEffect(() => {
        const q = customerSearchText.trim();
        if (q.length < 3) {
            customerSearchAbortRef.current?.abort();
            setLoadingCustomerSearch(false);
            return;
        }

        if (customerSearchTimerRef.current) clearTimeout(customerSearchTimerRef.current);

        customerSearchTimerRef.current = setTimeout(() => {
            customerSearchAbortRef.current?.abort();
            const controller = new AbortController();
            customerSearchAbortRef.current = controller;
            setLoadingCustomerSearch(true);

            void searchPurchaseCustomers({
                abortController: controller,
                query: q,
                limit: 20,
            })
                .then((customers) => {
                    setFilterOptions((prev) => {
                        const map = new Map<string, { value: string; label: string }>();

                        // Merge deduplicato tra opzioni gia presenti e nuovi risultati di ricerca.
                        [...prev.customers, ...customers].forEach((option) => {
                            const key = String(option.value ?? "").trim();
                            if (!key || map.has(key)) return;
                            const label = String(option.label ?? "").trim() || key;
                            map.set(key, { value: key, label });
                        });

                        return {
                            ...prev,
                            customers: Array.from(map.values()),
                        };
                    });
                })
                .catch((error: any) => {
                    if (error?.name !== "AbortError") {
                        enqueueSnackbar(error?.msg || error?.message || "Errore durante la ricerca clienti.", {
                            title: "Ops..",
                            type: "error",
                        });
                    }
                })
                .finally(() => {
                    setLoadingCustomerSearch(false);
                });
        }, 300);

        return () => {
            if (customerSearchTimerRef.current) clearTimeout(customerSearchTimerRef.current);
        };
    }, [customerSearchText]);

    /**
     * Cleanup unico al dismount: annulla tutte le richieste in corso e i timer pendenti.
     */
    useEffect(() => {
        return () => {
            listAbortRef.current?.abort();
            filtersAbortRef.current?.abort();
            summaryAbortRef.current?.abort();
            customerSearchAbortRef.current?.abort();
            if (customerSearchTimerRef.current) clearTimeout(customerSearchTimerRef.current);
            exportAbortRef.current?.abort();
        };
    }, []);

    return {
        items,
        setItems,
        total,
        summary,
        filterOptions,
        loadingList,
        loadingMore,
        loadingFilters,
        loadingCustomerSearch,
        loadingExport,
        loadingSummary,
        setCustomerSearchText,
        loadMore,
        refreshFilters,
        clearResults,
        exportCurrentResult,
    };
}
