// FetchDataHTML.ts
import type { MutableRefObject } from "react";

export type AbortRef = MutableRefObject<AbortController | null>;

export type HttpMethod =
    | "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD"
    | (string & {}); // consente stringhe custom senza perdere l'intellisense

type JSONObject = Record<string, unknown>;
type JSONObjectOrArray = JSONObject | JSONObject[];

/**
 * Esegue una fetch che legge la risposta come testo e prova a fare il parse JSON.
 * Accetta anche risposte compresse lato server (header impostato per fedeltà, anche se in browser viene ignorato).
 * Ritorna solo se il JSON è un oggetto o un array di oggetti, altrimenti lancia un errore.
 */
export async function FetchDataHTML<T extends JSONObjectOrArray = JSONObjectOrArray>(
    url: string | URL | RequestInfo,
    method: HttpMethod = "GET",
    body: unknown = null,
    abortController: AbortRef
): Promise<T> {
    // Crea l'AbortController se assente (fedele all'originale)
    if (!abortController.current) {
        abortController.current = new AbortController();
    }

    const headers: HeadersInit = {
        "Content-Type": "application/json",
        "Accept-Encoding": "gzip, br",
    };

    const fetchOptions: RequestInit = {
        method,
        headers,
        signal: abortController.current.signal,
        body: body != null && method !== "GET" ? JSON.stringify(body) : undefined,
    };

    // type guards per la validazione runtime
    const isJSONObject = (v: unknown): v is JSONObject =>
        typeof v === "object" && v !== null && !Array.isArray(v);

    const isArrayOfJSONObject = (v: unknown): v is JSONObject[] =>
        Array.isArray(v) && v.every(isJSONObject);

    try {
        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
            throw new Error(`Errore HTTP: ${response.status}`);
        }

        const rawText = await response.text();

        let parsed: unknown;
        try {
            parsed = JSON.parse(rawText);
        } catch {
            throw new Error("Errore nel parsing del JSON.");
        }

        if (isJSONObject(parsed) || isArrayOfJSONObject(parsed)) {
            return parsed as T;
        }

        throw new Error(
            "La risposta non è un array valido di oggetti o un oggetto contenente proprietà."
        );
    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
            throw new Error("La richiesta è stata annullata.");
        }
        if (error instanceof Error) throw error;
        throw new Error(String(error));
    }
}
