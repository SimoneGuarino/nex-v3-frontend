import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from 'examples/Fetch';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
}

export function TotalDataAPI({userContext, abortController, setTotal, params, setErr} : 
{userContext: UserContext, abortController: any; setTotal: (prev: any) => void; 
params: any, setErr: (prev: boolean) => void}): void {
    if (userContext.details === undefined) { return; }

    let bodyToSend: any = {};
    if(userContext){
        bodyToSend.tk = userContext.token;
        bodyToSend.of = 0;
    }

    FetchData(`${import.meta.env.VITE_API_SEARCH_ENDPOINT}pds-logs/gt-tt`, 'POST', {...bodyToSend, ...params}, 
    abortController).then(async (res: any) => {
        setTotal(res);
    }).catch((error: any) => {
        if(error.name !== 'AbortError'){
            enqueueSnackbar(error, {
                title: 'Ops..',
                type: 'error',
            });
            console.error(error);
            setErr(true);
        };
    });
}