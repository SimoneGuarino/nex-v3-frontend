export type ThemeMode = "light" | "dark";
export type ThemeAccent = "blue" | "violet" | "emerald";

export type ThemePreferences = {
    mode: ThemeMode;
    accent: ThemeAccent;
};

export type SemanticThemeTokens = {
    "--nex-color-bg-app": string;
    "--nex-color-surface": string;
    "--nex-color-surface-elevated": string;
    "--nex-color-surface-overlay": string;
    "--nex-color-border": string;
    "--nex-color-border-strong": string;
    "--nex-color-text-primary": string;
    "--nex-color-text-secondary": string;
    "--nex-color-text-muted": string;
    "--nex-color-accent": string;
    "--nex-color-accent-soft": string;
    "--nex-color-accent-contrast": string;
    "--nex-color-danger": string;
    "--nex-color-danger-soft": string;
    "--nex-color-warning": string;
    "--nex-color-warning-soft": string;
    "--nex-color-success": string;
    "--nex-color-success-soft": string;
    "--nex-overlay-backdrop": string;
    "--nex-panel-shadow": string;
    "--nex-panel-shadow-drawer": string;
};

export const THEME_STORAGE_KEY = "nex.theme.preferences";
export const defaultThemePreferences: ThemePreferences = { mode: "light", accent: "blue" };

const accentByKey: Record<ThemeAccent, { solid: string; soft: string; contrast: string }> = {
    blue: {
        solid: "#2563eb",
        soft: "rgba(37, 99, 235, 0.12)",
        contrast: "#ffffff",
    },
    violet: {
        solid: "#7c3aed",
        soft: "rgba(124, 58, 237, 0.14)",
        contrast: "#ffffff",
    },
    emerald: {
        solid: "#059669",
        soft: "rgba(5, 150, 105, 0.14)",
        contrast: "#ffffff",
    },
};

/**
 * Returns the semantic CSS variables that all shell-owned panels can consume.
 * The contract intentionally uses semantic names instead of component-specific names
 * so future themes or user personalization can evolve without rewriting every panel.
 */
export function getSemanticThemeTokens(preferences: ThemePreferences): SemanticThemeTokens {
    const accent = accentByKey[preferences.accent];

    if (preferences.mode === "dark") {
        return {
            "--nex-color-bg-app": "#0b1120",
            "--nex-color-surface": "#0f172a",
            "--nex-color-surface-elevated": "#111c31",
            "--nex-color-surface-overlay": "rgba(11, 18, 32, 0.98)",
            "--nex-color-border": "rgba(148, 163, 184, 0.16)",
            "--nex-color-border-strong": "rgba(148, 163, 184, 0.24)",
            "--nex-color-text-primary": "#e5eefc",
            "--nex-color-text-secondary": "#c7d2e4",
            "--nex-color-text-muted": "#94a3b8",
            "--nex-color-accent": accent.solid,
            "--nex-color-accent-soft": accent.soft,
            "--nex-color-accent-contrast": accent.contrast,
            "--nex-color-danger": "#f43f5e",
            "--nex-color-danger-soft": "rgba(244, 63, 94, 0.12)",
            "--nex-color-warning": "#f59e0b",
            "--nex-color-warning-soft": "rgba(245, 158, 11, 0.12)",
            "--nex-color-success": "#10b981",
            "--nex-color-success-soft": "rgba(16, 185, 129, 0.12)",
            "--nex-overlay-backdrop": "rgba(2, 6, 23, 0.46)",
            "--nex-panel-shadow": "0 26px 70px rgba(2, 6, 23, 0.48)",
            "--nex-panel-shadow-drawer": "-14px 0 36px rgba(2, 6, 23, 0.45)",
        };
    }

    return {
        "--nex-color-bg-app": "#f8fafc",
        "--nex-color-surface": "#ffffff",
        "--nex-color-surface-elevated": "#f8fafc",
        "--nex-color-surface-overlay": "rgba(255, 255, 255, 0.98)",
        "--nex-color-border": "rgba(148, 163, 184, 0.18)",
        "--nex-color-border-strong": "rgba(148, 163, 184, 0.28)",
        "--nex-color-text-primary": "#0f172a",
        "--nex-color-text-secondary": "#334155",
        "--nex-color-text-muted": "#64748b",
        "--nex-color-accent": accent.solid,
        "--nex-color-accent-soft": accent.soft,
        "--nex-color-accent-contrast": accent.contrast,
        "--nex-color-danger": "#e11d48",
        "--nex-color-danger-soft": "rgba(225, 29, 72, 0.10)",
        "--nex-color-warning": "#d97706",
        "--nex-color-warning-soft": "rgba(217, 119, 6, 0.10)",
        "--nex-color-success": "#059669",
        "--nex-color-success-soft": "rgba(5, 150, 105, 0.10)",
        "--nex-overlay-backdrop": "rgba(15, 23, 42, 0.18)",
        "--nex-panel-shadow": "0 24px 64px rgba(15, 23, 42, 0.18)",
        "--nex-panel-shadow-drawer": "-12px 0 32px rgba(15, 23, 42, 0.18)",
    };
}
