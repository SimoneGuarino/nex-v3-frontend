// src\examples\Fetch\index.ts
import { getAuthToken } from "utils/auth/authToken";
import type { MutableRefObject } from "react";

export type HttpMethod =
    | "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD"
    | (string & {});

type JSONPrimitive = string | number | boolean | null;
export type JSONValue = JSONPrimitive | { [k: string]: JSONValue } | JSONValue[];

type AbortLike = MutableRefObject<AbortController | null> | AbortController;

function ensureController(abortLike: AbortLike): AbortController {
    if (typeof (abortLike as any).current !== "undefined") {
        const ref = abortLike as MutableRefObject<AbortController | null>;
        if (!ref.current) ref.current = new AbortController();
        return ref.current;
    }
    return abortLike as AbortController;
}

/**
 * Fetch JSON + Bearer opzionale (da getAuthToken).
 * - se !ok lancia { status, message } (message prova a leggere JSON o al limite text)
 * - mappa i TypeError in un messaggio user-friendly come in origine
 */
export async function FetchData<T = unknown>(
    url: string | URL | RequestInfo,
    method: HttpMethod,
    body: unknown,
    abortLike: AbortLike
): Promise<any> {
    const controller = ensureController(abortLike);

    const headers: Record<string, string> = {
        "Accept-Encoding": "gzip, br",
    };

    // Aggiungi Content-Type solo se c'è un body (evita errori per richieste senza body)
    if (body != null) {
        headers["Content-Type"] = "application/json";
    }

    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, {
        method,
        headers,
        signal: controller.signal,
        body: body != null ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        let message: unknown = null;
        try {
            message = await res.json();
        } catch {
            try { message = await res.text(); } catch { /* ignore */ }
        }
        throw { status: res.status, message };
    }

    try {
        // lascia che il call site decida il tipo via generico T
        return (await res.json()) as T;
    } catch {
        // se il body non è JSON, meglio lanciare per coerenza
        throw new Error("La risposta non è JSON.");
    }
}
