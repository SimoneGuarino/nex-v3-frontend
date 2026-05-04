import React, {
    forwardRef,
    memo,
    useId,
    useMemo,
    useRef,
    useState,
    HTMLInputTypeAttribute,
} from "react";
import { HTMLMotionProps, motion, Variants } from "framer-motion";
import { FDColor, palette } from "../../palette/palette";

type FDInputVariant = "outline" | "filled" | "underline" | "ghost" | "text";
type FDInputSize = "xs" | "sm" | "md" | "lg";
type FDRadius = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";

export interface FDInputProps
    extends Omit<HTMLMotionProps<"input">, "size"> {
    label?: string | React.ReactNode;
    variant?: FDInputVariant;
    radius?: FDRadius;
    color?: FDColor;
    size?: FDInputSize;
    error?: boolean | string;
    helperText?: React.ReactNode;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    clearable?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    containerClassName?: string;
    placeholder?: string;
    /** Definisce se l'etichetta deve essere animata o deve essere statica sopra al campo di input */
    animatedLabel?: boolean;
}

/** micro-animazioni per input e label */
const inputVariants: Variants = {
    initial: { opacity: 0, scale: 0.98 },
    animate: {
        opacity: 1,
        scale: 1,
        transition: { type: "spring", stiffness: 300, damping: 24 },
    },
    focus: {
        scale: 1.002,
        transition: { type: "spring", stiffness: 400, damping: 22 },
    },
};

const labelVariants: Variants = {
    rest: { y: 0, scale: 1, opacity: 0.9 },
    float: { y: -21, scale: 0.85, opacity: 0.9, transition: { duration: 0.16 } },
};

const sizeClasses: Record<FDInputSize, { input: string; label: string; padX: string }> = {
    xs: { input: "h-8 text-xs", label: "text-[0.65rem]", padX: "px-2.5" },
    sm: { input: "h-9 text-sm", label: "text-xs", padX: "px-3" },
    md: { input: "h-11 text-base", label: "text-sm", padX: "px-3.5" },
    lg: { input: "h-12 text-lg", label: "text-base", padX: "px-4" },
};

const radiusMap: Record<FDRadius, string> = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    full: "rounded-full",
};

/*const variantClasses: Record<
    FDInputVariant,
    { base: string; focus: string; error: string; underlineExtra?: string }
> = {
    outline: {
        base:
            "border bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 " +
            "border-neutral-300 dark:border-neutral-700 focus:outline-none",
        focus: "focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500",
        error: "border-red-500 focus:ring-red-500/50 focus:border-red-500",
    },
    filled: {
        base:
            "border border-transparent bg-neutral-100 text-neutral-900 " +
            "dark:bg-neutral-800 dark:text-neutral-100 focus:outline-none",
        focus: "focus:ring-2 focus:ring-blue-500/40 bg-white dark:bg-neutral-800",
        error: "ring-2 ring-red-500/40",
    },
    underline: {
        base:
            "border-0 border-b rounded-none bg-transparent text-neutral-900 " +
            "dark:text-neutral-100 focus:outline-none",
        focus: "focus:border-b-2 focus:border-blue-500",
        error: "border-b-red-500 focus:border-b-red-500",
        underlineExtra: "border-b border-neutral-300 dark:border-neutral-700",
    },
};*/


function variantClasses(variant: FDInputVariant, color: FDColor) {
    const c = palette[color] ?? palette.neutral;

    switch (variant) {
        case "filled":
            return {
                base: `border ${c.bg} ${color === "light" ? "text-neutral-900 dark:text-gray-200" : c.text} 
                    border-neutral-300 dark:border-neutral-700 focus:outline-none`,
                focus: "focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500",
                error: "border-red-500 focus:ring-red-500/50 focus:border-red-500",
                underlineExtra: "border-b border-neutral-300 dark:border-neutral-700",
            }

        case "underline":
            return {
                base: `border-0 border-b ${color === "light" ? "text-neutral-900 dark:text-gray-200" : c.text} 
                    border-neutral-300 dark:border-neutral-700 focus:outline-none`,
                focus: "focus:border-b-2 focus:border-blue-500",
                error: "border-b-red-500 focus:border-b-red-500",
                underlineExtra: "border-b border-neutral-300 dark:border-neutral-700",
            }

        case "outline":
            return {
                base: `border ${c.ring} ${c.text} focus:outline-none  
                    border-neutral-300 dark:border-neutral-700 focus:outline-none`,
                focus: "focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500",
                error: "border-red-500 focus:ring-red-500/50 focus:border-red-500",
                underlineExtra: "border-b border-neutral-300 dark:border-neutral-700",
            }

        case "ghost":
            return {
                base: `bg-transparent ${c.text} focus:outline-none`,
                focus: "focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500",
                error: "border-red-500 focus:ring-red-500/50 focus:border-red-500",
                underlineExtra: "border-b border-neutral-300 dark:border-neutral-700",
            }
            
        case "text":
            return {
                base: `bg-transparent ${c.text} focus:outline-none`,
                focus: "focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500",
                error: "border-red-500 focus:ring-red-500/50 focus:border-red-500",
                underlineExtra: "border-b border-neutral-300 dark:border-neutral-700",
            }
    }
}

