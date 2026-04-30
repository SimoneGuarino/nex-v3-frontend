// src/layouts/queryAS400/fetchData/updateQuery.ts
/**
 * descrizione: PATCH per aggiornare una query AS400 (titolo/query/descrizione/tags).
 * note su tags:
 *  - omesso  => non viene modificato
 *  - []      => query pubblica
 *  - null    => reset esplicito (il BE lo tratta come [])
 */
import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";
import type { AbortLike } from "../types";
import {
    normalizeQuery,
    type QueryAS400API,
    type QueryAS400,
    type UpdateQueryPatch,
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
                : status === 404
                    ? "query non trovata"
                    : status === 409
                        ? "esiste già una query con questo titolo"
                        : status === 400
                            ? "richiesta non valida"
                            : fallback);

    enqueueSnackbar(msg, { title: status >= 500 ? "Errore server" : "Ops...", type: "error" });
}

/** PATCH /queries/update/:id */
export async function UpdateQueryAPI({
    id,
    patch,
    abortLike,
    baseUrl = BASE,
    parseDates = false,
}: {
    id: string;
    patch: UpdateQueryPatch; // { titolo?, query?, descrizione?, tags?: string[] | null }
    abortLike: AbortLike;
    baseUrl?: string;
    parseDates?: boolean;
}): Promise<QueryAS400API | QueryAS400 | null> {
    const url = `${baseUrl}/queries/update/${encodeURIComponent(id)}`;

    // sanificazione difensiva lato FE per i tags
    const payload: any = { ...patch };
    if (Object.prototype.hasOwnProperty.call(patch, "tags")) {
        if (Array.isArray(patch.tags)) {
            payload.tags = sanitizeTagsClient(patch.tags);
        } else if (patch.tags === null) {
            payload.tags = null; // reset esplicito (BE => [])
        } else {
            delete payload.tags; // undefined: non inviare
        }
    }

    try {
        const data = await FetchData<QueryAS400API>(url, "PATCH", payload, abortLike);
        return parseDates ? normalizeQuery(data) : data;
    } catch (err) {
        notifyApiError(err, "errore durante l'aggiornamento della query");
        return null;
    }
}
