import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from 'examples/Fetch';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
}

export function TableDataAPI({userContext, abortController, setTableData, setErr, buyerTarget, setOnLoad} : 
    {userContext: UserContext, abortController: any; setTableData: (prev: any) => void, setErr: (prev: any) => void, 
        buyerTarget: string | null, setOnLoad: (prev: boolean) => void}): void {
    if (userContext.details === undefined) { return; }
    FetchData(`${import.meta.env.VITE_API_CONFIGURATORS}stockstarget/gt/tbl`, 'POST', {
        tk: userContext.token,
        byr: buyerTarget,
    }, abortController).then(async (res: any) => {
        setOnLoad(false);
        setTableData(res.data);
    }).catch((error: any) => {
        setOnLoad(false);
        setErr(true);
        
        if (error.name !== 'AbortError') {
            console.error(error);
            let error_ = "Sembra che non è stato possibile caricare i dati, perfavore contatta un tecnico."
            if(error && (error?.msg || error?.message)){    error_ = (error.msg || error.message);     };
            return enqueueSnackbar(error_, {
                title: 'Ops..',
                type: 'error',
            });
        };
    });
}