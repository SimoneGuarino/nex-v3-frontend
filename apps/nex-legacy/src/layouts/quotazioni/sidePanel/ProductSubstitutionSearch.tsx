import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import FDBox from "components/UI/box/FDBox";
import { MdDone } from "react-icons/md";
import { FiChevronRight } from "react-icons/fi";
import { CartProductDTO } from "../types/qts_product";


// ——————————————————————————————————————————————————————————
// CONSTANTS
// ——————————————————————————————————————————————————————————
const MdDoneIcon = MdDone as React.FC<{ className?: string }>;
const FiChevronRightIcon = FiChevronRight as React.FC<{ className?: string }>;


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACES
// ——————————————————————————————————————————————————————————
export type SubstitutionSearchMode = "COMMERCIAL_SUGGESTION" | "BUYER_COUNTERPROPOSAL";

type SubstitutionResultView = {
    id: string;
    title: string;
    subtitle?: string;
    code?: string;
    priceLabel?: string;
    badge?: string;
    thumbnailUrl?: string;
};

export type ProductSubstitutionSearchProps<T = CartProductDTO> = {
    /** Apertura / chiusura della modalità sostituzione */
    open: boolean;
    onClose: () => void;

    mode?: SubstitutionSearchMode;

    /** Dati del prodotto originale (quello da sostituire) */
    baseProductTitle?: string;
    baseProductMeta?: string;

    /** Stato di ricerca (useDetailsQuotation) */
    query: string;
    onQueryChange: (value: string) => void;
    results: CartProductDTO[];
    loading: { [key: string]: boolean | Map<string, boolean> };

    /** Mapping da risultato grezzo → dati per la UI */
    mapResultToView: (item: CartProductDTO) => SubstitutionResultView;

    /** Azione quando scegli un prodotto come controproposta */
    onSelectProduct: (item: CartProductDTO) => void;
    /** Apre la scheda prodotto del risultato selezionato */
    onOpenProductDetails?: (item: CartProductDTO) => void;
    /** Lista degli id selezionati */
    selectedIds: string[];
};

function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
        const update = (event: MediaQueryListEvent | MediaQueryList) => {
            // @ts-expect-error compat
            const matches = "matches" in event ? event.matches : event.matches;
            setIsMobile(!!matches);
        };

        update(mql);
        // @ts-ignore vecchi browser
        mql.addEventListener ? mql.addEventListener("change", update) : mql.addListener(update);
        return () => {
            // @ts-ignore vecchi browser
            mql.removeEventListener ? mql.removeEventListener("change", update) : mql.removeListener(update);
        };
    }, [breakpoint]);

    return isMobile;
}


