import { enqueueSnackbar } from "components/MessageBox";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

import { getData } from "layouts/trackings/fetchdata";
import { SearchCustomersAPI } from "layouts/trackings/fetchdata/serchCustomers";
import {
    buildTrackingsUserChoose,
    mergeCustomerOptions,
    normalizeTrackingsSort,
    prioritizeSelectedCustomerOptions,
    toTrackingHref,
    TRACKINGS_INITIAL_LOAD_STATUS,
} from "../utils/helpers";
import type {
    ChangeLoadArgs,
    CustomerOption,
    HeaderSortPayload,
    TrackingsDateRange,
    TrackingsLoadStatus,
    TrackingsTableColumn,
    TrackingsUserContext,
    TrackingRow,
    UseTrackingsStateResult,
    UserChoose,
} from "layouts/trackings/types";

import { CopyToClipboard } from "../../../utils/string/copy";

type UseTrackingsStateArgs = {
    userContext?: TrackingsUserContext | null;
    initialCustomerCode?: string | null;
};

type AppliedTrackingsFilters = {
    clientFilterCodes: CustomerOption[];
    fbNumber: string;
    dateRange: TrackingsDateRange;
};

function buildInitialCustomerFilters(customerCode: string): CustomerOption[] {
    if (!customerCode) {
        return [];
    }

    return [
        {
            id: customerCode,
            codiceCliente: customerCode,
            ragioneSociale: customerCode,
        },
    ];
}

/**
 * Coordina tutto lo stato del layout trackings:
 * filtri, tabella virtualizzata, sort server-side, menu tracking e richieste async.
 */
