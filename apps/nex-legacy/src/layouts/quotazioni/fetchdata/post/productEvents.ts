import { FetchData } from "examples/Fetch";
import type { MutableRefObject } from "react";
import type { UserState } from "types/UserContext";
import type { ProductEventDTO, ProductEventType } from "../../types/qts_product";

// ——————————————————————————————————————————————————————————
// TYPES
// ——————————————————————————————————————————————————————————
type AbortLike = MutableRefObject<AbortController | null> | AbortController;

export interface AddProductEventProps {
    abortController: AbortLike;
    user?: UserState | null;
    quotationId: string;
    idDoc: string;
    event: {
        type: ProductEventType;
        message?: string | null;
        meta?: ProductEventDTO["meta"];
    };
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
export const AddProductEventAPI = async ({
    abortController,
    user,
    quotationId,
    idDoc,
    event,
    HandleComplete,
    HandleError,
    ChangeLoadStatus,
}: AddProductEventProps): Promise<void> => {
    const FROM = "cart_addProductEvent";

    try {
        if (!user || !user.details) {
            HandleError("Utente non autenticato.");
            return;
        }

        ChangeLoadStatus?.({ from: FROM, bool: true });

        const errors: string[] = [];
        if (!isObjectId(quotationId)) errors.push("Id quotazione non valido");
        if (!isObjectId(idDoc)) errors.push("Id prodotto non valido");
        if (!event?.type) errors.push("Tipo evento mancante");

        if (errors.length > 0) {
            HandleError(`Validazione fallita: ${errors.join("; ")}`);
            return;
        }

        const base = import.meta.env.VITE_API_ORDER ?? "";
        const url = new URL(
            `${base}quotations/${quotationId}/cart/${idDoc}/events`,
        );

        const res = await FetchData<{ ok: boolean; event?: ProductEventDTO }>(
            url.toString(),
            "POST",
            {
                type: event.type,
                message: event.message ?? null,
                meta: event.meta ?? null,
            },
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
                      "Errore durante il salvataggio dell’evento prodotto.";
            console.error("[AddProductEventAPI] error:", err);
            HandleError(backendMsg);
        }
    } finally {
        ChangeLoadStatus?.({ from: FROM, bool: false });
    }
};