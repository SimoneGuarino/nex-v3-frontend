import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from 'examples/Fetch';
import { CreateAndDownloadExcel } from 'utils/dwdFile';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
}

export function DwdExcelAPI(userContext: UserContext, abortController: any, 
filtersInTable: {cdp: string; cdl: string},
openErrorSB: (icons: string, message: string) => void): void {
    if (userContext.details === undefined) { return; }
    FetchData(`${import.meta.env.VITE_API_SEARCH_ENDPOINT}sales/exports`, 'POST', {
        tk: userContext.token,
        ...filtersInTable
    }, abortController).then(async (res: any) => {
        if(res){
            const fileName = "Promozioni" + new Date().toLocaleDateString().split("/").join("_");
            await CreateAndDownloadExcel(res, fileName);
        };
    }).catch((error: any) => {
        if (error.name !== 'AbortError') {
            console.error(error);
            let error_ = "Sembra che al momento non sia possibile contattare il server, riprova piu tardi!"
            if(error && (error?.msg || error?.message)){    error_ = (error.msg || error.message);     };
            return enqueueSnackbar(error_, {
                title: 'Ops.. Errore in risposta dal server',
                type: 'error',
            });
        };
    });
}