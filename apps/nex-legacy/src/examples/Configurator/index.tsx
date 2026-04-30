import { useEffect, useState } from "react";

// @mui
import Divider from "@mui/material/Divider";
import Switch from "@mui/material/Switch";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";
import type { Theme } from "@mui/material/styles";
import type { SxProps } from "@mui/system";

// React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

// Custom styles
import ConfiguratorRoot from "examples/Configurator/ConfiguratorRoot";

// React context
import {
    useMaterialUIController,
    setOpenConfigurator,
    setTransparentSidenav,
    setWhiteSidenav,
    setFixedNavbar,
    setSidenavColor,
} from "context/index";
import { useNexTheme } from "@nex/theme-system";

// Colori ammessi per il sidenav nel tuo tema
type SidenavColor = "primary" | "dark" | "info" | "success" | "warning" | "error" | "purple";

// Stato (minimo) del controller che realmente usi qui
type ControllerState = {
    openConfigurator: boolean;
    fixedNavbar: boolean;
    sidenavColor: SidenavColor;
    transparentSidenav: boolean;
    whiteSidenav: boolean;
};

// La signature di useMaterialUIController: tupla [state, dispatch]
type ControllerTuple = [ControllerState, React.Dispatch<any>];

export default function Configurator() {
    const [controller, dispatch] = useMaterialUIController() as unknown as ControllerTuple;
    const {
        openConfigurator,
        fixedNavbar,
        sidenavColor,
        transparentSidenav,
        whiteSidenav,
    } = controller;

    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";

    const [disabled, setDisabled] = useState(false);
    const sidenavColors: SidenavColor[] = [
        "primary",
        "dark",
        "info",
        "success",
        "warning",
        "error",
        "purple",
    ];

    // Listener per abilitare/disabilitare i pulsanti a seconda della larghezza
    useEffect(() => {
        const handleDisabled = () => setDisabled(!(window.innerWidth > 1200));

        // imposta lo stato iniziale
        handleDisabled();

        // quando la larghezza scende sotto 1200 preferisci "transparent", altrimenti "white"
        const handleSideTypeOnResize = () => {
            if (window.innerWidth < 1200) {
                handleTransparentSidenav();
            } else {
                handleWhiteSidenav();
            }
        };

        window.addEventListener("resize", handleDisabled);
        window.addEventListener("resize", handleSideTypeOnResize);

        return () => {
            window.removeEventListener("resize", handleDisabled);
            window.removeEventListener("resize", handleSideTypeOnResize);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCloseConfigurator = () => setOpenConfigurator(dispatch, false);

    const handleTransparentSidenav = () => {
        setTransparentSidenav(dispatch, true);
        setWhiteSidenav(dispatch, false);
    };

    const handleWhiteSidenav = () => {
        setWhiteSidenav(dispatch, true);
        setTransparentSidenav(dispatch, false);
    };

    const handleDarkSidenav = () => {
        setWhiteSidenav(dispatch, false);
        setTransparentSidenav(dispatch, false);
    };

    const handleFixedNavbar = () => setFixedNavbar(dispatch, !fixedNavbar);

    // imposta "white" all'avvio (comportamento originale)
    useEffect(() => {
        handleWhiteSidenav();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Stili usati come funzioni sx (possono leggere darkMode)
    const sidenavTypeButtonsStyles: SxProps<Theme> = (theme) => {
        const t = theme as Theme & any;
        const {
            functions: { pxToRem },
            palette: { white, dark, background },
            borders: { borderWidth },
        } = t;

        return {
            height: pxToRem(39),
            background: darkMode ? background.sidenav : white.main,
            color: darkMode ? white.main : dark.main,
            border: `${borderWidth[1]} solid ${darkMode ? white.main : dark.main}`,
            "&:hover, &:focus, &:focus:not(:hover)": {
                background: darkMode ? background.sidenav : white.main,
                color: darkMode ? white.main : dark.main,
                border: `${borderWidth[1]} solid ${darkMode ? white.main : dark.main}`,
            },
        };
    };

    const sidenavTypeActiveButtonStyles: SxProps<Theme> = (theme) => {
        const t = theme as Theme & any;
        const {
            functions: { pxToRem, linearGradient },
            palette: { white, gradients, background },
        } = t;

        return {
            height: pxToRem(39),
            background: darkMode ? white.main : linearGradient(gradients.dark.main, gradients.dark.state),
            color: darkMode ? background.sidenav : white.main,
            "&:hover, &:focus, &:focus:not(:hover)": {
                background: darkMode
                    ? white.main
                    : linearGradient(gradients.dark.main, gradients.dark.state),
                color: darkMode ? background.sidenav : white.main,
            },
        };
    };

    return (
        <ConfiguratorRoot variant="permanent" ownerState={{ openConfigurator }}>
            <MDBox
                display="flex"
                justifyContent="space-between"
                alignItems="baseline"
                pt={4}
                pb={0.5}
                px={3}
                translate="no"
            >
                <MDBox>
                    <MDTypography variant="h5">Settings</MDTypography>
                    <MDTypography variant="body2" color="text">
                        Opzioni veloci della webApp.
                    </MDTypography>
                </MDBox>

                <Icon
                    sx={({ typography: { size }, palette: { dark, white } }: Theme & any) => ({
                        fontSize: `${size.lg} !important`,
                        color: darkMode ? white.main : dark.main,
                        stroke: "currentColor",
                        strokeWidth: "2px",
                        cursor: "pointer",
                        transform: "translateY(5px)",
                    })}
                    onClick={handleCloseConfigurator}
                >
                    close
                </Icon>
            </MDBox>

            <Divider />

            <MDBox pt={0.5} pb={3} px={3}>
                <MDBox>
                    <MDTypography variant="h6">Sidenav Colors</MDTypography>

                    <MDBox mb={0.5}>
                        {sidenavColors.map((color) => (
                            <IconButton
                                key={color}
                                sx={({
                                    borders: { borderWidth },
                                    palette: { white, dark, background },
                                    transitions,
                                }: Theme & any) => ({
                                    width: "24px",
                                    height: "24px",
                                    padding: 0,
                                    border: `${borderWidth[1]} solid ${darkMode ? background.sidenav : white.main}`,
                                    borderColor: () => {
                                        let borderColorValue: any = sidenavColor === color && dark.main;
                                        if (darkMode && sidenavColor === color) borderColorValue = white.main;
                                        return borderColorValue;
                                    },
                                    transition: transitions.create("border-color", {
                                        easing: transitions.easing.sharp,
                                        duration: transitions.duration.shorter,
                                    }),
                                    backgroundImage: ({ functions: { linearGradient }, palette: { gradients } }: any) =>
                                        linearGradient(gradients[color]?.main, gradients[color]?.state),
                                    "&:not(:last-child)": { mr: 1 },
                                    "&:hover, &:focus, &:active": {
                                        borderColor: darkMode ? white.main : dark.main,
                                    },
                                })}
                                onClick={() => setSidenavColor(dispatch, color)}
                            />
                        ))}
                    </MDBox>
                </MDBox>

                <MDBox mt={3} lineHeight={1}>
                    <MDTypography variant="h6">Sidenav Type</MDTypography>
                    <MDTypography variant="button" color="text">
                        Scegli tra diversi tipi di sidenav.
                    </MDTypography>

                    <MDBox sx={{ display: "flex", mt: 2, mr: 1 }} translate="no">
                        <MDButton
                            color="dark"
                            variant="gradient"
                            onClick={handleDarkSidenav}
                            disabled={disabled}
                            fullWidth
                            sx={
                                !transparentSidenav && !whiteSidenav
                                    ? sidenavTypeActiveButtonStyles
                                    : sidenavTypeButtonsStyles
                            }
                            translate="no"
                        >
                            Scuro
                        </MDButton>
                        <MDBox sx={{ mx: 1, width: "8rem", minWidth: "8rem" }}>
                            <MDButton
                                color="dark"
                                variant="gradient"
                                onClick={handleTransparentSidenav}
                                disabled={disabled}
                                fullWidth
                                sx={
                                    transparentSidenav && !whiteSidenav
                                        ? sidenavTypeActiveButtonStyles
                                        : sidenavTypeButtonsStyles
                                }
                            >
                                Trasparente
                            </MDButton>
                        </MDBox>
                        <MDButton
                            color="dark"
                            variant="gradient"
                            onClick={handleWhiteSidenav}
                            fullWidth
                            sx={
                                whiteSidenav && !transparentSidenav
                                    ? sidenavTypeActiveButtonStyles
                                    : sidenavTypeButtonsStyles
                            }
                            translate="no"
                        >
                            Bianco
                        </MDButton>
                    </MDBox>
                </MDBox>

                <MDBox display="flex" justifyContent="space-between" alignItems="center" mt={3} lineHeight={1}>
                    <MDTypography variant="h6">Navbar Fixed</MDTypography>
                    <Switch checked={fixedNavbar} onChange={handleFixedNavbar} />
                </MDBox>

                <Divider />
            </MDBox>
        </ConfiguratorRoot>
    );
}
