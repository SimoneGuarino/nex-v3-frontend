import React, { useMemo } from 'react';
import { EnhancedStatCard } from './EnhancedStatCard';
import { Variation } from '..';

interface Props { data: Variation[]; }

export const CoverageAndLeadTime: React.FC<Props> = ({ data }) => {
    const sorted = [...data].sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp));
    const stocks = sorted.map(d => d.disponibilita);
    const times = sorted.map(d => new Date(d.timestamp).getTime());
    const n = stocks.length;

    // giorni di copertura
    const coverage = useMemo(() => {
        const days = (times[n - 1] - times[0]) / (1000 * 60 * 60 * 24);
        const consumption = (stocks[0] - stocks[n - 1]) / days || 1;
        return stocks[n - 1] / consumption;
    }, [stocks, times, n]);

    // lead time medio in ore
    const leadTime = useMemo(() => {
        let sum = 0;
        for (let i = 1; i < n; i++) {
            sum += (times[i] - times[i - 1]) / (1000 * 60 * 60);
        }
        return sum / (n - 1);
    }, [times, n]);

    return (
        <div className="max-w-4xl mx-auto rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <EnhancedStatCard
                title="Giorni Copertura"
                value={`${coverage.toFixed(1)} gg`}
                subtitle={`Ultime ${n} variazioni`}
                positive={coverage >= 0}
                borderColorKey="primary"
                description="Stima dei giorni residui di stock, calcolata dividendo la disponibilità attuale per il consumo medio giornaliero."
            />

            <EnhancedStatCard
                title="Lead Time"
                value={`${leadTime.toFixed(1)} h`}
                subtitle={`Media su ${n - 1} intervalli`}
                positive={leadTime <= 24}
                borderColorKey={leadTime <= 24 ? 'success' : 'warning'}
                description="Tempo medio (in ore) intercorrente tra due rilevazioni consecutive: misura la frequenza di aggiornamento dei dati."
            />
        </div>
    );
};
