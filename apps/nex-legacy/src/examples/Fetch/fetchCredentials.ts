// FetchData.ts
import type { MutableRefObject } from "react";

export type AbortRef = MutableRefObject<AbortController | null>;

export type HttpMethod =
    | "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD"
    | (string & {}); // consente stringhe custom senza perdere intellisense

/**
 * Esegue una fetch con credenziali incluse e body JSON opzionale.
 * Mantiene la semantica originale: parse sempre via response.json().
 */
export async function FetchData<T = unknown, B = unknown>(
    url: string | URL | RequestInfo,
    method: HttpMethod,
    body: B | undefined,
    abortController: AbortRef
): Promise<T> {
    // prepara/aggiorna l'AbortController per questa chiamata
    abortController.current = new AbortController();

    const fetchOptions: RequestInit = {
        method,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: abortController.current.signal,
    };

    try {
        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
            throw new Error(`Errore nella chiamata Fetch: ${response.statusText}`);
        }

        // fedele all'originale: parsing JSON sempre
        const data = (await response.json()) as T;
        return data;
    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
            throw new Error("Richiesta annullata");
        }
        if (error instanceof Error) throw error;
        throw new Error(String(error));
    }
}
