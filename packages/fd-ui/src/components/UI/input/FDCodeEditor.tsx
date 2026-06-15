import React, {
    forwardRef,
    memo,
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from "react";
import { HTMLMotionProps, motion, Variants } from "framer-motion";
import { FDColor } from "../../palette/palette";

type FDCodeEditorVariant = "outline" | "filled" | "underline" | "ghost" | "text";
type FDRadius = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";

type FDCodeFormatTrigger = "none" | "change" | "blur";

export type FDCodeFormatter = (value: string) => string;

export interface FDCodeEditorProps
    extends Omit<HTMLMotionProps<"textarea">, "size" | "value" | "defaultValue" | "onChange"> {
    /** Valore controllato dell'editor */
    value?: string;
    /** Valore iniziale in modalita' uncontrolled */
    defaultValue?: string;
    /** Callback standard React onChange */
    onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    /** Callback semplificata che restituisce direttamente la stringa */
    onValueChange?: (value: string) => void;

    /** Etichetta mostrata sopra al componente */
    label?: string | React.ReactNode;
    /** Testo di supporto sotto al campo */
    helperText?: React.ReactNode;
    /** Stato errore: boolean o messaggio custom */
    error?: boolean | string;
    /** Mostra uno spinner in basso a destra */
    loading?: boolean;

    /** Variante grafica del contenitore editor */
    variant?: FDCodeEditorVariant;
    /** Raggio del bordo del contenitore */
    radius?: FDRadius;
    /** Colore usato per focus ring e stato attivo */
    color?: FDColor;
    /** Se true occupa tutta la larghezza disponibile (default true) */
    fullWidth?: boolean;

    /** Nome del linguaggio mostrato in alto a destra (es. SQL) */
    language?: string;
    /** Mostra/nasconde la colonna dei numeri di riga */
    showLineNumbers?: boolean;
    /** Numero minimo di righe visibili */
    minRows?: number;
    /** Numero di righe visibili (se impostato ha priorita' su minRows) */
    rows?: number;

    /** Definisce il comportamento del tasto TAB: spazi o tab reale */
    indentWith?: "spaces" | "tab";
    /** Numero di spazi per TAB quando indentWith='spaces' */
    tabSize?: number;

    /** Funzione opzionale per formattare il testo (solo visuale editor) */
    formatter?: FDCodeFormatter;
    /** Quando applicare il formatter: mai, ad ogni change o al blur */
    formatTrigger?: FDCodeFormatTrigger;

    /** Classi CSS per il wrapper esterno */
    containerClassName?: string;
    /** Classi CSS per il contenitore visuale dell'editor */
    editorClassName?: string;
    /** Classi CSS aggiuntive del textarea codice */
    codeClassName?: string;
    /** Classi CSS per la colonna numeri di riga */
    gutterClassName?: string;
}

const inputVariants: Variants = {
    initial: { opacity: 0, scale: 0.98 },
    animate: {
        opacity: 1,
        scale: 1,
        transition: { type: "spring", stiffness: 280, damping: 24 },
    },
    focus: {
        scale: 1.002,
        transition: { type: "spring", stiffness: 380, damping: 22 },
    },
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

const variantMap: Record<FDCodeEditorVariant, string> = {
    outline: "border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900",
    filled: "border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80",
    underline: "border-b border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900",
    ghost: "border border-transparent bg-neutral-100/70 dark:bg-neutral-800/60",
    text: "border border-transparent bg-transparent",
};

const focusRingByColor: Record<FDColor, string> = {
    primary: "focus-within:ring-2 focus-within:ring-blue-500/35 focus-within:border-blue-500",
    secondary: "focus-within:ring-2 focus-within:ring-violet-500/35 focus-within:border-violet-500",
    info: "focus-within:ring-2 focus-within:ring-sky-500/35 focus-within:border-sky-500",
    success: "focus-within:ring-2 focus-within:ring-emerald-500/35 focus-within:border-emerald-500",
    warning: "focus-within:ring-2 focus-within:ring-amber-500/35 focus-within:border-amber-500",
    error: "focus-within:ring-2 focus-within:ring-rose-500/35 focus-within:border-rose-500",
    light: "focus-within:ring-2 focus-within:ring-neutral-300/70 focus-within:border-neutral-400",
    dark: "focus-within:ring-2 focus-within:ring-neutral-500/35 focus-within:border-neutral-500",
    purple: "focus-within:ring-2 focus-within:ring-purple-500/35 focus-within:border-purple-500",
    lightPurple: "focus-within:ring-2 focus-within:ring-fuchsia-400/35 focus-within:border-fuchsia-400",
    teal: "focus-within:ring-2 focus-within:ring-teal-500/35 focus-within:border-teal-500",
    neutral: "focus-within:ring-2 focus-within:ring-blue-500/35 focus-within:border-blue-500",
    transparent: "focus-within:ring-2 focus-within:ring-blue-500/35 focus-within:border-blue-500",
};

function normalizeValue(value: unknown): string {
    if (value == null) return "";
    return String(value);
}

function setNativeValue(target: HTMLTextAreaElement, value: string) {
    if (typeof window === "undefined") return;

    const nativeValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value"
    )?.set;

    nativeValueSetter?.call(target, value);
}

const MotionTextArea = motion.textarea;

export const FDCodeEditor = memo(
    forwardRef<HTMLTextAreaElement, FDCodeEditorProps>(function FDCodeEditor(
        {
            id,
            value,
            defaultValue,
            onChange,
            onValueChange,
            onBlur,
            onKeyDown,
            onScroll,

            label,
            helperText,
            error,
            loading = false,
            placeholder = "Scrivi codice...",

            variant = "outline",
            radius = "xl",
            color = "dark",
            fullWidth = true,

            language,
            showLineNumbers = true,
            minRows = 10,
            rows,

            indentWith = "spaces",
            tabSize = 4,

            formatter,
            formatTrigger = "none",

            className = "",
            containerClassName = "",
            editorClassName = "",
            codeClassName = "",
            gutterClassName = "",

            disabled,
            spellCheck = false,
            ...rest
        },
        ref
    ) {
        const innerId = useId();
        const inputId = id ?? innerId;

        const textareaRef = useRef<HTMLTextAreaElement | null>(null);
        const [gutterScrollTop, setGutterScrollTop] = useState(0);

        const [internalValue, setInternalValue] = useState<string>(() =>
            normalizeValue(value ?? defaultValue)
        );

        useEffect(() => {
            if (value !== undefined) {
                setInternalValue(normalizeValue(value));
            }
        }, [value]);

        const formatValue = useCallback(
            (rawValue: string) => {
                if (!formatter) return rawValue;
                try {
                    return formatter(rawValue);
                } catch {
                    return rawValue;
                }
            },
            [formatter]
        );

        const applyValue = useCallback(
            (
                nextValue: string,
                target?: HTMLTextAreaElement,
                selection?: { start: number; end: number },
                emitSyntheticChange = false
            ) => {
                setInternalValue(nextValue);
                onValueChange?.(nextValue);

                const el = target ?? textareaRef.current;
                if (el && emitSyntheticChange) {
                    setNativeValue(el, nextValue);
                    onChange?.({
                        target: el,
                        currentTarget: el,
                    } as React.ChangeEvent<HTMLTextAreaElement>);
                }

                if (selection) {
                    requestAnimationFrame(() => {
                        const current = textareaRef.current;
                        if (!current) return;
                        current.selectionStart = selection.start;
                        current.selectionEnd = selection.end;
                    });
                }
            },
            [onChange, onValueChange]
        );

        const handleChange = useCallback(
            (event: React.ChangeEvent<HTMLTextAreaElement>) => {
                let nextValue = event.target.value;

                if (formatter && formatTrigger === "change") {
                    const formattedValue = formatValue(nextValue);
                    if (formattedValue !== nextValue) {
                        setNativeValue(event.currentTarget, formattedValue);
                        nextValue = formattedValue;
                    }
                }

                setInternalValue(nextValue);
                onValueChange?.(nextValue);
                onChange?.(event);
            },
            [formatTrigger, formatValue, formatter, onChange, onValueChange]
        );

        const handleKeyDown = useCallback(
            (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (event.key !== "Tab") {
                    onKeyDown?.(event);
                    return;
                }

                event.preventDefault();

                const el = event.currentTarget;
                const selectionStart = el.selectionStart;
                const selectionEnd = el.selectionEnd;
                const tabToken = indentWith === "tab" ? "\t" : " ".repeat(Math.max(1, tabSize));

                const nextValue =
                    internalValue.slice(0, selectionStart) +
                    tabToken +
                    internalValue.slice(selectionEnd);

                const finalValue =
                    formatter && formatTrigger === "change"
                        ? formatValue(nextValue)
                        : nextValue;

                const nextCursor = selectionStart + tabToken.length;

                applyValue(finalValue, el, { start: nextCursor, end: nextCursor }, true);
            },
            [
                applyValue,
                formatTrigger,
                formatValue,
                formatter,
                indentWith,
                internalValue,
                onKeyDown,
                tabSize,
            ]
        );

        const handleBlur = useCallback(
            (event: React.FocusEvent<HTMLTextAreaElement>) => {
                if (formatter && formatTrigger === "blur") {
                    const formattedValue = formatValue(internalValue);
                    if (formattedValue !== internalValue) {
                        applyValue(formattedValue, event.currentTarget, undefined, true);
                    }
                }

                onBlur?.(event);
            },
            [applyValue, formatTrigger, formatValue, formatter, internalValue, onBlur]
        );

        const handleScroll = useCallback(
            (event: React.UIEvent<HTMLTextAreaElement>) => {
                setGutterScrollTop(event.currentTarget.scrollTop);
                onScroll?.(event);
            },
            [onScroll]
        );

        const lineCount = useMemo(() => {
            const typedLines = internalValue.split("\n").length;
            const minimum = rows ?? minRows;
            return Math.max(typedLines, minimum, 1);
        }, [internalValue, minRows, rows]);

        const lineNumbers = useMemo(
            () => Array.from({ length: lineCount }, (_, index) => index + 1),
            [lineCount]
        );

        const lineNumberWidth = useMemo(
            () => `${Math.max(String(lineCount).length + 2, 4)}ch`,
            [lineCount]
        );

        const wrapperClasses = useMemo(() => {
            const focusClasses = error
                ? "border-red-500 dark:border-red-500 focus-within:ring-2 focus-within:ring-red-500/35"
                : focusRingByColor[color];

            const radiusClass = variant === "underline" ? "rounded-none" : radiusMap[radius];

            return [
                "relative overflow-hidden transition-all duration-150",
                variantMap[variant],
                radiusClass,
                focusClasses,
                disabled ? "opacity-60 cursor-not-allowed" : "",
                editorClassName,
            ]
                .join(" ")
                .trim();
        }, [color, disabled, editorClassName, error, radius, variant]);

        const gutterClasses = useMemo(
            () =>
                [
                    "shrink-0 border-r border-neutral-200/80 bg-neutral-100/70 px-3 py-3",
                    "font-mono text-xs leading-6 text-right text-neutral-500 select-none",
                    "dark:border-neutral-700/80 dark:bg-neutral-900/70 dark:text-neutral-400",
                    "relative overflow-hidden self-stretch",
                    gutterClassName,
                ]
                    .join(" ")
                    .trim(),
            [gutterClassName]
        );

        const textareaClasses = useMemo(
            () =>
                [
                    "w-full resize-none bg-transparent px-3 py-3 font-mono text-sm leading-6 outline-none",
                    "text-neutral-900 placeholder:text-neutral-400 dark:text-neutral-100 dark:placeholder:text-neutral-500",
                    "whitespace-pre overflow-auto",
                    language ? "pr-16" : "",
                    className,
                    codeClassName,
                ]
                    .join(" ")
                    .trim(),
            [className, codeClassName, language]
        );

        return (
            <div className={`${fullWidth ? "w-full" : "w-auto"} ${containerClassName}`}>
                {label && (
                    <label
                        htmlFor={inputId}
                        className="mb-1 block text-sm text-neutral-600 dark:text-neutral-300"
                    >
                        {label}
                    </label>
                )}

                <div className={wrapperClasses}>
                    {language && (
                        <span className="pointer-events-none absolute right-3 top-2 z-10 text-[11px] uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400">
                            {language}
                        </span>
                    )}

                    {loading && (
                        <span
                            className="absolute bottom-2 right-3 z-10 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent text-neutral-500 dark:text-neutral-300"
                            aria-hidden
                        />
                    )}

                    <div className="flex min-h-full">
                        {showLineNumbers && (
                            <div
                                className={gutterClasses}
                                style={{ width: lineNumberWidth }}
                                aria-hidden
                            >
                                <div
                                    className="absolute inset-x-0 top-0 px-3 py-3"
                                    style={{ transform: `translateY(-${gutterScrollTop}px)` }}
                                >
                                    {lineNumbers.map((line) => (
                                        <div key={line}>{line}</div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <MotionTextArea
                            ref={(node) => {
                                textareaRef.current = node;
                                if (typeof ref === "function") {
                                    ref(node);
                                } else if (ref) {
                                    (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current =
                                        node;
                                }
                            }}
                            id={inputId}
                            value={internalValue}
                            rows={rows ?? minRows}
                            disabled={disabled}
                            spellCheck={spellCheck}
                            className={textareaClasses}
                            placeholder={placeholder}
                            aria-invalid={!!error}
                            aria-describedby={helperText ? `${inputId}-help` : undefined}
                            variants={inputVariants}
                            initial="initial"
                            animate="animate"
                            whileFocus="focus"
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            onBlur={handleBlur}
                            onScroll={handleScroll}
                            style={{ tabSize: Math.max(1, tabSize), ...(rest.style ?? {}) }}
                            {...rest}
                        />
                    </div>
                </div>

                {(helperText || error) && (
                    <div
                        id={`${inputId}-help`}
                        className={`mt-1 text-xs ${error
                                ? "text-red-600 dark:text-red-400"
                                : "text-neutral-500 dark:text-neutral-400"
                            }`}
                    >
                        {typeof error === "string" ? error : helperText}
                    </div>
                )}
            </div>
        );
    })
);

export default FDCodeEditor;
