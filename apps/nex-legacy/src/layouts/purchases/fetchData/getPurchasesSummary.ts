import { FetchData } from "examples/Fetch";
import type { PurchasesQuery, PurchasesSummaryResponse } from "../types";
import {
    buildPurchasesQueryParams,
    getPurchasesApiBase,
    PURCHASES_ENDPOINTS,
} from "./apiBase";

/**
 * Recupera i KPI sintetici della vista acquisti usando lo stesso perimetro filtri della lista.
 */
export async function getPurchasesSummary(args: {
    abortController: AbortController;
    query: PurchasesQuery;
}): Promise<PurchasesSummaryResponse> {
    const { abortController, query } = args;

    const params = buildPurchasesQueryParams({
        query,
        includeSort: false,
    });

    const url = `${getPurchasesApiBase()}${PURCHASES_ENDPOINTS.summary}?${params.toString()}`;
    const res = await FetchData<any>(url, "GET", undefined, abortController);

    const totalRows = Number(res?.totalRows ?? 0);
    const totalQty = Number(res?.totalQty ?? 0);
    const totalValue = Number(res?.totalValue ?? 0);

    return {
        totalRows: Number.isFinite(totalRows) ? totalRows : 0,
        totalQty: Number.isFinite(totalQty) ? totalQty : 0,
        totalValue: Number.isFinite(totalValue) ? totalValue : 0,
        generatedAt: String(res?.metadata?.generatedAt ?? "").trim() || null,
        partial: Boolean(res?.metadata?.partial),
    };
}
