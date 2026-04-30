import { FetchData } from 'examples/Fetch';
import { UserState } from 'types/UserContext';


interface SearchParam {
    stato: any;
    com: string | null;
    amm: string | null;
    cli: string | number | null;
    dateRange: {
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
    setTableData: (prev: any) => void;
}

export function InfiniteScrollAPI({userContext, abortController, setTableData, setErr, searchParam, offset} 
: InfiniteScrollAPIProps): Promise<any> {

    let bodyToSend: any = {};
    if(userContext){
        bodyToSend.tk = userContext.token;
        bodyToSend.ofs = offset;
        bodyToSend.stato = 0;
    }

    if(searchParam){
        if(searchParam.stato != null){
            Object.assign(bodyToSend, {stato: searchParam.stato});
        };
        if(searchParam.amm){
            Object.assign(bodyToSend, {amm: searchParam.amm});
        };
        if(searchParam.com){
            Object.assign(bodyToSend, {com: searchParam.com});
        };
        if(searchParam.cli){
            Object.assign(bodyToSend, {cli: searchParam.cli});
        };
        if(searchParam.dateRange){
            Object.assign(bodyToSend, {dateRange: searchParam.dateRange});
        };
    };
    
    return new Promise((resolve, reject) => {
        FetchData(`${import.meta.env.VITE_API_ORDER}fb/extbdg/gt-rq`, 'POST', {...bodyToSend},
        abortController).then(async (res) => {
            setTableData((prev: any) => { 
                return [...prev, ...res.data]
            });
            resolve(true);
        }).catch((error: any) => {
            reject(error.message.msg);
        })
    });
}