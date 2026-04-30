import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from 'examples/Fetch';

interface UserContext {
    details?: { username: string;};
    token: string;
}
interface distSelectedProps {
    name: string;
    value?: number;
}
interface dataToInsertProps {
    buyerSelected: any;
    brandSelected: { Marca: string, PrefissiFornitore: Array<object> } | null;
    categorySelected: any;
    subcategorySelected: any;
    raggruppamento: any;
    quarters: Array<distSelectedProps>;
}

export function SaveConditionAPI({userContext, abortController, dataToInsert, actionType} : 
    {userContext: UserContext, abortController: any, dataToInsert: dataToInsertProps, actionType: number}): void {
    if (userContext.details === undefined) { return; }
    FetchData(`${import.meta.env.VITE_API_CONFIGURATORS}stockstarget/cr/scn`, 'POST', {
        tk: userContext.token,
        dt: dataToInsert,
        tp: actionType,
    }, abortController).then(async (res: any) => {
    }).catch((error: any) => {
        if (error.name !== 'AbortError') {
            console.error(error);
            let error_ = "Sembra che non è stato possibile salvare le condizioni, perfavore contatta un tecnico."
            if(error && (error?.msg || error?.message)){    error_ = (error.msg || error.message);     };
            return enqueueSnackbar(error_, {
                title: 'Ops..',
                type: 'error',
            });
        };
    });
}