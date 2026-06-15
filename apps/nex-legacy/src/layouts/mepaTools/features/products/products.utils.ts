import { formatEuro, scorePct } from "../../utils/formatters";
import type { ExtractedItemView, ProductMatchBucket, ProductProposalKind } from "./products.types";

const PRODUCT_ATTRIBUTE_LABELS: Record<string, string> = {
    cpv: "CPV",
    lot: "Lotto",
    lotto: "Lotto",
    lotCode: "Lotto",
    lotTitle: "Titolo lotto",
    cig: "CIG lotto",
    lotCig: "CIG lotto",
    lottoCig: "CIG lotto",
    cigLotto: "CIG lotto",
    cup: "CUP",
    budgetEuro: "Importo stimato",
    amount: "Importo stimato",
    estimatedAmount: "Importo stimato",
    includedItems: "Elementi inclusi",
    category: "Categoria",
    quantity: "Quantità",
    unit: "Unità di misura",
};

const PRODUCT_ATTRIBUTE_ORDER = ["cpv", "lot", "lotto", "lotCode", "lotCig", "lottoCig", "cigLotto", "cig", "cup", "budgetEuro", "estimatedAmount", "amount", "includedItems", "brand", "model", "productBlockAttributes"];
const PRODUCT_ATTRIBUTE_HIDDEN_KEYS = new Set([
    "aiReviewed",
    "aiReviewGateStatus",
    "requiresAiReview",
    "aiDecisionModel",
    "extractionKind",
    "extractionScore",
    "extractionSource",
    "productBlockAttributeCount",
    "productBlockGroup",
    "sourcePacketId",
    "sourceText",
    "decisionReason",
    "extractionBatchId",
    "extractionBatchLabel",
]);

/**
 * Converts technical attribute keys into labels readable by buyers.
 *
 * Known business fields use curated labels; unknown keys fall back to a generic
 * camelCase/snake_case humanization so new backend fields remain displayable.
 */
