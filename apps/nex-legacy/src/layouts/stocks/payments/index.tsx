// src/layouts/stocks/payments/index.tsx
import React, {
    useContext,
    useEffect,
    useState,
    useRef,
    useCallback,
    MutableRefObject,
    useMemo,
} from "react";

import { getUserSocket } from '@nex/realtime-core';
const socket = getUserSocket();

import { UserContext } from "../../../context/UserContext";

import { Tooltip } from "react-tooltip";

// components
import Loader from "../../../Loader";
import FDBox from "components/UI/box/FDBox";

// fetch data
import { FiltersDataAPI } from "./fetchData/filtersData";
import { DataRetriveAPI, type PaymentRow } from "./fetchData/data";

// layout
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";

// icons
import { MdFilterList } from "react-icons/md";
import { IoSearch } from "react-icons/io5";

// altri componenti
import { TableVirtualized } from "components/Virtualized/table";

/* Context menu + pannello filtri */
import { ContextMenu } from "components/UI/menu/ContextMenu";
import { FiltersPanel, type Customer } from "./filters/index";
import type { UserChoose } from "./types";

// tour
import { useSectionTour } from "tour/useSectionTour";
import { Role } from "tour/types";
import FDButton from "components/UI/buttons/FDButton";
import { enqueueSnackbar } from "components/MessageBox";


/* =======================
   Tipi locali e utility
   ======================= */

type LoadStatus = {
    table: boolean;
    filters: boolean;
    search: boolean;
    infiniteScroll: boolean;
};

type ChangeLoadArgs = { from: keyof LoadStatus; bool?: boolean };

/** Riga tabella pagamenti (1 riga per NUMOV) */
// PaymentRow è importato da ./fetchData/data

type ColumnConfig = {
    key: keyof PaymentRow | string;
    label: string;
    sort?: boolean;
    sortType?: "Number" | "String" | "Date" | string;
    type?: "default" | "euro" | string;
    width?: number;
    labelsx?: Record<string, unknown>;
};

type UserContextMinimal = {
    details:
    | undefined
    | null
    | {
        _id?: string;
        ruolo?: string | number;
        codici?: { agente?: string | null };
        permissions?: unknown;
    };
    token?: string;
};

type AbortRef = MutableRefObject<AbortController | null>;

type PaymentsApiResponse = {
    offset: number;
    limit: number;
    total: number;
    items: PaymentRow[];
};

function toDdMmYyyyCompact(v: any): string | undefined {
    if (v == null) return undefined;
    const s = String(v).trim();
    if (!s) return undefined;

    // già ddmmyyyy
    if (/^\d{8}$/.test(s)) return s;

    // dd/MM/yyyy -> ddmmyyyy
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s.split("/").join("");

    return undefined;
}

function normalizeCodeLoose(v: any): string | undefined {
    if (v == null) return undefined;
    const s = String(v).trim();
    if (!s) return undefined;
    return s;
}

function buildQuery(params: Record<string, string | number | undefined | null>): string {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null) continue;
        const s = String(v).trim();
        if (!s) continue;
        qs.set(k, s);
    }
    const out = qs.toString();
    return out ? `?${out}` : "";
}

/* =======================
   Componente
   ======================= */

