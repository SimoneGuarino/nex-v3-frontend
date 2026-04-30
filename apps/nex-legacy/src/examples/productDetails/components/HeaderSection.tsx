import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiMaximize2, FiImage } from "react-icons/fi";
import { ProductDetailsDTO } from "../types/product";

const FiMaximize2Icon = FiMaximize2 as React.FC<{ className?: string }>;
const FiImageIcon = FiImage as React.FC<{ className?: string }>;

type HeaderSectionProps = {
    product: ProductDetailsDTO;
};

export const HeaderSection: React.FC<HeaderSectionProps> = ({ product }) => {
    const mainImage =
        product.images.main ??
        product.images.thumbnail ??
        product.images.gallery?.[0] ??
        undefined;

    const gallery: string[] = [
        ...(mainImage ? [mainImage] : []),
        ...(product.images.gallery ?? []),
    ].filter((v, idx, arr) => v && arr.indexOf(v) === idx);

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // ESC per chiudere il lightbox
    useEffect(() => {
        if (!previewUrl) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") setPreviewUrl(null);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [previewUrl]);

    const openPreview = (url?: string | null) => {
        if (!url) return;
        setPreviewUrl(url);
    };

    return (
        <>
            <section className="flex flex-col gap-4">
                <div className="flex flex-col gap-2 md:flex-row">
                    {/* BLOCCO IMMAGINE PRINCIPALE */}
                    <div className="flex items-center justify-start md:w-56">
                        <button
                            type="button"
                            onClick={() => openPreview(mainImage)}
                            className="
                                relative flex items-center justify-center
                                h-40 w-40 md:h-48 md:w-48
                                rounded-2xl border border-neutral-200
                                bg-neutral-50
                                dark:border-neutral-700 dark:bg-neutral-900
                                overflow-hidden
                                group
                            "
                        >
                            {mainImage ? (
                                <img
                                    src={mainImage}
                                    alt={
                                        product.codiceProduttore ??
                                        product.codice ??
                                        "Immagine prodotto"
                                    }
                                    loading="lazy"
                                    className="
                                        h-full w-full object-contain
                                        bg-white dark:bg-neutral-900
                                        transition-transform duration-200
                                        group-hover:scale-[1.04]
                                    "
                                />
                            ) : (
                                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-xs text-neutral-400 dark:text-neutral-500">
                                    <FiImageIcon className="h-6 w-6" />
                                    <span>Nessuna immagine</span>
                                </div>
                            )}

                            {mainImage && (
                                <span
                                    className="
                                        pointer-events-none absolute inset-x-2 bottom-2
                                        flex items-center justify-end gap-1
                                    "
                                >
                                    <span
                                        className="
                                            inline-flex items-center gap-1 rounded-full
                                            bg-black/55 px-2 py-1
                                            text-[10px] text-white
                                            opacity-0 group-hover:opacity-100
                                            transition-opacity
                                        "
                                    >
                                        <FiMaximize2Icon className="h-3 w-3" />
                                        <span>Espandi</span>
                                    </span>
                                </span>
                            )}
                        </button>
                    </div>

                    {/* BLOCCO TESTO PRINCIPALE */}
                    <div className="flex min-w-0 flex-1 flex-col gap-3">
                        {/* Brand + categoria breadcrumb */}
                        <div className="flex flex-wrap items-center gap-2">
                            {product.brand &&
                                (product.brandLogoUrl ? (
                                    <img
                                        src={product.brandLogoUrl}
                                        alt={`${product.brand} logo`}
                                        className="h-8 w-8"
                                        data-tooltip-id="general-product-details-tooltip"
                                        data-tooltip-content={`Marca: ${product.brand}`}
                                    />
                                ) : (
                                    <span
                                        data-tooltip-id="general-product-details-tooltip"
                                        data-tooltip-content={`Marca: ${product.brand}`}
                                        className="
                                            inline-flex items-center rounded-full
                                            border border-neutral-200 bg-neutral-50
                                            px-3 py-1 text-[11px] font-medium uppercase
                                            tracking-[0.12em] text-neutral-700
                                            dark:border-neutral-700 dark:bg-neutral-900
                                            dark:text-neutral-200
                                        "
                                    >
                                        {product.brand}
                                    </span>
                                ))}

                            {product.categoryPath && product.categoryPath.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                                    {product.categoryPath.map((segment, idx) => (
                                        <React.Fragment key={`${segment}-${idx}`}>
                                            {idx > 0 && (
                                                <span className="text-neutral-400 dark:text-neutral-600">
                                                    ›
                                                </span>
                                            )}
                                            <span className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800 dark:text-neutral-200">
                                                {segment}
                                            </span>
                                        </React.Fragment>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Titolo marketing */}
                        <h2 className="text-base md:text-lg font-semibold leading-snug text-neutral-900 dark:text-neutral-50">
                            {product.marketing?.shortDescription ||
                                product.marketing?.longDescription?.split(".")[0] ||
                                product.codiceProduttore ||
                                product.codice}
                        </h2>

                        {/* Codici / meta */}
                        <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-neutral-600 dark:text-neutral-400">
                            {product.codice && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-neutral-50 px-2 py-1 font-mono dark:bg-neutral-900 dark:text-neutral-100">
                                    <span className="text-neutral-400 dark:text-neutral-500">
                                        Cod. interno
                                    </span>
                                    <span>{product.codice}</span>
                                </span>
                            )}
                            {product.codiceProduttore && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-neutral-50 px-2 py-1 font-mono dark:bg-neutral-900 dark:text-neutral-100">
                                    <span className="text-neutral-400 dark:text-neutral-500">
                                        Produttore
                                    </span>
                                    <span>{product.codiceProduttore}</span>
                                </span>
                            )}
                            {product.ean && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-neutral-50 px-2 py-1 font-mono dark:bg-neutral-900 dark:text-neutral-100">
                                    <span className="text-neutral-400 dark:text-neutral-500">
                                        EAN
                                    </span>
                                    <span>{product.ean}</span>
                                </span>
                            )}
                            {product.status && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-neutral-50 px-2 py-1 dark:bg-neutral-900 dark:text-neutral-100">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/80" />
                                    <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-100">
                                        {product.status}
                                    </span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* GALLERY THUMBNAILS */}
                {gallery.length > 1 && (
                    <div className="mt-1 flex gap-2 overflow-x-auto pb-1">
                        {gallery.slice(0, 12).map((url, idx) => (
                            <button
                                key={`${url}-${idx}`}
                                type="button"
                                onClick={() => openPreview(url)}
                                className="
                                    flex h-16 w-16 flex-shrink-0 items-center justify-center
                                    rounded-xl border border-neutral-200 bg-neutral-50
                                    overflow-hidden
                                    hover:border-sky-300 hover:bg-sky-50
                                    dark:border-neutral-700 dark:bg-neutral-900
                                    dark:hover:border-sky-500 dark:hover:bg-sky-950/40
                                    transition-colors
                                "
                            >
                                <img
                                    src={url}
                                    loading="lazy"
                                    alt={`preview-${idx}`}
                                    className="h-full w-full object-contain bg-white dark:bg-neutral-900"
                                />
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {/* LIGHTBOX IMMAGINE */}
            <AnimatePresence>
                {previewUrl && (
                    <motion.div
                        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setPreviewUrl(null)}
                    >
                        <motion.div
                            className="relative max-h-[90vh] max-w-[90vw] rounded-2xl bg-neutral-950/90 p-3 shadow-2xl"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 260, damping: 22 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                type="button"
                                onClick={() => setPreviewUrl(null)}
                                className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-neutral-100 hover:bg-black/80 text-sm"
                            >
                                ✕
                            </button>
                            <img
                                src={previewUrl}
                                alt="Anteprima prodotto"
                                className="max-h-[80vh] max-w-[80vw] object-contain"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
