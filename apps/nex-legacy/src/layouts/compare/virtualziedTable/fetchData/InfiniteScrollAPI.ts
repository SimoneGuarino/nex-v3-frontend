//src\layouts\compare\virtualziedTable\fetchData\InfiniteScrollAPI.ts
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
    offset: number;
    buyerTarget?: string;
}

export function InfiniteScrollAPI({ userContext, abortController, setData, params, offset, buyerTarget }
    : InfiniteScrollAPIProps): Promise<any> {

    let bodyToSend: any = {};
    if(userContext){
        bodyToSend.of = offset;
    }

    if(buyerTarget) {
        bodyToSend.byid = buyerTarget;
    }

    return new Promise((resolve, reject) => {
        FetchData(`${import.meta.env.VITE_API_SEARCH_ENDPOINT}table?${params}`, 'POST', bodyToSend,
            abortController).then(async (res: any) => {
                setData((prev: any) => {
                    return { ...prev, dati: [...prev.dati, ...res.data] }
                });
                resolve(true);
            }).catch((error: any) => {
                reject(error.message.msg);
            })
    });
}