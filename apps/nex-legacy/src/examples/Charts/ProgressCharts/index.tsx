// ProgressBar/index.tsx
import React, { memo } from "react";
import Stack from "@mui/material/Stack";
import MDTypography from "components/MDTypography";
import type { SxProps, Theme } from "@mui/material/styles";

export interface ProgressBarProps {
    percent: number;                 // 0–100 (viene clampato minimo 0 come nell’originale)
    label?: React.ReactNode;
    icon?: React.ReactNode;
}

function ProgressBar({ percent, label, icon }: ProgressBarProps) {
    const safePercent = percent < 0 ? 0 : percent;

    // stile per il cerchio con caricamento (fedele all’originale)
    const sxStyle: SxProps<Theme> = {
        width: "auto",
        height: 70,
        aspectRatio: "1",
        borderRadius: "50%",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        alignSelf: "center",
        "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: `conic-gradient(#5bbcb9 calc(${safePercent} * 1%), #ceedec 0%)`,
            // shorthand -webkit-mask: non sempre tipizzato rigidamente; va bene in sx
            WebkitMask: "radial-gradient(#0000 55%, #000 56.3%)",
            zIndex: 1,
        } as any,
    };

    return (
        <Stack sx={sxStyle} style={{ alignItems: "center" }}>
            {label && !icon ? (
                <MDTypography component="span">{label}</MDTypography>
            ) : label && icon ? (
                <>
                    <MDTypography component="span">{label}</MDTypography>
                    {icon}
                </>
            ) : !label && icon ? (
                <MDTypography component="span">{icon}</MDTypography>
            ) : null}
        </Stack>
    );
}

export default memo(ProgressBar);
