import React, { memo } from "react";
import Menu, { type MenuProps } from "@mui/material/Menu";
import type { SxProps, Theme } from "@mui/material/styles";
import { MainTheme } from "assets/settingsTheme";
import { useNexTheme } from "@nex/theme-system";

export interface InfoMenuProps {
    anchorEl: MenuProps["anchorEl"];
    handleCloseMenu: MenuProps["onClose"];
    contain: React.ReactNode;
    sx?: SxProps<Theme>;
    right?: number | string;
}

function InfoMenu({ anchorEl, handleCloseMenu, contain, sx, right }: InfoMenuProps) {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    // costruiamo un SxProps<Theme> senza undefined
    const paperSx: SxProps<Theme> = [
        {
            overflow: "visible",
            filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
            mt: 1.5,
            p: 0,
            "& .MuiAvatar-root": { width: 32, height: 32, ml: -0.5, mr: 1 },
            "&:before": {
                content: '""',
                display: "block",
                position: "absolute",
                top: 0,
                right: right ?? "41%",
                width: 10,
                height: 10,
                bgcolor: darkMode ? palette.dark.main : "background.paper",
                transform: "translateY(-50%) rotate(45deg)",
                zIndex: (theme: Theme) => theme.zIndex.drawer + 2,
            },
            "& .MuiList-root": { height: "100%" },
        } as const,
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
    ];

    return (
        <Menu
            anchorEl={anchorEl}
            id="account-menu"
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
            PaperProps={{ elevation: 0, sx: paperSx }}
        >
            {contain}
        </Menu>
    );
}

export default memo(InfoMenu);
