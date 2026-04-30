import { FetchData } from 'examples/Fetch';
import { enqueueSnackbar } from 'components/MessageBox';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
};

interface GetDistributorsParamsAPIProps {
    userContext: UserContext;
    abortController: any;
    distributorsName: string;
    setDistributorStructure: (arg0: any) => void;
    ChangeLoadStatus: (arg0: { from: string, bool: boolean }) => void;
};


export function GetDistributorsParamsAPI({ userContext, abortController, distributorsName, setDistributorStructure, ChangeLoadStatus }: GetDistributorsParamsAPIProps): void {
    if (userContext.details === undefined) { return; }
    FetchData(`${import.meta.env.VITE_API_CONFIGURATORS}/dists/gt-flt`, 'POST', {
        tk: userContext.token,
        ds: distributorsName
    }, abortController).then((data: any) => {
        if (data) {
            setDistributorStructure((prev: any) => ({ focelda: prev.focelda, fornitore: 
                { 
                    linee: data?.linee || [], 
                    gruppi: data?.gruppi || [], 
                    famiglie: data?.famiglie || [] 
                } 
            }));
        };
        ChangeLoadStatus({ from: 'table', bool: false });
    }).catch((errorState: { name: string, status: number, message?: string | { [key: string]: string } }) => {
        if (errorState.name !== 'AbortError') {
            let error_ = ""
            const error: string | { [key: string]: string } | undefined = errorState?.message;
            console.error(errorState);
            if (error) {
                if (typeof error === 'string') {
                    error_ = (error as any).message;
                } else if (error !== undefined && error?.msg) {
                    error_ = error.msg;
                };
            };

            if(!error_ || error_.trim() == ""){
                error_ = "Sembra che non è stato possibile salvare i dati, perfavore contatta un tecnico."
            }

            enqueueSnackbar(error_, {
                title: 'Ops..',
                type: 'error',
            });
            return;
        };
    })
}