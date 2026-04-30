// src/components/PriceVariationBox.tsx
import React, { useMemo } from 'react';
import { useTheme, Box, Typography, Divider } from '@mui/material';
import { EnhancedStatCard, SubtitleNode } from './EnhancedStatCard';
import { Variation } from '..';

interface StockVariationProps {
    data: Variation[];
}

export const StockVariation: React.FC<StockVariationProps> = ({ data }) => {
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
                title="Variazione Stock 48h"
                value="N/A"
                description="Dato insufficiente per calcolare la variazione"
                positive={true}
                borderColorKey="warning"
                sparkData={[single?.disponibilita || 0, single?.disponibilita || 0]}
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
    const delta = last.disponibilita - first.disponibilita;
    const pct = (delta / first.disponibilita) * 100;
    const positive = delta >= 0;


    return (
        <EnhancedStatCard
            title="Variazione Stock 48h"
            value={`${positive ? '+' : ''}${delta}`}
            description="Differenza tra la disponibilità più recente e quella iniziale delle ultime 4 rilevazioni"
            positive={positive}
            borderColorKey={positive ? 'success' : 'error'}
            sparkData={lastFour.map(p => p.disponibilita)}
            sparkColor={positive ? theme.palette.success.main : theme.palette.error.main}
            subtitle={<SubtitleNode positive={positive} pct={pct} desc="rispetto a ieri" />}
            extra={
                <div className='!mt-auto'>
                    <Divider sx={{ backgroundColor: '#000', width: '100%', height: '1px' }} />
                    <Box component="div" className="grid grid-cols-2 gap-4 text-center">
                        <Box component="div" >
                            <Typography variant="caption" className="text-gray-500 uppercase">
                                Da
                            </Typography>
                            <Typography variant="h6" className="font-semibold text-gray-800">
                                {first.disponibilita} pz
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
                                {last.disponibilita} pz
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