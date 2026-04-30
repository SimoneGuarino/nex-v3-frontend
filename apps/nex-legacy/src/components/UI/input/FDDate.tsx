/**
 * FDDate
 * -----------------------------------------------------------------------------
 * Wrapper per input nativo <input type="date"> con look&feel FDInput.
 * - Modalità singola data o range (from/to)
 * - Validazione semplice del range (from ≤ to)
 * - Clear del valore (singolo o range)
 * - Controlled/uncontrolled
 * - A11y: label animata (floating) e focus ring coerente
 *
 * Nota: l'uso dell'input nativo minimizza dipendenze e peso bundle.
 * Se in futuro servisse un date-picker avanzato, FDDate funge da shim.
 */

import React, { memo, useId, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MdEvent, MdClose } from "react-icons/md"; // o le tue icone
import { IoCalendarOutline } from "react-icons/io5";

// Icone default (se non passate come prop)
const MdEventIcon = MdEvent as React.FC<{ size?: number; className?: string }>;
const MdCloseIcon = MdClose as React.FC<{ size?: number; className?: string }>;
const IoCalendarOutlineIcon = IoCalendarOutline as React.FC<{ size?: number; className?: string }>;

/** Varianti/size/radius coerenti con FDInput */
export type FDInputVariant = "outline" | "filled" | "underline";
export type FDInputSize = "xs" | "sm" | "md" | "lg";
export type FDRadius = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
type FDColor = "primary" | "secondary" | "info" | "success" | "warning" | "error"
    | "light" | "dark" | "purple" | "lightPurple" | "teal" | "neutral" | "transparent" | "auto";

/** Token dimensioni per input + label floating */
const sizeClasses: Record<FDInputSize, { input: string; label: string; padX: string }> = {
    xs: { input: "h-8 text-xs", label: "text-[0.65rem]", padX: "px-2.5" },
    sm: { input: "h-9 text-sm", label: "text-xs", padX: "px-3" },
    md: { input: "h-11 text-base", label: "text-sm", padX: "px-3.5" },
    lg: { input: "h-12 text-lg", label: "text-base", padX: "px-4" },
};

/** Radius token -> classi tailwind per i bordi */
const radiusMap: Record<FDRadius, string> = {
    none: "rounded-none", sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg",
    xl: "rounded-xl", "2xl": "rounded-2xl", full: "rounded-full",
};

const palette: Record<FDColor, { bg: string; soft: string; ring: string; text: string }> = {
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
        bg: "bg-neutral-200 dark:bg-neutral-900", soft: "bg-neutral-100 dark:bg-neutral-800", ring: "border-neutral-300 dark:border-neutral-600",
        text: "text-black dark:text-gray-200"
    },
    transparent: { bg: "bg-transparent", soft: "bg-transparent", ring: "transparent", text: "text-black dark:text-gray-200" },
    auto: { bg: "bg-white dark:bg-neutral-800", soft: "bg-white", ring: "border-neutral-300 dark:border-neutral-700", text: "text-black dark:text-gray-200" },
} as const;

/** Variant tokens per base/focus/error e underline extra */
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
                base: `border-b ${color === "light" ? "text-neutral-900 dark:text-gray-200" : c.text} 
                    border-neutral-300 dark:border-neutral-700 focus:outline-none`,
                focus: "focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500",
                error: "border-red-500 focus:ring-red-500/50 focus:border-red-500",
                underlineExtra: "border-b border-neutral-300 dark:border-neutral-700",
            }

        case "outline":
            return {
                base: `border ${c.ring} ${c.text} focus:outline-none`,
                focus: "focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500",
                error: "border-red-500 focus:ring-red-500/50 focus:border-red-500",
                underlineExtra: "border-b border-neutral-300 dark:border-neutral-700",
            }
    }
}



/** Tipi di valore supportati */
export type FDDateSingleValue = string | undefined;          // formato "YYYY-MM-DD" o undefined
export type FDDateRangeValue = { from?: string; to?: string };

