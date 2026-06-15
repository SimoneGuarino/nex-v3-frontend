// TableRenderer.tsx
import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { TableData } from "context/AIContext";
import FDIconButton from "components/UI/buttons/FDIconButton";
import { GoDownload } from "react-icons/go";
import { exportToCsv } from "../../utils/csv";

const AiOutlineDownload = GoDownload as React.FC<{ className?: string }>;

const VIRTUALIZE_THRESHOLD = 100;
const OVERSCAN = 5;
const MAX_TABLE_HEIGHT = 500;
const ROW_ESTIMATED_HEIGHT = 60;
const HEADER_HEIGHT = 48;
const MIN_COLUMN_WIDTH = 120;

// confronto più performante (assume che table object sia immutabile esternamente; se è lo stesso riferimento, subito true)
const areTablesEqual = (a: TableData, b: TableData): boolean => {
    if (a === b) return true;
    if (a.columns.length !== b.columns.length) return false;
    for (let i = 0; i < a.columns.length; i++) if (a.columns[i] !== b.columns[i]) return false;
    if (a.rows.length !== b.rows.length) return false;
    for (let ri = 0; ri < a.rows.length; ri++) {
        const rowA = a.rows[ri];
        const rowB = b.rows[ri];
        if (rowA.length !== rowB.length) return false;
        for (let ci = 0; ci < rowA.length; ci++) if (rowA[ci] !== rowB[ci]) return false;
    }
    const metaA = a.meta || {};
    const metaB = b.meta || {};
    // confronto superficiale di meta (assume piccoli)
    if (metaA.align && metaB.align) {
        if (metaA.align.length !== metaB.align.length) return false;
        for (let i = 0; i < metaA.align.length; i++) if (metaA.align[i] !== metaB.align[i]) return false;
    } else if (metaA.align || metaB.align) return false;

    if (metaA.types && metaB.types) {
        if (metaA.types.length !== metaB.types.length) return false;
        for (let i = 0; i < metaA.types.length; i++) if (metaA.types[i] !== metaB.types[i]) return false;
    } else if (metaA.types || metaB.types) return false;

    return true;
};

type TableRendererProps = {
    table: TableData;
};

const cellWrapperStyle: React.CSSProperties = {
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical" as any,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "normal",
    wordBreak: "break-word",
    fontSize: 12,
    lineHeight: "1.2em",
    maxHeight: "3.6em",
};

const headerTextStyle: React.CSSProperties = {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as any,
    overflow: "hidden",
    textOverflow: "ellipsis",
    wordBreak: "break-word",
};

