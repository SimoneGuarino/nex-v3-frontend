import React, { useMemo } from 'react';
import { StatCard } from './StatCard';
import { Variation } from '..';

interface Props { data: Variation[]; }

export const TrendAndVolatility: React.FC<Props> = ({ data }) => {
  const sorted = [...data].sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp));
  const prices = sorted.map(d => d.prezzo);
  const times = sorted.map(d => new Date(d.timestamp).getTime());
  const n = prices.length;

  // Slope (€/gg): (last-first)/(days)
  const slope = useMemo(() => {
    const deltaY = prices[n - 1] - prices[0];
    const deltaT = (times[n - 1] - times[0]) / (1000 * 60 * 60 * 24);
    return deltaY / deltaT;
  }, [prices, times, n]);

  // Volatility = std dev
  const volatility = useMemo(() => {
    const mean = prices.reduce((a, b) => a + b, 0) / n;
    const variance = prices.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
    return Math.sqrt(variance);
  }, [prices, n]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <StatCard
        title="Trend Prezzo"
        value={`${slope.toFixed(2)} €/gg`}
        positive={slope >= 0}
        borderColorKey={slope >= 0 ? 'success' : 'error'}
      />
      <StatCard
        title="Volatilità Prezzo"
        value={`€${volatility.toFixed(2)}`}
      />
    </div>
  );
};
