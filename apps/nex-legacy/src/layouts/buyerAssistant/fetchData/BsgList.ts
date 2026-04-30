import { FetchData } from "examples/Fetch";
import { enqueueSnackbar } from "components/MessageBox";
import { BsgItem, GeneralAPIProps } from "../types/types";


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
export type BsgResponse = {
    success: boolean;
    data?: BsgItem[];
    message?: string;
}

type GetBsgAPIProps = {
    abortController: AbortController;
    setData: (data: BsgItem[]) => void;
    setLoading?: (loading: boolean) => void;
};

type CreateBsgResponse = {
    success: boolean;
    message?: string;
    data?: BsgItem;
    // prendi solo codice_fornitore e bsg_tipologia_testo da BsgItem in Typescript
    key?: Pick<BsgItem, "codice_fornitore" | "bsg_tipologia_testo">;
};

type GeneralBsgAPIProps = GeneralAPIProps & {
    payload: BsgItem;
    onSuccess?: (item: BsgItem) => void;
};

type UpdateBsgResponse = {
    success: boolean;
    message?: string;
    data?: BsgItem;
};


// ——————————————————————————————————————————————————————————
// API 
// ——————————————————————————————————————————————————————————
/**
 * recupera la lista dei BSG
 * @param abortController - AbortController used to cancel the request
 * @param setData - callback to receive array of BsgItem
 * @param setLoading - optional setter to toggle loading state
 * @returns Promise<void>
 */
export async function GetBsgAPI({
    abortController,
    setData,
    setLoading,
}: GetBsgAPIProps): Promise<void> {
    try {
        setLoading?.(true);

        const url = `${import.meta.env.VITE_API_SEARCH_ENDPOINT}noPromo/bsg`;

        const res = await FetchData<BsgResponse>(url, "GET", null, abortController);

        if (res?.success && Array.isArray(res.data)) {
            setData(res.data);
        } else {
            setData([]);
        }
    } catch (error: any) {
        if (error?.name === "AbortError") return;

        const status = error?.status;
        let msg = "Errore nel recuperare le BSG.";

        if (status === 403) {
            msg = "Non hai i permessi per visualizzare le BSG.";
        } else if (status === 404) {
            msg = "Nessuna BSG trovata.";
        } else if (error?.message || error?.msg) {
            msg = error.message || error.msg;
        }

        enqueueSnackbar(msg, { title: "Errore", type: "error" });
        setData([]);
    } finally {
        setLoading?.(false);
    }
};

/**
 * Crea un nuovo record di BSG
 * @param abortController - controller to cancel the request
 * @param payload - BsgItem ({ codice_fornitore, bsg_tipologia_testo, bsg_testo })
 * @param onSuccess - callback invoked with created BsgItem
 * @param onError - optional error callback
 * @param setLoading - optional loading setter
 * @returns Promise<void>
 */
export async function CreateBsgAPI({
    abortController,
    payload,
    onSuccess,
    onError,
    setLoading,
}: GeneralBsgAPIProps): Promise<void> {
    try {
        setLoading?.(true);

        const url = `${import.meta.env.VITE_API_SEARCH_ENDPOINT}noPromo/bsg`;

        const res = await FetchData<CreateBsgResponse>(url, "POST", payload, abortController);

        if (res?.success && res.data) {
            enqueueSnackbar("BSG creato con successo", { title: "Successo", type: "success" });
            onSuccess?.(res.data);
        } else {
            throw { message: res?.message || "Errore nella creazione del BSG" };
        }
    } catch (error: any) {
        if (error?.name === "AbortError") return;

        const status = error?.status;
        let msg = "Errore nella creazione del BSG.";

        if (status === 400) {
            msg = "Dati non validi. Verifica i campi inseriti.";
        } else if (status === 403) {
            msg = "Non hai i permessi per creare BSG per questo fornitore.";
        } else if (status === 409) {
            msg = "Esiste già un BSG con questa combinazione fornitore/tipologia.";
        } else if (error?.message || error?.msg) {
            msg = error.message || error.msg;
        }

        enqueueSnackbar(msg, { title: "Errore", type: "error" });
        onError?.(error);
    } finally {
        setLoading?.(false);
    }
};

/**
 * aggiorna un BSG esistente
 * @param abortController - controller to cancel the request
 * @param payload - UpdateBsgPayload
 * @param onSuccess - callback invoked with updated BsgItem
 * @param onError - optional error callback
 * @param setLoading - optional loading setter
 * @returns Promise<void>
 */
export async function UpdateBsgAPI({
    abortController,
    payload,
    onSuccess,
    onError,
    setLoading,
}: GeneralBsgAPIProps): Promise<void> {
    try {
        setLoading?.(true);

        const url = `${import.meta.env.VITE_API_SEARCH_ENDPOINT}noPromo/bsg`;

        const res = await FetchData<UpdateBsgResponse>(url, "PATCH", payload, abortController);

        if (res?.success && res.data) {
            enqueueSnackbar("BSG aggiornato con successo", { title: "Successo", type: "success" });
            onSuccess?.(res.data);
        } else {
            throw { message: res?.message || "Errore nell'aggiornamento del BSG" };
        }
    } catch (error: any) {
        if (error?.name === "AbortError") return;

        const status = error?.status;
        let msg = "Errore nell'aggiornamento del BSG.";

        if (status === 400) {
            msg = "Dati non validi. Verifica i campi inseriti.";
        } else if (status === 403) {
            msg = "Non hai i permessi per modificare questo BSG.";
        } else if (status === 404) {
            msg = "BSG non trovato.";
        } else if (error?.message || error?.msg) {
            msg = error.message || error.msg;
        }

        enqueueSnackbar(msg, { title: "Errore", type: "error" });
        onError?.(error);
    } finally {
        setLoading?.(false);
    }
};