// ——————————————————————————————————————————————————————————
// COMPONENT
// ——————————————————————————————————————————————————————————
export function ProductSubstitutionSearch<T>({
    open,
    onClose,
    mode = "BUYER_COUNTERPROPOSAL",
    baseProductTitle,
    baseProductMeta,
    query,
    onQueryChange,
    results,
    loading,
    mapResultToView,
    selectedIds,
    onSelectProduct,
    onOpenProductDetails,
}: ProductSubstitutionSearchProps<T>) {
    const isMobile = useIsMobile();

    const panelTitle = mode === "COMMERCIAL_SUGGESTION" ? "Suggerisci alternativa commerciale" : "Proponi prodotto in sostituzione";
    const panelDescription = mode === "COMMERCIAL_SUGGESTION"
        ? "Seleziona i prodotti che il commerciale desidera proporre come alternativa in BOZZA."
        : "Seleziona il prodotto che il buyer desidera usare come controproposta.";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onQueryChange(e.target.value);
    };

    const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
        if (e.key === "Escape") {
            e.stopPropagation();
            onClose();
        };
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ x: 32, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 32, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 26 }}
                    className="flex-1 h-full min-w-0"
                    onKeyDown={handleKeyDown}
                    role="group"
                    aria-label={panelTitle}
                >
                    <FDBox
                        radius={isMobile ? "lg" : "2xl"}
                        pad="lg"
                        shadow="xl"
                        variant="gradient"
                        border
                        className="
                            flex h-full flex-col
                            bg-white/90 dark:bg-neutral-900/95
                            border border-neutral-200/70 dark:border-neutral-700/80
                            shadow-[0_18px_40px_rgba(15,23,42,0.18)]
                            backdrop-blur-xl
                        "
                    >
                        {/* HEADER */}
                        <div className="flex items-start justify-between gap-3 pb-3 border-b border-neutral-100/70 dark:border-neutral-800/70">
                            <div className="min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                                    {panelTitle}
                                </p>
                                <p className="mt-1 text-sm font-medium text-neutral-900 dark:text-neutral-50 line-clamp-2">
                                    {baseProductTitle ?? panelDescription}
                                </p>
                                {baseProductMeta && (
                                    <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                                        {baseProductMeta}
                                    </p>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="
                                    inline-flex items-center gap-1
                                    rounded-full px-3 py-1.5
                                    text-[11px] font-medium
                                    cursor-pointer
                                    bg-neutral-100/90 hover:bg-neutral-200
                                    dark:bg-neutral-800/80 dark:hover:bg-neutral-700
                                    text-neutral-700 dark:text-neutral-100
                                    border border-neutral-200/70 dark:border-neutral-700/70
                                    transition
                                "
                            >
                                <span className="h-1.5 w-1.5 rounded-full bg-neutral-500 dark:bg-neutral-300" />
                                <span>Chiudi ricerca</span>
                            </button>
                        </div>

                        {/* SEARCH INPUT */}
                        <div className="mt-3">
                            <div
                                className="
                                    flex items-center gap-2
                                    rounded-xl border border-neutral-200/80 dark:border-neutral-700/80
                                    bg-neutral-50/80 dark:bg-neutral-900/80
                                    px-3 py-2
                                    focus-within:ring-2 focus-within:ring-sky-400/70 dark:focus-within:ring-sky-500/70
                                    transition
                                "
                            >
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/80 text-neutral-400 shadow-sm">
                                    <span className="block h-2.5 w-2.5 rounded-full border border-neutral-400 border-t-transparent" />
                                </span>
                                <input
                                    type="text"
                                    // value=""
                                    onChange={handleChange}
                                    placeholder="Cerca tra i prodotti disponibili…"
                                    className="
                                        flex-1 bg-transparent outline-none
                                        text-[13px] text-neutral-800 placeholder:text-neutral-400
                                        dark:text-neutral-100 dark:placeholder:text-neutral-500
                                    "
                                />
                            </div>
                            <div className="mt-1 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                                <span>
                                    {loading.search_replace_products as boolean
                                        ? "Ricerca in corso…"
                                        : results.length
                                            ? `${results.length} risultati trovati`
                                            : query
                                                ? "Nessun risultato per questa ricerca"
                                                : "Inizia a digitare per cercare"}
                                </span>
                            </div>
                        </div>

                        {/* BODY: LISTA + DETTAGLIO */}
                        <div className="mt-4 flex flex-col flex-[1.6] min-w-0 min-h-0">
                            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                                <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3 pb-2">
                                    {!loading.search_replace_products as boolean ? results.map((item: CartProductDTO) => {
                                        const view = mapResultToView(item);
                                        const isSelected = selectedIds.includes(view.id);
                                        const canOpenDetails = typeof onOpenProductDetails === "function";
                                        const _loading = !!(loading.agents_alternatives as Map<string, boolean>).get(item._id);

                                        return (
                                            <div
                                                key={view.id}
                                                onClick={() => {
                                                    !_loading && onSelectProduct(item)
                                                }}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.target !== e.currentTarget) return;
                                                    if (e.key === "Enter" || e.key === " ") {
                                                        e.preventDefault();
                                                        !_loading && onSelectProduct(item);
                                                    }
                                                }}
                                                className={`
                                                        group flex flex-col items-stretch
                                                        rounded-2xl border border-neutral-200/80 dark:border-neutral-800
                                                        cursor-pointer
                                                        px-3 py-3
                                                        hover:border-sky-300 hover:bg-sky-50/70
                                                        dark:hover:border-sky-500/60 dark:hover:bg-sky-900/40
                                                        transition-colors
                                                        text-left
                                                        relative
                                                        ${isSelected
                                                        ? "border-sky-500 bg-sky-100 dark:border-sky-400 dark:bg-sky-900/60"
                                                        : "bg-white/80 dark:bg-neutral-900/80"}
                                                    `}
                                            >
                                                {/* Overlay di loading per l'intera card quando si sta assegnando come alternativa (solo per commercial suggestion) */}
                                                {_loading && (
                                                    <div className="absolute inset-0 bg-white/70 dark:bg-neutral-900/70 flex items-center justify-center rounded-2xl">
                                                        <span className={`inline-flex items-center justify-center animate-spin h-4 w-4 border-2 border-t-transparent border-gray-400 rounded-full`} />
                                                    </div>
                                                )}

                                                {isSelected && (
                                                    <MdDoneIcon className="absolute top-2 left-2 text-sky-500 dark:text-sky-400" />
                                                )}
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-white shadow-inner flex items-center justify-center overflow-hidden">
                                                        {view.thumbnailUrl ? (
                                                            <img
                                                                src={view.thumbnailUrl}
                                                                alt={view.title}
                                                                className="h-full w-full object-contain"
                                                            />
                                                        ) : (
                                                            <span className="text-[11px] text-neutral-400">
                                                                IMG
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p data-tooltip-id="general-quotations-tooltip" data-tooltip-content={view.title}
                                                            className="text-xs font-medium text-neutral-900 dark:text-neutral-50 line-clamp-2">
                                                            {view.title}
                                                        </p>
                                                        {view.subtitle && (
                                                            <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                                                                {view.subtitle}
                                                            </p>
                                                        )}
                                                        {(view.code || view.badge) && (
                                                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                                                {view.code && (
                                                                    <span className="rounded-full bg-neutral-100 text-[10px] text-neutral-600 px-2 py-0.5 dark:bg-neutral-800 dark:text-neutral-300">
                                                                        {view.code}
                                                                    </span>
                                                                )}
                                                                {view.badge && (
                                                                    <span className="rounded-full bg-amber-100 text-[10px] text-amber-800 px-2 py-0.5 dark:bg-amber-900/40 dark:text-amber-200">
                                                                        {view.badge}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {(view.priceLabel || canOpenDetails) && (
                                                    <div className="mt-2 flex items-center justify-between gap-2">
                                                        {view.priceLabel ? (
                                                            <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-50">
                                                                {view.priceLabel}
                                                            </p>
                                                        ) : (
                                                            <span />
                                                        )}

                                                        {canOpenDetails && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onOpenProductDetails?.(item);
                                                                }}
                                                                className="inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[10px]
                                                                bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700
                                                                text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                                                            >
                                                                <span>Dettagli</span>
                                                                <FiChevronRightIcon className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }) : (
                                        /** Skeleton per il caricamento */
                                        Array.from({ length: 9 }).map((_, index) => (
                                            <div
                                                key={index}
                                                className="animate-pulse flex flex-col items-stretch rounded-2xl border border-neutral-200/80 dark:border-neutral-800 px-3 py-3"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-neutral-200 dark:bg-neutral-700 shadow-inner" />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700 mb-1.5" />
                                                        <div className="h-3 w-1/2 rounded bg-neutral-200 dark:bg-neutral-700" />
                                                        <div className="mt-2 h-3 w-1/4 rounded bg-neutral-200 dark:bg-neutral-700" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </FDBox>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
