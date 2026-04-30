import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiChevronDown } from "react-icons/fi";
import { ProductDetailsDTO } from "../types/product";

const FiChevronDownIcon = FiChevronDown as React.FC<{ className?: string }>;

type MainInfoSectionProps = {
    product: ProductDetailsDTO;
};

const SPECS_COLLAPSED_COUNT = 8;

const MainInfoSection: React.FC<MainInfoSectionProps> = ({ product }) => {
    const bullets = product.marketing?.bulletPoints ?? [];
    const longDesc = product.marketing?.longDescription;

    const attributes = product.attributes ?? [];

    const highlightAttrs = useMemo(
        () => attributes.filter((a) => a.highlight),
        [attributes],
    );

    const otherAttrs = useMemo(
        () => attributes.filter((a) => !a.highlight),
        [attributes],
    );

    const [showAllSpecs, setShowAllSpecs] = useState(false);

    const visibleSpecs = showAllSpecs
        ? otherAttrs
        : otherAttrs.slice(0, SPECS_COLLAPSED_COUNT);

    const extraSpecsCount = Math.max(otherAttrs.length - visibleSpecs.length, 0);

    return (
        <section
            className="
                flex flex-col gap-4
                rounded-2xl border border-neutral-200/80
                bg-white/95
                shadow-sm
                p-4 md:p-5
                dark:border-neutral-700/80 dark:bg-neutral-900/80 dark:shadow-none
            "
        >
            {/* HIGHLIGHTS */}
            {highlightAttrs.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {highlightAttrs.map((attr, idx) => (
                        <div
                            key={idx}
                            className="
                                rounded-xl border border-neutral-200
                                bg-neutral-50 px-3 py-2
                                text-xs
                                transition
                                hover:border-neutral-300 hover:bg-white
                                dark:border-neutral-700 dark:bg-neutral-900
                                dark:hover:border-neutral-500 dark:hover:bg-neutral-800
                            "
                        >
                            <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                                {attr.name}
                            </div>
                            <div className="mt-0.5 text-neutral-900 dark:text-neutral-50">
                                {attr.value}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* DESCRIZIONE MARKETING */}
            {(bullets.length > 0 || longDesc) && (
                <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                        Scheda prodotto
                    </h3>

                    {bullets.length > 0 && (
                        <ul className="list-disc space-y-1 pl-4 text-xs text-neutral-700 dark:text-neutral-300">
                            {bullets.map((b, idx) => (
                                <li key={idx}>{b}</li>
                            ))}
                        </ul>
                    )}

                    {longDesc && (
                        <p className="text-xs leading-relaxed text-neutral-700 whitespace-pre-line dark:text-neutral-300">
                            {longDesc}
                        </p>
                    )}

                    {product.marketing?.pdfDatasheetUrl && (
                        <a
                            href={product.marketing.pdfDatasheetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                        >
                            <span>Apri datasheet PDF</span>
                            <span>↗</span>
                        </a>
                    )}
                </div>
            )}

            {/* SPECIFICHE TECNICHE (SEZIONE COLLASSABILE) */}
            {otherAttrs.length > 0 && (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                            Specifiche tecniche
                        </h3>

                        <div className="flex items-center gap-2">
                            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-[11px] text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
                                {otherAttrs.length} voci
                            </span>

                            {otherAttrs.length > SPECS_COLLAPSED_COUNT && (
                                <button
                                    type="button"
                                    onClick={() => setShowAllSpecs((v) => !v)}
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
                                        {showAllSpecs
                                            ? "Riduci elenco"
                                            : `Mostra tutte${extraSpecsCount > 0 ? ` (+${extraSpecsCount})` : ""}`}
                                    </span>
                                    <FiChevronDownIcon
                                        className={`h-3 w-3 transition-transform ${showAllSpecs ? "rotate-180" : ""
                                            }`}
                                    />
                                </button>
                            )}
                        </div>
                    </div>

                    <AnimatePresence initial={false}>
                        {visibleSpecs.length > 0 && (
                            <motion.div
                                key={showAllSpecs ? "all" : "collapsed"}
                                initial={{ opacity: 0, y: -4, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: "auto" }}
                                exit={{ opacity: 0, y: -4, height: 0 }}
                                transition={{
                                    duration: 0.22,
                                    ease: [0.22, 0.61, 0.36, 1],
                                }}
                                className="overflow-hidden"
                            >
                                <div className="mt-1 grid gap-2 md:grid-cols-2">
                                    {visibleSpecs.map((attr, idx) => (
                                        <div
                                            key={`${attr.group}-${attr.name}-${idx}`}
                                            className="
                                                flex flex-col
                                                rounded-xl border border-neutral-100
                                                bg-neutral-50/80
                                                px-3 py-2
                                                text-xs
                                                transition
                                                hover:border-neutral-200 hover:bg-white
                                                dark:border-neutral-700 dark:bg-neutral-900/80
                                                dark:hover:border-neutral-500 dark:hover:bg-neutral-800
                                            "
                                        >
                                            {attr.group && (
                                                <span className="text-[10px] uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                                                    {attr.group}
                                                </span>
                                            )}
                                            <span className="text-[11px] text-neutral-600 dark:text-neutral-300">
                                                {attr.name}
                                            </span>
                                            <span className="mt-0.5 text-neutral-900 dark:text-neutral-50">
                                                {attr.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </section>
    );
};

export default MainInfoSection;
