import { FetchData } from "examples/Fetch";
import type { MutableRefObject } from "react";

export interface Movimento {
    COD_AGENTE: string;
    NUM_MOVIMENTO: string;
    LINEA: string;
    GRUPPO: string;
    FAMIGLIA: string;
    COD_ARTICOLO: string;
    COD_PRODUTTORE: string;
    DESCRIZIONE: string;
    MAGAZZINO: string;
    CAUSALE: number;
    DATA_MOVIMENTO: number;
    QUANTITA: number;
    PREZZO: number;
    NUM_DOCUMENTO: string;
    COD_CLIENTE: string;
    RAG_SOCIALE: string;
    COSTO_MEDIO_GESTIONALE: number;
    COSTO_MEDIO: number;
    COD_BUYER: string;
}

export interface MovimentiPayload {
    causali: number[];
    dataInizio: number;
    dataFine: number;
}

export interface MovimentiResponse {
    total: number;
    ofs: number;
    pageSize: number;
    data: Movimento[];
}

/**
 * Recupera la lista dei movimenti filtrati per causali e data
 */
export async function getListaMovimenti(
    payload: MovimentiPayload,
    ofs: number = 0,
    abortController: MutableRefObject<AbortController | null> | AbortController
): Promise<MovimentiResponse> {
    return FetchData(
        `${import.meta.env.VITE_API_ORDER}/movimenti/list?ofs=${ofs}`,
        "POST",
        payload,
        abortController
    );
}
