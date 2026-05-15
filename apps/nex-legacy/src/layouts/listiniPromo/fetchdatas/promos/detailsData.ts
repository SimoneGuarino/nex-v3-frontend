// src/layouts/listiniPromo/fetchdatas/promos/detailsData.ts
import type { MutableRefObject } from "react";
import { FetchData } from "examples/Fetch";

export type PromoPeriod = "SCADUTE" | "ATTUALI" | "FUTURE";

export type ProductImageInfo = {
    highPic?: string | undefined;
    lowPic?: string | undefined;
    pic500x500?: string | undefined;
    thumbPic?: string | undefined;
};

export type WarehouseAvailability = {
    codiceMagazzino: string;
    descrizioneMagazzino: string;
    disponibilita: number | null;
    quantitaOrdinata: number | null;
    dataConsegna: string | null;
};

export type PromotionProduct = {
    productCode: string;
    denominazioneUscita: string;
    descrizioneArticolo: string;
    codiceListino: string;
    descrizioneListino: string;
    /** prezzo del primo scaglione (raw, lato BE) */
    firstTierPrice: number | null;
    image?: ProductImageInfo | undefined;
    /** disponibilità per magazzino restituite dal BE */
    disponibilitaMagazzini?: WarehouseAvailability[] | null;
};

export type PromotionInfo = {
    promoCode: string;
    description: string;
    startDate: string | null;
    endDate: string | null;
    classification: string | null;
    visibility: string | null;
    productsCount: number;
};

export type PromoDetailsResponse = PromotionInfo & {
    products: PromotionProduct[];
    pagination: {
        offset: number;
        limit: number;
        total: number;
    };
    metadata: {
        generatedAt: string;
        partial: boolean;
    };
};

type FetchPromoDetailsParams = {
    abortController: MutableRefObject<AbortController | null>;
    promoCode: string;
    period: PromoPeriod;
    offset?: number;
    limit?: number;
    listino?: string | string[];  // multi-listino supportato
    productCode?: string;         // opzionale, per ricerca mirata
};

export async function fetchPromoDetails({
    abortController,
    promoCode,
    period,
    offset = 0,
    limit = 20,
    listino,
    productCode,
}: FetchPromoDetailsParams): Promise<PromoDetailsResponse> {
    const base = import.meta.env.VITE_API_PRODUCTS ?? "";

    const params = new URLSearchParams();
    params.set("period", period);
    params.set("offset", String(offset));
    params.set("limit", String(limit));

    if (Array.isArray(listino)) {
        if (listino.length > 0) {
            params.set("listino", listino.join(","));
        }
    } else if (listino) {
        params.set("listino", listino);
    }

    if (productCode) params.set("productCode", productCode);

    const url = `${base}products/promo/details/${encodeURIComponent(
        promoCode
    )}?${params.toString()}`;

    return await FetchData<PromoDetailsResponse>(
        url,
        "GET",
        null,
        abortController
    );
}
