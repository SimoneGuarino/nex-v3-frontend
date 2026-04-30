import type { MutableRefObject } from "react";
import { FetchData } from "examples/Fetch";
import type { PromoPeriod } from "./detailsData";

// periodi accettati dalla rotta /promo/list
// (ATTUALI | SCADUTE | FUTURE | CUSTOM)
export type PromoListPeriod = PromoPeriod | "CUSTOM";

// ---- tipi risposta BE ----
export type PromoListItem = {
    promoCode: string;
    description: string;
    startDate: string | null;
    endDate: string | null;
    classification: string | null;
    visibility: string | null;
    productsCount: number;
};

export type PromoListResponse = {
    items: PromoListItem[];
    metadata: {
        generatedAt: string;
        partial: boolean;
    };
};

// ---- funzione fetch ----
type FetchPromosListParams = {
    abortController: MutableRefObject<AbortController | null>;
    /**
     * periodo obbligatorio:
     * - "ATTUALI" | "SCADUTE" | "FUTURE"  (rispetto ad oggi)
     * - "CUSTOM" → richiede from/to
     */
    period: PromoListPeriod;
    /**
     * intervallo custom obbligatorio SOLO se period === "CUSTOM"
     * formato: "YYYY-MM-DD" o "YYYYMMDD"
     */
    from?: string;
    to?: string;
    /**
     * filtro opzionale sulla descrizione promo (q)
     */
    q?: string;
};

export async function fetchPromosList({
    abortController,
    period,
    from,
    to,
    q,
}: FetchPromosListParams): Promise<PromoListResponse> {
    const base = import.meta.env.VITE_API_SEARCH_ENDPOINT ?? "";

    const params = new URLSearchParams();
    params.set("period", period);

    if (period === "CUSTOM") {
        if (from && from.trim()) params.set("from", from.trim());
        if (to && to.trim()) params.set("to", to.trim());
        // la validazione "from/to obbligatori" la fa il BE
    }

    if (q && q.trim().length > 0) {
        params.set("q", q.trim());
    }

    const url = `${base}products/promo/list?${params.toString()}`;

    return await FetchData<PromoListResponse>(
        url,
        "GET",
        null,
        abortController
    );
}
