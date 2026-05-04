import { FetchData } from "examples/Fetch";
import type { PurchasesListResponse, PurchasesQuery } from "../types";
import {
    buildPurchasesQueryParams,
    getPurchasesApiBase,
    PURCHASES_ENDPOINTS,
} from "./apiBase";

/**
 * Recupera la lista acquisti paginata con ordinamento server-side.
 */
export async function getPurchasesList(args: {
    userContext: any;
    abortController: AbortController;
    page: number;
    pageSize: number;
    query: PurchasesQuery;
}): Promise<PurchasesListResponse> {
    const { abortController, page, pageSize, query } = args;

    const normalizedPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const normalizedSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 50;

    const params = buildPurchasesQueryParams({
        query,
        page: normalizedPage,
        pageSize: normalizedSize,
        includeSort: true,
    });

    const url = `${getPurchasesApiBase()}${PURCHASES_ENDPOINTS.list}?${params.toString()}`;
    const res = await FetchData<any>(url, "GET", undefined, abortController);

    const items = Array.isArray(res?.items) ? res.items : [];
    const total = Number(res?.total ?? 0);

    return {
        items,
        total: Number.isFinite(total) ? total : 0,
        page: Number(res?.page ?? normalizedPage) || normalizedPage,
        pageSize: Number(res?.pageSize ?? normalizedSize) || normalizedSize,
    };
}
