import React from "react";
import { FormatDate } from "utils/date/getDate";
import type { PaymentRow } from "layouts/stocks/payments/fetchData/data";

type AnyRecord = Record<string, any>;

function cn(...v: Array<string | false | null | undefined>) {
    return v.filter(Boolean).join(" ");
}

function cleanStr(val: any): string {
    const s = String(val ?? "").replace(/\s+/g, " ").trim();
    return s || "-";
}

function formatCurrency(val: any): string {
    const n = Number(val);
    if (!Number.isFinite(n)) return "-";
    return n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
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

export interface PaymentsDetailsPayload {
    total: number;
    items: PaymentRow[];
    nextOfs?: number;
}

export const Payments: React.FC<{
    mode: "summary" | "details";
    customerCode: string | number;
    details?: PaymentsDetailsPayload | null;
    onOpenDetails?: () => void;
}> = ({ mode, customerCode, details, onOpenDetails }) => {
    const isSummary = mode === "summary";
    const items = details?.items ?? [];
    const total = details?.total ?? 0;

    // summary mode: mostra solo i primi 5 con bottone di espansione
    if (isSummary) {
        return (
            <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/60 shadow-sm">
                {/* header */}
                <div className="px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-800/70 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex h-2 w-2 rounded-full bg-sky-500" />
                            <h3 className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-50 truncate">
                                Pagamenti
                            </h3>
                        </div>
                        <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2">
                            {total} pagamenti totali
                        </p>
                    </div>

                    {total > 0 && (
                        <button
                            onClick={onOpenDetails}
                            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-[11px] text-neutral-800 dark:text-neutral-200 shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
                        >
                            Dettagli
                        </button>
                    )}
                </div>

                {/* tabella sommario */}
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
                                            key={idx}
                                            className="border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition"
                                        >
                                            <TableCell>{cleanStr(row.DAMOV)}</TableCell>
                                            <TableCell>{cleanStr(row.NUMOV)}</TableCell>
                                            <TableCell>{cleanStr(row.CAUSA)}</TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(row.IMPMO)}
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
            </div>
        );
    }

    // details mode: mostra tutti i pagamenti con layout completo
    return (
        <div className="space-y-4">
            {items.length > 0 ? (
                <>
                    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-x-auto">
                        <table className="w-full text-[12px]">
                            <thead>
                                <tr className="bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800">
                                    <TableHeader>Data</TableHeader>
                                    <TableHeader>Movimento</TableHeader>
                                    <TableHeader>Causale</TableHeader>
                                    <TableHeader>Descrizione</TableHeader>
                                    <TableHeader>Agente</TableHeader>
                                    <TableHeader className="text-right">Imponibile</TableHeader>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((row, idx) => (
                                    <tr
                                        key={idx}
                                        className="border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition"
                                    >
                                        <TableCell>{cleanStr(row.DAMOV)}</TableCell>
                                        <TableCell className="font-medium">{cleanStr(row.NUMOV)}</TableCell>
                                        <TableCell>{cleanStr(row.CAUSA)}</TableCell>
                                        <TableCell>{cleanStr(row.DERIG)}</TableCell>
                                        <TableCell>{cleanStr(row.CDAGE)}</TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(row.IMPMO)}
                                        </TableCell>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* summary stats */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 bg-neutral-50 dark:bg-neutral-900/50">
                            <p className="text-[11px] text-neutral-600 dark:text-neutral-400">Totale movimenti</p>
                            <p className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-50 mt-1">
                                {total}
                            </p>
                        </div>
                        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 bg-neutral-50 dark:bg-neutral-900/50">
                            <p className="text-[11px] text-neutral-600 dark:text-neutral-400">Pagamenti mostrati</p>
                            <p className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-50 mt-1">
                                {items.length}
                            </p>
                        </div>
                        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 bg-neutral-50 dark:bg-neutral-900/50">
                            <p className="text-[11px] text-neutral-600 dark:text-neutral-400">Imponibile totale</p>
                            <p className="text-[14px] font-semibold text-neutral-900 dark:text-neutral-50 mt-1">
                                {formatCurrency(items.reduce((sum, row) => sum + (row.IMPMO ?? 0), 0))}
                            </p>
                        </div>
                    </div>
                </>
            ) : (
                <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-8 text-center bg-neutral-50 dark:bg-neutral-900/50">
                    <p className="text-[12px] text-neutral-500 dark:text-neutral-400">
                        Nessun pagamento disponibile per questo cliente
                    </p>
                </div>
            )}
        </div>
    );
};
