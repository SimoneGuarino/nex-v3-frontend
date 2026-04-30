import { FetchData } from "examples/Fetch";
import type { MutableRefObject } from "react";
import type { UserState } from "types/UserContext";
import type { ProductEventDTO, ProductEventType } from "../../types/qts_product";

// ——————————————————————————————————————————————————————————
// TYPES
// ——————————————————————————————————————————————————————————
type AbortLike = MutableRefObject<AbortController | null> | AbortController;

export interface EditQuotationValidityProps {
    abortController: AbortLike;
    user?: UserState | null;
    quotationId: string;
    payload: {[key: string]: Date | undefined | string}; // es. { fine: Date | undefined }
    HandleComplete: (data: { ok: boolean; event?: ProductEventDTO }) => void;
    HandleError: (msg: string) => void;
    ChangeLoadStatus?: (payload: { from: string; bool: boolean }) => void;
};

// helpers basic
const isObjectId = (v?: string) =>
    typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v ?? "");

// ——————————————————————————————————————————————————————————
// API
// ——————————————————————————————————————————————————————————
export const EditQuotationValidityAPI = async ({
    abortController,
    user,
    quotationId,
    payload,
    HandleComplete,
    HandleError,
    ChangeLoadStatus,
}: EditQuotationValidityProps): Promise<void> => {
    const FROM = "cart_editQuotationValidity";

    try {
        if (!user || !user.details) {
            HandleError("Utente non autenticato.");
            return;
        }

        ChangeLoadStatus?.({ from: FROM, bool: true });

        const errors: string[] = [];
        if (!isObjectId(quotationId)) errors.push("Id quotazione non valido");
        if (!payload || Object.keys(payload).length === 0) errors.push("Payload mancante");

        if (errors.length > 0) {
            HandleError(`Validazione fallita: ${errors.join("; ")}`);
            return;
        }

        const base = import.meta.env.VITE_API_ORDER ?? "";
        const url = new URL(
            `${base}quotations/${quotationId}/range-validity`,
        );

        const res = await FetchData<{ ok: boolean; event?: ProductEventDTO }>(
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
                      "Errore durante il salvataggio della validità della quotazione.";
            console.error("[EditQuotationValidityAPI] error:", err);
            HandleError(backendMsg);
        }
    } finally {
        ChangeLoadStatus?.({ from: FROM, bool: false });
    };
};