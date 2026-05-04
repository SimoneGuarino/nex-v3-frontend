/**
 * Costruisce la richiesta verso l'endpoint `quotes/list`
 * con filtri, ordinamento e paginazione server-side (page/pageSize),
 * e restituisce una risposta tipizzata usata dalla tabella principale
 * e dall'infinite scroll della vista Preventivi.
 */
import { FetchData } from "examples/Fetch";
import { isKeyInObject } from "vdck";
import type { PaginatedResponse, QuoteHeader } from "../types";
import { getPreventiviApiBase } from "./apiBase";

export async function getQuotesList(args: {
    userContext: any;
    abortController: any;
    page: number;
    pageSize: number;
    env?: string;
    customerCode?: string;
    agentCodes?: string[];
    year?: string;
    warehouse?: string;
    quoteNumber?: string;
    q?: string;
    sort?: string;
}): Promise<PaginatedResponse<QuoteHeader>> {
    const { userContext, abortController, page, pageSize, env, customerCode, agentCodes, year, warehouse, quoteNumber, q, sort } = args;

    if (!isKeyInObject(userContext, "token", "s", { minLength: 1 })) {
        return { items: [], page: 1, pageSize, total: 0 };
    }

    const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
    });

    if (env) params.set("env", env);
    if (customerCode) params.set("customerCode", customerCode);
    if (Array.isArray(agentCodes) && agentCodes.length > 0) {
        params.set("agentCodes", agentCodes.join(","));
    }
    if (year) params.set("year", year);
    if (warehouse) params.set("warehouse", warehouse);
    if (quoteNumber) params.set("quoteNumber", quoteNumber);
    if (q) params.set("q", q);
    if (sort) params.set("sort", sort);

    const url = `${getPreventiviApiBase()}customers/quotes/list?${params.toString()}`;
    return FetchData<PaginatedResponse<QuoteHeader>>(url, "GET", undefined, abortController);
}
