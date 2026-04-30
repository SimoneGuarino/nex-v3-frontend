import type { MutableRefObject } from "react";
import { getAuthToken } from "utils/auth/authToken";

export type AbortRef = MutableRefObject<AbortController | null>;

export type HttpMethod =
    | "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD"
    | (string & {});

// Tipi JSON di comodo
type JSONPrimitive = string | number | boolean | null;
export type JSONValue = JSONPrimitive | { [key: string]: JSONValue } | JSONValue[];

// --- Nuovo: risultato tipizzato per file/json ---
export type FetchFileResult<TJson = JSONValue> =
    | { kind: "blob"; blob: Blob; filename?: string | null; contentType: string }
    | { kind: "json"; json: TJson; contentType: string };

// --- Opzioni estese ---
export type FetchFileOptions = {
    method?: HttpMethod;
    body?: BodyInit | null | undefined; // FormData / Blob / string / ecc.
    headers?: Record<string, string>;
    abortRef?: AbortRef;
    // Se non specificato: auto (decide con Content-Type)
    responseType?: "auto" | "json" | "blob";
    // Se true, non imposta Authorization
    skipAuth?: boolean;
    // Se necessario esporre header (es. Content-Disposition)
    credentials?: RequestCredentials; // "include" per cookie cross-site
};

function parseFilenameFromHeader(cd?: string | null): string | null {
    if (!cd) return null;
    // es: attachment; filename="02_10_2025_elaborato.csv"  |  filename*=UTF-8''02_10_2025_elaborato.csv
    const m = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(cd);
    return m ? decodeURIComponent(m[1]) : null;
}

/**
 * Esegue una fetch per upload/download file gestendo automaticamente JSON o BLOB.
 * - Non forza Content-Type quando il body è FormData (lascia boundary al browser).
 * - Aggiunge Authorization se disponibile (salvo skipAuth).
 * - Ritorna FetchFileResult: { kind: "blob" | "json", ... }.
 */
export async function FetchFileData<TJson = JSONValue>(
    url: string,
    {
        method = "POST",
        body,
        headers,
        abortRef,
        responseType = "auto",
        skipAuth = false,
        credentials,
    }: FetchFileOptions = {}
): Promise<FetchFileResult<TJson>> {
    const controller = new AbortController();
    if (abortRef) abortRef.current = controller;

    const baseHeaders: Record<string, string> = {
        Accept: "*/*", // lasciamo auto-negotiation
        ...(headers || {}),
    };

    // Non impostare Content-Type se body è FormData (il browser aggiunge boundary)
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    if (isFormData) {
        // rimuovi eventuale Content-Type passato dall'utente
        if ("Content-Type" in baseHeaders) delete baseHeaders["Content-Type"];
    } else {
        // lascialo decidere all'utente; se non c'è, va bene così
    }

    // Auth
    if (!skipAuth) {
        const token = getAuthToken?.();
        if (token) baseHeaders.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        method,
        body,
        headers: baseHeaders,
        signal: controller.signal,
        credentials, // es. "include"
    });

    if (!response.ok) {
        // prova a leggere JSON di errore
        const ct = response.headers.get("Content-Type") || "";
        if (ct.includes("application/json")) {
            try {
                const j = await response.json();
                throw new Error(j?.msg || `${response.status} ${response.statusText}`);
            } catch {
                throw new Error(`${response.status} ${response.statusText}`);
            }
        }
        throw new Error(`${response.status} ${response.statusText}`);
    }

    // Decidi in base a responseType o Content-Type
    const contentType = response.headers.get("Content-Type") || "";
    const contentDisp = response.headers.get("Content-Disposition");
    const filename = parseFilenameFromHeader(contentDisp);

    if (responseType === "blob" || (responseType === "auto" && !contentType.includes("application/json"))) {
        const blob = await response.blob();
        return { kind: "blob", blob, filename, contentType };
    }

    // json esplicito o auto con application/json
    const json = (await response.json()) as TJson;
    return { kind: "json", json, contentType };
}
