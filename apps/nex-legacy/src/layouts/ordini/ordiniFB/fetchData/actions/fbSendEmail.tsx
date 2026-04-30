import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from '../../../../../examples/Fetch';

interface UserContext {
    token?: string;
    details?: {
        ruolo?: string;
        permissions?: string[];
    };
}

interface CopyDataContext {
    data: Record<string, any>[];
}

/**
* Funzione per inviare email tramite backend
* @param userContext - contesto utente con token e dettagli
* @param abortController - controller per abortare fetch se necessario
* @param tp - tipo invio: 1 = commerciale, 0 = cliente
* @param copyDataContext - dati da filtrare per invio
* @param codiceCommerciale - codice agente da inviare
* @param commentBody - testo email
* @param closePanelClean - callback per chiudere il pannello
* @param setSendingEmailStatus - callback per aggiornare stato invio
* @param emailCliSANIT - email cliente, usata se tp === 0
*/

export function FBSendEmail(
    userContext: UserContext,
    abortController: AbortController | null,
    tp: 0 | 1,
    copyDataContext: CopyDataContext,
    codiceCommerciale?: string | null,
    commentBody?: string,
    closePanelClean?: () => void,
    setSendingEmailStatus?: (status: boolean) => void,
    emailCliSANIT?: string
) {
    if (!userContext.details) return;

    let findElmOnDataset: Record<string, any>[] = [];

    if (tp === 1) {
        // invio commerciale
        findElmOnDataset = copyDataContext.data.filter(
            (elm) => elm.Commerciale === codiceCommerciale
        );
        if (findElmOnDataset.length < 1) {
            return enqueueSnackbar(
                "Impossibile inviare un email di sollecito, perché questo utente non ha nessun elemento nella lista",
                {
                    title: 'Ops..',
                    type: 'error',
                }
            );
        }
    } else if (tp === 0) {
        // invio cliente
        findElmOnDataset = copyDataContext.data.filter(
            (elm) => elm['Mail Cliente'] === emailCliSANIT
        );
    }

    const controller = abortController ?? new AbortController();

    FetchData(
        `${import.meta.env.VITE_API_ORDER}orders/fb-pissms`,
        'POST',
        {
            tk: userContext.token,
            tp,
            bd: findElmOnDataset,
            text: commentBody,
        },
        controller
    )


        .then(() => {
            closePanelClean?.();
            setSendingEmailStatus?.(false);

            return enqueueSnackbar(
                `L'email è stata inviata correttamente ${tp !== 0 ? 'Commerciale' : 'Cliente'}`,
                {
                    title: 'Ops..',
                    type: 'success',
                }
            );
        })
        .catch((error: any) => {
            console.error(error);
            let error_ =
                "Sembra che ci sia stato un problema nel recuperare dei dati, perfavore contatta l'assistenza";
            if (error?.msg) {
                error_ = error.msg;
            }
            return enqueueSnackbar(error_, {
                title: 'Ops..',
                type: 'error',
            });
        });
}