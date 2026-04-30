// src/layouts/sellout/fetchdata/filters.ts
import type { MutableRefObject } from "react";
import { FetchData } from "examples/Fetch";
import type { JSONValue } from "examples/Fetch";

export interface FiltersResponse {
    ok: boolean;
    prfor: string[];
    anni: number[];
    settimane: number[];
    error?: string;
}

function getBase(): string {
    const raw = import.meta.env.VITE_API_PDF_READER || "";
    return raw.replace(/\/+$/, "");
}

/** GET {BASE}/sellout/filters */
export async function fetchSelloutFilters(
    abortLike: MutableRefObject<AbortController | null> | AbortController
): Promise<FiltersResponse> {
    const url = `${getBase()}/sellout/filters`;

    const res = await FetchData<FiltersResponse>(
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
        prfor: (res as any).prfor ?? [],
        anni: (res as any).anni ?? [],
        settimane: (res as any).settimane ?? [],
        error: (res as any).error,
    };
}