export function humanizeProductAttributeKey(key: string) {
    if (PRODUCT_ATTRIBUTE_LABELS[key]) return PRODUCT_ATTRIBUTE_LABELS[key];
    return key
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Formats mixed product attribute values for compact cards.
 *
 * The function keeps value formatting close to product-domain labels, avoiding
 * duplicated array/object/currency handling across multiple product components.
 */
export function formatProductAttributeValue(key: string, value: unknown) {
    if (value === null || value === undefined || value === "") return "n.d.";
    if (["budgetEuro", "amount", "estimatedAmount"].includes(key)) return formatEuro(value);
    if (Array.isArray(value)) return value.filter(Boolean).join(", ") || "n.d.";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
}

/**
 * Returns product attributes in a stable, buyer-friendly order.
 * Hidden AI/process metadata is filtered here so UI cards do not duplicate
 * filtering logic and do not accidentally expose internal pipeline fields.
 */
export function orderedProductAttributes(attributes: Record<string, any>) {
    const entries = Object.entries(attributes ?? {}).filter(([key, value]) => !PRODUCT_ATTRIBUTE_HIDDEN_KEYS.has(key) && value !== null && value !== undefined && String(value).trim() !== "");
    return entries.sort(([a], [b]) => {
        const ai = PRODUCT_ATTRIBUTE_ORDER.indexOf(a);
        const bi = PRODUCT_ATTRIBUTE_ORDER.indexOf(b);
        if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
        return a.localeCompare(b);
    });
}

/**
 * Reads the CIG associated with the item lot from all supported agent shapes.
 */
export function getItemLotCig(item: ExtractedItemView) {
    const attrs = item.match?.technicalAttributes && typeof item.match.technicalAttributes === "object" ? item.match.technicalAttributes as Record<string, any> : {};
    return item.match?.lotCig ?? item.match?.lottoCig ?? item.match?.cigLotto ?? item.match?.cig ?? attrs.lotCig ?? attrs.lottoCig ?? attrs.cigLotto ?? attrs.cig ?? null;
}

/**
 * Produces a stable React key/id for an extracted item.
 */
export function extractedItemId(item: ExtractedItemView, index = 0): string {
    return String(item._id ?? item.normalizedDescription ?? item.originalDescription ?? `item-${index}`);
}

/**
 * Returns the primary human-readable title for an extracted tender row.
 */
export function extractedItemTitle(item: ExtractedItemView): string {
    return String(item.normalizedDescription || item.originalDescription || "Riga prodotto senza descrizione");
}

/**
 * Normalizes evidence references across legacy and current payload names.
 */
export function getItemEvidenceRefs(item: ExtractedItemView) {
    return item.sourceEvidenceRefs ?? item.evidenceRefs ?? [];
}

/**
 * Returns best catalog matches from the matching read model.
 */
export function getItemBestMatches(item: ExtractedItemView): any[] {
    return Array.isArray(item.match?.bestMatches) ? item.match.bestMatches : [];
}

/**
 * Returns substitute catalog proposals from the matching read model.
 */
export function getItemSubstitutes(item: ExtractedItemView): any[] {
    return Array.isArray(item.match?.substitutes) ? item.match.substitutes : [];
}

/**
 * Selects the first actionable catalog candidate for summary UI.
 */
export function getTopProductCandidate(item: ExtractedItemView): any | null {
    const best = getItemBestMatches(item);
    const substitutes = getItemSubstitutes(item);
    return best[0] ?? substitutes[0] ?? null;
}

/**
 * Maps validation status codes to Italian buyer-facing labels.
 */
export function productReviewStatusLabel(status?: string) {
    const normalized = String(status ?? "PENDING_REVIEW").toUpperCase();
    if (normalized === "VALIDATED") return "Validata";
    if (normalized === "CORRECTED") return "Corretta";
    if (normalized === "REJECTED") return "Esclusa";
    return "Da revisionare";
}

/**
 * Maps validation status codes to Tailwind badge classes.
 */
export function productReviewStatusClass(status?: string) {
    const normalized = String(status ?? "PENDING_REVIEW").toUpperCase();
    if (normalized === "VALIDATED") return "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-200 dark:ring-emerald-900/40";
    if (normalized === "CORRECTED") return "bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-950/30 dark:text-blue-200 dark:ring-blue-900/40";
    if (normalized === "REJECTED") return "bg-red-50 text-red-700 ring-red-100 dark:bg-red-950/30 dark:text-red-200 dark:ring-red-900/40";
    return "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-900/40";
}

/**
 * Classifies an extracted tender row into the review bucket used by KPIs,
 * badges and buyer worklists. Keep this as the single source of truth for
 * match-readiness decisions to avoid inconsistent UI counters.
 */
export function productMatchBucket(item: ExtractedItemView): ProductMatchBucket {
    const selectedProduct = item.match?.selectedProduct && typeof item.match.selectedProduct === "object" ? item.match.selectedProduct : null;
    if (selectedProduct || String(item.match?.productMatchValidationStatus ?? "").toUpperCase() === "MANUAL_OVERRIDE") return "MANUAL";
    const top = getTopProductCandidate(item);
    if (!top) return "NO_MATCH";
    const usability = String(top?.quotationUsability?.status ?? "").toUpperCase();
    const confidence = String(top?.confidence ?? "").toUpperCase();
    const score = Number(top?.scores?.final ?? 0);
    if (usability === "USABLE" || confidence === "HIGH" || score >= 0.78) return "READY";
    return "BUYER_REVIEW";
}

/**
 * Classifies whether a product row has a manual selection, best match,
 * substitute proposal or no proposal.
 */
export function productProposalKind(item: ExtractedItemView): ProductProposalKind {
    const selectedProduct = item.match?.selectedProduct && typeof item.match.selectedProduct === "object" ? item.match.selectedProduct : null;
    if (selectedProduct || String(item.match?.productMatchValidationStatus ?? "").toUpperCase() === "MANUAL_OVERRIDE") return "MANUAL";
    if (getItemBestMatches(item).length > 0) return "BEST";
    if (getItemSubstitutes(item).length > 0) return "SUBSTITUTE";
    return "NONE";
}

/**
 * Returns the short label for the proposal kind shown in product cards.
 */
export function productProposalLabel(item: ExtractedItemView): string {
    const kind = productProposalKind(item);
    if (kind === "MANUAL") return "Prodotto validato";
    if (kind === "BEST") return "Prodotto consigliato trovato";
    if (kind === "SUBSTITUTE") return "Sostituto proposto";
    return "Nessun prodotto trovato";
}

/**
 * Returns the badge style for the proposal kind.
 */
export function productProposalClass(item: ExtractedItemView): string {
    const kind = productProposalKind(item);
    if (kind === "MANUAL") return "bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-950/30 dark:text-blue-200 dark:ring-blue-900/40";
    if (kind === "BEST") return "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-200 dark:ring-emerald-900/40";
    if (kind === "SUBSTITUTE") return "bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-950/30 dark:text-sky-200 dark:ring-sky-900/40";
    return "bg-red-50 text-red-700 ring-red-100 dark:bg-red-950/30 dark:text-red-200 dark:ring-red-900/40";
}

/**
 * Returns the KPI/filter label for a match-readiness bucket.
 */
export function productMatchBucketLabel(item: ExtractedItemView): string {
    const bucket = productMatchBucket(item);
    if (bucket === "READY") return "Pronto";
    if (bucket === "BUYER_REVIEW") return "Da verificare";
    if (bucket === "MANUAL") return "Validato";
    return "Senza match";
}

/**
 * Returns the badge style for a match-readiness bucket.
 */
export function productMatchBucketClass(item: ExtractedItemView): string {
    const bucket = productMatchBucket(item);
    if (bucket === "READY") return "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-200 dark:ring-emerald-900/40";
    if (bucket === "BUYER_REVIEW") return "bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-950/30 dark:text-blue-200 dark:ring-blue-900/40";
    if (bucket === "MANUAL") return "bg-violet-50 text-violet-700 ring-violet-100 dark:bg-violet-950/30 dark:text-violet-200 dark:ring-violet-900/40";
    return "bg-red-50 text-red-700 ring-red-100 dark:bg-red-950/30 dark:text-red-200 dark:ring-red-900/40";
}

/**
 * Picks the best available primary text for a catalog candidate.
 */
export function productCandidatePrimaryText(candidate: any): string {
    return String(candidate?.title ?? candidate?.description ?? candidate?.manufacturerCode ?? candidate?.productId ?? "Prodotto candidato");
}

/**
 * Builds compact manufacturer/code metadata for a catalog candidate.
 */
export function productCandidateMetaText(candidate: any): string {
    return [candidate?.brand, candidate?.manufacturerCode, candidate?.ean ? `EAN ${candidate.ean}` : "EAN n.d."].filter(Boolean).map((v) => String(v)).join(" · ");
}

/**
 * Extracts the product detail id used to deep-link into product details.
 */
export function productCandidateProductDetailsId(candidate: any): string | null {
    const value = candidate?.productId ?? candidate?.id_product ?? candidate?.product_id ?? candidate?._id ?? candidate?.id;
    const normalized = String(value ?? "").trim();
    return normalized || null;
}

/**
 * Returns catalog/recommendation notes that require buyer attention.
 */
export function productCheckNotes(candidate: any): string[] {
    const warnings = Array.isArray(candidate?.warnings) ? candidate.warnings : [];
    const verificationNotes = Array.isArray(candidate?.verificationNotes) ? candidate.verificationNotes : [];
    const usabilityReasons = Array.isArray(candidate?.quotationUsability?.reasons) ? candidate.quotationUsability.reasons : [];
    return [...verificationNotes, ...usabilityReasons, ...warnings].filter(Boolean).map((note) => String(note));
}

/**
 * Builds row-level catalog warnings from selected item and recommendation data.
 */
export function itemCatalogWarnings(item: ExtractedItemView): string[] {
    return Array.isArray(item.match?.catalogWarnings) ? item.match.catalogWarnings.filter(Boolean).map((warning: any) => String(warning)) : [];
}

/**
 * Produces the short summary shown on product review cards.
 */
export function proposalSummaryText(item: ExtractedItemView): string {
    const candidate = getTopProductCandidate(item);
    if (!candidate) return "Nessun candidato catalogo associato alla riga. Serve ricerca manuale o supporto buyer.";
    const usability = quotationUsabilityLabel(candidate);
    return `${productCandidatePrimaryText(candidate)} · ${confidenceLabel(candidate)} · ${usability}`;
}

/**
 * Returns the best reference code for comparing candidate products.
 */
export function productCandidateRef(candidate: any): string {
    return `${String(candidate?.source ?? "UNKNOWN")}:${String(candidate?.productId ?? candidate?.icecatId ?? candidate?.id ?? "")}`;
}

/**
 * Labels a candidate as best match, substitute or generic candidate.
 */
export function productRecommendationLabel(candidate: any, kind?: "best" | "substitute"): string {
    const recommendationType = String(candidate?.recommendationType ?? "").toUpperCase();
    if (kind === "best" || recommendationType === "BEST_MATCH") return "Prodotto consigliato";
    if (kind === "substitute" || recommendationType === "SUBSTITUTE") return "Sostituto";
    return "Candidato";
}

/**
 * Returns the badge style for product recommendation usability.
 */
export function productRecommendationClass(candidate: any, kind?: "best" | "substitute"): string {
    const usability = String(candidate?.quotationUsability?.status ?? "").toUpperCase();
    if (usability === "NOT_RECOMMENDED") return "bg-red-50 text-red-700 ring-red-100 dark:bg-red-950/30 dark:text-red-200 dark:ring-red-900/40";
    if (kind === "best" || String(candidate?.recommendationType ?? "").toUpperCase() === "BEST_MATCH") return "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-200 dark:ring-emerald-900/40";
    if (usability === "USABLE_WITH_REVIEW") return "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-900/40";
    return "bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-950/30 dark:text-blue-200 dark:ring-blue-900/40";
}

/**
 * Converts model confidence/final score into a readable confidence label.
 */
export function confidenceLabel(candidate: any): string {
    const confidence = String(candidate?.confidence ?? "").toUpperCase();
    if (confidence === "HIGH") return "Alta confidenza";
    if (confidence === "MEDIUM") return "Media confidenza";
    if (confidence === "LOW") return "Bassa confidenza";
    const score = Number(candidate?.scores?.final ?? 0);
    if (score >= 0.78) return "Alta confidenza";
    if (score >= 0.65) return "Media confidenza";
    return "Da verificare";
}

/**
 * Converts quotation usability status into a buyer-facing instruction.
 */
export function quotationUsabilityLabel(candidate: any): string {
    const status = String(candidate?.quotationUsability?.status ?? "").toUpperCase();
    if (status === "USABLE") return "Pronto per quotazione";
    if (status === "USABLE_WITH_REVIEW") return "Candidato trovato · verifica buyer";
    if (status === "NOT_RECOMMENDED") return "Non consigliato per quotazione";
    return "Da validare";
}

/**
 * Labels the overall product recommendation pipeline status.
 */
export function recommendationStatusLabel(value: string): string {
    const status = String(value ?? "").toUpperCase();
    if (status === "MATCHED" || status === "AI_MATCHED") return "prodotto consigliato generato";
    if (status === "PARTIAL_MATCH") return "proposta parziale da verificare";
    if (status === "NO_MATCH") return "nessun prodotto consigliato";
    if (status === "FAILED") return "errore proposta prodotti";
    return "in attesa di proposta";
}

/**
 * Builds the compact confidence note shown near the top candidate.
 */
export function topConfidenceNote(item: ExtractedItemView): string | null {
    const top = getTopProductCandidate(item);
    if (!top) return null;
    return `${confidenceLabel(top)} · ${scorePct(Number(top?.scores?.final ?? 0))}`;
}
