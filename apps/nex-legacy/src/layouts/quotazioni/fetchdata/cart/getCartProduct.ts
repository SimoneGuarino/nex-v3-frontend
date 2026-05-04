import { FetchData } from "examples/Fetch";
import type { MutableRefObject } from "react";
import type { CartProductDTO } from "../../types/qts_product";

// ——————————————————————————————————————————————————————————
// TYPES
// ——————————————————————————————————————————————————————————
type AbortLike = MutableRefObject<AbortController | null> | AbortController;

export interface GetCartDataProps {
    abortController: AbortLike;
    quotationId: string;
    _id: string;
    isProduct?: boolean;
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
 * @param HandleError Callback eseguita in caso di errore
 * @param ChangeLoadStatus Callback per aggiornare lo stato di caricamento
 * @returns response con i dati del carrello 
 */
export async function getCartProduct({
    abortController,
    quotationId,
    _id,
    isProduct,
    HandleError,
    ChangeLoadStatus,
}: GetCartDataProps): Promise<{ data: CartProductDTO } | undefined> {
    const FROM = "getCartData";

    try {
        ChangeLoadStatus?.({ from: FROM, bool: true });

        if (!isObjectId(quotationId)) {
            HandleError("id quotazione non valido.");
            return;
        };

        const base = import.meta.env.VITE_API_ORDER ?? "";
        const url = new URL(`${base}quotations/${quotationId}/cart/${_id}?kind=${isProduct ? "PRODUCT" : "TEXT_REQUEST"}`);

        const res = await FetchData<{ data: CartProductDTO[] }>(
            url.toString(),
            "GET",
            null,
            abortController
        );

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