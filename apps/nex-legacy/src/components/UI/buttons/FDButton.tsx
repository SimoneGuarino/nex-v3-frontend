import React, { forwardRef, memo } from "react";
import { motion, type HTMLMotionProps, type Variants } from "framer-motion";


// ——————————————————————————————————————————————————————————
// TYPES
// ——————————————————————————————————————————————————————————
export type FDVariant = "solid" | "contained" | "soft" | "outline" | "outlined" | "ghost" | "gradient" | "underline" | "text";
type DefaultSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type FDRadius = "none" | DefaultSize | "full";
export type FDSize = "small" | "medium" | "large" | DefaultSize;
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
    | "neutral"
    | "none";

/**
 * Props comuni (indipendenti dal fatto che sia motion o native button).
 * Nota: NON estendiamo attributi DOM qui, per evitare collisioni con Framer Motion.
 */
type CommonProps = {
    children?: React.ReactNode;

    variant?: FDVariant;
    size?: FDSize;
    textSize?: DefaultSize; // textSize non può essere "none" e "full"
    color?: FDColor;
    radius?: FDRadius;
    shadow?: DefaultSize | "none";
    border?: boolean;

    loading?: boolean;
    errors?: boolean;
    icon?: React.ReactNode;
    rightIcon?: React.ReactNode;

    fullWidth?: boolean;

    /** Tooltip (es. react-tooltip) */
    dataTooltipId?: string;
    dataTooltipContent?: string;

    /** Gradient override (tailwind class string) */
    gradientFrom?: string;
    gradientTo?: string;

    /** Tour attribute */
    dataTour?: string;

    /** Usa motion.button (default true) */
    asMotion?: boolean;

    /** ClassName aggiuntivo */
    className?: string;
};

type NativeButtonProps = Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "color" | "className" | "children"
>;

type MotionButtonProps = Omit<
    HTMLMotionProps<"button">,
    "color" | "className" | "children"
>;

/**
 * Unione discriminata:
 * - asMotion = true (default): accetta MotionButtonProps
 * - asMotion = false: accetta NativeButtonProps
 */
export type FDButtonProps =
    | (CommonProps & { asMotion?: true } & MotionButtonProps)
    | (CommonProps & { asMotion: false } & NativeButtonProps);


// ——————————————————————————————————————————————————————————
// HELPERS
// ——————————————————————————————————————————————————————————
function clsx(...parts: Array<string | false | null | undefined>) {
    return parts.filter(Boolean).join(" ");
};

/*const palette = {
    primary: { bg: "bg-blue-500", soft: "bg-blue-50 dark:bg-blue-800", ring: "blue-500", textOnSolid: "text-white", textOnOutline: "text-blue-600" },
    secondary: { bg: "bg-violet-600", soft: "bg-violet-50 dark:bg-violet-800", ring: "violet-500", textOnSolid: "text-white", textOnOutline: "text-violet-600" },
    info: { bg: "bg-sky-600", soft: "bg-sky-50 dark:bg-sky-800", ring: "sky-500", textOnSolid: "text-white", textOnOutline: "text-sky-600" },
    success: { bg: "bg-emerald-600", soft: "bg-emerald-50 dark:bg-emerald-800", ring: "emerald-500", textOnSolid: "text-white", textOnOutline: "text-emerald-600" },
    warning: { bg: "bg-amber-500", soft: "bg-amber-50 dark:bg-amber-800", ring: "amber-500", textOnSolid: "text-black", textOnOutline: "text-amber-600" },
    error: { bg: "bg-rose-600", soft: "bg-rose-50 dark:bg-rose-800", ring: "rose-500", textOnSolid: "text-white", textOnOutline: "text-rose-600" },
    light: { bg: "bg-white dark:bg-neutral-800", soft: "bg-white", ring: "neutral-300", textOnSolid: "text-black", textOnOutline: "text-neutral-800" },
    dark: { bg: "bg-neutral-900", soft: "bg-neutral-800", ring: "border-neutral-500", textOnSolid: "text-white/90", textOnOutline: "text-white" },
    purple: { bg: "bg-purple-600", soft: "bg-purple-50", ring: "purple-500", textOnSolid: "text-white", textOnOutline: "text-purple-600" },
    lightPurple: { bg: "bg-fuchsia-400", soft: "bg-fuchsia-50", ring: "fuchsia-400", textOnSolid: "text-black", textOnOutline: "text-fuchsia-600" },
    neutral: { bg: "bg-neutral-200 dark:bg-neutral-800", soft: "bg-neutral-100 dark:bg-neutral-800", ring: "border-neutral-300 dark:border-neutral-600", textOnSolid: "text-black dark:text-white", textOnOutline: "text-neutral-600 dark:text-neutral-300" },
    none: { bg: "", soft: "", ring: "", textOnSolid: "", textOnOutline: "" },
} as const;*/

