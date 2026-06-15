//src\layouts\sellout\fetchdata\preview.ts

import type { MutableRefObject } from "react";
import { FetchData } from "examples/Fetch";
import type { JSONValue } from "examples/Fetch";

export interface PreviewResponse {
    ok: boolean;
    rows?: string[][];
    filename?: string;
    base?: string;
    error?: string;
}

/**
 * Costruisce l’URL base dall'env (rimuove eventuale slash finale)
 * Esempio env: VITE_API_PDF_READER=https://localhost/mq2rt7jqq26auv5osfi8
 */
function getBase(): string {
    const raw = import.meta.env.VITE_API_PDF_READER || "";
    return raw.replace(/\/+$/, ""); // no trailing slash
}

/**
 * Anteprima CSV (prime 50 righe) per file sellout.
 * Chiama: GET {BASE}/services/drive/sellout/preview/:id
 *
 * @param id        ID del record in sellout_files
 * @param abortLike AbortController o ref ad esso (compatibile con FetchData)
 */
export async function fetchSelloutPreview(
    id: number,
    abortLike: MutableRefObject<AbortController | null> | AbortController
): Promise<PreviewResponse> {
    if (!Number.isFinite(id)) {
        throw new Error("id non valido");
    }

    const url = `${getBase()}/sellout/preview/${encodeURIComponent(id)}`;

    // GET senza body → passiamo `null` come body
    const res = await FetchData<PreviewResponse>(url, "GET", null as unknown as JSONValue, abortLike);

    // opzionale: normalizzazione minima
    if (!res || typeof res !== "object") {
        throw new Error("Risposta inattesa dal server.");
    }
    return res;
}
