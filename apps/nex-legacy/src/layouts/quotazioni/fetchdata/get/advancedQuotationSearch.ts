import { FetchData } from "examples/Fetch";
import type { MutableRefObject } from "react";
import type { GetOwnQtsFilters, QuotazioneDTO } from "../../types/quotations";

type AbortLike = MutableRefObject<AbortController | null> | AbortController;

export type AdvancedQuotationSearchResponse = {
    data: QuotazioneDTO[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages?: number;
    };
};

export type AdvancedQuotationSearchParams = {
    abortController: AbortLike;
    query: string;
    filters?: GetOwnQtsFilters;
};

const setIfDefined = (sp: URLSearchParams, key: string, value?: string | number) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
        sp.set(key, String(value));
    }
};

export async function advancedQuotationSearchData({
    abortController,
    query,
    filters,
}: AdvancedQuotationSearchParams): Promise<AdvancedQuotationSearchResponse> {
    const trimmedQuery = String(query ?? "").trim();
    if (!trimmedQuery) {
        return {
            data: [],
            pagination: {
                total: 0,
                page: 1,
                limit: 0,
            },
        };
    }

    const base = import.meta.env.VITE_API_ORDER ?? "";
    const url = new URL(`${base}quotations/search/advanced`);
    url.searchParams.set("q", trimmedQuery);

    setIfDefined(url.searchParams, "stato", filters?.stato);
    setIfDefined(url.searchParams, "tipologia", filters?.tipologia);
    setIfDefined(url.searchParams, "limit", filters?.limit);
    setIfDefined(url.searchParams, "page", filters?.page);
    setIfDefined(url.searchParams, "sortBy", filters?.sortBy);
    setIfDefined(url.searchParams, "order", filters?.order);
    setIfDefined(url.searchParams, "dateFrom", filters?.dateFrom);
    setIfDefined(url.searchParams, "dateTo", filters?.dateTo);
    setIfDefined(url.searchParams, "prog_num", filters?.prog_num);
    setIfDefined(url.searchParams, "valoreMin", filters?.valoreMin);
    setIfDefined(url.searchParams, "valoreMax", filters?.valoreMax);
    setIfDefined(url.searchParams, "buyerCode", filters?.buyerCode);
    setIfDefined(url.searchParams, "agenteId", filters?.agenteId);

    const res = await FetchData<AdvancedQuotationSearchResponse>(
        url.toString(),
        "GET",
        null,
        abortController
    );

    if (!res || !Array.isArray(res.data)) {
        throw new Error("Risposta dal server non valida");
    }

    return res;
}
