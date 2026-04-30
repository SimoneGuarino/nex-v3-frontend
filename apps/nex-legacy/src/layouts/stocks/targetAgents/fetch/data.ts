import { FetchData } from 'examples/Fetch';
import { enqueueSnackbar } from 'components/MessageBox';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
}


interface DataAPIProps {
    userContext: UserContext;
    abortController: any;
    setData: (prev: any) => void;
    ChangeLoadStatus: ({ from, bool }: { from: "table" | "dataOnInspect"; bool?: boolean }) => void;
}


export function DataAPI({ userContext, abortController, setData, ChangeLoadStatus }: DataAPIProps): void {
    if (userContext.details === undefined) { return; }
    FetchData(`${import.meta.env.VITE_API_STOCKS}targetAgents/rt-dt`, 'POST', {
        tk: userContext.token,
    }, abortController).then((res: any) => {
        if (res) {
            setData(res);
        };
        ChangeLoadStatus({ from: 'table', bool: false });
    }).catch((error: any) => {
        if (error.name !== 'AbortError') {
            console.error(error);
            return enqueueSnackbar("Sembra che i dati al momento non siano disponibili, perfavore contatta un tecnico.", {
                title: 'Ops..',
                type: 'error',
            });
        }
    });
}