import { FetchData } from "examples/Fetch";
import type { MutableRefObject } from "react";
import type { UserState } from "types/UserContext";

type AbortLike = MutableRefObject<AbortController | null> | AbortController;

export interface EditQuotationCustomerProps {
    abortController: AbortLike;
    user?: UserState | null;
    quotationId: string;
    payload: { cliente: string };
    HandleComplete: (data: { msg?: string; cliente?: string }) => void;
    HandleError: (msg: string) => void;
    ChangeLoadStatus?: (payload: { from: string; bool: boolean }) => void;
}

const isObjectId = (v?: string) =>
    typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v ?? "");

/**
 * Aggiorna il codice cliente della quotazione.
 * Questa API serve a sostituire il placeholder BID_PASSIVO con un cliente reale
 * prima della chiusura definitiva della quotazione.
 * Le regole di sicurezza/business (solo proprietario, solo BID_PASSIVO, una sola volta)
 * sono validate lato backend nella rotta PATCH /quotations/:id/customer.
 */
export const EditQuotationCustomerAPI = async ({
    abortController,
    user,
    quotationId,
    payload,
    HandleComplete,
    HandleError,
    ChangeLoadStatus,
}: EditQuotationCustomerProps): Promise<void> => {
    const FROM = "quotation_editCustomer";

    try {
        if (!user || !user.details) {
            HandleError("Utente non autenticato.");
            return;
        }

        ChangeLoadStatus?.({ from: FROM, bool: true });

        const errors: string[] = [];
        if (!isObjectId(quotationId)) errors.push("Id quotazione non valido");
        if (!payload?.cliente || !String(payload.cliente).trim()) errors.push("Codice cliente obbligatorio");

        if (errors.length > 0) {
            HandleError(`Validazione fallita: ${errors.join("; ")}`);
            return;
        }

        const base = import.meta.env.VITE_API_ORDER ?? "";
        const url = new URL(`${base}quotations/${quotationId}/customer`);

        const res = await FetchData<{ msg?: string; cliente?: string }>(
            url.toString(),
            "PATCH",
            payload,
            abortController,
        );

        HandleComplete(res);
    } catch (err: unknown) {
        const e = err as { name?: string; message?: any };
        if (e?.name !== "AbortError") {
            const backendMsg =
                typeof e?.message === "string"
                    ? e.message
                    : e?.message?.msg ||
                    "Errore durante l'aggiornamento del cliente della quotazione.";
            console.error("[EditQuotationCustomerAPI] error:", err);
            HandleError(backendMsg);
        }
    } finally {
        ChangeLoadStatus?.({ from: FROM, bool: false });
    }
};
