import { FetchData } from "examples/Fetch";
import type { MutableRefObject } from "react";
import type { UserState } from "types/UserContext";
import type { CartProductDTO } from "../../types/qts_product";

// ——————————————————————————————————————————————————————————
// TYPES
// ——————————————————————————————————————————————————————————
type AbortLike = MutableRefObject<AbortController | null> | AbortController;

export interface GetCartDataProps {
    abortController: AbortLike;
    quotationId: string;
    HandleComplete: (payload: { data: CartProductDTO[] }) => void;
    HandleError: (errorMessage: string) => void;
    ChangeLoadStatus?: (args: { from: string; bool: boolean }) => void;
};

// ——————————————————————————————————————————————————————————
// UTILS
// ——————————————————————————————————————————————————————————
const isObjectId = (v: unknown): v is string =>
    typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v.trim());

/**
 * Recupera i dati del carrello per una quotazione specifica.
 * @param abortController Controller per abortire la richiesta
 * @param user Stato utente corrente
 * @param quotationId Id della quotazione
 * @param HandleComplete Callback eseguita al completamento con successo
 * @param HandleError Callback eseguita in caso di errore
 * @param ChangeLoadStatus Callback per aggiornare lo stato di caricamento
 * @returns response con i dati del carrello 
 */
export async function getCartData({
    abortController,
    quotationId,
    HandleComplete,
    HandleError,
    ChangeLoadStatus,
}: GetCartDataProps): Promise<{ data: CartProductDTO[] } | undefined> {
    const FROM = "getCartData";

    try {
        ChangeLoadStatus?.({ from: FROM, bool: true });

        if (!isObjectId(quotationId)) {
            HandleError("id quotazione non valido.");
            return;
        };

        const base = import.meta.env.VITE_API_ORDER ?? "";
        const url = new URL(`${base}quotations/${quotationId}/cart`);

        const res = await FetchData<{ data: CartProductDTO[] }>(
            url.toString(),
            "GET",
            null,
            abortController
        );

        HandleComplete(res);
        return res;
    } catch (err: unknown) {
        const e = err as { name?: string; message?: any };
        if (e?.name !== "AbortError") {
            const backendMsg =
                typeof e?.message === "string"
                    ? e.message
                    : e?.message?.msg || "Errore nel recupero del carrello.";
            console.error("[getCartData] error:", err);
            HandleError(backendMsg);
        }
    } finally {
        ChangeLoadStatus?.({ from: FROM, bool: false });
    };
};