import React, { useEffect, useMemo, useRef, useState } from "react";
//componenti
import { TableVirtualized } from "components/Virtualized/table";
import { Tooltip } from "react-tooltip";
import { FormatDateString } from "utils/date/getDate";
//fetchdatas
import { InfiniteScrollAPI } from "../fetchData/InfiniteScrollAPI";
//types
import { BuyerAssistantFiltersProps } from "../types/types";


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
interface Column {
    key?: string | string[];
    secKey?: string;
    label?: string;
    type?: string;
    sort?: boolean;
    sortType?: "string" | "number" | "date" | string;
    width?: number;
    onHover?: boolean;
    columnOnHover?: string;
    sx?: { [key: string]: any };
    sxText?: { [key: string]: any };
    render?: (props: { elm: any; index: number }) => JSX.Element | null;
};

interface TablePanelProps {
    filters: BuyerAssistantFiltersProps;
    tableData: any[]; setTableData: React.Dispatch<React.SetStateAction<any[]>>;
    tableTotalData: number;
    loading: boolean;
    onExportSnapshotChange?: (snapshot: { rows: Record<string, unknown>[]; columns: string[] }) => void;
};

const PAGE_SIZE = 50;

/** Colonne data da formattare in YYYY-MM-DD */
const DATE_STRING_COLS = new Set(["ult_car", "ult_ven"]);

/**
 * wrapper per troncare ogni colonna a max 2 righe
 */
const TRUNCATE_2_LINES: React.CSSProperties = {
    display: "-webkit-box",
    WebkitBoxOrient: "vertical" as any,
    overflow: "hidden",
    height: "auto",
    textOverflow: "ellipsis",
    WebkitLineClamp: 2,
};


// ——————————————————————————————————————————————————————————
// UTILS
// ——————————————————————————————————————————————————————————
/** Normalizza colonne speciali (ult_car, ult_ven) come stringa YYYY-MM-DD */
function normalizeSpecialColumns(rows: any[]): any[] {
    return rows.map((row) => {
        const r: any = { ...row };
        for (const k of DATE_STRING_COLS) {
            if (k in r && r[k] != null) {
                const formatted = FormatDateString({
                    date: r[k],
                    actualFromat: "iso",
                    desiredFormat: "yyyy-mm-dd",
                });
                r[k] = formatted ?? r[k];
            }
        }
        return r;
    });
};

/** Render del pallino colorato per flag_gest */
function renderFlagGest({ elm }: { elm: any }): JSX.Element | null {
    const val = elm?.flag_gest ?? null;
    const s = val == null ? "" : String(val).trim();

    const getDotColor = (v: string): string | null => {
        switch (v) {
            case "1": return "#ff0000";   // rosso
            case "2": return "#ff00ff";   // magenta
            case "3": return "#0066ff";   // blu
            case "4": return "#30d5c8";   // turchese
            case "5": return "#ffd700";   // giallo
            case "E":
            case "e": return "#00b050";   // verde
            case "7": return "#ffffff";   // bianco
            default: return null;
        }
    };

    const color = getDotColor(s);
    if (!color || s === "") return <span />;

    return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span
                style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    display: "inline-block",
                    marginRight: 6,
                    backgroundColor: color,
                    border: color === "#ffffff" ? "1px solid #bdbdbd" : undefined,
                }}
            />
            <span className="text-black dark:text-white">{s}</span>
        </span>
    );
};

