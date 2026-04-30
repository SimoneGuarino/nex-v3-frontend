// src/layouts/quotazioni/fetchdata/agent/deleteQuotationData.ts
import { FetchData } from "examples/Fetch";
import { Stato } from "layouts/quotazioni/types/quotations";
import type { MutableRefObject } from "react";
import type { UserState } from "types/UserContext";

type AbortLike = MutableRefObject<AbortController | null> | AbortController;

export interface DeleteQuotationDataProps {
    abortController: AbortLike;
    user?: UserState | null;
    quotationId: string;
    currentStato?: Stato | string;
    HandleComplete: (payload: { _id: string; msg: string }) => void;
    HandleError: (errorMessage: string) => void;
    ChangeLoadStatus?: (args: { from: string; bool: boolean }) => void;
}

const norm = (s?: string) =>
    String(s ?? "")
        .normalize("NFD")
        // @ts-ignore unicode property escapes
        .replace(/\p{Diacritic}/gu, "")
        .trim()
        .toLowerCase();

const AGENT_ROLE_NAMES = new Set(["commerciale", "agente", "agent"].map(norm));

const isAgent = (user?: UserState | null): boolean => {
    const details: any = user?.details ?? {};
    if (AGENT_ROLE_NAMES.has(norm(details?.ruolo))) return true;

    const mr = details?.multiRuolo;
    if (Array.isArray(mr)) {
        for (const entry of mr) {
            if (typeof entry === "string" && AGENT_ROLE_NAMES.has(norm(entry))) return true;
            if (entry && typeof entry === "object" && AGENT_ROLE_NAMES.has(norm(entry.ruolo))) return true;
        }
    }
    return false;
};

const getAgenteId = (user?: UserState | null, override?: string) => {
    if (override && override.trim()) return override.trim();
    const details: any = user?.details ?? {};
    const id = details?._id ?? details?.id;
    return typeof id === "string" && id.trim() ? id.trim() : undefined;
};

const isObjectId = (v: unknown): v is string =>
    typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v.trim());

const upper = (s?: string) => String(s ?? "").trim().toUpperCase();

type BackendResponse = { _id?: string; msg: string };

export async function deleteQuotationData({
    abortController,
    user,
    quotationId,
    currentStato,
    HandleComplete,
    HandleError,
    ChangeLoadStatus,
}: DeleteQuotationDataProps): Promise<void> {
    const FROM = "deleteQuotationData";
    try {
        ChangeLoadStatus?.({ from: FROM, bool: true });

        if (!isAgent(user)) {
            HandleError("permesso negato: l’utente non ha il ruolo agente (Commerciale).");
            return;
        }

        if (!isObjectId(quotationId)) {
            HandleError("id quotazione non valido.");
            return;
        }

        const stato = upper(currentStato);

        // Regola business:
        // - BOZZA  -> hard delete (DELETE)
        // - APERTA -> soft delete (PATCH /cancel)
        // - altri  -> non consentito
        if (stato && stato !== "BOZZA" && stato !== "APERTA") {
            HandleError(`quotazione non eliminabile/annullabile, STATO: ${currentStato}`);
            return;
        }

        const base = import.meta.env.VITE_API_ORDERS ?? import.meta.env.VITE_API_ORDER ?? "";
        const agenteId = getAgenteId(user);
        const body = agenteId ? { agenteId } : null;

        // Se currentStato non è passato, facciamo fallback "prudente":
        // proviamo prima l’annullamento (non tocca i prodotti) e se fallisce, mostriamo l’errore.
        // Consiglio: passa sempre currentStato per evitare ambiguità.
        if (!stato) {
            const urlCancel = new URL(`${base}quotations/${quotationId}/cancel`);
            try {
                const res = await FetchData<BackendResponse>(
                    urlCancel.toString(),
                    "PATCH",
                    body,
                    abortController
                );
                HandleComplete({ _id: res?._id ?? quotationId, msg: res.msg });
                return;
            } catch (err: unknown) {
                const e = err as { name?: string; message?: any };
                if (e?.name === "AbortError") return;

                const backendMsg =
                    typeof e?.message === "string"
                        ? e.message
                        : e?.message?.msg || "Errore durante l’annullamento della quotazione.";
                console.error("[deleteQuotationData] cancel error:", err);
                HandleError(backendMsg);
                return;
            }
        }

        // Branch esplicito in base allo stato noto
        if (stato === "BOZZA") {
            const url = new URL(`${base}quotations/${quotationId}`);
            const res = await FetchData<BackendResponse>(
                url.toString(),
                "DELETE",
                body,
                abortController
            );
            HandleComplete({ _id: res?._id ?? quotationId, msg: res.msg });
            return;
        }

        // stato === "APERTA"
        const url = new URL(`${base}quotations/${quotationId}/cancel`);
        const res = await FetchData<BackendResponse>(
            url.toString(),
            "PATCH",
            body,
            abortController
        );
        HandleComplete({ _id: res?._id ?? quotationId, msg: res.msg });
    } catch (err: unknown) {
        const e = err as { name?: string; message?: any };
        if (e?.name !== "AbortError") {
            const backendMsg =
                typeof e?.message === "string"
                    ? e.message
                    : e?.message?.msg || "Errore durante l’eliminazione/annullamento della quotazione.";
            console.error("[deleteQuotationData] error:", err);
            HandleError(backendMsg);
        }
    } finally {
        ChangeLoadStatus?.({ from: FROM, bool: false });
    }
}
