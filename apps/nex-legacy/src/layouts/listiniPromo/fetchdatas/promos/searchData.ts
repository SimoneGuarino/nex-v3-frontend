// src/layouts/listiniPromo/fetchdatas/promos/searchData.ts
import type { MutableRefObject } from "react";
import { FetchData } from "examples/Fetch";
import type { PromotionInfo, PromoPeriod } from "./detailsData";

// ---- tipi risposta BE ----
export type PromoSearchResultItem = {
    promoCode: string;
    promoDescription: string;
    startDate: string | null;
    endDate: string | null;
    classification: string | null;
    visibility: string | null;

    productCode: string;
    denominazioneUscita: string;
    descrizioneArticolo: string;

    codiceListino: string;
    descrizioneListino: string;

    // solo prezzo del primo scaglione
    firstTierPrice: number | null;
};

export type PromoSearchResponse = {
    promotion: PromotionInfo;
    items: PromoSearchResultItem[];
    pagination: {
        limit: number;
        offset: number;
        totalItems: number;
        returnedItems: number;
    };
    metadata: {
        generatedAt: string;
        partial: boolean;
    };
};

// ---- funzione fetch ----
type FetchPromoSearchParams = {
    abortController: MutableRefObject<AbortController | null>;
    promoCode: string;   // obbligatorio
    period: PromoPeriod; // obbligatorio per la rotta BE
    q?: string;          // testo libero
    limit?: number;
    offset?: number;
};

export async function fetchPromoSearch({
    abortController,
    promoCode,
    period,
    q,
    limit,
    offset,
}: FetchPromoSearchParams): Promise<PromoSearchResponse> {
    const base = import.meta.env.VITE_API_PRODUCTS ?? "";

    const searchParams = new URLSearchParams();
    searchParams.set("promoCode", promoCode);
    searchParams.set("period", period);
    if (q && q.trim()) searchParams.set("q", q.trim());
    if (typeof limit === "number") searchParams.set("limit", String(limit));
    if (typeof offset === "number") searchParams.set("offset", String(offset));

    const url = `${base}products/promo/search?${searchParams.toString()}`;

    return await FetchData<PromoSearchResponse>(
        url,
        "GET",
        null,
        abortController
    );
}
