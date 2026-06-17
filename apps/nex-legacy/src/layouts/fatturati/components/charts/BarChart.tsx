import React, { useMemo, useState } from "react";
import {
    Bar,
    BarChart as ReBarChart,
    CartesianGrid,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip as ReTooltip,
    YAxis,
} from "recharts";
import { FDSelect, type FDSelectOption, FDBox } from "@nex/fd-ui";


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
export interface BreakdownItem {
    code: string;
    label: string;
    qta: number;
    revenue: number;
    profit: number;
    marginPct: number;
}

export interface BreakdownTotals {
    qta: number;
    revenue: number;
    profit: number;
    marginPct: number;
}

export interface BreakdownBarChartProps {
    items: any[];
    totals?: BreakdownTotals | any;
    title?: string;
    height?: number;
    maxItems?: number;
}

type TopValue = 3 | 5 | 10 | 20 | "ALL";
type BreakdownSort = "-revenue" | "-qta" | "-profit" | "-marginPct";


// ——————————————————————————————————————————————————————————
// UTILS
// ——————————————————————————————————————————————————————————
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

const TOP_OPTIONS: FDSelectOption<TopValue>[] = [
    { value: 3, label: "Top 3" },
    { value: 5, label: "Top 5" },
    { value: 10, label: "Top 10" },
    { value: 20, label: "Top 20" },
    { value: "ALL", label: "Tutti" },
];

const SORT_OPTIONS: FDSelectOption<BreakdownSort>[] = [
    { value: "-revenue", label: "Ordina per fatturato" },
    { value: "-qta", label: "Ordina per quantità" },
    { value: "-profit", label: "Ordina per utile" },
    { value: "-marginPct", label: "Ordina per margine %" },
];

/**
 * Normalizza un item del breakdown nel formato del grafico
 * @param raw
 * @returns
 */
function normalizeItem(raw: any): BreakdownItem {
    const code = String(raw.code ?? raw.CODE ?? "").trim();
    const labelRaw = raw.label ?? raw.LABEL ?? "";
    const label = String(labelRaw ?? "").trim();

    return {
        code,
        label,
        qta: Number(raw.qta ?? raw.QTA ?? 0),
        revenue: Number(raw.revenue ?? raw.REVENUE ?? 0),
        profit: Number(raw.profit ?? raw.PROFIT ?? 0),
        marginPct: Number(raw.marginPct ?? raw.MARGINPCT ?? 0),
    };
}

/**
 * Normalizza i totali del breakdown nel formato del grafico
 * @param raw
 * @returns
 */
function normalizeTotals(raw: any | undefined | null): BreakdownTotals | null {
    if (!raw) return null;
    return {
        qta: Number(raw.qta ?? raw.QTA ?? 0),
        revenue: Number(raw.revenue ?? raw.REVENUE ?? 0),
        profit: Number(raw.profit ?? raw.PROFIT ?? 0),
        marginPct: Number(raw.marginPct ?? raw.MARGINPCT ?? 0),
    };
}

/**
 * Estrae la chiave di sort dal valore (es. "-revenue" -> "revenue")
 * @param sortValue
 * @returns
 */
function getSortKey(sortValue: BreakdownSort): "revenue" | "qta" | "profit" | "marginPct" {
    return (sortValue.startsWith("-") ? sortValue.slice(1) : sortValue) as
        | "revenue"
        | "qta"
        | "profit"
        | "marginPct";
}


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * Grafico breakdown: barre (fatturato/utile) + linea (margine %) con topN e sort locali
 * @param props
 * @returns
 */
