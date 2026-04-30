import { useEffect, useRef, useState } from "react";
import { TableVirtualized } from "components/Virtualized/table";

import {
    AdminBreakdownDataAPI,
    type AdminBreakdownResponse,
} from "../fetchdata/admin/breakdown";
import {
    AgentsBreakdownDataAPI,
    type AgentsBreakdownResponse,
} from "../fetchdata/agents/breakdown";
import type { Dimension } from "../fetchdata/admin/series";


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
type Mode = "admin" | "agent";

type TablePanelProps = {
    breakdown: AdminBreakdownResponse | AgentsBreakdownResponse | null;
    loading: boolean;

    userState: any;
    mode: Mode;
    dimension: Dimension;
    sysInfo: string;
    from: string;
    to: string;

    businessFilters: Record<string, any>;
};


// ——————————————————————————————————————————————————————————
// UTILS
// ——————————————————————————————————————————————————————————
const BREAKDOWN_PAGE_SIZE = 50;

/**
 * Normalizza gli item del breakdown in un formato coerente per la tabella
 * @param rawItems
 * @returns
 */
function normalizeBreakdownItems(rawItems: any[]): any[] {
    return (Array.isArray(rawItems) ? rawItems : []).map((raw) => {
        const code = String(raw.code ?? raw.CODE ?? "").trim();

        const backendLabelRaw = raw.label ?? raw.LABEL ?? "";
        const backendLabel = String(backendLabelRaw ?? "").trim();

        const label = backendLabel && backendLabel !== code ? backendLabel : "";

        return {
            code,
            label,
            qta: Number(raw.qta ?? raw.QTA ?? 0),
            revenue: Number(raw.revenue ?? raw.REVENUE ?? 0),
            profit: Number(raw.profit ?? raw.PROFIT ?? 0),
            marginPct: Number(raw.marginPct ?? raw.MARGINPCT ?? 0),
        };
    });
}


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * Tabella breakdown: infinite scroll admin (paginazione BE) e slicing locale per agent
 * @param props
 * @returns
 */
