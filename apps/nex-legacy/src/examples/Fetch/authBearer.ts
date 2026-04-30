// AuthBearer.ts
import type { MutableRefObject } from "react";

/** Ref compatibile con React.useRef per l'AbortController */
export type AbortRef = MutableRefObject<AbortController | null>;

/** Minimo necessario dal tuo userContext */
export interface AuthUserContext {
    token: string;
}

/**
 * Esegui una fetch autenticata con Bearer token.
 * @param url - endpoint della richiesta
 * @param userContext - contiene il token JWT
 * @param abortController - ref che ospita l'AbortController usato da questa chiamata
 * @returns Promise con payload tipizzato T (default: unknown)
 */
export async function AuthBearer<T = unknown>(
    url: string | URL | RequestInfo,
    userContext: AuthUserContext,
    abortController: AbortRef
): Promise<T> {
    // crea (o rimpiazza) l'AbortController per questa invocazione
    abortController.current = new AbortController();

    const fetchOptions: RequestInit = {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userContext.token}`,
        },
        signal: abortController.current.signal,
    };

    try {
        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
            throw new Error(`Errore nella chiamata Fetch: ${response.statusText}`);
        }

        // In caso di 204 No Content, evita di chiamare .json()
        if (response.status === 204) {
            return undefined as T;
        }

        // Nota: il cast a T è necessario perché la shape del payload la decidi tu
        const data = (await response.json()) as T;
        return data;
    } catch (error) {
        // Gestione specifica per abort
        if (error instanceof DOMException && error.name === "AbortError") {
            throw new Error("Richiesta annullata");
        }
        // Rilancia errori “normali”
        if (error instanceof Error) throw error;
        throw new Error(String(error));
    }
}
