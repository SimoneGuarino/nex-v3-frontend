import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";

export type DeleteCustomerNoteParams = {
    abortController: AbortController;
    noteId: string;
    body?: Record<string, any>;
    silentErrorToast?: boolean;
};

export type DeleteCustomerNoteResponse = {
    status: boolean;
    operation: string | null;
    noteId: string | null;
};

function apiBase(): string {
    const base = import.meta.env.VITE_API_CUSTOMERSFIDO || "";
    return base.endsWith("/") ? base : `${base}/`;
}

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

export async function deleteCustomerNote({
    abortController,
    noteId,
    body,
    silentErrorToast = false,
}: DeleteCustomerNoteParams): Promise<DeleteCustomerNoteResponse> {
    const normalizedNoteId = String(noteId ?? "").trim();
    if (!normalizedNoteId) {
        const message = "Id nota non valido";
        if (!silentErrorToast) {
            enqueueSnackbar(message, { title: "Ops..", type: "error" });
        }
        throw new Error(message);
    }

    const url = `${apiBase()}customers/report/note-clienti/destroy/${encodeURIComponent(
        normalizedNoteId
    )}`;

    try {
        const response = await FetchData(url, "DELETE", body, abortController);

        return {
            status: Boolean((response as any)?.status),
            operation:
                typeof (response as any)?.operation === "string"
                    ? (response as any).operation
                    : null,
            noteId:
                typeof (response as any)?.noteId === "string" &&
                    String((response as any).noteId).trim()
                    ? String((response as any).noteId).trim()
                    : normalizedNoteId,
        };
    } catch (error: any) {
        if (error?.name === "AbortError") throw error;

        if (!silentErrorToast) {
            enqueueSnackbar(
                errorMessage(error, "Errore durante l'eliminazione della nota cliente"),
                { title: "Ops..", type: "error" }
            );
        }
        throw error;
    }
}

export default deleteCustomerNote;
