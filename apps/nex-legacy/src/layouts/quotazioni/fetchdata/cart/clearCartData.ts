import { FetchData } from "examples/Fetch";
import type { MutableRefObject } from "react";
import type { UserState } from "types/UserContext";

type AbortLike = MutableRefObject<AbortController | null> | AbortController;

export async function clearCartData(params: {
    abortController: AbortLike;
    user?: UserState | null;
    quotationId: string;
    HandleComplete: () => void;
    HandleError: (msg: string) => void;
}) {
    const { abortController, user, quotationId, HandleComplete, HandleError } = params;

    try {
        if (!user?.token) {
            HandleError("Utente non autenticato.");
            return;
        }

        const base = import.meta.env.VITE_API_ORDER ?? "";
        const url = new URL(`${base}quotations/${quotationId}/cart`);

        await FetchData(url.toString(), "DELETE", null, abortController);

        HandleComplete();
    } catch (e: any) {
        const msg =
            typeof e?.message === "string" ? e.message : e?.message?.msg || "Errore durante lo svuotamento del carrello.";
        HandleError(msg);
    }
}
