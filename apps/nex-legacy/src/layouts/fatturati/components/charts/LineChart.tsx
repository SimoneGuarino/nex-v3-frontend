import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    CartesianGrid,
    Line,
    LineChart as ReLineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip as ReTooltip,
    XAxis,
    YAxis,
} from "recharts";
import { addDays, format, parseISO, subYears } from "date-fns";
import FDButton from "components/UI/buttons/FDButton";
import { IoArrowBackCircleOutline } from "react-icons/io5";
import { FDBox } from "@nex/fd-ui";
import { ContextMenu } from "components/UI/menu/ContextMenu";
import { IoMdMore } from "react-icons/io";
import FDIconButton from "components/UI/buttons/FDIconButton";
import { Granularity } from "layouts/fatturati/fetchdata/admin/series";
import { useTour } from "tour/TourProvider";
import { useUserContext } from "context/UserContext";
import { Role } from "tour/types";

const IoMdMoreIcon = IoMdMore as React.FC<{ size?: number; className?: string }>;

// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
export interface SeriesPoint {
    x: string;
    y: number;
};

export interface InputSeries {
    label: string;
    points: SeriesPoint[];
};

export type CompareModeChart = "yoy" | "custom" | "none";

export interface LineChartSeriesStats {
    selectedVal: number;
    sumWindow: number;
    avgWindow: number;
    deltaPctVsAvg: number;
    deltaAbsVsAvg: number;
    badgeLabel: string;
    pointsUsed: number;
};

export interface LineChartPublicStats {
    granularity: Granularity;
    windowRangeLabel: string;
    pointsInWindow: number;
    main: LineChartSeriesStats | null;
    current: LineChartSeriesStats | null;
    previous: LineChartSeriesStats | null;
    compareCurrentVsPrevious: {
        sumDiff: number;
        pctDiff: number;
    } | null;
};

export interface LineChartProps {
    series: InputSeries[];
    granularity: Granularity;
    title?: string;
    height?: number;
    valueType?: "currency" | "number";
    emphasizeFirst?: boolean;
    onToggleGranularity?: (next: Granularity) => void;

    from?: string;
    to?: string;
    compareMode?: CompareModeChart;
    compareFrom?: string;
    compareTo?: string;

    onStatsChange?: (stats: LineChartPublicStats | null) => void;

    ctxOpenFor: boolean;
    setCtxOpenFor: React.Dispatch<React.SetStateAction<boolean>>;
};

type Stats = LineChartSeriesStats;


// ——————————————————————————————————————————————————————————
// UTILS
// ——————————————————————————————————————————————————————————
const palette = ["#2563eb", "#ef44a2", "#e2d628", "#59af52", "#7c3aed", "#22d3ee"];

const safeKey = (s: string) =>
    s.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

const nfEUR = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
});

const nfNUM = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0 });

/**
 * Formatta un valore Y secondo il tipo richiesto
 * @param v
 * @param type
 * @returns
 */
function fmtY(v: number, type: "currency" | "number") {
    return type === "currency" ? nfEUR.format(v) : nfNUM.format(v);
};

/**
 * Converte una X in timestamp UTC supportando 'YYYY-MM-DD', 'YYYYMMDD', 'YYYYMM'
 * @param x
 * @returns
 */
function parseXToTs(x: string): number {
    if (/^\d{4}-\d{2}-\d{2}$/.test(x)) {
        const [y, m, d] = x.split("-").map(Number);
        return Date.UTC(y, m - 1, d);
    }
    if (/^\d{8}$/.test(x)) {
        const y = Number(x.slice(0, 4));
        const m = Number(x.slice(4, 6));
        const d = Number(x.slice(6, 8));
        return Date.UTC(y, m - 1, d);
    }
    if (/^\d{6}$/.test(x)) {
        const y = Number(x.slice(0, 4));
        const m = Number(x.slice(4, 6));
        return Date.UTC(y, m - 1, 1);
    }
    const t = new Date(x).getTime();
    return Number.isFinite(t) ? t : 0;
}

/**
 * Converte una X in Date (in UTC, tramite timestamp)
 * @param x
 * @returns
 */
function parseXToDate(x: string): Date {
    return new Date(parseXToTs(x));
};

function normalizeDayKey(x: string): string | null {
    const d = parseXToDate(x);
    const t = d.getTime();
    if (!Number.isFinite(t)) return null;
    return format(d, "yyyyMMdd");
}

/**
 * Estrae il mese (1..12) da una X (serve per overlap mensile YoY)
 * @param x
 * @returns
 */
