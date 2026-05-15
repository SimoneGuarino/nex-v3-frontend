import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from '../../../../../examples/Fetch';
import { CreateAndDownloadExcel } from '../../../../../utils';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
}

export function ReqBOIMP_API(userContext: UserContext, abortController: AbortController, dataToElab: Array<Object>,
ChangeBOIMPPanleVisibility: () => void): void {
    if (userContext.details === undefined) { return; }
    FetchData(`${import.meta.env.VITE_API_PRODUCTS}contribution/gt-xls`, 'POST', {
        tk: userContext.token,
        data: dataToElab,
    }, abortController).then(async (res: any) => {
        await CreateAndDownloadExcel(res, 'BOIMP');
        ChangeBOIMPPanleVisibility();
    }).catch((error: any) => {
        if (error.name !== 'AbortError') {
            console.error(error);
            let error_ = "Sembra che ci sia stato un problema nel contattare il server, perfavore contatta il supporto tecnico"
            if(error && (error?.msg || error?.message)){    error_ = (error.msg || error.message);     };
            return enqueueSnackbar(error_, {
                title: 'Ops.. Errore in risposta dal server',
                type: 'error',
            });
        };
    });
}