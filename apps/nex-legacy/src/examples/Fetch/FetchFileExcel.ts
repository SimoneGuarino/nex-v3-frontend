// FetchFileExcel.ts
import type { MutableRefObject } from "react";

export type AbortRef = MutableRefObject<AbortController | null>;

export type HttpMethod =
    | "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD"
    | (string & {});

// JSON helpers
type JSONPrimitive = string | number | boolean | null;
export type JSONValue = JSONPrimitive | { [key: string]: JSONValue } | JSONValue[];

/**
 * Effettua una fetch con header di accettazione Excel.
 * (Comportamento fedele: effettua `response.json()` e ritorna JSON.)
 */
export async function FetchFileExcel<T extends JSONValue = JSONValue>(
    url: string | URL | RequestInfo,
    method: HttpMethod,
    body: unknown,
    abortController: AbortRef
): Promise<T> {
    // fedele all’originale: ricrea sempre un nuovo AbortController
    abortController.current = new AbortController();

    const headers: Record<string, string> = {
        Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Accept-Encoding": "gzip, br",
    };
    // come nell’originale: serializza sempre se body esiste
    if (body != null) {
        headers["Content-Type"] = "application/json";
    }

    const fetchOptions: RequestInit = {
        method,
        headers,
        signal: abortController.current.signal,
        body: body != null ? JSON.stringify(body) : undefined,
    };

    try {
        const response = await fetch(url, fetchOptions);
        if (!response.ok) {
            throw new Error(`Errore nella chiamata Fetch: ${response.statusText}`);
        }
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
