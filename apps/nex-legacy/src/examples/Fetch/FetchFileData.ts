// src\examples\Fetch\FetchFileData.ts
import type { MutableRefObject } from "react";
import { getAuthToken } from "utils/auth/authToken";

export type AbortRef = MutableRefObject<AbortController | null>;

export type HttpMethod =
    | "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD"
    | (string & {}); // consente stringhe custom

// Tipi JSON di comodo per il risultato
type JSONPrimitive = string | number | boolean | null;
export type JSONValue = JSONPrimitive | { [key: string]: JSONValue } | JSONValue[];

/**
 * Esegue una fetch per upload/download file (usa body “grezzo”: FormData/Blob/…),
 * e ritorna la risposta come JSON.
 * Ricrea SEMPRE un nuovo AbortController (comportamento fedele all’originale).
 * @deprecated Usare FetchFileDataV2 che ritorna un risultato tipizzato per file/json
 */
export async function FetchFileData<T extends JSONValue = JSONValue>(
    url: string | URL | RequestInfo,
    method: HttpMethod,
    body: BodyInit | null | undefined,
    abortController: AbortRef
): Promise<T> {
    // fedele all'originale: sempre nuovo controller
    abortController.current = new AbortController();

    const fetchOptions: RequestInit = {
        method,
        signal: abortController.current.signal,
        // NON impostiamo Content-Type: se è FormData lo setta automaticamente il browser
        body: body ?? undefined,
    };

    const token = getAuthToken();
    if (token) fetchOptions.headers = { Authorization: `Bearer ${token}` };

    try {
        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
            throw new Error(`Errore nella chiamata Fetch: ${response.statusText}`);
        }

        const data = (await response.json()) as T;
        return data;
    } catch (error) {
        // gestione Abort fedele
        if (error instanceof DOMException && error.name === "AbortError") {
            throw new Error("Richiesta annullata");
        }
        if (error instanceof Error) throw error;
        throw new Error(String(error));
    }
}
