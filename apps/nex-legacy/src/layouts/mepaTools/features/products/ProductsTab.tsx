import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { FiAlertTriangle, FiCheckCircle, FiCpu, FiFileText, FiPlus, FiRefreshCw, FiSearch, FiTarget, FiX } from "react-icons/fi";
import { FDSelect, FDInput, FDBackdrop} from "@nex/fd-ui";

import { SidePanelShell } from "components/UI/panels/SidePanelShell";
import {
    SectionActionButton,
    SectionBlock,
    SectionContainer,
    SectionHeader,
    SectionKeyValue,
    SectionPill,
} from "components/UI/panels/customersPanel/components/sectionUi";
import { ProductDetailsReporting } from "examples/productDetails/ProductDetailsReporting";
import { enqueueSnackbar } from "components/MessageBox";
import { Panel } from "../../components/shared/Panel";
import { EmptyState } from "../../components/shared/EmptyState";
import type {
    MepaAiProductCandidate,
    MepaProductAgentsPipelineResult,
    MepaProductMatchingBatchResult,
    MepaProductSearchResponseData,
} from "../../types";
import { scorePct, singleSelectValue } from "../../utils/formatters";
import { providerLabel } from "../../utils/status";
import type { ExtractedItemView } from "./products.types";
import { filterProductReviewItems, getProductLots, getProductReviewStats } from "./products.selectors";
import {
    confidenceLabel,
    extractedItemId,
    extractedItemTitle,
    formatProductAttributeValue,
    getItemBestMatches,
    getItemEvidenceRefs,
    getItemSubstitutes,
    getTopProductCandidate,
    humanizeProductAttributeKey,
    orderedProductAttributes,
    productCandidateMetaText,
    productCandidatePrimaryText,
    productCandidateProductDetailsId,
    productCandidateRef,
    productCheckNotes,
    productMatchBucket,
    productMatchBucketClass,
    productMatchBucketLabel,
    productProposalClass,
    productProposalLabel,
    productRecommendationLabel,
    productReviewStatusClass,
    productReviewStatusLabel,
    quotationUsabilityLabel,
    topConfidenceNote,
} from "./products.utils";

/**
 * ProductsTab is the operational review surface for tender product rows.
 *
 * Architectural notes:
 * - All business/read-model data is owned by useMepaProductsController and arrives via props.
 * - This file owns only local UI state: filters, selected row, side panels and lightweight editor state.
 * - Expensive list derivations are memoized and search is deferred so large tenders do not block typing.
 * - The list is progressively rendered because real tenders may grow far beyond the current 60/100 rows.
 */

/**
 * Small KPI tile used at the top of the product review board.
 * It is intentionally stateless and pure: values are already derived before render, keeping this
 * component cheap enough to reuse for mobile/tablet/desktop grids without extra memoization needs.
 */
function ProductReviewKpi({ label, value, tone = "slate", note }: { label: string; value: string; tone?: "slate" | "emerald" | "amber" | "red" | "blue" | "violet"; note?: string }) {
    const toneClass: Record<string, string> = {
        slate: "border-slate-200/80 bg-white text-slate-950 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-50",
        emerald: "border-emerald-200/80 bg-emerald-50 text-emerald-950 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-100",
        amber: "border-amber-200/80 bg-amber-50 text-amber-950 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100",
        red: "border-rose-200/80 bg-rose-50 text-rose-950 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-100",
        blue: "border-blue-200/80 bg-blue-50 text-blue-950 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-100",
        violet: "border-violet-200/80 bg-violet-50 text-violet-950 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-100",
    };
    const accentClass: Record<string, string> = {
        slate: "bg-slate-400 dark:bg-neutral-500",
        emerald: "bg-emerald-500",
        amber: "bg-amber-500",
        red: "bg-rose-500",
        blue: "bg-blue-500",
        violet: "bg-violet-500",
    };
    return (
        <div className={`relative overflow-hidden rounded-[22px] border px-4 py-3 shadow-sm transition-colors ${toneClass[tone]}`}>
            <div className={`absolute inset-y-4 left-0 w-1 rounded-r-full ${accentClass[tone]}`} />
            <div className="pl-2">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-neutral-400">{label}</p>
                <div className="mt-2 flex items-end gap-2">
                    <p className="text-[26px] font-black leading-none tracking-tight">{value}</p>
                    {note ? <span className="mb-0.5 rounded-full border border-black/5 bg-white/80 px-2 py-0.5 text-[10px] font-black text-slate-500 dark:border-white/10 dark:bg-white/10 dark:text-neutral-300">{note}</span> : null}
                </div>
            </div>
        </div>
    );
}

const PRODUCT_ROWS_INITIAL_LIMIT = 80;
const PRODUCT_ROWS_INCREMENT = 80;

/**
 * Maps a product extraction row to its visual state.
 *
 * This isolates UI semantics from JSX so adding future buckets (for example
 * "supplier suggested", "manual override", "requires certificate") does not
 * spread conditional color/icon logic across the row component.
 */
function productRowVisualState(item: ExtractedItemView) {
    const bucket = productMatchBucket(item);
    const status = String(item.validationStatus ?? "PENDING_REVIEW").toUpperCase();
    if (status === "VALIDATED") {
        return {
            icon: <FiCheckCircle className="text-white" />,
            wrap: "bg-blue-600",
            border: "border-blue-200 bg-blue-50/50 dark:border-blue-500/30 dark:bg-blue-500/10",
            title: "Già validata",
            subtitle: "La riga è stata già confermata per la quotazione.",
        };
    }
    if (bucket === "READY") {
        return {
            icon: <FiCheckCircle className="text-white" />,
            wrap: "bg-emerald-600",
            border: "border-emerald-200 bg-emerald-50/40 dark:border-emerald-500/30 dark:bg-emerald-500/10",
            title: "Prodotto consigliato trovato",
            subtitle: "Esiste una proposta catalogo utilizzabile per la futura quotazione.",
        };
    }
    if (bucket === "BUYER_REVIEW") {
        return {
            icon: <FiAlertTriangle className="text-white" />,
            wrap: "bg-amber-500",
            border: "border-amber-200 bg-amber-50/40 dark:border-amber-500/30 dark:bg-amber-500/10",
            title: "Associazione proposta",
            subtitle: "Il sistema ha trovato un candidato catalogo, ma con confidenza o compatibilità da confermare.",
        };
    }
    return {
        icon: <FiX className="text-white" />,
        wrap: "bg-rose-500",
        border: "border-rose-200 bg-rose-50/40 dark:border-rose-500/30 dark:bg-rose-500/10",
        title: "Nessun prodotto trovato",
        subtitle: "Serve ricerca manuale o una correzione della riga estratta.",
    };
}

/**
 * Row card for the extracted product list.
 *
 * React.memo is important here: each row contains several derived labels, badges and candidate data.
 * Without memoization, any keystroke in filters/search would re-render every visible row even when
 * the item itself is unchanged. Keep props primitive/stable where possible.
 */
