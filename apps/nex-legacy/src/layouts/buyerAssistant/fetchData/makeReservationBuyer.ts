import { FetchData } from "examples/Fetch";
import { enqueueSnackbar } from "components/MessageBox";
import { GeneralAPIProps } from "../types/types";


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
export type ReservationBuyerPayload = {
    buyer?: string;
    orizz_temporale: number;
}

export type ReservationBuyerResult = {
    buyer: string;
    orizz_temporale: number;
    data_esecuzione: string;
    productsFound: number;
    totalInserted: number;
    totalUpdated: number;
    totalSkipped: number;
}

export type ReservationBuyerResponse = {
    success: boolean;
    message: string;
    data?: ReservationBuyerResult;
    buyer?: string;
}

type MakeReservationBuyerAPIProps = GeneralAPIProps & {
    payload: ReservationBuyerPayload;
    onSuccess?: (data: ReservationBuyerResult) => void;
}

/**
 * fetch per fare una prenotazione sulla base del codice buyer
 * @param abortController - controller to cancel the request
 * @param payload - { buyer?, orizz_temporale }
 * @param onSuccess - callback with ReservationBuyerResult
 * @param onError - optional error callback
 * @param setLoading - optional loading setter
 * @returns Promise<void>
 */
export async function MakeReservationBuyerAPI({
    abortController,
    payload,
    onSuccess,
    onError,
    setLoading,
}: MakeReservationBuyerAPIProps): Promise<void> {
    try {
        setLoading?.(true);

        const url = `${import.meta.env.VITE_API_PRODUCTS}noPromo/prenotaBuyer`;

        const res = await FetchData<ReservationBuyerResponse>(url, "POST", payload, abortController);

        if (res && res.success && res.data) {
            const { productsFound, totalInserted, totalUpdated, totalSkipped, data_esecuzione } = res.data;

            let msg = `Prenotazione per ${data_esecuzione}: ${productsFound} prodotti trovati. Inseriti: ${totalInserted}`;
            if (totalUpdated) msg += `, aggiornati: ${totalUpdated}`;
            if (totalSkipped) msg += `, invariati: ${totalSkipped}`;

            enqueueSnackbar(msg, {
                title: "Successo",
                type: "success",
            });

            onSuccess?.(res.data);
        } else {
            enqueueSnackbar(res?.message || "La prenotazione non è andata a buon fine.", {
                title: "Attenzione",
                type: "warning",
            });
        }
    } catch (error: any) {
        if (error?.name === "AbortError") return;

        let errorMsg = "Errore durante la prenotazione.";

        if (error?.status === 400) {
            const msg = error?.message?.message || error?.message?.msg || error?.message;
            errorMsg = typeof msg === "string" ? msg : "Dati non validi. Controlla i campi e riprova.";
        } else if (error?.status === 403) {
            errorMsg = "Non hai i permessi per questa operazione (codice buyer mancante).";
        } else if (error?.status === 404) {
            const msg = error?.message?.message || error?.message?.msg || error?.message;
            errorMsg = typeof msg === "string" ? msg : "Nessun prodotto attivo trovato per il buyer.";
        }

        enqueueSnackbar(errorMsg, {
            title: "Errore",
            type: "error",
        });

        onError?.(error);
    } finally {
        setLoading?.(false);
    }
}