/** Props comuni alle due modalità (singolo/range) */
export interface FDDatePropsBase {
    type?: "date" | "datetime-local";  // default "date"
    label?: string;
    variant?: FDInputVariant;
    size?: FDInputSize;
    radius?: FDRadius;
    min?: string;   // "YYYY-MM-DD"
    max?: string;   // "YYYY-MM-DD"
    error?: boolean | string;
    helperText?: React.ReactNode;
    fullWidth?: boolean;
    disabled?: boolean;
    className?: string;
    containerClassName?: string;
    clearable?: boolean;
    hideNativeIndicator?: boolean;          // default true: nasconde l’icona nativa
    calendarIcon?: React.ReactNode;         // icona custom per aprire il picker
    clearIcon?: React.ReactNode;            // icona custom per clear
    leftIcon?: React.ReactNode;             // icona di sinistra (decorativa)
    animatedLabel?: boolean;                // default true: abilita animazione label
    /** Tooltip (es. react-tooltip) */
    dataTooltipId?: string;
    dataTooltipContent?: string;

}

/** Discriminated union: single vs range */
export type FDDateProps =
    | (FDDatePropsBase & {
        color?: FDColor;
        range?: false;
        value?: FDDateSingleValue;
        defaultValue?: FDDateSingleValue;
        onChange?: (v: FDDateSingleValue) => void;
    })
    | (FDDatePropsBase & {
        color?: FDColor;
        range: true;
        value?: FDDateRangeValue;
        defaultValue?: FDDateRangeValue;
        onChange?: (v: FDDateRangeValue) => void;
        fromLabel?: string;
        toLabel?: string;
    });

/**
 * Hook controlled/uncontrolled generico:
 * - Se 'controlled' è valorizzato, il componente è controllato.
 * - Altrimenti usa stato interno inizializzato a 'def'.
 */
function useControlled<T>(controlled: T | undefined, def: T): [T, (v: T) => void, boolean] {
    const [inner, setInner] = useState(def);
    const isCtrl = controlled !== undefined;
    return [isCtrl ? (controlled as T) : inner, (v) => (isCtrl ? null : setInner(v)) as any, isCtrl];
};

function openPicker(ref: React.RefObject<HTMLInputElement>) {
    const el = ref.current;
    if (!el) return;
    // se supportato (Chrome/Edge recenti):
    if (typeof (el as any).showPicker === "function") {
        (el as any).showPicker();
    } else {
        // fallback: focus + open con tastiera/OS
        el.focus();
    }
};

/**
 * Componente FDDate: modalità singolo o range
 * - Determiniamo la modalità leggendo la prop discriminante 'range'
 * - Calcoliamo errori derivati (range non valido) con useMemo
 */
