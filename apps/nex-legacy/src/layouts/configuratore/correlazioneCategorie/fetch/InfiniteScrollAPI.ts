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
    distributorsName: any; 
    setErr: (prev: boolean) => void;
    offset: number;
}

export function InfiniteScrollAPI({userContext, abortController, setData, distributorsName, setErr, offset} 
: InfiniteScrollAPIProps): Promise<any> {

    let bodyToSend: any = {};
    if(userContext){
        bodyToSend.tk = userContext.token;
        bodyToSend.of = offset;
        bodyToSend.ds = distributorsName;
    }
    
    return new Promise((resolve, reject) => {
        FetchData(`${import.meta.env.VITE_API_CONFIGURATORS}/dists/gt-ag`, 'POST', {...bodyToSend},
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