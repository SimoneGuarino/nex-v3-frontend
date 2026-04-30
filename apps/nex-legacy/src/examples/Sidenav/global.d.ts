import "@mui/material/styles";
import { elements } from "chart.js";
import { ReactNode } from "react";

// Estensione del tema MUI
declare module "@mui/material/styles" {
    interface PaletteColorCustom {
        main: string;
        contrastText?: string;
    }

    interface Palette {
        transparent: PaletteColorCustom;
        gradients: {
            dark: PaletteColorCustom & { state: string };
            [key: string]: PaletteColorCustom & { state: string };
        };
        dark: PaletteColorCustom;
        white: PaletteColorCustom;
        light: PaletteColorCustom;
        badgeColors: {
            [key: string]: { background: string; text: string };
        };
    }

    interface PaletteOptions {
        transparent?: Partial<PaletteColorCustom>;
        gradients?: {
            dark?: PaletteColorCustom & { state: string };
            [key: string]: Partial<PaletteColorCustom> & { state?: string };
        };
        dark?: Partial<PaletteColorCustom>;
        white?: Partial<PaletteColorCustom>;
        light?: Partial<PaletteColorCustom>;
    }



    interface Typography {
        fontWeightLight: number;
        fontWeightRegular: number;
        fontWeightMedium: number;
        fontWeightBold: number;
        size: {
            xxs: string;
            xs: string;
            sm?: string;
            md?: string;
            lg: string;
            [key: string]: string | undefined;
        };
    }

    interface TypographyOptions {
        fontWeightLight?: number;
        fontWeightRegular?: number;
        fontWeightMedium?: number;
        fontWeightBold?: number;
        size?: {
            xxs: string;
            xs: string;
            sm?: string;
            md?: string;
            lg: string;
            [key: string]: string | undefined;
        };
    }


    interface TypographyVariants {
        button: React.CSSProperties;
    }


    interface TypographyVariantsOptions {
        button?: React.CSSProperties;
    }


    interface Borders {
        borderRadius: Record<string, string>;
        borderWidth: Record<number, string>;
    }

    interface BordersOptions {
        borderRadius?: Record<string, string>;
        borderWidth?: Record<number, string>;
    }


    interface TypeBackground {
        sidenav: string;
        card: string;
    }

    interface BackgroundOptions {
        sidenav?: string;
        card?: string;
    }

    interface Theme {
        boxShadows: {
            none: string;
            xs: string;
            sm: string;
            md: string;
            lg: string;
            xl: string;
            xxl: string;
            inset: string;
            shadow: string;
        };
        typography: Typography;
        borders: Borders;
        functions: {
            pxToRem: (value: number) => string;
            linearGradient: (color1: string, color2: string) => string;
        };
    }

    interface ThemeOptions {
        boxShadows?: {
            none: string;
            xs: string;
            sm: string;
            md: string;
            lg: string;
            xl: string;
            xxl: string;
            inset: string;
            shadow: string;
        };
        functions?: {
            pxToRem?: (value: number) => string;
            linearGradient?: (color1: string, color2: string) => string;
        };
    }
}

declare module "@mui/material/Typography" {
    interface TypographyPropsVariantOverrides {
        button: true;
        title1: true;
        title2: true;
    }
}

declare module "@mui/material" {
    interface Color {
        dark: true;
        white: true;
        light: true;
        transparent: true;
    }
}

// ROUTING E SIDEBAR
declare global {
  // === ROUTE MODEL ===
  export interface RouteElement {
    key: string;
    name: string;
    route?: string;
    icon?: React.ReactNode | string;
    hide?: boolean;
    nested?: RouteElement[] | NestedRoute;
    type?: "visible" | "nested" | "divider" | "title";
    title?: string;
    href?: string;
    ref_type?: "divider" | "title";
    noCollapse?: boolean;
    isNew?: boolean;
    redirect?: string; // Aggiunto per indicare se la route è un redirect
  }

  export type NestedRoute = {
    elements: RouteElement[];
  };

  // === SIDEBAR COMPONENTS (nuovi) ===
  export interface SidebarItemProps extends React.HTMLAttributes<HTMLDivElement> {
    icon?: React.ReactNode | string;
    label: string;
    active?: boolean;
    highlight?: boolean;            // <- usato per evidenziare gruppi aperti
    depth?: number;                 // 0 per root, 1 per figli
    onClick?: () => void;
    endAdornment?: React.ReactNode; // caret, ecc.
  }

  export interface SidebarGroupProps {
    icon?: React.ReactNode | string;
    label: string;
    collapseKey: string;            // es. "settings"
    collapseName: string;           // route corrente senza "/"
    items: RouteElement[];          // elementi figli
  }

  // (Opzionale) comodo per hook responsive
  export type ResponsiveSidebarState = { isMobile: boolean };
}

export {};