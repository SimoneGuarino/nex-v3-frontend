import type { ExtractedItemView } from "./products.types";
import { getTopProductCandidate, productMatchBucket } from "./products.utils";

/**
 * Local UI filters applied to the extracted-product review grid.
 *
 * These filters intentionally stay client-side because they operate on the
 * already-loaded tender rows and must feel instant while the buyer reviews a
 * single gara. Large catalog searches remain server-side/RAG-driven and are not
 * mixed with this lightweight review filter model.
 */
export type ProductReviewFilters = {
    /** Validation status selected in the review toolbar, or ALL for no status narrowing. */
    statusFilter: string;
    /** Derived match bucket selected in the review toolbar, or ALL for no bucket narrowing. */
    matchFilter: string;
    /** Tender lot/group selected by the user, or ALL to keep the full gara perimeter visible. */
    lotFilter: string;
    /** Free-text query. Components should pass a deferred value to avoid typing jank. */
    search: string;
};

/**
 * KPI counters rendered above the product review grid.
 *
 * The counters are derived from the same source list used by the grid so the
 * user never sees mismatched totals between filters, badges and rows.
 */
export type ProductReviewStats = {
    /** Total extracted rows currently loaded for the selected tender. */
    total: number;
    /** Rows explicitly validated by the human/AI governance workflow. */
    validated: number;
    /** Rows corrected during review; still considered usable but tracked separately for audit. */
    corrected: number;
    /** Rows rejected because they are not relevant/actionable for quotation. */
    rejected: number;
    /** Rows still outside a terminal validation status and therefore requiring attention. */
    review: number;
    /** Rows with a ready or manually selected catalog proposal. */
    ready: number;
    /** Rows with possible catalog proposals that still need buyer judgement. */
    buyerReview: number;
    /** Rows for which the product matching workflow did not find a usable candidate. */
    noMatch: number;
};

/**
 * Computes buyer-facing product review counters from extracted tender rows.
 *
 * The selector is intentionally pure and deterministic: the same list always
 * produces the same KPI bucket values. Keeping these rules outside the React
 * component prevents KPI/filter drift when the product review UI evolves.
 */
export function getProductReviewStats(items: ExtractedItemView[]): ProductReviewStats {
    // Status counts are based on validationStatus because they describe the
    // human/AI governance lifecycle, not the catalog-matching outcome.
    const total = items.length;
    const statuses = items.map((item) => String(item.validationStatus ?? "").toUpperCase());
    const validated = statuses.filter((status) => status === "VALIDATED").length;
    const corrected = statuses.filter((status) => status === "CORRECTED").length;
    const rejected = statuses.filter((status) => status === "REJECTED").length;
    const review = statuses.filter((status) => !["VALIDATED", "CORRECTED", "REJECTED"].includes(status)).length;
    // Match buckets are derived through the shared utility so the filter select,
    // KPI cards and row badges all speak the same language.
    const buckets = items.map(productMatchBucket);
    const ready = buckets.filter((bucket) => bucket === "READY" || bucket === "MANUAL").length;
    const buyerReview = buckets.filter((bucket) => bucket === "BUYER_REVIEW").length;
    const noMatch = buckets.filter((bucket) => bucket === "NO_MATCH").length;
    return { total, validated, corrected, rejected, review, ready, buyerReview, noMatch };
}

/**
 * Returns the normalized lot list used by the filter select.
 *
 * Lots can arrive from different agent payload fields, therefore this selector
 * centralizes fallback logic and keeps rendering code focused on UI only.
 */
export function getProductLots(items: ExtractedItemView[]): string[] {
    // The agent can return either lot or groupName depending on document
    // structure. Normalize both into one sorted, unique list for a stable select.
    return Array.from(new Set(items.map((item) => String(item.match?.lot ?? item.match?.groupName ?? "").trim()).filter(Boolean))).sort();
}

/**
 * Filters extracted products using UI-safe criteria only.
 *
 * Expensive work is bounded to one normalized haystack per item. Components can
 * pass a deferred search value to avoid blocking input typing on low-end devices.
 */
export function filterProductReviewItems(items: ExtractedItemView[], filters: ProductReviewFilters): ExtractedItemView[] {
    // Normalize the query once. This selector can be called often while typing,
    // so avoid repeated trim/lowercase work inside each searchable field.
    const q = filters.search.trim().toLowerCase();
    return items.filter((item) => {
        const status = String(item.validationStatus ?? "PENDING_REVIEW").toUpperCase();
        if (filters.statusFilter !== "ALL" && status !== filters.statusFilter) return false;

        const bucket = productMatchBucket(item);
        if (filters.matchFilter !== "ALL" && bucket !== filters.matchFilter) return false;

        const lot = String(item.match?.lot ?? item.match?.groupName ?? "").trim();
        if (filters.lotFilter !== "ALL" && lot !== filters.lotFilter) return false;

        if (!q) return true;

        // Search only through fields that are meaningful to buyers. Avoid dumping
        // entire match/evidence objects into the haystack: that would be slower,
        // leak diagnostics into UX search and produce hard-to-explain matches.
        const candidate = getTopProductCandidate(item);
        const haystack = [
            item.originalDescription,
            item.normalizedDescription,
            item.unit,
            item.match?.lot,
            item.match?.groupName,
            item.match?.categoryHint,
            item.match?.technicalAttributes?.brand,
            item.match?.technicalAttributes?.model,
            candidate?.title,
            candidate?.manufacturerCode,
            ...(Array.isArray(item.match?.certifications) ? item.match.certifications : []),
        ].map((value) => String(value ?? "").toLowerCase()).join(" ");

        return haystack.includes(q);
    });
}
