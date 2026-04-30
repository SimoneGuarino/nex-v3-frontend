import React from "react";
import type { ProductDetailsDTO, ProductPricingSummaryDTO } from "../types/product";
import { FiTag, FiHash, FiBarChart2, FiDollarSign } from "react-icons/fi";
import { formatMoney } from "../hook/useProductDetails";

const FiTagIcon = FiTag as React.FC<{ className?: string }>;
const FiHashIcon = FiHash as React.FC<{ className?: string }>;
const FiBarChart2Icon = FiBarChart2 as React.FC<{ className?: string }>;
const FiDollarSignIcon = FiDollarSign as React.FC<{ className?: string }>;

type SideInfoSectionProps = {
    product: ProductDetailsDTO;
    canSeePrices: boolean;
};

const getStatusBadgeClasses = (status?: string | null) => {
    if (!status) {
        return "bg-neutral-100 text-neutral-800 border border-neutral-200 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700";
    }
    const normalized = status.toUpperCase();

    if (normalized === "ATTIVO") {
        return "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-900";
    }
    if (
        normalized.includes("ESAURITO") ||
        normalized.includes("NON_CODIFICATO") ||
        normalized.includes("INATTIVO")
    ) {
        return "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-900";
    }
    if (normalized.includes("ARRIVO")) {
        return "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-900";
    }
    return "bg-neutral-100 text-neutral-800 border border-neutral-200 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700";
};