export default function TablePanel({
    breakdown,
    loading,
    userState,
    mode,
    dimension,
    sysInfo,
    from,
    to,
    businessFilters,
}: TablePanelProps) {
    const [tableData, setTableData] = useState<any[]>([]); //righe visualizzate in tabella
    const [columns, setColumns] = useState<any[]>([
        { label: "Codice", key: "code", sort: true, sortType: "string", width: 150 },
        { label: "Descrizione", key: "label", sort: true, sortType: "string", width: 230 },
        { label: "Q.tà", key: "qta", sort: true, sortType: "number", width: 150 },
        {
            label: "Fatturato",
            key: "revenue",
            sort: true,
            sortType: "number",
            type: "eur",
            width: 230,
            sx: { alignItems: "center" },
        },
        {
            label: "Utile",
            key: "profit",
            sort: true,
            sortType: "number",
            type: "eur",
            width: 230,
            sx: { alignItems: "center" },
        },
        { label: "Margine %", key: "marginPct", sort: true, sortType: "number", width: 150 },
    ]); //colonne configurabili e ordinabili della tabella

    const [totalRows, setTotalRows] = useState<number | null>(null); //totale righe (se noto)
    const [page, setPage] = useState<number>(1); //pagina corrente (1-based)
    const [hasMore, setHasMore] = useState<boolean>(true); //flag infinite scroll

    const nextPageRef = useRef<number>(2); //prossima pagina da richiedere al BE (admin)
    const fullAgentBreakdownRef = useRef<any[] | null>(null); //cache completa breakdown per agent

    useEffect(() => {
        if (!breakdown) {
            setTableData([]);
            setTotalRows(0);
            setPage(1);
            setHasMore(false);
            nextPageRef.current = 2;
            fullAgentBreakdownRef.current = null;
            return;
        }

        const normalized = normalizeBreakdownItems((breakdown as any).items);

        if (mode === "admin") {
            setTableData(normalized);

            const firstPage = (breakdown as AdminBreakdownResponse).page ?? 1;
            setPage(firstPage);
            nextPageRef.current = firstPage + 1;

            const totalServer =
                typeof (breakdown as AdminBreakdownResponse).total === "number"
                    ? (breakdown as AdminBreakdownResponse).total
                    : null;

            const isLastPage =
                totalServer != null
                    ? normalized.length >= totalServer
                    : normalized.length < BREAKDOWN_PAGE_SIZE;

            setTotalRows(totalServer ?? (isLastPage ? normalized.length : null));
            setHasMore(!isLastPage);
            return;
        }

        fullAgentBreakdownRef.current = normalized;

        const firstChunk = normalized.slice(0, BREAKDOWN_PAGE_SIZE);
        setTableData(firstChunk);

        const rawTotal = (breakdown as any).total;
        const total =
            typeof rawTotal === "number" && Number.isFinite(rawTotal)
                ? rawTotal
                : normalized.length;

        setTotalRows(total);
        setHasMore(total > BREAKDOWN_PAGE_SIZE);
        setPage(1);
        nextPageRef.current = 2;
    }, [breakdown, mode]);

    const loadMoreBreakdownPage = async (): Promise<boolean> => {
        if (!hasMore) return false;

        if (mode === "admin") {
            const nextPage = nextPageRef.current;
            if (!nextPage || nextPage <= page) return false;
            if (!userState?.token) return false;

            const ac = new AbortController();

            try {
                let loaded = false;

                await AdminBreakdownDataAPI({
                    userContext: userState,
                    abortController: ac,
                    params: {
                        from,
                        to,
                        sysInfo,
                        dimension,
                        page: nextPage,
                        pageSize: BREAKDOWN_PAGE_SIZE,
                        sort: "-revenue",
                        filters: businessFilters,
                    },
                    setData: (res) => {
                        if (!res) {
                            setHasMore(false);
                            return;
                        }

                        const normalized = normalizeBreakdownItems(res.items);
                        if (!normalized.length) {
                            setHasMore(false);
                            return;
                        }

                        loaded = true;

                        const totalServer = typeof res.total === "number" ? res.total : null;

                        setTableData((prev) => {
                            const merged = [...prev, ...normalized];

                            const isLastPage =
                                totalServer != null
                                    ? merged.length >= totalServer
                                    : normalized.length < BREAKDOWN_PAGE_SIZE;

                            setHasMore(!isLastPage);
                            setPage(res.page ?? nextPage);

                            setTotalRows((prevTotal) => {
                                if (totalServer != null) return totalServer;
                                if (isLastPage) return merged.length;
                                return prevTotal;
                            });

                            return merged;
                        });
                    },
                    setStatus: () => undefined,
                });

                return loaded;
            } catch {
                return false;
            }
        }

        const full = fullAgentBreakdownRef.current;
        if (!full || !full.length) {
            setHasMore(false);
            setTotalRows(full ? full.length : 0);
            return false;
        }

        const startIndex = page * BREAKDOWN_PAGE_SIZE;
        const endIndex = startIndex + BREAKDOWN_PAGE_SIZE;
        const nextChunk = full.slice(startIndex, endIndex);

        if (!nextChunk.length) {
            setHasMore(false);
            setTotalRows(full.length);
            return false;
        }

        setTableData((prev) => {
            const merged = [...prev, ...nextChunk];
            const isLastPage = merged.length >= full.length;

            setHasMore(!isLastPage);
            setPage((p) => p + 1);
            setTotalRows(full.length);

            return merged;
        });

        return true;
    };

    if (!breakdown) return null;

    return (
        <span data-tour="fatturati-table">
            <TableVirtualized
                data={tableData}
                setData={setTableData}
                columns={columns}
                setColumns={setColumns}
                cookie="fatturati-breakdown-columns"
                results={totalRows ?? undefined}
                tableType="bottom-line"
                loadStatus={loading}
                footer
                whereToFindData={false}
                className="h-full text-center"
                infiniteScroll={{
                    func: loadMoreBreakdownPage,
                    offset: nextPageRef,
                }}
            /></span>
    );
}
