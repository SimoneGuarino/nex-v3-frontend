// src/components/AggregateStockStats.tsx
import React, { useMemo } from 'react';
import { StatCard } from './StatCard';
import { format } from 'date-fns';
import { Variation } from '..';

interface Props { data: Variation[]; }

export const AggregateStockStats: React.FC<Props> = ({ data }) => {
  const sorted = [...data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const stocks = sorted.map(d => d.disponibilita);
  const dates = sorted.map(d => new Date(d.timestamp));
  const avg = useMemo(() => stocks.reduce((sum, v) => sum + v, 0) / stocks.length, [stocks]);
  const min = Math.min(...stocks), max = Math.max(...stocks);
  const minDate = dates[stocks.indexOf(min)], maxDate = dates[stocks.indexOf(max)];

  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
      <StatCard title="Stock Medio" value={`${avg.toFixed(0)}`} />
      <StatCard
        title="Stock Min"
        value={`${min}`}
        subtitle={format(minDate, 'dd/MM/yyyy')}
      />
      <StatCard
        title="Stock Max"
        value={`${max}`}
        subtitle={format(maxDate, 'dd/MM/yyyy')}
      />
    </div>
  );
};
