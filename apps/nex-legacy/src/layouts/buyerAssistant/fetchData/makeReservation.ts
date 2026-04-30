import { FetchData } from "examples/Fetch";
import { enqueueSnackbar } from "components/MessageBox";
import { GeneralAPIProps } from "../types/types";


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
export type ReservationPayload = {
    brand: string | string[];
    linea?: string | string[];
    gruppo?: string | string[];
    famiglia?: string | string[];
    prefisso?: string | string[];
    orizz_temporale: number;
    data_esecuzione: string;   // "YYYY-MM-DD"
    data_fine?: string;        // "YYYY-MM-DD" (opzionale, per intervallo)
}

export type ReservationResult = {
    orizz_temporale: number;
    dates: string[];
    filters: {
        brand?: string[];
        linea?: string[];
        gruppo?: string[];
        famiglia?: string[];
        prefisso?: string[];
    };
    productsFound: number;
    totalInserted: number;
    totalUpdated: number;
    totalSkipped: number;
}

export type ReservationResponse = {
    success: boolean;
    message: string;
    data: ReservationResult;
}

type MakeReservationAPIProps = GeneralAPIProps & {
    payload: ReservationPayload;
    onSuccess?: (data: ReservationResult) => void;
}

/**
 * registra prodotti in product List sulla base di filtri brand e data (o intervallo)
 * @param abortController - controller to cancel the request
 * @param payload - ReservationPayload
 * @param onSuccess - callback with ReservationResult
 * @param onError - optional error callback
 * @param setLoading - optional loading setter
 * @returns Promise<void>
 */
export async function MakeReservationAPI({
    abortController,
    payload,
    onSuccess,
    onError,
    setLoading,
}: MakeReservationAPIProps): Promise<void> {
    try {
        setLoading?.(true);

        const url = `${import.meta.env.VITE_API_SEARCH_ENDPOINT}noPromo/prenota`;

        const res = await FetchData<ReservationResponse>(url, "POST", payload, abortController);

        if (res && res.success) {
            const { totalInserted, totalUpdated, totalSkipped, productsFound, dates } = res.data;

            let msg = `Operazione completata: prodotti trovati ${productsFound}. Inseriti: ${totalInserted}`;
            if (totalUpdated) msg += `, aggiornati: ${totalUpdated}`;
            if (totalSkipped) msg += `, saltati: ${totalSkipped}`;
            if (Array.isArray(dates) && dates.length) msg += ` — date: ${dates.slice(0, 5).join(", ")}${dates.length > 5 ? "..." : ""}`;

            enqueueSnackbar(msg, {
                title: "Successo",
                type: "success",
            });

            onSuccess?.(res.data);
        } else {
            enqueueSnackbar("La prenotazione non è andata a buon fine.", {
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
            errorMsg = "Non hai i permessi per prenotare questo prodotto.";
        } else if (error?.status === 404) {
            errorMsg = "Prodotto non trovato.";
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
