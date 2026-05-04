import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";

export type GetNoteDetailsParams = {
    abortController: AbortController;
    noteId: string;
};

export type GetNoteDetailsResponse = {
    status: boolean;
    item: Record<string, any>;
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

export async function getNoteDetails({
    abortController,
    noteId,
}: GetNoteDetailsParams): Promise<GetNoteDetailsResponse | null> {
    const normalizedNoteId = String(noteId ?? "").trim();
    if (!normalizedNoteId) {
        const message = "Id nota non valido";
        enqueueSnackbar(message, { title: "Errore", type: "error" });
        return null;
    }

    const url = `${apiBase()}customers/report/note-clienti/detail/${normalizedNoteId}`;

    try {
        const res = await FetchData(url, "GET", undefined, abortController);

        if (res?.status === true && res?.item) {
            return {
                status: true,
                item: res.item,
            };
        }

        const fallback =
            "Sembra che ci sia stato un problema nel retrieving della nota, perfavore contatta un tecnico.";
        const message = errorMessage(res, fallback);
        enqueueSnackbar(message, { title: "Ops..", type: "error" });
        return null;
    } catch (error: any) {
        if (error.name !== "AbortError") {
            console.error(error);
            const fallback =
                "Sembra che ci sia stato un problema nel retrieving della nota, perfavore contatta un tecnico.";
            const message = errorMessage(error, fallback);
            enqueueSnackbar(message, { title: "Errore", type: "error" });
        }
        throw error;
    }
}