/** Spinner minimal */
const Spinner = () => (
    <span className="animate-spin h-4 w-4 border-2 border-t-transparent border-current rounded-full" />
);

/** Icona eye semplice (inline) */
const EyeIcon: React.FC<{ off?: boolean }> = ({ off }) => (
    <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
    >
        {off ? (
            <>
                <path d="M3 3l18 18" />
                <path d="M10.7 10.7a3 3 0 104.24 4.24" />
                <path d="M9.88 5.09A9.94 9.94 0 0121 12c-1.8 2.8-4.9 5-9 5-1.1 0-2.17-.17-3.17-.5" />
                <path d="M6.1 6.1A9.94 9.94 0 003 12c1.8 2.8 4.9 5 9 5" />
            </>
        ) : (
            <>
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                <circle cx="12" cy="12" r="3" />
            </>
        )}
    </svg>
);

const ClearIcon = () => (
    <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
    >
        <path d="M18 6L6 18" />
        <path d="M6 6l12 12" />
    </svg>
);

export const FDInput = memo(
    forwardRef<HTMLInputElement, FDInputProps>(function FDInput(
        {
            id,
            label,
            type = "text",
            variant = "outline",
            color = "neutral",
            size = "md",
            radius = "xl",
            error,
            helperText,
            leftIcon,
            rightIcon,
            clearable = false,
            loading,
            fullWidth,
            className = "",
            containerClassName = "",
            placeholder = " ",
            disabled,
            value,
            defaultValue,
            animatedLabel = true,
            onChange,
            onFocus,
            onBlur,
            ...rest
        },
        ref
    ) {
        const innerId = useId();
        const inputId = id ?? innerId;
        const inputRef = useRef<HTMLInputElement | null>(null);
        const [focused, setFocused] = useState(false);
        const [showPwd, setShowPwd] = useState(false);
        const [uncontrolledValue, setUncontrolledValue] = useState(() =>
            defaultValue !== undefined && defaultValue !== null ? String(defaultValue) : ""
        );

        const isControlled = value !== undefined;
        const effectiveValue = isControlled ? value : uncontrolledValue;

        const isPassword = type === "password";
        const computedType: HTMLInputTypeAttribute =
            isPassword && showPwd ? "text" : type;

        // floating se ho focus o c'e' un valore
        const hasText =
            (typeof effectiveValue === "number" && !Number.isNaN(effectiveValue)) ||
            (typeof effectiveValue === "string" && effectiveValue.length > 0) ||
            (Array.isArray(effectiveValue) && effectiveValue.length > 0);

        const sizeCfg = sizeClasses[size];
        const vCfg = variantClasses(variant, color);

        const leftPad = leftIcon ? "pl-10" : "";
        const rightAdornmentCount =
            (rightIcon && !isPassword ? 1 : 0) +
            (loading ? 1 : 0) +
            (isPassword ? 1 : 0) +
            (clearable ? 1 : 0);

        const rightPad = rightAdornmentCount === 0
            ? ""
            : rightAdornmentCount === 1
                ? "pr-10"
                : rightAdornmentCount === 2
                    ? "pr-16"
                    : rightAdornmentCount === 3
                        ? "pr-24"
                        : "pr-28";

        const clearInput = () => {
            if (disabled) return;
            const el = inputRef.current;
            if (!el) return;

            const nativeValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                "value"
            )?.set;
            nativeValueSetter?.call(el, "");

            if (!isControlled) setUncontrolledValue("");

            onChange?.({
                target: el,
                currentTarget: el,
            } as React.ChangeEvent<HTMLInputElement>);
        };

        const baseClasses = useMemo(() => {
            const common =
                `${radiusMap[radius]} ` +
                "peer w-full transition-all duration-150  " +
                `${sizeCfg.input} ${sizeCfg.padX} ${leftPad} ${rightPad} ` +
                `${disabled ? "opacity-60 cursor-not-allowed" : ""} `;
            const vBase =
                variant === "underline"
                    ? `${vCfg.base} ${vCfg.underlineExtra ?? ""}`
                    : vCfg.base;
            return `${common} ${vBase} ${className}`;
        }, [variant, sizeCfg, leftPad, rightPad, vCfg.base, vCfg.underlineExtra, disabled, className, radius]);

        const focusRing = error ? vCfg.error : vCfg.focus;

        return (
            <div className={`${fullWidth ? "w-full" : "w-auto"} ${containerClassName}`}>
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500 dark:text-neutral-400 pointer-events-none">
                            {leftIcon}
                        </div>
                    )}

                    {(label && !animatedLabel) && <label
                        htmlFor={inputId}
                        className={`pointer-events-none select-none text-neutral-500 dark:text-neutral-400 ${sizeCfg.label}`}
                    >
                        {label}
                    </label>}

                    <motion.input
                        ref={(node) => {
                            inputRef.current = node;
                            if (typeof ref === "function") {
                                ref(node);
                            } else if (ref) {
                                (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
                            }
                        }}
                        id={inputId}
                        type={computedType}
                        className={`${baseClasses} ${!error ? focusRing : vCfg.error}`}
                        aria-invalid={!!error}
                        aria-describedby={helperText ? `${inputId}-help` : undefined}
                        disabled={disabled}
                        variants={inputVariants}
                        initial="initial"
                        animate="animate"
                        whileFocus="focus"
                        placeholder={(label && animatedLabel && !focused) ? " " : placeholder}
                        value={value as any}
                        defaultValue={defaultValue as any}
                        size={type === "textarea" ? 4 : undefined}
                        onFocus={(e) => {
                            setFocused(true);
                            onFocus?.(e);
                        }}
                        onBlur={(e) => {
                            setFocused(false);
                            onBlur?.(e);
                        }}
                        onChange={(e) => {
                            if (!isControlled) setUncontrolledValue(e.target.value);
                            onChange?.(e);
                        }}
                        {...rest}
                    />

                    {(label && animatedLabel) && (
                        <motion.label
                            htmlFor={inputId}
                            className={`absolute left-3 ${size === "lg" ? "top-2.5" : "top-3"} 
                                origin-left pointer-events-none select-none ${color !== "dark" ? " bg-white dark:bg-neutral-800" : "bg-neutral-900"}
                                text-neutral-500 dark:text-neutral-400 ${sizeCfg.label}`}
                            variants={labelVariants}
                            animate={focused || hasText ? "float" : "rest"}
                        >
                            {label}
                        </motion.label>
                    )}

                    {/* Right adornments */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-2">
                        {loading && <Spinner />}
                        {rightIcon && !isPassword && <div className="text-neutral-500 dark:text-neutral-400">{rightIcon}</div>}
                        {clearable && hasText && !disabled && (
                            <button
                                type="button"
                                tabIndex={-1}
                                onClick={clearInput}
                                className="text-neutral-500/80 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition"
                                aria-label="Svuota input"
                            >
                                <ClearIcon />
                            </button>
                        )}
                        {isPassword && (
                            <button
                                type="button"
                                tabIndex={-1}
                                onClick={() => setShowPwd((s) => !s)}
                                className="text-neutral-500/80 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition"
                                aria-label={showPwd ? "Nascondi password" : "Mostra password"}
                            >
                                <EyeIcon off={showPwd} />
                            </button>
                        )}
                    </div>
                </div>

                {/* helper / error */}
                {(helperText || error) && (
                    <div
                        id={`${inputId}-help`}
                        className={`mt-1 text-xs ${error ? "text-red-600 dark:text-red-400" : "text-neutral-500 dark:text-neutral-400"
                            }`}
                    >
                        {typeof error === "string" ? error : helperText}
                    </div>
                )}
            </div>
        );
    })
);

export default FDInput;

