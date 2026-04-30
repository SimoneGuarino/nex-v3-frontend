// src/layouts/queryAS400/fetchData/getQueries.ts
/**
 * descrizione: fetch delle query AS400. Per default ritorna ciò che fornisce il BE (che già filtra per ruolo).
 *              Opzionalmente può applicare un filtro client-side di sicurezza (clientFilter) coi role_id utente.
 * props:       abortLike, baseUrl?, parseDates?, onComplete(data),
 *              clientFilter?: { roles: number[]; isAdminDev: boolean } (opzionale, default disattivo)
 */
import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";
import type { AbortLike } from "../types";
import {
    normalizeQueriesMany,
    type QueryAS400API,
    type QueryAS400,
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
                    ? "risorsa non trovata"
                    : status === 400
                        ? "richiesta non valida"
                        : fallback);

    enqueueSnackbar(msg, { title: status >= 500 ? "Errore server" : "Ops...", type: "error" });
}

/** filtro client-side opzionale: applica la stessa logica del BE usando i role_id dell’utente */
function filterByRolesClient<T extends { tags?: string[] }>(
    list: T[],
    roles: number[],
    isAdminDev: boolean
): T[] {
    if (isAdminDev) return list;
    const roleSet = new Set(roles.map((n) => String(n)));
    return list.filter((item) => {
        const tags = sanitizeTagsClient((item as any).tags);
        return tags.length === 0 || tags.some((t) => roleSet.has(t));
    });
}

/** GET /queries/get */
export async function LoadQueriesAPI({
    abortLike,
    baseUrl = BASE,
    parseDates = false,
    onComplete,
    clientFilter, // opzionale: { roles, isAdminDev }
}: {
    abortLike: AbortLike;
    baseUrl?: string;
    parseDates?: boolean;
    onComplete: (data: QueryAS400API[] | QueryAS400[] | null) => void;
    clientFilter?: { roles: number[]; isAdminDev: boolean };
}) {
    const url = `${baseUrl}/queries/get`;

    await FetchData<QueryAS400API[]>(url, "GET", null, abortLike)
        .then((data) => {
            // normalizzazione (anche dei tags) se richiesto
            const normalized = parseDates ? normalizeQueriesMany(data) : data;

            // filtro client-side opzionale (il BE già filtra; questo è un safety net)
            const finalData =
                clientFilter && Array.isArray(normalized)
                    ? filterByRolesClient(normalized as any[], clientFilter.roles, clientFilter.isAdminDev)
                    : normalized;

            onComplete(finalData);
        })
        .catch((err) => {
            notifyApiError(err, "errore durante il recupero delle query");
            onComplete(null);
        });
}
