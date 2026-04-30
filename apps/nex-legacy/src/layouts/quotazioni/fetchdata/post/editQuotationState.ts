//src\layouts\quotazioni\fetchdata\agent\cart\addProducts.ts
import { FetchData } from "examples/Fetch";
import { Stato } from "layouts/quotazioni/types/quotations";
import type { MutableRefObject } from "react";
import type { UserState } from "types/UserContext";

// ——————————————————————————————————————————————————————————
// TYPES
// ——————————————————————————————————————————————————————————
type AbortLike = MutableRefObject<AbortController | null> | AbortController;

export interface AddProductsProps {
    abortController: AbortLike;
    user?: UserState | null;
    quotationId: string;
    state: string;
    extraParams?: {
        closed_reason?: string;
    };
    duplicateCheck: {
        setDuplicateModalOpen: (open: boolean) => void;
        setDuplicateCandidates: (candidates: { _id: string; codice?: string; cig?: string; cup?: string; stato?: Stato; created_at?: string }[]) => void;
        pendingOpenRef: MutableRefObject<{ id: string; state: string } | null>;
    };
    HandleComplete: (payload: AddProductsResponse) => void;
    HandleError: (errorMessage: string) => void;
    ChangeLoadStatus?: (args: { from: string; bool: boolean }) => void;
};

export interface AddProductsResponse {
    msg: string;
    _id?: string;
};

// ——————————————————————————————————————————————————————————
// UTILS
// ——————————————————————————————————————————————————————————
// const norm = (s?: string) =>
//     String(s ?? "")
//         .normalize("NFD")
//         // @ts-ignore unicode property escapes
//         .replace(/\p{Diacritic}/gu, "")
//         .trim()
//         .toLowerCase();

// const AGENT_ROLE_NAMES = new Set(["commerciale", "agente", "agent"].map(norm));

// const isAgent = (user?: UserState | null): boolean => {
//     const details: any = user?.details ?? {};
//     if (AGENT_ROLE_NAMES.has(norm(details?.ruolo))) return true;

//     const mr = details?.multiRuolo;
//     if (Array.isArray(mr)) {
//         for (const entry of mr) {
//             if (typeof entry === "string" && AGENT_ROLE_NAMES.has(norm(entry))) return true;
//             if (entry && typeof entry === "object" && AGENT_ROLE_NAMES.has(norm(entry.ruolo))) return true;
//         }
//     }
//     return false;
// };

const isObjectId = (v: unknown): v is string =>
    typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v.trim());

/**
 * Aggiunge prodotti al carrello di una quotazione
 * @param abortController Controller per abortire la richiesta
 * @param quotationId Id della quotazione
 * @param item Dati del prodotto da aggiungere
 * @param HandleComplete Callback eseguita al completamento con successo
 * @param HandleError Callback eseguita in caso di errore
 * @param ChangeLoadStatus Callback per aggiornare lo stato di caricamento
 * @returns id della riga creata o parametro msg qual'ora fosse una modifica 
 */
export async function OpenQuotationAPI({
    abortController,
    quotationId,
    state,
    extraParams,
    duplicateCheck,
    HandleComplete,
    HandleError,
    ChangeLoadStatus,
}: AddProductsProps): Promise<void> {
    const FROM = "editQuotationState";

    try {
        ChangeLoadStatus?.({ from: FROM, bool: true });
        const errors: string[] = [];

        // id quotazione
        if (!isObjectId(quotationId)) {
            HandleError("id quotazione non valido.");
            return;
        };

        // validazione items lato FE (coerente con BE)
        if (!state) {
            HandleError("Si è verificato un errore interno: dati prodotto mancanti.");
            return;
        };

        if (errors.length > 0) {
            HandleError(`validazione fallita: ${errors.join("; ")}`);
            return;
        };

        if (state.startsWith("VALIDAZIONE") && state.endsWith("RIFIUTATA") && !extraParams?.closed_reason) {
            HandleError("Per rifiutare una quotazione è necessario inserire un motivo di rifiuto.");
            return;
        };

        const base = import.meta.env.VITE_API_ORDER ?? "";
        const url = new URL(`${base}quotations/${quotationId}/state`);

        const res = await FetchData<AddProductsResponse>(
            url.toString(),
            "POST",
            { state, ...extraParams },
            abortController
        );

        HandleComplete(res);
    } catch (err: unknown) {
        const e = err as { name?: string; message?: any; };
        if (e?.name !== "AbortError") {
            console.log(e);
            if (e.message.code === "DUPLICATE_QUOTATION") {
                duplicateCheck.setDuplicateCandidates(e.message.duplicates ?? []);
                duplicateCheck.setDuplicateModalOpen(true);
                duplicateCheck.pendingOpenRef.current = { id: quotationId, state };
                return;
            } else {
                const backendMsg =
                    typeof e?.message === "string"
                        ? e.message
                        : e?.message?.msg || "Errore durante l’inserimento prodotti nel carrello.";
                console.error("[addProductsData] error:", err);
                HandleError(backendMsg);
            };
        };
    } finally {
        ChangeLoadStatus?.({ from: FROM, bool: false });
    };
};