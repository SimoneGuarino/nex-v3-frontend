/**
 * Layout principale della pagina Preventivi.
 *
 * Questo file orchestra:
 * - stato UI e filtri (draft + applied)
 * - lookup remoti cliente/agente
 * - fetch lista preventivi, infinite scroll e ordinamento
 * - apertura dettaglio preventivo e export CSV
 *
 * Le utility di parsing query e regole RBAC agente sono state estratte in hook
 * dedicati per mantenere questo container piu leggibile.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import { enqueueSnackbar } from "components/MessageBox";
import { useUserContext } from "context/UserContext";

import TopBar from "./components/TopBar";
import QuotesTable from "./components/QuotesTable";
import QuoteDetailsTable from "./components/QuoteDetailsTable";

import { getAgentsWithQuotes } from "./fetchData/getAgentsWithQuotes";
import { getCustomersWithQuotes } from "./fetchData/getCustomersWithQuotes";
import { getQuotesList } from "./fetchData/getQuotesList";
import { getQuoteDetails } from "./fetchData/getQuoteDetails";
import { exportQuotesCsv } from "./fetchData/exportQuotesCsv";
import { useAbortControllersCleanup } from "./hooks/useAbortControllersCleanup";
import { useRemoteLookupSelect } from "./hooks/useRemoteLookupSelect";
import { usePreventiviAgentScope, usePreventiviFiltersState, usePreventiviInitialQueryState } from "./hooks/usePreventiviFiltersState";

import type { QuoteDetailsResponse, QuoteHeader } from "./types";

const DEFAULT_PAGE_SIZE = 50;
const MIN_REMOTE_LOOKUP_QUERY_LENGTH = 2;

export default function Preventivi() {
    const [userContext] = useUserContext() as any;
    const location = useLocation();

    const initial = usePreventiviInitialQueryState(location.search);
    const stateCustomerCode = String((location.state as any)?.customerCode ?? "").trim();
    const { canSelectAgent, ownAgentCodes } = usePreventiviAgentScope(userContext);

    const [quotes, setQuotes] = useState<QuoteHeader[]>([]);
    const [details, setDetails] = useState<QuoteDetailsResponse | null>(null);
    const [totalQuotes, setTotalQuotes] = useState<number>(0);

    const [loadingQuotes, setLoadingQuotes] = useState<boolean>(false);
    const [loadingQuotesMore, setLoadingQuotesMore] = useState<boolean>(false);
    const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
    const [loadingExport, setLoadingExport] = useState<boolean>(false);

    const [selectedQuote, setSelectedQuote] = useState<{
        env: string;
        year: string;
        quoteNumber: string;
        customerCode?: string;
        customerName?: string;
        quoteDate?: string | number;
    } | null>(null);
    const [detailsOpen, setDetailsOpen] = useState<boolean>(false);

    const sortFieldByColumn = useMemo<Record<string, string>>(
        () => ({
            AMBIENTE: "ambiente",
            TCDCL: "codiceCliente",
            WRAGS: "ragioneSociale",
            TANNO: "year",
            TNRPR: "quoteNumber",
            TDTPR: "date",
            TCDMA: "warehouse",
            TSTAT: "state",
        }),
        []
    );

    const quotesAbortRef = useRef<AbortController | null>(null);
    const detailsAbortRef = useRef<AbortController | null>(null);
    const exportAbortRef = useRef<AbortController | null>(null);

    const {
        env,
        setEnv,
        agentSearch,
        setAgentSearch,
        agentCodes,
        setAgentCodes,
        customerSearch,
        setCustomerSearch,
        customerCode,
        setCustomerCode,
        year,
        setYear,
        warehouse,
        setWarehouse,
        quoteNumber,
        setQuoteNumber,
        appliedFilters,
        pageQuotes,
        setPageQuotes,
        sort,
        setSort,
        sortState,
        setSortState,
        handleApplyQuotesFilters,
        handleResetQuotesFilters,
    } = usePreventiviFiltersState({
        initial,
        stateCustomerCode,
        canSelectAgent,
        ownAgentCodes,
    });

    /**
     * Mappa il record agente backend in opzione select.
     * `TCDAG`/`DSCAG` sono i campi restituiti dalle route `customers/quotes/agents`.
     */
    const mapAgentRowToOption = useCallback((row: any) => {
        const code = String(row?.TCDAG ?? "").trim().toUpperCase();
        const description = String(row?.DSCAG ?? "").trim();
        if (!code) return null;
        return {
            value: code,
            label: description ? `${code} - ${description}` : code,
        };
    }, []);

    /**
     * Mappa il record cliente backend in opzione select,
     * con fallback sui possibili alias usati nei vari endpoint.
     */
    const mapCustomerRowToOption = useCallback((row: any) => {
        const code = String(row?.WCDCL ?? row?.codiceCliente ?? row?.customerCode ?? "").trim();
        const ragSoc = String(row?.WRAGS ?? row?.ragioneSociale ?? row?.customerName ?? "").trim();
        const pIva = String(row?.WPIVA ?? row?.partitaIVA ?? "").trim();
        const codFisc = String(row?.WCFIS ?? row?.codiceFiscale ?? "").trim();
        if (!code) return null;
        return {
            value: code,
            label: ragSoc ? `${ragSoc} (${code}) (${pIva}) (${codFisc})` : code,
        };
    }, []);

    const {
        options: agentOptions,
        setSelectedOption: setSelectedAgentOption,
    } = useRemoteLookupSelect({
        userContext,
        env,
        // Se l'utente e commerciale, la select agente non e editabile e disabilitiamo il lookup remoto.
        search: canSelectAgent ? agentSearch : "",
        code: canSelectAgent ? agentCodes[0] ?? "" : "",
        minQueryLength: MIN_REMOTE_LOOKUP_QUERY_LENGTH,
        fetcher: getAgentsWithQuotes,
        mapRowToOption: mapAgentRowToOption,
        matchesCode: (row, code) => String((row as any)?.TCDAG ?? "").trim().toUpperCase() === code,
        normalizeCode: (value) => value.trim().toUpperCase(),
    });

    const {
        options: customerOptions,
        setSelectedOption: setSelectedCustomerOption,
    } = useRemoteLookupSelect({
        userContext,
        env,
        search: customerSearch,
        code: customerCode,
        minQueryLength: MIN_REMOTE_LOOKUP_QUERY_LENGTH,
        fetcher: getCustomersWithQuotes,
        mapRowToOption: mapCustomerRowToOption,
        matchesCode: (row, code) =>
            String((row as any)?.WCDCL ?? (row as any)?.codiceCliente ?? (row as any)?.customerCode ?? "").trim() === code,
    });

    /**
     * Mantiene sempre visibili i codici agente selezionati nella multiselect,
     * anche quando la lookup remota non ritorna risultati (es. query troppo corta).
     */
    const agentOptionsForFilters = useMemo(() => {
        const map = new Map<string, { value: string; label: string }>();
        agentOptions.forEach((opt) => {
            const value = String(opt?.value ?? "").trim().toUpperCase();
            if (!value) return;
            map.set(value, { value, label: String(opt.label ?? value).trim() || value });
        });

        agentCodes.forEach((code) => {
            const value = String(code ?? "").trim().toUpperCase();
            if (!value || map.has(value)) return;
            map.set(value, { value, label: value });
        });

        return Array.from(map.values());
    }, [agentCodes, agentOptions]);

    /**
     * Fetch lista preventivi con lo stesso perimetro dei filtri backend (`parseQuoteListFilters`):
     * usa sempre `appliedFilters` e supporta append per infinite scroll.
     */
    const handleSearchQuotes = useCallback(
        async (nextPage?: number, sortOverride?: string, append = false) => {
            if (!userContext?.token) return;

            const targetPage = typeof nextPage === "number" ? nextPage : pageQuotes;
            const targetSort = typeof sortOverride === "string" ? sortOverride : sort;

            if (append) {
                setLoadingQuotesMore(true);
            } else {
                setLoadingQuotes(true);
                setDetails(null);
                setSelectedQuote(null);
                setDetailsOpen(false);
            }

            try {
                quotesAbortRef.current?.abort();
                quotesAbortRef.current = new AbortController();

                const res = await getQuotesList({
                    userContext,
                    abortController: quotesAbortRef.current,
                    page: targetPage,
                    pageSize: DEFAULT_PAGE_SIZE,
                    env: appliedFilters.env || undefined,
                    agentCodes: appliedFilters.agentCodes.length > 0 ? appliedFilters.agentCodes : undefined,
                    customerCode: appliedFilters.customerCode || undefined,
                    year: appliedFilters.year || undefined,
                    warehouse: appliedFilters.warehouse || undefined,
                    quoteNumber: appliedFilters.quoteNumber || undefined,
                    sort: targetSort || undefined,
                });

                const nextItems = Array.isArray(res?.items) ? res.items : [];
                const normalizedItems = nextItems.map((row) => {
                    const status = String(row?.TSTAT ?? "").trim();
                    // Coerenza con backend exportCSV: stato "*" visualizzato come "Convertito in OC".
                    return {
                        ...row,
                        TSTAT: status === "*" ? "Convertito in OC" : "",
                    };
                });

                setQuotes(append ? (prev) => [...prev, ...normalizedItems] : normalizedItems);
                setTotalQuotes(Number(res?.total ?? 0));
                setPageQuotes(targetPage);

                // Se i record correnti includono agente/cliente selezionati, riallineiamo la label della select.
                if (appliedFilters.agentCodes.length > 0) {
                    const selectedCodesSet = new Set(appliedFilters.agentCodes.map((code) => String(code).trim().toUpperCase()));
                    const firstAgentRow = Array.isArray(res?.items)
                        ? res.items.find((row) => selectedCodesSet.has(String(row?.TCDAG ?? "").trim().toUpperCase()))
                        : null;

                    if (firstAgentRow) {
                        const option = mapAgentRowToOption(firstAgentRow);
                        if (option) setSelectedAgentOption(option);
                    }
                }

                if (appliedFilters.customerCode.trim()) {
                    const firstCustomerRow = Array.isArray(res?.items)
                        ? res.items.find((row) => String(row?.TCDCL ?? "").trim() === appliedFilters.customerCode.trim())
                        : null;

                    if (firstCustomerRow) {
                        const code = String(firstCustomerRow.TCDCL ?? "").trim();
                        const ragSoc = String(firstCustomerRow.WRAGS ?? "").trim();
                        if (code) {
                            setSelectedCustomerOption({
                                value: code,
                                label: ragSoc ? `${ragSoc} (${code})` : code,
                            });
                        }
                    }
                }
            } catch (error: any) {
                if (error?.name !== "AbortError") {
                    enqueueSnackbar(
                        error?.msg || error?.message || "Errore durante il recupero lista preventivi.",
                        { title: "Ops..", type: "error" }
                    );
                }
            } finally {
                setLoadingQuotes(false);
                setLoadingQuotesMore(false);
            }
        },
        [
            appliedFilters,
            mapAgentRowToOption,
            pageQuotes,
            setPageQuotes,
            setSelectedAgentOption,
            setSelectedCustomerOption,
            sort,
            userContext,
        ]
    );

    /**
     * Carica la pagina successiva per infinite scroll, interrompendo quando tutti i record sono stati caricati.
     */
    const loadMoreQuotes = useCallback(async () => {
        if (!userContext?.token) return false;
        if (loadingQuotes || loadingQuotesMore) return false;
        if (totalQuotes > 0 && quotes.length >= totalQuotes) return false;

        const nextPage = pageQuotes + 1;
        await handleSearchQuotes(nextPage, undefined, true);
        return true;
    }, [userContext, loadingQuotes, loadingQuotesMore, totalQuotes, quotes.length, pageQuotes, handleSearchQuotes]);

    /**
     * Apre (o toggla) il drawer dettaglio preventivo e recupera le righe del documento selezionato.
     */
    const handleOpenDetails = useCallback(
        async (quote: QuoteHeader) => {
            if (!userContext?.token) return;

            const envValue = String(quote.AMBIENTE ?? "").trim();
            const yearValue = String(quote.TANNO ?? "").trim();
            const numberValue = String(quote.TNRPR ?? "").trim();

            if (!envValue || !yearValue || !numberValue) {
                enqueueSnackbar("Dati preventivo non validi per aprire il dettaglio.", {
                    title: "Attenzione",
                    type: "warning",
                });
                return;
            }

            const isSameQuoteSelected =
                selectedQuote?.env === envValue &&
                selectedQuote?.year === yearValue &&
                selectedQuote?.quoteNumber === numberValue;

            if (isSameQuoteSelected && details) {
                setDetailsOpen((prev) => !prev);
                return;
            }

            setSelectedQuote({
                env: envValue,
                year: yearValue,
                quoteNumber: numberValue,
                customerCode: String(quote.TCDCL ?? "").trim(),
                customerName: String(quote.WRAGS ?? "").trim(),
                quoteDate: quote.TDTPR,
            });
            setDetailsOpen(true);
            setLoadingDetails(true);

            try {
                detailsAbortRef.current?.abort();
                detailsAbortRef.current = new AbortController();

                const res = await getQuoteDetails({
                    userContext,
                    abortController: detailsAbortRef.current,
                    env: envValue,
                    year: yearValue,
                    quoteNumber: numberValue,
                });

                setDetails(res ?? null);
            } catch (error: any) {
                if (error?.name !== "AbortError") {
                    enqueueSnackbar(
                        error?.msg || error?.message || "Errore durante il recupero dettaglio preventivo.",
                        { title: "Ops..", type: "error" }
                    );
                }
            } finally {
                setLoadingDetails(false);
            }
        },
        [details, selectedQuote, userContext]
    );

    /**
     * Reset completo della pagina: filtri, lookup, lista e pannello dettaglio.
     */
    const handleResetAll = useCallback(() => {
        handleResetQuotesFilters();
        setQuotes([]);
        setTotalQuotes(0);
        setDetails(null);
        setDetailsOpen(false);
        setSelectedQuote(null);
        setSelectedAgentOption(null);
        setSelectedCustomerOption(null);
    }, [handleResetQuotesFilters, setSelectedAgentOption, setSelectedCustomerOption]);

    /**
     * Avvia export CSV con gli stessi `appliedFilters` della tabella.
     * Il backend usa `ignorePaging=true`, quindi esporta tutto il dataset filtrato.
     */
    const handleExportCsv = useCallback(() => {
        void exportQuotesCsv({
            userContext,
            abortController: exportAbortRef,
            body: {
                env: appliedFilters.env || undefined,
                agentCodes: appliedFilters.agentCodes.length > 0 ? appliedFilters.agentCodes : undefined,
                customerCode: appliedFilters.customerCode || undefined,
                year: appliedFilters.year || undefined,
                warehouse: appliedFilters.warehouse || undefined,
                quoteNumber: appliedFilters.quoteNumber || undefined,
                sort: sort || undefined,
            },
            setLoading: setLoadingExport,
        });
    }, [appliedFilters, sort, userContext]);

    /**
     * Traduce il sort della tabella FE nel token sort accettato dal backend (`campo:asc|desc`).
     */
    const handleSortChange = useCallback(
        (payload: { columnKey: string; sortDirection: number }) => {
            const field = sortFieldByColumn[String(payload.columnKey || "").trim()];
            if (!field || payload.sortDirection === 0) {
                setSortState(payload);
                setSort("");
                return;
            }

            const direction = payload.sortDirection === 1 ? "asc" : "desc";
            setSortState(payload);
            setSort(`${field}:${direction}`);
        },
        [sortFieldByColumn, setSort, setSortState]
    );

    useEffect(() => {
        // Refetch solo su filtri applicati e ordinamento: evita reset indesiderati durante append infinite scroll.
        void handleSearchQuotes(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appliedFilters, sort]);

    useAbortControllersCleanup(quotesAbortRef, detailsAbortRef, exportAbortRef);

    return (
        <DashboardLayout>
            <div className="w-full h-full flex flex-col gap-4 p-2">
                <TopBar
                    canSelectAgent={canSelectAgent}
                    env={env}
                    onChangeEnv={setEnv}
                    agentCodes={agentCodes}
                    onChangeAgentCodes={setAgentCodes}
                    agentOptions={canSelectAgent ? agentOptionsForFilters : []}
                    onChangeAgentSearch={setAgentSearch}
                    customerCode={customerCode}
                    onChangeCustomerCode={setCustomerCode}
                    customerOptions={customerOptions}
                    onChangeCustomerSearch={setCustomerSearch}
                    year={year}
                    onChangeYear={setYear}
                    warehouse={warehouse}
                    onChangeWarehouse={setWarehouse}
                    quoteNumber={quoteNumber}
                    onChangeQuoteNumber={setQuoteNumber}
                    onSearchQuotes={handleApplyQuotesFilters}
                    onResetQuotesFilters={handleResetAll}
                    onExportCsv={handleExportCsv}
                    loadingExport={loadingExport}
                />

                <QuotesTable
                    items={quotes}
                    total={totalQuotes}
                    setItems={setQuotes}
                    onLoadMore={loadMoreQuotes}
                    loadingMore={loadingQuotesMore}
                    onOpenDetails={handleOpenDetails}
                    loading={loadingQuotes}
                    sortState={sortState}
                    onSortChange={handleSortChange}
                />
            </div>

            {detailsOpen && selectedQuote && (
                <div className="fixed inset-0 z-[1200] pointer-events-none">
                    <div
                        className="absolute inset-0 bg-black/20 pointer-events-auto"
                        onClick={() => setDetailsOpen(false)}
                    />
                    <div className="absolute right-3 top-3 bottom-3 w-[min(760px,95vw)] pointer-events-auto">
                        <QuoteDetailsTable
                            selected={selectedQuote}
                            data={details}
                            loading={loadingDetails}
                            onClose={() => setDetailsOpen(false)}
                        />
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
