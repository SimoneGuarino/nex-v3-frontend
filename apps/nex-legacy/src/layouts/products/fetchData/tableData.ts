import { FetchData } from 'examples/Fetch';
import { CookieCompareV3 } from '../utils/CookieData';
import { enqueueSnackbar } from 'components/MessageBox';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
}

export function TableDataAPI({userContext, abortController, setTableData} : 
    {userContext: UserContext, abortController: any; setTableData: (prev: any) => void}): void {
    if (userContext.details === undefined) { return; }

    let bodyToSend: any = {};
    if(userContext){
        bodyToSend.username = userContext.details.username;
        bodyToSend.token = userContext.token;
        bodyToSend.__dist = CookieCompareV3('stored_settings_prodotti');
    }

    FetchData(`${import.meta.env.VITE_API_SEARCH_ENDPOINT}table?`, 'POST', bodyToSend, 
    abortController).then(async (res: any) => {
        setTableData(res.data)
    }).catch((error: any) => {
        if (error.name !== 'AbortError') {
            console.error(error);
            let error_ = "Sembra che ci sia stato un problema nel retrive dei dati nella tabella, perfavore contatta un tecnico."
            if(error && (error?.msg || error?.message)){    error_ = (error.msg || error.message);     };
            return enqueueSnackbar(error_, {
                title: 'Ops..',
                type: 'error',
            });
        };
    });
}