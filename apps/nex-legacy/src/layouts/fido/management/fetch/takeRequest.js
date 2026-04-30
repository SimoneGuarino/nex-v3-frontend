import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from '../../../../examples/Fetch';

export function TakeRequestAPI({userContext, abortController, elementSelected, openErrorSB, reloadData, setData}) {
    if(userContext.details === undefined){return;}
    FetchData(import.meta.env.VITE_API_CUSTOMERSFIDO + 'treq-fdo', 'POST', {
        tk: userContext.token,
        eID: elementSelected._id
    }, abortController).then(res => {
        if(res && res.Message && !res.Success){
            openErrorSB('warning', res.Message);
            reloadData(userContext, abortController, setData);
        };
    }).catch(error => {
        if (error.name !== 'AbortError') {
            console.error(error);
            let error_ = "Sembra che non è stato possibile prendere la richiesta, perfavore contatta un tecnico."
            if(error && (error?.msg || error?.message)){    error_ = (error.msg || error.message);     };
            return enqueueSnackbar(error_, {
                title: 'Ops..',
                type: 'error',
            });
        };
    })
}