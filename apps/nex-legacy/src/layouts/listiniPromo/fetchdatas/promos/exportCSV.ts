// src/layouts/listiniPromo/fetchdatas/promos/exportCSV.ts
import type { PromoPeriod } from "./detailsData";
import {
    FetchFileData,
    type AbortRef,
    type FetchFileResult,
} from "examples/Fetch/FetchFileDataV2";

/**
 * Parametri per l’export CSV dei dettagli promo.
 * La rotta BE è:
 *   GET /products/promo/details/:promoCode/csv
 * con query:
 *   - period (obbligatorio)
 *   - listino (facoltativo, singolo o multiplo)
 *   - productCode (facoltativo)
 */
export type FetchPromoExportCsvParams = {
    abortRef?: AbortRef;
    promoCode: string;
    period: PromoPeriod;
    listino?: string | string[];   // multi-listino supportato
    productCode?: string;          // opzionale, per ricerca mirata
};

/**
 * Esegue la chiamata al BE per ottenere il CSV (senza paginazione).
 * Ritorna un FetchFileResult:
 *  - { kind: "blob", blob, filename?, contentType }  <-- caso normale (CSV)
 *  - { kind: "json", json, contentType }            <-- solo se il server restituisce JSON
 */
export async function fetchPromoExportCsv(
    params: FetchPromoExportCsvParams
): Promise<FetchFileResult> {
    const base = import.meta.env.VITE_API_PRODUCTS ?? "";

    const searchParams = new URLSearchParams();
    searchParams.set("period", params.period);

    // gestione multi-listino come in fetchPromoDetails
    if (Array.isArray(params.listino)) {
        if (params.listino.length > 0) {
            searchParams.set("listino", params.listino.join(","));
        }
    } else if (params.listino) {
        searchParams.set("listino", params.listino);
    }

    if (params.productCode) {
        searchParams.set("productCode", params.productCode);
    }

    const url = `${base}products/promo/export/${encodeURIComponent(
        params.promoCode
    )}?${searchParams.toString()}`;

    // GET, nessun body, ci aspettiamo un file (CSV) → responseType auto va bene
    return await FetchFileData(url, {
        method: "GET",
        abortRef: params.abortRef,
        responseType: "auto",
    });
}
