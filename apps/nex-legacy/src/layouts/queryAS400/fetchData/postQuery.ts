// src/layouts/queryAS400/fetchData/postQuery.ts
/**
 * descrizione: chiamata POST per creare una nuova query AS400.
 * body accetta titolo, query, descrizione opzionale e tags opzionali (array di role_id come stringhe).
 * se tags è omesso o vuoto, la query è pubblica.
 */
import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";
import type { AbortLike } from "../types";
import {
    normalizeQuery,
    type QueryAS400API,
    type QueryAS400,
    type CreateQueryBody,
    sanitizeTagsClient,
} from "../types";

const BASE = (import.meta.env.VITE_API_REGISTRY || "").replace(/\/+$/, "");

function notifyApiError(err: any, fallback: string) {
    const status = err?.status ?? 0;
    const payload = err?.message;
    const msg =
        (payload && (payload.msg || payload.error || payload.details)) ||
        (status === 401
            ? "non autorizzato (token mancante o invalido)"
            : status === 403
                ? "accesso negato (ruolo insufficiente)"
                : status === 409
                    ? "esiste già una query con questo titolo"
                    : status === 400
                        ? "richiesta non valida"
                        : fallback);

    enqueueSnackbar(msg, { title: status >= 500 ? "Errore server" : "Ops...", type: "error" });
}

/** POST /queries/save */
export async function CreateQueryAPI({
    body,
    abortLike,
    baseUrl = BASE,
    parseDates = false,
}: {
    body: CreateQueryBody; // { titolo, query, descrizione?, tags? }
    abortLike: AbortLike;
    baseUrl?: string;
    parseDates?: boolean;
}): Promise<QueryAS400API | QueryAS400 | null> {
    const url = `${baseUrl}/queries/save`;

    // sanificazione difensiva lato FE (il BE sanifica comunque)
    const payload: CreateQueryBody = {
        titolo: body.titolo,
        query: body.query,
        descrizione: typeof body.descrizione === "string" ? body.descrizione : body.descrizione ?? undefined,
        tags: Array.isArray(body.tags) ? sanitizeTagsClient(body.tags) : undefined,
    };

    try {
        const data = await FetchData<QueryAS400API>(url, "POST", payload, abortLike);
        return parseDates ? normalizeQuery(data) : data;
    } catch (err) {
        notifyApiError(err, "errore durante la creazione della query");
        return null;
    }
}