function monthIndexFromX(x: string): number {
    if (/^\d{6}$/.test(x)) return Number(x.slice(4, 6));
    if (/^\d{8}$/.test(x)) return Number(x.slice(4, 6));
    if (/^\d{4}-\d{2}-\d{2}$/.test(x)) return Number(x.slice(5, 7));

    const d = new Date(x);
    const m = d.getUTCMonth();
    if (Number.isNaN(m)) return 1;
    return m + 1;
};

/**
 * Estrae anno e mese da una X generica
 * @param x
 * @returns
 */
function extractYearMonthFromX(x: string): { year: number; month: number } {
    if (/^\d{6}$/.test(x)) {
        return { year: Number(x.slice(0, 4)), month: Number(x.slice(4, 6)) };
    }
    if (/^\d{8}$/.test(x)) {
        return { year: Number(x.slice(0, 4)), month: Number(x.slice(4, 6)) };
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(x)) {
        return { year: Number(x.slice(0, 4)), month: Number(x.slice(5, 7)) };
    }
    const d = parseXToDate(x);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
};

/**
 * Parse ISO con fallback sicuro
 * @param s
 * @returns
 */
function parseIsoSafe(s?: string): Date | null {
    if (!s) return null;
    try {
        const d = parseISO(s);
        return Number.isNaN(d.getTime()) ? null : d;
    } catch {
        return null;
    }
};

/**
 * Padding giornaliero: genera i punti day-by-day da start a end, con y=0 se manca il giorno
 * @param points
 * @param start
 * @param end
 * @returns
 */
function buildDenseDailyPoints(points: SeriesPoint[], start: Date, end: Date): SeriesPoint[] {
    const map = new Map<string, number>();

    for (const p of points) {
        const d = parseXToDate(p.x);
        const key = format(d, "yyyyMMdd");
        map.set(key, (map.get(key) ?? 0) + p.y);
    }

    const result: SeriesPoint[] = [];
    let cur = new Date(start.getTime());
    const endNorm = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    while (cur.getTime() <= endNorm.getTime()) {
        const key = format(cur, "yyyyMMdd");
        result.push({ x: key, y: map.get(key) ?? 0 });
        cur = addDays(cur, 1);
    }

    return result;
};

/**
 * Unisce più serie in un dataset unico (rows), indicizzando per ts e salvando meta per tooltip
 * @param series
 * @param granularity
 * @param overlapMonthYoY
 * @param overlapDayCurrentPrevious
 * @returns
 */
function mergeSeries(
    series: InputSeries[],
    granularity: Granularity,
    overlapMonthYoY: boolean,
    overlapDayCurrentPrevious: boolean
) {
    const map = new Map<number, any>();
    const keys: string[] = [];

    const baseDayTs = Date.UTC(2000, 0, 1);

    for (let i = 0; i < series.length; i++) {
        const s = series[i];
        const k = safeKey(s.label);
        if (!keys.includes(k)) keys.push(k);

        const pts = s.points || [];

        for (let idx = 0; idx < pts.length; idx++) {
            const p = pts[idx];
            let ts: number;

            if (overlapMonthYoY && granularity === "month") {
                const m = monthIndexFromX(p.x);
                ts = Date.UTC(2000, m - 1, 1);
            } else if (overlapDayCurrentPrevious && granularity === "day") {
                ts = baseDayTs + idx * 86400000;
            } else {
                ts = parseXToTs(p.x);
            }

            if (!map.has(ts)) {
                map.set(ts, { ts, __meta: {} as Record<string, { x: string }> });
            }
            const row = map.get(ts);
            row[k] = p.y;
            row.__meta[k] = { x: p.x };
        }
    }

    const rows = Array.from(map.values()).sort((a, b) => a.ts - b.ts);
    return { rows, keys };
};


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * Line chart con supporto a:
 * - granularità day/month
 * - confronto (current/previous o per-anno)
 * - finestra temporale (30/90/180 o 3/6/9/12 mesi)
 * - focus su punto cliccato e statistiche esposte al parent
 * @param props
 * @returns
 */
