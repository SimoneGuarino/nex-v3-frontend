import React from "react";
import { Stack, SxProps, Theme } from "@mui/material";

import MDTypography from "components/MDTypography";

import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { MainTheme } from "assets/settingsTheme";
import { useNexTheme } from "@nex/theme-system";
import FDIconButton from "components/UI/buttons/FDIconButton";

// Tipi per il tema passato a ChooseColor
type ThemeKey = string | null | undefined;

interface Palette {
    grey: Record<number, string>;
    black: { main: string };
    [key: string]: any;
}

interface ColorChoice {
    bg: string | null;
    text: string;
}

function ChooseColor(
    key: ThemeKey,
    darkMode: boolean,
    palette: Palette
): ColorChoice {
    const key_ = key?.toLowerCase();
    let colors: ColorChoice = {
        bg: null,
        text: darkMode ? palette.grey[500] : palette.black.main,
    };

    switch (key_) {
        case "info":
            if (darkMode) {
                colors.bg = "#897e6336";
                colors.text = "#cd8e00";
            } else {
                colors.bg = "#ffe4a8";
            }
            break;
        default:
            if (darkMode) {
                colors.bg = "#1b1f23";
            } else {
                colors.bg = "#d3e3fd7a";
            }
            break;
    }

    return colors;
}

// Props per PopupInfo
interface PopupInfoProps {
    title?: string;
    body: string;
    handleChangeinfo?: () => void;
    close?: boolean;
    icon?: React.ReactNode;
    theme?: ThemeKey;
    sx?: SxProps<Theme>;
    className?: string;
}

/**
 * Popup dedicato a dei alert veloci da mostrare all'interno delle pagine
 */
export function PopupInfo({
    title = "INFO",
    body,
    handleChangeinfo,
    close,
    icon,
    theme,
    sx,
    className,
}: PopupInfoProps): JSX.Element {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const closeVar = close === undefined ? true : close;
    const iconVar = icon === undefined ? <HomeOutlinedIcon /> : icon;

    const infoMemo = React.useMemo(
        () => (
            <Stack
                className={className}
                sx={{
                    ...sx,
                    backgroundColor: `${ChooseColor(theme, darkMode, palette).bg}`,
                    p: 1.5,
                    borderRadius: 10,
                    flexWrap: "wrap",
                }}
            >
                <Stack direction="row" gap={1.2} alignItems="center">
                    {iconVar}
                    <MDTypography
                        component="p"
                        style={{
                            color: ChooseColor(theme, darkMode, palette).text,
                            textAlign: "center",
                            fontSize: "0.7em",
                            fontWeight: 500,
                        }}
                    >
                        {title}
                    </MDTypography>
                    <MDTypography
                        component="p"
                        style={{
                            color: ChooseColor(theme, darkMode, palette).text,
                            textAlign: "center",
                            fontSize: "0.6em",
                            fontWeight: 200,
                        }}
                    >
                        {body}
                    </MDTypography>
                    {closeVar && (
                        <FDIconButton
                            icon={<CloseRoundedIcon />}
                            onClick={handleChangeinfo}
                            className="ml-auto"
                        />
                    )}
                </Stack>
            </Stack>
        ),
        [className, sx, theme, darkMode, palette, iconVar, title, body, closeVar, handleChangeinfo]
    );

    return infoMemo;
}
