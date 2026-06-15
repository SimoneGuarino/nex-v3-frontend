import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from 'examples/Fetch';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
};

interface SearchParam_{
    state: string | number,
    amm: object,
    com: object,
}

export function SearchAPI({userContext, abortController, setData, searchParam, setLoadState} : 
    {userContext: UserContext, abortController: any, setData: (prev : any) => void; searchParam: SearchParam_;
        setLoadState: (prev: boolean) => void;
    }): void {
    if (userContext.details === undefined) { return; }
    FetchData(`${import.meta.env.VITE_API_CUSTOMERSFIDO}srh-dta`, 'POST', {
        tk: userContext.token,
        srp: searchParam
    }, abortController).then(async (res: any) => {
        setLoadState(false);
        setData(res.data);
    }).catch((error: any) => {
        setLoadState(false);
        if (error.name !== 'AbortError') {
            console.error(error);
            let error_ = "Sembra che ci sia stato un problema nel retrive dei dati, perfavore contatta un tecnico."
            if(error && (error?.msg || error?.message)){    error_ = (error.msg || error.message);     };
            return enqueueSnackbar(error_, {
                title: 'Ops..',
                type: 'error',
            });
        };
    });
}