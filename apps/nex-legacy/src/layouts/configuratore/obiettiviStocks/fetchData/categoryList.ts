import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from 'examples/Fetch';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
}

export function CategoryListAPI({userContext, abortController, setData, setGroupings} : 
    {userContext: UserContext, abortController: any, setData: (prev : any) => void, setGroupings: (prev : any) => void}): void {
    if (userContext.details === undefined) { return; }
    FetchData(`${import.meta.env.VITE_API_CONFIGURATORS}stockstarget/gt/cat`, 'POST', {
        tk: userContext.token,
    }, abortController).then(async (res: any) => {
        setData(res.data);
        setGroupings(res.groupings);
    }).catch((error: any) => {
        if (error.name !== 'AbortError') {
            console.error(error);
            let error_ = "Sembra che non è stato possibile caricare la lista delle categorie, perfavore contatta un tecnico."
            if(error && (error?.msg || error?.message)){    error_ = (error.msg || error.message);     };
            return enqueueSnackbar(error_, {
                title: 'Ops..',
                type: 'error',
            });
        };
    });
}