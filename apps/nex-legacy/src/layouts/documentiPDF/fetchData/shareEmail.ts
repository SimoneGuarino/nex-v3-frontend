import { FetchData } from "examples/Fetch";
import type { MutableRefObject } from "react";

/**
 * Allineato al BE:
 * - "company" discrimina il sotto-root dei PDF (Documentipdf vs Documentipdfiot)
 * - lato UI lo passiamo per ogni documento selezionato
 */
type Company = "FOCELDA" | "IOT";

/**
 * Documento da allegare:
 * - fileName: nome file così come salvato (può includere ".pdf")
 * - company: discriminante (FOCELDA/IOT)
 */
export type ShareEmailDoc = {
    fileName: string;
    company: Company;
};

interface ShareEmailAPIProps {
    /**
     * AbortController gestito come negli altri endpoint:
     * - permette di annullare la richiesta se l'utente chiude il dialog / cambia pagina
     */
    abortController: MutableRefObject<AbortController | null>;

    /**
     * Destinatari: usiamo "username" da Mongo (che è la mail).
     * Accettiamo singolo o multiplo per mantenere UX identica alla chat.
     */
    to: string | string[];

    /**
     * Messaggio opzionale (plain text): il BE lo trasforma in HTML sicuro (escape + <br/>).
     */
    message?: string;

    /**
     * Lista documenti selezionati da allegare.
     */
    docs: ShareEmailDoc[];

    /**
     * Gestione errori centralizzata come nel resto del progetto.
     */
    HandleError: (errorMessage: string) => void;

    /**
     * Toggle loading globale/locale.
     */
    ChangeLoadStatus?: ({ from, bool }: { from: string; bool: boolean }) => void;
};

/**
 * Risposta attesa dal BE:
 * - sent: quanti destinatari effettivi
 * - attached: quanti allegati
 * - approxTotalB64: stima dimensione base64 totale (per audit/debug)
 */
type ShareEmailResponse = {
    ok: true;
    sent: number;
    attached: number;
    approxTotalB64: number;
};

/**
 * ShareEmailAPI
 * Endpoint: POST /pdf/v2/shareEmail
 * Nota: usa FetchData (che aggiunge Bearer token se presente e gestisce json/errori).
 */
export async function ShareEmailAPI({
    abortController,
    to,
    message,
    docs,
    HandleError,
    ChangeLoadStatus,
}: ShareEmailAPIProps) {
    // Impostiamo lo stato di loading come per le altre fetch (SearchAPI, ecc.)
    ChangeLoadStatus?.({ from: "ShareEmailAPI", bool: true });

    return await FetchData<ShareEmailResponse>(
        // Base URL già configurato in VITE_API_PDF_READER (include il gateway nginx)
        `${import.meta.env.VITE_API_PDF_READER}pdf/v2/shareEmail`,
        "POST",
        // Payload coerente con il BE: { to, message, docs }
        { to, message, docs },
        abortController
    )
        .then((res) => {
            // Richiesta completata: abbassiamo loading e ritorniamo la risposta
            ChangeLoadStatus?.({ from: "ShareEmailAPI", bool: false });
            return res;
        })
        .catch((errorState: any) => {
            // Anche in errore: abbassiamo loading
            ChangeLoadStatus?.({ from: "ShareEmailAPI", bool: false });

            // Se non è un abort “voluto”, logghiamo l’errore per debug
            if (errorState?.name !== "AbortError") {
                console.error(errorState);
            }

            // FetchData in caso di !ok lancia { status, message }.
            // Se il BE risponde con { msg }, lo mostriamo; altrimenti fallback generico.
            const apiMsg =
                typeof errorState?.message === "object" && errorState?.message?.msg
                    ? String(errorState.message.msg)
                    : null;

            HandleError(
                apiMsg ||
                "Qualcosa è andato storto, se questo errore persiste, per favore contatta il nostro supporto tecnico."
            );
        });
};