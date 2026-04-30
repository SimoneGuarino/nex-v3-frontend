//src\layouts\rubrica\fetchdatas\getMicrosettoriData.ts

import { FetchData } from "examples/Fetch";
import { MutableRefObject } from "react";

type AbortLike = AbortController | MutableRefObject<AbortController | null>;

const BASE = (import.meta.env.VITE_API_REGISTRY || "").replace(/\/+$/, "");

export interface MicrosettoriItem {
    code: string;
    description: string;
}

export interface MicrosettoriResponse {
    mode: "list" | "search";
    // campi presenti in modalità "list"
    offset?: number;
    limit?: number;
    // campi presenti in modalità "search"
    q?: string;
    // comuni
    total: number;
    items: MicrosettoriItem[];
}

export async function LoadMicrosettoriAPI({
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
    onComplete: (data: MicrosettoriResponse | null) => void;
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
        const url = `${baseUrl}/lsd/microsettori/list${queryString ? `?${queryString}` : ""
            }`;

        const data = await FetchData<MicrosettoriResponse>(
            url,
            "GET",
            null,
            abortLike
        );

        onComplete(data);
    } catch (err) {
        // opzionale: puoi loggare o chiamare onComplete(null)
        // console.error("errore LoadPaymentMethodsAPI", err);
        // onComplete(null);
    }
}