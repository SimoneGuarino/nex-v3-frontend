import React from "react";
import { FetchData } from "examples/Fetch";
import { TableVirtualized } from "components/Virtualized/table";
import type { PaymentsSortDirection, PaymentsSortField } from "layouts/stocks/payments/types";
import type { PanelMode, PaymentsDetailsPayload } from "../types";
import { buildQueryString, cn, ensureTrailingSlash, formatCurrencyIt, formatNumberIt, toDisplayText } from "../helpers/panelUtils";
import {
    SectionActionButton,
    SectionContainer,
    SectionHeader,
} from "../components/sectionUi";
import { FaPlus } from "react-icons/fa";

function makeDetailsColumns() {
    return [
        {
            key: "DAMOV",
            label: "Data",
            sort: true,
            sortType: "date",
            type: "default",
            width: 140,
            sx: { alignItems: "center" },
        },
        {
            key: "NUMOV",
            label: "Movimento",
            sort: true,
            sortType: "Number",
            type: "default",
            width: 130,
            sx: { alignItems: "center" },
        },
        {
            key: "CAUSA",
            label: "Causale",
            sort: true,
            sortType: "String",
            type: "default",
            width: 120,
            sx: { alignItems: "center" },
        },
        {
            key: "DERIG",
            label: "Descrizione",
            sort: true,
            sortType: "String",
            type: "default",
            width: 320,
            sx: { alignItems: "center" },
            onHover: true,
            sxText: {
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                height: 'auto !important',
                textOverflow: "ellipsis",
                WebkitLineClamp: "1"
            }
        },
        {
            key: "CDAGE",
            label: "Agente",
            sort: true,
            sortType: "String",
            type: "default",
            width: 120,
            sx: { alignItems: "center" },
        },
        {
            key: "IMPMO",
            label: "Imponibile",
            sort: true,
            sortType: "Number",
            type: "eur",
            width: 170,
            sx: { alignItems: "center" },
        },
    ];
}

const TableCell: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <td className={cn("px-3 py-2 text-[12px] text-neutral-700 dark:text-neutral-300", className)}>
        {children}
    </td>
);

const TableHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <th className={cn("px-3 py-2 text-left text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/50", className)}>
        {children}
    </th>
);

const PAGE_SIZE = 50;

type HeaderSortPayload = {
    columnKey: string;
    sortDirection: number;
};

function normalizePaymentsSort(sort: HeaderSortPayload): {
    sortField?: PaymentsSortField;
    sortDirection?: PaymentsSortDirection;
} {
    const token = String(sort.columnKey || "").trim().toLowerCase();
    let field: PaymentsSortField | undefined;

    switch (token) {
        case "damov":
        case "damov_ref":
        case "data":
        case "data_movimento":
            field = "DAMOV";
            break;
        case "numov":
        case "movimento":
        case "numero_movimento":
            field = "NUMOV";
            break;
        case "causa":
        case "causale":
            field = "CAUSA";
            break;
        case "derig":
        case "descrizione":
            field = "DERIG";
            break;
        case "cdage":
        case "agente":
            field = "CDAGE";
            break;
        case "impmo":
        case "imponibile":
        case "importo":
            field = "IMPMO";
            break;
        default:
            field = undefined;
            break;
    }

    if (!field) return {};

    if (sort.sortDirection === 1) {
        return { sortField: field, sortDirection: "asc" };
    }

    if (sort.sortDirection === 2) {
        return { sortField: field, sortDirection: "desc" };
    }

    return {};
}

export type PaymentsFooterStats = {
    total: number;
    shown: number;
    imponibile: number;
};

