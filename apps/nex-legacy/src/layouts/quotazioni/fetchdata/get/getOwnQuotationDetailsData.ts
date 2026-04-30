import { FetchData } from "examples/Fetch";
import type { MutableRefObject } from "react";
import type { UserState } from "types/UserContext";
import type { QuotazioneDetailsResponse } from "../../types/quotations";

type AbortLike = MutableRefObject<AbortController | null> | AbortController;

export interface GetOwnQuotationDetailsProps {
    abortController: AbortLike;
    user?: UserState | null;
    quotationId: string;
    HandleComplete: (payload: QuotazioneDetailsResponse) => void;
    HandleError: (errorMessage: string) => void;
    ChangeLoadStatus?: (args: { from: string; bool: boolean }) => void;
}

const isObjectId = (v: unknown): v is string =>
    typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v.trim());

export async function getOwnQuotationDetailsData({
    abortController,
    quotationId,
    HandleComplete,
    HandleError,
    ChangeLoadStatus,
}: GetOwnQuotationDetailsProps): Promise<void> {
    const FROM = "getOwnQuotationDetailsData";

    try {
        ChangeLoadStatus?.({ from: FROM, bool: true });

        if (!isObjectId(quotationId)) {
            HandleError("id quotazione non valido.");
            return;
        }

        const base = import.meta.env.VITE_API_ORDER ?? "";
        const url = new URL(`${base}quotations/get/${quotationId}`);

        const res = await FetchData<QuotazioneDetailsResponse>(
            url.toString(),
            "GET",
            null,
            abortController
        );

        HandleComplete(res);
    } catch (err: unknown) {
        const e = err as { name?: string; message?: any };
        if (e?.name !== "AbortError") {
            const backendMsg =
                typeof e?.message === "string"
                    ? e.message
                    : e?.message?.msg || "Errore nel recupero dei dettagli della quotazione.";
            console.error("[getOwnQuotationDetailsData] error:", err);
            HandleError(backendMsg);
        }
    } finally {
        ChangeLoadStatus?.({ from: FROM, bool: false });
    };
};