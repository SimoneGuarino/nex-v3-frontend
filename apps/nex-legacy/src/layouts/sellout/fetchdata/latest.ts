//src\layouts\sellout\fetchdata\latest.ts

import type { MutableRefObject } from "react";
import { FetchData } from "examples/Fetch";
import type { JSONValue } from "examples/Fetch";

export type InviatoFlag = "S" | "N";

export interface SelloutFileLatest {
    id: number;
    filename: string;
    prfor: string;
    settimana: number;
    anno: number;
    data_inizio: string;     // YYYY-MM-DD
    data_fine: string;       // YYYY-MM-DD
    data_creazione: string;  // ISO date-time
    inviato: InviatoFlag;
    mail_sellout?: string | null;
    filepath?: string | null;
    size?: number | null;    // aggiunta dal BE: dimensione file in byte (se disponibile)
}

export interface LatestResponse {
    ok: boolean;
    latest: SelloutFileLatest | null;
    error?: string;
}

function getBase(): string {
    const raw = import.meta.env.VITE_API_PDF_READER || "";
    return raw.replace(/\/+$/, "");
}

/**
 * Recupera il file più recente (riquadro “pronto”).
 * GET {BASE}/sellout/latest
 */
export async function fetchSelloutLatest(
    abortLike: MutableRefObject<AbortController | null> | AbortController
): Promise<LatestResponse> {
    const url = `${getBase()}/sellout/latest`;

    const res = await FetchData<LatestResponse>(
        url,
        "GET",
        null as unknown as JSONValue,
        abortLike
    );

    if (!res || typeof res !== "object") {
        throw new Error("Risposta inattesa dal server.");
    }

    return {
        ok: Boolean((res as any).ok),
        latest: (res as any).latest ?? null,
        error: (res as any).error,
    };
}