const ProductReviewRow = React.memo(function ProductReviewRow({ item, rowId, selected, onSelect }: { item: ExtractedItemView; rowId: string; selected: boolean; onSelect: (rowId: string) => void }) {
    const title = extractedItemTitle(item);
    const lot = String(item.match?.lot ?? item.match?.groupName ?? "n.d.").trim() || "n.d.";
    const brand = String(item.match?.technicalAttributes?.brand ?? item.match?.brand ?? "n.d.").trim() || "n.d.";
    const model = String(item.match?.technicalAttributes?.model ?? item.match?.model ?? "n.d.").trim() || "n.d.";
    const quantity = item.quantity != null ? `${item.quantity} ${String(item.unit ?? "PZ").toUpperCase()}` : "Q.tà n.d.";
    const candidate = getTopProductCandidate(item);
    const state = productRowVisualState(item);
    const status = String(item.validationStatus ?? "PENDING_REVIEW").toUpperCase();
    const isValidated = status === "VALIDATED";
    return (
        <button
            type="button"
            onClick={() => onSelect(rowId)}
            className={`w-full rounded-[24px] border p-4 text-left transition-all duration-150 ${selected ? "border-blue-300 bg-blue-50/70 shadow-sm dark:border-blue-400/50 dark:bg-blue-500/10" : `border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm dark:border-white/10 dark:bg-neutral-950 dark:hover:border-white/20 dark:hover:bg-neutral-900/80`} ${state.border}`}
        >
            <div className="flex gap-4">
                <div className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${state.wrap}`}>
                    {state.icon}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${productReviewStatusClass(status)}`}>{productReviewStatusLabel(status)}</span>
                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${productProposalClass(item)}`}>{productProposalLabel(item)}</span>
                                <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200">Lotto {lot}</span>
                            </div>
                            <p className="line-clamp-2 text-[15px] font-bold leading-6 text-slate-900 dark:text-neutral-50">{title}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-neutral-400">
                                <span>{brand === "n.d." ? "Brand n.d." : brand}</span>
                                <span>{model === "n.d." ? "Modello n.d." : model}</span>
                                <span>{quantity}</span>
                            </div>
                        </div>
                        <div className="shrink-0 rounded-2xl bg-slate-50 px-3 py-2 text-right ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-white/10">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-neutral-500">Quantità / UM</p>
                            <p className="mt-1 text-sm font-bold text-slate-800 dark:text-neutral-100">{quantity}</p>
                        </div>
                    </div>

                    <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                        <div className={`rounded-2xl border px-3 py-2 ${candidate ? "border-emerald-100 bg-emerald-50/70 dark:border-emerald-500/25 dark:bg-emerald-500/10" : "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-neutral-900/70"}`}>
                            {candidate ? (
                                <>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-semibold text-slate-900 dark:text-neutral-50">{productCandidatePrimaryText(candidate)}</p>
                                        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200 dark:bg-white/10 dark:text-neutral-300 dark:ring-white/10">{topConfidenceNote(item)}</span>
                                        {isValidated ? <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">Utilizzato</span> : <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${productMatchBucketClass(item)}`}>{productMatchBucketLabel(item)}</span>}
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">{productCandidateMetaText(candidate)}</p>
                                    <p className="mt-1 text-xs font-medium text-slate-600 dark:text-neutral-300">{state.subtitle}</p>
                                </>
                            ) : (
                                <>
                                    <p className="font-semibold text-slate-700 dark:text-neutral-100">Nessun match trovato</p>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">Apri il dettaglio per ricerca manuale o correzione della riga.</p>
                                </>
                            )}
                        </div>
                        <div className="flex items-center justify-end">
                            <span className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-200">
                                {selected ? "Dettaglio aperto" : "Apri dettaglio"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </button>
    );
});

/**
 * Side drawer dedicated to manual catalog search.
 *
 * It remains separated from the main review list so the normal review workflow does not mount
 * candidate cards/search metadata until the buyer explicitly opens this tool.
 */