const SideInfoSection: React.FC<SideInfoSectionProps> = ({ product, canSeePrices }) => {
    const { id, codice, codiceProduttore, ean, brand, status, categoryPath, marketing, attributes } =
        product;

    const keywords = marketing?.bulletPoints ?? [];

    const highlightedAttributes =
        attributes?.filter((attr) => attr.highlight) ?? [];
    const mainAttributes =
        highlightedAttributes.length > 0
            ? highlightedAttributes.slice(0, 6)
            : (attributes ?? []).slice(0, 6);

    const extraAttributesCount =
        (attributes?.length ?? 0) - (mainAttributes?.length ?? 0);

    const pricing: ProductPricingSummaryDTO | undefined = product.pricingSummary;

    return (
        <aside className="flex flex-col gap-3">
            {/* STATO + CATEGORIA */}
            <section
                className="
                    rounded-2xl border border-neutral-200
                    bg-white/95
                    p-4 shadow-sm
                    dark:border-neutral-700 dark:bg-neutral-900/80 dark:shadow-none
                "
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                            Stato prodotto
                        </span>
                        <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusBadgeClasses(
                                status
                            )}`}
                        >
                            <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current/60" />
                            {status ?? "N/D"}
                        </span>
                    </div>

                    {id && (
                        <div className="text-right">
                            <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                                ID NEX
                            </div>
                            <div className="mt-0.5 max-w-[180px] truncate font-mono text-xs text-neutral-800 dark:text-neutral-100">
                                {id}
                            </div>
                        </div>
                    )}
                </div>

                {categoryPath && categoryPath.length > 0 && (
                    <div className="mt-4">
                        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
                            Categoria
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-neutral-800 dark:text-neutral-100">
                            {categoryPath.map((segment, idx) => (
                                <React.Fragment key={`${segment}-${idx}`}>
                                    {idx > 0 && (
                                        <span className="px-0.5 text-neutral-400 dark:text-neutral-600">
                                            ›
                                        </span>
                                    )}
                                    <span className="rounded-full bg-neutral-50 px-2 py-0.5 dark:bg-neutral-800">
                                        {segment}
                                    </span>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {/* IDENTIFICATIVI */}
            <section className="rounded-2xl border border-neutral-200 bg-white/95 p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/80 dark:shadow-none">
                <h3 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-600 dark:text-neutral-300">
                    <FiHashIcon className="h-3 w-3" />
                    Identificativi
                </h3>

                <dl className="mt-2 space-y-1.5 text-xs">
                    {codice && (
                        <div className="flex justify-between gap-2">
                            <dt className="text-neutral-500 dark:text-neutral-400">
                                Codice interno
                            </dt>
                            <dd className="max-w-[65%] truncate font-mono text-neutral-900 dark:text-neutral-50">
                                {codice}
                            </dd>
                        </div>
                    )}
                    {codiceProduttore && (
                        <div className="flex justify-between gap-2">
                            <dt className="text-neutral-500 dark:text-neutral-400">
                                Codice produttore
                            </dt>
                            <dd className="max-w-[65%] truncate font-mono text-neutral-900 dark:text-neutral-50">
                                {codiceProduttore}
                            </dd>
                        </div>
                    )}
                    {ean && (
                        <div className="flex justify-between gap-2">
                            <dt className="text-neutral-500 dark:text-neutral-400">EAN</dt>
                            <dd className="max-w-[65%] truncate font-mono text-neutral-900 dark:text-neutral-50">
                                {ean}
                            </dd>
                        </div>
                    )}
                    {brand && (
                        <div className="flex justify-between gap-2">
                            <dt className="text-neutral-500 dark:text-neutral-400">Brand</dt>
                            <dd className="max-w-[65%] truncate font-semibold text-neutral-900 dark:text-neutral-50">
                                {brand}
                            </dd>
                        </div>
                    )}
                </dl>
            </section>

            {/* PRICING SINTETICO (SE DISPONIBILE) */}
            {canSeePrices && pricing && (
                <section className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/70 dark:shadow-none">
                    <h3 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800 dark:text-emerald-200">
                        <FiDollarSignIcon className="h-3 w-3" />
                        Sintesi prezzi
                    </h3>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-emerald-900 dark:text-emerald-100">
                        {pricing.listPrice !== undefined && (
                            <div className="space-y-0.5">
                                <span className="text-emerald-800/80 dark:text-emerald-300">
                                    Listino
                                </span>
                                <div className="font-medium">
                                    {formatMoney(
                                        pricing.listPrice,
                                        pricing.currency ?? "€"
                                    )}
                                </div>
                            </div>
                        )}
                        {pricing.netPrice !== undefined && (
                            <div className="space-y-0.5">
                                <span className="text-emerald-800/80 dark:text-emerald-300">
                                    Netto migliore
                                </span>
                                <div className="font-semibold">
                                    {formatMoney(
                                        pricing.netPrice,
                                        pricing.currency ?? "€"
                                    )}
                                </div>
                            </div>
                        )}
                        {pricing.minNetPrice !== undefined &&
                            pricing.maxNetPrice !== undefined && (
                                <div className="space-y-0.5 space-x-2 col-span-2">
                                    <span className="text-emerald-800/80 dark:text-emerald-300">
                                        Range fornitori
                                    </span>
                                    <div className="inline-flex items-center gap-1 font-medium">
                                        <FiBarChart2Icon className="h-3 w-3" />
                                        {formatMoney(
                                            pricing.minNetPrice,
                                            pricing.currency ?? "€"
                                        )}
                                        <span className="text-emerald-800/70 dark:text-emerald-300/80">
                                            –
                                        </span>
                                        {formatMoney(
                                            pricing.maxNetPrice,
                                            pricing.currency ?? "€"
                                        )}
                                    </div>
                                </div>
                            )}
                        {pricing.supplierCount !== undefined && (
                            <div className="col-span-2 text-[10px] text-emerald-900/80 dark:text-emerald-200/80">
                                Basato su {pricing.supplierCount}{" "}
                                {pricing.supplierCount === 1
                                    ? "fornitore"
                                    : "fornitori"}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* KEYWORDS */}
            {keywords.length > 0 && (
                <section className="rounded-2xl border border-neutral-200 bg-white/95 p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/80 dark:shadow-none">
                    <h3 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-600 dark:text-neutral-300">
                        <FiTagIcon className="h-3 w-3" />
                        Keywords &amp; tag
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {keywords.slice(0, 12).map((keyword) => (
                            <span
                                key={keyword}
                                className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                            >
                                #{keyword}
                            </span>
                        ))}
                        {keywords.length > 12 && (
                            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                +{keywords.length - 12} altri
                            </span>
                        )}
                    </div>
                </section>
            )}

            {/* SPECIFICHE IN EVIDENZA */}
            {mainAttributes && mainAttributes.length > 0 && (
                <section className="rounded-2xl border border-neutral-200 bg-white/95 p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900/80 dark:shadow-none">
                    <h3 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-600 dark:text-neutral-300">
                        <FiTagIcon className="h-3 w-3" />
                        Specifiche in evidenza
                    </h3>

                    <dl className="mt-2 space-y-1.5 text-xs">
                        {mainAttributes.map((attr, idx) => (
                            <div
                                key={idx ?? `${attr.name}-${attr.value}`}
                                className="flex justify-between gap-2"
                            >
                                <dt className="max-w-[55%] truncate text-neutral-500 dark:text-neutral-400">
                                    {attr.group ? `${attr.group} · ` : ""}
                                    {attr.name}
                                </dt>
                                <dd className="max-w-[45%] truncate text-neutral-900 dark:text-neutral-50">
                                    {attr.value}
                                </dd>
                            </div>
                        ))}
                    </dl>

                    {extraAttributesCount > 0 && (
                        <div className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400">
                            +{extraAttributesCount} specifiche aggiuntive
                        </div>
                    )}
                </section>
            )}
        </aside>
    );
};

export default SideInfoSection;
