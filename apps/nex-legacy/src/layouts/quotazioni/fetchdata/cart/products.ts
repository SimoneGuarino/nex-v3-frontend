import { FetchData } from "examples/Fetch";
import type { MutableRefObject } from "react";
import type { UserState } from "types/UserContext";
import type { CartProductDTO, ContropropostaDTO } from "../../types/qts_product";
import { CreateTextRequestPayload, UpdateQtsProductBodyFE } from "../../hook/useDetailsQuotation";
import { Cap, CAPS } from "authz/caps";

// ——————————————————————————————————————————————————————————
// TYPES
// ——————————————————————————————————————————————————————————
type AbortLike = MutableRefObject<AbortController | null> | AbortController;

export interface AddProductsProps {
    abortController: AbortLike;
    quotationId: string;
    product_id?: string;
    item?: CartProductDTO; // verrà inviato come array puro nel body
    /**
     * Capability resolver provided by useAuthz().
     * Keep this fetch helper hook-free and let the caller inject the current AuthZ runtime.
     */
    hasCap: (cap: Cap | string) => boolean;
    HandleComplete: (payload: AddProductsResponse) => void;
    HandleError: (errorMessage: string) => void;
    ChangeLoadStatus?: (args: { from: string; bool: boolean }) => void;
};

export interface AddProductsResponse {
    msg: string;
    _id?: string;
};

export interface PriceQuotePayload {
    prezzo_base?: string | number | null;
    sconto_percentuale?: string | number | null;
    prezzo_finale?: string | number | null;
    validita_offerta?: string | null; // ISO
    scadenza?: string | null;         // ISO
};

export interface SubstitutionQuotePayload extends ContropropostaDTO { }

type UpdateQtsProductStateAPIParams = {
    abortController: AbortController;
    user: any;                    // stesso tipo che passi a AddProductsToCartAPI (userState)
    quotationId: string;
    idDoc: string;
    body: UpdateQtsProductBodyFE;
    HandleComplete?: (payload?: {
        updatedAt?: string;
        quotationState?: string | null;
        autoCompleted?: boolean;
        quotationValue?: number | null;
    }) => void | Promise<void>;
    HandleError?: (msg: string) => void;
};

type ReassignQtsProductBuyerAPIParams = {
    abortController: AbortController;
    user: any;
    quotationId: string;
    idDoc: string;
    newBuyerCode: string;
    HandleComplete?: () => void | Promise<void>;
    HandleError?: (msg: string) => void;
};

type CreateTextRequestAPIParams = {
    abortController: AbortController;
    quotationId: string;
    payload: CreateTextRequestPayload;
};

export type UpsertCommercialAlternativeSuggestionPayload = {
    product_id: string;
    quantita: number;
    codice_buyer?: string | null;
    note?: string | null;
    dettagli_prodotto: {
        descrizione?: string | null;
        anteprima?: string | null;
        marca?: string | null;
        codiceProduttore?: string | null;
        codiceEAN?: string | null;
        linea?: string | null;
        gruppo?: string | null;
        famiglia?: string | null;
        descrizioneLinea?: string | null;
        descrizioneGruppo?: string | null;
        descrizioneFamiglia?: string | null;
    };
};

type CreateCommercialAlternativeSuggestionAPIParams = {
    abortController: AbortController;
    user: any;
    quotationId: string;
    idDoc: string;
    payload: UpsertCommercialAlternativeSuggestionPayload;
    HandleComplete?: (res?: AddProductsResponse) => void | Promise<void>;
    HandleError?: (msg: string) => void;
};

type DeleteCommercialAlternativeSuggestionAPIParams = {
    abortController: AbortController;
    user: any;
    quotationId: string;
    idDoc: string;
    suggestionId: string;
    HandleComplete?: (res?: AddProductsResponse) => void | Promise<void>;
    HandleError?: (msg: string) => void;
};


