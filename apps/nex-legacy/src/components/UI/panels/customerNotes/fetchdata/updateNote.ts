/**
 * descrizione: Client API per aggiungere modifiche alla discussione nota cliente.
 * dipendenze:  `FetchData`, `enqueueSnackbar`.
 */
import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";
import type { AddCustomerNoteResponse } from "./addNotes";

export type UpdateCustomerNoteParams = {
    abortController: AbortController;
    customerCode: string | number;
    noteText: string;
    noteId?: string;
    body?: Record<string, any>;
    silentErrorToast?: boolean;
};

/** Normalizza base URL API garantendo slash finale. */
function apiBase(): string {
    const base = import.meta.env.VITE_API_API_CUSTOMERSFIDO || "";
    return base.endsWith("/") ? base : `${base}/`;
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
 * Salva una nuova modifica su una nota esistente.
 * Se `noteId` e vuoto, usa endpoint modifiche "generico" (compatibilita legacy).
 */
export async function updateCustomerNote({
    abortController,
    customerCode,
    noteText,
    noteId = "",
    body,
    silentErrorToast = false,
}: UpdateCustomerNoteParams): Promise<AddCustomerNoteResponse> {
    const customer = asDigitString(customerCode);
    const note = String(noteText ?? "").trim();
    const normalizedNoteId = String(noteId ?? "").trim();

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
    };

    const suffix = normalizedNoteId ? `/${encodeURIComponent(normalizedNoteId)}` : "";
    const url = `${apiBase()}customers/report/note-clienti/modifiche${suffix}`;

    try {
        const response = await FetchData(url, "PUT", payload, abortController);

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
                errorMessage(error, "Errore durante il salvataggio della modifica nota cliente"),
                { title: "Ops..", type: "error" }
            );
        }
        throw error;
    }
}

export default updateCustomerNote;
