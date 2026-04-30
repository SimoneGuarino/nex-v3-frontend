// src/layouts/compare/virtualziedTable/infoPoupUpMenu/index.tsx
import React, { memo } from "react";
import Menu from "@mui/material/Menu";
import type { MenuProps } from "@mui/material/Menu";

type InfoMenuProps = {
    anchorEl: MenuProps["anchorEl"];
    handleCloseMenu: NonNullable<MenuProps["onClose"]>;
    contain: React.ReactNode;
};

function InfoMenu({ anchorEl, handleCloseMenu, contain }: InfoMenuProps) {
    return (
        <Menu
            anchorEl={anchorEl}
            id="account-menu"
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
            PaperProps={{
                elevation: 0,
                sx: {
                    overflow: "visible",
                    boxShadow:
                        "0rem 0.625rem 0.9375rem -0.1875rem rgb(0 0 0 / 2%), 0rem 0.25rem 0rem 0rem rgb(0 0 0 / 1%)",
                    mt: 1.5,
                    "& .MuiAvatar-root": {
                        width: 32,
                        height: 32,
                        ml: -0.5,
                        mr: 1,
                    },
                    "&:before": {
                        content: '""',
                        display: "block",
                        position: "absolute",
                        bottom: 10,
                        right: -5,
                        width: 10,
                        height: 10,
                        bgcolor: "background.paper",
                        transform: "translateY(-50%) rotate(45deg)",
                        zIndex: (theme: any) => theme.zIndex.drawer + 2,
                    },
                },
            }}
            transformOrigin={{ horizontal: "right", vertical: "bottom" }}
            anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        >
            {contain}
        </Menu>
    );
}

export default memo(InfoMenu);
