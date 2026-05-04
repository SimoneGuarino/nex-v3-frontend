/**
 * FDSelect
 * -----------------------------------------------------------------------------
 * Select altamente riusabile e performante, allineato al design system FDInput:
 * - Supporta singola/multipla selezione
 * - Ricerca interna (client-side) con tastiera e mouse
 * - Clear del valore selezionato
 * - Stato controllato/uncontrolled
 * - A11y: ruoli ARIA e navigazione da tastiera (↑/↓/Enter/Esc)
 * - Windowing leggero (altezza riga fissa) per liste ampie (itemHeight/menuMaxHeight)
 *
 * Architettura:
 * 1) Token UI condivisi (variant/size/radius) -> consistenza stilistica
 * 2) Stato visuale (open, activeIdx) + stato input (search)
 * 3) Stato del valore: controlled/uncontrolled (useControlled)
 * 4) Filtro e virtualizzazione con useMemo per performance
 * 5) Menu con framer-motion e gestione del focus
 */

import React, {
    useEffect, useMemo, useRef, useState, useId, memo, useContext,
    useLayoutEffect
} from "react";
import { motion, Variants } from "framer-motion";
import { MdCheck, MdClose, MdExpandMore, MdSearch } from "react-icons/md";
//import { TourCtx } from "tour/TourProvider";
import { createPortal } from "react-dom";

/** Tipizzazione esplicita delle icone per evitare type widening dei componenti */
const MdCheckIcon = MdCheck as React.FC<{ size?: number; className?: string }>;
const MdCloseIcon = MdClose as React.FC<{ size?: number; className?: string }>;
const MdExpandMoreIcon = MdExpandMore as React.FC<{ size?: number; className?: string }>;
const MdSearchIcon = MdSearch as React.FC<{ size?: number; className?: string }>;

/** Varianti/size/radius coerenti con FDInput */
export type FDInputVariant = "outline" | "filled" | "underline";
export type FDInputSize = "xs" | "sm" | "md" | "lg";
export type FDRadius = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
type FDColor = "primary" | "secondary" | "info" | "success" | "warning" | "error"
    | "light" | "dark" | "purple" | "lightPurple" | "teal" | "neutral" | "transparent";

/**
 * Mappa dimensioni -> classi + altezza riga suggerita (itemH).
 * itemH viene usato per il windowing leggero: riga a height fissa
 * così possiamo calcolare gli offset di padding (before/after) in O(1).
 */
const sizeClasses: Record<FDInputSize, { control: string; label: string; padX: string; itemH: number }> = {
    xs: { control: "h-8 text-xs", label: "text-[0.65rem]", padX: "px-2.5", itemH: 30 },
    sm: { control: "h-9 text-sm", label: "text-xs", padX: "px-3", itemH: 34 },
    md: { control: "h-11 text-base", label: "text-sm", padX: "px-3.5", itemH: 36 },
    lg: { control: "h-12 text-lg", label: "text-base", padX: "px-4", itemH: 40 },
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
    light: { bg: "bg-white dark:bg-neutral-800", soft: "bg-white", ring: "border-neutral-300", text: "text-black dark:text-gray-200" },
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
/**
 * Variant tokens -> classi base/focus/error.
 * In 'underline' aggiungiamo un bordo inferiore separato (underlineExtra).
 */
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
                label: `pointer-events-none select-none ${c.text}`,
            }

        case "underline":
            return {
                base: `border-b ${color === "light" ? "text-neutral-900 dark:text-gray-200" : c.text} 
                    border-neutral-300 dark:border-neutral-700 focus:outline-none`,
                focus: "focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500",
                error: "border-red-500 focus:ring-red-500/50 focus:border-red-500",
                underlineExtra: "border-b border-neutral-300 dark:border-neutral-700",
                label: `pointer-events-none select-none ${c.text}`,
            }

        case "outline":
            return {
                base: `border ${c.ring} ${c.text} focus:outline-none  
                    border-neutral-300 dark:border-neutral-700 focus:outline-none`,
                focus: "focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500",
                error: "border-red-500 focus:ring-red-500/50 focus:border-red-500",
                underlineExtra: "border-b border-neutral-300 dark:border-neutral-700",
                label: `pointer-events-none select-none ${c.text}`,
            }
    }
};