export function useTrackingsState({
    userContext,
    initialCustomerCode,
}: UseTrackingsStateArgs): UseTrackingsStateResult {
    const normalizedInitialCustomerCode = String(initialCustomerCode || "").trim();

    /** Colonne correnti della tabella, comprese le colonne fisse reiniettate dal pannello tabella. */
    const [columns, setColumns] = useState<TrackingsTableColumn[]>([]);

    /** Righe correnti caricate dal backend trackings. */
    const [rows, setRows] = useState<TrackingRow[]>([]);

    /** Totale risultati disponibili lato backend per infinite scroll e footer tabella. */
    const [total, setTotal] = useState(0);

    /** Elenco clienti selezionati nel multi-select dei filtri (bozza non ancora applicata). */
    const [clientFilterCodes, setClientFilterCodesState] = useState<CustomerOption[]>(
        () => buildInitialCustomerFilters(normalizedInitialCustomerCode)
    );

    /** Numero FB digitato nel pannello filtri (bozza non ancora applicata). */
    const [fbNumber, setFbNumber] = useState("");

    /** Range date selezionato nel pannello filtri (bozza non ancora applicata). */
    const [dateRange, setDateRange] = useState<TrackingsDateRange>({});

    /** Stato sort corrente sincronizzato con l'header della tabella virtualizzata. */
    const [serverSort, setServerSort] = useState<HeaderSortPayload>({
        columnKey: "",
        sortDirection: 0,
    });

    /** Loader centralizzati del layout. */
    const [loadStatus, setLoadStatus] = useState<TrackingsLoadStatus>(
        TRACKINGS_INITIAL_LOAD_STATUS
    );

    /** Flag di apertura del context menu tracking per la riga selezionata. */
    const [isTrackingMenuOpen, setIsTrackingMenuOpen] = useState(false);

    /** URL tracking grezzo selezionato dalla riga corrente. */
    const [selectedTrackingUrl, setSelectedTrackingUrl] = useState("");

    /** Flag di apertura del context menu filtri. */
    const [isFiltersMenuOpen, setIsFiltersMenuOpen] = useState(false);

    /** Opzioni clienti aggregate e deduplicate mostrate nel select filtri. */
    const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>(
        () => buildInitialCustomerFilters(normalizedInitialCustomerCode)
    );

    /** Testo corrente digitato nel motore di ricerca clienti del filtro. */
    const [customerSearch, setCustomerSearch] = useState("");

    /** Loader dedicato alla ricerca asincrona dei clienti nel filtro. */
    const [customerLoading, setCustomerLoading] = useState(false);

    /** Stato base del payload trackings, tenuto in ref per non ricrearlo a ogni render. */
    const baseUserChooseRef = useRef<UserChoose>(
        normalizedInitialCustomerCode
            ? {
                ccd: [normalizedInitialCustomerCode],
                ccli: [{ codice: normalizedInitialCustomerCode }],
            }
            : {}
    );

    /** Ref del bottone che ancora il menu opzioni tracking della riga corrente. */
    const trackingMenuAnchorRef = useRef<HTMLButtonElement | null>(null);

    /** Ref del bottone che ancora il menu filtri del topbar. */
    const filtersMenuAnchorRef = useRef<HTMLButtonElement | null>(null);

    /** Offset usato per caricare pagine successive con infinite scroll. */
    const offsetRef = useRef(0);

    /** Abort controller condiviso tra le richieste tabella per cancellare richieste obsolete. */
    const abortController = useRef<AbortController | null>(null);

    /** Snapshot dei filtri applicati con l'ultimo click su "Cerca". */
    const appliedFiltersRef = useRef<AppliedTrackingsFilters>({
        clientFilterCodes: buildInitialCustomerFilters(normalizedInitialCustomerCode),
        fbNumber: "",
        dateRange: {},
    });

    /** URL tracking normalizzato usato da copia e apertura in una nuova tab. */
    const selectedTrackingHref = useMemo(
        () => toTrackingHref(selectedTrackingUrl),
        [selectedTrackingUrl]
    );

    /**
     * Aggiorna in modo centralizzato il singolo loader richiesto.
     */
    const changeLoadStatus = useCallback(({ from, bool }: ChangeLoadArgs) => {
        setLoadStatus((prev) => ({
            ...prev,
            [from]: bool !== undefined ? bool : !prev[from],
        }));
    }, []);

    /**
     * Adapter piu permissivo usato dai fetch legacy che espongono `from` come stringa libera.
     */
    const changeLegacyLoadStatus = useCallback(
        ({ from, bool }: { from: string; bool: boolean }) => {
            changeLoadStatus({
                from: from as ChangeLoadArgs["from"],
                bool,
            });
        },
        [changeLoadStatus]
    );

    /**
     * Annulla l'eventuale richiesta tabella ancora in corso.
     */
    const cancelRequest = useCallback(() => {
        if (abortController.current) {
            abortController.current.abort();
        }
    }, []);

    /**
     * Garantisce l'esistenza di un AbortController valido prima di effettuare una fetch.
     */
    const ensureAbortController = useCallback(() => {
        if (!abortController.current || abortController.current.signal.aborted) {
            abortController.current = new AbortController();
        }

        return abortController.current;
    }, []);

    /**
     * Costruisce il payload trackings completo applicando i filtri attivi allo stato base.
     */
    const buildUserChooseWithFilters = useCallback(
        (base?: UserChoose) =>
            buildTrackingsUserChoose({
                base: base ?? baseUserChooseRef.current,
                clientFilterCodes: appliedFiltersRef.current.clientFilterCodes,
                fbNumber: appliedFiltersRef.current.fbNumber,
                dateRange: appliedFiltersRef.current.dateRange,
            }),
        []
    );

    /**
     * Aggiorna i clienti selezionati e porta in cima le relative opzioni nel select.
     */
    const setClientFilterCodes = useCallback((values: CustomerOption[]) => {
        setClientFilterCodesState(values);
        setCustomerOptions((prev) => prioritizeSelectedCustomerOptions(prev, values));
    }, []);

    /**
     * Apre il menu filtri ancorandolo al bottone del topbar.
     */
    const openFiltersMenu = useCallback(() => {
        setIsFiltersMenuOpen(true);
    }, []);

    /**
     * Chiude il menu filtri mantenendo intatto il contenuto dei filtri correnti.
     */
    const closeFiltersMenu = useCallback(() => {
        setIsFiltersMenuOpen(false);
    }, []);

    /**
     * Ripristina i filtri trackings allo stato iniziale del layout.
     */
    const resetFilters = useCallback(() => {
        setCustomerSearch("");
        setFbNumber("");
        setDateRange({});
        setClientFilterCodesState([]);
    }, []);

    /**
     * Aggiorna il testo della ricerca clienti usato dal select virtualizzato dei filtri.
     */
    const handleCustomerSearchChange = useCallback((value: string) => {
        setCustomerSearch(value);
    }, []);

    /**
     * Apre il menu tracking della riga selezionata e memorizza il relativo URL.
     */
    const openTrackingMenu = useCallback(
        (event: ReactMouseEvent<HTMLButtonElement>, row: TrackingRow) => {
            event.stopPropagation();

            const rowUrl = String(row?.URL_TRACKING || "").trim();
            if (!rowUrl) {
                return;
            }

            trackingMenuAnchorRef.current = event.currentTarget;
            setSelectedTrackingUrl(rowUrl);
            setIsTrackingMenuOpen(true);
        },
        []
    );

    /**
     * Chiude il menu tracking e pulisce l'URL della riga selezionata.
     */
    const closeTrackingMenu = useCallback(() => {
        setIsTrackingMenuOpen(false);
        setSelectedTrackingUrl("");
    }, []);

    /**
     * Copia l'URL tracking selezionato negli appunti usando la utility centralizzata.
     */
    const copyTrackingUrl = useCallback(async () => {
        if (!selectedTrackingHref) {
            return;
        }

        const copied = await CopyToClipboard(selectedTrackingHref, {
            preserveSelection: true,
        });

        enqueueSnackbar(
            copied
                ? "URL tracking copiato negli appunti."
                : "Impossibile copiare l'URL tracking.",
            {
                title: copied ? "Successo" : "Ops..",
                type: copied ? "success" : "error",
            }
        );

        closeTrackingMenu();
    }, [closeTrackingMenu, selectedTrackingHref]);

    /**
     * Apre l'URL tracking selezionato in una nuova scheda sicura.
     */
    const openTrackingUrl = useCallback(() => {
        if (!selectedTrackingHref) {
            return;
        }

        window.open(selectedTrackingHref, "_blank", "noopener,noreferrer");
        closeTrackingMenu();
    }, [closeTrackingMenu, selectedTrackingHref]);

    /**
     * Richiede una pagina trackings al backend, con reset o append in base al contesto.
     */
    const fetchTrackingsPage = useCallback(
        async (opts: { reset: boolean; uc?: UserChoose; sort?: HeaderSortPayload, includeTotals?: boolean }) => {
            const nextUserChoose = buildUserChooseWithFilters(opts.uc);
            const nextSort = opts.sort ?? serverSort;
            const normalizedSort = normalizeTrackingsSort(nextSort);
            const requestBody: UserChoose = { ...nextUserChoose };

            if (normalizedSort.sortField && normalizedSort.sortDirection) {
                requestBody.sortField = normalizedSort.sortField;
                requestBody.sortDirection = normalizedSort.sortDirection;
            } else {
                delete requestBody.sortField;
                delete requestBody.sortDirection;
            }

            if (opts.reset) {
                offsetRef.current = 0;
            };

            if (opts.includeTotals){
                requestBody.includeTotals = true;
            }

            ensureAbortController();

            return getData({
                userContext: (userContext || {}) as Record<string, unknown>,
                abortController,
                body: requestBody,
                offset: offsetRef,
                setData: setRows,
                ChangeLoadStatus: changeLegacyLoadStatus,
                setTotal,
            });
        },
        [
            buildUserChooseWithFilters,
            changeLegacyLoadStatus,
            ensureAbortController,
            serverSort,
            userContext,
        ]
    );

    /**
     * Ricarica la prima pagina trackings azzerando risultati, offset e loader tabella.
     */
    const fetchFirstPage = useCallback(
        async (uc?: UserChoose, sort?: HeaderSortPayload) => {
            changeLoadStatus({ from: "table", bool: true });
            changeLoadStatus({ from: "search", bool: true });
            changeLoadStatus({ from: "infiniteScroll", bool: false });

            cancelRequest();
            ensureAbortController();

            offsetRef.current = 0;
            setRows([]);
            setTotal(0);

            try {
                await fetchTrackingsPage({ reset: true, uc, sort, includeTotals: true });
            } catch (error: any) {
                if (error?.name !== "AbortError") {
                    console.error(error);
                }
            } finally {
                changeLoadStatus({ from: "table", bool: false });
                changeLoadStatus({ from: "search", bool: false });
            }
        },
        [cancelRequest, changeLoadStatus, ensureAbortController, fetchTrackingsPage]
    );

    /**
     * Carica il blocco successivo di righe quando la tabella arriva in fondo.
     */
    const infiniteScroll = useCallback(() => {
        if (loadStatus.table || loadStatus.infiniteScroll) {
            return Promise.resolve(false);
        }

        if (total > 0 && rows.length >= total) {
            return Promise.resolve(false);
        }

        changeLoadStatus({ from: "infiniteScroll", bool: true });

        return fetchTrackingsPage({ reset: false })
            .then((result) => {
                changeLoadStatus({ from: "infiniteScroll", bool: false });
                return Boolean(result);
            })
            .catch((error: any) => {
                if (error?.name !== "AbortError") {
                    console.error(error);
                }

                changeLoadStatus({ from: "infiniteScroll", bool: false });
                return false;
            });
    }, [
        changeLoadStatus,
        fetchTrackingsPage,
        loadStatus.infiniteScroll,
        loadStatus.table,
        rows.length,
        total,
    ]);

    /**
     * Esegue la ricerca esplicita dell'utente usando i filtri correnti.
     */
    const handleSearch = useCallback(() => {
        appliedFiltersRef.current = {
            clientFilterCodes: [...clientFilterCodes],
            fbNumber: String(fbNumber || ""),
            dateRange: { ...dateRange },
        };

        fetchFirstPage(buildUserChooseWithFilters());
    }, [
        buildUserChooseWithFilters,
        clientFilterCodes,
        dateRange,
        fbNumber,
        fetchFirstPage,
    ]);

    /**
     * Sincronizza lo stato sort e forza il reload della prima pagina ordinata lato server.
     */
    const handleServerSortChange = useCallback(
        ({ columnKey, sortDirection }: HeaderSortPayload) => {
            setServerSort((prev) => {
                if (prev.columnKey === columnKey && prev.sortDirection === sortDirection) {
                    return prev;
                }

                return { columnKey, sortDirection };
            });

            fetchFirstPage(buildUserChooseWithFilters(), { columnKey, sortDirection });
        },
        [buildUserChooseWithFilters, fetchFirstPage]
    );

    /**
     * Ricerca clienti in modo debounced per alimentare il select del pannello filtri.
     */
    useEffect(() => {
        const query = customerSearch.trim();
        const customerAbortController = new AbortController();
        const timer = window.setTimeout(async () => {
            try {
                setCustomerLoading(true);

                const params = new URLSearchParams({
                    query,
                    context: "quotations",
                    limit: "20",
                });

                const items = await SearchCustomersAPI({
                    abortController: customerAbortController,
                    params: params.toString(),
                    ChangeLoadStatus: () => undefined,
                });

                if (!items) {
                    return;
                }

                setCustomerOptions((prev) => mergeCustomerOptions(prev, items));
            } catch (error: any) {
                if (error?.name !== "AbortError") {
                    console.error("Errore ricerca clienti:", error);
                }
            } finally {
                setCustomerLoading(false);
            }
        }, 300);

        return () => {
            window.clearTimeout(timer);
            customerAbortController.abort();
        };
    }, [customerSearch]);

    /**
     * Esegue il bootstrap iniziale del layout quando il contesto utente e disponibile.
     */
    useEffect(() => {
        if (userContext?.details === undefined || userContext?.details === null) {
            return undefined;
        }

        setLoadStatus(TRACKINGS_INITIAL_LOAD_STATUS);
        fetchFirstPage(baseUserChooseRef.current);

        return () => {
            cancelRequest();
        };
    }, [cancelRequest, fetchFirstPage, userContext?.details]);

    return {
        filters: {
            isOpen: isFiltersMenuOpen,
            anchorRef: filtersMenuAnchorRef,
            fbNumber,
            setFbNumber,
            dateRange,
            setDateRange,
            clientFilterCodes,
            setClientFilterCodes,
            customerOptions,
            customerLoading,
            onCustomerSearchChange: handleCustomerSearchChange,
            openMenu: openFiltersMenu,
            closeMenu: closeFiltersMenu,
            resetFilters,
        },
        table: {
            columns,
            setColumns,
            rows,
            setRows,
            total,
            loadStatus,
            serverSort,
            infiniteScroll,
            onSortChange: handleServerSortChange,
        },
        trackingMenu: {
            isOpen: isTrackingMenuOpen,
            anchorRef: trackingMenuAnchorRef,
            selectedTrackingUrl,
            selectedTrackingHref,
            openMenu: openTrackingMenu,
            closeMenu: closeTrackingMenu,
            copyUrl: copyTrackingUrl,
            openUrl: openTrackingUrl,
        },
        handleSearch,
    };
}