const palette = {
    primary: {
        bg: "bg-sky-600",
        soft: "bg-blue-50 dark:bg-blue-800/30",
        ring: "border-sky-500/40",
        textOnSolid: "text-white",
        textOnOutline: "text-sky-600 dark:text-blue-300",
        onHover: "hover:bg-blue-500/10",
    },
    secondary: {
        bg: "bg-violet-600",
        soft: "bg-violet-50 dark:bg-violet-900/30",
        ring: "border-violet-500/40",
        textOnSolid: "text-white",
        textOnOutline: "text-violet-600 dark:text-violet-300",
        onHover: "hover:bg-violet-600/10",
    },
    info: {
        bg: "bg-sky-600",
        soft: "bg-sky-50 dark:bg-sky-900/30",
        ring: "border-sky-500/40",
        textOnSolid: "text-white",
        textOnOutline: "text-sky-600 dark:text-sky-300",
            onHover: "hover:bg-sky-600/10",
    },
    success: {
        bg: "bg-emerald-500",
        soft: "bg-emerald-50 dark:bg-emerald-900/30",
        ring: "border-emerald-500/40",
        textOnSolid: "text-white",
        textOnOutline: "text-emerald-600 dark:text-emerald-300",
        onHover: "hover:bg-emerald-500/10",
    },
    warning: {
        bg: "bg-amber-500",
        soft: "bg-amber-50 dark:bg-amber-900/30",
        ring: "border-amber-500/40",
        textOnSolid: "text-black",
        textOnOutline: "text-amber-700 dark:text-amber-300",
        onHover: "hover:bg-amber-500/10",
    },
    error: {
        bg: "bg-rose-600",
        soft: "bg-rose-50 dark:bg-rose-900/30",
        ring: "border-rose-500/40",
        textOnSolid: "text-white",
        textOnOutline: "text-rose-600 dark:text-rose-300",
        onHover: "hover:bg-rose-600/10",
    },
    light: {
        bg: "bg-white dark:bg-neutral-800",
        soft: "bg-white dark:bg-neutral-800",
        ring: "border-neutral-300 dark:border-neutral-600",
        textOnSolid: "text-neutral-900 dark:text-neutral-100",
        textOnOutline: "text-neutral-900 dark:text-neutral-100",
        onHover: "hover:bg-neutral-200/30 dark:hover:bg-neutral-800/30",
    },
    dark: {
        bg: "bg-neutral-900",
        soft: "bg-neutral-800",
        ring: "border-neutral-600/60",
        textOnSolid: "text-white/90",
        textOnOutline: "text-white/90",
        onHover: "hover:bg-neutral-100/10 dark:hover:bg-neutral-100/10",
    },
    purple: {
        bg: "bg-purple-600",
        soft: "bg-purple-50 dark:bg-purple-900/30",
        ring: "border-purple-500/40",
        textOnSolid: "text-white",
        textOnOutline: "text-purple-600 dark:text-purple-300",
        onHover: "hover:bg-purple-600/10",
    },
    lightPurple: {
        bg: "bg-fuchsia-400",
        soft: "bg-fuchsia-50 dark:bg-fuchsia-900/20",
        ring: "border-fuchsia-400/40",
        textOnSolid: "text-black",
        textOnOutline: "text-fuchsia-700 dark:text-fuchsia-300",
        onHover: "hover:bg-fuchsia-400/10",
    },
    neutral: {
        bg: "bg-neutral-200 dark:bg-neutral-800",
        soft: "bg-neutral-100 dark:bg-neutral-800",
        ring: "border-neutral-300 dark:border-neutral-600",
        textOnSolid: "text-neutral-900 dark:text-neutral-100",
        textOnOutline: "text-neutral-700 dark:text-neutral-300",
        onHover: "hover:bg-neutral-300/10 dark:hover:bg-neutral-700/10",
    },
    none: {
        bg: "",
        soft: "",
        ring: "",
        textOnSolid: "",
        textOnOutline: "",
        onHover: "",
    },
} as const;

const radiusMap: Record<FDRadius, string> = {
    none: "rounded-none",
    xs: "rounded-xs",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    full: "rounded-full",
};

const sizeMap: Record<FDSize, string> = {
    small: "px-3 py-1",
    medium: "px-6 py-2",
    large: "px-6 py-3",
    xs: "px-2 py-0.5",
    sm: "px-3 py-1",
    md: "px-4 py-1.5",
    lg: "px-5 py-2.5",
    xl: "px-6 py-3",
    "2xl": "px-8 py-4",
};

