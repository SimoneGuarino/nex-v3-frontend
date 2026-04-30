import {
    Bar,
    BarChart as ReBarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

export type BarPoint = { label: string; value: number };

interface BarChartProps {
    data?: BarPoint[];
    height?: number;
    labelMaxLen?: number;
    valueFormatter?: (v: number) => string;
}

const toNum = (v: any) => {
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
};

export function BarChart({
    data = [],
    height = 140,
    valueFormatter,
}: BarChartProps) {
    const CompactTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null;

        const v = toNum(payload?.[0]?.value);
        const txt = valueFormatter
            ? valueFormatter(v)
            : new Intl.NumberFormat("it-IT").format(v);

        return (
            <div
                className="rounded-md px-2 py-1 text-xs shadow"
                style={{
                    background: "rgba(0,0,0,0.75)",
                    color: "#fff",
                    pointerEvents: "none",
                    maxWidth: 260,
                }}
            >
                <div className="font-semibold">{label}</div>
                <div className="opacity-90">{txt}</div>
            </div>
        );
    };

    return (
        <div className="w-full" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <ReBarChart
                    data={data}
                    barCategoryGap={6}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="category" dataKey="label" hide />

                    <YAxis
                        type="number"
                        tick={{ fontSize: 11 }}
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        width={40}
                    />

                    <Tooltip
                        content={<CompactTooltip />}
                        cursor={false}
                        wrapperStyle={{ outline: "none" }}
                    />

                    <Bar
                        dataKey="value"
                        radius={[4, 4, 4, 4]}
                        fill="hsl(var(--bar))"
                        className="[--bar:221_83%_53%] dark:[--bar:217_91%_60%]"
                    />
                </ReBarChart>
            </ResponsiveContainer>
        </div>
    );
}

export default BarChart;