/** Varianti di animazione per apertura/chiusura menu (framer-motion) */
const popVariants: Variants = {
    hidden: { opacity: 0, scale: 0.98, y: -2 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 26 } },
    exit: { opacity: 0, scale: 0.98, y: -2, transition: { duration: 0.12 } },
};

/** Singola opzione del menu */
export type FDSelectOption<T = string> = {
    value: T;               // valore restituito nel onChange
    label: string;          // testo mostrato all'utente
    icon?: React.ReactNode; // icona opzionale a sinistra
    disabled?: boolean;     // opzionale: disabilita la riga
    group?: string;         // opzionale: per futuri header di gruppo/sezioni
};

/** Valore del componente: singolo, array (multi) o undefined */
export type FDSelectValue<T> = T | T[] | undefined | null;

export type FDSelectDataTourMenuScope = "firstOption" | "menu";

/**
 * Props principali del Select.
 * - `multiple` abilita la selezione multipla (array)
 * - `searchable` mostra la barra di ricerca client-side
 * - `itemHeight`/`menuMaxHeight` abilitano un windowing semplice e prevedibile
 */
export interface FDSelectProps<T = string> {
    options: FDSelectOption<T>[];
    value?: FDSelectValue<T>;
    defaultValue?: FDSelectValue<T>;
    onChange?: (v: FDSelectValue<T>) => void;

    multiple?: boolean;
    searchable?: boolean;
    placeholder?: string;
    /**
     * Etichetta del controllo. Se `animatedLabel` è true o undefined, si comporta come in FDInput: si sposta sopra al controllo quando c'è un valore o focus.
     * Può essere una stringa o un nodo React (es. per includere elementi stilizzati o icone).
     */
    label?: string | React.ReactNode;
    /**
     * Se `animatedLabel` è true o undefined, l'etichetta si comporta come in FDInput: si sposta sopra al controllo quando c'è un valore o focus.
     */
    animatedLabel?: boolean;

    size?: FDInputSize;
    variant?: FDInputVariant;
    radius?: FDRadius;
    disabled?: boolean;
    error?: boolean | string;
    helperText?: React.ReactNode;
    fullWidth?: boolean;
    className?: string;
    containerClassName?: string;
    color?: FDColor;

    menuPortal?: boolean;
    menuPlacement?: "auto" | "bottom-start" | "top-start";
    menuOffset?: number;
    menuViewportPadding?: number;
    menuZIndex?: number;

    // Performance (windowing a riga fissa)
    itemHeight?: number;
    menuMaxHeight?: number;

    /** Abilita/disabilita il windowing a righe ad altezza fissa */
    virtualized?: boolean;
    clearable?: boolean;
    loading?: boolean; pulseWhenLoading?: boolean;
    dataTour?: string;

    dataTourMenu?: string;
    dataTourMenuScope?: FDSelectDataTourMenuScope;

    // Personalizzazione righe (slot render)
    renderOption?: (opt: FDSelectOption<T>, selected: boolean, active: boolean) => React.ReactNode;
    getOptionKey?: (opt: FDSelectOption<T>) => string | number;

    // ---- NUOVE CALLBACK PER INTEGRAZIONE FETCH/PAGINAZIONE ----
    onMenuOpen?: () => void;              // chiamato quando il menu viene aperto
    onMenuClose?: () => void;             // chiamato quando il menu viene chiuso
    onMenuScrollToBottom?: () => void;    // chiamato quando lo scroll è quasi al fondo

