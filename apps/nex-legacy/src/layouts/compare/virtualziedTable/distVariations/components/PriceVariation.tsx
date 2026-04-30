// src/components/PriceVariationBox.tsx
import React, { useMemo } from 'react';
import { useTheme, Box, Divider, Typography } from '@mui/material';
import { EnhancedStatCard, SubtitleNode } from './EnhancedStatCard';
import { Variation } from '..';

interface PriceVariationCardProps {
    data: Variation[];
}

export const PriceVariationCard: React.FC<PriceVariationCardProps> = ({ data }) => {
    const theme = useTheme();

    const lastFour = useMemo(
        () =>
            [...data]
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                .slice(-4),
        [data]
    );

    if (lastFour.length < 2) {
        const single = lastFour[0];
        return (
            <EnhancedStatCard
                title="Variazione prezzo 48h"
                value="N/A"
                description="Dato insufficiente per calcolare la variazione"
                positive={true}
                borderColorKey="warning"
                sparkData={[single?.prezzo || 0, single?.prezzo || 0]}
                sparkColor={theme.palette.grey[400]}
                subtitle={<SubtitleNode positive={true} pct={0} desc="dato unico" />}
                extra={
                    <Box component="div" className="py-2 text-center">
                        <Typography variant="caption" className="text-gray-500">
                            Solo una rilevazione presente: {new Date(single.timestamp).toLocaleDateString()}
                        </Typography>
                    </Box>
                }
            />
        );
    }

    const first = lastFour[0];
    const last = lastFour[lastFour.length - 1];
    const delta = last.prezzo - first.prezzo;
    const pct = (delta / first.prezzo) * 100;
    const positive = delta >= 0;

    return (
        <EnhancedStatCard
            title="Variazione prezzo 48h"
            value={`${positive ? '+' : ''}${delta.toFixed(2)} €`}
            description="Differenza tra l'ultimo e il primo prezzo delle ultime 4 rilevazioni"
            positive={positive}
            borderColorKey={positive ? 'success' : 'error'}
            // Passa solo i valori numerici per lo sparkline
            sparkData={lastFour.map(p => p.prezzo)}
            // Usa un colore vivace (opzionale, altrimenti prende success/error)
            sparkColor={positive ? theme.palette.success.main : theme.palette.error.main}
            subtitle={<SubtitleNode positive={positive} pct={pct} desc='rispetto a ieri' />}
            extra={
                <div className='!mt-auto'>
                    <Divider sx={{ backgroundColor: '#000', width: '100%', height: '1px' }} />
                    <Box component="div" className="grid grid-cols-2 gap-4 text-center">
                        <Box component="div" >
                            <Typography variant="caption" className="text-gray-500 uppercase">
                                Da
                            </Typography>
                            <Typography variant="h6" className="font-semibold text-gray-800">
                                {first.prezzo} €
                            </Typography>
                            <Typography variant="caption" className="text-gray-500">
                                {new Date(first.timestamp).toLocaleDateString()}
                            </Typography>
                        </Box>
                        <Box component="div" >
                            <Typography variant="caption" className="text-gray-500 uppercase">
                                A
                            </Typography>
                            <Typography variant="h6" className="font-semibold text-gray-800">
                                {last.prezzo} €
                            </Typography>
                            <Typography variant="caption" className="text-gray-500">
                                {new Date(last.timestamp).toLocaleDateString()}
                            </Typography>
                        </Box>
                    </Box>
                </div>
            }
        />
    );
};