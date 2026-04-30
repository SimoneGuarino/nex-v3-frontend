import { forwardRef, ReactNode, ComponentPropsWithoutRef } from "react";
import MDTypographyRoot from "components/MDTypography/MDTypographyRoot";
import { useNexTheme } from "@nex/theme-system";

// Tipi personalizzati (puoi spostarli in un file tipi condiviso)
type Color =
    | "primary"
    | "secondary"
    | "info"
    | "success"
    | "warning"
    | "error"
    | "light"
    | "dark"
    | "white"
    | "text"
    | "inherit";

type FontWeight = "light" | "regular" | "medium" | "bold";

type TextTransform = "none" | "capitalize" | "uppercase" | "lowercase";

type VerticalAlign =
    | "unset"
    | "baseline"
    | "sub"
    | "super"
    | "text-top"
    | "text-bottom"
    | "middle"
    | "top"
    | "bottom";

// Estendiamo le props di MDTypographyRoot tranne ownerState, e aggiungiamo le nostre
interface MDTypographyProps extends Omit<ComponentPropsWithoutRef<typeof MDTypographyRoot>, "ownerState"> {
    color?: Color;
    fontWeight?: FontWeight; // NO più `| false` qui
    component?: React.ElementType;
    variant?:
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6"
    | "body1"
    | "body2"
    | "subtitle1"
    | "subtitle2"
    | "caption"
    | "title1"
    | "title2"
    | "button";
    fontSize?: string;
    textTransform?: TextTransform;
    verticalAlign?: VerticalAlign;
    textGradient?: boolean;
    opacity?: number;
    sx?: object;
    className?: string;
    children?: ReactNode;
}

const MDTypography = forwardRef<HTMLElement, MDTypographyProps>(
    (
        {
            color = "dark",
            fontWeight,
            component,
            textTransform = "none",
            verticalAlign = "unset",
            textGradient = false,
            opacity = 1,
            className,
            children,
            sx,
            ...rest
        },
        ref
    ) => {
        const { preferences } = useNexTheme();
        const darkMode = preferences.mode === "dark";

        return (
            <MDTypographyRoot
                {...rest}
                ref={ref}
                component={component}
                sx={sx}
                className={className}
                ownerState={{
                    color,
                    textTransform,
                    verticalAlign,
                    // se fontWeight è undefined o null => undefined, altrimenti lo passo
                    fontWeight: fontWeight ?? undefined,
                    opacity,
                    textGradient,
                    darkMode,
                }}
            >
                {children ?? null}
            </MDTypographyRoot>
        );
    }
);

MDTypography.displayName = "MDTypography";

export default MDTypography;
