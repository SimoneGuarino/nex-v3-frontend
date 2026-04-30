import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from '../../../../examples/Fetch';

export function ListCustomers(userContext, abortController, setListOfCustomers, setReqCustomersDataStatus) {
    if(userContext.details === undefined){return;}
    FetchData(import.meta.env.VITE_API_CUSTOMERSFIDO + 'gt-ctm', 'POST', {
        tk: userContext.token,
    }, abortController).then(res => {
        setReqCustomersDataStatus(false);
        setListOfCustomers(() => res);
    }).catch(error => {
        if (error.name !== 'AbortError') {
            console.error(error);
            let error_ = "Sembra che ci sia stato un problema generale, perfavore contatta un tecnico."
            if(error && (error?.msg || error?.message)){    error_ = (error.msg || error.message);     };
            return enqueueSnackbar(error_, {
                title: 'Ops..',
                type: 'error',
            });
        };
    })
}