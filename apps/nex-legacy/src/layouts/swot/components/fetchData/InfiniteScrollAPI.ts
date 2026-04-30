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
}

export function InfiniteScrollAPI({ userContext, abortController, setData, params, offset }
    : InfiniteScrollAPIProps): Promise<any> {

    let bodyToSend: any = {};
    if (userContext) {
        bodyToSend.tk = userContext.token;
        bodyToSend.of = offset;
    }

    return new Promise((resolve, reject) => {
        FetchData(`${import.meta.env.VITE_API_SEARCH_ENDPOINT}table?${params}`, 'POST', bodyToSend,
            abortController).then(async (res) => {
                setData((prev: any) => {
                    return [...prev.dati, ...res.data]
                });
                resolve(true);
            }).catch((error: any) => {
                reject(error.message.msg);
            })
    });
}