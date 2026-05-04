import { FetchData } from "examples/Fetch";
import { getPurchasesApiBase, PURCHASES_ENDPOINTS } from "./apiBase";

type SelectOption = { value: string; label: string };

/**
 * Normalizza un elemento cliente generico in opzione select.
 * Supporta naming diversi per garantire compatibilita con risposte eterogenee.
 */
function normalizeCustomerOption(item: any): SelectOption | null {
    const directValue = String(item?.value ?? "").trim();
    const directLabel = String(item?.label ?? "").trim();
    if (directValue && directLabel) {
        return { value: directValue, label: directLabel };
    }

    const code = String(item?.codiceCliente ?? item?.customerCode ?? item?.codice ?? item?.code ?? "").trim();
    if (!code) return null;

    const ragioneSociale = String(item?.ragioneSociale ?? item?.customerName ?? item?.denominazione ?? "").trim();
    const pIva = String(item?.WPIVA ?? item?.wpiva ?? item?.partitaIva ?? item?.partitaIVA ?? item?.PartitaIva ?? "").trim();

    return {
        value: code,
        label: ragioneSociale ? `${ragioneSociale} (${code}) (${pIva})` : code,
    };
}

/**
 * Compat legacy:
 * supporta anche la vecchia shape quotes (`WCDCL`/`WRAGS`) nel caso in cui
 * qualche client usi ancora endpoint storici.
 */
function normalizeQuoteLookupItem(item: any): SelectOption | null {
    const code = String(item?.WCDCL ?? item?.wcdcl ?? "").trim();
    if (!code) return null;
    const ragioneSociale = String(item?.WRAGS ?? item?.wrags ?? "").trim();
    return {
        value: code,
        label: ragioneSociale ? `${ragioneSociale} (${code})` : code,
    };
}

/**
 * Cerca clienti per la select remota "Cliente / Ragione sociale".
 */
export async function searchPurchaseCustomers(args: {
    abortController: AbortController;
    query: string;
    limit?: number;
}): Promise<SelectOption[]> {
    const { abortController, query, limit = 20 } = args;
    const q = String(query ?? "").trim();
    if (!q) return [];

    const base = getPurchasesApiBase();
    const params = new URLSearchParams({
        query: q,
        limit: String(limit),
    });

    const url = `${base}${PURCHASES_ENDPOINTS.customersLookup}?${params.toString()}`;
    const res = await FetchData<any>(url, "GET", null, abortController);
    const items = Array.isArray(res?.items) ? res.items : [];

    return items
        .map((item: any) => normalizeQuoteLookupItem(item) ?? normalizeCustomerOption(item))
        .filter((opt: SelectOption | null): opt is SelectOption => Boolean(opt));
}
