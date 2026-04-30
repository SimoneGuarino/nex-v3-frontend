import { FetchData } from 'examples/Fetch';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
}

export function SuppliersListAPI({userContext, abortController, setSupplierList, setErr} : 
{userContext: UserContext, abortController: any; setSupplierList: (prev : any) => void, 
setErr: (prev: any) => void}): void {
    if (userContext.details === undefined) { return; }
    FetchData(`${import.meta.env.VITE_API_CONFIGURATORS}stockstarget/gt/dtl`, 'POST', {
        tk: userContext.token,
    }, abortController).then(async (res: any) => {
        setSupplierList(res.data);
    }).catch((error: any) => {
        console.error(error)
        setErr(true);
    });
}