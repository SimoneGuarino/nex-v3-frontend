import { forwardRef } from "react";
import type { MouseEventHandler, ReactNode } from "react";
import type { IconButtonProps } from "@mui/material";
import FDIconButtonRoot from "./FDIconButtonRoot";
import { MainTheme } from "assets/settingsTheme";
import { useNexTheme } from "@nex/theme-system";

export type FDColor =
    | "white"
    | "primary"
    | "secondary"
    | "info"
    | "success"
    | "warning"
    | "error"
    | "light"
    | "dark";

export type FDVariant = "text" | "contained" | "outlined" | "gradient";
export type FDSize = "small" | "medium" | "large";

export interface FDIconButtonProps
    extends Omit<IconButtonProps, "color" | "size"> {
    color?: FDColor;
    variant?: FDVariant;
    size?: FDSize;
    circular?: boolean;
    iconOnly?: boolean;
    bgColor?: string;                 // colore di background personalizzato
    children: ReactNode;
    onClick?: MouseEventHandler<HTMLButtonElement>;
}

const FDIconButton = forwardRef<HTMLButtonElement, FDIconButtonProps>(
    (
        {
            color = "white",
            variant = "contained",
            size = "medium",
            circular = false,
            iconOnly = false,
            bgColor,
            children,
            ...rest
        },
        ref
    ) => {
        const { preferences } = useNexTheme();
        const darkMode = preferences.mode === "dark";
        const palette = MainTheme().palette;

        return (
            <FDIconButtonRoot
                {...rest}
                ref={ref}
                color="primary"
                bgColor={bgColor ?? (darkMode ? palette.grey[900] : palette.grey[200])}
                size={size}
                ownerState={{ color, variant, size, circular, iconOnly, darkMode }}
            >
                {children}
            </FDIconButtonRoot>
        );
    }
);

FDIconButton.displayName = "FDIconButton";

export default FDIconButton;