function getVariantClasses(
    variant: FDVariant,
    color: FDColor,
    gradientFrom?: string,
    gradientTo?: string,
    asMotion?: boolean,
) {
    const c = palette[color] ?? palette.neutral;

    switch (variant) {
        case "contained":
            return clsx(
                c.bg,
                color === "light" ? "text-neutral-900 dark:text-gray-200" : c.textOnSolid,
            );
        case "solid":
            return clsx(c.bg, c.textOnSolid);

        case "soft":
            return clsx(c.soft, "text-neutral-900 dark:text-neutral-100");

        case "outline":
        case "outlined":
            return clsx(
                "bg-transparent",
                `border ${c.ring}`,
                c.textOnOutline,
                !asMotion ? c?.onHover : "whileHover:bg-opacity-10"
            );

        case "ghost":
        case "text":
            return clsx("bg-transparent text-inherit", color === "error" ? c.textOnOutline : c.textOnSolid);

        case "gradient":
            // NB: gradientFrom/To devono essere classi tailwind valide (es. "from-blue-500")
            return clsx(
                "bg-gradient-to-br",
                gradientFrom ?? "from-blue-600",
                gradientTo ?? "to-indigo-600",
                color === "light" ? "text-neutral-900" : "text-white"
            );

        case "underline":
            return clsx(
                "bg-transparent border-b-2",
                `${c.ring}`,
                c.textOnOutline,
            );
    }
};

const motionVariants: Variants = {
    initial: { scale: 0.98, opacity: 0 },
    animate: {
        scale: 1,
        opacity: 1,
        transition: { type: "spring", stiffness: 300, damping: 24 },
    },
    hover: {
        scale: 1.03,
        transition: { type: "spring", stiffness: 420, damping: 22 },
    },
    tap: {
        scale: 0.97,
        transition: { type: "spring", stiffness: 520, damping: 30 },
    },
    exit: { scale: 0.96, opacity: 0, transition: { duration: 0.15 } },
};


// ——————————————————————————————————————————————————————————
// COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * FDButton
 *
 * - `asMotion` true (default): usa framer-motion con hover/tap/animate.
 * - `asMotion` false: usa un normale <button>.
 *
 * Questo evita:
 * - Warning React "whileHover su DOM element"
 * - Collisioni TS: onAnimationStart DOM vs Framer Motion
 */
const FDButtonInner = forwardRef<HTMLButtonElement, FDButtonProps>(
    function FDButtonInner(props, ref) {
        const {
            children,
            variant = "solid",
            color = "light",
            size = "medium",
            textSize = "sm",
            radius = "md",
            border,
            shadow,
            loading = false,
            errors = false,
            icon,
            rightIcon,
            fullWidth = false,
            className,
            dataTooltipId,
            dataTooltipContent,
            gradientFrom,
            gradientTo,
            dataTour,
            asMotion = true,
            disabled,
            type,
            onClick,
            ...rest
        } = props;

        const isDisabled = Boolean(disabled || loading);

        const baseClass = clsx(
            "inline-flex items-center justify-center gap-2",
            "select-none",
            "transition-colors duration-150",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
            radiusMap[radius],
            sizeMap[size],
            `text-${textSize}`,
            shadow && `shadow-${shadow}`,
            border && `border ${palette[color]?.ring || palette.neutral.ring}`,
            getVariantClasses(variant, color, gradientFrom, gradientTo, asMotion),
            fullWidth && "w-full",
            isDisabled && "!opacity-50 cursor-not-allowed",
            errors && "ring-2 ring-red-500 bg-red-50/10 dark:bg-red-950/20 rounded-sm animate-shake",
            !isDisabled && "cursor-pointer",
            className
        );

        const commonDomProps = {
            ref,
            className: baseClass,
            disabled: isDisabled,
            onClick,
            type: (type ?? "button") as "button" | "submit" | "reset",
            "data-tooltip-id": dataTooltipId,
            "data-tooltip-content": dataTooltipContent,
            "data-tour": dataTour,
        } as const;

        const content = (
            <>
                {/* Loading overlay minimale */}
                {loading ? (
                    <span className={`mr-2 animate-spin h-4 w-4 border-2 border-t-transparent ${color !== "primary" ? "border-gray-400" : "border-white"} rounded-full`} />
                ) : null}
                {icon ? <span className="inline-flex shrink-0">{icon}</span> : null}
                {children ? <span className="inline-flex">{children}</span> : null}
                {rightIcon ? (
                    <span className="inline-flex shrink-0">{rightIcon}</span>
                ) : null}
            </>
        );

        if (!asMotion) {
            const nativeRest = rest as NativeButtonProps;
            return (
                <button {...commonDomProps} {...nativeRest}>
                    {content}
                </button>
            );
        };

        const motionRest = rest as MotionButtonProps;
        return (
            <motion.button
                {...commonDomProps}
                variants={motionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                whileHover={!isDisabled ? "hover" : undefined}
                whileTap={!isDisabled ? "tap" : undefined}
                {...motionRest}
            >
                {content}
            </motion.button>
        );
    }
);

export const FDButton = memo(FDButtonInner);
export default FDButton;