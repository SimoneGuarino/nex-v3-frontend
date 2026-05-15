import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from 'examples/Fetch';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
}

export function DataAPI({userContext, abortController, setData, params, setLoadStatus, setErr} : 
{userContext: UserContext, abortController: any; setData: (prev: any) => void; 
params: any, setLoadStatus: (prev: boolean) => void, setErr: (prev: boolean) => void}): void {
    if (userContext.details === undefined) { return; }

    let bodyToSend: any = {};
    if(userContext){
        bodyToSend.tk = userContext.token;
        bodyToSend.of = 0;
    };

    FetchData(`${import.meta.env.VITE_API_PRODUCTS}pds-logs/gt-dt`, 'POST', {...bodyToSend, ...params}, 
    abortController).then(async (res: any) => {
        setData(res);
        setLoadStatus(false);
    }).catch((error: any) => {
        if(error.name !== 'AbortError'){
            enqueueSnackbar(error, {
                title: 'Ops..',
                type: 'error',
            });
            console.error(error);
            setErr(true);
        }
    });
}