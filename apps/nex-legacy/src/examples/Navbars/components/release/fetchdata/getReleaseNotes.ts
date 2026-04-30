//src\examples\Navbars\components\release\fetchdata\getReleaseNotes.ts
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
    anteprima?: string | null;
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


export function normalizeReleaseNotesDatesMany(apiList: ReleaseNoteAPI[]): ReleaseNote[] {
    return apiList.map(normalizeReleaseNoteDates);
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
                    ? "risorsa non trovata"
                    : status === 400
                        ? "richiesta non valida"
                        : fallback);

    enqueueSnackbar(msg, {
        title: status >= 500 ? "Errore server" : "Ops...",
        type: "error",
    });
}

/** GET /release_notes/pubbliche/:id */
export async function LoadReleaseNotePubblicaAPI({
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
    const url = `${baseUrl}/release_notes/pubbliche/${encodeURIComponent(id)}`;
    try {
        const data = await FetchData<ReleaseNoteAPI>(url, "GET", null, abortLike);
        return parseDates ? normalizeReleaseNoteDates(data) : data;
    } catch (err) {
        notifyApiError(err, "errore durante il recupero della release note pubblica");
        return null;
    }
}

/** GET /release_notes/bozze/:id */
export async function LoadReleaseNoteBozzaAPI({
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
    const url = `${baseUrl}/release_notes/bozze/${encodeURIComponent(id)}`;
    try {
        const data = await FetchData<ReleaseNoteAPI>(url, "GET", null, abortLike);
        return parseDates ? normalizeReleaseNoteDates(data) : data;
    } catch (err) {
        notifyApiError(err, "errore durante il recupero della release note in bozza");
        return null;
    }
}

/** GET /release_notes/pubbliche */
export async function LoadReleaseNotesPubblicheAPI({
    abortLike,
    baseUrl = BASE,
    parseDates = false,
    onComplete,
}: {
    abortLike: AbortLike;
    baseUrl?: string;
    parseDates?: boolean;
    onComplete: (data: ReleaseNoteAPI[] | ReleaseNote[] | null) => void;
}) {
    const url = `${baseUrl}/release_notes/pubbliche`;
    await FetchData<ReleaseNoteAPI[]>(url, "GET", null, abortLike).then(data => {
        return onComplete(parseDates ? normalizeReleaseNotesDatesMany(data) : data);
    }).catch((err: any) => {
        notifyApiError(err, "errore durante il recupero delle release notes in bozza");
        onComplete(null);
    });
}

/** GET /release_notes/bozze */
export async function LoadReleaseNotesBozzeAPI({
    abortLike,
    baseUrl = BASE,
    parseDates = false,
    onComplete,
}: {
    abortLike: AbortLike;
    baseUrl?: string;
    parseDates?: boolean;
    onComplete: (data: ReleaseNoteAPI[] | ReleaseNote[] | null) => void;
}) {
    const url = `${baseUrl}/release_notes/bozze`;
    await FetchData<ReleaseNoteAPI[]>(url, "GET", null, abortLike).then(data => {
        return onComplete(parseDates ? normalizeReleaseNotesDatesMany(data) : data);
    }).catch((err: any) => {
        notifyApiError(err, "errore durante il recupero delle release notes in bozza");
        onComplete(null);
    });
}

// Caricara la singola release note piu recente pubblica
export async function LoadLatestReleaseNoteAPI({
    abortLike,
    baseUrl = BASE,
    onComplete,
    onError,
}: {
    abortLike: AbortLike;
    baseUrl?: string;
    onComplete: (data: ReleaseNoteAPI | null) => void;
    onError: (error: any) => void;
}) {
    const url = `${baseUrl}/release_notes/latest`;
    await FetchData<ReleaseNoteAPI>(url, "GET", null, abortLike).then((data: ReleaseNoteAPI) => {
        return onComplete(data);
    }).catch((err: any) => {
        onError(err);
        notifyApiError(err, "errore durante il recupero della release notes più recenti");
    });
}
