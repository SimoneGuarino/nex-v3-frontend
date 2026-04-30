import React, {
  forwardRef,
  memo,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { HTMLMotionProps, motion, Variants } from "framer-motion";
import { FDColor, palette } from "../../../assets/palette/palette";

// --- Types ---------------------------------------------------------------

type FDTextAreaVariant = "outline" | "filled" | "underline";
type FDTextAreaSize = "xs" | "sm" | "md" | "lg";
type FDRadius = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";

export interface FDTextAreaProps
  extends Omit<HTMLMotionProps<"textarea">, "size"> {
  label?: string;
  variant?: FDTextAreaVariant;
  radius?: FDRadius;
  color?: FDColor;
  size?: FDTextAreaSize;
  error?: boolean | string;
  helperText?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  containerClassName?: string;
  placeholder?: string;
  /** Numero di righe iniziali (default 3) */
  rows?: number;
  /** Abilita l'auto-resize in base allo scrollHeight (default true) */
  autoResize?: boolean;
  /** Mostra il contatore caratteri se è presente maxLength */
  showCount?: boolean;
}

// --- Variants & style maps ----------------------------------------------

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

const sizeClasses: Record<
  FDTextAreaSize,
  { input: string; label: string; padX: string; padY: string }
> = {
  xs: { input: "text-xs", label: "text-[0.65rem]", padX: "px-2.5", padY: "py-1.5" },
  sm: { input: "text-sm", label: "text-xs", padX: "px-3", padY: "py-2" },
  md: { input: "text-base", label: "text-sm", padX: "px-3.5", padY: "py-2.5" },
  lg: { input: "text-lg", label: "text-base", padX: "px-4", padY: "py-3" },
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

function variantClasses(variant: FDTextAreaVariant, color: FDColor) {
  const c = palette[color] ?? palette.neutral;

  switch (variant) {
    case "filled":
      return {
        base: `border ${c.bg} ${color === "light" ? "text-neutral-900 dark:text-gray-200" : c.text}
                border-neutral-300 dark:border-neutral-700 focus:outline-none`,
        focus: "focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500",
        error: "border-red-500 focus:ring-red-500/50 focus:border-red-500",
        underlineExtra: "border-b border-neutral-300 dark:border-neutral-700",
      } as const;
    case "underline":
      return {
        base: `border-0 border-b ${color === "light" ? "text-neutral-900 dark:text-gray-200" : c.text}
                border-neutral-300 dark:border-neutral-700 focus:outline-none`,
        focus: "focus:border-b-2 focus:border-blue-500",
        error: "border-b-red-500 focus:border-b-red-500",
        underlineExtra: "border-b border-neutral-300 dark:border-neutral-700",
      } as const;
    case "outline":
    default:
      return {
        base: `border ${c.ring} ${c.text} focus:outline-none  
                border-neutral-300 dark:border-neutral-700 focus:outline-none`,
        focus: "focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500",
        error: "border-red-500 focus:ring-red-500/50 focus:border-red-500",
        underlineExtra: "border-b border-neutral-300 dark:border-neutral-700",
      } as const;
  }
}

// --- Component -----------------------------------------------------------

const MotionTextArea = motion.textarea;

export const FDTextArea = memo(
  forwardRef<HTMLTextAreaElement, FDTextAreaProps>(function FDTextArea(
    {
      id,
      label,
      variant = "outline",
      color = "neutral",
      size = "md",
      radius = "xl",
      error,
      helperText,
      loading,
      fullWidth,
      className = "",
      containerClassName = "",
      placeholder = " ",
      disabled,
      value,
      defaultValue,
      rows = 3,
      autoResize = true,
      showCount = false,
      onFocus,
      onBlur,
      maxLength,
      ...rest
    },
    ref
  ) {
    const innerId = useId();
    const inputId = id ?? innerId;
    const [focused, setFocused] = useState(false);

    const localRef = useRef<HTMLTextAreaElement | null>(null);

    // floating se focus o c'è un value (controlled o defaultValue)
    const hasText =
      (typeof value === "number" && !Number.isNaN(value)) ||
      (typeof value === "string" && value.length > 0) ||
      (!!defaultValue && String(defaultValue).length > 0);

    const sizeCfg = sizeClasses[size];
    const vCfg = variantClasses(variant, color);

    const baseClasses = useMemo(() => {
      const common =
        `${radiusMap[radius]} ` +
        "peer w-full transition-all duration-150 resize-none " +
        `${sizeCfg.input} ${sizeCfg.padX} ${sizeCfg.padY} ` +
        `${disabled ? "opacity-60 cursor-not-allowed" : ""} `;
      const vBase =
        variant === "underline" ? `${vCfg.base} ${vCfg.underlineExtra ?? ""}` : vCfg.base;
      return `${common} ${vBase} ${className}`;
    }, [variant, sizeCfg, vCfg.base, vCfg.underlineExtra, disabled, className, radius]);

    const focusRing = error ? vCfg.error : vCfg.focus;

    // --- Autosize --------------------------------------------------------
    const handleAutosize = () => {
      if (!autoResize) return;
      const el = localRef.current;
      if (!el) return;
      el.style.height = "0px"; // reset per calcolare lo scrollHeight reale
      el.style.height = `${el.scrollHeight}px`;
    };

    useEffect(() => {
      // sync ref passata dall'esterno
      if (typeof ref === "function") ref(localRef.current);
      else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = localRef.current;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ref]);

    useEffect(() => {
      handleAutosize();
      // ricalcola quando cambia value
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    // count characters
    const currentLength = ((): number => {
      if (typeof value === "string") return value.length;
      if (value == null && typeof defaultValue === "string") return defaultValue.length;
      return 0;
    })();

    return (
      <div className={`${fullWidth ? "w-full" : "w-auto"} ${containerClassName}`}>
        <div className="relative">
          <MotionTextArea
            ref={localRef}
            id={inputId}
            className={`${baseClasses} ${!error ? focusRing : vCfg.error}`}
            aria-invalid={!!error}
            aria-describedby={helperText ? `${inputId}-help` : undefined}
            disabled={disabled}
            variants={inputVariants}
            initial="initial"
            animate="animate"
            whileFocus="focus"
            placeholder={placeholder}
            value={value as any}
            defaultValue={defaultValue as any}
            rows={rows}
            onInput={handleAutosize}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            maxLength={maxLength}
            {...rest}
          />

          {label && (
            <motion.label
              htmlFor={inputId}
              className={`absolute left-3 ${size === "lg" ? "top-2.5" : "top-3"} 
                  origin-left pointer-events-none select-none bg-white dark:bg-neutral-800
                  text-neutral-500 dark:text-neutral-400 ${sizeCfg.label}`}
              variants={labelVariants}
              animate={focused || hasText ? "float" : "rest"}
            >
              {label}
            </motion.label>
          )}

          {/* Right top decorators: loader / counter */}
          <div className="absolute right-2 top-2 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            {loading && (
              <span className="animate-spin h-4 w-4 border-2 border-t-transparent border-current rounded-full" />
            )}
            {showCount && typeof maxLength === "number" && (
              <span>
                {currentLength}/{maxLength}
              </span>
            )}
          </div>
        </div>

        {/* helper / error */}
        {(helperText || error) && (
          <div
            id={`${inputId}-help`}
            className={`mt-1 text-xs ${error ? "text-red-600 dark:text-red-400" : "text-neutral-500 dark:text-neutral-400"}`}
          >
            {typeof error === "string" ? error : helperText}
          </div>
        )}
      </div>
    );
  })
);

export default FDTextArea;