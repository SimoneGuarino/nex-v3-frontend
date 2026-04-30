import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from 'examples/Fetch';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
}

export function FiltersDataAPI({userContext, abortController, setFiltersData, setFiltersLoad, openErrorSB} : 
{userContext: UserContext, abortController: any; openErrorSB : any;
        setFiltersData: (prev: any) => void; setFiltersLoad: (prev: any) => void}): void {
    if (userContext.details === undefined) { return; }

    let bodyToSend: any = {};
    if(userContext){
        bodyToSend.tk = userContext.token;
    }

    FetchData(`${import.meta.env.VITE_API_SEARCH_ENDPOINT}sales/filters`, 'POST', bodyToSend, 
    abortController).then(async (res: any) => {
        if(res){
            setFiltersData(res);
        };
        setFiltersLoad(false);
    }).catch((error: any) => {
        if (error.name !== 'AbortError') {
            console.error(error);
            let error_ = "Sembra che non è stato possibile accedere ad alcune informazioni, perfavore contatta un tecnico."
            if(error && (error?.msg || error?.message)){    error_ = (error.msg || error.message);     };
            return enqueueSnackbar(error_, {
                title: 'Ops..',
                type: 'error',
            });
        };
    });
}