// src/components/AggregatePriceStats.tsx
import React, { useMemo } from 'react';
import { StatCard } from './StatCard';
import { format } from 'date-fns';
import { Variation } from '..';

interface Props { data: Variation[]; }

export const AggregatePriceStats: React.FC<Props> = ({ data }) => {
  const sorted = [...data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const prices = sorted.map(d => d.prezzo);
  const dates = sorted.map(d => new Date(d.timestamp));
  const avg = useMemo(() => prices.reduce((sum, v) => sum + v, 0) / prices.length, [prices]);
  const min = Math.min(...prices), max = Math.max(...prices);
  const minDate = dates[prices.indexOf(min)], maxDate = dates[prices.indexOf(max)];

  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
      <StatCard title="Prezzo Medio" value={`€${avg.toFixed(2)}`} />
      <StatCard
        title="Prezzo Min"
        value={`€${min.toFixed(2)}`}
        subtitle={format(minDate, 'dd/MM/yyyy')}
      />
      <StatCard
        title="Prezzo Max"
        value={`€${max.toFixed(2)}`}
        subtitle={format(maxDate, 'dd/MM/yyyy')}
      />
    </div>
  );
};
