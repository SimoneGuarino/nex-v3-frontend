import { RetriveSupplierFromCookies } from 'utils';
import { FetchData } from 'examples/Fetch';
import { enqueueSnackbar } from 'components/MessageBox';

export function DataRetrive(setSearchDataContext, userContext, handleMainLoadChange, 
    abortController, setImpTableStatus, query, ChangeErrorStatus, cookieNameColumns) {
    if(userContext.details === undefined){return;}

    let bodyToSend = {};
    if(userContext){
        bodyToSend.usr = userContext.details.username;
        bodyToSend.__dist = RetriveSupplierFromCookies(cookieNameColumns);
    }

    FetchData(import.meta.env.VITE_API_SEARCH_ENDPOINT + 'contribution/gt?disp=1&', 'POST', bodyToSend, 
    abortController).then(res => {
        const response = res.data;
        setSearchDataContext(response)
        setImpTableStatus(false);
        // 0 => Compare && 1 => Exclude => Stabilire in che modalità si trova il pannello
        handleMainLoadChange();
    }).catch(error => {
        if (error.name !== 'AbortError') {
            console.error(error)
            ChangeErrorStatus(); //Modifica lo statehook dedicato all'errore generale.
            enqueueSnackbar(error.toString(), {
                title: 'Ops.. Errore in risposta dal server',
                type: 'error',
            });
        };
    });
}