import { FetchData } from 'examples/Fetch';
import { enqueueSnackbar } from 'components/MessageBox';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
};

interface GetTableDataProps {
    userContext: UserContext;
    abortController: any;
    distributorsName: string;
    setRawData: (arg0: any) => void;
    setFilteredData: (arg0: any) => void;
    ChangeLoadStatus: (arg0: { from: string, bool: boolean }) => void;
};


export function GetTableDataAPI({ userContext, abortController, distributorsName, setRawData, setFilteredData, ChangeLoadStatus }: GetTableDataProps): void {
    if (userContext.details === undefined) { return; }
    FetchData(`${import.meta.env.VITE_API_CONFIGURATORS}/dists/gt-ag`, 'POST', {
        tk: userContext.token,
        ds: distributorsName,
        of: 0,
    }, abortController).then((data: any) => {
        if (data && Array.isArray(data) && data.length > 0) {
            setRawData(data);
            setFilteredData(data);
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