import { FetchData } from 'examples/Fetch';
import { enqueueSnackbar } from 'components/MessageBox';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
}


interface DetailsAPIProps {
    userContext: UserContext;
    abortController: any;
    item_: { linea: string };
    setInspectedItemCopy_: (prev: any) => void;
    ChangeLoadStatus: ({ from, bool }: { from: "table" | "dataOnInspect"; bool?: boolean }) => void;
    setGroupedItem_: (prev: any) => void;
}


export function DetailsAPI({ userContext, abortController, item_, setInspectedItemCopy_, ChangeLoadStatus, setGroupedItem_ }: DetailsAPIProps): void {
    if (userContext.details === undefined) { return; }
    FetchData(`${import.meta.env.VITE_API_STOCKS}targetAgents/rt-det-dt`, 'POST', {
        tk: userContext.token,
        lin: item_.linea, //'AUVI'
    }, abortController).then((res: any) => {
        if (res) {
            const item = { ...item_, marche: res };
            setInspectedItemCopy_(item);
            setGroupedItem_(item);
        };
        ChangeLoadStatus({ from: 'dataOnInspect', bool: false });
    }).catch((error: any) => {
        if (error.name !== 'AbortError') {
            console.error(error);
            enqueueSnackbar("Sembra che i dati al momento non siano disponibili, perfavore contatta un tecnico.", {
                title: 'Ops..',
                type: 'error',
            });
        };
    });
}