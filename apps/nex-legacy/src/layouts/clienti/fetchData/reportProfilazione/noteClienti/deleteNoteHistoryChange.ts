import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";

export type DeleteCustomerNoteHistoryChangeParams = {
    abortController: AbortController;
    noteId: string;
    historyIndex: number;
    body?: Record<string, any>;
    silentErrorToast?: boolean;
};

export type DeleteCustomerNoteHistoryChangeResponse = {
    status: boolean;
    operation: string | null;
    noteId: string | null;
    removedIndex: number | null;
    item: Record<string, any> | null;
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

export async function deleteCustomerNoteHistoryChange({
    abortController,
    noteId,
    historyIndex,
    body,
    silentErrorToast = false,
}: DeleteCustomerNoteHistoryChangeParams): Promise<DeleteCustomerNoteHistoryChangeResponse> {
    const normalizedNoteId = String(noteId ?? "").trim();
    if (!normalizedNoteId) {
        const message = "Id nota non valido";
        if (!silentErrorToast) {
            enqueueSnackbar(message, { title: "Ops..", type: "error" });
        }
        throw new Error(message);
    }

    if (!Number.isInteger(historyIndex) || historyIndex < 0) {
        const message = "Indice modifica non valido";
        if (!silentErrorToast) {
            enqueueSnackbar(message, { title: "Ops..", type: "error" });
        }
        throw new Error(message);
    }

    const payload = {
        ...(body || {}),
        operation: "delete-change",
        historyIndex,
    };

    const url = `${apiBase()}customers/report/note-clienti/modifiche/${encodeURIComponent(
        normalizedNoteId
    )}`;

    try {
        const response = await FetchData(url, "PUT", payload, abortController);

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
            removedIndex:
                Number.isInteger((response as any)?.removedIndex) &&
                    Number((response as any).removedIndex) >= 0
                    ? Number((response as any).removedIndex)
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
                errorMessage(error, "Errore durante l'eliminazione della modifica nota"),
                { title: "Ops..", type: "error" }
            );
        }
        throw error;
    }
}

export default deleteCustomerNoteHistoryChange;
