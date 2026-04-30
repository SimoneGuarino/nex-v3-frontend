// src/components/TrendChart.tsx
import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { format, subDays } from 'date-fns';

type RangeKey = '10D' | '20D' | '30D';
interface RawPoint {
  timestamp: number;
  prezzo: number;
  disponibilita: number;
}

interface TrendChartProps {
  data: RawPoint[]; // array di tutti i punti ordinati per timestamp
}

const ranges: Record<RangeKey, { days: number; format: string }> = {
  '10D': { days: 10, format: 'dd/MM' },
  '20D': { days: 20, format: 'dd/MM' },
  '30D': { days: 30, format: 'dd/MM' },
};

export const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  const [range, setRange] = useState<RangeKey>('10D');

  // Filtra e mappa i dati negli ultimi X giorni
  const filtered = useMemo(() => {
    const cutoff = subDays(Date.now(), ranges[range].days).valueOf();
    return data
      .filter((d) => d.timestamp >= cutoff)
      .map((d) => ({
        ...d,
        giorno: format(d.timestamp, ranges[range].format),
      }));
  }, [data, range]);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">Trend Storico</h3>
        <div className="space-x-2">
          {(Object.keys(ranges) as RangeKey[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-sm font-medium rounded-full border transition
                ${r === range
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full h-64">
        <ResponsiveContainer>
          <ComposedChart data={filtered} margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradPrezzo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradDisp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis dataKey="giorno" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#4B5563' }} />
            <YAxis
              yAxisId="left"
              orientation="left"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#4B5563' }}
              tickFormatter={(v) => `€${v}`}
              width={60}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#4B5563' }}
              tickFormatter={(v) => v.toString()}
              width={40}
            />

            <Tooltip
              contentStyle={{ borderRadius: 8 }}
              formatter={(value: any, name: any) =>
                name === 'prezzo'
                  ? [`€${value.toFixed(2)}`, 'Prezzo']
                  : [value, 'Disponibilità']
              }
            />
            <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 10 }} />

            <Area
              yAxisId="left"
              type="monotone"
              dataKey="prezzo"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#gradPrezzo)"
              name="Prezzo"
              isAnimationActive={false}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="disponibilita"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#gradDisp)"
              name="Disponibilità"
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
