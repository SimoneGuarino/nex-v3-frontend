/**
 * Lookup remoto per la select "Cliente" dei filtri Preventivi.
 *
 * Usa `GET /v2/customers/search`:
 * - ricerca while-typing via `query`
 * - limite risultati via `limit`
 *
 * Manteniamo la shape `PaginatedResponse` per coerenza con il layout,
 * anche se l'endpoint v2 non espone paginazione server-side.
 */
import { FetchData } from "examples/Fetch";
import { isKeyInObject } from "vdck";
import type { PaginatedResponse } from "../types";
import { getPreventiviApiBase } from "./apiBase";

export async function getCustomersWithQuotes(args: {
    userContext: any;
    abortController: any;
    page: number;
    pageSize: number;
    env?: string;
    q?: string;
    sort?: string;
}): Promise<PaginatedResponse<any>> {
    const { userContext, abortController, page, pageSize, q } = args;

    if (!isKeyInObject(userContext, "token", "s", { minLength: 1 })) {
        return { items: [], page: 1, pageSize, total: 0 };
    }

    const query = String(q ?? "").trim();
    if (query.length < 2) {
        return { items: [], page, pageSize, total: 0 };
    }

    const params = new URLSearchParams({
        query,
        limit: String(pageSize),
    });

    const url = `${getPreventiviApiBase()}v2/customers/search?${params.toString()}`;
    const res = await FetchData<any>(url, "GET", undefined, abortController);

    return {
        items: Array.isArray(res?.items) ? res.items : [],
        page,
        pageSize,
        total: Array.isArray(res?.items) ? res.items.length : 0,
    };
}
