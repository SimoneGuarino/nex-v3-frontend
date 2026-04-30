import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    FiBox,
    FiTrendingUp,
    FiPercent,
    FiCalendar,
    FiActivity,
    FiChevronDown,
    FiChevronUp,
    FiAlertTriangle,
    FiMaximize2,
    FiMinimize2,
} from "react-icons/fi";
import {
    ResponsiveContainer,
    ComposedChart,
    Line,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
} from "recharts";

import {
    ProductDetailsDTO,
    ProductSupplierOfferDTO,
} from "../types/product";
import type {
    ProductVariationHistoryDTO,
    SupplierVariationSeriesDTO,
} from "../types/productVariation";
import { distributorAvatars } from "config/dist_avatars";
import { formatMoney, type VariationRange } from "../hook/useProductDetails";

const FiBoxIcon = FiBox as React.FC<{ className?: string }>;
const FiTrendingUpIcon = FiTrendingUp as React.FC<{ className?: string }>;
const FiPercentIcon = FiPercent as React.FC<{ className?: string }>;
const FiCalendarIcon = FiCalendar as React.FC<{ className?: string }>;
const FiActivityIcon = FiActivity as React.FC<{ className?: string }>;
const FiChevronDownIcon = FiChevronDown as React.FC<{ className?: string }>;
const FiChevronUpIcon = FiChevronUp as React.FC<{ className?: string }>;
const FiAlertTriangleIcon = FiAlertTriangle as React.FC<{ className?: string }>;
const FiMaximize2Icon = FiMaximize2 as React.FC<{ className?: string }>;
const FiMinimize2Icon = FiMinimize2 as React.FC<{ className?: string }>;

type TrendRange = VariationRange;
type TrendMode = "both" | "price" | "stock";

type SuppliersSectionProps = {
    product: ProductDetailsDTO | null;
    variationHistory?: ProductVariationHistoryDTO | null;
    isVariationLoading?: boolean;
    variationError?: string | null;

    selectedKey: string | null;
    onChangeSelectedKey: (key: string) => void;

    trendRange: TrendRange;
    onChangeTrendRange: (range: TrendRange) => void;
};

const formatDate = (iso?: string | null) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("it-IT");
};

const formatShortDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" });
};

const computeTotalUnitCost = (s: ProductSupplierOfferDTO): number | undefined => {
    const base = s.netPrice ?? s.listPrice;
    if (base == null) return undefined;

    const extras =
        (s.priceComponents?.raee ?? 0) +
        (s.priceComponents?.siae ?? 0) +
        (s.priceComponents?.sisvel ?? 0);

    return base + extras;
};

const computeDiscountPercent = (s: ProductSupplierOfferDTO): number | undefined => {
    const list = s.listPrice;
    const net = s.netPrice;
    if (list == null || net == null || list <= 0) return undefined;
    const diff = list - net;
    return (diff / list) * 100;
};

// Trend prezzo (ultimo vs penultimo punto)
const computePriceTrend = (series?: SupplierVariationSeriesDTO | null):
    | { direction: "up" | "down" | "flat"; deltaPercent: number | null }
    | null => {
    if (!series || !series.points?.length) return null;
    const pts = series.points.filter((p) => p.price != null);
    if (pts.length < 2) {
        return {
            direction: "flat",
            deltaPercent: null,
        };
    }
    const last = pts[pts.length - 1].price!;
    const prev = pts[pts.length - 2].price!;
    if (last === prev || prev === 0) {
        return { direction: "flat", deltaPercent: null };
    }
    const delta = ((last - prev) / prev) * 100;
    return {
        direction: delta > 0 ? "up" : "down",
        deltaPercent: Math.abs(delta),
    };
};

const buildSupplierSeriesMap = (
    variationHistory?: ProductVariationHistoryDTO | null
): Record<string, SupplierVariationSeriesDTO> => {
    if (!variationHistory?.suppliers?.length) return {};
    const map: Record<string, SupplierVariationSeriesDTO> = {};
    for (const s of variationHistory.suppliers) {
        if (!s.supplierName) continue;
        map[s.supplierName.toLowerCase()] = s;
    }
    return map;
};

