// src/layouts/quotazioni/fetchdata/agent/getOwnQuotationsData.ts
import { FetchData } from "examples/Fetch";
import type { MutableRefObject } from "react";
import type { UserState } from "types/UserContext";
import type { GetOwnQtsFilters, QuotazioniListResponse } from "../../types/quotations";

type AbortLike = MutableRefObject<AbortController | null> | AbortController;

export interface GetOwnQuotationsDataProps {
    abortController: AbortLike;
    user?: UserState | null;
    filters?: GetOwnQtsFilters;
    HandleComplete: (payload: QuotazioniListResponse) => void;
    HandleError: (errorMessage: string) => void;
    ChangeLoadStatus?: (args: { from: string; bool: boolean }) => void;
}

const setIfDefined = (sp: URLSearchParams, key: string, value?: string | number) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
        sp.set(key, String(value));
    }
};

export async function getOwnQuotationsData({
    abortController,
    filters,
    HandleComplete,
    HandleError,
    ChangeLoadStatus,
}: GetOwnQuotationsDataProps): Promise<void> {
    const FROM = "getOwnQuotationsData";

    try {
        ChangeLoadStatus?.({ from: FROM, bool: true });

        const base = import.meta.env.VITE_API_ORDER ?? "";
        const url = new URL(`${base}quotations/get/own`);

        setIfDefined(url.searchParams, "stato", filters?.stato);
        setIfDefined(url.searchParams, "tipologia", filters?.tipologia);
        setIfDefined(url.searchParams, "limit", filters?.limit);
        setIfDefined(url.searchParams, "page", filters?.page);
        setIfDefined(url.searchParams, "sortBy", filters?.sortBy);
        setIfDefined(url.searchParams, "order", filters?.order);
        // I filtri vengono passati al server: la lista deve essere filtrata lato BE, non in FE dopo la risposta.
        setIfDefined(url.searchParams, "dateFrom", filters?.dateFrom);
        setIfDefined(url.searchParams, "dateTo", filters?.dateTo);
        setIfDefined(url.searchParams, "prog_num", filters?.prog_num);
        setIfDefined(url.searchParams, "valoreMin", filters?.valoreMin);
        setIfDefined(url.searchParams, "valoreMax", filters?.valoreMax);
        setIfDefined(url.searchParams, "buyerCode", filters?.buyerCode);
        setIfDefined(url.searchParams, "agenteId", filters?.agenteId);


        const res = await FetchData<QuotazioniListResponse>(
            url.toString(),
            "GET",
            null,
            abortController
        );

        HandleComplete(res);
    } catch (err: unknown) {
        const e = err as { name?: string; message?: any };
        if (e?.name !== "AbortError") {
            const backendMsg =
                typeof e?.message === "string"
                    ? e.message
                    : e?.message?.msg || "Errore nel recupero delle quotazioni.";
            console.error("[getOwnQuotationsData] error:", err);
            HandleError(backendMsg);
        }
    } finally {
        ChangeLoadStatus?.({ from: FROM, bool: false });
    }
}
