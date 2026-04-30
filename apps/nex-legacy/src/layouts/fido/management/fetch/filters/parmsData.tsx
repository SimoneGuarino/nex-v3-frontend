import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from 'examples/Fetch';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
};

export function ParamsDataAPI({userContext, abortController, setData, setLoadState, openErrorSB} : 
    {userContext: UserContext, abortController: any, setData: (prev : any) => void;
        setLoadState: (prev: boolean) => void; openErrorSB: (icon: string, message: string) => void;
    }): void {
    if (userContext.details === undefined) { return; }
    FetchData(`${import.meta.env.VITE_API_CUSTOMERSFIDO}prm-mng`, 'POST', {
        tk: userContext.token,
    }, abortController).then(async (res: any) => {
        setLoadState(false);
        setData(res);
    }).catch((error: any) => {
        setLoadState(false);
        if (error.name !== 'AbortError') {
            console.error(error);
            let error_ = "Sembra che ci sia stato un problema nel comunicare con il server, perfavore contatta l'assistenza"
            if(error && (error?.msg || error?.message)){    error_ = (error.msg || error.message);     };
            return enqueueSnackbar(error_, {
                title: 'Ops..',
                type: 'error',
            });
        };
    });
}