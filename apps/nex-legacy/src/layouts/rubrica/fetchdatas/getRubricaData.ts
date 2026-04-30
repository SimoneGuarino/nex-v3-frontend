// src/layouts/rubrica/fetchdatas/getRubricaData.ts

import { FetchData } from "examples/Fetch";
import { MutableRefObject } from "react";

type AbortLike = AbortController | MutableRefObject<AbortController | null>;

const BASE = (import.meta.env.VITE_API_REGISTRY || "").replace(/\/+$/, "");

// tipi di risposta della rotta /lsd/rubrica/list
export interface RubricaItem {
    interno?: string;
    nome: string;
    cognome: string;
    sede?: string;
    numeroSede?: string;
    mobile?: string;
    email?: string;
    divisione?: string;
    bu?: string;
    funzione?: string;
    agente1?: string;
    agente2?: string;
    agente3?: string;
    agente4?: string;
    buyer?: string;
}

export interface RubricaResponse {
    mode: "list" | "search";
    // campi presenti in modalità "list"
    offset?: number;
    limit?: number;
    // campi presenti in modalità "search"
    q?: string;
    // comuni
    total: number;
    items: RubricaItem[];
}


/**
 * GET /lsd/rubrica/list
 * - se q è valorizzato → modalità search (server-side)
 * - se q è vuoto/assente → lista paginata con offset
 */
export async function LoadRubricaAPI({
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
    onComplete: (data: RubricaResponse | null) => void;
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
        const url = `${baseUrl}/lsd/rubrica/list${queryString ? `?${queryString}` : ""}`;

        const data = await FetchData<RubricaResponse>(url, "GET", null, abortLike);

        onComplete(data);
    } catch (err) {

    }
}
