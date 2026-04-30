// src/context/index.tsx
import React, { createContext, useContext, useReducer, useMemo, useEffect } from "react";
import { useNexTheme } from "@nex/theme-system";

/* ===== tipi ===== */

export type Direction = "ltr" | "rtl";
// se conosci i colori del tuo tema, sostituisci string con una union:
// export type SidenavColor = "primary" | "secondary" | "info" | "success" | "warning" | "error" | "dark";
export type SidenavColor = string;

export interface MaterialUIState {
    miniSidenav: boolean;
    transparentSidenav: boolean;
    whiteSidenav: boolean;
    sidenavColor: SidenavColor;
    transparentNavbar: boolean;
    fixedNavbar: boolean;
    openConfigurator: boolean;
    openReqFidoStatus: boolean;
    openFiltersCompare: boolean;
    quoteUserTarget: unknown | null; // <-- sostituisci con il tuo tipo reale
    direction: Direction;
    layout: string;
    sidebarOpen: boolean;
}

export type MaterialUIAction =
    | { type: "MINI_SIDENAV"; value: boolean }
    | { type: "TRANSPARENT_SIDENAV"; value: boolean }
    | { type: "WHITE_SIDENAV"; value: boolean }
    | { type: "SIDENAV_COLOR"; value: SidenavColor }
    | { type: "TRANSPARENT_NAVBAR"; value: boolean }
    | { type: "FIXED_NAVBAR"; value: boolean }
    | { type: "SIDEBAR_OPEN"; value: boolean }
    | { type: "OPEN_CONFIGURATOR"; value: boolean }
    | { type: "OPEN_REQFIDOSTATUS"; value: boolean }
    | { type: "OPEN_FILTERSCOMPARE"; value: boolean }
    | { type: "QUOTE_USERTARGET"; value: MaterialUIState["quoteUserTarget"] }
    | { type: "DIRECTION"; value: Direction }
    | { type: "LAYOUT"; value: string }

export type MaterialUIDispatch = React.Dispatch<MaterialUIAction>;
export type MaterialUIContextValue = [MaterialUIState, MaterialUIDispatch];

/* ===== utils locali ===== */

// lettura robusta da localStorage (evita eccezioni su JSON e SSR)
function loadFromLocalStorageBool(key: string, fallback = false): boolean {
    const { preferences } = useNexTheme();
    return preferences.mode === "dark";
}

function saveToLocalStorage(key: string, value: unknown) {
    if (typeof window === "undefined") return; // SSR safe
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // storage pieno o disabilitato: ignora
    }
}

/* ===== context ===== */

const MaterialUI = createContext<MaterialUIContextValue | undefined>(undefined);
MaterialUI.displayName = "MaterialUIContext";

/* ===== reducer ===== */

function reducer(state: MaterialUIState, action: MaterialUIAction): MaterialUIState {
    switch (action.type) {
        case "MINI_SIDENAV":
            return { ...state, miniSidenav: action.value };
        case "TRANSPARENT_SIDENAV":
            return { ...state, transparentSidenav: action.value };
        case "WHITE_SIDENAV":
            return { ...state, whiteSidenav: action.value };
        case "SIDENAV_COLOR":
            return { ...state, sidenavColor: action.value };
        case "TRANSPARENT_NAVBAR":
            return { ...state, transparentNavbar: action.value };
        case "FIXED_NAVBAR":
            return { ...state, fixedNavbar: action.value };
        case "OPEN_CONFIGURATOR":
            return { ...state, openConfigurator: action.value };
        case "OPEN_REQFIDOSTATUS":
            return { ...state, openReqFidoStatus: action.value };
        case "OPEN_FILTERSCOMPARE":
            return { ...state, openFiltersCompare: action.value };
        case "QUOTE_USERTARGET":
            return { ...state, quoteUserTarget: action.value };
        case "DIRECTION":
            return { ...state, direction: action.value };
        case "LAYOUT":
            return { ...state, layout: action.value };
        case "SIDEBAR_OPEN":
            return { ...state, sidebarOpen: action.value };
        default: {
            // usando un union discriminato, qui non dovresti mai arrivare
            throw new Error(`Unhandled action type: ${(action as any).type}`);
        }
    }
}

/* ===== provider ===== */

type ProviderProps = { children: React.ReactNode };

export function MaterialUIControllerProvider({ children }: ProviderProps) {
    // inizializzazione lazy: eseguita una sola volta, evita accessi a window su server
    const lazyInit = (): MaterialUIState => ({
        sidebarOpen: false,
        miniSidenav: false,
        transparentSidenav: false,
        whiteSidenav: true,
        sidenavColor: "primary",
        transparentNavbar: false,
        fixedNavbar: true,
        openConfigurator: true,
        openReqFidoStatus: false,
        openFiltersCompare: false,
        quoteUserTarget: null,
        direction: "ltr",
        layout: "",
    });

    const [controller, dispatch] = useReducer(reducer, undefined as unknown as MaterialUIState, lazyInit);

    const value = useMemo<MaterialUIContextValue>(() => [controller, dispatch], [controller, dispatch]);
    return <MaterialUI.Provider value={value}>{children}</MaterialUI.Provider>;
}

/* ===== hook ===== */

export function useMaterialUIController(): MaterialUIContextValue {
    const context = useContext(MaterialUI);
    if (!context) {
        throw new Error("useMaterialUIController deve essere usato dentro MaterialUIControllerProvider.");
    }
    return context;
}

/* ===== action helpers tipizzati ===== */

export const setMiniSidenav = (dispatch: MaterialUIDispatch, value: boolean) =>
    dispatch({ type: "MINI_SIDENAV", value });

export const setTransparentSidenav = (dispatch: MaterialUIDispatch, value: boolean) =>
    dispatch({ type: "TRANSPARENT_SIDENAV", value });

export const setWhiteSidenav = (dispatch: MaterialUIDispatch, value: boolean) =>
    dispatch({ type: "WHITE_SIDENAV", value });

export const setSidenavColor = (dispatch: MaterialUIDispatch, value: SidenavColor) =>
    dispatch({ type: "SIDENAV_COLOR", value });

export const setTransparentNavbar = (dispatch: MaterialUIDispatch, value: boolean) =>
    dispatch({ type: "TRANSPARENT_NAVBAR", value });

export const setFixedNavbar = (dispatch: MaterialUIDispatch, value: boolean) =>
    dispatch({ type: "FIXED_NAVBAR", value });

export const setOpenConfigurator = (dispatch: MaterialUIDispatch, value: boolean) =>
    dispatch({ type: "OPEN_CONFIGURATOR", value });

export const setOpenReqFidoStatus = (dispatch: MaterialUIDispatch, value: boolean) =>
    dispatch({ type: "OPEN_REQFIDOSTATUS", value });

export const setOpenFiltersCompare = (dispatch: MaterialUIDispatch, value: boolean) =>
    dispatch({ type: "OPEN_FILTERSCOMPARE", value });

export const setQuoteUserTarget = (dispatch: MaterialUIDispatch, value: MaterialUIState["quoteUserTarget"]) =>
    dispatch({ type: "QUOTE_USERTARGET", value });

export const setDirection = (dispatch: MaterialUIDispatch, value: Direction) =>
    dispatch({ type: "DIRECTION", value });

export const setLayout = (dispatch: MaterialUIDispatch, value: string) =>
    dispatch({ type: "LAYOUT", value });

export const setSidebarOpen = (dispatch: MaterialUIDispatch, value: boolean) =>
    dispatch({ type: "SIDEBAR_OPEN", value });
