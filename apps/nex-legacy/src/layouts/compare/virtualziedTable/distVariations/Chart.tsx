import React, { useState, useMemo } from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip as ReTooltip,
} from 'recharts';
import { format, parseISO, subDays, startOfDay } from 'date-fns';
import { Button } from '@mui/material';
import { Variation } from '.';

interface ChartProps {
    data: Variation[];
    productName: string;
}

type DayOption = 10 | 20 | 30;
type MetricOption = 'prezzo' | 'disponibilita';

export const GeneralChart: React.FC<ChartProps> = ({ data, productName }) => {
    const [days, setDays] = useState<DayOption>(10);
    const [metric, setMetric] = useState<MetricOption>('prezzo');

    // Compute UTC midnight of today
    const todayUtcMidnight = useMemo(() => {
        const now = new Date();
        return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    }, []);

    // Filter last N days of data
    const filtered = useMemo(() => {
        const cutoff = subDays(todayUtcMidnight, days);
        return data
            .map(d => ({
                ...d,
                ts: parseISO(d.timestamp).getTime(),
            }))
            .filter((d: any) => d.ts >= cutoff)
            .sort((a, b) => a.ts - b.ts);
    }, [data, days, todayUtcMidnight]);

    // Build chart data
    const chartData = useMemo(
        () => filtered.map(d => ({ x: d.ts, y: Math.round(d[metric]) })),
        [filtered, metric]
    );

    // Compute change
    const first = chartData[0]?.y ?? 0;
    const last = chartData[chartData.length - 1]?.y ?? 0;
    const delta = last - first;
    const pct = first ? (delta / first) * 100 : 0;
    const positive = delta >= 0;

    // Colors
    const lineColor = positive ? '#22c55e' : '#ef4444';

    return (
        <div className="col-span-3">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-300">{productName}</h3>
                    <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        {metric === 'prezzo' ? '€' + last.toLocaleString() : last.toLocaleString() + ' pz'}
                    </div>
                    <div className="!mt-1 flex items-center gap-1">
                        <span className={`inline-block !px-2 !py-0.5 rounded-full text-xs font-medium ${positive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                            }`}>
                            {positive && '+'}{pct.toFixed(1)}%
                        </span>
                        <span className="ml-2 text-sm text-gray-500">vs {days} giorni fa</span>
                    </div>
                </div>

                {/* Metric Switch */}
                <div className="flex space-x-2 gap-1">
                    {(['prezzo', 'disponibilita'] as MetricOption[]).map(opt => (
                        <Button
                            key={opt}
                            onClick={() => setMetric(opt)}
                            className={`!px-3 !py-1 !text-sm !rounded-full transition ${metric === opt
                                ? '!bg-gray-500 !text-white'
                                : '!bg-white dark:!bg-neutral-800 !text-neutral-700'
                                }`}
                        >
                            {opt === 'prezzo' ? 'Prezzo' : 'Disponibilità'}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Timeframe Switch */}
            <div className="flex justify-end mb-4 space-x-2 gap-1">
                {([10, 20, 30] as DayOption[]).map(d => (
                    <Button
                        key={d}
                        onClick={() => setDays(d)}
                        className={`!px-3 !py-1 !text-sm !rounded-full transition ${days === d
                            ? '!bg-gray-500 !text-white'
                            : '!bg-white dark:!bg-neutral-800 !text-neutral-700'
                            }`}
                    >
                        {d}gg
                    </Button>
                ))}
            </div>

            {/* Chart */}
            <div className="!w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
                                <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="x"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: '#4B5563' }}
                            dy={8}
                            tickFormatter={ts => format(ts as number, 'dd MMM')}
                        />
                        <YAxis
                            dataKey="y"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#4B5563' }}
                            tickFormatter={v =>
                                metric === 'prezzo' ? `€${v.toLocaleString()}` : v.toLocaleString()
                            }
                            width={60}
                        />
                        <ReTooltip
                            cursor={false}
                            content={({ active, payload, label }: any) => {
                                if (!active || !payload?.length) return null;
                                const { y } = payload[0].payload;
                                return (
                                    <div className="bg-gray-900 text-white text-sm rounded-lg !p-2 pointer-events-none">
                                        <div className="opacity-75">{format(label as number, 'dd MMM yyyy')}</div>
                                        <div className="font-semibold">
                                            {metric === 'prezzo' ? '€' : ''}{y.toLocaleString()}
                                        </div>
                                    </div>
                                );
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="y"
                            stroke={lineColor}
                            strokeWidth={2}
                            fill="url(#grad)"
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