function Payments() {
    // hooks utente / contesto
    const [userContext] = useContext(UserContext) as [
        UserContextMinimal,
        React.Dispatch<React.SetStateAction<UserContextMinimal>>
    ];

    // load status
    const [loadStatus, setLoadStatus] = useState<LoadStatus>({
        table: true,
        filters: true,
        search: true,
        infiniteScroll: false,
    });

    const ChangeLoadStatus = useCallback(({ from, bool }: ChangeLoadArgs) => {
        setLoadStatus((prev) => ({
            ...prev,
            [from]: bool !== undefined ? bool : !prev[from],
        }));
    }, []);

    // tour
    type CloseReason = "clickAway" | "escapeKeyDown" | "backdropClick" | "itemClick";
    const shouldIgnoreClose = (reason?: CloseReason) => {
        if (!tour.isOpen) return false;
        return reason === "backdropClick" || reason === "clickAway" || reason === "escapeKeyDown";
    };

    const tour = useSectionTour({
        id: "nex_v2_payments",
        version: "2.0.0",
        user: {
            id: userContext?.details?._id ?? "",
            role: (userContext?.details?.ruolo as Role) ?? "Tester",
        },
        keys: "payments",
        actions: {
            1: () => {
                setFilterStatus(false);
            },
            2: () => {
                setFilterStatus(false);
            },
            3: () => {
                setFilterStatus(true);
            },
            7: () => {
                setFilterStatus(true);
            },
            8: () => {
                setFilterStatus(false);
            },
        },
    });

    // helper: filtri di default (come primo accesso)
    const getDefaultUserChoose = useCallback((): UserChoose => {
        return {
            nmv: "",
            acd: null,
            ccd: null,
            ird: null,
            erd: null,
        } as any;
    }, []);

    // filtri scelti dall’utente
    const [userChoose, setUserChoose] = useState<UserChoose>(getDefaultUserChoose());

    // chiave per forzare remount tabella
    const [tableKey, setTableKey] = useState(0);

    // dati filtri (clienti)
    const [filtersData, setFiltersData] = useState<Customer[] | null>(null);

    // dati tabella (paginati + infinite scroll)
    const [rows, setRows] = useState<PaymentRow[]>([]);
    const [total, setTotal] = useState<number>(0);
    const offsetRef = useRef(0); // offset “già caricato”
    const PAGE_SIZE = 50;

    const [columns, setColumns] = useState<ColumnConfig[]>([
        {
            key: "NUMOV",
            label: "N. Mov",
            sort: true,
            sortType: "Number",
            type: "default",
            labelsx: { textAlign: "center", width: "100%", fontWeight: 600 },
        },
        {
            key: "DAMOV",
            label: "Data",
            type: "default",
            labelsx: { textAlign: "center", fontWeight: 600 },
            width: 150,
        },
        {
            key: "CLIFO",
            label: "Cod. Cliente",
            sort: true,
            sortType: "Number",
            type: "default",
            width: 200,
            labelsx: { textAlign: "center" },
        },
        {
            key: "RASCL",
            label: "Ragione Sociale",
            sort: true,
            sortType: "String",
            type: "default",
            width: 250,
            labelsx: { textAlign: "center" },
        },
        {
            key: "CDAGE",
            label: "Cod. Agente",
            sort: true,
            sortType: "Number",
            type: "default",
            width: 200,
            labelsx: { fontWeight: 300, textAlign: "center" },
        },
        {
            key: "CAUSA",
            label: "Causale",
            sort: true,
            sortType: "String",
            type: "default",
            labelsx: { textAlign: "center", fontWeight: 600 },
            width: 120,
        },
        {
            key: "DERIG",
            label: "Descrizione",
            sort: true,
            sortType: "String",
            type: "default",
            width: 280,
            labelsx: { fontWeight: 300, textAlign: "center" },
        },
        {
            key: "IMPMO",
            label: "Imponibile",
            sort: true,
            sortType: "Number",
            type: "eur",
            width: 160,
            labelsx: { textAlign: "center" },
        },
    ]);

    // stato pannello filtri in ContextMenu
    const [filterStatus, setFilterStatus] = useState<boolean>(false);
    const filterBtnRef = useRef<HTMLDivElement | null>(null);

    // abort controller per fetch
    const abortController = useRef<AbortController | null>(null) as AbortRef;
    const cancelRequest = () => {
        if (abortController.current) abortController.current.abort();
    };
    const ensureAbort = () => {
        if (!abortController.current || abortController.current.signal.aborted) {
            abortController.current = new AbortController();
        }
        return abortController.current;
    };

    // socket realtime
    const socketRef = useRef<typeof socket | null>(null);

    /* ========= Calcola filtri attivi per tooltip ========= */
    const { filtersCount, filtersTooltip } = useMemo(() => {
        const active: string[] = [];

        if (userChoose.nmv && userChoose.nmv.trim()) {
            active.push(`Movimento: ${userChoose.nmv}`);
        }
        if (userChoose.acd) {
            active.push(`Agente: ${userChoose.acd}`);
        }
        if (userChoose.ccd) {
            active.push(`Cliente: ${userChoose.ccd}`);
        }
        if (userChoose.dateRange && (userChoose.ird || userChoose.erd)) {
            const from = userChoose.ird ? userChoose.ird : "inizio";
            const to = userChoose.erd ? userChoose.erd : "fine";
            active.push(`Date: ${from} → ${to}`);
        }

        return {
            filtersCount: active.length,
            filtersTooltip: active.length > 0 ? active.join("\n") : "Nessun filtro attivo",
        };
    }, [userChoose]);

    /* ========= Sincronizza date se range disattivato ========= */
    // Rimosso - gestito dal BE

    /* ========= Fetch filtri clienti ========= */
    const FiltersData = useCallback(() => {
        ChangeLoadStatus({ from: "filters", bool: true });
        ensureAbort();

        FiltersDataAPI(
            userContext as any,
            abortController as any,
            (res: Customer[]) => setFiltersData(res),
            ChangeLoadStatus as any
        );
    }, [userContext, ChangeLoadStatus]);

    /* ========= Fetch pagamenti (prima pagina o append) ========= */
    const fetchPaymentsPage = useCallback(
        async (opts: { reset: boolean; uc?: UserChoose }) => {
            const uc = opts.uc ?? userChoose;

            ensureAbort();

            const offset = opts.reset ? 0 : offsetRef.current;
            const userChooseWithPagination: UserChoose = {
                ...uc,
                ofs: offset,
                limit: PAGE_SIZE,
            };

            return new Promise<boolean>((resolve) => {
                DataRetriveAPI(
                    { token: userContext.token, details: userContext.details } as any,
                    abortController as any,
                    (items: PaymentRow[]) => {
                        const tot = Number(total ?? 0) || 0;

                        if (opts.reset) {
                            setRows(items);
                            offsetRef.current = items.length;
                        } else {
                            // append senza duplicati (NUMOV)
                            setRows((prev) => {
                                const seen = new Set(prev.map((r) => r.NUMOV));
                                const toAdd = items.filter((r) => !seen.has(r.NUMOV));
                                return [...prev, ...toAdd];
                            });
                            offsetRef.current = offset + items.length;
                        }

                        resolve(items.length > 0);
                    },
                    userChooseWithPagination,
                    ChangeLoadStatus as any,
                    [],
                    () => { },
                    (n: number) => {
                        setTotal(n);
                    }
                );
            });
        },
        [userChoose, PAGE_SIZE, userContext.token, userContext.details, ChangeLoadStatus, total]
    );

    /* ========= Fetch prima pagina ========= */
    const fetchFirstPage = useCallback(
        async (uc?: UserChoose) => {
            try {
                ChangeLoadStatus({ from: "table", bool: true });
                ChangeLoadStatus({ from: "search", bool: true });

                offsetRef.current = 0;
                setRows([]);
                setTotal(0);

                await fetchPaymentsPage({ reset: true, uc });

                ChangeLoadStatus({ from: "table", bool: false });
                ChangeLoadStatus({ from: "search", bool: false });
            } catch (e: any) {
                console.error(e);
                enqueueSnackbar(e?.message || "Errore durante il recupero pagamenti", { title: "Errore", variant: "error" });
                ChangeLoadStatus({ from: "table", bool: false });
                ChangeLoadStatus({ from: "search", bool: false });
            }
        },
        [ChangeLoadStatus, fetchPaymentsPage]
    );

    /* ========= Infinite scroll ========= */
    const infiniteScroll = useCallback(() => {
        if (loadStatus.table || loadStatus.infiniteScroll) return Promise.resolve(false);
        if (total && rows.length >= total) return Promise.resolve(false);

        ChangeLoadStatus({ from: "infiniteScroll", bool: true });

        return fetchPaymentsPage({ reset: false })
            .then((hasData) => {
                ChangeLoadStatus({ from: "infiniteScroll", bool: false });
                return hasData;
            })
            .catch((e: any) => {
                console.error(e);
                enqueueSnackbar(e?.message || "Errore durante il recupero pagamenti", { title: "Errore", variant: "error" });
                ChangeLoadStatus({ from: "infiniteScroll", bool: false });
                return false;
            });
    }, [loadStatus.table, loadStatus.infiniteScroll, total, rows.length, ChangeLoadStatus, fetchPaymentsPage]);

    /* ========= Realtime socket ========= */
    useEffect(() => {
        if (!userContext?.details?._id) return;

        if (!socketRef.current) {
            socketRef.current = socket;

            socket.emit("paymentsUserConnected", (userContext?.details as any)?._id);

            socket.on("paymentsData", (elements: any) => {
                const found = [elements].find(
                    (user: any) => user.userID === (userContext?.details as any)?._id
                );

                if (!found || !Array.isArray(found.data) || found.data.length === 0) return;

                const incoming = found.data as PaymentRow[];
                const hasRestrictiveFilters =
                    !!userChoose?.ccd ||
                    (userChoose?.dateRange && (!!userChoose?.ird || !!userChoose?.erd));

                const isNearFirstPage = rows.length <= PAGE_SIZE;

                if (!hasRestrictiveFilters && isNearFirstPage) {
                    setRows((prev) => [...incoming, ...prev]);
                    offsetRef.current += incoming.length;
                }

                setTotal((prev) => prev + incoming.length);
                enqueueSnackbar("Hai dei nuovi pagamenti!.", { title: "Successo", variant: "success" });
            });
        }

        return () => {
            socket.off("paymentsUserConnected");
            socket.off("paymentsData");
        };
    }, [userContext?.details?._id, userChoose, rows.length]);

    /* ========= Fetch iniziali ========= */
    useEffect(() => {
        if (userContext.details === undefined) return;

        setLoadStatus({ table: true, filters: true, search: true, infiniteScroll: false });

        FiltersData();
        fetchFirstPage(userChoose);

        return () => cancelRequest();
    }, [userContext.details]);

    /* ========= Azioni ========= */

    const Search = useCallback(
        (uc: UserChoose) => {
            setFilterStatus(false);
            fetchFirstPage(uc);
        },
        [fetchFirstPage]
    );

    /* ========= Render ========= */

    return userContext.details === null ? (
        <>Error Loading User details</>
    ) : !userContext.details ? (
        <div>
            <Loader />
        </div>
    ) : (
        <DashboardLayout>
            <FDBox className="flex justify-between p-3 items-center" radius="xl">
                <h1 className="text-xl font-bold">Pagamenti</h1>

                <div className="flex gap-2 items-center">
                    {/* apri pannello filtri */}
                    <div ref={filterBtnRef} data-tour="payments-fil">
                        <FDButton
                            variant="outline"
                            color="neutral"
                            size="small"
                            radius="md"
                            fullWidth
                            onClick={() => setFilterStatus(true)}
                            dataTooltipId="payments-tooltip"
                            dataTooltipContent={filtersTooltip}
                            rightIcon={MdFilterList({})}
                        >
                            Filtri
                            {filtersCount > 0 && (
                                <span className="text-xs text-sky-500 ml-1 font-bold">
                                    ({filtersCount})
                                </span>
                            )}
                        </FDButton>
                    </div>

                    {/* pulsante cerca esterno */}
                    <span data-tour="payments-ric">
                        <FDButton
                            radius="md"
                            variant="solid"
                            color="primary"
                            size="small"
                            onClick={() => Search(userChoose)}
                            dataTooltipId="payments-tooltip"
                            // dataTooltipContent="Cerca"
                            disabled={loadStatus.filters || loadStatus.table || loadStatus.search}
                            rightIcon={IoSearch({})}
                        >
                            Cerca
                        </FDButton>
                    </span>
                </div>
            </FDBox>
            <div className="w-full h-full mt-3" data-tour="payments-now">
                <TableVirtualized
                    key={tableKey}
                    footer={true}
                    data={rows as any}
                    setData={setRows as any}
                    columns={columns as any}
                    setColumns={setColumns as any}
                    loadStatus={loadStatus.table as any}
                    results={total as any}
                    whereToFindData={false}
                    infiniteScroll={{
                        func: infiniteScroll as any,
                        loadStatus: loadStatus.infiniteScroll as any,
                    }}
                    className="h-full"
                />
            </div>

            {/* Context menu filtri */}
            <ContextMenu
                openFor={filterStatus}
                pos={filterBtnRef}
                onClose={(_e?: any, reason?: CloseReason) => {
                    if (shouldIgnoreClose(reason)) return;
                    setFilterStatus(false);
                }}
                placement="auto"
                className="rounded-xl"
                panel={
                    <FiltersPanel
                        userContext={userContext as any}
                        filtersData={filtersData || []}
                        userChoose={userChoose}
                        setUserChoose={setUserChoose}
                        loadStatus={{ filters: loadStatus.filters, search: loadStatus.search }}
                        onApply={() => {
                            Search(userChoose);
                            setFilterStatus(false);
                        }}
                    />
                }
            />

            <Tooltip
                id="payments-tooltip"
                place="bottom"
                style={{
                    maxWidth: "15vw",
                    minWidth: 150,
                    fontSize: "0.87rem",
                    textAlign: "center",
                    zIndex: 999999,
                }}
            />
        </DashboardLayout>
    );
}

export default Payments;