export const Payments: React.FC<{
    mode: PanelMode;
    customerCode: string | number;
    details?: PaymentsDetailsPayload | null;
    onOpenDetails?: () => void;
    reloadToken?: number;
    onLoadingChange?: (loading: boolean) => void;
    onStatsChange?: (stats: PaymentsFooterStats) => void;
}> = ({
    mode,
    customerCode,
    details,
    onOpenDetails,
    reloadToken,
    onLoadingChange,
    onStatsChange,
}) => {
        const isSummary = mode === "summary";
        const base = ensureTrailingSlash(import.meta.env.VITE_API_API_STOCKS);

        const [loading, setLoading] = React.useState(false);
        const [tableLoading, setTableLoading] = React.useState(false);
        const [hasErr, setHasErr] = React.useState(false);
        const requestSeqRef = React.useRef(0);

        const [items, setItems] = React.useState(() => details?.items ?? []);
        const [total, setTotal] = React.useState(() => details?.total ?? 0);
        const [ofs, setOfs] = React.useState(() => details?.nextOfs ?? 0);
        const [tableColumns, setTableColumns] = React.useState<any[]>(() => makeDetailsColumns());
        const [serverSort, setServerSort] = React.useState<HeaderSortPayload>({
            columnKey: "",
            sortDirection: 0,
        });

        React.useEffect(() => {
            setItems(details?.items ?? []);
            setTotal(details?.total ?? 0);
            setOfs(details?.nextOfs ?? 0);
            setHasErr(false);
        }, [details?.items, details?.total, details?.nextOfs]);

        const loadPage = React.useCallback(async (nextOfs: number, sort?: HeaderSortPayload): Promise<boolean> => {
            const ccli = String(customerCode ?? "").trim();
            const isReset = nextOfs === 0;
            if (!ccli) return false;
            if (!isReset && loading) return false;
            if (nextOfs > 0 && total > 0 && nextOfs >= total) return false;

            const requestSeq = ++requestSeqRef.current;
            setLoading(true);
            if (isReset) setTableLoading(true);
            setHasErr(false);

            try {
                const normalizedSort = normalizePaymentsSort(sort ?? serverSort);
                const query = buildQueryString({
                    ofs: nextOfs,
                    limit: PAGE_SIZE,
                    ccli,
                    sortField: normalizedSort.sortField,
                    sortDirection: normalizedSort.sortDirection,
                });

                const url = `${base}pagamenti${query}`;
                const res: any = await FetchData(url, "GET", undefined as any, new AbortController());
                if (requestSeq !== requestSeqRef.current) return false;

                const newItems = Array.isArray(res?.items) ? res.items : [];
                const newTotal = Number(res?.total ?? 0);

                setTotal(Number.isFinite(newTotal) ? newTotal : 0);
                setItems((prev) => (isReset ? newItems : [...(prev || []), ...newItems]));
                setOfs(nextOfs + newItems.length);
                return newItems.length > 0;
            } catch (e: any) {
                if (requestSeq !== requestSeqRef.current) return false;
                console.error(e);
                setHasErr(true);
                return false;
            } finally {
                if (requestSeq === requestSeqRef.current) {
                    setLoading(false);
                    if (isReset) setTableLoading(false);
                }
            }
        }, [base, customerCode, loading, total, serverSort]);

        const imponibileTotale = React.useMemo(
            () => items.reduce((sum, row) => sum + (Number(row?.IMPMO ?? 0) || 0), 0),
            [items]
        );

        React.useEffect(() => {
            onLoadingChange?.(loading);
        }, [loading, onLoadingChange]);

        React.useEffect(() => {
            onStatsChange?.({
                total,
                shown: items.length,
                imponibile: imponibileTotale,
            });
        }, [total, items.length, imponibileTotale, onStatsChange]);

        const prevReloadTokenRef = React.useRef<number | undefined>(reloadToken);
        React.useEffect(() => {
            if (mode !== "details") return;
            if (reloadToken === undefined) return;
            if (prevReloadTokenRef.current === reloadToken) return;
            prevReloadTokenRef.current = reloadToken;
            void loadPage(0);
        }, [mode, reloadToken, loadPage]);

        const handleServerSortChange = React.useCallback(
            ({ columnKey, sortDirection }: HeaderSortPayload) => {
                setServerSort((prev) => {
                    if (prev.columnKey === columnKey && prev.sortDirection === sortDirection) {
                        return prev;
                    }
                    return { columnKey, sortDirection };
                });
                void loadPage(0, { columnKey, sortDirection });
            },
            [loadPage]
        );

        if (isSummary) {
            return (
                <SectionContainer>
                    <SectionHeader
                        title="Pagamenti"
                        description={`${formatNumberIt(total)} pagamenti totali`}
                        rightContent={
                            total > 0 ? (
                                <SectionActionButton
                                    rightIcon={FaPlus({})}
                                    onClick={onOpenDetails}>
                                    Dettagli
                                </SectionActionButton>
                            ) : null
                        }
                    />

                    {items.length > 0 ? (
                        <div className="p-4">
                            <div className="overflow-x-auto">
                                <table className="w-full text-[12px]">
                                    <thead>
                                        <tr className="border-b border-neutral-200 dark:border-neutral-800">
                                            <TableHeader>Data</TableHeader>
                                            <TableHeader>Movimento</TableHeader>
                                            <TableHeader>Causale</TableHeader>
                                            <TableHeader className="text-right">Imponibile</TableHeader>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.slice(0, 5).map((row, idx) => (
                                            <tr
                                                key={`${toDisplayText(row.NUMOV)}-${toDisplayText(row.DAMOV)}-${idx}`}
                                                className="border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition"
                                            >
                                                <TableCell>{toDisplayText(row.DAMOV)}</TableCell>
                                                <TableCell>{toDisplayText(row.NUMOV)}</TableCell>
                                                <TableCell>{toDisplayText(row.CAUSA)}</TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrencyIt(row.IMPMO)}
                                                </TableCell>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 text-center">
                            <p className="text-[12px] text-neutral-500 dark:text-neutral-400">
                                Nessun pagamento disponibile
                            </p>
                        </div>
                    )}
                </SectionContainer>
            );
        }

        return (
            <div className="h-full min-h-0 flex flex-col">
                {hasErr && (
                    <div className="shrink-0 m-4 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 px-4 py-3">
                        <p className="text-[12px] font-semibold text-rose-800 dark:text-rose-200">Errore nel caricamento pagamenti</p>
                        <p className="mt-1 text-[11px] text-rose-700/80 dark:text-rose-200/80">
                            Controlla la console per dettagli.
                        </p>
                    </div>
                )}

                {loading && items.length === 0 && (
                    <div className="shrink-0 m-4 rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/60 dark:bg-neutral-900/40 p-4">
                        <div className="h-3 w-40 rounded bg-neutral-200/70 dark:bg-neutral-800/70 animate-pulse" />
                        <div className="mt-4 space-y-2">
                            <div className="h-2 w-full rounded bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse" />
                            <div className="h-2 w-5/6 rounded bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse" />
                        </div>
                    </div>
                )}

                {items.length > 0 && (
                    <div className="min-h-0 flex-1">
                        <TableVirtualized
                            data={items}
                            setData={setItems}
                            columns={tableColumns}
                            setColumns={setTableColumns}
                            results={total}
                            loadStatus={tableLoading}
                            footer={false}
                            whereToFindData={false}
                            minColWidth={110}
                            height="100%"
                            className="h-full border-0 rounded-none"
                            infiniteScroll={{
                                func: () => loadPage(ofs),
                                loadStatus: loading && !tableLoading,
                                numberToFetch: PAGE_SIZE,
                            }}
                            headerSettings={{
                                onSortChange: handleServerSortChange,
                                sortState: serverSort,
                            }}
                        />
                    </div>
                )}

                {!loading && items.length === 0 && !hasErr && (
                    <div className="h-full flex items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-800 text-center bg-neutral-50 dark:bg-neutral-900/50">
                        <p className="text-[12px] text-neutral-500 dark:text-neutral-400">
                            Nessun pagamento disponibile per questo cliente
                        </p>
                    </div>
                )}
            </div>
        );
    };