export const FDDate = memo(function FDDate(props: FDDateProps) {
    const {
        type = "date",
        label,
        variant = "outline",
        size = "md",
        radius = "xl",
        min, max,
        error,
        helperText,
        fullWidth,
        disabled,
        className = "",
        containerClassName = "",
        clearable = true,
        color = "light",
        hideNativeIndicator = true,
        calendarIcon = <IoCalendarOutlineIcon />,
        clearIcon = <MdCloseIcon />,
        leftIcon,
        animatedLabel = true,
        dataTooltipId,
        dataTooltipContent,
    } = props as FDDateProps;

    const inputRef = React.useRef<HTMLInputElement>(null);
    const inputRefFrom = React.useRef<HTMLInputElement>(null);
    const inputRefTo = React.useRef<HTMLInputElement>(null);

    /** Tokens visuali */
    const sizeCfg = sizeClasses[size];
    const vCfg = variantClasses(variant, color); //variantClasses[variant];

    /** id univoco per label/input */
    const id = useId();

    /** Flag: true se range mode */
    const isRange = !!(props as any).range;

    /**
     * Stato del valore (controlled/uncontrolled):
     * - Single: string | undefined
     * - Range:  { from?: string; to?: string }
     */
    const [val, setVal] = useControlled<any>(
        (props as any).value,
        (props as any).defaultValue ?? (isRange ? { from: undefined, to: undefined } : undefined)
    );

    /** Presenza di un valore (usato per floating label e clear button) */
    const hasValue = isRange ? (val?.from || val?.to) : !!val;

    /**
     * Errore derivato (computedError):
     * - Se l'utente passa una stringa o true in `error`, la mostriamo direttamente
     * - Se range e both defined, validiamo from ≤ to (string compare su ISO date)
     */
    const computedError = useMemo(() => {
        if (typeof error === "string" || error === true) return error;
        if (isRange && val?.from && val?.to && val.from > val.to) return "Intervallo non valido";
        return false;
    }, [error, isRange, val]);

    /** Commit centrale: aggiorna stato interno e notifica onChange esterno */
    function commit(v: any) {
        setVal(v);
        (props as any).onChange?.(v);
    };

    /**
     * Classi base per input date:
     * - placeholder trasparente per supportare floating label
     * - radius/variant token
     * - disabled -> visualmente "spento"
     */
    const baseInputCls = [
        "peer w-full transition-all duration-150 placeholder-transparent",
        sizeCfg.input, sizeCfg.padX, radiusMap[radius],
        variant === "underline" ? `${vCfg.base} ${vCfg.underlineExtra ?? ""}` : vCfg.base,
        disabled ? "opacity-60 cursor-not-allowed" : "",
        className
    ].join(" ");

    /** Focus ring / error ring (overlay non interattivo) */
    const FocusRing = (
        <span className={`pointer-events-none absolute inset-0 ${!computedError ? vCfg.focus : vCfg.error} rounded-[inherit]`} aria-hidden />
    );

    if (!isRange) {
        return (
            <div className={`${fullWidth ? "w-full" : "w-auto"} ${containerClassName}`}>
                {hideNativeIndicator && (
                    <style>{`
                    /* WebKit/Chromium */
                    input[type="date"]::-webkit-calendar-picker-indicator, input[type="datetime-local"]::-webkit-calendar-picker-indicator {
                      opacity: 0; display: none; -webkit-appearance: none;
                    }
                    /* Edge/Old */
                    input[type="date"]::-ms-clear, input[type="datetime-local"]::-ms-clear { display: none; }
                    input[type="date"]::-ms-reveal, input[type="datetime-local"]::-ms-reveal { display: none; }
                `}</style>
                )}

                {(label && !animatedLabel) && <label
                    className={`pointer-events-none select-none text-neutral-500 dark:text-neutral-400 ${sizeCfg.label}`}
                >
                    {label}
                </label>}

                <div className="relative">
                    <motion.input
                        id={id}
                        ref={inputRef}
                        type={type}
                        className={
                            baseInputCls +
                            // se ho icona calendario, aggiungo padding a destra
                            ((leftIcon || calendarIcon) ? " pr-10" : "")
                        }
                        min={min}
                        max={max}
                        disabled={disabled}
                        value={val as string | undefined}
                        onChange={(e) => commit(e.target.value || undefined)}
                        whileFocus={{ scale: 1.002 }}
                        data-tooltip-id={dataTooltipId}
                        data-tooltip-content={dataTooltipContent}
                    />

                    {(label && animatedLabel) && (
                        <motion.label
                            htmlFor={id}
                            className={`absolute left-3 ${size === "lg" ? "top-2.5" : "top-3"
                                } origin-left pointer-events-none select-none
                                bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 ${sizeCfg.label}`}
                            animate={hasValue ? { y: -21, scale: 0.85 } : { y: 0, scale: 1 }}
                            transition={{ duration: 0.16 }}
                        >
                            {label}
                        </motion.label>
                    )}

                    {/* icona calendario (stesso stile del range) */}
                    {(leftIcon || calendarIcon) && (
                        <button
                            type="button"
                            className={`absolute ${clearable && hasValue ? "right-8" : "right-2"
                                } top-1/2 -translate-y-1/2 focus:outline-none cursor-pointer ${disabled
                                    ? "pointer-events-none opacity-20"
                                    : "opacity-80 hover:opacity-100"
                                }`}
                            onClick={() => openPicker(inputRef)}
                            aria-label="Apri calendario"
                            tabIndex={-1}
                            disabled={disabled}
                        >
                            {leftIcon ?? calendarIcon ?? <MdEventIcon />}
                        </button>
                    )}

                    {/* Clear custom */}
                    {clearable && hasValue && !disabled && (
                        <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200"
                            onClick={() => commit(undefined)}
                            aria-label="Pulisci data"
                        >
                            {clearIcon ?? <MdCloseIcon />}
                        </button>
                    )}

                    {FocusRing}
                </div>
                {(helperText || computedError) && (
                    <div
                        className={`mt-1 text-xs ${computedError
                            ? "text-red-600 dark:text-red-400"
                            : "text-neutral-500 dark:text-neutral-400"
                            }`}
                    >
                        {typeof computedError === "string" ? computedError : helperText}
                    </div>
                )}
            </div>
        );
    }

    // Range
    const { fromLabel = "Da", toLabel = "A" } = props as any;
    return (
        <div className={`${fullWidth ? "w-full" : "w-auto"} ${containerClassName}`}>
            {hideNativeIndicator && (
                <style>{`
                /* WebKit/Chromium */
                input[type="date"]::-webkit-calendar-picker-indicator {
                  opacity: 0; display: none; -webkit-appearance: none;
                }
                /* Edge/Old */
                input[type="date"]::-ms-clear { display: none; }
                input[type="date"]::-ms-reveal { display: none; }
                `}</style>
            )}
            <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                    {/* Icona sinistra opzionale (decorativa) */}
                    <motion.input
                        ref={inputRefFrom}
                        id={`${id}-from`}
                        type="date"
                        className={baseInputCls + (val?.from ? " pl-2" : " pl-10")}
                        min={min}
                        max={val?.to ?? max}
                        disabled={disabled}
                        value={val?.from ?? ""}
                        onChange={e => commit({ ...val, from: e.target.value || undefined })}
                        whileFocus={{ scale: 1.002 }}
                        data-tooltip-id={dataTooltipId}
                        data-tooltip-content={dataTooltipContent}
                    />
                    <motion.label
                        htmlFor={`${id}-from`}
                        className={`absolute left-3 ${size === "lg" ? "top-2.5" : "top-3"} origin-left pointer-events-none select-none
                            ${color === "dark" ? "bg-trasparent" : "bg-white dark:bg-neutral-800"} text-neutral-500 dark:text-neutral-400 ${sizeCfg.label}`}
                        animate={val?.from ? { y: -21, scale: 0.85 } : { y: 0, scale: 1 }}
                        transition={{ duration: 0.16 }}
                    >
                        {fromLabel}
                    </motion.label>
                    {(leftIcon || calendarIcon) && (
                        <button
                            type="button"
                            className={`absolute ${val?.from ? "right-8" : "right-2"} top-1/2 -translate-y-1/2 focus:outline-none cursor-pointer ${disabled ? "pointer-events-none opacity-20" : "opacity-80 hover:opacity-100"}`}
                            onClick={() => openPicker(inputRefFrom)}
                            aria-label="Apri calendario"
                            tabIndex={-1}
                            disabled={disabled}
                        >
                            {leftIcon ?? calendarIcon ?? <MdEventIcon />}
                        </button>
                    )}
                    {/* Clear custom (se passato) */}
                    {clearable && val?.from && !disabled && (
                        <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                            onClick={() => commit({ from: undefined })}
                            aria-label="Pulisci data"
                        >
                            {clearIcon ?? <MdCloseIcon />}
                        </button>
                    )}

                    {FocusRing}
                </div>

                <div className="relative">
                    <motion.input
                        ref={inputRefTo}
                        id={`${id}-to`}
                        type="date"
                        className={baseInputCls + (val?.to ? " pl-2" : " pl-10")}
                        min={val?.from ?? min}
                        max={max}
                        disabled={disabled}
                        value={val?.to ?? ""}
                        onChange={e => commit({ ...val, to: e.target.value || undefined })}
                        whileFocus={{ scale: 1.002 }}
                    />
                    <motion.label
                        htmlFor={`${id}-to`}
                        className={`absolute left-3 ${size === "lg" ? "top-2.5" : "top-3"} origin-left pointer-events-none select-none
                            ${color === "dark" ? "bg-trasparent" : "bg-white dark:bg-neutral-800"} text-neutral-500 dark:text-neutral-400 ${sizeCfg.label}`}
                        animate={val?.to ? { y: -21, scale: 0.85 } : { y: 0, scale: 1 }}
                        transition={{ duration: 0.16 }}
                    >
                        {toLabel}
                    </motion.label>
                    {(leftIcon || calendarIcon) && (
                        <button
                            type="button"
                            className={`absolute ${val?.to ? "right-8" : "right-2"} top-1/2 -translate-y-1/2 focus:outline-none cursor-pointer ${disabled ? "pointer-events-none opacity-20" : "opacity-80 hover:opacity-100"}`}
                            onClick={() => openPicker(inputRefTo)}
                            aria-label="Apri calendario"
                            tabIndex={-1}
                            disabled={disabled}
                        >
                            {leftIcon ?? calendarIcon ?? <MdEventIcon />}
                        </button>
                    )}
                    {clearable && val?.to && !disabled && (
                        <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                            onClick={() => commit({ to: undefined })}
                            aria-label="Pulisci data"
                        >
                            {clearIcon ?? <MdCloseIcon />}
                        </button>
                    )}
                    {FocusRing}
                </div>
            </div>

            {(helperText || computedError) && (
                <div className={`mt-1 text-xs ${computedError ? "text-red-600 dark:text-red-400" : "text-neutral-500 dark:text-neutral-400"}`}>
                    {typeof computedError === "string" ? computedError : helperText}
                </div>
            )}
        </div>
    );
});
export default FDDate;