function ManualProductSearchDrawer({ open, productQuery, setProductQuery, candidates, productSearchMeta, loading, onMatchProducts, onClose }: { open: boolean; productQuery: string; setProductQuery: (value: string) => void; candidates: MepaAiProductCandidate[]; productSearchMeta: Partial<MepaProductSearchResponseData>; loading: string | null; onMatchProducts: () => void; onClose: () => void }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[1500] flex justify-end bg-slate-950/30 backdrop-blur-[1px]">
            <aside className="h-full w-full max-w-xl overflow-hidden border-l border-slate-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 dark:border-neutral-800">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">Catalogo prodotti</p>
                        <h3 className="mt-1 text-lg font-semibold">Ricerca manuale / override</h3>
                        <p className="mt-1 text-xs leading-5 text-slate-500">Usala per verifiche puntuali quando l'AI non ha trovato un candidato affidabile.</p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-neutral-800"><FiX /></button>
                </div>
                <div className="flex h-[calc(100%-88px)] flex-col overflow-hidden p-5">
                    <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                        <label className="text-xs font-semibold text-blue-800 dark:text-blue-200">Ricerca libera nel catalogo</label>
                        <FDInput value={productQuery} onChange={(e: any) => setProductQuery(e.target.value)} placeholder="Cerca codice, EAN, brand, descrizione..." size="md" radius="2xl" variant="outline" color="light" fullWidth containerClassName="mt-2" />
                        <button onClick={onMatchProducts} disabled={loading === "products"} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><FiCpu /> Cerca prodotti</button>
                        <p className="mt-2 text-xs text-blue-700/80 dark:text-blue-200/80">Provider: {providerLabel(productSearchMeta.retrievalProvider)}{productSearchMeta.searchMode ? ` · ${productSearchMeta.searchMode}` : ""}</p>
                    </div>
                    <div className="mt-4 flex-1 overflow-auto pr-1">
                        {candidates.length ? candidates.map((candidate) => <div key={`${candidate.source}-${candidate.productId}`} className="mb-2 rounded-2xl border border-slate-100 p-3 text-sm dark:border-neutral-800"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="font-semibold leading-5">{candidate.title}</p><p className="mt-0.5 text-xs text-slate-500">{candidate.brand ?? "—"} · {candidate.manufacturerCode ?? "—"} · {candidate.ean ?? "EAN n.d."}</p></div><span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">{scorePct(candidate.scores.final)}</span></div><p className="mt-2 text-xs leading-5 text-slate-500">{candidate.rationale}</p></div>) : <EmptyState text="Nessun candidato caricato." />}
                    </div>
                </div>
            </aside>
        </div>
    );
}

type ProductDetailPillTone = "slate" | "emerald" | "amber" | "rose" | "blue" | "sky";

const productDetailPillToneClass: Record<ProductDetailPillTone, string> = {
    slate: "",
    emerald: "",
    amber: "",
    rose: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
    blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200",
    sky: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200",
};

const productDetailPillToneAlias: Record<ProductDetailPillTone, "neutral" | "ok" | "warn"> = {
    slate: "neutral",
    emerald: "ok",
    amber: "warn",
    rose: "neutral",
    blue: "neutral",
    sky: "neutral",
};

/**
 * Product detail pill aligned to the same micro-interaction language used by CustomersPanel.
 *
 * Why this exists instead of large status banners:
 * - the catalog association is system-driven, therefore status/confidence are metadata;
 * - compact pills keep the drawer scannable on laptop/tablet screens;
 * - using the customer section primitive keeps radius, typography and spacing consistent with NEX.
 */
function ProductDetailPill({ children, tone = "slate" }: { children: React.ReactNode; tone?: ProductDetailPillTone }) {
    return (
        <SectionPill tone={productDetailPillToneAlias[tone]} className={productDetailPillToneClass[tone]}>
            {children}
        </SectionPill>
    );
}

/**
 * Builds a stable identity for catalog candidates so the detail panel does not show the same
 * product both as selected proposal and as alternative. Matching engines can return the same
 * candidate through bestMatches/substitutes with slightly different metadata, therefore the
 * identity intentionally checks strong ids first and falls back to normalized display text.
 */
function productCandidateIdentity(candidate: any) {
    const strongId =
        productCandidateProductDetailsId(candidate) ??
        candidate?.productId ??
        candidate?._id ??
        candidate?.id ??
        candidate?.product?._id ??
        candidate?.product?.id ??
        candidate?.catalogProductId ??
        candidate?.sku ??
        candidate?.ean ??
        candidate?.code ??
        candidate?.manufacturerCode;

    return String(strongId ?? productCandidatePrimaryText(candidate) ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}

function uniqueProductCandidates(candidates: any[], excludedCandidates: any[] = []) {
    const seen = new Set(excludedCandidates.map(productCandidateIdentity).filter(Boolean));
    const result: any[] = [];
    for (const candidate of candidates) {
        const identity = productCandidateIdentity(candidate);
        if (!identity || seen.has(identity)) continue;
        seen.add(identity);
        result.push(candidate);
    }
    return result;
}

/**
 * CustomerPanel-inspired card wrapper for every block in the product detail drawer.
 *
 * The goal is to make this drawer feel like a NEX "scheda" rather than a technical AI report:
 * title + short description + optional actions in the header, then compact SectionBlock content.
 */
function ProductSectionCard({
    title,
    description,
    children,
    rightContent,
    dotClassName = "bg-sky-500",
}: {
    title: React.ReactNode;
    description?: React.ReactNode;
    children: React.ReactNode;
    rightContent?: React.ReactNode;
    dotClassName?: string;
}) {
    return (
        <SectionContainer className="overflow-hidden bg-white/90 dark:bg-neutral-900/70">
            <SectionHeader
                title={title}
                description={description}
                rightContent={rightContent}
                dotClassName={dotClassName}
            />
            <div className="p-4 space-y-3">{children}</div>
        </SectionContainer>
    );
}

function productDisplayValue(value: unknown) {
    const normalized = String(value ?? "").trim();
    return normalized || "n.d.";
}

/**
 * Summary card for the selected tender row.
 *
 * This mirrors the customer "Anagrafica" summary: compact pills first, then a small key/value block.
 * The row is the canonical tender requirement, so the drawer no longer duplicates it elsewhere.
 */
function ProductDetailHero({ item }: { item: ExtractedItemView }) {
    const state = productRowVisualState(item);
    const candidate = getTopProductCandidate(item);
    const bucket = productMatchBucket(item);
    const confidenceScore = candidate ? Number(candidate?.scores?.final ?? 0) : null;
    const statusTone: ProductDetailPillTone = bucket === "READY" ? "emerald" : bucket === "BUYER_REVIEW" ? "amber" : "rose";
    const quantity = item.quantity != null ? `${item.quantity} ${String(item.unit ?? "PZ").toUpperCase()}` : "n.d.";
    const lot = productDisplayValue(item.match?.lot ?? item.match?.groupName);
    const brand = productDisplayValue(item.match?.technicalAttributes?.brand ?? item.match?.brand);
    const model = productDisplayValue(item.match?.technicalAttributes?.model ?? item.match?.model);

    return (
        <ProductSectionCard
            title="Riga gara"
            description="Dati estratti dai documenti e usati come base per l'associazione automatica catalogo."
            dotClassName="bg-blue-500"
            rightContent={
                <div className="hidden shrink-0 flex-wrap justify-end gap-2 sm:flex">
                    <ProductDetailPill tone={statusTone}>{state.title}</ProductDetailPill>
                    {confidenceScore != null ? <ProductDetailPill tone="blue">confidenza: {scorePct(confidenceScore)}</ProductDetailPill> : null}
                </div>
            }
        >
            <div className="flex flex-wrap items-center gap-2 sm:hidden">
                <ProductDetailPill tone={statusTone}>{state.title}</ProductDetailPill>
                {confidenceScore != null ? <ProductDetailPill tone="blue">confidenza: {scorePct(confidenceScore)}</ProductDetailPill> : null}
            </div>

            <SectionBlock contentClassName="space-y-2">
                <SectionKeyValue k="Descrizione" v={extractedItemTitle(item)} />
                <SectionKeyValue k="Lotto" v={lot} />
                <SectionKeyValue k="Quantità / UM" v={quantity} />
                <SectionKeyValue k="Brand" v={brand} />
                <SectionKeyValue k="Modello" v={model} />
            </SectionBlock>
        </ProductSectionCard>
    );
}

/**
 * Catalog proposal card.
 *
 * The previous version split proposal, reasons and checks into separated boxes. This version keeps
 * them in one customer-style card because they are one business object: the proposed catalog match.
 */
function ProductRecommendationPanel({
    candidate,
    itemId,
    kind,
    onValidateProductMatch,
    onOpenProductDetails,
}: {
    candidate: any;
    itemId: string;
    kind: "best" | "substitute";
    onValidateProductMatch?: (params: any) => void;
    onOpenProductDetails?: (candidate: any) => void;
}) {
    const ref = productCandidateRef(candidate);
    const checks = productCheckNotes(candidate).slice(0, 4);
    const matchReasons = Array.isArray(candidate?.matchReasons) ? candidate.matchReasons.slice(0, 4) : [];
    const score = Number(candidate?.scores?.final ?? 0);
    const productDetailsId = productCandidateProductDetailsId(candidate);

    return (
        <ProductSectionCard
            title="Proposta catalogo"
            description="Prodotto associato automaticamente prima del passaggio al flusso Quotazioni."
            dotClassName="bg-emerald-500"
            rightContent={
                onValidateProductMatch ? (
                    <SectionActionButton
                        onClick={() =>
                            onValidateProductMatch({
                                itemId,
                                action: kind === "best" ? "VALIDATE_BEST_MATCH" : "VALIDATE_SUBSTITUTE",
                                selectedCandidateRef: ref,
                                reason: kind === "best" ? "Prodotto consigliato validato da UI" : "Prodotto sostitutivo selezionato come prodotto corretto",
                            })
                        }
                    >
                        <span>{kind === "best" ? "Usa proposta" : "Usa sostituto"}</span>
                    </SectionActionButton>
                ) : null
            }
        >
            <div className="flex flex-wrap items-center gap-2">
                <ProductDetailPill tone={kind === "best" ? "emerald" : "sky"}>{productRecommendationLabel(candidate, kind)}</ProductDetailPill>
                <ProductDetailPill tone="slate">{confidenceLabel(candidate)}</ProductDetailPill>
                <ProductDetailPill tone="blue">{scorePct(score)}</ProductDetailPill>
                <ProductDetailPill tone="emerald">{quotationUsabilityLabel(candidate)}</ProductDetailPill>
            </div>

            <SectionBlock contentClassName="space-y-2">
                <SectionKeyValue k="Prodotto" v={productCandidatePrimaryText(candidate)} />
                <SectionKeyValue k="Dettagli" v={productCandidateMetaText(candidate)} />
                <SectionKeyValue k="Riferimento" v={ref || "n.d."} />
            </SectionBlock>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <SectionBlock title="perché è stato scelto" className="bg-white/70 dark:bg-neutral-900/40">
                    <div className="space-y-2 text-[11px] leading-5 text-neutral-700 dark:text-neutral-300">
                        {matchReasons.length
                            ? matchReasons.map((reason: any, index: number) => <p key={index}>• {String(reason)}</p>)
                            : <p>{candidate?.rationale ?? "Il sistema ha selezionato il candidato con la migliore compatibilità disponibile."}</p>}
                    </div>
                </SectionBlock>

                <SectionBlock title="controlli automatici" className="bg-white/70 dark:bg-neutral-900/40">
                    <div className="space-y-2 text-[11px] leading-5 text-neutral-700 dark:text-neutral-300">
                        {checks.length
                            ? checks.map((note, index) => <p key={index}>• {String(note)}</p>)
                            : <p>Nessuna anomalia automatica rilevata dagli agenti.</p>}
                    </div>
                </SectionBlock>
            </div>

            {productDetailsId && onOpenProductDetails ? (
                <div className="flex justify-end">
                    <SectionActionButton onClick={() => onOpenProductDetails(candidate)}>
                        <span>Apri scheda prodotto</span>
                    </SectionActionButton>
                </div>
            ) : null}
        </ProductSectionCard>
    );
}

/**
 * Returns the chunk id used by the global EvidenceViewer.
 * Product evidence payloads have evolved over time, so the UI accepts the most common aliases.
 */
function productEvidenceChunkId(ref: any) {
    const sourceChunkIds = Array.isArray(ref?.sourceChunkIds) ? ref.sourceChunkIds : [];
    return String(ref?.chunkId ?? ref?.sourceChunkId ?? sourceChunkIds[0] ?? ref?.id ?? "").trim();
}

/**
 * Builds a buyer-readable label for a source without exposing raw chunk ids as the main content.
 * Chunk ids remain only in the click target internals because the useful UX is opening the evidence,
 * not asking the user to interpret technical identifiers.
 */
function productEvidenceLabel(ref: any, index: number) {
    const documentName = String(ref?.documentName ?? ref?.documentTitle ?? ref?.fileName ?? ref?.sourceDocumentName ?? "Documento gara").trim();
    const page = ref?.page ?? ref?.pageNumber ?? ref?.pages?.[0];
    const pageLabel = page ? ` · pag. ${page}` : "";
    return `${documentName || `Fonte ${index + 1}`}${pageLabel}`;
}

/**
 * Source list used in the product detail drawer.
 * It dispatches the same global evidence event used by Dossier/Validation cards, keeping this
 * product UI decoupled from modal state while making sources actionable for business users.
 */
function ProductEvidenceSources({ evidenceRefs }: { evidenceRefs: Array<Record<string, any>> }) {
    if (!Array.isArray(evidenceRefs) || !evidenceRefs.length) {
        return <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Nessuna evidenza documentale disponibile.</p>;
    }

    return (
        <div className="space-y-2">
            {evidenceRefs.slice(0, 5).map((ref: any, index: number) => {
                const chunkId = productEvidenceChunkId(ref);
                const label = productEvidenceLabel(ref, index);
                const sourceType = String(ref?.sourceType ?? ref?.kind ?? "evidenza").trim();
                const content = (
                    <>
                        <span className="min-w-0 flex-1 text-left">
                            <span className="block truncate text-[11px] font-semibold text-neutral-900 dark:text-neutral-100">Fonte {index + 1}</span>
                            <span className="block truncate text-[10px] text-neutral-500 dark:text-neutral-400">{label}</span>
                        </span>
                        <SectionPill>{sourceType || "evidenza"}</SectionPill>
                    </>
                );

                if (!chunkId) {
                    return (
                        <div key={`${label}-${index}`} className="flex items-center gap-3 rounded-xl border border-neutral-200/70 bg-neutral-50/60 p-3 dark:border-neutral-800/70 dark:bg-neutral-900/40">
                            {content}
                        </div>
                    );
                }

                return (
                    <button
                        key={`${chunkId}-${index}`}
                        type="button"
                        onClick={() => window.dispatchEvent(new CustomEvent("nex:mepa:evidence:open", { detail: { chunkId } }))}
                        className="flex w-full items-center gap-3 rounded-xl border border-neutral-200/70 bg-neutral-50/60 p-3 text-left transition hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-sky-300 dark:border-neutral-800/70 dark:bg-neutral-900/40 dark:hover:bg-neutral-900"
                        title="Apri evidenza documentale"
                    >
                        {content}
                    </button>
                );
            })}
        </div>
    );
}

/**
 * Detailed business summary for one extracted tender row.
 *
 * Layout principle: same order as CustomersPanel summary.
 * 1) row identity/summary;
 * 2) catalog proposal;
 * 3) normalized/technical data;
 * 4) sources;
 * 5) alternatives.
 */
function ExtractedItemCard({
    item,
    onValidate,
    onValidateProductMatch,
    onEdit,
    onOpenProductDetails,
    hideInlineActions = false,
}: {
    item: ExtractedItemView;
    onValidate?: (params: any) => void;
    onValidateProductMatch?: (params: any) => void;
    onEdit?: () => void;
    onOpenProductDetails?: (candidate: any) => void;
    hideInlineActions?: boolean;
}) {
    const itemId = String(item._id ?? extractedItemId(item));
    const evidenceRefs = getItemEvidenceRefs(item);
    const technicalAttributes = item.match?.technicalAttributes && typeof item.match.technicalAttributes === "object" ? item.match.technicalAttributes : {};
    const topCandidate = getTopProductCandidate(item);
    const best = getItemBestMatches(item);
    const substitutes = getItemSubstitutes(item);
    const selectedProduct = item.match?.selectedProduct && typeof item.match.selectedProduct === "object" ? item.match.selectedProduct : null;
    const recommendationKind = selectedProduct ? "manual" : best.length > 0 ? "best" : substitutes.length > 0 ? "substitute" : "none";
    const primaryCandidate = selectedProduct ?? topCandidate;
    const visibleTechnicalAttributes = orderedProductAttributes(technicalAttributes).slice(0, 6);
    const alternatives = uniqueProductCandidates(selectedProduct ? [...best, ...substitutes] : substitutes, [primaryCandidate, selectedProduct, topCandidate].filter(Boolean));

    return (
        <div className="space-y-3">
            <ProductDetailHero item={item} />

            {primaryCandidate && recommendationKind !== "none" ? (
                <ProductRecommendationPanel
                    candidate={primaryCandidate}
                    itemId={itemId}
                    kind={recommendationKind === "substitute" ? "substitute" : "best"}
                    onValidateProductMatch={onValidateProductMatch}
                    onOpenProductDetails={onOpenProductDetails}
                />
            ) : (
                <ProductSectionCard title="Proposta catalogo" description="Nessuna associazione automatica disponibile." dotClassName="bg-rose-500">
                    <SectionBlock>
                        <p className="text-[11px] font-semibold text-neutral-900 dark:text-neutral-100">Nessun prodotto consigliato disponibile</p>
                        <p className="mt-1 text-[11px] leading-5 text-neutral-500 dark:text-neutral-400">
                            Gli agenti non hanno prodotto una proposta catalogo sufficientemente affidabile. Procedi con ricerca manuale o correzione della riga estratta.
                        </p>
                    </SectionBlock>
                </ProductSectionCard>
            )}

            <ProductSectionCard
                title="Dati estratti e normalizzati"
                description="Campi tecnici prodotti dal processo di estrazione e matching."
                dotClassName="bg-slate-400"
                rightContent={
                    onEdit ? (
                        <SectionActionButton onClick={onEdit}>
                            <span>Correggi dati</span>
                        </SectionActionButton>
                    ) : null
                }
            >
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <SectionBlock className="bg-white/70 dark:bg-neutral-900/40" contentClassName="space-y-2">
                        <SectionKeyValue k="Decisione estrazione" v={String(item.match?.decisionReasonCode ?? item.match?.decisionReason ?? "n.d.")} />
                        <SectionKeyValue k="Equivalenza ammessa" v={String(item.match?.equivalenceAllowed ?? "n.d.")} />
                        <SectionKeyValue k="Modello esatto" v={String(item.match?.exactModelRequired ?? "n.d.")} />
                        <SectionKeyValue k="Source line" v={String(item.match?.sourceLineId ?? item.match?.lineId ?? "n.d.")} />
                    </SectionBlock>

                    <SectionBlock title="attributi tecnici" className="bg-white/70 dark:bg-neutral-900/40" contentClassName="space-y-2">
                        {visibleTechnicalAttributes.length > 0 ? (
                            visibleTechnicalAttributes.map(([key, value]) => (
                                <SectionKeyValue key={key} k={humanizeProductAttributeKey(key)} v={formatProductAttributeValue(key, value)} />
                            ))
                        ) : (
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Nessun attributo tecnico disponibile.</p>
                        )}
                    </SectionBlock>
                </div>
            </ProductSectionCard>

            <ProductSectionCard title="Fonti e tracciabilità" description="Apri l'evidenza documentale collegata alla riga." dotClassName="bg-blue-500">
                <ProductEvidenceSources evidenceRefs={evidenceRefs as Array<Record<string, any>>} />
            </ProductSectionCard>

            {alternatives.length > 0 ? (
                <ProductSectionCard title={`Prodotti alternativi (${alternatives.length})`} description="Candidati secondari deduplicati rispetto alla proposta principale." dotClassName="bg-sky-500">
                    <div className="space-y-2">
                        {alternatives.slice(0, 3).map((candidate: any, index: number) => (
                            <SectionBlock key={`${productCandidateRef(candidate)}-${index}`} className="bg-white/70 dark:bg-neutral-900/40">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <ProductDetailPill tone="sky">Alternativa</ProductDetailPill>
                                            <ProductDetailPill tone="slate">{confidenceLabel(candidate)}</ProductDetailPill>
                                            <ProductDetailPill tone="blue">{scorePct(Number(candidate?.scores?.final ?? 0))}</ProductDetailPill>
                                        </div>
                                        <p className="mt-2 text-[13px] font-semibold leading-5 text-neutral-900 dark:text-neutral-100">{productCandidatePrimaryText(candidate)}</p>
                                        <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">{productCandidateMetaText(candidate)}</p>
                                    </div>
                                    <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                                        {productCandidateProductDetailsId(candidate) && onOpenProductDetails ? (
                                            <SectionActionButton onClick={() => onOpenProductDetails(candidate)}>
                                                <span>Scheda</span>
                                            </SectionActionButton>
                                        ) : null}
                                        {onValidateProductMatch ? (
                                            <SectionActionButton
                                                onClick={() =>
                                                    onValidateProductMatch({
                                                        itemId,
                                                        action: "VALIDATE_SUBSTITUTE",
                                                        selectedCandidateRef: productCandidateRef(candidate),
                                                        reason: "Prodotto alternativo selezionato manualmente",
                                                    })
                                                }
                                            >
                                                <span>Usa alternativa</span>
                                            </SectionActionButton>
                                        ) : null}
                                    </div>
                                </div>
                            </SectionBlock>
                        ))}
                    </div>
                </ProductSectionCard>
            ) : null}

            {!hideInlineActions ? (
                <ProductSectionCard title="Azioni operative" description="Le validazioni alimentano il successivo flusso Quotazioni." dotClassName="bg-emerald-500">
                    <div className="flex flex-wrap gap-2">
                        <SectionActionButton onClick={() => onEdit?.()}><span>Correggi</span></SectionActionButton>
                        <SectionActionButton onClick={() => onValidate?.({ targetType: "EXTRACTED_ITEM", targetId: itemId, decision: "VALIDATED" })}><span>Valida</span></SectionActionButton>
                        <SectionActionButton onClick={() => onValidate?.({ targetType: "EXTRACTED_ITEM", targetId: itemId, decision: "NEEDS_REVIEW" })}><span>Segna anomalia</span></SectionActionButton>
                        <SectionActionButton onClick={() => onValidate?.({ targetType: "EXTRACTED_ITEM", targetId: itemId, decision: "REJECTED" })}><span>Rigetta</span></SectionActionButton>
                    </div>
                </ProductSectionCard>
            ) : null}
        </div>
    );
}

/**
 * Right side panel used for the selected extracted item.
 *
 * The panel is intentionally controlled by ProductsTab state instead of global route state because
 * selection is local, transient and should reset naturally when filters/tender data change.
 */
function ProductDetailSidePanel({
    open,
    item,
    onClose,
    onValidate,
    onValidateProductMatch,
    onEdit,
    onOpenProductDetails,
}: {
    open: boolean;
    item: ExtractedItemView | null;
    onClose: () => void;
    onValidate?: (params: any) => void;
    onValidateProductMatch?: (params: any) => void;
    onEdit?: (item: ExtractedItemView) => void;
    onOpenProductDetails?: (candidate: any) => void;
}) {
    const footer = item ? (
        <div className="flex flex-col gap-3 border-t border-neutral-200/70 bg-white/95 p-3 backdrop-blur dark:border-neutral-800/70 dark:bg-neutral-950/95 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] leading-5 text-neutral-500 dark:text-neutral-400">
                Azioni operative sulla riga selezionata. I prodotti validati confluiscono nel successivo flusso quotazioni.
            </p>
            <div className="flex shrink-0 flex-wrap gap-2">
                <button type="button" onClick={() => onEdit?.(item)} className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">Correggi</button>
                <button type="button" onClick={() => onValidate?.({ targetType: "EXTRACTED_ITEM", targetId: String(item._id ?? extractedItemId(item)), decision: "VALIDATED" })} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">Valida</button>
                <button type="button" onClick={() => onValidate?.({ targetType: "EXTRACTED_ITEM", targetId: String(item._id ?? extractedItemId(item)), decision: "NEEDS_REVIEW" })} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-700 shadow-sm transition hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">Segna anomalia</button>
                <button type="button" onClick={() => onValidate?.({ targetType: "EXTRACTED_ITEM", targetId: String(item._id ?? extractedItemId(item)), decision: "REJECTED" })} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">Rigetta</button>
            </div>
        </div>
    ) : null;

    return (
        <AnimatePresence>
            {open && item ? (
                <>
                    <FDBackdrop onClick={onClose} />
                    <div className="fixed inset-0 z-20 flex justify-end pointer-events-none" aria-modal="true" role="dialog">
                        <div className="relative ml-auto h-full w-full max-w-xl pointer-events-auto lg:max-w-2xl 2xl:max-w-3xl">
                            <SidePanelShell
                                title="Dettaglio riga e proposta catalogo"
                                onClose={onClose}
                                footer={footer}
                            >
                                <div className="space-y-3">
                                    <ExtractedItemCard
                                        item={item}
                                        onValidate={onValidate}
                                        onValidateProductMatch={onValidateProductMatch}
                                        onEdit={() => onEdit?.(item)}
                                        onOpenProductDetails={onOpenProductDetails}
                                        hideInlineActions
                                    />
                                </div>
                            </SidePanelShell>
                        </div>
                    </div>
                </>
            ) : null}
        </AnimatePresence>
    );
}


/**
 * Extracts only primitive diagnostic fields from potentially large AI payloads.
 *
 * This prevents expensive JSON.stringify calls in normal render paths and keeps diagnostics safe
 * for browsers with limited memory or narrow screens.
 */
function collectPrimitiveDiagnostics(label: string, payload: any) {
    if (!payload || typeof payload !== "object") return [];
    return Object.entries(payload)
        .filter(([, value]) => ["string", "number", "boolean"].includes(typeof value) || value == null)
        .slice(0, 8)
        .map(([key, value]) => ({ label: `${label}.${key}`, value: value == null ? "n.d." : String(value) }));
}

/**
 * Compact, render-safe diagnostics for product AI actions.
 *
 * The previous implementation rendered raw JSON payloads in the UI. That is
 * useful while debugging, but large agent responses can create heavy strings,
 * slow reconciliation and poor mobile readability. This component exposes the
 * operational signals that matter to the buyer/IT workflow without forcing the
 * browser to stringify potentially large nested payloads on every render.
 */
const ProductDiagnosticsSummary = React.memo(function ProductDiagnosticsSummary({
    productBatchResult,
    productAgentsPipelineResult,
}: {
    productBatchResult?: MepaProductMatchingBatchResult | null;
    productAgentsPipelineResult?: MepaProductAgentsPipelineResult | null;
}) {
    // Memoized diagnostics projection: only recompute when backend result references change.
    const rows = useMemo(() => [
        ...collectPrimitiveDiagnostics("matching", productBatchResult),
        ...collectPrimitiveDiagnostics("pipeline", productAgentsPipelineResult),
    ], [productBatchResult, productAgentsPipelineResult]);

    if (!rows.length) return null;

    return (
        <div className="mt-4 grid grid-cols-1 gap-2 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600 dark:bg-neutral-950 dark:text-neutral-300 sm:grid-cols-2 xl:grid-cols-4">
            {rows.map((row) => (
                <div key={row.label} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900">
                    <p className="font-bold uppercase tracking-[0.12em] text-slate-400">{row.label}</p>
                    <p className="mt-1 break-words font-semibold text-slate-700 dark:text-neutral-100">{row.value}</p>
                </div>
            ))}
        </div>
    );
});

/**
 * Main products workspace tab.
 *
 * State ownership model:
 * - Controller props: persistent read models and mutations (items, candidates, matching results).
 * - Local useState: temporary UI state only (filters, selected row, drawers, diagnostics).
 * - useMemo/useDeferredValue: derived views for large lists, designed to keep typing/filtering fluid.
 */
export const ProductsTab = React.memo(function ProductsTab(props: {
    extractedItems: ExtractedItemView[];
    productQuery: string;
    setProductQuery: (value: string) => void;
    candidates: MepaAiProductCandidate[];
    productSearchMeta: Partial<MepaProductSearchResponseData>;
    productBatchResult?: MepaProductMatchingBatchResult | null;
    productAgentsPipelineResult?: MepaProductAgentsPipelineResult | null;
    onMatchProducts: () => void;
    onRunProductMatchingBatch?: () => void;
    onRunProductAgentsPipeline?: () => void;
    onLoadProducts: () => void;
    onValidate?: (params: any) => void;
    onUpdateItem?: (itemId: string, patch: Record<string, unknown>) => Promise<void> | void;
    onCreateManualItem?: (item: Record<string, unknown>) => Promise<void> | void;
    onValidateProductMatch?: (params: { itemId: string; action: "VALIDATE_BEST_MATCH" | "VALIDATE_SUBSTITUTE" | "REJECT" | "NEEDS_REVIEW" | "MANUAL_OVERRIDE"; selectedCandidateRef?: string | null; manualProduct?: Record<string, unknown> | null; reason?: string | null }) => Promise<void> | void;
    loading: string | null;
}) {
    const { extractedItems, candidates, productSearchMeta } = props;

    // UI-only filters. They never mutate backend state; they only change the local read model projection.
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [matchFilter, setMatchFilter] = useState("ALL");
    const [lotFilter, setLotFilter] = useState("ALL");
    // Free-text search is deferred below to avoid blocking keystrokes when many rows are present.
    const [search, setSearch] = useState("");
    // Selected row id drives the side panel and is auto-repaired when filters hide the previous row.
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    // Detail panel is local workspace state: it should not survive a natural remount/change of tender.
    const [detailPanelOpen, setDetailPanelOpen] = useState(false);
    // ProductDetailsReporting is loaded only when a concrete catalog product id is available.
    const [selectedProductDetailsId, setSelectedProductDetailsId] = useState<string | null>(null);
    // Runtime ref, not state: aborting an in-flight product-details request must not trigger a render.
    const productDetailsAbortController = useRef<AbortController | null>(null);
    // Modal state for controlled edit/create flows. Null means the dialog is fully unmounted.
    const [editingItem, setEditingItem] = useState<ExtractedItemView | null>(null);
    // Manual create/search drawers are opt-in tools; keeping them closed avoids mounting heavy UI by default.
    const [manualCreateOpen, setManualCreateOpen] = useState(false);
    // Manual search is separate from create: search validates against catalog, create adds a missing tender row.
    const [manualSearchOpen, setManualSearchOpen] = useState(false);
    // Diagnostics are hidden by default because they are useful for IT/debug but secondary for buyers.
    const [showDiagnostics, setShowDiagnostics] = useState(false);
    // Progressive render window. Prevents large tenders from mounting every row at once.
    const [visibleLimit, setVisibleLimit] = useState(PRODUCT_ROWS_INITIAL_LIMIT);
    // React 18 scheduling: keeps input responsive while the expensive filtered list catches up.
    const deferredSearch = useDeferredValue(search);

    // Derived filter options are memoized because they scan all extracted rows.
    const lots = useMemo(() => getProductLots(extractedItems), [extractedItems]);
    const statusOptions = useMemo(() => [
        { value: "ALL", label: "Tutti" },
        { value: "PENDING_REVIEW", label: "Da lavorare" },
        { value: "VALIDATED", label: "Validate" },
        { value: "CORRECTED", label: "Corrette" },
        { value: "REJECTED", label: "Escluse" },
    ], []);
    const matchOptions = useMemo(() => [
        { value: "ALL", label: "Tutti" },
        { value: "READY", label: "Prodotto trovato" },
        { value: "BUYER_REVIEW", label: "Associazione proposta" },
        { value: "NO_MATCH", label: "Senza match" },
        { value: "MANUAL", label: "Validati" },
    ], []);
    // Lot options depend on current items; priority is currently fixed but kept as memoized config for future extension.
    const lotOptions = useMemo(() => [{ value: "ALL", label: "Tutti" }, ...lots.map((lot) => ({ value: lot, label: lot }))], [lots]);
    const priorityOptions = useMemo(() => [{ value: "ALL", label: "Tutte" }], []);

    // KPI counters are derived from the controller read model and recalculated only when items change.
    const stats = useMemo(() => getProductReviewStats(extractedItems), [extractedItems]);

    // Main projected list: all status/match/lot/search filtering lives here, away from JSX.
    const filteredItems = useMemo(() => filterProductReviewItems(extractedItems, {
        statusFilter,
        matchFilter,
        lotFilter,
        search: deferredSearch,
    }), [extractedItems, deferredSearch, statusFilter, matchFilter, lotFilter]);

    // Reset progressive rendering when the user changes the result set; otherwise a previous large limit
    // could keep rendering too many rows after narrowing filters on mobile/low-power devices.
    useEffect(() => {
        setVisibleLimit(PRODUCT_ROWS_INITIAL_LIMIT);
    }, [deferredSearch, extractedItems.length, lotFilter, matchFilter, statusFilter]);

    // Only visible rows receive row ids and are mounted. This is lighter than mapping the whole dataset.
    const visibleRows = useMemo(() => filteredItems
        .slice(0, visibleLimit)
        .map((item, index) => ({ item, rowId: extractedItemId(item, index) })), [filteredItems, visibleLimit]);

    // Controls the progressive "show more" CTA without forcing virtualization dependency in this phase.
    const hasMoreRows = visibleRows.length < filteredItems.length;

    // Selection self-healing: if filters remove the selected row, move to the first visible row.
    useEffect(() => {
        if (!visibleRows.length) {
            setSelectedItemId(null);
            return;
        }
        if (!selectedItemId || !visibleRows.some((row) => row.rowId === selectedItemId)) {
            setSelectedItemId(visibleRows[0].rowId);
        }
    }, [visibleRows, selectedItemId]);

    // Selected item is derived from visibleRows, never duplicated in state, avoiding stale object references.
    const selectedItem = useMemo(() => visibleRows.find((row) => row.rowId === selectedItemId)?.item ?? visibleRows[0]?.item ?? null, [visibleRows, selectedItemId]);

    // Stable callback passed to memoized row cards.
    const handleSelectProductRow = useCallback((rowId: string) => {
        setSelectedItemId(rowId);
        setDetailPanelOpen(true);
    }, []);

    // Opens the full catalog product sheet only after validating that a product id exists.
    const openProductDetailsSheet = useCallback((candidate: any) => {
        const productId = productCandidateProductDetailsId(candidate);
        if (!productId) {
            enqueueSnackbar("Scheda prodotto non disponibile: identificativo prodotto mancante.", { variant: "warning" });
            return;
        }
        setSelectedProductDetailsId(productId);
    }, []);

    // Closing the product sheet also aborts any in-flight details request to avoid stale updates.
    const closeProductDetailsSheet = useCallback(() => {
        productDetailsAbortController.current?.abort();
        productDetailsAbortController.current = null;
        setSelectedProductDetailsId(null);
    }, []);

    return (
        <div className="space-y-5">
            <Panel title="Revisione prodotti gara" icon={<FiCpu className="text-emerald-500" />} className="dark:border-white/10 dark:bg-neutral-950/70">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="max-w-4xl">
                            <p className="text-sm leading-6 text-slate-600 dark:text-neutral-400">
                                Analizza le righe estratte dai documenti, verifica se esiste un prodotto consigliato e valida solo gli elementi realmente utilizzabili per la futura quotazione.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 xl:justify-end">
                            <button onClick={props.onLoadProducts} disabled={props.loading === "items"} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-900"><FiRefreshCw /> Aggiorna righe</button>
                            <button onClick={() => setManualSearchOpen(true)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-900"><FiSearch /> Ricerca manuale</button>
                            <button onClick={() => setManualCreateOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm"><FiPlus /> Aggiungi riga</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
                        <ProductReviewKpi label="Righe estratte" value={String(stats.total)} note={lots.length ? `${lots.length} lotti` : undefined} />
                        <ProductReviewKpi label="Prodotto consigliato trovato" value={String(stats.ready)} note={stats.total ? scorePct(stats.ready / stats.total) : undefined} tone="emerald" />
                        <ProductReviewKpi label="Proposte da confermare" value={String(stats.buyerReview)} note={stats.total ? scorePct(stats.buyerReview / stats.total) : undefined} tone="amber" />
                        <ProductReviewKpi label="Senza match" value={String(stats.noMatch)} note={stats.total ? scorePct(stats.noMatch / stats.total) : undefined} tone="red" />
                        <ProductReviewKpi label="Validate" value={String(stats.validated)} note={stats.total ? scorePct(stats.validated / stats.total) : undefined} tone="blue" />
                        <ProductReviewKpi label="Corrette" value={String(stats.corrected)} note={stats.total ? scorePct(stats.corrected / stats.total) : undefined} tone="violet" />
                    </div>

                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_140px_180px_140px_140px_auto]">
                        <FDInput value={search} onChange={(event: any) => setSearch(event.target.value)} placeholder="Cerca per descrizione, brand, modello, lotto..." size="md" radius="2xl" variant="outline" color="light" fullWidth leftIcon={<FiSearch className="text-slate-400" />} />
                        <FDSelect options={statusOptions} value={statusFilter} size="md" radius="2xl" fullWidth color="light" onChange={(value) => setStatusFilter(singleSelectValue(value))} />
                        <FDSelect options={matchOptions} value={matchFilter} size="md" radius="2xl" fullWidth color="light" onChange={(value) => setMatchFilter(singleSelectValue(value))} />
                        <FDSelect options={lotOptions} value={lotFilter} size="md" radius="2xl" fullWidth color="light" onChange={(value) => setLotFilter(singleSelectValue(value))} />
                        <FDSelect options={priorityOptions} value="ALL" size="md" radius="2xl" fullWidth color="light" onChange={() => undefined} />
                        <button type="button" onClick={() => setShowDiagnostics((value) => !value)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-900"><FiTarget /> Azioni AI</button>
                    </div>
                </div>
            </Panel>

            {showDiagnostics ? (
                <Panel title="Azioni AI e diagnostica" icon={<FiTarget className="text-violet-500" />}>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={props.onRunProductMatchingBatch} disabled={props.loading === "product-batch" || !stats.total} className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Rigenera matching</button>
                        <button onClick={props.onRunProductAgentsPipeline} disabled={props.loading === "product-pipeline" || !stats.total} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50">Rilancia pipeline prodotti</button>
                    </div>
                    <ProductDiagnosticsSummary
                        productBatchResult={props.productBatchResult}
                        productAgentsPipelineResult={props.productAgentsPipelineResult}
                    />
                </Panel>
            ) : null}

            <Panel title={`Righe estratte (${filteredItems.length})`} icon={<FiFileText className="text-blue-500" />} className="dark:border-white/10 dark:bg-neutral-950/70">
                <div className="space-y-3">
                    {visibleRows.length ? visibleRows.map(({ item, rowId }) => (
                        <ProductReviewRow
                            key={rowId}
                            item={item}
                            rowId={rowId}
                            selected={rowId === selectedItemId}
                            onSelect={handleSelectProductRow}
                        />
                    )) : <EmptyState text="Nessuna riga estratta trovata con i filtri correnti." />}
                    {hasMoreRows ? (
                        <div className="flex flex-col items-center justify-between gap-3 rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-center sm:flex-row sm:text-left dark:border-neutral-800 dark:bg-neutral-950/70">
                            <p className="text-sm text-slate-500 dark:text-neutral-400">
                                Mostrate {visibleRows.length} righe su {filteredItems.length}. Il rendering progressivo protegge mobile e notebook aziendali da liste molto ampie.
                            </p>
                            <button
                                type="button"
                                onClick={() => setVisibleLimit((current) => current + PRODUCT_ROWS_INCREMENT)}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 sm:w-auto dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
                            >
                                Mostra altre {Math.min(PRODUCT_ROWS_INCREMENT, filteredItems.length - visibleRows.length)} righe
                            </button>
                        </div>
                    ) : null}
                </div>
            </Panel>

            <ProductDetailSidePanel
                open={detailPanelOpen}
                item={selectedItem}
                onClose={() => setDetailPanelOpen(false)}
                onValidate={props.onValidate}
                onValidateProductMatch={props.onValidateProductMatch}
                onEdit={(item) => setEditingItem(item)}
                onOpenProductDetails={openProductDetailsSheet}
            />

            <AnimatePresence>
                {selectedProductDetailsId ? (
                    <div className="fixed inset-0 z-[1700] flex justify-end bg-slate-950/30 backdrop-blur-[1px]" aria-modal="true" role="dialog">
                        <div className="h-full w-full max-w-[min(1320px,96vw)]">
                            <ProductDetailsReporting
                                productId={selectedProductDetailsId}
                                onClose={closeProductDetailsSheet}
                                abortController={productDetailsAbortController}
                            />
                        </div>
                    </div>
                ) : null}
            </AnimatePresence>

            <ManualProductSearchDrawer open={manualSearchOpen} productQuery={props.productQuery} setProductQuery={props.setProductQuery} candidates={candidates} productSearchMeta={productSearchMeta} loading={props.loading} onMatchProducts={props.onMatchProducts} onClose={() => setManualSearchOpen(false)} />
            {editingItem && (
                <EditExtractedItemDialog item={editingItem} onClose={() => setEditingItem(null)} onSave={async (patch) => {
                    if (editingItem._id && props.onUpdateItem) {
                        await props.onUpdateItem(String(editingItem._id), patch);
                    }
                    setEditingItem(null);
                }} />
            )}
            {manualCreateOpen && (
                <CreateExtractedItemDialog onClose={() => setManualCreateOpen(false)} onCreate={async (payload) => {
                    if (props.onCreateManualItem) await props.onCreateManualItem(payload);
                    setManualCreateOpen(false);
                }} />
            )}
        </div>
    );
}
);

/** Opens the edit dialog for an existing extracted row. */
function EditExtractedItemDialog({ item, onSave, onClose }: { item: ExtractedItemView; onSave: (patch: Record<string, unknown>) => Promise<void> | void; onClose: () => void }) {
    return <ExtractedItemEditor item={item} mode="edit" onSave={onSave} onClose={onClose} />;
}

/** Opens the create dialog for a manual extracted row when AI/parser missed a requirement. */
function CreateExtractedItemDialog({ onCreate, onClose }: { onCreate: (payload: Record<string, unknown>) => Promise<void> | void; onClose: () => void }) {
    return <ExtractedItemEditor item={{}} mode="create" onSave={onCreate} onClose={onClose} />;
}

/**
 * Shared editor for create/edit extracted row flows.
 *
 * Each useState mirrors a single form control. Keeping form state local avoids polluting the global
 * MEPA workspace controller with half-edited values and allows the dialog to be discarded safely.
 */
function ExtractedItemEditor({ item, mode = "edit", onSave, onClose }: { item: ExtractedItemView; mode?: "edit" | "create"; onSave: (patch: Record<string, unknown>) => Promise<void> | void; onClose: () => void }) {
    // Normalized description is the buyer-facing text used for matching and future quotation.
    const [description, setDescription] = useState(item.normalizedDescription || item.originalDescription || "");
    // Original description preserves the document evidence and should remain available for audit.
    const [originalDescription, setOriginalDescription] = useState(item.originalDescription || "");
    // Quantity is kept as string while editing so partial numeric input does not get lost.
    const [quantity, setQuantity] = useState(item.quantity != null ? String(item.quantity) : "");
    // Unit defaults to pieces but remains editable for service/material lines.
    const [unit, setUnit] = useState(item.unit || "pz");
    // Lot/category metadata helps grouping validation without requiring immediate catalog match.
    const [lot, setLot] = useState(String(item.match?.lot ?? ""));
    // Category hint guides catalog matching when brand/model alone is not enough.
    const [categoryHint, setCategoryHint] = useState(String(item.match?.categoryHint ?? ""));
    // Certifications are edited as comma-separated text for speed, then normalized on save.
    const [certifications, setCertifications] = useState(Array.isArray(item.match?.certifications) ? item.match.certifications.join(", ") : "");
    // Notes capture operator/AI context that does not belong to structured matching attributes.
    const [notes, setNotes] = useState(String(item.match?.notes ?? ""));
    // Exclusion is explicit governance: the row remains auditable but should not feed quotation.
    const [exclude, setExclude] = useState(Boolean(item.match?.excludeFromQuotation));

    const submit = async () => {
        await onSave({
            originalDescription: originalDescription || description,
            normalizedDescription: description,
            quantity: quantity.trim() ? Number(quantity) : null,
            unit,
            lot,
            categoryHint,
            certifications: certifications.split(",").map((value) => value.trim()).filter(Boolean),
            notes,
            excludeFromQuotation: exclude,
        });
    };

    return (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-[1px]">
            <div className="w-full max-w-2xl rounded-[28px] bg-white p-5 shadow-2xl dark:bg-neutral-900">
                <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-600">Product Requirement</p>
                        <h3 className="text-lg font-semibold">{mode === "create" ? "Aggiungi riga manuale" : "Correggi riga prodotto/servizio"}</h3>
                        <p className="mt-1 text-xs text-slate-500">Questa modifica viene tracciata come correzione human-in-the-loop.</p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-neutral-800"><FiX /></button>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <label className="md:col-span-2 text-xs font-semibold text-slate-500">Descrizione normalizzata<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none dark:border-neutral-800 dark:bg-neutral-950" /></label>
                    <label className="md:col-span-2 text-xs font-semibold text-slate-500">Descrizione originale<textarea value={originalDescription} onChange={(event) => setOriginalDescription(event.target.value)} rows={2} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none dark:border-neutral-800 dark:bg-neutral-950" /></label>
                    <label className="text-xs font-semibold text-slate-500">Quantità<input value={quantity} onChange={(event) => setQuantity(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none dark:border-neutral-800 dark:bg-neutral-950" /></label>
                    <label className="text-xs font-semibold text-slate-500">Unità<input value={unit} onChange={(event) => setUnit(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none dark:border-neutral-800 dark:bg-neutral-950" /></label>
                    <label className="text-xs font-semibold text-slate-500">Lotto<input value={lot} onChange={(event) => setLot(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none dark:border-neutral-800 dark:bg-neutral-950" /></label>
                    <label className="text-xs font-semibold text-slate-500">Categoria suggerita<input value={categoryHint} onChange={(event) => setCategoryHint(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none dark:border-neutral-800 dark:bg-neutral-950" /></label>
                    <label className="md:col-span-2 text-xs font-semibold text-slate-500">Certificazioni, separate da virgola<input value={certifications} onChange={(event) => setCertifications(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none dark:border-neutral-800 dark:bg-neutral-950" /></label>
                    <label className="md:col-span-2 text-xs font-semibold text-slate-500">Note operative<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none dark:border-neutral-800 dark:bg-neutral-950" /></label>
                    <label className="md:col-span-2 flex items-center gap-2 text-sm text-slate-600 dark:text-neutral-300"><input type="checkbox" checked={exclude} onChange={(event) => setExclude(event.target.checked)} /> Escludi dalla futura quotazione</label>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 dark:border-neutral-700 dark:text-neutral-300">Annulla</button>
                    <button type="button" onClick={submit} disabled={!description.trim()} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Salva</button>
                </div>
            </div>
        </div>
    );
}
