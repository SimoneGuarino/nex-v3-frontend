import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import {
    THEME_STORAGE_KEY,
    defaultThemePreferences,
    getSemanticThemeTokens,
    type ThemeMode,
    type ThemePreferences,
} from "./tokens";

type ThemeContextValue = {
    preferences: ThemePreferences;
    setMode: (mode: ThemeMode) => void;
    toggleMode: (preference?: ThemeMode) => void;
    setAccent: (accent: ThemePreferences["accent"]) => void;
};

const NexThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readStoredPreferences(): ThemePreferences {
    if (typeof window === "undefined") return defaultThemePreferences;

    try {
        const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
        return raw ? { ...defaultThemePreferences, ...JSON.parse(raw) } : defaultThemePreferences;
    } catch {
        return defaultThemePreferences;
    }
}

function writeStoredPreferences(next: ThemePreferences): void {
    if (typeof window !== "undefined") {
        window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(next));
    }
}

/**
 * Synchronizes semantic CSS tokens on the root element.
 * All shell-owned overlays and future theme-aware shared components should depend on this contract.
 */
function applyRootThemeAttributes(preferences: ThemePreferences): void {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const semanticTokens = getSemanticThemeTokens(preferences);

    root.classList.toggle("dark", preferences.mode === "dark");
    root.dataset.themeMode = preferences.mode;
    root.dataset.themeAccent = preferences.accent;

    Object.entries(semanticTokens).forEach(([key, value]) => {
        root.style.setProperty(key, value);
    });
}

export function NexThemeProvider({ children }: { children: React.ReactNode }) {
    const [preferences, setPreferences] = useState<ThemePreferences>(() => readStoredPreferences());

    useEffect(() => {
        writeStoredPreferences(preferences);
        applyRootThemeAttributes(preferences);
    }, [preferences]);

    const muiTheme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode: preferences.mode,
                    primary: {
                        main:
                            preferences.accent === "violet"
                                ? "#7c3aed"
                                : preferences.accent === "emerald"
                                  ? "#059669"
                                  : "#2563eb",
                    },
                    background: {
                        default: preferences.mode === "dark" ? "#0b1120" : "#f8fafc",
                        paper: preferences.mode === "dark" ? "#111827" : "#ffffff",
                    },
                },
                shape: { borderRadius: 16 },
                typography: { fontFamily: "Inter, system-ui, sans-serif" },
            }),
        [preferences],
    );

    const value = useMemo<ThemeContextValue>(
        () => ({
            preferences,
            setMode: (mode) => setPreferences((prev) => ({ ...prev, mode })),
            toggleMode: (preference?: ThemeMode) =>
                setPreferences((prev) => ({
                    ...prev,
                    mode: preference ?? (prev.mode === "dark" ? "light" : "dark"),
                })),
            setAccent: (accent) => setPreferences((prev) => ({ ...prev, accent })),
        }),
        [preferences],
    );

    return (
        <NexThemeContext.Provider value={value}>
            <MuiThemeProvider theme={muiTheme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </NexThemeContext.Provider>
    );
}

export function useNexTheme() {
    const ctx = useContext(NexThemeContext);
    if (!ctx) throw new Error("useNexTheme must be used within NexThemeProvider");
    return ctx;
}
