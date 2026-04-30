import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from '../../../../../examples/Fetch';

export function FBSendEmail(userContext, abortController, tp, copyDataContext, codiceCommerciale, 
    commentBody, closePanelClean, setSendingEmailStatus, emailCliSANIT) {
    if(userContext.details === undefined){return;}

    let findElmOnDataset = [];

    if(tp === 1){
        findElmOnDataset = copyDataContext.filter(elm => elm.CodCommerciale == codiceCommerciale);
        if(findElmOnDataset.length < 1){
            return enqueueSnackbar("Impossibile inviare un email di sollecito, perche questo utente non ha nessun elemento nella lista", {
                title: 'Ops..',
                type: 'error',
            });
        };
    }else if(tp === 0){
        findElmOnDataset = copyDataContext.filter(elm => elm['Mail Cliente'] == emailCliSANIT.toUpperCase())
    }

    FetchData(import.meta.env.VITE_API_ORDER + 'orders/fb-dnrsms', 'POST', {
        tk: userContext.token,
        tp: tp,
        bd: findElmOnDataset,
        text: commentBody
    }, abortController).then(res => {  
        closePanelClean();
        setSendingEmailStatus(false);
        return enqueueSnackbar(`L'email è stata inviata correttamente ${tp !== 0 ? 'Commerciale' : 'Cliente'}`, {
            title: 'Ops..',
            type: 'success',
        });
    }).catch(error => {
        if (error.name !== 'AbortError') {
            console.error(error);
            let error_ = "Sembra che ci sia stato un problema nel recuperare dei dati, perfavore contatta l'assistenza"
            if(error && (error?.msg || error?.message)){    error_ = (error.msg || error.message);     };
            return enqueueSnackbar(error_, {
                title: 'Ops..',
                type: 'error',
            });
        };
    });
};