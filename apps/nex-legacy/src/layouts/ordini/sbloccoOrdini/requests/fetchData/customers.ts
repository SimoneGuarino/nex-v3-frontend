import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from 'examples/Fetch';


interface UserContext {
    details?: {
        username: string;
    };
    token: string;
};
interface ChronoAPIProps {
    userContext: UserContext,
    abortController: any;
    com?: string;

    setErr: (prev: boolean) => void;
    setOnLoad: (prev: boolean) => void;
    setData: (prev: any) => void;
};

export function CustomersAPI({ userContext, abortController, setData,
    setErr, setOnLoad, com }: ChronoAPIProps): void {
    if (userContext.details === undefined) { return; }
    let params = { tk: userContext.token }

    if (com) {
        Object.assign(params, { com: com });
    };

    FetchData(`${import.meta.env.VITE_API_ORDER}fb/extbdg/rd-cm`, 'POST', params, abortController).then(async (res: any) => {
        setData((prev: any) => {
            return { ...prev, customersFromRequest: res.cmfr, customers: res.cmfs }
        });
        setOnLoad(false);
    }).catch((error: any) => {
        setOnLoad(false);
        setErr(true);
        
        if (error.name !== 'AbortError') {
            console.error(error);
            let error_ = "Sembra che ci sia stato un problema nel recuperare i dati dei clienti, perfavore contatta l'assistenza"
            if (error && error?.msg) { error_ = error.msg; };
            return enqueueSnackbar(error_, {
                title: 'Ops..',
                type: 'error',
            });
        };
    });
}