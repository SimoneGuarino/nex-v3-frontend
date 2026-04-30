import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from '../../../../examples/Fetch';

export function FiltersDataAPI(userContext, abortController, setFiltersData, setFiltersLoad) {
    if(userContext.details === undefined){return;}
    FetchData(import.meta.env.VITE_API_STOCKS + 'targetStock/rt-flt-dt', 'POST', {
        tk: userContext.token,
    }, abortController).then(res => {
        setFiltersData(res);
        setFiltersLoad(false);
    }).catch(error => {
        setFiltersLoad(false);
        console.error(error);
        let error_ = "Sembra che ci sia stato un problema nel retrive delle informazioni dal server, perfavore contatta l'assistenza"
        if(error && error?.msg){    error_ = error.msg;     };
        return enqueueSnackbar(error_, {
            title: 'Ops..',
            type: 'error',
        });
    });
};