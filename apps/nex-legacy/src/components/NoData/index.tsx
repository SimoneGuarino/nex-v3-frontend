import React from "react";
import { Stack, Fade } from "@mui/material";
import MDTypography from "components/MDTypography";
import Background from "../../assets/images/noData/no-data-illustration.svg";

type NoDataProps = {
    /** Altezza in viewport height (vh). Default: 84 */
    height?: number;
};

const cssStyle: React.CSSProperties = {
    width: "80%",
    height: "80%",
    opacity: 0.65,
};

export function NoData({ height = 84 }: NoDataProps) {
    return (
        <Fade in timeout={300}>
            <Stack
                height={`${height}vh`}
                alignItems="center"
                justifyContent="center"
                translate="no"
                sx={{ filter: "grayscale(1)" }}
            >
                <img
                    style={cssStyle}
                    src={Background}
                    loading="lazy"
                    alt="Nessun dato disponibile"
                    className="avoid-drag"
                />
                <MDTypography
                    component="h3"
                    style={{
                        color: "#9c9c9c",
                        fontWeight: "normal",
                        textAlign: "center",
                        fontSize: "0.7em",
                        maxWidth: "50%",
                    }}
                >
                    Sembra che per il momento non ci siano elementi da visualizzare, ripassa più tardi!
                </MDTypography>
            </Stack>
        </Fade>
    );
}