// ——————————————————————————————————————————————————————————
// UTILS
// ——————————————————————————————————————————————————————————
const canDoOperation = (hasCap: AddProductsProps["hasCap"]): boolean => {
    /**
     * Creation is a commercial/agent action.
     * Admin mode is intentionally accepted for operational back-office creation flows.
     * Buyer mode alone must not pass this client-side guard.
     */
    return (
        hasCap(CAPS.QUOTAZIONI_AGENT_MODE) ||
        hasCap(CAPS.QUOTAZIONI_ADMIN_MODE)
    );
};

const isObjectId = (v: unknown): v is string =>
    typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v.trim());

const isPositiveInteger = (n: unknown): n is number =>
    typeof n === "number" && Number.isFinite(n) && Math.floor(n) === n && n > 0;


// ——————————————————————————————————————————————————————————
// API FUNCTIONS
// ——————————————————————————————————————————————————————————
/**
 * Aggiunge prodotti al carrello di una quotazione o modifica quelli esistenti in caso di QuoteProductKind "TEXT_REQUEST"
 * @param abortController Controller per abortire la richiesta
 * @param quotationId Id della quotazione
 * @param item Dati del prodotto da aggiungere
 * @param HandleComplete Callback eseguita al completamento con successo
 * @param HandleError Callback eseguita in caso di errore
 * @param ChangeLoadStatus Callback per aggiornare lo stato di caricamento
 * @returns id della riga creata o parametro msg qual'ora fosse una modifica 
 */
export async function AddProductsToCartAPI({
    abortController,
    quotationId,
    item,
    HandleComplete,
    HandleError,
    ChangeLoadStatus,
    hasCap,
}: AddProductsProps): Promise<void> {
    const FROM = "addProductsData";

    try {
        ChangeLoadStatus?.({ from: FROM, bool: true });
        const errors: string[] = [];

        // Capability guard: role/multiRuolo are deprecated.
        // The backend still remains the source of truth; this prevents invalid UI submissions early.
        if (!canDoOperation(hasCap)) {
            HandleError("permesso negato: l’utente non ha la capability per creare quotazioni.");
            return;
        };

        // id quotazione
        if (!isObjectId(quotationId)) {
            HandleError("id quotazione non valido.");
            return;
        };

        // validazione items lato FE (coerente con BE)
        if (!item) {
            HandleError("Si è verificato un errore interno: dati prodotto mancanti.");
            return;
        } else {
            if (!isObjectId(item?.product_id)) errors.push(`id del prodotto non valido`);
            if (!isPositiveInteger(item?.quantita)) errors.push(`la quantità deve essere un intero > 0`);
            if (item?.codice_buyer !== undefined && item?.codice_buyer !== null && String(item.codice_buyer).trim() === "") {
                errors.push(`il codice buyer non può essere stringa vuota`);
            }
        };

        if (errors.length > 0) {
            HandleError(`validazione fallita: ${errors.join("; ")}`);
            return;
        };

        const base = import.meta.env.VITE_API_ORDER ?? "";
        const url = new URL(`${base}quotations/${quotationId}/cart/${item.product_id}`);

        const res = await FetchData<AddProductsResponse>(
            url.toString(),
            "POST",
            item,
            abortController
        );

        HandleComplete(res);
    } catch (err: unknown) {
        const e = err as { name?: string; message?: any };
        if (e?.name !== "AbortError") {
            const backendMsg =
                typeof e?.message === "string"
                    ? e.message
                    : e?.message?.msg || "Errore durante l’inserimento prodotti nel carrello.";
            console.error("[addProductsData] error:", err);
            HandleError(backendMsg);
        }
    } finally {
        ChangeLoadStatus?.({ from: FROM, bool: false });
    };
};

/**
 * Elimina un prodotto dal carrello di una quotazione
 * @param abortController Controller per abortire la richiesta
 * @param quotationId Id della quotazione
 * @param product_id Id del prodotto da eliminare
 * @param HandleComplete Callback eseguita al completamento con successo
 * @param HandleError Callback eseguita in caso di errore
 * @param ChangeLoadStatus Callback per aggiornare lo stato di caricamento
 * @returns messaggio di conferma eliminazione
 */
