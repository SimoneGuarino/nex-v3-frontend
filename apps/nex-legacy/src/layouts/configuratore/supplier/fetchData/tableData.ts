import { FetchData } from 'examples/Fetch';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
}

export function TableDataAPI({userContext, abortController, setTableData, setErr} : 
    {userContext: UserContext, abortController: any; setTableData: (prev: any) => void, setErr: (prev: any) => void}): void {
    if (userContext.details === undefined) { return; }
    FetchData(`${import.meta.env.VITE_API_CONFIGURATORS}suppliers/gt/tbl`, 'POST', {
        tk: userContext.token,
    }, abortController).then(async (res: any) => {
        setTableData(res.data)
    }).catch((error: any) => {
        console.error(error)
        setErr(true);
    });
}