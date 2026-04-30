// src/layouts/sellout/fetchdata/changeStatus.ts
import type { MutableRefObject } from "react";
import { FetchData } from "examples/Fetch";
import type { JSONValue } from "examples/Fetch";

/** Stati ammessi dal backend */
export type Stato = "Approvato" | "Bocciato" | "In Revisione";

/** Payload accettato dalla rotta POST /sellout/change-status */
export type ChangeStatusBody = {
    id: string;                              // ObjectId Mongo (24 hex)
    newStatus: Exclude<Stato, "In Revisione">; // "Approvato" | "Bocciato"
};

/** Struttura risposta equivalente al backend */
export interface ChangeStatusResponse {
    ok: boolean;
    id?: string;
    oldStatus?: Stato;
    newStatus?: Stato;
    mail?: {
        attempted: boolean;
        sent: boolean;
        error?: string;
        to?: string[];
    };
    upload?: {
        attempted: boolean;
        sent: boolean;
        error?: string;
        remote?: { host?: string; path?: string; name?: string };
    };
    error?: string;
}

function getBase(): string {
    const raw = import.meta.env.VITE_API_PDF_READER || "";
    return raw.replace(/\/+$/, "");
}

/** check veloce per ObjectId (24 hex) */
function isObjectIdLike(v: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(String(v || "").trim());
}

/**
 * POST {BASE}/sellout/change-status
 * Cambia stato SOLO per documenti Mongo:
 * - newStatus: "Approvato" | "Bocciato"
 */
export async function fetchChangeSelloutStatus(
    body: ChangeStatusBody,
    abortLike: MutableRefObject<AbortController | null> | AbortController
): Promise<ChangeStatusResponse> {
    if (!body?.id || !isObjectIdLike(body.id)) {
        return { ok: false, error: "id non valido (atteso ObjectId Mongo)" };
    }
    if (body.newStatus !== "Approvato" && body.newStatus !== "Bocciato") {
        return { ok: false, error: 'newStatus non valido. Usa "Approvato" o "Bocciato".' };
    }

    const url = `${getBase()}/sellout/change-status`;

    try {
        const res = await FetchData<ChangeStatusResponse>(
            url,
            "POST",
            (body as unknown) as JSONValue,
            abortLike
        );

        if (!res || typeof res !== "object") {
            return { ok: false, error: "Risposta inattesa dal server." };
        }

        // normalizzazione risposta
        const j = res as any;
        return {
            ok: Boolean(j?.ok),
            id: j?.id,
            oldStatus: j?.oldStatus,
            newStatus: j?.newStatus,
            mail: j?.mail,
            upload: j?.upload,
            error: j?.error,
        };
    } catch (e: any) {
        return { ok: false, error: e?.message || "Errore di rete o server" };
    }
}

/** helper comodi */
export async function approveSellout(
    id: string,
    abortLike: MutableRefObject<AbortController | null> | AbortController
) {
    return fetchChangeSelloutStatus({ id, newStatus: "Approvato" }, abortLike);
}

export async function rejectSellout(
    id: string,
    abortLike: MutableRefObject<AbortController | null> | AbortController
) {
    return fetchChangeSelloutStatus({ id, newStatus: "Bocciato" }, abortLike);
}
