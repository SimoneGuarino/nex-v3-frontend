// ChunkData.ts
import type { MutableRefObject } from "react";

/** Ref compatibile con React.useRef per l'AbortController */
export type AbortRef = MutableRefObject<AbortController | null>;

/** Metodi HTTP più comuni (lasciamo anche string per massima flessibilità) */
export type HttpMethod =
    | "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD"
    | (string & {}); // permette stringhe custom senza perdere intellisense

/**
 * Esegue una fetch con opzionale body e supporto a risposte chunked.
 * Se la risposta è "chunked", legge lo stream e fa JSON.parse sull'aggregato.
 * @param url - endpoint
 * @param method - metodo HTTP
 * @param body - payload da serializzare in JSON (opzionale)
 * @param abortController - ref a un AbortController esterno
 * @returns Promise con payload tipizzato T
 */
export async function ChunkData<T = unknown, B = unknown>(
    url: string | URL | RequestInfo,
    method: HttpMethod,
    body: B | undefined,
    abortController: AbortRef
): Promise<T> {
    // prepara/aggiorna l'AbortController per questa chiamata
    abortController.current = new AbortController();

    const fetchOptions: RequestInit = {
        method,
        // serializza il body se presente
        body: body !== undefined ? JSON.stringify(body) : undefined,
        // gli header li applichiamo nella fetch per rispecchiare il tuo codice originale
        signal: abortController.current.signal,
    };

    // opzionale: utile in debug come nel tuo codice
    // eslint-disable-next-line no-console
    console.log(fetchOptions);

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Errore nella chiamata Fetch: ${response.statusText}`);
        }

        // Se vogliamo seguire la tua logica originale:
        const transferEncoding = response.headers.get("Transfer-Encoding");

        // Se "chunked" e c'è uno stream leggibile, facciamo manualmente l'aggregazione
        if (transferEncoding?.toLowerCase().includes("chunked") && response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let chunks = "";

            // lettura a loop finché non termina lo stream
            // eslint-disable-next-line no-constant-condition
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks += decoder.decode(value, { stream: true });
            }
            // flush finale del decoder (in caso di multibyte boundary)
            chunks += decoder.decode();

            return JSON.parse(chunks) as T;
        }

        // fallback standard: JSON classico
        // (gestisce anche il caso response.body === null)
        return (await response.json()) as T;
    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
            throw new Error("Richiesta annullata");
        }
        if (error instanceof Error) throw error;
        throw new Error(String(error));
    }
}
