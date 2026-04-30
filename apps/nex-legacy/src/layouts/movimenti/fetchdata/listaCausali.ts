import { FetchData } from "examples/Fetch";
import type { MutableRefObject } from "react";

export interface Causale {
    ANNULLATA: string;
    COD_CAUSALE: string;
    DESC_CAUSALE: string;
}

/**
 * Recupera la lista delle causali di movimento
 */
export async function getListaCausali(
    abortController: MutableRefObject<AbortController | null> | AbortController
): Promise<Causale[]> {
    return FetchData(
        `${import.meta.env.VITE_API_ORDER}/movimenti/causali`,
        "GET",
        null,
        abortController
    );
}
