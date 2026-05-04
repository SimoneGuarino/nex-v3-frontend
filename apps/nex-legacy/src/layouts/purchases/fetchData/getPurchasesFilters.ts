import { FetchData } from "examples/Fetch";
import type { PurchasesFiltersResponse, PurchasesQuery } from "../types";
import {
    buildPurchasesQueryPayload,
    getPurchasesApiBase,
    PURCHASES_ENDPOINTS,
} from "./apiBase";

/**
 * Normalizza le risposte lookup del backend in opzioni `{ value, label }` utilizzabili dalle select.
 */
function normalizeOptions(input: unknown): Array<{ value: string; label: string }> {
    if (!Array.isArray(input)) return [];
    return input
        .map((item) => {
            if (typeof item === "string" || typeof item === "number") {
                const raw = String(item).trim();
                return { value: raw, label: raw };
            }

            const value = String((item as any)?.value ?? (item as any)?.id ?? (item as any)?.code ?? "").trim();
            const label = String((item as any)?.label ?? (item as any)?.name ?? (item as any)?.descrizione ?? value).trim();

            return { value, label };
        })
        .filter((item) => item.value.length > 0);
}

/**
 * Normalizza la tassonomia gerarchica prodotto.
 *
 * Supporta shape eterogenee (`brandCode/brand`, `lineCode/line`, ecc.)
 * per mantenere compatibilità con eventuali payload backend legacy o evolutivi.
 */
function normalizeTaxonomy(
    input: unknown
): Array<{ brandCode: string; lineCode: string; groupCode: string; familyCode: string }> {
    if (!Array.isArray(input)) return [];

    const out = input
        .map((item) => {
            const row = item as any;
            const brandCode = String(row?.brandCode ?? row?.brand ?? row?.brand_code ?? "").trim();
            const lineCode = String(row?.lineCode ?? row?.line ?? row?.line_code ?? "").trim();
            const groupCode = String(row?.groupCode ?? row?.group ?? row?.group_code ?? "").trim();
            const familyCode = String(row?.familyCode ?? row?.family ?? row?.family_code ?? "").trim();

            return { brandCode, lineCode, groupCode, familyCode };
        })
        .filter((row) => row.brandCode && row.lineCode && row.groupCode && row.familyCode);

    // Deduplica esplicita: riduce rumore e rende deterministiche le opzioni derivate in FE.
    const dedup = new Map<string, { brandCode: string; lineCode: string; groupCode: string; familyCode: string }>();
    out.forEach((row) => {
        const key = `${row.brandCode}|${row.lineCode}|${row.groupCode}|${row.familyCode}`;
        if (!dedup.has(key)) dedup.set(key, row);
    });

    return Array.from(dedup.values());
}

/**
 * Recupera i lookup filtri della pagina acquisti (brand, linee, gruppi, famiglie, agenti, clienti).
 */
export async function getPurchasesFilters(args: {
    abortController: AbortController;
    query: PurchasesQuery;
}): Promise<PurchasesFiltersResponse> {
    const { abortController, query } = args;
    const base = getPurchasesApiBase();
    const url = `${base}${PURCHASES_ENDPOINTS.filters}`;

    const payload = buildPurchasesQueryPayload({
        query,
        includeSort: false,
    });

    const res = await FetchData<any>(url, "POST", payload, abortController);

    return {
        brands: normalizeOptions(res?.brands ?? res?.brand),
        lines: normalizeOptions(res?.lines ?? res?.linee),
        groups: normalizeOptions(res?.groups ?? res?.gruppi),
        families: normalizeOptions(res?.families ?? res?.famiglia),
        agents: normalizeOptions(res?.agents),
        customers: normalizeOptions(res?.customers),
        taxonomy: normalizeTaxonomy(res?.taxonomy),
    };
}