function applySpecialColumnRules(cols: Column[]): Column[] {
    return cols.map((col) => {
        const key = typeof col.key === "string" ? col.key : "";
        const nextCol: Column = { ...col };

        nextCol.onHover = true;
        nextCol.sxText = { ...(nextCol.sxText || {}), ...TRUNCATE_2_LINES };
        nextCol.sx = { ...(nextCol.sx || {}), alignItems: "center" };

        if (key === "flag_gest") {
            nextCol.type = "custom";
            nextCol.render = renderFlagGest;
            nextCol.width = nextCol.width ?? 110;
        }

        return nextCol;
    });
};


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
export default function TablePanel({ tableData, setTableData, tableTotalData, filters, onExportSnapshotChange, loading }: TablePanelProps) {
    const [columns, setColumns] = useState<Column[]>([]); //state per settare le colonne

    const offset = useRef<number>(0);
    const abortRef = useRef(new AbortController());

    /**
     * setter delle colonne con regole specifiche per UI (ad esempio truncate, flag gest etch..)
     */
    const setColumnsWithRules = React.useCallback(
        (updater: any) => {
            setColumns((prev) => {
                const next = typeof updater === "function" ? updater(prev) : updater;
                const normalizedNext = Array.isArray(next) ? next : [];
                return applySpecialColumnRules(normalizedNext);
            });
        },
        []
    );

    /**
     * infiniteScroll
     * Loads the next page from the API and appends normalized rows to `data`.
     * @returns Promise resolving when the page is loaded (or rejecting on error)
     */
    const infiniteScroll = () => {
        return InfiniteScrollAPI({
            abortController: abortRef.current,
            setData: (updater) => {
                setTableData((prev) => {
                    const next =
                        typeof updater === "function" ? (updater as any)(prev) : updater;
                    return normalizeSpecialColumns(next);
                });
                offset.current += PAGE_SIZE;
            },
            offset: offset.current,
            filters,
        });
    };

    const columnsByLabel = useMemo(() => {
        return columns.reduce<Record<string, Column>>((acc, col) => {
            if (typeof col.label === "string" && col.label.trim() !== "") {
                acc[col.label] = col;
            }
            return acc;
        }, {});
    }, [columns]);

    const exportColumns = useMemo(() => {
        return columns
            .map((col) => String(col.label ?? ""))
            .filter((label) => label && columnsByLabel[label]);
    }, [columns, columnsByLabel]);

    const exportRows = useMemo(() => {
        const readValueFromRow = (row: any, col: Column): unknown => {
            const key = col.key;

            if (typeof key === "string") {
                const base = row?.[key];
                if (typeof col.secKey === "string" && base && typeof base === "object") {
                    return base[col.secKey];
                }
                return base;
            }

            if (Array.isArray(key) && key.length >= 2) {
                return row?.[key[0] as any]?.[key[1] as any];
            }

            return undefined;
        };

        return tableData.map((row) => {
            const nextRow: Record<string, unknown> = {};
            exportColumns.forEach((label) => {
                const col = columnsByLabel[label];
                nextRow[label] = col ? readValueFromRow(row, col) : undefined;
            });
            return nextRow;
        });
    }, [tableData, exportColumns, columnsByLabel]);

    useEffect(() => {
        if (onExportSnapshotChange) {
            onExportSnapshotChange({ rows: exportRows, columns: exportColumns });
        }
    }, [exportRows, exportColumns, onExportSnapshotChange]);

    return (
        <>
            {loading && tableData.length === 0 ? (
                <div className="h-full w-full bg-gray-200 dark:bg-neutral-700 rounded animate-pulse" />
            ) : (
                <TableVirtualized
                    className="h-full"
                    tableType="bottom-line"
                    tableName="Buyer Assistant"
                    data={tableData}
                    setData={setTableData}
                    columns={columns}
                    setColumns={setColumnsWithRules}
                    results={tableTotalData}
                    loadStatus={loading}
                    infiniteScroll={{
                        func: infiniteScroll,
                        offset: offset,
                    }}
                />
            )}
            <Tooltip
                id="buyer-assistant-tooltip"
                place="bottom"
                style={{
                    maxWidth: "15vw",
                    minWidth: 150,
                    fontSize: "0.87rem",
                    textAlign: "center",
                    zIndex: 999999,
                }}
            />
        </>
    );
}
