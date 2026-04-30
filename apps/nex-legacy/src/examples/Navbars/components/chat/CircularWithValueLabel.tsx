// CircularWithValueLabel.tsx
import * as React from "react";
import CircularProgress, { CircularProgressProps } from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

type CircularProgressWithLabelProps = Omit<CircularProgressProps, "variant" | "value"> & {
    /** Valore tra 0 e 100 */
    value: number;
};

function CircularProgressWithLabel({ value, ...rest }: CircularProgressWithLabelProps) {
    return (
        <Box component="div" sx={{ position: "relative", display: "inline-flex" }}>
            <CircularProgress variant="determinate" value={value} {...rest} />
            <Box
                component="div"
                sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: "absolute",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Typography variant="caption" component="div" color="text.secondary">
                    {`${Math.round(value)}%`}
                </Typography>
            </Box>
        </Box>
    );
}

export interface CircularWithValueLabelProps
    extends Omit<CircularProgressProps, "variant" | "value"> {
    /** Progresso tra 0 e 100 */
    progress: number;
}

export default function CircularWithValueLabel({
    progress,
    ...rest
}: CircularWithValueLabelProps) {
    return <CircularProgressWithLabel value={progress} {...rest} />;
}
