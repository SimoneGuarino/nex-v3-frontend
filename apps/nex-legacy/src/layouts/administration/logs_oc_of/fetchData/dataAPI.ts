import { FetchData } from 'examples/Fetch';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
}

export function DataAPI({userContext, abortController, setData, firstCall, params, setLoadStatus, setErr} : 
{userContext: UserContext, abortController: any; setData: (prev: any) => void; 
firstCall: boolean, params: any, setLoadStatus: (prev: boolean) => void, setErr: (prev: boolean) => void}): void {
    if (userContext.details === undefined) { return; }

    let bodyToSend: any = {};
    if(userContext){
        bodyToSend.frs = firstCall;
        bodyToSend.tk = userContext.token;
        bodyToSend.flt = params;
    }

    FetchData(`${import.meta.env.VITE_API_ADMIN}logs/gt-tbl`, 'POST', bodyToSend, 
    abortController).then(async (res: any) => {
        setData(res);
        setLoadStatus(false);
    }).catch((error: any) => {
        if(error.name !== 'AbortError'){
            console.error(error);
            setErr(true);
        }
    });
}