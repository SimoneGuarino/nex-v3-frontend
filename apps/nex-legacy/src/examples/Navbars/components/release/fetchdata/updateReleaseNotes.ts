//src\examples\Navbars\components\release\fetchdata\updateReleaseNotes.ts
import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch/index";
import type { MutableRefObject } from "react";

export type TagRN = "Correzioni" | "Aggiunte" | "Miglioramenti" | "Rimozioni" | "Release";
export type VisibilitaRN = "Pubblico" | "Bozza";

export interface ReleaseNoteAPI {
    id: string;
    titolo: string;
    versione: string;
    descrizione: string | null;
    dataCreazione: string;             // ISO
    dataUltimaModifica: string | null; // ISO
    tags: TagRN;
    visibilita: VisibilitaRN;
    targetUtenti: string[];
    contenuto: string;                 // html
}

export interface ReleaseNote
    extends Omit<ReleaseNoteAPI, "dataCreazione" | "dataUltimaModifica"> {
    dataCreazione: Date;
    dataUltimaModifica: Date | null;
}

type AbortLike = AbortController | MutableRefObject<AbortController | null>;

const BASE = (import.meta.env.VITE_API_USERS || "").replace(/\/+$/, "");

export function normalizeReleaseNoteDates(api: any): ReleaseNote {
    const id =
        api.id ??
        (typeof api._id === "string" ? api._id : api._id?.$oid);

    return {
        ...api,
        id: String(id ?? ""), // <-- id sempre stringa
        dataCreazione: new Date(api.dataCreazione),
        dataUltimaModifica: api.dataUltimaModifica ? new Date(api.dataUltimaModifica) : null,
        targetUtenti: Array.isArray(api.targetUtenti)
            ? api.targetUtenti
            : api.targetUtenti
                ? [api.targetUtenti]
                : [],
    };
}


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
                    ? "release note non trovata"
                    : status === 400
                        ? "richiesta non valida"
                        : fallback);

    enqueueSnackbar(msg, {
        title: status >= 500 ? "Errore server" : "Ops...",
        type: "error",
    });
}

/** PATCH /release_notes/:id/visibilita */
export async function UpdateReleaseNoteVisibilitaAPI({
    id,
    nextVisibilita,
    abortLike,
    baseUrl = BASE,
    parseDates = false,
}: {
    id: string;
    nextVisibilita: VisibilitaRN;
    abortLike: AbortLike;
    baseUrl?: string;
    parseDates?: boolean;
}): Promise<ReleaseNoteAPI | ReleaseNote | null> {
    const url = `${baseUrl}/release_notes/${encodeURIComponent(id)}/visibilita`;
    try {
        const data = await FetchData<ReleaseNoteAPI>(url, "PATCH", { visibilita: nextVisibilita }, abortLike);
        return parseDates ? normalizeReleaseNoteDates(data) : data;
    } catch (err) {
        notifyApiError(err, "errore durante l’aggiornamento della visibilità");
        return null;
    }
}

/** POST /release_notes/:id/toggle */
export async function ToggleReleaseNoteVisibilitaAPI({
    id,
    abortLike,
    baseUrl = BASE,
    parseDates = false,
}: {
    id: string;
    abortLike: AbortLike;
    baseUrl?: string;
    parseDates?: boolean;
}): Promise<ReleaseNoteAPI | ReleaseNote | null> {
    const url = `${baseUrl}/release_notes/${encodeURIComponent(id)}/toggle`;
    try {
        const data = await FetchData<ReleaseNoteAPI>(url, "POST", null, abortLike);
        return parseDates ? normalizeReleaseNoteDates(data) : data;
    } catch (err) {
        notifyApiError(err, "errore durante il toggle della visibilità");
        return null;
    }
}