    // ---- NUOVA CALLBACK DI RICERCA (per search remota) ----
    onSearchChange?: (text: string) => void;
};

/**
 * Hook per gestire pattern controlled/uncontrolled:
 * - Se `controlled` è definito, il valore viene preso esternamente e non
 *   aggiorniamo lo stato interno (ritorniamo un setter no-op per coerenza).
 * - Altrimenti usiamo lo stato locale.
 */
function useControlled<T>(
    controlled: T | undefined,
    defaultUncontrolled: T
): [T, (v: T) => void, boolean] {
    const [inner, setInner] = useState(defaultUncontrolled);
    const isCtrl = controlled !== undefined;
    return [isCtrl ? (controlled as T) : inner, (v) => (isCtrl ? null : setInner(v)) as any, isCtrl];
};

/**
 * Confronto robusto tra valori (supporta oggetti/array)
 * - Usa JSON.stringify come best-effort
 * - Fallback sul riferimento in caso di errori
 */
function isEqualVal(a: any, b: any) {
    try { return JSON.stringify(a) === JSON.stringify(b); } catch { return a === b; }
};

function escapeRegExp(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

function selectorMatchesDataTour(stepSelector: string | undefined, dataTourId: string) {
    if (!stepSelector) return false;
    const id = escapeRegExp(dataTourId);
    const re = new RegExp(`data-tour\\s*=\\s*["']${id}["']`);
    return re.test(stepSelector);
};

/**
 * Componente principale
 * - Gestisce apertura/chiusura menu, ricerca, selezione e a11y
 * - Espone value (controlled/uncontrolled) e onChange
 */
export const FDSelect = memo(function FDSelect<T = string>({
    options,
    value,
    defaultValue,
    onChange,
    multiple = false,
    searchable = false,
    placeholder = "Seleziona…",
    label, animatedLabel = true,

    size = "md",
    variant = "outline",
    radius = "xl",
    disabled,
    error,
    helperText,
    fullWidth,
    className = "",
    containerClassName = "",
    color = "neutral",

    menuPortal = true,
    menuPlacement = "auto",
    menuOffset = 8,
    menuViewportPadding = 8,
    menuZIndex = 1600,

    itemHeight,
    menuMaxHeight = 280,

    // Abilita/disabilita il windowing a righe ad altezza fissa
    virtualized = true,
    clearable = true,
    loading = false, pulseWhenLoading = false,
    dataTour,
    dataTourMenu,
    dataTourMenuScope = "firstOption",

    renderOption,
    getOptionKey,

    // ---- nuove callback ----
    onMenuOpen,
    onMenuClose,
    onMenuScrollToBottom,
    onSearchChange,
}: FDSelectProps<T>) {

    /** id univoco per ARIA/etichetta */
    const id = useId();

    /** Token UI derivati da props (ammortizziamo calcolo classi) */
    const sizeCfg = sizeClasses[size];
    const vCfg = variantClasses(variant, color); //variantClasses[variant];

    /** Altezza della riga (usata nel windowing) */
    const rowH = itemHeight ?? sizeCfg.itemH;

    /** Stato: menu aperto/chiuso */
    const [openInner, setOpenInner] = useState(false);

    /** Stato: testo ricerca */
    const [search, setSearch] = useState("");

    const [menuCoords, setMenuCoords] = useState<{
        top: number;
        left: number;
        width: number;
        maxHeight: number;
        transformOrigin: string;
    } | null>(null);

    const menuRef = useRef<HTMLDivElement>(null);

    /** Ref: trigger (bottone) e lista (scroll container) */
    const triggerRef = useRef<HTMLButtonElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    /** Ref root per rilevare click esterni senza alterare i commenti precedenti */
    const rootRef = useRef<HTMLDivElement>(null);

    //const tour = useContext(TourCtx)
    const tourIsOpen = false; //!!tour?.isOpen;
    const activeStepSelector = ""; //tour?.activeStepSelector;

    const forceMenuOpenForTour =
        !!dataTourMenu &&
        tourIsOpen &&
        !disabled &&
        selectorMatchesDataTour(activeStepSelector, dataTourMenu);

    const open = forceMenuOpenForTour || openInner;

    const prevOpenRef = useRef(false);
    useEffect(() => {
        if (open && !prevOpenRef.current) onMenuOpen?.();
        if (!open && prevOpenRef.current) onMenuClose?.();
        prevOpenRef.current = open;
    }, [open, onMenuOpen, onMenuClose]);

    /**
     * Stato del valore (controlled/uncontrolled):
     * - `val` è lo state read, `setVal` aggiorna se uncontrolled
     * - `isCtrl` vero se il valore è gestito dal parent
     */
    const [val, setVal, isCtrl] = useControlled<FDSelectValue<T>>(
        value,
        defaultValue ?? (multiple ? ([] as T[]) : (undefined as unknown as T))
    );

    /**
     * Lista filtrata (search client-side):
     * - memoizzata per evitare ricalcoli pesanti durante lo scroll
     * - chiave di memo: options, searchable, search
     */
    const filtered = useMemo(() => {
        if (!searchable || !search.trim()) return options;
        const q = search.trim().toLowerCase();
        return options.filter(o => o.label.toLowerCase().includes(q));
    }, [options, searchable, search]);

    /** Stato: indice attivo per focus tastiera dentro la lista */
    const [activeIdx, setActiveIdx] = useState(0);

    /** Reset indice attivo quando apro menu o cambio ricerca */
    useEffect(() => { setActiveIdx(0); }, [open, search]);

    /** Commit del nuovo valore e notifica all'esterno (onChange) */
    function commit(newVal: FDSelectValue<T>) {
        if (!isCtrl) setVal(newVal);  // aggiorna solo se uncontrolled
        onChange?.(newVal);           // notifica sempre (anche se controlled)
    };

    /** Selezione singola: imposta valore e chiudi menu */
    function toggleSingle(opt: FDSelectOption<T>) {
        commit(opt.value as T);
        setOpenInner(false);
    };

    /** Selezione multipla: aggiungi/rimuovi valore dalla lista */
    function toggleMulti(opt: FDSelectOption<T>) {
        const cur = (val as T[]) ?? [];
        const exists = cur.some(v => isEqualVal(v, opt.value));
        const next = exists ? cur.filter(v => !isEqualVal(v, opt.value)) : [...cur, opt.value];
        commit(next);
    };

    /** Helper: verifica se l'opzione è selezionata (singola o multipla) */
    function isSelected(opt: FDSelectOption<T>): boolean {
        return multiple
            ? ((val as T[]) ?? []).some(v => isEqualVal(v, opt.value))
            : isEqualVal(val, opt.value);
    };

    /** Pulisci selezione attuale (singolo -> undefined, multiplo -> []) */
    function clear() {
        commit(multiple ? ([] as T[]) : (undefined as unknown as T));
        setSearch(""); // reset anche filtro visuale
        onSearchChange?.("");
    };

    /**
     * Gestione tastiera:
     * - Quando menu chiuso: ArrowDown/Enter/Space aprono
     * - Quando aperto: Esc chiude, ArrowUp/Down navigano, Enter seleziona
     */
    function onKeyDown(e: React.KeyboardEvent) {
        if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
            setOpenInner(true);
            e.preventDefault();
            return;
        }
        if (!open) return;

        if (e.key === "Escape") {
            if (!forceMenuOpenForTour) setOpenInner(false);
            e.preventDefault();
            return;
        }
        if (e.key === "ArrowDown") { setActiveIdx(i => Math.min(i + 1, filtered.length - 1)); e.preventDefault(); return; }
        if (e.key === "ArrowUp") { setActiveIdx(i => Math.max(i - 1, 0)); e.preventDefault(); return; }
        if (e.key === "Enter") {
            const opt = filtered[activeIdx];
            if (opt && !opt.disabled) multiple ? toggleMulti(opt) : toggleSingle(opt);
            e.preventDefault(); return;
        }
    };

    /**
     * Windowing leggero:
     * - calcola il range [start, end) da renderizzare in base a scrollTop e itemHeight
     * - aggiunge "spacer" sopra/sotto per mantenere altezza reale della lista
     * - margine extra (±8 righe) per scorrimento fluido
     */
    const [scrollTop, setScrollTop] = useState(0);
    const enableWindowing = virtualized && !!menuMaxHeight && filtered.length > 40;
    const visible = useMemo(() => {
        if (!enableWindowing) {
            return {
                start: 0,
                end: filtered.length,
                before: 0,
                after: 0,
            };
        }
        const viewport = menuMaxHeight;
        const start = Math.max(0, Math.floor(scrollTop / rowH) - 8);
        const end = Math.min(filtered.length, Math.ceil((scrollTop + viewport) / rowH) + 8);
        return { start, end, before: start * rowH, after: Math.max(0, (filtered.length - end) * rowH) };
    }, [scrollTop, rowH, menuMaxHeight, filtered.length, enableWindowing]);

    const prevForcedRef = useRef(false);
    useEffect(() => {
        if (forceMenuOpenForTour && !prevForcedRef.current) {
            setOpenInner(true);
            setSearch("");
            onSearchChange?.("");
            setScrollTop(0);
            requestAnimationFrame(() => {
                if (listRef.current) listRef.current.scrollTop = 0;
            });
        }
        if (!forceMenuOpenForTour && prevForcedRef.current) {
            setOpenInner(false);
        }
        prevForcedRef.current = forceMenuOpenForTour;
    }, [forceMenuOpenForTour, onSearchChange]);

    useEffect(() => {
        if (!open) return;
        setScrollTop(0);
        requestAnimationFrame(() => {
            if (listRef.current) listRef.current.scrollTop = 0;
        });
    }, [search]);

    /**
     * Testo riassuntivo della selezione (singola/multipla):
     * - Mostra prime 2 label + counter (es. "+3") se molte selezioni
     */
    const selectedText = useMemo(() => {
        if (multiple) {
            const arr = (val as T[]) ?? [];
            if (!arr.length) return "";
            const labels = arr.map(v => options.find(o => isEqualVal(o.value, v))?.label ?? "").filter(Boolean);
            if (labels.length <= 2) return labels.join(", ");
            return `${labels.slice(0, 2).join(", ")} +${labels.length - 2}`;
        } else {
            const opt = options.find(o => isEqualVal(o.value, val));
            return opt?.label ?? "";
        }
    }, [val, multiple, options]);

    /** Flag se c'è un valore presente (usato per label e clear) */
    const hasValue = multiple ? ((val as T[])?.length ?? 0) > 0 : !!selectedText;

    const indexByOption = useMemo(() => {
        const map = new Map<FDSelectOption<T>, number>();
        options.forEach((o, i) => map.set(o, i));
        return map;
    }, [options]);

    /** Chiudi il menu quando clicchi/tocchi fuori dal componente (outside click) */
    useEffect(() => {
        function handlePointerDown(e: MouseEvent | TouchEvent) {
            if (!open) return;
            if (forceMenuOpenForTour) return;

            const target = e.target as Node;
            const root = rootRef.current;
            const menu = menuRef.current;

            const clickedInsideRoot = !!root && root.contains(target);
            const clickedInsidePortalMenu = !!menu && menu.contains(target);

            if (!clickedInsideRoot && !clickedInsidePortalMenu) {
                setOpenInner(false);
            }
        }

        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("touchstart", handlePointerDown, { passive: true });

        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("touchstart", handlePointerDown);
        };
    }, [open, forceMenuOpenForTour]);

    /** reset scrollTop e posizione lista all'apertura del menu */
    useEffect(() => {
        if (open) {
            setScrollTop(0);
            // forza anche lo scrollTop del DOM element
            requestAnimationFrame(() => {
                if (listRef.current) listRef.current.scrollTop = 0;
            });
        }
    }, [open]);

    const recomputeMenuPosition = React.useCallback(() => {
        if (!open || !menuPortal || !triggerRef.current || !menuRef.current) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const menuEl = menuRef.current;

        const prevVis = menuEl.style.visibility;
        const prevOp = menuEl.style.opacity;
        menuEl.style.visibility = "hidden";
        menuEl.style.opacity = "0";

        const rect = menuEl.getBoundingClientRect();
        const menuH = rect.height || menuMaxHeight;
        const menuW = triggerRect.width;

        const vw = window.innerWidth;
        const vh = window.innerHeight;

        const spaceBottom = vh - triggerRect.bottom;
        const spaceTop = triggerRect.top;

        const shouldOpenTop =
            menuPlacement === "top-start" ||
            (menuPlacement === "auto" && spaceBottom < menuH + menuOffset && spaceTop > spaceBottom);

        let top = shouldOpenTop
            ? triggerRect.top - menuOffset - Math.min(menuH, menuMaxHeight)
            : triggerRect.bottom + menuOffset;

        let left = triggerRect.left;
        left = Math.min(Math.max(left, menuViewportPadding), vw - menuViewportPadding - menuW);

        const availableBelow = vh - triggerRect.bottom - menuOffset - menuViewportPadding;
        const availableAbove = triggerRect.top - menuOffset - menuViewportPadding;

        const maxHeight = shouldOpenTop
            ? Math.max(120, Math.min(menuMaxHeight, availableAbove))
            : Math.max(120, Math.min(menuMaxHeight, availableBelow));

        if (shouldOpenTop) {
            top = Math.max(menuViewportPadding, triggerRect.top - menuOffset - maxHeight);
        } else {
            top = Math.min(triggerRect.bottom + menuOffset, vh - menuViewportPadding - maxHeight);
        }

        menuEl.style.visibility = prevVis;
        menuEl.style.opacity = prevOp;

        setMenuCoords({
            top,
            left,
            width: menuW,
            maxHeight,
            transformOrigin: shouldOpenTop ? "bottom left" : "top left",
        });
    }, [open, menuPortal, menuPlacement, menuOffset, menuViewportPadding, menuMaxHeight]);

    useLayoutEffect(() => {
        if (!open || !menuPortal) return;
        recomputeMenuPosition();
    }, [open, menuPortal, filtered.length, search, recomputeMenuPosition]);

    useEffect(() => {
        if (!open || !menuPortal) return;

        const handler = () => recomputeMenuPosition();
        window.addEventListener("resize", handler, { passive: true });
        window.addEventListener("scroll", handler, { passive: true });

        const ro = new ResizeObserver(() => recomputeMenuPosition());
        if (triggerRef.current) ro.observe(triggerRef.current);
        if (menuRef.current) ro.observe(menuRef.current);

        return () => {
            window.removeEventListener("resize", handler);
            window.removeEventListener("scroll", handler);
            ro.disconnect();
        };
    }, [open, menuPortal, recomputeMenuPosition]);

    const menuContent = (
        <motion.div
            ref={menuRef}
            data-fd-select-portal="true"
            data-tour={dataTourMenuScope === "menu" ? dataTourMenu : undefined}
            key="menu"
            role="listbox"
            id={`${id}-listbox`}
            aria-activedescendant={`${id}-opt-${activeIdx}`}
            className="z-50 overflow-hidden rounded-md border border-neutral-600 bg-neutral-900 shadow-lg text-white"
            initial="hidden"
            animate="show"
            exit="exit"
            variants={popVariants}
            onMouseDown={(e) => e.preventDefault()}
            style={
                menuPortal
                    ? {
                        position: "fixed",
                        top: menuCoords?.top ?? -9999,
                        left: menuCoords?.left ?? -9999,
                        width: menuCoords?.width,
                        zIndex: menuZIndex,
                        transformOrigin: menuCoords?.transformOrigin,
                    }
                    : undefined
            }
        >
            {/** Barra di ricerca + stato di caricamento */}
            {(searchable || loading) && (
                <div className="flex items-center gap-2 px-2 py-2 border-b border-neutral-700">
                    <MdSearchIcon className="text-neutral-500" />
                    <input
                        /* NOTA: non disabilitiamo più l'input durante il loading
                           così la search funziona anche alla prima apertura */
                        value={search}
                        onChange={e => {
                            setSearch(e.target.value);
                            onSearchChange?.(e.target.value);
                        }}
                        placeholder={loading ? "Caricamento…" : "Cerca…"}
                        className={`flex-1 bg-transparent outline-none text-sm text-white/80`}
                        autoFocus
                    />
                </div>
            )}

            {/** LISTA con windowing: solo il sottoinsieme visibile viene renderizzato */}
            <div
                ref={listRef}
                style={{
                    maxHeight: menuPortal ? menuCoords?.maxHeight ?? menuMaxHeight : menuMaxHeight,
                }}
                className="overflow-auto"
                onScroll={(e) => {
                    const el = e.target as HTMLDivElement;
                    if (enableWindowing) {
                        setScrollTop(el.scrollTop);
                    };

                    // near-bottom detection (threshold ~ 1.5 righe)
                    const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
                    if (distanceFromBottom <= (rowH * 1.5)) {
                        onMenuScrollToBottom?.();
                    };
                }}
            >
                {/** spacer superiore (equivalente all'altezza delle righe scorse) */}
                {enableWindowing && <div style={{ height: visible.before }} />}

                {filtered.slice(visible.start, visible.end).map((opt, i) => {
                    const realIdx = visible.start + i;        // indice assoluto della riga
                    const sel = isSelected(opt);              // riga selezionata?
                    const active = realIdx === activeIdx;     // riga "attiva" (focussed)

                    const rawKey =
                        getOptionKey?.(opt) ??
                        ((typeof (opt as FDSelectOption<any>).value === "string" || typeof (opt as FDSelectOption<any>).value === "number")
                            ? `v:${String((opt as FDSelectOption<any>).value)}`
                            : `i:${indexByOption.get(opt) ?? realIdx}-${opt.label}`);
                    const key = String(rawKey);

                    // Render di default (o custom via renderOption)
                    const row =
                        renderOption
                            ? renderOption(opt, sel, active)
                            : (
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2">
                                        {opt.icon && <span className="opacity-80">{opt.icon}</span>}
                                        <span className="truncate">{opt.label}</span>
                                    </div>
                                    <span className={`ml-3 ${sel ? "opacity-100" : "opacity-0"}`}><MdCheckIcon /></span>
                                </div>
                            );

                    const baseRowCls = `px-3` + (variant === "underline" ? " py-2.5" : " py-2.5");

                    const rowDataTour =
                        dataTourMenuScope === "firstOption" && dataTourMenu && realIdx === 0
                            ? dataTourMenu
                            : undefined;

                    return (
                        <button
                            data-tour={rowDataTour}
                            id={`${id}-opt-${realIdx}`}
                            key={key + (opt.disabled ? "__disabled" : "__enabled")}
                            role="option"
                            aria-selected={sel}
                            disabled={opt.disabled}
                            className={[
                                "w-full text-left text-sm box-border",
                                baseRowCls,
                                sel ? "bg-blue-400/10" : "", // pre-condition => active
                                opt.disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-neutral-800/70",
                                palette[color].text ?? palette.neutral.text,
                                "text-white/80"
                            ].join(" ")}
                            style={enableWindowing ? { height: rowH } : undefined}               // altezza fissa coerente col windowing
                            onMouseEnter={() => setActiveIdx(realIdx)}
                            onClick={() => (multiple ? toggleMulti(opt) : toggleSingle(opt))}
                        >
                            {row}
                        </button>
                    );
                })}

                {/** spacer inferiore */}
                {enableWindowing && <div style={{ height: visible.after }} />}

                {/** Empty/Loading states */}
                {filtered.length === 0 && !loading && (
                    <div className="px-3 py-3 text-sm text-neutral-500">Nessun risultato</div>
                )}
                {loading && (
                    <div className="px-3 py-3 text-sm text-neutral-500">Caricamento…</div>
                )}
            </div>
        </motion.div>
    );

    return (
        <div ref={rootRef} className={`${fullWidth ? "w-full" : "w-auto"} ${containerClassName}`}>
            <div className="relative" onKeyDown={onKeyDown}>
                {(label && !animatedLabel) && <label
                    className={`pointer-events-none select-none ${vCfg.label} ${sizeCfg.label}`}
                >
                    {label}
                </label>}

                {/** TRIGGER: bottone che mostra selezione corrente e caret */}
                <button
                    ref={triggerRef}
                    type="button"
                    disabled={disabled}
                    data-tour={dataTour}
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    aria-controls={`${id}-listbox`}
                    className={[
                        "peer w-full text-left transition-all duration-150",
                        sizeCfg.control, sizeCfg.padX, radiusMap[radius],
                        `${vCfg.base} ${variant === "underline" ? vCfg.underlineExtra ?? "" : ""}`,
                        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
                        className
                    ].join(" ")}
                    onClick={() => {
                        if (disabled) return;
                        if (forceMenuOpenForTour) return;
                        setOpenInner(o => !o);
                    }}
                >
                    <div className="flex items-center justify-between gap-2">
                        <div className={`truncate ${!hasValue ? "text-neutral-500 dark:text-neutral-400" : ""}`}>
                            {hasValue ? selectedText : placeholder}
                        </div>
                        <div className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
                            {clearable && hasValue && !disabled && (
                                <button
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        clear();
                                    }}
                                    className="hover:text-neutral-700 dark:hover:text-neutral-200"
                                    aria-label="Pulisci"
                                >
                                    <MdCloseIcon />
                                </button>
                            )}
                            <MdExpandMoreIcon className={`transition ${open ? "rotate-180" : ""}`} />
                        </div>
                    </div>
                </button>

                {/** Floating Label: animata in base a open/hasValue */}
                {(label && animatedLabel) && (
                    <motion.label
                        htmlFor={`${id}-trigger`}
                        className={`absolute left-3 ${size === "lg" ? "top-2.5" : "top-3"} origin-left pointer-events-none select-none
                        bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 ${sizeCfg.label}`}
                        animate={open || hasValue ? { y: -21, scale: 0.85 } : { y: 0, scale: 1 }}
                        transition={{ duration: 0.16 }}
                    >
                        {label}
                    </motion.label>
                )}

                {/** Focus/Errore ring (puramente visuale, non interattivo) */}
                <span className={`pointer-events-none absolute inset-0 ${!error ? vCfg.focus : vCfg.error} rounded-[inherit]`} aria-hidden />

                {/** MENU: appare sopra il trigger con portamento a listbox */}
                {open && !menuPortal && (
                    <div className="absolute z-50 mt-1 w-full">
                        {menuContent}
                    </div>
                )}

                {open && menuPortal && typeof document !== "undefined" &&
                    createPortal(menuContent, document.body)}
            </div>

            {/** Helper/error text sotto il controllo */}
            {(helperText || error) && (
                <div className={`mt-1 text-xs ${error ? "text-red-600 dark:text-red-400" : "text-neutral-500 dark:text-neutral-400"}`}>
                    {typeof error === "string" ? error : helperText}
                </div>
            )}
        </div>
    );
});

export default FDSelect;