import { FetchFileData, type FetchFileResult } from "examples/Fetch/FetchFileDataV2";
import type { MutableRefObject } from "react";
import type { MovimentiPayload } from "./listaMovimenti";

/**
 * Esporta i movimenti filtrati in formato CSV
 * @param payload - Filtri da applicare (causali, dataInizio, dataFine)
 * @param abortRef - Ref per l'AbortController (opzionale)
 * @returns Promise con il blob del file CSV
 */
export async function exportMovimentiCSV(
    payload: MovimentiPayload,
    abortRef?: MutableRefObject<AbortController | null>
): Promise<FetchFileResult> {
    return FetchFileData(
        `${import.meta.env.VITE_API_ORDER}/movimenti/export`,
        {
            method: "POST",
            body: JSON.stringify(payload),
            headers: {
                "Content-Type": "application/json",
            },
            abortRef,
            responseType: "blob",
        }
    );
}

/**
 * Helper per scaricare il file CSV nel browser
 * @param result - Risultato della chiamata exportMovimentiCSV
 * @param fallbackFilename - Nome file di fallback se non presente nell'header
 */
export function downloadCSV(result: FetchFileResult, fallbackFilename: string = "movimenti.csv"): void {
    if (result.kind !== "blob") {
        console.error("Il risultato non è un blob");
        return;
    }

    const url = URL.createObjectURL(result.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = result.filename || fallbackFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
