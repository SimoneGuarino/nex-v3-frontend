// src/components/UI/panels/customerNotes/fetchdata/addNotes.ts
/**
 * descrizione: Client API per creazione note e recupero tipologie note cliente.
 * dipendenze:  `FetchData`, `enqueueSnackbar`.
 */
import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";

export type AddCustomerNoteResponse = {
    status: boolean;
    operation: string | null;
    item: Record<string, any> | null;
};

export type CustomerNoteType = {
    code: string;
    description: string;
};

export type AddCustomerNoteParams = {
    abortController: AbortController;
    customerCode: string | number;
    noteText: string;
    noteType?: string;
    body?: Record<string, any>;
    silentErrorToast?: boolean;
};

export type GetCustomerNoteTypesParams = {
    abortController: AbortController;
    cmp?: string | number;
    silentErrorToast?: boolean;
};

/** Normalizza base URL API garantendo slash finale. */
function apiBase(): string {
    const base = import.meta.env.VITE_API_API_CUSTOMERSFIDO || "";
    return base.endsWith("/") ? base : `${base}/`;
}

/** Costruisce query string filtrando valori null/undefined/vuoti. */
function buildQuery(params: Record<string, string | number | undefined | null>): string {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        const normalized = String(value).trim();
        if (!normalized) continue;
        query.set(key, normalized);
    }
    const text = query.toString();
    return text ? `?${text}` : "";
}

/** Valida input come stringa numerica (codice cliente). */
function asDigitString(value: unknown): string | null {
    const text = String(value ?? "").trim();
    if (!text) return null;
    return /^\d+$/.test(text) ? text : null;
}

/** Estrae un messaggio errore leggibile da formati backend eterogenei. */
function errorMessage(error: any, fallback: string): string {
    const msg = error?.message;

    if (typeof error?.msg === "string" && error.msg.trim()) {
        return error.msg.trim();
    }
    if (typeof msg === "string" && msg.trim()) {
        return msg.trim();
    }
    if (typeof msg?.msg === "string" && msg.msg.trim()) {
        return msg.msg.trim();
    }
    if (typeof msg?.message === "string" && msg.message.trim()) {
        return msg.message.trim();
    }

    return fallback;
}

/**
 * Recupera tipologie note disponibili per company.
 * TODO: separare in un client dedicato tipologie.
 */
export async function getCustomerNoteTypes({
    abortController,
    cmp,
    silentErrorToast = false,
}: GetCustomerNoteTypesParams): Promise<CustomerNoteType[]> {
    const query = buildQuery({ cmp });
    const url = `${apiBase()}customers/report/note-clienti/tipologie/list${query}`;

    try {
        const response = await FetchData(url, "GET", undefined as any, abortController);
        const items = Array.isArray(response) ? response : [];
        const byCode = new Map<string, CustomerNoteType>();

        for (const item of items) {
            const code = String((item as any)?.CODICE ?? (item as any)?.codice ?? "").trim();
            const description = String(
                (item as any)?.DESCRIZIONE ?? (item as any)?.descrizione ?? code
            ).trim();

            if (!code) continue;
            byCode.set(code, { code, description: description || code });
        }

        return Array.from(byCode.values()).sort((a, b) =>
            a.description.localeCompare(b.description, "it")
        );
    } catch (error: any) {
        if (error?.name === "AbortError") throw error;

        if (!silentErrorToast) {
            enqueueSnackbar(
                errorMessage(error, "Errore durante il recupero delle tipologie nota"),
                { title: "Ops..", type: "error" }
            );
        }
        throw error;
    }
}

/**
 * Crea una nuova nota cliente.
 * Effettua validazione client-side minima prima della chiamata API.
 */
export async function addCustomerNote({
    abortController,
    customerCode,
    noteText,
    noteType = "",
    body,
    silentErrorToast = false,
}: AddCustomerNoteParams): Promise<AddCustomerNoteResponse> {
    const customer = asDigitString(customerCode);
    const note = String(noteText ?? "").trim();
    const normalizedNoteType = String(noteType ?? "").trim();

    if (!customer) {
        const message = "Numero cliente non valido";
        if (!silentErrorToast) {
            enqueueSnackbar(message, { title: "Ops..", type: "error" });
        }
        throw new Error(message);
    }

    if (!note) {
        const message = "La nota non puo essere vuota";
        if (!silentErrorToast) {
            enqueueSnackbar(message, { title: "Attenzione", type: "warning" });
        }
        throw new Error(message);
    }

    const payload = {
        ...(body || {}),
        customerCode: customer,
        noteText: note,
        noteType: normalizedNoteType,
    };

    const url = `${apiBase()}customers/report/note-clienti/create/${encodeURIComponent(customer)}`;

    try {
        const response = await FetchData(url, "POST", payload, abortController);

        return {
            status: Boolean((response as any)?.status),
            operation:
                typeof (response as any)?.operation === "string"
                    ? (response as any).operation
                    : null,
            item:
                (response as any)?.item && typeof (response as any).item === "object"
                    ? ((response as any).item as Record<string, any>)
                    : null,
        };
    } catch (error: any) {
        if (error?.name === "AbortError") throw error;

        if (!silentErrorToast) {
            enqueueSnackbar(
                errorMessage(error, "Errore durante il salvataggio della nota cliente"),
                { title: "Ops..", type: "error" }
            );
        }
        throw error;
    }
}

export default addCustomerNote;