export const LineChart: React.FC<LineChartProps> = ({
    series,
    granularity,
    title = "Andamento",
    height = 280,
    valueType = "currency",
    emphasizeFirst = true,
    onToggleGranularity,
    from,
    to,
    compareMode = "none",
    compareFrom,
    compareTo,
    onStatsChange,
    ctxOpenFor,
    setCtxOpenFor,
}) => {
    // const [ctxOpenFor, setCtxOpenFor] = useState<any>(null);
    //const ctxMenuRef = useRef<HTMLDivElement>(null);
    const ctxMenuRef = useRef<HTMLDivElement | null>(null);

    /**
     * Prepara le serie in base a granularità e modalità confronto
     * @return InputSeries[]
     */
    const preparedSeries = useMemo<InputSeries[]>(() => {
        if (!Array.isArray(series) || series.length === 0) return [];

        let out: InputSeries[] = series.map((s) => ({
            label: s.label,
            points: Array.isArray(s.points) ? [...s.points] : [],
        }));

        if (granularity === "day") {
            const currentRangeStart = parseIsoSafe(from);
            const currentRangeEnd = parseIsoSafe(to);

            const prevRangeStart = (() => {
                if (compareMode === "custom") return parseIsoSafe(compareFrom);
                if (compareMode === "yoy" && currentRangeStart) return subYears(currentRangeStart, 1);
                return null;
            })();

            const prevRangeEnd = (() => {
                if (compareMode === "custom") return parseIsoSafe(compareTo);
                if (compareMode === "yoy" && currentRangeEnd) return subYears(currentRangeEnd, 1);
                return null;
            })();

            out = out.map((s) => {
                const labelLower = s.label.toLowerCase();
                let start: Date | null = null;
                let end: Date | null = null;

                if (labelLower === "current" && currentRangeStart && currentRangeEnd) {
                    start = currentRangeStart;
                    end = currentRangeEnd;
                } else if (labelLower === "previous" && prevRangeStart && prevRangeEnd) {
                    start = prevRangeStart;
                    end = prevRangeEnd;
                }

                if (!start || !end) {
                    if (!s.points.length) return { ...s, points: [] };
                    const dates = s.points
                        .map((p) => parseXToDate(p.x))
                        .sort((a, b) => a.getTime() - b.getTime());
                    start = dates[0];
                    end = dates[dates.length - 1];
                }

                const dense = buildDenseDailyPoints(s.points, start, end);
                return { ...s, points: dense };
            });
        };

        if (granularity === "month") {
            const fromYear = parseIsoSafe(from)?.getFullYear() ?? null;
            const toYear = parseIsoSafe(to)?.getFullYear() ?? null;
            const compFromYear = parseIsoSafe(compareFrom)?.getFullYear() ?? null;
            const compToYear = parseIsoSafe(compareTo)?.getFullYear() ?? null;

            const mainSpanYears = fromYear != null && toYear != null ? toYear - fromYear + 1 : 1;
            const compSpanYears =
                compFromYear != null && compToYear != null ? compToYear - compFromYear + 1 : 1;

            const shouldSplitByYear =
                (compareMode === "yoy" || compareMode === "custom") &&
                (mainSpanYears > 1 || compSpanYears > 1);

            if (shouldSplitByYear) {
                const splitted: InputSeries[] = [];

                out.forEach((s) => {
                    const byYear = new Map<number, SeriesPoint[]>();

                    for (const p of s.points) {
                        const { year, month } = extractYearMonthFromX(p.x);
                        const arr = byYear.get(year) ?? [];
                        arr.push({
                            x: `${year}${String(month).padStart(2, "0")}`,
                            y: p.y,
                        });
                        byYear.set(year, arr);
                    }

                    Array.from(byYear.entries())
                        .sort(([y1], [y2]) => y1 - y2)
                        .forEach(([year, pts]) => {
                            splitted.push({
                                label: String(year),
                                points: pts.sort((a, b) => a.x.localeCompare(b.x)),
                            });
                        });
                });

                out = splitted;
            };
        };

        return out;
    }, [series, granularity, from, to, compareMode, compareFrom, compareTo]);

    const realPointsMap = useMemo(() => {
        const map: Record<string, Set<string>> = {};
        series.forEach((s) => {
            const key = safeKey(s.label);
            const set = new Set<string>();
            (s.points ?? []).forEach((p) => {
                if (!p?.x) return;
                const norm = normalizeDayKey(p.x);
                if (norm) set.add(norm);
            });
            map[key] = set;
        });
        return map;
    }, [series]);


    const labelsLower = useMemo(
        () => preparedSeries.map((s) => s.label.toLowerCase()),
        [preparedSeries]
    );

    const isDayCurrentPreviousOverlap = useMemo(() => {
        if (granularity !== "day") return false;
        return labelsLower.includes("current") && labelsLower.includes("previous");
    }, [labelsLower, granularity]);

    const isYoYMonthOverlap = useMemo(() => {
        if (granularity !== "month") return false;

        const allYearLabels =
            preparedSeries.length > 1 &&
            preparedSeries.every((s) => /^\d{4}$/.test(s.label.trim()));

        if (allYearLabels) return true;

        return labelsLower.includes("current") && labelsLower.includes("previous");
    }, [preparedSeries, labelsLower, granularity]);

    const isPerYearMode = useMemo(
        () =>
            granularity === "month" &&
            preparedSeries.length > 1 &&
            preparedSeries.every((s) => /^\d{4}$/.test(s.label.trim())),
        [granularity, preparedSeries]
    );

    const allKeys = useMemo(() => preparedSeries.map((s) => safeKey(s.label)), [preparedSeries]);
    const [visible, setVisible] = useState<Record<string, boolean>>(
        () => Object.fromEntries(allKeys.map((k) => [k, true])) as Record<string, boolean>
    ); //toggle visibilità serie

    useEffect(() => {
        setVisible((prev) => {
            const next: Record<string, boolean> = {};
            for (const k of allKeys) next[k] = prev[k] ?? true;
            return next;
        });
    }, [allKeys]);

    const labelByKey = useMemo(() => {
        const m: Record<string, string> = {};
        preparedSeries.forEach((s) => {
            m[safeKey(s.label)] = s.label.toLowerCase();
        });
        return m;
    }, [preparedSeries]);

    const dayWindows: Array<{ label: string; ms: number }> = [
        { label: "30", ms: 30 * 86400000 },
        { label: "90", ms: 90 * 86400000 },
        { label: "180", ms: 180 * 86400000 },
        { label: "Tutto", ms: Infinity },
    ];

    const monthWindows: Array<{ label: string; months: number | "ALL" }> = [
        { label: "3", months: 3 },
        { label: "6", months: 6 },
        { label: "9", months: 9 },
        { label: "12", months: 12 },
        { label: "Tutto", months: "ALL" },
    ];

    const [winIdx, setWinIdx] = useState<number>(granularity === "day" ? 0 : 1); //finestra selezionata
    useEffect(() => {
        setWinIdx(granularity === "day" ? 0 : 1);
    }, [granularity]);

    const { rows: mergedRows, keys } = useMemo(
        () => mergeSeries(preparedSeries, granularity, isYoYMonthOverlap, isDayCurrentPreviousOverlap),
        [preparedSeries, granularity, isYoYMonthOverlap, isDayCurrentPreviousOverlap]
    );

    const filteredRows = useMemo(() => {
        if (!mergedRows.length) return mergedRows;
        const lastTs = mergedRows[mergedRows.length - 1].ts;

        if (granularity === "day") {
            const ms = dayWindows[winIdx]?.ms ?? Infinity;
            if (ms === Infinity) return mergedRows;
            const cutoff = lastTs - ms;
            return mergedRows.filter((r: any) => r.ts >= cutoff);
        }

        const conf = monthWindows[winIdx];
        if (!conf || conf.months === "ALL") return mergedRows;
        return mergedRows.slice(-(conf.months as number));
    }, [mergedRows, winIdx, granularity]);

    const firstFilteredTs = filteredRows.length ? (filteredRows[0].ts as number) : null;

    const windowRangeLabel = useMemo(() => {
        if (!filteredRows.length) return "";

        const firstTs = filteredRows[0].ts as number;
        const lastTs = filteredRows[filteredRows.length - 1].ts as number;

        if (granularity === "day") {
            const ms = dayWindows[winIdx]?.ms ?? Infinity;
            const isAll = ms === Infinity;
            if (isAll) return "";

            if (isDayCurrentPreviousOverlap && firstFilteredTs != null) {
                const daysCount = Math.round((lastTs - firstFilteredTs) / 86400000) + 1;
                return `giorni 1 → ${daysCount}`;
            }

            return `${format(firstTs, "dd/MM/yyyy")} → ${format(lastTs, "dd/MM/yyyy")}`;
        }

        const conf = monthWindows[winIdx];
        const isAll = !conf || conf.months === "ALL";
        if (isAll) return "";

        if (isYoYMonthOverlap) {
            return `${format(firstTs, "MMM")} → ${format(lastTs, "MMM")}`;
        }

        return `${format(firstTs, "MMM yyyy")} → ${format(lastTs, "MMM yyyy")}`;
    }, [
        filteredRows,
        granularity,
        winIdx,
        dayWindows,
        monthWindows,
        isDayCurrentPreviousOverlap,
        firstFilteredTs,
        isYoYMonthOverlap,
    ]);

    const formatDayPosition = useCallback(
        (ts: number, full: boolean) => {
            if (!isDayCurrentPreviousOverlap || firstFilteredTs == null) {
                return full ? format(ts, "dd MMM yyyy") : format(ts, "dd MMM");
            }
            const idx = Math.round((ts - firstFilteredTs) / 86400000) + 1;
            return full ? `Giorno ${idx}` : `g${idx}`;
        },
        [isDayCurrentPreviousOverlap, firstFilteredTs]
    );

    const fmtXTick = useCallback(
        (ts: number) => {
            if (granularity === "day") return formatDayPosition(ts, false);
            if (isYoYMonthOverlap) return format(ts, "MMM");
            return format(ts, "MMM yyyy");
        },
        [granularity, isYoYMonthOverlap, formatDayPosition]
    );

    const firstVisibleKey = useMemo(() => {
        const currentKey = "current";
        if (visible[currentKey] && keys.includes(currentKey)) return currentKey;
        return keys.find((k) => visible[k]);
    }, [keys, visible]);

    const currentKey = useMemo(() => keys.find((k) => labelByKey[k] === "current"), [keys, labelByKey]);
    const previousKey = useMemo(
        () => keys.find((k) => labelByKey[k] === "previous"),
        [keys, labelByKey]
    );

    const [focusTs, setFocusTs] = useState<number | null>(null); //timestamp selezionato nel grafico

    const handleChartClick = (state: any) => {
        const ts =
            typeof state?.activeLabel === "number"
                ? state.activeLabel
                : state?.activePayload?.[0]?.payload?.ts;

        if (typeof ts === "number" && Number.isFinite(ts)) {
            setFocusTs(ts);
        }
    };

    useEffect(() => {
        if (focusTs == null) return;
        const stillThere = filteredRows.some((r: any) => r.ts === focusTs);
        if (!stillThere) setFocusTs(null);
    }, [filteredRows, focusTs]);

    const focusRow = useMemo(
        () => (focusTs == null ? null : filteredRows.find((r: any) => r.ts === focusTs) || null),
        [focusTs, filteredRows]
    );

    const normalizedMetaValue = useCallback(
        (row: any, key: string): string | null => {
            const metaX = row?.__meta?.[key]?.x;
            if (!metaX) return null;
            return normalizeDayKey(metaX);
        },
        []
    );

    const computeStatsForKey = useCallback(
        (key?: string | null, actualXSet?: Set<string> | null): Stats | null => {
            if (!key || filteredRows.length === 0) return null;

            const isAllowedRow = (row: any): boolean => {
                const value = row[key];
                if (typeof value !== "number" || !Number.isFinite(value)) return false;
                if (!actualXSet) return true;
                const normalized = normalizedMetaValue(row, key);
                return !!normalized && actualXSet.has(normalized);
            };

            const vals: number[] = [];
            filteredRows.forEach((row: any) => {
                if (!isAllowedRow(row)) return;
                vals.push(row[key]);
            });

            if (!vals.length) {
                return {
                    selectedVal: 0,
                    sumWindow: 0,
                    avgWindow: 0,
                    deltaPctVsAvg: 0,
                    deltaAbsVsAvg: 0,
                    badgeLabel: granularity === "day" ? "ultimo giorno" : "ultimo mese",
                    pointsUsed: 0,
                };
            }

            const sum = vals.reduce((acc, v) => acc + v, 0);
            const avg = sum / vals.length;

            const getLastValidValue = (): number => {
                for (let i = filteredRows.length - 1; i >= 0; i -= 1) {
                    const row = filteredRows[i];
                    if (!isAllowedRow(row)) continue;
                    return row[key];
                }
                return 0;
            };

            const focusVal = focusRow && isAllowedRow(focusRow) ? focusRow[key] : null;
            const sel = focusVal ?? getLastValidValue();

            const deltaAbs = sel - avg;
            const deltaPct = avg ? (deltaAbs / Math.abs(avg)) * 100 : 0;

            return {
                selectedVal: sel,
                sumWindow: sum,
                avgWindow: avg,
                deltaPctVsAvg: deltaPct,
                deltaAbsVsAvg: deltaAbs,
                badgeLabel: focusRow
                    ? granularity === "day"
                        ? "giorno selezionato"
                        : "mese selezionato"
                    : granularity === "day"
                        ? "ultimo giorno"
                        : "ultimo mese",
                pointsUsed: vals.length,
            };
        },
        [filteredRows, focusRow, granularity, normalizedMetaValue]
    );

    const visibleKeys = useMemo(() => keys.filter((k) => visible[k]), [keys, visible]);

    const computeStatsForKeys = useCallback(
        (keysArr: string[]): Stats | null => {
            if (filteredRows.length === 0) {
                return {
                    selectedVal: 0,
                    sumWindow: 0,
                    avgWindow: 0,
                    deltaPctVsAvg: 0,
                    deltaAbsVsAvg: 0,
                    badgeLabel: granularity === "day" ? "ultimo giorno" : "ultimo mese",
                    pointsUsed: 0,
                };
            }

            const vals: number[] = [];
            filteredRows.forEach((r: any) => {
                keysArr.forEach((k) => {
                    const v = r[k];
                    if (typeof v === "number" && Number.isFinite(v)) vals.push(v);
                });
            });

            if (!vals.length) {
                return {
                    selectedVal: 0,
                    sumWindow: 0,
                    avgWindow: 0,
                    deltaPctVsAvg: 0,
                    deltaAbsVsAvg: 0,
                    badgeLabel: granularity === "day" ? "ultimo giorno" : "ultimo mese",
                    pointsUsed: 0,
                };
            }

            const sum = vals.reduce((acc, v) => acc + v, 0);
            const avg = sum / vals.length;

            const getRowMean = (row: any): number => {
                const rowVals = keysArr
                    .map((k) => row[k])
                    .filter((v: any) => typeof v === "number" && Number.isFinite(v)) as number[];
                if (!rowVals.length) return 0;
                return rowVals.reduce((acc, v) => acc + v, 0) / rowVals.length;
            };

            const sel = focusRow ? getRowMean(focusRow) : getRowMean(filteredRows[filteredRows.length - 1]);

            const deltaAbs = sel - avg;
            const deltaPct = avg ? (deltaAbs / Math.abs(avg)) * 100 : 0;

            return {
                selectedVal: sel,
                sumWindow: sum,
                avgWindow: avg,
                deltaPctVsAvg: deltaPct,
                deltaAbsVsAvg: deltaAbs,
                badgeLabel: focusRow
                    ? granularity === "day"
                        ? "giorno selezionato"
                        : "mese selezionato"
                    : granularity === "day"
                        ? "ultimo giorno"
                        : "ultimo mese",
                pointsUsed: vals.length,
            };
        },
        [filteredRows, focusRow, granularity]
    );

    const mainStats = useMemo(() => {
        if (isPerYearMode) return computeStatsForKeys(visibleKeys);
        const actualSet =
            granularity === "day" && firstVisibleKey && realPointsMap[firstVisibleKey]?.size
                ? realPointsMap[firstVisibleKey]
                : null;
        return computeStatsForKey(firstVisibleKey, actualSet);
    }, [isPerYearMode, computeStatsForKeys, visibleKeys, computeStatsForKey, firstVisibleKey, granularity, realPointsMap]);

    const statsCurrent = useMemo(() => {
        if (!currentKey) return null;
        const actualSet =
            granularity === "day" && realPointsMap[currentKey]?.size
                ? realPointsMap[currentKey]
                : null;
        return computeStatsForKey(currentKey, actualSet);
    }, [computeStatsForKey, currentKey, granularity, realPointsMap]);
    const statsPrevious = useMemo(() => {
        if (!previousKey) return null;
        const actualSet =
            granularity === "day" && realPointsMap[previousKey]?.size
                ? realPointsMap[previousKey]
                : null;
        return computeStatsForKey(previousKey, actualSet);
    }, [computeStatsForKey, previousKey, granularity, realPointsMap]);

    const compareCurrentVsPrevious = useMemo(() => {
        if (!statsCurrent || !statsPrevious) return null;
        const sumDiff = statsCurrent.sumWindow - statsPrevious.sumWindow;
        const pctDiff = statsPrevious.sumWindow
            ? (sumDiff / Math.abs(statsPrevious.sumWindow)) * 100
            : 0;
        return { sumDiff, pctDiff };
    }, [statsCurrent, statsPrevious]);

    useEffect(() => {
        if (!onStatsChange) return;

        const payload: LineChartPublicStats = {
            granularity,
            windowRangeLabel,
            pointsInWindow: filteredRows.length,
            main: mainStats ?? null,
            current: statsCurrent ?? null,
            previous: statsPrevious ?? null,
            compareCurrentVsPrevious,
        };

        onStatsChange(payload);
    }, [
        onStatsChange,
        granularity,
        windowRangeLabel,
        filteredRows.length,
        mainStats,
        statsCurrent,
        statsPrevious,
        compareCurrentVsPrevious,
    ]);

    const baseColors = useMemo(() => {
        const base = [...palette];
        if (emphasizeFirst && keys.length > 0) {
            const idx = keys.indexOf(firstVisibleKey || keys[0]);
            if (idx > 0) [base[0], base[idx]] = [base[idx], base[0]];
        }
        return base;
    }, [keys, firstVisibleKey, emphasizeFirst]);

    const colorForKey = useMemo(() => {
        const map: Record<string, string> = {};
        keys.forEach((k, idx) => {
            const lbl = labelByKey[k];
            if (lbl === "current") map[k] = "#2563eb";
            else if (lbl === "previous") map[k] = "#ef4444";
            else map[k] = baseColors[idx % baseColors.length];
        });
        return map;
    }, [keys, labelByKey, baseColors]);

    /**
     * Gestione toggle granularità
     * @param next "day" | "month"
     */
    const handleToggleGranularity = (next: "day" | "month") => {
        setWinIdx(next === "day" ? 0 : 1);
        onToggleGranularity?.(next);
    };

    // Tour system: disabilitare i filtri durante gli step
    /* TOUR SYSTEM */
    //const per blocco interazioni durante gli step del tour
    const { isOpen, index: tourIndex } = useTour();
    const [userContext] = useUserContext() as any;
    const role = (userContext?.details?.ruolo as Role) ?? "Tester";
    const isAuthorized = role === "Admin" || role === "Dev" || role === "Amministrativo";
    const stepOffset = isAuthorized ? 1 : 0;

    const lockedSteps = new Set([
        14 + stepOffset,
        16 + stepOffset,
    ]);

    const lockInteractions = isOpen && lockedSteps.has(tourIndex);

    //funzione per ignorare la chiusura dei menu contestuali durante il tour    
    type CloseReason = "clickAway" | "escapeKeyDown" | "backdropClick" | "itemClick";
    const shouldIgnoreClose = (reason?: CloseReason) => {
        if (!isOpen) return false;
        // se chiudo da codice (no reason) → NON bloccare
        if (!reason) return false;
        // durante il tour: ignora solo click fuori ed ESC
        return (
            reason === "backdropClick" ||
            reason === "clickAway" ||
            reason === "escapeKeyDown" ||
            reason === "itemClick"
        );
    };

    return (<>
        <FDBox pad="md" radius="lg" fullWidth data-tour="fatturati-charts-lineChart">
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
            <div className="w-full h-full flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs mb-2">{title}</span>
                    <div ref={ctxMenuRef}>
                        <FDIconButton
                            dataTour="fatturati-charts-lineChart-2"
                            variant="text"
                            icon={<IoMdMoreIcon size={20} />} onClick={(e) => {
                                setCtxOpenFor(true);
                                // (ctxMenuRef as React.MutableRefObject<HTMLElement | null>).current = e.currentTarget as HTMLElement;
                            }} aria-label="Toggle Granularity" />
                    </div>
                </div>

                <div className="w-full flex-1" style={{ minHeight: height }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <ReLineChart
                            data={filteredRows}
                            margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
                            onClick={handleChartClick}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="ts"
                                tickFormatter={fmtXTick}
                                tick={{ fontSize: 12, fill: "#4B5563" }}
                                axisLine={false}
                                tickLine={false}
                                dy={8}
                                type="number"
                                domain={["dataMin", "dataMax"]}
                            />
                            <YAxis
                                tick={{ fontSize: 12, fill: "#4B5563" }}
                                tickFormatter={(v: number) => fmtY(v, valueType)}
                                axisLine={false}
                                tickLine={false}
                                width={80}
                            />

                            <ReTooltip
                                cursor={{ stroke: "#9CA3AF", strokeDasharray: "4 4" }}
                                content={({ active, payload }: any) => {
                                    if (!active || !payload?.length) return null;
                                    const row = payload[0]?.payload || {};
                                    const ts = row.ts as number;
                                    const meta = row.__meta as
                                        | Record<string, { x: string }>
                                        | undefined;

                                    const header =
                                        granularity === "day"
                                            ? formatDayPosition(ts, true)
                                            : isYoYMonthOverlap
                                                ? format(ts, "MMM")
                                                : format(ts, "MMM yyyy");

                                    const showSeriesDate =
                                        granularity === "day" && isDayCurrentPreviousOverlap;

                                    return (
                                        <div className="bg-gray-900 text-white text-sm rounded-lg p-2 pointer-events-none min-w-[220px]">
                                            <div className="opacity-70 mb-1">{header}</div>

                                            <div className="flex flex-col gap-1">
                                                {preparedSeries.map((s) => {
                                                    const k = safeKey(s.label);
                                                    if (!visible[k]) return null;
                                                    const val = row[k];
                                                    if (typeof val !== "number") return null;

                                                    const color = colorForKey[k] || "#ffffff";

                                                    let dateLabel: string | null = null;
                                                    if (showSeriesDate && meta && meta[k]?.x) {
                                                        const d = parseXToDate(meta[k].x);
                                                        dateLabel = format(d, "dd/MM/yyyy");
                                                    }

                                                    return (
                                                        <div
                                                            key={k}
                                                            className="flex items-center justify-between gap-3"
                                                        >
                                                            <span className="flex flex-col">
                                                                <span className="flex items-center gap-2">
                                                                    <span
                                                                        style={{
                                                                            display: "inline-block",
                                                                            width: 8,
                                                                            height: 8,
                                                                            borderRadius: 999,
                                                                            background: color,
                                                                        }}
                                                                    />
                                                                    {s.label}
                                                                </span>

                                                                {dateLabel && (
                                                                    <span className="text-[11px] opacity-80 ml-4">
                                                                        {dateLabel}
                                                                    </span>
                                                                )}
                                                            </span>

                                                            <span className="font-semibold">
                                                                {fmtY(val, valueType)}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                }}
                            />

                            {preparedSeries.map((s) => {
                                const k = safeKey(s.label);
                                if (!visible[k]) return null;

                                const lbl = s.label.toLowerCase();
                                const stroke = colorForKey[k] || "#8884d8";
                                const isPrevious = lbl === "previous";

                                return (
                                    <Line
                                        key={k}
                                        type="monotone"
                                        dataKey={k}
                                        dot={false}
                                        stroke={stroke}
                                        strokeWidth={2}
                                        strokeDasharray={isPrevious ? "4 4" : undefined}
                                        strokeOpacity={isPrevious ? 0.9 : 1}
                                        isAnimationActive={false}
                                    />
                                );
                            })}

                            {focusRow && (
                                <ReferenceLine
                                    x={focusRow.ts}
                                    stroke="#6b7280"
                                    strokeDasharray="4 4"
                                    ifOverflow="visible"
                                />
                            )}
                        </ReLineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </FDBox>

        <ContextMenu
            data-tour="fatturati-charts-lineChart-3"
            // openFor={!!ctxOpenFor}
            openFor={ctxOpenFor}
            pos={ctxMenuRef}
            onClose={(_e?: any, reason?: CloseReason) => {
                if (shouldIgnoreClose(reason)) return;
                setCtxOpenFor(false);
            }}
            // onClose={() => setCtxOpenFor(null)}
            placement="auto"
            panel={<div className="space-y-4 max-w-xs">
                <div>
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
                    <h2 className="text-sm">Anni</h2>
                    <p className="text-xs mb-2 text-gray-500">Anni presi in considerazione e mostrati sul grafico</p>
                    <div className="flex items-center justify-start w-full gap-1">
                        {preparedSeries.map((s) => {
                            const k = safeKey(s.label);
                            const active = !!visible[k];
                            return (
                                <FDButton
                                    key={k}
                                    onClick={() => preparedSeries.length > 1 && setVisible((v) => ({ ...v, [k]: !v[k] }))}
                                    variant="solid"
                                    color="primary"
                                    className={!active ? "!bg-gray-800 !text-gray-500" : ""}
                                    size="small"
                                    radius="xl"
                                >
                                    {s.label}
                                </FDButton>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <h2 className="text-sm">Asse Temporale</h2>
                    <p className="text-xs mb-2 text-gray-500">Lasso temporale usato e mostrato su ogni punto del grafico (asse temporale)</p>
                    <div className="space-x-1">
                        <FDButton
                            color="primary"
                            className={granularity !== "day" ? "!bg-gray-800 !text-gray-500" : ""}
                            size="small"
                            radius="xl"
                            onClick={() => handleToggleGranularity("day")}
                        >
                            Giorno
                        </FDButton>

                        <FDButton
                            className={granularity !== "month" ? "!bg-gray-800 !text-gray-500" : ""}
                            color="primary"
                            size="small"
                            radius="xl"
                            onClick={() => handleToggleGranularity("month")}
                        >
                            Mese
                        </FDButton>
                    </div>
                </div>


                {/* Settings periodo Temporale Selezionato */}
                <div className="flex flex-col my-3">
                    <h2 className="text-sm">Periodo</h2>
                    <p className="text-xs mb-2 text-gray-500">Arco temporale attualmente in visualizzazione</p>
                    <div className="flex gap-1">
                        {focusRow && (
                            <FDIconButton
                                onClick={() => setFocusTs(null)}
                                icon={IoArrowBackCircleOutline({ size: 18 })}
                                dataTooltipContent="Pulisci focus"
                                dataTooltipId="fatturati-tooltip"
                                size="small"
                            />
                        )}

                        {(granularity === "day" ? dayWindows : monthWindows).map((w, i) => (
                            <FDButton
                                key={w.label}
                                onClick={() => setWinIdx(i)}
                                variant="solid"
                                color={"primary"}
                                className={i !== winIdx ? "!bg-gray-800 !text-gray-500" : ""}
                                size="small"
                                radius="xl"
                                dataTooltipContent={granularity === "day" ? "Giorni" : "Mesi"}
                                dataTooltipId="fatturati-tooltip"
                            >
                                {w.label}
                            </FDButton>
                        ))}
                    </div>

                    {windowRangeLabel && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Intervallo: {windowRangeLabel}
                        </div>
                    )}
                </div>
            </div>}
        />
    </>
    );
};

export default LineChart;