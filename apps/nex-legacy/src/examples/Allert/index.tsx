import React from "react";

// internal Components
import MDTypography from "components/MDTypography";

// @mui Components
import Stack from '@mui/material/Stack';
import Backdrop from '@mui/material/Backdrop';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import type { SxProps, Theme } from "@mui/material/styles";

// @mui Icons
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';

type BtnItem = {
    name: React.ReactNode;
    sx?: SxProps<Theme>;
    function: () => void;
};

type BaseProps = {
    close: React.Dispatch<React.SetStateAction<boolean>>;
    image: string;
    title: string;
    body?: React.ReactNode;
};

type WithButtons = {
    btn: BtnItem[];
    action?: never;
    icon?: never;
};

type WithSingleAction = {
    btn?: undefined;
    action: () => void;
    icon: React.ReactNode;
};

export type AllertProps = BaseProps & (WithButtons | WithSingleAction);

export default function Allert(props: AllertProps) {
    return (
        <Backdrop
            sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={true}
        >
            <Paper elevation={0} sx={{ textAlign: "center", padding: "10px 20px 10px 20px", borderRadius: "10px", maxWidth: "27em" }}>
                <Stack direction="row">
                    {/* chiamata corretta per TS: passa direttamente false */}
                    <IconButton onClick={() => props.close(false)} aria-label="sendPost" style={{ marginLeft: "auto", borderRadius: "10px", color: "#7f55da" }}>
                        <CloseOutlinedIcon />
                    </IconButton>
                </Stack>

                <img style={{ width: "auto", height: "15em" }} src={props.image} alt={props.title} />

                <MDTypography component="h3" style={{ fontWeight: "bold", textAlign: "center", marginTop: "0.3em", fontSize: "2.5em" }}>
                    {props.title}
                </MDTypography>

                <MDTypography component="h3" style={{ fontWeight: "400", textAlign: "center", marginTop: "0.3em", fontSize: "0.9rem" }}>
                    {props.body}
                </MDTypography>

                <Stack direction="row" sx={{ marginTop: "2rem" }}>
                    {props.btn !== undefined ? (
                        props.btn.map((data, index) => (
                            <IconButton
                                key={index}
                                sx={data.sx}
                                onClick={() => data.function()}
                                aria-label="sendPost"
                                style={{ minWidth: "2em", margin: "2px", marginLeft: "9px", borderRadius: "10px", backgroundColor: "#7f55da", color: "#fff" }}
                            >
                                {data.name}
                            </IconButton>
                        ))
                    ) : (
                        <IconButton
                            onClick={() => props.action()}
                            aria-label="sendPost"
                            style={{ minWidth: "2em", margin: "2px", marginLeft: "9px", borderRadius: "10px", backgroundColor: "#7f55da", color: "#fff" }}
                        >
                            {props.icon}
                        </IconButton>
                    )}
                </Stack>
            </Paper>
        </Backdrop>
    );
}
