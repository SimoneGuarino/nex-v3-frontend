// src\layouts\rubrica\fetchdatas\getCondGaranziaData.ts

import { FetchData } from "examples/Fetch";
import { MutableRefObject } from "react";

type AbortLike = AbortController | MutableRefObject<AbortController | null>;

const BASE = (import.meta.env.VITE_API_REGISTRY || "").replace(/\/+$/, "");

// tipi di risposta della rotta /lsd/condGaranzia/list
export interface CondGaranziaItem {
    brand: string;
    tipoGaranzia?: string;
    contatto: string;
    durataGaranzia?: string;
    DOA?: string;
    chiGestisceIlDoa: string;
    DOAGiorni: string;
    note?: string;
    note1?: string;
    note2?: string;
    note3?: string;
    note4?: string;
}

export interface CondGaranziaResponse {
    mode: "list" | "search";
    // campi presenti in modalità "list"
    offset?: number;
    limit?: number;
    // campi presenti in modalità "search"
    q?: string;
    // comuni
    total: number;
    items: CondGaranziaItem[];
}


/**
 * GET /lsd/condGaranzia/list
 * - se q è valorizzato → modalità search (server-side)
 * - se q è vuoto/assente → lista paginata con offset
 */
export async function LoadCondGaranziaAPI({
    abortLike,
    baseUrl = BASE,
    offset = 0,
    q,
    onComplete,
}: {
    abortLike: AbortLike;
    baseUrl?: string;
    offset?: number;
    q?: string;
    onComplete: (data: CondGaranziaResponse | null) => void;
}) {
    try {
        const params = new URLSearchParams();

        // offset solo se > 0 (0 è il default del BE)
        const safeOffset = Number.isFinite(offset) && offset! > 0 ? offset! : 0;
        if (safeOffset > 0) {
            params.set("offset", String(safeOffset));
        }

        const trimmedQ = q?.trim();
        if (trimmedQ) {
            params.set("q", trimmedQ);
        }

        const queryString = params.toString();
        const url = `${baseUrl}/lsd/condGaranzia/list${queryString ? `?${queryString}` : ""}`;

        const data = await FetchData<CondGaranziaResponse>(url, "GET", null, abortLike);

        onComplete(data);
    } catch (err) {

    }
}
