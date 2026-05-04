import type { PurchasesQuery } from "../types";

/**
 * Restituisce la base URL del modulo acquisti.
 * Garantisce sempre lo slash finale per concatenare gli endpoint in sicurezza.
 */
export function getPurchasesApiBase(): string {
    const base = import.meta.env.VITE_API_API_CUSTOMERSFIDO || "";
    return base.endsWith("/") ? base : `${base}/`;
}

/**
 * Mappa centralizzata degli endpoint del dominio acquisti.
 */
export const PURCHASES_ENDPOINTS = {
    list: "customers/purchases/customers",
    summary: "customers/purchases/customers/summary",
    filters: "customers/purchases/filters",
    export: "customers/purchases/export",
    customersLookup: "v2/customers/search",
} as const;

/**
 * Normalizza array stringa eliminando valori vuoti e spazi laterali.
 */
function normalizeStringArray(values: string[]): string[] {
    if (!Array.isArray(values)) return [];
    return values.map((v) => String(v ?? "").trim()).filter(Boolean);
}

/**
 * Costruisce il payload POST usato da filtri/export.
 */
export function buildPurchasesQueryPayload(args: {
    query: PurchasesQuery;
    includeLimit?: number;
    includeSort?: boolean;
}): Record<string, unknown> {
    const { query, includeLimit, includeSort } = args;

    const payload: Record<string, unknown> = {
        env: query.env,
        customerCodes: normalizeStringArray(query.customerCodes),
        agentCodes: normalizeStringArray(query.agentCodes),
        brandCodes: normalizeStringArray(query.brandCodes),
        lineCodes: normalizeStringArray(query.lineCodes),
        groupCodes: normalizeStringArray(query.groupCodes),
        familyCodes: normalizeStringArray(query.familyCodes),
        dateFrom: String(query.dateFrom ?? "").trim(),
        dateTo: String(query.dateTo ?? "").trim(),
    };

    if (typeof includeLimit === "number" && Number.isFinite(includeLimit) && includeLimit > 0) {
        payload.limit = Math.floor(includeLimit);
    }

    if (includeSort) {
        payload.sortField = query.sortField;
        payload.sortDirection = query.sortDirection;
    }

    return payload;
}

/**
 * Costruisce i parametri querystring per endpoint GET (lista/summary).
 */
export function buildPurchasesQueryParams(args: {
    query: PurchasesQuery;
    page?: number;
    pageSize?: number;
    includeSort?: boolean;
}): URLSearchParams {
    const { query, page, pageSize, includeSort } = args;
    const params = new URLSearchParams();

    if (query.env) params.set("env", query.env);

    /**
     * Inserisce i filtri multi-select in formato CSV, come richiesto dal backend.
     */
    const setCsv = (key: string, values: string[]) => {
        const normalized = normalizeStringArray(values);
        if (normalized.length > 0) params.set(key, normalized.join(","));
    };

    setCsv("customerCodes", query.customerCodes);
    setCsv("agentCodes", query.agentCodes);
    setCsv("brandCodes", query.brandCodes);
    setCsv("lineCodes", query.lineCodes);
    setCsv("groupCodes", query.groupCodes);
    setCsv("familyCodes", query.familyCodes);

    const dateFrom = String(query.dateFrom ?? "").trim();
    const dateTo = String(query.dateTo ?? "").trim();
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    if (typeof page === "number" && Number.isFinite(page) && page > 0) {
        params.set("page", String(Math.floor(page)));
    }
    if (typeof pageSize === "number" && Number.isFinite(pageSize) && pageSize > 0) {
        params.set("pageSize", String(Math.floor(pageSize)));
    }

    if (includeSort) {
        params.set("sort", `${query.sortField}:${query.sortDirection}`);
    }

    return params;
}
