import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from '../../../../../examples/Fetch';

export function SendFidoRequestAPI(userContext, abortController, userASW, handleClose) {
    if(userContext.details === undefined){return;}
    FetchData(import.meta.env.VITE_API_CUSTOMERSFIDO + 'rgis-fdo', 'POST', {
        tk: userContext.token,
        usawr: userASW,
    }, abortController).then(res => {
        if(res.Success){
            handleClose();
            return enqueueSnackbar('Richiesta fido inviata correttamente!.', {
                title: 'Fido',
                type: 'success',
            });
        }
    }).catch(error => {
        console.log(error);
        return enqueueSnackbar("Sembra che ci sia stato un problema nel comunicare con il server, perfavore contatta l'assistenza", {
            title: 'Ops..',
            type: 'error',
        });
    });
}