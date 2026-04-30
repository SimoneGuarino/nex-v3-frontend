import { FetchData } from 'examples/Fetch';



interface UserContext {
    details?: {
        username: string;
    };
    token: string;
}

interface InfiniteScrollAPIProps {
    userContext: UserContext; 
    abortController: any; 
    setData: (prev: any) => void; 
    params: any; 
    setErr: (prev: boolean) => void;
    offset: number;
}

export function InfiniteScrollAPI({userContext, abortController, setData, params, setErr, offset} 
: InfiniteScrollAPIProps): Promise<any> {

    let bodyToSend: any = {};
    if(userContext){
        bodyToSend.tk = userContext.token;
        bodyToSend.of = offset;
        //bodyToSend.flt = params;
    }
    
    return new Promise((resolve, reject) => {
        FetchData(`${import.meta.env.VITE_API_SEARCH_ENDPOINT}pds-logs/gt-dt`, 'POST', {...bodyToSend, ...params},
        abortController).then(async (res) => {
            setData((prev: any) => { 
                return [...prev, ...res]
            });
            resolve(true);
        }).catch((error: any) => {
            reject(error.message.msg);
        })
    });
}