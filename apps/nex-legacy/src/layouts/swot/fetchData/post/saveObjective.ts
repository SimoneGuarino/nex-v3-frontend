// Components
import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";

type FormObjectiveValues = {
    _id?: string; // ID dell'obiettivo, se esiste
    brand?: {[key: string]: string | number} | null;
    linea?: {[key: string]: string | number} | null;
    gruppo?: {[key: string]: string | number} | null;
    famiglia?: {[key: string]: string | number} | null;
    target?: number;
    quarter?: number;
    type?: "acquisto" | "vendita";
};

// Lista dei brands e types disponibili
export function SaveObjectiveAPI({ abortController, payload, ChangeLoadStatus, successOperation, reject }: {
    abortController: any,
    payload: FormObjectiveValues,
    ChangeLoadStatus: ({ from, bool }: { from: string, bool: boolean }) => void;
    successOperation: (ObjectId?: string) => void;
    reject: (prev: boolean) => void;
}): void {

    FetchData(`${import.meta.env.VITE_API_STOCKS}swot/quarter/save`, "POST", payload, abortController)
        .then((id) => {
            successOperation(id);
        })
        .catch((errorState: any) => {
            ChangeLoadStatus({ from: 'objective', bool: false });
            if (errorState.name !== 'AbortError') {
                let error_ = "";
                const error: string | { [key: string]: string } | undefined = errorState?.message;
                console.error(errorState);
                if (error) {
                    if (typeof error === 'string') {
                        error_ = (error as any).message;
                    } else if (error !== undefined && error?.msg) {
                        error_ = error.msg;
                    };
                };

                if (!error_ || error_.trim() == "") {
                    error_ = "Sembra che ci sia stato un problema nel retrive dei dati nella tabella, perfavore contatta un tecnico."
                }

                enqueueSnackbar(error_, {
                    title: 'Ops..',
                    type: 'error',
                });
            };
            // Se si verifica un errore, chiama la funzione di rifiuto
            return reject(false);
        });
}