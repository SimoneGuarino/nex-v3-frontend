import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from '../../../../examples/Fetch';

export function DataAPI(userContext, abortController, setData, setLoadState) {
    if(userContext.details === undefined){return;}
    FetchData(import.meta.env.VITE_API_CUSTOMERSFIDO + 'rd-fdo', 'POST', {
        tk: userContext.token,
    }, abortController).then(res => {
        setLoadState(false);
        setData(res);
    }).catch(error => {
        setLoadState(false);

        if (error.name !== 'AbortError') {
            console.error(error);
            let error_ = "Sembra che non è stato possibile fare il retrive dei dati, perfavore contatta un tecnico."
            if(error && (error?.msg || error?.message)){    error_ = (error.msg || error.message);     };
            return enqueueSnackbar(error_, {
                title: 'Ops..',
                type: 'error',
            });
        };
    })
}