import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from 'examples/Fetch';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
}

interface BuyersAPIProps {
    userContext: UserContext,
    abortController: any; 
    setData: (prev: any) => void;
}

export function BuyersAPI({userContext, abortController, setData} : BuyersAPIProps): void {
    if (userContext.details === undefined) { return; }

    let bodyToSend: any = {};
    if(userContext){
        bodyToSend.tk = userContext.token;
    }

    FetchData(`${import.meta.env.VITE_API_SEARCH_ENDPOINT}contribution/gt-buy`, 'POST', bodyToSend, 
    abortController).then(async (res: any) => {
        setData(res);
    }).catch((error: any) => {
        enqueueSnackbar('Sembra che ci sia stato un problema nel retrive dei dati contribuzione, contatta il supporto tecnico.', {
            title: 'Ops..',
            type: 'error',
        });
        console.error(error)
    });
}