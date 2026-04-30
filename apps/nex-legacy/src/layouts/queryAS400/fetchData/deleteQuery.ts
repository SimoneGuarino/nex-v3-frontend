//src\layouts\queryAS400\fetchData\deleteQuery.ts
import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";
import type { AbortLike } from "../types";
import type { DestroyQueryResponse } from "../types";

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

/** DELETE /queries/destroy/:id */
export async function DeleteQueryAPI({
    id,
    abortLike,
    baseUrl = BASE,
}: {
    id: string;
    abortLike: AbortLike;
    baseUrl?: string;
}): Promise<DestroyQueryResponse | null> {
    const url = `${baseUrl}/queries/destroy/${encodeURIComponent(id)}`;
    try {
        const data = await FetchData<DestroyQueryResponse>(url, "DELETE", null, abortLike);
        return data;
    } catch (err) {
        notifyApiError(err, "errore durante la cancellazione della query");
        return null;
    }
}