const TableRendererInner: React.FC<TableRendererProps> = ({ table }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const totalRows = table.rows.length;

    const usingVirtualization = totalRows > VIRTUALIZE_THRESHOLD;
    const viewportHeight = usingVirtualization
        ? MAX_TABLE_HEIGHT
        : Math.min(ROW_ESTIMATED_HEIGHT * totalRows + HEADER_HEIGHT, MAX_TABLE_HEIGHT);

    const VISIBLE_HEIGHT = Math.max(0, viewportHeight - HEADER_HEIGHT);

    // throttle scroll updates via rAF
    const tickingRef = useRef(false);
    const handleScroll = useCallback(() => {
        if (!containerRef.current) return;
        if (tickingRef.current) return;
        tickingRef.current = true;
        requestAnimationFrame(() => {
            setScrollTop(containerRef.current!.scrollTop);
            tickingRef.current = false;
        });
    }, []);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        el.addEventListener("scroll", handleScroll, { passive: true });
        return () => el.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);

    // calcolo virtual window
    const [startIndex, endIndex] = useMemo(() => {
        if (!usingVirtualization) return [0, totalRows];

        const currentTopRow = Math.floor(scrollTop / ROW_ESTIMATED_HEIGHT);
        const s = Math.max(0, currentTopRow - OVERSCAN);

        const windowRows = Math.ceil(VISIBLE_HEIGHT / ROW_ESTIMATED_HEIGHT) + 2 * OVERSCAN;
        const e = Math.min(totalRows, s + windowRows);

        // Clamp finale per evitare jitter a fondo lista:
        const windowClamped = e - s;
        if (e === totalRows && windowClamped < windowRows) {
            const s2 = Math.max(0, totalRows - windowRows);
            return [s2, totalRows];
        }
        return [s, e];
    }, [usingVirtualization, scrollTop, totalRows, VISIBLE_HEIGHT]);

    const paddingTop = usingVirtualization ? startIndex * ROW_ESTIMATED_HEIGHT : 0;
    const paddingBottom = usingVirtualization ? (totalRows - endIndex) * ROW_ESTIMATED_HEIGHT : 0;

    // righe visibili memorizzate
    const visibleRows = useMemo(() => {
        return table.rows.slice(startIndex, endIndex);
    }, [table.rows, startIndex, endIndex]);

    const renderCellContent = useCallback((cell: string | number | null) => {
        const display = cell === null ? "-" : String(cell);
        return (
            <div style={cellWrapperStyle} /*title={display}*/ data-tooltip-content={display} data-tooltip-id="general-ai-tooltip">
                {display}
            </div>
        );
    }, []);

    // handler generico per il download CSV
    const handleDownload = useCallback(() => {
        exportToCsv('table-export.csv', table.columns, table.rows);
    }, [table.columns, table.rows]);

    return (<div className="my-5 space-y-2">
        <div
            className="text-black dark:text-white bg-white dark:bg-neutral-700 rounded-md shadow-sm max-w-full w-fit"
        >
            <div
                ref={containerRef}
                className="overflow-auto"
                style={{
                    maxHeight: viewportHeight,
                    position: "relative",
                    borderRadius: 6,
                    border: "1px solid rgba(0,0,0,0.08)",
                }}
            >
                <table
                    className="w-full border-collapse"
                    style={{
                        position: "relative",
                        tableLayout: "auto",
                        minWidth: "100%",
                    }}
                >
                    <thead
                        style={{ position: "sticky", top: 0, zIndex: 2 }}
                        className="bg-gray-100 dark:bg-neutral-800"
                    >
                        <tr>
                            {table.columns.map((col, index) => (
                                <th
                                    key={col + index}
                                    className="border-b border-gray-300 dark:border-neutral-700 px-3 py-2 text-left align-top"
                                    style={{
                                        fontWeight: 600,
                                        position: "relative",
                                        minWidth: MIN_COLUMN_WIDTH,
                                        verticalAlign: "top",
                                    }}
                                >
                                    <div style={headerTextStyle} title={col}>
                                        {col}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {usingVirtualization && paddingTop > 0 && (
                            <tr style={{ height: paddingTop }}>
                                <td aria-hidden="true" colSpan={table.columns.length} />
                            </tr>
                        )}
                        {visibleRows.map((row, ri) => {
                            const globalIndex = startIndex + ri;
                            return (
                                <tr
                                    key={globalIndex}
                                    className={
                                        globalIndex % 2 === 0
                                            ? "bg-white dark:bg-neutral-700"
                                            : "bg-gray-50 dark:bg-neutral-800"
                                    }
                                    style={{ height: ROW_ESTIMATED_HEIGHT, lineHeight: `${ROW_ESTIMATED_HEIGHT - 16}px` }}
                                >
                                    {row.map((cell, ci) => (
                                        <td
                                            key={ci}
                                            className="border-b border-gray-200 dark:border-neutral-600 px-3 py-2 align-top"
                                            style={{ verticalAlign: "top", minWidth: MIN_COLUMN_WIDTH }}
                                        >
                                            {renderCellContent(cell)}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                        {usingVirtualization && paddingBottom > 0 && (
                            <tr style={{ height: paddingBottom }}>
                                <td aria-hidden="true" colSpan={table.columns.length} />
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {usingVirtualization && (
                <div className="text-xs text-right mt-1 pr-2">
                    Visualizzate righe {startIndex + 1}–{endIndex} di {totalRows}
                </div>
            )}
        </div>
        <FDIconButton
            variant="text"
            dataTooltipId='general-ai-tooltip'
            dataTooltipContent={`Scarica tabella`}
            className="h-fit"
            onClick={handleDownload}
            icon={<AiOutlineDownload />}
        />
    </div>
    );
};

const TableRenderer = React.memo(TableRendererInner, (prev, next) => areTablesEqual(prev.table, next.table));

export { TableRenderer };