export async function DeleteProductsToCartAPI({
    abortController,
    quotationId,
    product_id,
    hasCap,
    HandleComplete,
    HandleError,
    ChangeLoadStatus,
}: AddProductsProps): Promise<void> {
    const FROM = "deleteProductsData";

    try {
        ChangeLoadStatus?.({ from: FROM, bool: true });
        const errors: string[] = [];

        // Capability guard: role/multiRuolo are deprecated.
        // The backend still remains the source of truth; this prevents invalid UI submissions early.
        if (!canDoOperation(hasCap)) {
            HandleError("permesso negato: l’utente non ha la capability per creare quotazioni.");
            return;
        };


        // id quotazione
        if (!isObjectId(quotationId)) {
            HandleError("id quotazione non valido.");
            return;
        };

        // validazione items lato FE (coerente con BE)
        if (!product_id || (product_id && product_id.trim() === "") || !isObjectId(product_id)) {
            HandleError("Si è verificato un errore interno: dati prodotto mancanti.");
            return;
        };

        if (errors.length > 0) {
            HandleError(`validazione fallita: ${errors.join("; ")}`);
            return;
        };

        const base = import.meta.env.VITE_API_ORDER ?? "";
        const url = new URL(`${base}quotations/${quotationId}/cart/${product_id}`);

        const res = await FetchData<AddProductsResponse>(
            url.toString(),
            "DELETE",
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
                    : e?.message?.msg || "Errore durante l’inserimento prodotti nel carrello.";
            console.error("[addProductsData] error:", err);
            HandleError(backendMsg);
        }
    } finally {
        ChangeLoadStatus?.({ from: FROM, bool: false });
    };
};

/**
 * Aggiorna lo stato di quotazione di un prodotto nel carrello
 * @param abortController Controller per abortire la richiesta
 * @param quotationId Id della quotazione
 * @param productId Id del prodotto da modificare
 * @param body Corpo della richiesta contenente il nuovo stato e opzionali dati di quotazione o controproposta
 * @param HandleComplete Callback eseguita al completamento con successo
 * @param HandleError Callback eseguita in caso di errore 
 * @returns void
 */
export const ReassignQtsProductBuyerAPI = async ({
    abortController,
    quotationId,
    idDoc,
    newBuyerCode,
    HandleComplete,
    HandleError,
}: ReassignQtsProductBuyerAPIParams): Promise<void> => {
    try {
        if (!quotationId || !idDoc) {
            HandleError?.("Identificativi quotazione/prodotto non validi.");
            return;
        }

        const buyer = String(newBuyerCode ?? "").trim().toUpperCase();
        if (!buyer || buyer.length !== 3) {
            HandleError?.("Seleziona un buyer valido.");
            return;
        }

        const base = import.meta.env.VITE_API_ORDER ?? "";
        const url = new URL(`${base}quotations/${quotationId}/cart/${idDoc}/reassign-buyer`);

        await FetchData(
            url.toString(),
            "POST",
            { newBuyerCode: buyer },
            abortController,
        );

        await HandleComplete?.();
    } catch (err: unknown) {
        const e = err as { name?: string; message?: any };
        if (e?.name !== "AbortError") {
            const backendMsg =
                typeof e?.message === "string"
                    ? e.message
                    : e?.message?.msg || "Errore durante la riassegnazione del buyer.";
            console.error("[ReassignQtsProductBuyerAPI] errore:", err);
            HandleError?.(backendMsg);
        }
    }
};

export const UpdateQtsProductStateAPI = async ({
    abortController,
    user,
    quotationId,
    idDoc,
    body,
    HandleComplete,
    HandleError,
}: UpdateQtsProductStateAPIParams): Promise<void> => {
    try {
        // recupera il token come fai nelle altre API (esempio generico)
        const token: string | undefined =
            user?.token || user?.accessToken || user?.jwt || undefined;

        const base = import.meta.env.VITE_API_ORDER ?? "";
        const url = new URL(`${base}/quotations/${quotationId}/cart/${idDoc}/state`);

        const res = await fetch(
            url.toString(),
            {
                method: "POST",
                signal: abortController.signal,
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(body),
            },
        );

        if (!res.ok) {
            let msg = "Impossibile aggiornare lo stato della quotazione per questo prodotto.";
            try {
                const json = await res.json();
                if (json?.msg) msg = json.msg;
            } catch {
                // ignore parse error
            }
            HandleError?.(msg);
            return;
        };

        let json:
            | {
                updatedAt?: string;
                quotationState?: string | null;
                autoCompleted?: boolean;
                quotationValue?: number | null;
            }
            | undefined;

        try {
            json = await res.json();
        } catch {
            json = undefined;
        }

        await HandleComplete?.(json);
    } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error("[UpdateQtsProductStateAPI] errore:", err);
        HandleError?.(
            "Ops, si è verificato un errore durante il salvataggio della quotazione del prodotto.",
        );
    };
};


