import { FetchData } from 'examples/Fetch';
import { CookieCompareV3 } from '../utils/CookieData';



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
    offset: number;
    query: any;
}

export function InfiniteScrollAPI({userContext, abortController, query, setData, offset} 
: InfiniteScrollAPIProps): Promise<any> {

    let bodyToSend: any = {};
    if(userContext){
        bodyToSend.tk = userContext.token;
        bodyToSend.of = offset;
        bodyToSend.__dist = CookieCompareV3('stored_settings');
    }
    
    return new Promise((resolve, reject) => {
        FetchData(import.meta.env.VITE_API_PRODUCTS + 'pds/products?skip=0&' + query, 'POST', {...bodyToSend},
        abortController).then(async (res) => {
            setData((prev: any) => { 
                return {...prev, dati: [...prev.dati, ...res.data]}
            });
            resolve(true);
        }).catch((error: any) => {
            reject(error.message.msg);
        })
    });
}