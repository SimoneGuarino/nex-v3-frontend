import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from '../../../../examples/Fetch';

export function ChangeFieldValue(userContext, abortController, elementSelected, openErrorSB, editChanges) {
    if(userContext.details === undefined){return;}
    FetchData(import.meta.env.VITE_API_CUSTOMERSFIDO + 'cfv-fdo', 'POST', {
        tk: userContext.token,
        eID: elementSelected._id,
        changes: editChanges,
    }, abortController).then(res => {
        if(res.status){
            return enqueueSnackbar("Lo stato della richiesta è stato modificato correttamente.", {
                title: 'Ops..',
                type: 'success',
            });
        }else{
            return enqueueSnackbar('Sembra che ci sia stato un problema nel modificare il vaore correttamente.', {
                title: 'Ops..',
                type: 'error',
            });
        };
    }).catch(error => {
        if (error.name !== 'AbortError') {
            console.error(error);
            let error_ = "Sembra che non è stato possibile modificare tale richiesta, perfavore contatta un tecnico."
            if(error && (error?.msg || error?.message)){    error_ = (error.msg || error.message);     };
            return enqueueSnackbar(error_, {
                title: 'Ops..',
                type: 'error',
            });
        };
    })
}