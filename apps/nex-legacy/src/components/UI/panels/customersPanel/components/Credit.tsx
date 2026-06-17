import React from "react";

type AnyRecord = Record<string, any>;

function cn(...v: Array<string | false | null | undefined>) {
    return v.filter(Boolean).join(" ");
}

function formatCurrency(val: any): string {
    const n = Number(val);
    if (!Number.isFinite(n)) return "-";
    return n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function formatNumber(val: any): string {
    const n = Number(val);
    if (!Number.isFinite(n)) return "-";
    return n.toLocaleString("it-IT");
}

export const Credit: React.FC<{
    mode: "summary" | "details";
    creditsYears: AnyRecord | null;
    onOpenDetails?: () => void;
}> = ({ mode, creditsYears, onOpenDetails }) => {
    const isSummary = mode === "summary";

    if (!creditsYears) {
        return (
            <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/60 p-4">
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Dati creditizi non disponibili.</p>
            </div>
        );
    }

    const foc = creditsYears?.Focelda ?? {};
    const iot = creditsYears?.IOT ?? {};

    // summary: corrente + insoluti correnti + ultimo anno disponibile (se c’è)
    const yearKeys = Object.keys(foc).filter((k) => /^\d{4}$/.test(k)).sort();
    const lastYear = yearKeys.length ? yearKeys[yearKeys.length - 1] : null;

    return (
        <div
            className={cn(
                "rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80",
                "bg-white/80 dark:bg-neutral-900/60 shadow-sm",
                isSummary ? "cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/80 transition" : "",
            )}
            onClick={() => isSummary && onOpenDetails?.()}
            role={isSummary ? "button" : undefined}
            tabIndex={isSummary ? 0 : undefined}
            onKeyDown={(e) => {
                if (!isSummary) return;
                if (e.key === "Enter" || e.key === " ") onOpenDetails?.();
            }}
        >
            <div className="px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-800/70 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex h-2 w-2 rounded-full bg-sky-500" />
                        <h3 className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-50 truncate">Dati Creditizi</h3>
                    </div>
                    <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2">
                        {isSummary ? "Sintesi per anni e insoluti" : "Dettaglio valori per anno (focelda e iot)"}
                    </p>
                </div>

                {isSummary && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenDetails?.();
                        }}
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-[11px] text-neutral-800 dark:text-neutral-200 shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
                    >
                        <span>Dettagli</span>
                    </button>
                )}
            </div>

            <div className="p-4 space-y-3">
                {isSummary ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/60 dark:bg-neutral-900/40 p-3">
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">focelda corrente</p>
                            <p className="mt-1 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                                {formatCurrency(foc.Corrente ?? 0)}
                            </p>
                        </div>

                        <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/60 dark:bg-neutral-900/40 p-3">
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">insoluti correnti</p>
                            <p className="mt-1 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                                {formatNumber(foc.CorrenteInsoluti ?? 0)}
                            </p>
                        </div>

                        <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/60 dark:bg-neutral-900/40 p-3">
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                                {lastYear ? `focelda ${lastYear}` : "ultimo anno"}
                            </p>
                            <p className="mt-1 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                                {lastYear ? formatCurrency(foc[lastYear] ?? 0) : "-"}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {/* focelda */}
                        <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/40 overflow-hidden">
                            <div className="px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-800/70 flex items-center justify-between">
                                <p className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100">focelda</p>
                                <span className="inline-flex items-center rounded-full border px-2.5 py-[3px] text-[10px] font-medium bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300">
                                    insoluti correnti: <span className="ml-1 font-semibold">{formatNumber(foc.CorrenteInsoluti ?? 0)}</span>
                                </span>
                            </div>

                            <div className="p-4">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-[11px]">
                                        <thead>
                                            <tr className="text-left text-neutral-500 dark:text-neutral-400">
                                                <th className="py-2 pr-3 font-semibold">Anno</th>
                                                <th className="py-2 pr-3 font-semibold">Valore</th>
                                                <th className="py-2 font-semibold">Insoluti</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-neutral-800 dark:text-neutral-100">
                                            {Object.keys(foc)
                                                .filter((k) => /^\d{4}$/.test(k))
                                                .sort()
                                                .map((y) => (
                                                    <tr key={y} className="border-t border-neutral-200/60 dark:border-neutral-800/60">
                                                        <td className="py-2 pr-3 font-medium">{y}</td>
                                                        <td className="py-2 pr-3">{formatCurrency(foc[y])}</td>
                                                        <td className="py-2">{formatNumber(foc[`${y}Insoluti`] ?? 0)}</td>
                                                    </tr>
                                                ))}
                                            <tr className="border-t border-neutral-200/60 dark:border-neutral-800/60">
                                                <td className="py-2 pr-3 font-medium">Corrente</td>
                                                <td className="py-2 pr-3">{formatCurrency(foc.Corrente ?? 0)}</td>
                                                <td className="py-2">{formatNumber(foc.CorrenteInsoluti ?? 0)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* iot */}
                        <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/40 overflow-hidden">
                            <div className="px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-800/70 flex items-center justify-between">
                                <p className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100">iot</p>
                                <span className="inline-flex items-center rounded-full border px-2.5 py-[3px] text-[10px] font-medium bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300">
                                    corrente: <span className="ml-1 font-semibold">{formatCurrency(iot.Corrente ?? 0)}</span>
                                </span>
                            </div>

                            <div className="p-4">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-[11px]">
                                        <thead>
                                            <tr className="text-left text-neutral-500 dark:text-neutral-400">
                                                <th className="py-2 pr-3 font-semibold">Anno</th>
                                                <th className="py-2 font-semibold">Valore</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-neutral-800 dark:text-neutral-100">
                                            {Object.keys(iot)
                                                .filter((k) => /^\d{4}$/.test(k))
                                                .sort()
                                                .map((y) => (
                                                    <tr key={y} className="border-t border-neutral-200/60 dark:border-neutral-800/60">
                                                        <td className="py-2 pr-3 font-medium">{y}</td>
                                                        <td className="py-2">{formatCurrency(iot[y])}</td>
                                                    </tr>
                                                ))}
                                            <tr className="border-t border-neutral-200/60 dark:border-neutral-800/60">
                                                <td className="py-2 pr-3 font-medium">Corrente</td>
                                                <td className="py-2">{formatCurrency(iot.Corrente ?? 0)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
