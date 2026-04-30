import React, { useMemo } from "react";
import { format } from "date-fns";
import FDBox from "components/UI/box/FDBox";
import type { AdminSeriesResponse } from "../fetchdata/admin/series";
import type { BreakdownTotals } from "./charts/BarChart";
import type { LineChartPublicStats } from "./charts/LineChart";
import { TfiStatsDown, TfiStatsUp } from "react-icons/tfi";
import { BiHide, BiShow } from "react-icons/bi";
import FDButton from "components/UI/buttons/FDButton";
import { useTour } from "tour/TourProvider";

const StatsDown = TfiStatsDown as React.FC<{ size?: number; className?: string }>;
const StatsUp = TfiStatsUp as React.FC<{ size?: number; className?: string }>;
const ShowIcon = BiShow as React.FC<{ size?: number; className?: string }>;
const HideIcon = BiHide as React.FC<{ size?: number; className?: string }>;

const nfEUR = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
});

const nfNUM = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0 });
const nfPCT = new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
interface StatsPanelsProps {
    loading: boolean;
    data: AdminSeriesResponse | null;
    breakdownTotals: BreakdownTotals | null;
    lineStats: LineChartPublicStats | null;
    from: string;
    to: string;
    showCharts: boolean;
    onToggleCharts: () => void;
}


// ——————————————————————————————————————————————————————————
// UTILS
// ——————————————————————————————————————————————————————————
/**
 * Estrae l'anno da una x generica ('YYYYMM', 'YYYYMMDD', 'YYYY-MM-DD', ecc.)
 * @param x
 * @returns
 */
function extractYearFromX(x: string): number | null {
    const s = String(x);

    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return Number(s.slice(0, 4));
    if (/^\d{8}$/.test(s)) return Number(s.slice(0, 4));
    if (/^\d{6}$/.test(s)) return Number(s.slice(0, 4));

    const d = new Date(s);
    const y = d.getFullYear();
    return Number.isNaN(y) ? null : y;
}


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * Pannelli KPI: mostra total range, finestra visibile del grafico, utile/margine e indicatori di concentrazione
 * @param props
 * @returns
 */
