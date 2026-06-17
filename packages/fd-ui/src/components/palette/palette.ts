export type FDColor =
    | "primary"
    | "secondary"
    | "info"
    | "success"
    | "warning"
    | "error"
    | "light"
    | "dark"
    | "purple"
    | "lightPurple"
    | "teal"
    | "neutral"
    | "transparent";

export const palette: Record<FDColor, { bg: string; soft: string; ring: string; text: string }> = {
    primary: { bg: "bg-blue-600", soft: "bg-blue-50", ring: "blue-500", text: "text-white" },
    secondary: { bg: "bg-violet-600", soft: "bg-violet-50", ring: "violet-500", text: "text-white" },
    info: { bg: "bg-sky-600", soft: "bg-sky-200", ring: "sky-500", text: "text-white" },
    success: { bg: "bg-emerald-600", soft: "bg-emerald-50", ring: "emerald-500", text: "text-white" },
    warning: { bg: "bg-amber-500", soft: "bg-amber-50", ring: "amber-500", text: "text-black" },
    error: { bg: "bg-rose-600", soft: "bg-rose-50", ring: "rose-500", text: "text-white" },
    light: { bg: "bg-white dark:bg-neutral-800", soft: "bg-white", ring: "neutral-400", text: "text-black dark:text-gray-200" },
    dark: { bg: "bg-neutral-900", soft: "bg-neutral-800", ring: "border-neutral-700", text: "text-white/90" },
    purple: { bg: "bg-purple-600", soft: "bg-purple-50", ring: "purple-500", text: "text-white" },
    lightPurple: { bg: "bg-fuchsia-400", soft: "bg-fuchsia-50", ring: "fuchsia-400", text: "text-black" },
    teal: { bg: "bg-teal-500/80", soft: "bg-teal-50 dark:bg-teal-500/60", ring: "teal-500", text: "text-white" },
    neutral: {
        bg: "bg-neutral-200 dark:bg-neutral-900", soft: "bg-neutral-100 dark:bg-neutral-800", ring: "neutral-300",
        text: "text-black dark:text-gray-200"
    },
    transparent: { bg: "bg-transparent", soft: "bg-transparent", ring: "transparent", text: "text-black dark:text-gray-200" },
} as const;

export type FDButtonVariant = "solid" | "contained" | "soft" | "outline" | "outlined" | "ghost" | "gradient" | "underline" | "text" | "textHover";