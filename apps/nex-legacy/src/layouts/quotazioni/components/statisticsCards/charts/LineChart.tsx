import {
    CartesianGrid,
    Legend,
    Line,
    LineChart as ReLineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

type DailyPoint = { date?: string; count?: number };

interface LineChartProps {
    kpi?: any;
    height?: number;
    labelCurrent?: string;
    labelPrevious?: string;
    isCollapsed?: boolean;
}

const toInt = (v: any) => {
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? Math.trunc(n) : 0;
};

const getDay = (iso?: string) => {
    if (!iso) return null;
    const d = new Date(iso);
    const day = d.getDate();
    return Number.isFinite(day) ? day : null;
};

const pickSeries = (kpi: any, keys: string[]): DailyPoint[] => {
    for (const k of keys) {
        const v = kpi?.[k];
        if (Array.isArray(v)) return v as DailyPoint[];
    }
    return [];
};

const buildDayMap = (series: DailyPoint[]) => {
    const map: Record<number, number> = {};
    for (const p of series) {
        const day = getDay(p?.date);
        if (!day || day < 1 || day > 31) continue;
        map[day] = (map[day] ?? 0) + toInt(p?.count);
    }
    return map;
};

export function LineChart({
    kpi,
    height = 140,
    labelCurrent = "Mese corrente",
    labelPrevious = "Mese precedente",
    isCollapsed = false,
}: LineChartProps) {
    const currentSeries = pickSeries(kpi, [
        "seriesDaily",
        "dailySeries",
        "series",
        "currentSeriesDaily",
        "currentDailySeries",
    ]);

    const previousSeries = pickSeries(kpi, [
        "prevSeriesDaily",
        "previousSeriesDaily",
        "seriesDailyPrev",
        "prevDailySeries",
        "previousDailySeries",
    ]);

    const currMap = buildDayMap(currentSeries);
    const prevMap = buildDayMap(previousSeries);

    const data = Array.from({ length: 31 }, (_, i) => {
        const day = i + 1;
        return {
            day,
            current: currMap[day] ?? 0,
            previous: prevMap[day] ?? 0,
        };
    });

    const CompactTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null;

        const findVal = (key: string) => {
            const p = payload.find((x: any) => x?.dataKey === key);
            return toInt(p?.value);
        };

        const vCurr = findVal("current");
        const vPrev = findVal("previous");

        return (
            <div
                className="rounded-md px-2 py-1 text-xs shadow"
                style={{
                    background: "rgba(0,0,0,0.75)",
                    color: "#fff",
                    pointerEvents: "none",
                    maxWidth: 200,
                }}
            >
                <div className="font-semibold">Giorno {label}</div>
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between gap-3">
                        <span className="opacity-90">{labelCurrent}</span>
                        <span className="font-semibold">{vCurr}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <span className="opacity-90">{labelPrevious}</span>
                        <span className="font-semibold">{vPrev}</span>
                    </div>
                </div>
            </div>
        );
    };

    if (isCollapsed) {
        return <div className="w-full" style={{ height: 0 }} />;
    }

    return (
        <div className="w-full" style={{ height }}>
            <ResponsiveContainer width="95%" height="100%" className="mx-auto">
                <ReLineChart
                    data={data}
                    margin={{ top: 4, right: 6, left: -16, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis
                        dataKey="day"
                        height={18}
                        tick={{ fontSize: 10 }}
                        tickMargin={2}
                    />

                    <YAxis
                        width={28}
                        tick={{ fontSize: 10 }}
                        allowDecimals={false}
                    />

                    <Tooltip
                        content={<CompactTooltip />}
                        cursor={false}
                        position={{ x: 8, y: 8 }}
                        wrapperStyle={{ outline: "none" }}
                    />

                    <Legend
                        iconSize={12}
                        wrapperStyle={{
                            fontSize: 15,
                            lineHeight: "18px",
                            paddingTop: 0,
                            marginTop: -2,
                        }}
                    />

                    <Line
                        type="monotone"
                        dataKey="current"
                        name={labelCurrent}
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={false}
                    />
                    <Line
                        type="monotone"
                        dataKey="previous"
                        name={labelPrevious}
                        stroke="#f97316"
                        strokeWidth={2}
                        dot={false}
                    />
                </ReLineChart>
            </ResponsiveContainer>
        </div>
    );
}

export default LineChart;