export const CreateCommercialAlternativeSuggestionAPI = async ({
    abortController,
    user,
    quotationId,
    idDoc,
    payload,
    HandleComplete,
    HandleError,
}: CreateCommercialAlternativeSuggestionAPIParams): Promise<void> => {
    try {
        const token: string | undefined = user?.token || user?.accessToken || user?.jwt || undefined;

        const base = import.meta.env.VITE_API_ORDER ?? "";
        const url = new URL(`${base}/quotations/${quotationId}/cart/${idDoc}/alternative-suggestions`);

        const res = await fetch(url.toString(), {
            method: "POST",
            signal: abortController.signal,
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            let msg = "Impossibile aggiungere il prodotto tra le alternative suggerite.";
            try {
                const json = await res.json();
                if (json?.msg) msg = json.msg;
            } catch {
                // ignore parse error
            }
            HandleError?.(msg);
            return;
        }

        let json: AddProductsResponse | undefined;
        try {
            json = await res.json();
        } catch {
            json = undefined;
        }

        HandleComplete && (await HandleComplete(json));
    } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error("[CreateCommercialAlternativeSuggestionAPI] errore:", err);
        HandleError?.("Ops, si è verificato un errore durante il salvataggio dell'alternativa commerciale.");
    }
};

export const DeleteCommercialAlternativeSuggestionAPI = async ({
    abortController,
    user,
    quotationId,
    idDoc,
    suggestionId,
    HandleComplete,
    HandleError,
}: DeleteCommercialAlternativeSuggestionAPIParams): Promise<void> => {
    try {
        const token: string | undefined = user?.token || user?.accessToken || user?.jwt || undefined;

        const base = import.meta.env.VITE_API_ORDER ?? "";
        const url = new URL(`${base}/quotations/${quotationId}/cart/${idDoc}/alternative-suggestions/${suggestionId}`);

        const res = await fetch(url.toString(), {
            method: "DELETE",
            signal: abortController.signal,
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });

        if (!res.ok) {
            let msg = "Impossibile rimuovere il prodotto dalle alternative suggerite.";
            try {
                const json = await res.json();
                if (json?.msg) msg = json.msg;
            } catch {
                // ignore parse error
            }
            HandleError?.(msg);
            return;
        }

        let json: AddProductsResponse | undefined;
        try {
            json = await res.json();
        } catch {
            json = undefined;
        }

        HandleComplete && (await HandleComplete(json));
    } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error("[DeleteCommercialAlternativeSuggestionAPI] errore:", err);
        HandleError?.("Ops, si è verificato un errore durante la rimozione dell'alternativa commerciale.");
    }
};

/**
 * Crea una richiesta testuale nel carrello di una quotazione e apri la quotazione
 * @param abortController Controller per abortire la richiesta
 * @param quotationId Id della quotazione
 * @param payload Corpo della richiesta contenente il nuovo stato e opzionali dati di quotazione o controproposta
 * @returns void
 */
export const CreateTextRequestAPI = async ({
    abortController,
    quotationId,
    payload,
}: CreateTextRequestAPIParams): Promise<{ _id: string } | null> => {
    const base = import.meta.env.VITE_API_ORDER ?? "";
    const url = new URL(`${base}quotations/${quotationId}/text-request`);

    return await FetchData<AddProductsResponse>(
        url.toString(),
        "POST",
        payload,
        abortController
    );
}