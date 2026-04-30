// CircularWithValueLabel.tsx
import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import type { CircularProgressProps } from '@mui/material/CircularProgress';

type CircularProgressWithLabelProps = Omit<CircularProgressProps, 'variant' | 'value'> & {
    /** Valore tra 0 e 100 */
    value: number;
};

function CircularProgressWithLabel({
    value,
    ...rest
}: CircularProgressWithLabelProps): JSX.Element {
    return (
        <Box component="div" sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress variant="determinate" value={value} {...rest} />
            <Box
                component="div"
                sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography variant="caption" component="div" color="text.secondary">
                    {`${Math.round(value)}%`}
                </Typography>
            </Box>
        </Box>
    );
}

export type CircularWithValueLabelProps =
    Omit<CircularProgressWithLabelProps, 'value'> & {
        /** Valore tra 0 e 100 */
        progress: number;
    };

export default function CircularWithValueLabel({
    progress,
    ...rest
}: CircularWithValueLabelProps): JSX.Element {
    return <CircularProgressWithLabel value={progress} {...rest} />;
}
