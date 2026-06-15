//src\components\UI\box\FDBox.tsx
import React, { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

type FDVariant = "solid" | "soft" | "outline" | "ghost" | "gradient" | "gradient-simple";
type FDColor =
    | "primary" | "secondary" | "info" | "success" | "warning" | "error"
    | "light" | "dark" | "purple" | "lightPurple" | "teal" | "neutral";

type FDShadow = "none" | "sm" | "md" | "lg" | "xl" | "2xl";
type FDRadius = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
type FDSize = "none" | "xs" | "sm" | "md" | "lg"; // padding helper

export interface FDBoxProps extends Omit<HTMLMotionProps<"div">, "color"> {
    variant?: FDVariant;
    color?: FDColor;               // semantico (non CSS color)
    radius?: FDRadius;             // default "none"
    shadow?: FDShadow;             // default "none"
    pad?: FDSize;                  // padding rapido (p-*)
    gradientFrom?: string;         // opzionale override gradient (e.g. "from-blue-500")
    gradientTo?: string;           // opzionale override gradient (e.g. "to-indigo-600")
    fullWidth?: boolean;
    asMotion?: boolean;            // se true usa motion.div
    border?: boolean;              // se true aggiunge bordo (utile per variant outline)
    translate?: "no" | "yes"
}

/** mapping palette → tailwind */
const palette = {
    primary: { bg: "bg-blue-600", soft: "bg-blue-200", ring: "blue-500", textOnSolid: "text-white" },
    secondary: { bg: "bg-violet-600", soft: "bg-violet-50", ring: "violet-500", textOnSolid: "text-white" },
    info: { bg: "bg-sky-600", soft: "bg-sky-200", ring: "sky-500", textOnSolid: "text-white" },
    success: { bg: "bg-emerald-600", soft: "bg-emerald-50", ring: "emerald-500", textOnSolid: "text-white" },
    warning: { bg: "bg-amber-500", soft: "bg-amber-100", ring: "amber-500", textOnSolid: "text-black" },
    error: { bg: "bg-rose-600", soft: "bg-rose-50", ring: "rose-500", textOnSolid: "text-white" },
    light: { bg: "bg-white dark:bg-neutral-800", soft: "bg-white", ring: "neutral-300", textOnSolid: "text-black dark:text-gray-200" },
    dark: { bg: "bg-neutral-900", soft: "bg-neutral-800", ring: "neutral-700", textOnSolid: "text-white/90" },
    purple: { bg: "bg-purple-600", soft: "bg-purple-50", ring: "purple-500", textOnSolid: "text-white" },
    lightPurple: { bg: "bg-fuchsia-400", soft: "bg-fuchsia-50", ring: "fuchsia-400", textOnSolid: "text-black" },
    teal: { bg: "bg-teal-500/80", soft: "bg-teal-50 dark:bg-teal-500/60", ring: "teal-500", textOnSolid: "text-white" },
    neutral: { bg: "bg-neutral-200 dark:bg-neutral-900", soft: "bg-neutral-200 dark:bg-neutral-800/60", ring: "neutral-300 dark:border-neutral-700", textOnSolid: "text-black dark:text-gray-200" },
} as const;

const radiusMap: Record<FDRadius, string> = {
    none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg",
    xl: "rounded-xl", "2xl": "rounded-2xl", full: "rounded-full",
};

const shadowMap: Record<FDShadow, string> = {
    none: "shadow-none", sm: "shadow-sm", md: "shadow-md", lg: "shadow-lg",
    xl: "shadow-xl", "2xl": "shadow-2xl",
};

const padMap: Record<FDSize, string> = {
    none: "", xs: "p-2", sm: "p-3", md: "p-4", lg: "p-6",
};

export function clsx(...x: Array<string | undefined | false>) {
    return x.filter(Boolean).join(" ");
}

function variantClasses(variant: FDVariant, color: FDColor, gradientFrom?: string, gradientTo?: string, border?: boolean) {
    const c = palette[color] ?? palette.neutral;

    switch (variant) {
        case "solid":
            return clsx(
                c.bg,
                color === "light" ? "text-neutral-900 dark:text-gray-200" : c.textOnSolid,
                border ? "border" : ""
            );

        case "soft":
            return clsx(
                `${c.soft} text-neutral-900 ${color === "neutral" ? "dark:text-white" : ""}`,
                border ? `border border-${c.ring}` : ""
            );

        case "outline":
            return clsx(
                "bg-transparent",
                `border border-${c.ring}`,
                `text-neutral-900 dark:text-neutral-100`
            );

        case "ghost":
            return clsx(
                "bg-transparent",
                border ? `border border-${c.ring}` : "",
                c.textOnSolid);

        case "gradient":
            return clsx(
                "bg-gradient-to-br",
                gradientFrom ?? `from-${c.bg}`,
                gradientTo ?? (color === "primary" ? "to-indigo-600" : `to-${c.bg}`),
                color === "light" ? "text-neutral-900 dark:text-gray-200" : `text-${c.textOnSolid}`,
                border ? "border border-black/5 dark:border-white/10" : "",
                "backdrop-blur supports-[backdrop-filter]:backdrop-blur",
            );

        case "gradient-simple":
            return clsx(
                "bg-gradient-to-br",
                gradientFrom ?? `from-${c.bg}`,
                gradientTo ?? (color === "primary" ? "to-indigo-600" : `to-${c.bg}`),
                color === "light" ? "text-neutral-900 dark:text-gray-200" : `text-${c.textOnSolid}`,
                border ? "border border-black/5 dark:border-white/10" : "",
            );
    }
}

export const FDBox = forwardRef<HTMLDivElement, FDBoxProps>(function FDBox(
    {
        variant = "solid",
        color = "light",
        radius = "none",
        shadow = "none",
        pad = "none",
        className,
        fullWidth,
        asMotion,
        gradientFrom = "from-white/90 dark:from-neutral-900/80",
        gradientTo = "to-white/60 dark:to-neutral-900/60",
        translate = "no",
        border = false,
        ...rest
    },
    ref
) {
    const base = clsx(
        "relative", // come MDBox
        "transition-all duration-200",
        radiusMap[radius],
        shadowMap[shadow],
        padMap[pad],
        fullWidth && "w-full",
        variantClasses(variant, color, gradientFrom, gradientTo, border),
        className
    );

    const Comp = asMotion ? motion.div : ("div" as any);
    return <Comp ref={ref} className={base} {...rest} translate={translate} />;
});

export default FDBox;