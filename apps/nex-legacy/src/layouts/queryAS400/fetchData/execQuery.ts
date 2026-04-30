//src\layouts\queryAS400\fetchData\execQuery.ts
import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";
import type { AbortLike } from "../types";
import type { ExecAdHocResponse, ExecSavedResponse } from "../types";

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
                    : status === 400
                        ? "richiesta non valida"
                        : fallback);

    enqueueSnackbar(msg, { title: status >= 500 ? "Errore server" : "Ops...", type: "error" });
}

/** POST /queries/exec  (ad-hoc, richiede ruolo admin_dev lato BE) */
export async function ExecAdHocQueryAPI({
    sql,
    abortLike,
    baseUrl = BASE,
}: {
    sql: string;
    abortLike: AbortLike;
    baseUrl?: string;
}): Promise<ExecAdHocResponse | null> {
    const url = `${baseUrl}/queries/exec`;
    try {
        const data = await FetchData<ExecAdHocResponse>(url, "POST", { query: sql }, abortLike);
        return data;
    } catch (err) {
        notifyApiError(err, "errore durante l'esecuzione della query ad-hoc");
        return null;
    }
}

/** POST /queries/exec/:id  (esegue query salvata, basta autenticazione) */
export async function ExecSavedQueryAPI({
    id,
    abortLike,
    baseUrl = BASE,
}: {
    id: string;
    abortLike: AbortLike;
    baseUrl?: string;
}): Promise<ExecSavedResponse | null> {
    const url = `${baseUrl}/queries/exec/${encodeURIComponent(id)}`;
    try {
        const data = await FetchData<ExecSavedResponse>(url, "POST", null, abortLike);
        return data;
    } catch (err) {
        notifyApiError(err, "errore durante l'esecuzione della query salvata");
        return null;
    }
}
