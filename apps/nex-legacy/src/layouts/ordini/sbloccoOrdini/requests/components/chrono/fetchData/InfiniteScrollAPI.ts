import { FetchData } from 'examples/Fetch';
import { UserState } from 'types/UserContext';


interface SearchParam {
    stato?: any;
    dateRange?: {
        da: any;
        a: any;
    } | null;
}

interface InfiniteScrollAPIProps {
    userContext: UserState, 
    abortController: any;
    searchParam?: SearchParam;
    offset: number;

    setErr: (prev: boolean) => void;
    setData: (prev: any) => void;
}

export function InfiniteScrollAPI({userContext, abortController, setData, setErr, searchParam, offset} 
: InfiniteScrollAPIProps): Promise<any> {

    let bodyToSend: any = {};
    if(userContext){
        bodyToSend.tk = userContext.token;
        bodyToSend.ofs = offset;
    }
    if(searchParam){
        if(searchParam.stato != null){
            Object.assign(bodyToSend, {stato: searchParam.stato});
        };
        if(searchParam.dateRange){
            Object.assign(bodyToSend, {dateRange: searchParam.dateRange});
        };
    };
    
    return new Promise((resolve, reject) => {
        FetchData(`${import.meta.env.VITE_API_ORDER}fb/extbdg/gt-rq`, 'POST', {...bodyToSend},
        abortController).then(async (res) => {
            setData((prev: any) => { 
                return [...prev, ...res.data]
            });
            resolve(true);
        }).catch((error: any) => {
            reject(error.message.msg);
        })
    });
}