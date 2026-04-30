import { forwardRef, useCallback } from "react";
import { makeStyles } from "@mui/styles";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";

import { CustomContentProps } from "./types";
import useSnackbar from "./useSnackbar";
import SnackbarContent from "./SnackbarContent";
import { Stack } from "@mui/material";
import { TypeToIcon } from "./utils/typeToIcon";

import { formatDistanceToNow } from "date-fns";
import { it } from 'date-fns/locale';
import { MainTheme } from "assets/settingsTheme";
import { icon_close } from "config/icons";
import { useNexTheme } from "@nex/theme-system";



const useStyles: any = makeStyles(() => ({
    root: {
        "@media (min-width:600px)": {
            minWidth: "344px !important"
        }
    },
    card: {
        width: "100%",
        display: 'flex',
        alignItems: 'flex-start',
        padding: 10,
        borderRadius: 20,
    },
    actionRoot: {
        padding: "8px 8px 8px 16px",
        justifyContent: "space-between"
    },
    icons: {
        marginLeft: "auto"
    },
    expand: {
        padding: "8px 8px",
        transform: "rotate(0deg)",
        color: "#000",
        transition: "all .2s"
    },
    expandOpen: {
        transform: "rotate(180deg)"
    },
    stack: {
        width: '100%'
    },
    checkIcon: {
        fontSize: 20,
        paddingRight: 4
    },
    button: {
        padding: 0,
        textTransform: "none"
    }
}));



interface ReportCompleteProps extends CustomContentProps {
    allowDownload?: boolean;
    title?: string;
    type: 'success' | 'info' | 'error' | 'warning';
    date: Date;
}
const ReportComplete = forwardRef<HTMLDivElement, ReportCompleteProps>(
    ({ id, ...props }, ref) => {
        const classes = useStyles();
        const { closeSnackbar } = useSnackbar();
        const { preferences } = useNexTheme();
        const darkMode = preferences.mode === "dark";
        const palette = MainTheme().palette;


        const handleDismiss = useCallback(() => {
            closeSnackbar(id);
        }, [id, closeSnackbar]);


        return (
            <SnackbarContent ref={ref} className={classes.root}>
                <Card className={classes.card} sx={{ backgroundColor: darkMode ? '#252525' : palette.white.main }}>
                    {TypeToIcon({ type: props.type })}

                    <Stack gap={1} alignItems='flex-start' width='100%' sx={{ pt: 1, ml: 2 }}>
                        <Stack className={classes.stack}>
                            <Typography variant="subtitle2" className={classes.typography} sx={{
                                color: darkMode ? palette.white.main : palette.black.main
                            }}>
                                {props.title || 'Nex Dashboard'}
                            </Typography>
                            <Typography
                                gutterBottom
                                variant="caption"
                                style={{ color: darkMode ? palette.grey[500] : palette.grey[600], display: "block" }}
                            >
                                {props.message}
                            </Typography>

                        </Stack>

                        <Stack className={classes.stack}>
                            <Typography variant="body2" sx={{ fontSize: '0.7rem', color: darkMode ? palette.white.main : palette.black.main }}>
                                {formatDistanceToNow(props.date, { locale: it }) + " fa"}
                            </Typography>
                        </Stack>
                    </Stack>

                    <IconButton
                        size="small"
                        className={classes.expand}
                        onClick={handleDismiss}
                    >
                        {icon_close({ color: palette.grey[500] })}
                    </IconButton>

                </Card>
            </SnackbarContent>
        );
    }
);

ReportComplete.displayName = "ReportComplete";

export default ReportComplete;
