import { FetchData } from "examples/Fetch";
import type { MutableRefObject } from "react";

/** Interfaccia per i dati dell'ordine FB/OF */
export interface OrdineOFFB {
    tipo: string;
    numero: number;
    quantita: number;
    email: string;
    descrizione: string;
    note: string;
}

/** Risposta generica dal server */
export interface InsertOFFBResponse {
    success: boolean;
    message?: string;
}

/**
 * Inserisce un ordine FB/OF nel sistema Tesis
 * @param ordine - Dati dell'ordine da inserire
 * @param abortController - Controller per annullare la richiesta
 * @returns Promise con la risposta del server
 */
export async function insertOrdineOFFB(
    ordine: OrdineOFFB,
    abortController: MutableRefObject<AbortController | null>
): Promise<InsertOFFBResponse> {
    return FetchData<InsertOFFBResponse>(
        import.meta.env.VITE_API_ORDER + "fb/instss/is-dt",
        "POST",
        { ordine },
        abortController
    );
}
