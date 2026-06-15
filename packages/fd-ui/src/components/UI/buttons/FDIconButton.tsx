import React, { forwardRef, memo } from "react";
import { motion, type HTMLMotionProps, type Variants } from "framer-motion";

type FDIconButtonVariant =
    | "primary"
    | "secondary"
    | "danger"
    | "success"
    | "text"
    | "general"
    | "dark"
    | "outline";

type FDIconButtonSize = "small" | "medium" | "large";
type FDIconButtonRounded = "xs" | "sm" | "md" | "lg" | "full";

type CommonProps = {
    icon: React.ReactNode;
    badge?: {
        count: React.ReactNode;
        max?: number;
        color?: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";
        showZero?: boolean;
    }

    variant?: FDIconButtonVariant;
    size?: FDIconButtonSize;
    rounded?: FDIconButtonRounded;

    loading?: boolean;
    disabled?: boolean;
    ariaLabel?: string;
    className?: string;
    style?: React.CSSProperties;
    type?: "button" | "submit" | "reset";

    dataTooltipId?: string;
    dataTooltipContent?: string;
    dataTour?: string;

    /**
     * Usa motion.button.
     * Default: true
     */
    asMotion?: boolean;

    /**
     * Permette di disattivare l'animazione iniziale
     * anche quando asMotion = true.
     */
    initial?: boolean;
};

type NativeButtonProps = Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    | "children"
    | "className"
    | "style"
    | "type"
    | "disabled"
    | "aria-label"
    | "onClick"
>;

type MotionButtonProps = Omit<
    HTMLMotionProps<"button">,
    | "children"
    | "className"
    | "style"
    | "type"
    | "disabled"
    | "aria-label"
    | "onClick"
>;

export type FDIconButtonProps =
    | (CommonProps & {
        asMotion?: true;
        onClick?: React.MouseEventHandler<HTMLButtonElement>;
    } & MotionButtonProps)
    | (CommonProps & {
        asMotion: false;
        onClick?: React.MouseEventHandler<HTMLButtonElement>;
    } & NativeButtonProps);

function clsx(...parts: Array<string | false | null | undefined>) {
    return parts.filter(Boolean).join(" ");
}

const variantClasses: Record<FDIconButtonVariant, string> = {
    general:
        "bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700",
    primary:
        "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500/60 dark:hover:bg-blue-600",
    secondary:
        "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600",
    danger:
        "bg-red-600/70 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600",
    success:
        "bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600",
    text:
        "bg-transparent text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700",
    dark:
        "bg-neutral-800 hover:bg-neutral-700 text-white",
    outline:
        "border border-neutral-200 dark:border-neutral-600 bg-transparent",
};

const variantTextClass: Record<FDIconButtonVariant, string> = {
    general:
        "text-gray-900 dark:text-gray-300 disabled:text-gray-400 disabled:dark:text-gray-600",
    primary: "text-white",
    secondary: "text-gray-800 dark:text-gray-300",
    danger: "text-white",
    success: "text-white",
    text: "text-gray-800 dark:text-gray-200",
    dark: "text-white",
    outline: "text-gray-900 dark:text-gray-300",
};

const sizeClasses: Record<FDIconButtonSize, string> = {
    small: "p-1 text-sm",
    medium: "p-2 text-base",
    large: "p-4 text-lg",
};

const roundedClasses: Record<FDIconButtonRounded, string> = {
    xs: "rounded-xs",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
};

const motionVariants: Variants = {
    initial: { scale: 0.96, opacity: 0 },
    animate: {
        scale: 1,
        opacity: 1,
        transition: { type: "spring", stiffness: 320, damping: 24 },
    },
    hover: {
        scale: 1.08,
        transition: { type: "spring", stiffness: 420, damping: 22 },
    },
    tap: {
        scale: 0.94,
        transition: { type: "spring", stiffness: 520, damping: 30 },
    },
    exit: {
        scale: 0.96,
        opacity: 0,
        transition: { duration: 0.15 },
    },
};

const FDIconButtonInner = forwardRef<HTMLButtonElement, FDIconButtonProps>(
    function FDIconButtonInner(props, ref) {
        const {
            icon,
            onClick,
            variant = "general",
            size = "medium",
            disabled = false,
            ariaLabel,
            className,
            loading = false,
            type = "button",
            dataTooltipId,
            dataTooltipContent = "",
            style,
            initial = true,
            rounded = "full",
            dataTour,
            asMotion = true,
            badge,
            ...rest
        } = props;

        const isDisabled = disabled || loading;

        const baseClass = clsx(
            "fd-icon-button inline-flex items-center justify-center",
            "transition-colors duration-150",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
            sizeClasses[size],
            roundedClasses[rounded],
            variantTextClass[variant],
            variantClasses[variant],
            isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
            className,
            badge ? "relative" : ""
        );

        const commonDomProps = {
            ref,
            type,
            onClick,
            disabled: isDisabled,
            "aria-label": ariaLabel,
            "data-tour": dataTour,
            "data-tooltip-id": dataTooltipId,
            "data-tooltip-content": dataTooltipContent,
            className: baseClass,
            style,
        } as const;

        const content = loading ? (
            <span className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 dark:border-gray-500 dark:border-t-white rounded-full animate-spin" />
        ) : (
            icon
        );

        const badgeRander = ((badge && !loading) && (badge.showZero || badge.count)) ? (
            <span
                className={clsx(
                    "absolute -top-1 -right-1 px-1.5 text-xs font-bold rounded-full",
                    badge.color === "default" ? "bg-gray-300 text-gray-800" :
                        badge.color === "primary" ? "bg-blue-600 text-white" :
                            badge.color === "secondary" ? "bg-gray-600 text-white" :
                                badge.color === "error" ? "bg-red-600 text-white" :
                                    badge.color === "info" ? "bg-cyan-600 text-white" :
                                        badge.color === "success" ? "bg-green-600 text-white" :
                                            badge.color === "warning" ? "bg-yellow-500 text-white" :
                                                "bg-gray-300 text-gray-800"
                )}
            >
                {badge.count && (badge.max || 999) && typeof badge.count === "number" && badge.count > (badge.max || 999)
                    ? `${(badge.max || 999)}+`
                    : badge.count}
            </span>
        ) : null;

        if (!asMotion) {
            const nativeRest = rest as NativeButtonProps;

            return (
                <button {...commonDomProps} {...nativeRest}>
                    {content}
                </button>
            );
        }

        const motionRest = rest as MotionButtonProps;

        return (
            <motion.button
                {...commonDomProps}
                variants={motionVariants}
                initial={initial ? "initial" : false}
                animate="animate"
                exit="exit"
                whileHover={!isDisabled ? "hover" : undefined}
                whileTap={!isDisabled ? "tap" : undefined}
                {...motionRest}
            >
                {content}
                {badgeRander}
            </motion.button>
        );
    }
);

export const FDIconButton = memo(FDIconButtonInner);
export default FDIconButton;