export function StatsPanels({
    loading,
    data,
    breakdownTotals,
    lineStats,
    from,
    to,
    showCharts,
    onToggleCharts,
}: StatsPanelsProps) {
    const rangeLabel = useMemo(() => {
        if (!from || !to) return "";
        try {
            return `${format(new Date(from), "dd/MM/yyyy")} → ${format(
                new Date(to),
                "dd/MM/yyyy"
            )}`;
        } catch {
            return "";
        }
    }, [from, to]);

    const totalFatturato = data?.kpi?.current ?? 0;

    const currentSeries = useMemo(
        () => data?.series?.find((s) => s.label.toLowerCase() === "current") ?? null,
        [data]
    );

    const { lastYear, lastYearRevenue, prevYearsAvg } = useMemo(() => {
        const result: {
            yearTotals: Record<number, number>;
            lastYear: number | null;
            lastYearRevenue: number;
            prevYearsAvg: number | null;
        } = {
            yearTotals: {},
            lastYear: null,
            lastYearRevenue: 0,
            prevYearsAvg: null,
        };

        if (!currentSeries || !Array.isArray(currentSeries.points)) {
            return result;
        }

        const map: Record<number, number> = {};

        for (const p of currentSeries.points) {
            const y = extractYearFromX(p.x);
            if (y == null) continue;
            map[y] = (map[y] ?? 0) + (Number(p.y) || 0);
        }

        const years = Object.keys(map).map(Number).sort((a, b) => a - b);
        if (!years.length) return result;

        const lastY = years[years.length - 1];
        const lastRev = map[lastY] ?? 0;

        const prevYears = years.filter((y) => y < lastY);
        const prevAvg = prevYears.length
            ? prevYears.reduce((acc, y) => acc + (map[y] ?? 0), 0) / prevYears.length
            : null;

        return {
            yearTotals: map,
            lastYear: lastY,
            lastYearRevenue: lastRev,
            prevYearsAvg: prevAvg,
        };
    }, [currentSeries]);

    const yearDelta = useMemo(() => {
        if (prevYearsAvg == null || prevYearsAvg === 0) {
            return { pct: 0, abs: 0, hasPrev: false };
        }
        const abs = lastYearRevenue - prevYearsAvg;
        const pct = (abs / Math.abs(prevYearsAvg)) * 100;
        return { pct, abs, hasPrev: true };
    }, [lastYearRevenue, prevYearsAvg]);

    const yearDeltaPositive = yearDelta.pct >= 0;

    const windowGranularity = lineStats?.granularity ?? "month";
    const windowPoints = lineStats?.pointsInWindow ?? 0;
    const windowTotal = lineStats?.main?.sumWindow ?? 0;
    const windowAvg = lineStats?.main?.avgWindow ?? 0;
    const windowDeltaPct = lineStats?.main?.deltaPctVsAvg ?? 0;
    const windowDeltaAbs = lineStats?.main?.deltaAbsVsAvg ?? 0;
    const selectedPointVal = lineStats?.main?.selectedVal ?? 0;
    const windowPointsUsed = lineStats?.main?.pointsUsed ?? 0;

    const windowPositive = windowDeltaPct >= 0;

    const normTotals = breakdownTotals ?? {
        revenue: 0,
        profit: 0,
        marginPct: 0,
        qta: 0,
    };

    const windowSharePct = useMemo(() => {
        if (!windowTotal || !totalFatturato) return null;
        const ratio = windowTotal / totalFatturato;
        if (!Number.isFinite(ratio) || ratio <= 0) return null;
        return ratio * 100;
    }, [windowTotal, totalFatturato]);

    const { top1SharePct, top3SharePct } = useMemo(() => {
        if (!data?.topN?.length || !totalFatturato) {
            return { top1SharePct: null, top3SharePct: null };
        }

        const rows = data.topN as any[];

        const getRev = (row: any) => Number(row.revenue ?? row.REVENUE ?? 0) || 0;

        const top1Rev = getRev(rows[0]);
        const top3Rev = rows.slice(0, 3).reduce((acc, r) => acc + getRev(r), 0);

        const base = totalFatturato;

        return {
            top1SharePct: top1Rev ? (top1Rev / base) * 100 : null,
            top3SharePct: top3Rev ? (top3Rev / base) * 100 : null,
        };
    }, [data, totalFatturato]);

    // Tour system: disabilitare i filtri durante gli step
    /* TOUR SYSTEM */
    //const per blocco interazioni durante gli step del tour
    const { isOpen, index: tourIndex } = useTour();
    const lockInteractions = isOpen && (tourIndex === 12 || tourIndex === 13 || tourIndex === 14);

    /** Mostra lo scheletro di caricamento se stiamo caricando o non abbiamo dati */
    const showSkeleton = loading || !data && !lineStats && !breakdownTotals;
    if (showSkeleton) {
        return (
            <div className="w-full flex gap-2">
                <div className="w-full bg-gray-200 dark:bg-neutral-700 min-h-[200px] rounded-lg animate-pulse" />
                <div className="w-full bg-gray-200 dark:bg-neutral-700 min-h-[200px] rounded-lg animate-pulse" />
                <div className="w-full bg-gray-200 dark:bg-neutral-700 min-h-[200px] rounded-lg animate-pulse" />
                <div className="w-full bg-gray-200 dark:bg-neutral-700 min-h-[200px] rounded-lg animate-pulse" />
            </div>
        );
    };

    return (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
            <FDBox pad="md" radius="lg" fullWidth data-tour="fatturati-statsPanel-1">
                <div className="flex flex-col gap-2 h-full">
                    <div className="flex flex-col">
                        <div className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                            Totale intervallo
                        </div>

                        <div className="text-md font-semibold text-gray-900 dark:text-gray-100">
                            {nfEUR.format(totalFatturato)}
                        </div>
                    </div>

                    {rangeLabel && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            {rangeLabel}
                        </div>
                    )}

                    <div className="mt-auto flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-300">
                        {lastYear != null && (
                            <div className="flex items-center justify-between">
                                <span className="text-xs">Fatturato anno corrente</span>
                                <span>{nfEUR.format(lastYearRevenue)}</span>
                            </div>
                        )}

                        {prevYearsAvg != null && (
                            <div className="flex items-center justify-between">
                                <span className="text-xs">Media fatturato anni precedenti</span>
                                <span>{nfEUR.format(prevYearsAvg)}</span>
                            </div>
                        )}

                        {yearDelta.hasPrev && (
                            <div className="flex items-center justify-between">
                                <span className="text-xs">Scostamento anno corrente vs media precedenti</span>
                                <span className="flex items-center gap-2">
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs flex gap-1 font-medium ${yearDeltaPositive
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                            }`}
                                    >
                                        {yearDeltaPositive ? <StatsUp /> : <StatsDown />}
                                        {nfPCT.format(Math.abs(yearDelta.pct))}%
                                    </span>

                                    <span className="text-xs text-gray-500">
                                        ({nfEUR.format(Math.abs(yearDelta.abs))})
                                    </span>
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </FDBox>

            <FDBox pad="md" radius="lg" fullWidth data-tour="fatturati-statsPanel-2">
                <div className="flex flex-col gap-2 h-full">
                    <div className="flex flex-col">
                        <div className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                            Totale finestra
                        </div>

                        <div className="text-md font-semibold text-gray-900 dark:text-gray-100">
                            {nfEUR.format(windowTotal)}
                        </div>
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        Totale finestra: ({windowPoints}{" "}
                        {windowGranularity === "day" ? "giorni" : "mesi"})
                        {lineStats?.windowRangeLabel && <> {lineStats.windowRangeLabel}</>}
                    </div>

                    <div className="mt-2 flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center justify-between">
                            <span className="text-xs">
                                Media per {windowGranularity === "day" ? "giorno" : "mese"}
                                {windowGranularity === "day" && windowPointsUsed > 0
                                    ? ` (${windowPointsUsed} giorni effettivi)`
                                    : ""}
                            </span>
                            <span>{nfEUR.format(windowAvg)}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-xs">
                                Valore {windowGranularity === "day" ? "giorno" : "mese"} selezionato
                            </span>
                            <span>{nfEUR.format(selectedPointVal)}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-xs">Scostamento punto selezionato</span>
                            <span className="flex items-center gap-2">
                                <span
                                    className={`px-2 py-0.5 rounded-full flex gap-1 text-xs font-medium ${windowPositive
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700"
                                        }`}
                                >
                                    {windowPositive ? <StatsUp /> : <StatsDown />}
                                    {nfPCT.format(Math.abs(windowDeltaPct))}%
                                </span>

                                <span className="text-xs text-gray-500">
                                    ({nfEUR.format(Math.abs(windowDeltaAbs))})
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </FDBox>

            <FDBox pad="md" radius="lg" fullWidth data-tour="fatturati-statsPanel-3">
                <div className="flex flex-col gap-2 h-full">
                    <div className="flex flex-col">
                        <div className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                            Utile complessivo
                        </div>

                        <div className="text-md font-semibold text-gray-900 dark:text-gray-100">
                            {nfEUR.format(normTotals.profit)}
                        </div>
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        Utile totale intervallo
                    </div>

                    <div className="mt-2 flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center justify-between">
                            <span className="text-xs">Margine % medio</span>
                            <span>{nfPCT.format(normTotals.marginPct)}%</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-xs">Quantità totale</span>
                            <span>{nfNUM.format(normTotals.qta)}</span>
                        </div>
                    </div>
                </div>
            </FDBox>

            <FDBox pad="md" radius="lg" fullWidth data-tour="fatturati-statsPanel-4">
                <div className="flex flex-col gap-2 h-full">
                    <div className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                        Peso e concentrazione
                    </div>

                    <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        {windowSharePct != null ? `${nfPCT.format(windowSharePct)}%` : "–"}
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        Quota del fatturato dell'intervallo visibile sul totale
                    </div>

                    <div className="mt-2 flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-300">
                        {top1SharePct != null && (
                            <div className="flex items-center justify-between">
                                <span className="text-xs">Incidenza top 1 su totale</span>
                                <span>{nfPCT.format(top1SharePct)}%</span>
                            </div>
                        )}

                        {top3SharePct != null && (
                            <div className="flex items-center justify-between">
                                <span className="text-xs">Incidenza primi 3 su totale</span>
                                <span>{nfPCT.format(top3SharePct)}%</span>
                            </div>
                        )}

                        {data?.kpi?.avgTicket != null && (
                            <div className="flex items-center justify-between">
                                <span className="text-xs">Scontrino medio</span>
                                <span>{nfEUR.format(data.kpi.avgTicket)}</span>
                            </div>
                        )}
                    </div>

                    <div className="w-full flex justify-end items-center mt-auto">
                        {lockInteractions && (
                            <div
                                aria-hidden="true"
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    zIndex: 10,
                                    pointerEvents: "auto",
                                }}
                                onClickCapture={(e) => e.stopPropagation()}
                            />
                        )}
                        <FDButton size="small" variant="solid" color="primary" onClick={onToggleCharts} data-tour="fatturati-statsPanel-5">
                            {showCharts ? (
                                <>
                                    <HideIcon className="mr-1.5" />
                                    Nascondi grafici
                                </>
                            ) : (
                                <>
                                    <ShowIcon className="mr-1.5" />
                                    Mostra grafici
                                </>
                            )}
                        </FDButton>
                    </div>
                </div>
            </FDBox>
        </div>
    );
}

export default StatsPanels;
