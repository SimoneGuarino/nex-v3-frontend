import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from 'examples/Fetch';
import SendLogs from 'logs/index';
import { UserState } from 'types/UserContext';
import { Notifications } from 'utils/index';


interface FindOrderAPIProps {
    userContext: UserState,
    abortController: any;
    tp: number;
    objToSend: any;
    socketNTIF: any;
    generalDataCreataDa: string | undefined;

    setErr: (prev: boolean) => void;
    setOnLoad: (prev: boolean) => void;
    ChangeSendPanelStatus: () => void;
    setHandleNote: (prev: string) => void;
    setFBAlreadyInRequest: (prev: boolean) => void;
    setSuccess: (prev: boolean) => void;
};

export function SendRequestAPI({ userContext, abortController, socketNTIF, generalDataCreataDa, setErr, setOnLoad, ChangeSendPanelStatus,
    tp, objToSend, setHandleNote, setFBAlreadyInRequest, setSuccess }: FindOrderAPIProps): void {
    if (!userContext || (userContext && userContext.details) === undefined) { return; }

    FetchData(`${import.meta.env.VITE_API_ORDER}fb/extbdg/et-rq`, 'POST', {
        tk: userContext.token,
        tp: tp,
        dati: objToSend
    }, abortController).then(async (_: any) => {
        setOnLoad(false);
        ChangeSendPanelStatus();
        setHandleNote("");
        setFBAlreadyInRequest(true);
        setSuccess(true);

        if (tp == 0) {
            return enqueueSnackbar("Richiesta inviata con successo, l'esito ti verrà inviato tramite notifica.", {
                title: 'Inviato Correttamente',
                type: 'success',
            });
        } else if (tp == 1 && (userContext && userContext.details) && generalDataCreataDa) {
            const body_: any = {
                desc: `<p>Gentile utente, riguardo alla sua richiesta di <em>sblocco ordine</em> per il cliente: 
                <strong>${objToSend.cliente.nome}</strong>,
                la informiamo che il fido da Lei richiesto è stato <strong><em>${objToSend.stato == 1
                        ? 'Approvato' : 'Rifiutato'
                    }.</strong></em></p><p>${(objToSend?.esito?.nota && objToSend?.esito?.nota !== "") ? "Per il seguente motivo: " : ""}</p>${objToSend.esito?.nota}`,
                modality: "Singola",
                timerMode: false,
                type: "Info",
                user_from: userContext.details.username,
                user_from_details: { nome: 'Sistema', fullName: 'Sistema', system: true },
                user_target: [generalDataCreataDa],
                usersTargetStatus: "Tutti",
            };
            // salva i log della notifica all'interno del sistema. 
            SendLogs(userContext.token, "Notification", "commerciale/sblocco_ordini", null, null, body_);
            return Notifications({ _id: userContext.details._id, body: body_, userToken: userContext.token });
        };
    }).catch((error: any) => {
        setOnLoad(false);
        setErr(true);
        
        if (error.name !== 'AbortError') {
            console.error(error);
            let error_ = "Sembra che ci sia stato un problema nel comunicare con il server, perfavore contatta l'assistenza"
            if (error && error?.msg) { error_ = error.msg; };
            return enqueueSnackbar(error_, {
                title: 'Ops..',
                type: 'error',
            });
        };
    });
}