const SuppliersSection: React.FC<SuppliersSectionProps> = ({
    product,
    variationHistory,
    isVariationLoading,
    variationError,
    selectedKey,
    onChangeSelectedKey,
    trendRange,
    onChangeTrendRange,
}) => {
    const [trendExpanded, setTrendExpanded] = useState(false);
    const [trendMode, setTrendMode] = useState<TrendMode>("both");

    const rawSuppliers = (product?.suppliers ?? []) as ProductSupplierOfferDTO[];

    const suppliers = useMemo(
        () =>
            [...rawSuppliers].sort((a, b) => {
                const pa = a.netPrice ?? a.listPrice ?? Number.POSITIVE_INFINITY;
                const pb = b.netPrice ?? b.listPrice ?? Number.POSITIVE_INFINITY;
                return pa < pb ? 1 : pa > pb ? -1 : 0; // Descending
            }),
        [rawSuppliers]
    );

    const variationBySupplier = useMemo(
        () => buildSupplierSeriesMap(variationHistory),
        [variationHistory]
    );

    if (!product) return null;
    if (!rawSuppliers.length) return null;

    const selected =
        suppliers.find((s) => s.name === selectedKey) ?? suppliers[0];

    const currency = "€";
    const selectedSeries =
        variationBySupplier[selected.name?.toLowerCase() ?? ""] ?? null;

    // Dati per il grafico
    const chartData = useMemo(() => {
        if (!selectedSeries?.points?.length) return [];

        const now = new Date();
        let fromDate: Date | null = null;
        if (trendRange === "30d") {
            fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (trendRange === "90d") {
            fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        }

        const filtered = selectedSeries.points.filter((p) => {
            if (!fromDate) return true;
            const d = new Date(p.timestamp);
            if (Number.isNaN(d.getTime())) return false;
            return d >= fromDate;
        });

        // Downsample per performance
        const MAX_POINTS = 200;
        let final = filtered;
        if (filtered.length > MAX_POINTS) {
            const step = Math.ceil(filtered.length / MAX_POINTS);
            final = filtered.filter((_, idx) => idx % step === 0);
        }

        return final.map((p) => ({
            ts: p.timestamp,
            label: formatShortDate(p.timestamp),
            price: p.price,
            availability: p.availability,
            isSuspicious: p.isSuspiciousAvailability,
        }));
    }, [selectedSeries, trendRange]);

    const priceTrend = useMemo(
        () => computePriceTrend(selectedSeries),
        [selectedSeries]
    );

    const hasSuspicious = selectedSeries?.stats?.hasSuspiciousAvailability ?? false;
    const lastPrice = selectedSeries?.stats?.lastPrice ?? selected.netPrice ?? selected.listPrice ?? null;

    return (
        <section
            className="
                rounded-2xl border border-neutral-200/80
                bg-white/95
                shadow-sm
                p-4 md:p-5
                flex flex-col gap-4
                dark:border-neutral-700/80 dark:bg-neutral-900/80 dark:shadow-none
            "
        >
            {/* HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <FiBoxIcon className="h-4 w-4 text-sky-500" />
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                        Fornitori &amp; offerte
                    </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-[11px] text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
                        {suppliers.length}{" "}
                        {suppliers.length === 1
                            ? "fornitore disponibile"
                            : "fornitori disponibili"}
                    </span>

                    {variationHistory && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-[10px] text-sky-700 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-200 dark:border-sky-800">
                            <FiActivityIcon className="h-3 w-3" />
                            Storico prezzi & stock
                        </span>
                    )}
                </div>
            </div>

            {/* CONTENUTO PRINCIPALE */}
            <motion.div
                layout
                className="flex flex-col gap-4 lg:flex-row lg:items-start"
            >
                {/* LISTA FORNITORI */}
                <motion.div
                    layout
                    className={`
                        min-w-0 transition-[max-height,flex-basis] duration-300
                        ${trendExpanded ? "lg:basis-[40%]" : "lg:basis-[55%]"}
                    `}
                >
                    <div
                        className={`
                            flex flex-col gap-2 overflow-y-auto pr-1
                            ${trendExpanded ? "max-h-72" : "max-h-92"}
                        `}
                    >
                        {suppliers.map((s) => {
                            const isActive = s.name === selected.name;
                            const basePrice = s.netPrice ?? s.listPrice;
                            const totalCost = computeTotalUnitCost(s);
                            const discount = computeDiscountPercent(s);

                            const avatarCfg =
                                distributorAvatars[s.name?.toLowerCase()] ?? null;

                            const series =
                                variationBySupplier[s.name?.toLowerCase() ?? ""] ?? null;
                            const trend = computePriceTrend(series);
                            const suspicious =
                                series?.stats?.hasSuspiciousAvailability ?? false;

                            return (
                                <motion.button
                                    key={s.name}
                                    type="button"
                                    onClick={() => onChangeSelectedKey(s.name)}
                                    className={`
                                        group flex w-full items-start gap-3 rounded-2xl border px-3 py-2.5 text-left
                                        cursor-pointer transition-colors
                                        ${isActive
                                            ? "border-sky-400 bg-sky-50/80 dark:border-sky-500 dark:bg-sky-950/40"
                                            : "border-neutral-200 bg-neutral-50/80 hover:border-sky-200 hover:bg-sky-50/60 dark:border-neutral-700 dark:bg-neutral-900/80 dark:hover:border-sky-600 dark:hover:bg-sky-950/30"
                                        }
                                    `}
                                    whileHover={{ y: -1 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 320,
                                        damping: 26,
                                    }}
                                >
                                    {/* Avatar fornitore */}
                                    {avatarCfg?.avatarUrl ? (
                                        <img
                                            src={avatarCfg.avatarUrl}
                                            alt={`${s.name} avatar`}
                                            className="mt-0.5 h-9 w-9 rounded-full bg-white object-cover shadow-inner dark:bg-neutral-900"
                                        />
                                    ) : (
                                        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-semibold text-sky-600 shadow-inner dark:bg-neutral-900 dark:text-sky-400">
                                            {(s.name ?? "?")
                                                .split(" ")
                                                .slice(0, 2)
                                                .map((w) => w[0])
                                                .join("")}
                                        </div>
                                    )}

                                    {/* Info sintetiche fornitore */}
                                    <div className="min-w-0 flex-1 space-y-0.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="truncate text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                                                {s.name}
                                            </p>

                                            <div className="flex flex-wrap items-center gap-1">
                                                {s.promo?.isPromo && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-900">
                                                        <FiPercentIcon className="h-3 w-3" />
                                                        Promo
                                                    </span>
                                                )}

                                                {trend && (
                                                    <span
                                                        className={`
                                                            inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] border
                                                            ${trend.direction === "up"
                                                                ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-200 dark:border-red-800"
                                                                : trend.direction === "down"
                                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-700"
                                                                    : "bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-900/80 dark:text-neutral-300 dark:border-neutral-700"
                                                            }
                                                        `}
                                                    >
                                                        <FiTrendingUpIcon className="h-3 w-3" />
                                                        {trend.direction === "up"
                                                            ? "+ "
                                                            : trend.direction === "down"
                                                                ? "- "
                                                                : ""}
                                                        {trend.deltaPercent != null
                                                            ? `${trend.deltaPercent.toFixed(1)}%`
                                                            : "flat"}
                                                    </span>
                                                )}

                                                {suspicious && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] text-amber-800 border border-amber-200 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-900">
                                                        <FiAlertTriangleIcon className="h-3 w-3" />
                                                        stock anomalo
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-600 dark:text-neutral-400">
                                            {s.availability?.total != null && (
                                                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-200">
                                                    <FiBoxIcon className="mr-1 h-3 w-3" />
                                                    {s.availability.total} pz
                                                </span>
                                            )}
                                            {s.availability?.incoming != null &&
                                                s.availability.incoming > 0 && (
                                                    <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                                                        +{s.availability.incoming} in arrivo
                                                    </span>
                                                )}
                                            {s.availability?.lastUpdate && (
                                                <span className="text-[10px] text-neutral-500 dark:text-neutral-500">
                                                    Agg. {formatDate(s.availability.lastUpdate)}
                                                </span>
                                            )}
                                        </div>

                                        {basePrice != null && (
                                            <div className="mt-0.5 flex flex-wrap items-baseline gap-2 text-xs">
                                                <span className="font-semibold text-neutral-900 dark:text-neutral-50">
                                                    {formatMoney(basePrice, currency)}
                                                </span>
                                                {totalCost !== undefined &&
                                                    totalCost !== basePrice && (
                                                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                                            tot. con oneri{" "}
                                                            {formatMoney(totalCost, currency)}
                                                        </span>
                                                    )}
                                                {discount !== undefined && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-200">
                                                        <FiPercentIcon className="h-3 w-3" />
                                                        -{discount.toFixed(1)}%
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* DETTAGLIO FORNITORE SELEZIONATO + ANALYTICS */}
                <motion.div
                    layout
                    key={selected.name}
                    className={`
                        mt-1 w-full flex-shrink-0 rounded-2xl border border-neutral-200
                        bg-white p-4 shadow-sm lg:mt-0
                        dark:border-neutral-700 dark:bg-neutral-900
                        transition-[max-width,flex-basis] duration-300
                        ${trendExpanded ? "lg:basis-[60%]" : "lg:max-w-sm lg:basis-[45%]"}
                    `}
                >
                    {/* header fornitore + toggle focus */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                            <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-50">
                                {selected.name}
                            </p>
                            {selected.promo?.isPromo && (
                                <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-900">
                                    <FiPercentIcon className="h-3 w-3" />
                                    Promo attiva
                                </div>
                            )}
                        </div>

                        {variationHistory && (
                            <button
                                type="button"
                                onClick={() => setTrendExpanded((prev) => !prev)}
                                className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-1 text-[10px] text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                            >
                                <FiActivityIcon className="h-3 w-3" />
                                <span>{trendExpanded ? "Riduci grafico" : "Analisi storica"}</span>
                                {trendExpanded ? (
                                    <FiMinimize2Icon className="h-3 w-3" />
                                ) : (
                                    <FiMaximize2Icon className="h-3 w-3" />
                                )}
                            </button>
                        )}
                    </div>

                    {/* GRID METRICHE STATICHE */}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-neutral-700 dark:text-neutral-300">
                        {selected.listPrice != null && (
                            <div className="space-y-0.5">
                                <span className="text-neutral-500 dark:text-neutral-400">
                                    Listino
                                </span>
                                <div className="font-medium">
                                    {formatMoney(selected.listPrice, currency)}
                                </div>
                            </div>
                        )}

                        {selected.netPrice != null && (
                            <div className="space-y-0.5">
                                <span className="text-neutral-500 dark:text-neutral-400">
                                    Netto
                                </span>
                                <div className="font-semibold text-neutral-900 dark:text-neutral-50">
                                    {formatMoney(selected.netPrice, currency)}
                                </div>
                            </div>
                        )}

                        {computeTotalUnitCost(selected) !== undefined && (
                            <div className="space-y-0.5">
                                <span className="text-neutral-500 dark:text-neutral-400">
                                    Totale con RAEE/SIAE
                                </span>
                                <div className="font-medium">
                                    {formatMoney(
                                        computeTotalUnitCost(selected),
                                        currency
                                    )}
                                </div>
                            </div>
                        )}

                        {computeDiscountPercent(selected) !== undefined && (
                            <div className="space-y-0.5">
                                <span className="text-neutral-500 dark:text-neutral-400">
                                    Sconto vs listino
                                </span>
                                <div className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-300">
                                    <FiPercentIcon className="h-3 w-3" />
                                    -{computeDiscountPercent(selected)?.toFixed(1)}%
                                </div>
                            </div>
                        )}

                        {selected.availability?.total != null && (
                            <div className="space-y-0.5">
                                <span className="text-neutral-500 dark:text-neutral-400">
                                    Disponibilità
                                </span>
                                <div className="font-medium">
                                    {selected.availability.total.toLocaleString("it-IT")} pz
                                </div>
                            </div>
                        )}

                        {selected.availability?.incoming != null && (
                            <div className="space-y-0.5">
                                <span className="text-neutral-500 dark:text-neutral-400">
                                    In arrivo
                                </span>
                                <div className="font-medium">
                                    {selected.availability.incoming.toLocaleString(
                                        "it-IT"
                                    )}{" "}
                                    pz
                                </div>
                            </div>
                        )}

                        {selected.availability?.lastUpdate && (
                            <div className="space-y-0.5">
                                <span className="text-neutral-500 dark:text-neutral-400">
                                    Ultimo aggiornamento
                                </span>
                                <div className="inline-flex items-center gap-1 font-medium">
                                    <FiCalendarIcon className="h-3 w-3" />
                                    {formatDate(selected.availability.lastUpdate)}
                                </div>
                            </div>
                        )}

                        {selected.vat != null && (
                            <div className="space-y-0.5">
                                <span className="text-neutral-500 dark:text-neutral-400">
                                    IVA
                                </span>
                                <div className="font-medium">{selected.vat}%</div>
                            </div>
                        )}

                        {selected.priceComponents?.raee != null && (
                            <div className="space-y-0.5">
                                <span className="text-neutral-500 dark:text-neutral-400">
                                    RAEE
                                </span>
                                <div className="font-medium">
                                    {formatMoney(selected.priceComponents.raee, currency)}
                                </div>
                            </div>
                        )}

                        {selected.priceComponents?.siae != null && (
                            <div className="space-y-0.5">
                                <span className="text-neutral-500 dark:text-neutral-400">
                                    SIAE
                                </span>
                                <div className="font-medium">
                                    {formatMoney(selected.priceComponents.siae, currency)}
                                </div>
                            </div>
                        )}

                        {selected.priceComponents?.sisvel != null && (
                            <div className="space-y-0.5">
                                <span className="text-neutral-500 dark:text-neutral-400">
                                    Sisvel
                                </span>
                                <div className="font-medium">
                                    {formatMoney(selected.priceComponents.sisvel, currency)}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* DATE PROMO */}
                    {selected.promo?.isPromo && (
                        <div className="mt-3 space-y-1 rounded-xl bg-amber-50/70 px-3 py-2 text-[11px] text-amber-900 border border-amber-200 dark:bg-amber-950/70 dark:text-amber-100 dark:border-amber-900">
                            <div className="flex items-center gap-1 font-medium">
                                <FiCalendarIcon className="h-3 w-3" />
                                Finestra promozionale
                            </div>
                            <div className="flex flex-wrap gap-2 text-[11px]">
                                <span>
                                    Dal:{" "}
                                    <span className="font-medium">
                                        {formatDate(selected.promo.start)}
                                    </span>
                                </span>
                                <span>
                                    al:{" "}
                                    <span className="font-medium">
                                        {formatDate(selected.promo.end)}
                                    </span>
                                </span>
                            </div>
                        </div>
                    )}

                </motion.div>
            </motion.div>

            {/* CARD ANALYTICS PREZZO & STOCK */}
            {variationHistory && (
                <motion.div
                    layout
                    onClick={() => !trendExpanded && setTrendExpanded(true)}
                    className={`
                                mt-4 overflow-hidden rounded-2xl border border-neutral-200
                                bg-neutral-50 cursor-pointer
                                dark:border-neutral-700 dark:bg-neutral-900
                            `}
                >
                    {/* Header stile "Total sales" */}
                    <div className="flex items-start justify-between gap-2 px-3 pt-2">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-[11px] text-neutral-600 dark:text-neutral-300">
                                <FiActivityIcon className="h-3 w-3" />
                                <span>Andamento prezzo & stock</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                                    {lastPrice != null
                                        ? formatMoney(lastPrice, currency)
                                        : "-"}
                                </span>
                                {priceTrend && priceTrend.deltaPercent != null && (
                                    <span
                                        className={`
                                                    text-[11px] font-medium
                                                    ${priceTrend.direction === "down"
                                                ? "text-emerald-600 dark:text-emerald-300"
                                                : priceTrend.direction === "up"
                                                    ? "text-red-600 dark:text-red-300"
                                                    : "text-neutral-500 dark:text-neutral-400"
                                            }
                                                `}
                                    >
                                        {priceTrend.direction === "down" ? "↓" : "↑"}{" "}
                                        {priceTrend.deltaPercent.toFixed(1)}% vs ultimo
                                        aggiornamento
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Controls / hint */}
                        <div className="flex flex-col items-end gap-1 text-[10px]">
                            {!trendExpanded ? (
                                <span className="text-neutral-500 dark:text-neutral-400">
                                    Ultimi 30 giorni · clicca per espandere
                                </span>
                            ) : (
                                <div className="flex flex-wrap items-center gap-1">
                                    {/* RANGE */}
                                    {/* Range 30/90/Tutto */}
                                    <div className="inline-flex rounded-full border border-neutral-200 bg-neutral-50 p-0.5 text-[10px] dark:border-neutral-700 dark:bg-neutral-900">
                                        {(["30d", "90d", "all"] as TrendRange[]).map((r) => (
                                            <button
                                                key={r}
                                                type="button"
                                                className={`
                                                    px-2 py-[3px] rounded-full
                                                    ${trendRange === r
                                                        ? "bg-sky-500 text-white"
                                                        : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"}
                                                `}
                                                onClick={() => onChangeTrendRange(r)}
                                            >
                                                {r === "30d" ? "30g" : r === "90d" ? "90g" : "Tutto"}
                                            </button>
                                        ))}
                                    </div>

                                    {/* MODE */}
                                    <div className="inline-flex rounded-full border border-neutral-200 bg-white p-[1px] dark:border-neutral-700 dark:bg-neutral-900">
                                        {(["price", "stock", "both"] as TrendMode[]).map(
                                            (m) => (
                                                <button
                                                    key={m}
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setTrendMode(m);
                                                    }}
                                                    className={`
                                                                px-2 py-[3px] rounded-full capitalize
                                                                ${trendMode === m
                                                            ? "bg-sky-500 text-white"
                                                            : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                                        }
                                                            `}
                                                >
                                                    {m === "price"
                                                        ? "Prezzo"
                                                        : m === "stock"
                                                            ? "Stock"
                                                            : "Entrambi"}
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* GRAFICO */}
                    <motion.div
                        layout
                        className={`
                                    px-2 pb-2
                                    ${trendExpanded ? "h-[210px] md:h-[260px]" : "h-[110px] md:h-[130px]"}
                                `}
                    >
                        {isVariationLoading ? (
                            <div className="flex h-full items-center justify-center">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-transparent dark:border-neutral-600" />
                                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                        Carico lo storico fornitori…
                                    </span>
                                </div>
                            </div>
                        ) : variationError ? (
                            <div className="flex h-full items-center justify-center px-3 text-center text-[11px] text-red-500">
                                {variationError}
                            </div>
                        ) : !chartData.length ? (
                            <div className="flex h-full items-center justify-center px-3 text-center text-[11px] text-neutral-500 dark:text-neutral-400">
                                Nessun dato storico disponibile per questo fornitore.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData}>
                                    {/* in modalità compatta nascondo griglia/assi per avere sparkline pulita */}
                                    {trendExpanded && (
                                        <>
                                            <CartesianGrid
                                                stroke="#e5e7eb"
                                                strokeDasharray="3 3"
                                                vertical={false}
                                            />
                                            <XAxis
                                                dataKey="label"
                                                tick={{ fontSize: 10, fill: "#6b7280" }}
                                                tickLine={false}
                                                axisLine={{ stroke: "#e5e7eb" }}
                                            />
                                        </>
                                    )}

                                    {/* Y-axis prezzo */}
                                    {(trendMode === "price" ||
                                        trendMode === "both") && (
                                            <YAxis
                                                yAxisId="price"
                                                orientation="left"
                                                tick={
                                                    trendExpanded
                                                        ? {
                                                            fontSize: 10,
                                                            fill: "#6b7280",
                                                        }
                                                        : undefined
                                                }
                                                tickLine={false}
                                                axisLine={
                                                    trendExpanded
                                                        ? { stroke: "#e5e7eb" }
                                                        : undefined
                                                }
                                                hide={!trendExpanded}
                                            />
                                        )}

                                    {/* Y-axis stock */}
                                    {(trendMode === "stock" ||
                                        trendMode === "both") && (
                                            <YAxis
                                                yAxisId="stock"
                                                orientation="right"
                                                tick={
                                                    trendExpanded
                                                        ? {
                                                            fontSize: 10,
                                                            fill: "#6b7280",
                                                        }
                                                        : undefined
                                                }
                                                tickLine={false}
                                                axisLine={
                                                    trendExpanded
                                                        ? { stroke: "#e5e7eb" }
                                                        : undefined
                                                }
                                                hide={!trendExpanded}
                                            />
                                        )}

                                    {trendExpanded && (
                                        <RechartsTooltip
                                            formatter={(value: any, name: any) => {
                                                if (name === "price") {
                                                    return [
                                                        formatMoney(
                                                            Number(value),
                                                            currency
                                                        ),
                                                        "Prezzo",
                                                    ];
                                                }
                                                if (name === "availability") {
                                                    return [
                                                        `${value} pz`,
                                                        "Stock",
                                                    ];
                                                }
                                                return [value, name];
                                            }}
                                            labelFormatter={(label) =>
                                                `Data: ${label}`
                                            }
                                            contentStyle={{
                                                fontSize: 11,
                                                borderRadius: 8,
                                            }}
                                        />
                                    )}

                                    {(trendMode === "price" ||
                                        trendMode === "both") && (
                                            <Line
                                                type="monotone"
                                                dataKey="price"
                                                yAxisId="price"
                                                stroke="#f97316"
                                                strokeWidth={trendExpanded ? 2 : 1.6}
                                                dot={false}
                                                activeDot={trendExpanded ? { r: 4 } : false}
                                                isAnimationActive
                                                animationDuration={500}
                                                animationEasing="ease-out"
                                            />
                                        )}

                                    {(trendMode === "stock" ||
                                        trendMode === "both") && (
                                            <Area
                                                type="monotone"
                                                dataKey="availability"
                                                yAxisId="stock"
                                                stroke="#22c55e"
                                                fill="#22c55e33"
                                                strokeWidth={trendExpanded ? 2 : 1.5}
                                                isAnimationActive
                                                animationDuration={500}
                                                animationEasing="ease-out"
                                            />
                                        )}
                                </ComposedChart>
                            </ResponsiveContainer>
                        )}
                    </motion.div>

                    {hasSuspicious && (
                        <div className="border-t border-amber-100 bg-amber-50/80 px-3 py-1.5 text-[10px] text-amber-800 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-100">
                            <span className="inline-flex items-center gap-1">
                                <FiAlertTriangleIcon className="h-3 w-3" />
                                Alcuni valori di disponibilità potrebbero essere
                                falsati (es. 999). Considerare con cautela i picchi di
                                stock.
                            </span>
                        </div>
                    )}
                </motion.div>
            )}

            <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                I prezzi di acquisto e le analisi di storico fornitori sono visibili solo a
                profili Buyer / Admin / Dev con i relativi permessi.
            </p>
        </section>
    );
};

export default SuppliersSection;