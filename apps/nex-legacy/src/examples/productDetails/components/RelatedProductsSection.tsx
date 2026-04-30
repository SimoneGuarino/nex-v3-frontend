import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiChevronDown } from "react-icons/fi";
import { ProductDetailsDTO } from "../types/product";

const FiChevronDownIcon = FiChevronDown as React.FC<{ className?: string }>;

type RelatedProductsSectionProps = {
    related: ProductDetailsDTO["relatedProducts"];
};

const COLLAPSED_COUNT = 6;

const RelatedProductsSection: React.FC<RelatedProductsSectionProps> = ({ related }) => {
    const [expanded, setExpanded] = useState(false);
    if (!related || related.length === 0) return null;

    const visible = expanded ? related : related.slice(0, COLLAPSED_COUNT);

    const hiddenCount = Math.max(related.length - visible.length, 0);

    return (
        <motion.section
            layout
            className="
                rounded-2xl border border-neutral-200
                bg-white/95 p-4 shadow-sm
                dark:border-neutral-700 dark:bg-neutral-900/80 dark:shadow-none
            "
        >
            <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    Prodotti correlati
                </h3>

                <div className="flex items-center gap-2">
                    <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-[11px] text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
                        {related.length} elementi
                    </span>

                    {related.length > COLLAPSED_COUNT && (
                        <button
                            type="button"
                            onClick={() => setExpanded((v) => !v)}
                            className="
                                inline-flex items-center gap-1
                                rounded-full border border-neutral-200
                                bg-white px-2.5 py-1
                                text-[11px] font-medium text-neutral-700
                                shadow-sm
                                hover:bg-neutral-50
                                transition
                                dark:border-neutral-700 dark:bg-neutral-900
                                dark:text-neutral-200 dark:hover:bg-neutral-800
                            "
                        >
                            <span>
                                {expanded
                                    ? "Riduci elenco"
                                    : `Mostra tutti${hiddenCount > 0 ? ` (+${hiddenCount})` : ""}`}
                            </span>
                            <FiChevronDownIcon
                                className={`h-3 w-3 transition-transform ${
                                    expanded ? "rotate-180" : ""
                                }`}
                            />
                        </button>
                    )}
                </div>
            </div>

            <AnimatePresence initial={false}>
                {visible.length > 0 && (
                    <motion.div
                        key={expanded ? "expanded" : "collapsed"}
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        transition={{
                            duration: 0.22,
                            ease: [0.22, 0.61, 0.36, 1],
                        }}
                        className="overflow-hidden"
                    >
                        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {visible.map((r) => (
                                <motion.div
                                    key={r.id}
                                    layout
                                    whileHover={{ y: -2, scale: 1.01 }}
                                    transition={{ duration: 0.15 }}
                                    className="
                                        flex gap-3 rounded-xl border border-neutral-200
                                        bg-neutral-50/80 p-2
                                        cursor-pointer
                                        dark:border-neutral-700 dark:bg-neutral-900
                                    "
                                >
                                    <div className="flex h-12 w-12 items-center justify-center">
                                        {r.thumbnail ? (
                                            <img
                                                src={r.thumbnail}
                                                loading="lazy"
                                                alt={r.description}
                                                className="h-12 w-12 rounded-md bg-white object-contain p-1 dark:bg-neutral-900"
                                            />
                                        ) : (
                                            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-neutral-200 text-[10px] text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                                                Nessuna immagine
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex min-w-0 flex-1 flex-col">
                                        <div className="truncate text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                                            {r.description}
                                        </div>
                                        {r.codiceProduttore && (
                                            <div className="truncate text-[11px] text-neutral-500 dark:text-neutral-400">
                                                {r.codiceProduttore}
                                            </div>
                                        )}
                                        {r.brand && (
                                            <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                                                {r.brand}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.section>
    );
};

export default RelatedProductsSection;