const BreakdownBarChart: React.FC<BreakdownBarChartProps> = ({
    items,
    totals,
    title = "Breakdown",
    height = 280,
    maxItems,
}) => {
    const [topValue, setTopValue] = useState<TopValue>(() => {
        const allowed: TopValue[] = [3, 5, 10, 20];
        if (maxItems && allowed.includes(maxItems as TopValue)) {
            return maxItems as TopValue;
        }
        return "ALL";
    }); //numero di righe mostrate nel grafico

    const [sortValue, setSortValue] = useState<BreakdownSort>("-revenue"); //ordinamento locale del breakdown

    const normalizedAll = useMemo(
        () => (Array.isArray(items) ? items.map(normalizeItem) : []),
        [items]
    );

    const sortedAll = useMemo(() => {
        const arr = [...normalizedAll];
        const sortKey = getSortKey(sortValue);
        const desc = sortValue.startsWith("-");

        arr.sort((a, b) => {
            const av = Number(a[sortKey] ?? 0);
            const bv = Number(b[sortKey] ?? 0);
            return desc ? bv - av : av - bv;
        });

        return arr;
    }, [normalizedAll, sortValue]);

    const data = useMemo(() => {
        if (topValue === "ALL") return sortedAll;
        return sortedAll.slice(0, topValue);
    }, [sortedAll, topValue]);

    const normTotals = useMemo(() => normalizeTotals(totals), [totals]);

    return (
        <FDBox pad="md" fullWidth radius="lg" className="flex flex-col" data-tour="fatturati-charts-barChart">
            <div className="flex items-start justify-between mb-3 gap-2">
                <div className="flex flex-col gap-1">
                    <h3 className="text-xs mb-2">
                        {title}
                    </h3>

                    {normTotals && (
                        <div className="flex flex-wrap items-start space-x-5 space-y-2 mb-4">
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-500">Fatturato totale</span>
                                <span className="text-sm font-semibold">
                                    {nfEUR.format(normTotals.revenue)}
                                </span>
                            </div>

                            <div className="flex flex-col">
                                <span className="text-xs text-gray-500">Utile totale</span>
                                <span className="text-sm font-semibold">
                                    {nfEUR.format(normTotals.profit)}
                                </span>
                            </div>

                            <div className="flex flex-col">
                                <span className="text-xs text-gray-500">Margine % medio</span>
                                <span className="text-sm font-semibold">
                                    {nfPCT.format(normTotals.marginPct)}%
                                </span>
                            </div>

                            <div className="flex flex-col">
                                <span className="text-xs text-gray-500">Q.tà totale</span>
                                <span className="text-sm font-semibold">
                                    {nfNUM.format(normTotals.qta)}
                                </span>
                            </div>
                        </div>
                    )}

                    {data.length > 0 && (
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {topValue === "ALL"
                                ? `Mostrati ${data.length} elementi`
                                : `Mostrati i primi ${data.length}`}
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-end gap-1 min-w-[180px]">
                    <FDSelect
                        options={TOP_OPTIONS}
                        value={topValue}
                        onChange={(v) => setTopValue(v as TopValue)}
                        size="xs"
                        fullWidth
                        clearable={false}
                        radius="md"
                    />

                    <FDSelect
                        options={SORT_OPTIONS}
                        value={sortValue}
                        onChange={(v) => setSortValue(v as BreakdownSort)}
                        size="xs"
                        fullWidth
                        clearable={false}
                        radius="md"
                    />
                </div>
            </div>

            <div className="w-full flex-1" style={{ minHeight: height }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart data={data} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />

                        <YAxis
                            yAxisId="left"
                            tick={{ fontSize: 12, fill: '#4B5563' }}
                            tickFormatter={(v: number) => nfEUR.format(v)}
                            axisLine={false}
                            tickLine={false}
                            width={80}
                        />

                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fontSize: 12, fill: "#4B5563" }}
                            tickFormatter={(v: number) => `${nfPCT.format(v)}%`}
                            axisLine={false}
                            tickLine={false}
                            width={60}
                        />

                        <ReTooltip
                            content={({ active, payload }: any) => {
                                if (!active || !payload?.length) return null;
                                const row = payload[0]?.payload || {};

                                const code = row.code ? String(row.code).trim() : "";
                                const label = row.label ? String(row.label).trim() : "";

                                const header =
                                    code && label && label !== code
                                        ? `${code} - ${label}`
                                        : label || code || "";

                                return (
                                    <div className="bg-gray-900 text-white text-sm rounded-lg p-2 pointer-events-none min-w-[200px]">
                                        {header && (
                                            <div className="opacity-70 mb-1">{header}</div>
                                        )}

                                        <div className="flex flex-col gap-1">
                                            <div className="flex justify-between">
                                                <span>Fatturato</span>
                                                <span className="font-semibold">
                                                    {nfEUR.format(row.revenue || 0)}
                                                </span>
                                            </div>

                                            <div className="flex justify-between">
                                                <span>Utile</span>
                                                <span className="font-semibold">
                                                    {nfEUR.format(row.profit || 0)}
                                                </span>
                                            </div>

                                            <div className="flex justify-between">
                                                <span>Margine %</span>
                                                <span className="font-semibold">
                                                    {nfPCT.format(row.marginPct || 0)}%
                                                </span>
                                            </div>

                                            <div className="flex justify-between">
                                                <span>Quantità</span>
                                                <span className="font-semibold">
                                                    {nfNUM.format(row.qta || 0)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }}
                        />

                        <Legend wrapperStyle={{ fontSize: "11px" }} />

                        <Bar yAxisId="left" dataKey="revenue" name="Fatturato" barSize={20} fill="#6fa832" />
                        <Bar yAxisId="left" dataKey="profit" name="Utile" barSize={20} fill="#a8a632" />

                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="marginPct"
                            name="Margine %"
                            dot={false}
                            strokeWidth={2}
                        />
                    </ReBarChart>
                </ResponsiveContainer>
            </div>
        </FDBox>
    );
};

export default BreakdownBarChart;
