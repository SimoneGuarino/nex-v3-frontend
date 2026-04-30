import { FetchData } from 'examples/Fetch';
import { enqueueSnackbar } from 'components/MessageBox';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
};

interface ConfiguratorsActionsAPIProps {
    userContext: UserContext;
    abortController: any;
    settings: {
        tp: 0 | 1 | 2;
        dataToSend?: any;
        nome?: string;
    }
    setFilteredData: (arg0: any) => void;
    setRawData: (arg0: any) => void;
};

/// TP: 0 - Elimina
/// TP: 1 - Inserimento
/// TP: 2 - Edit
export function ConfiguratorsActionsAPI({ userContext, abortController, settings, setFilteredData, setRawData }: ConfiguratorsActionsAPIProps): void {
    if (userContext.details === undefined) { return; }
    let bodyToSend: any = {};

    if(settings.tp === 1){
        bodyToSend.tp = settings.tp;
        bodyToSend.nome = settings.nome;
        bodyToSend.dt = {assegnazioni: settings.dataToSend};
    }else if(settings.tp === 0){
        bodyToSend.tp = settings.tp;
        bodyToSend.id = settings.dataToSend;
    }

    FetchData(`${import.meta.env.VITE_API_CONFIGURATORS}/dists/et-dt`, 'POST', {
        tk: userContext.token,
        ...bodyToSend,
    }, abortController).then((data: any) => {
        if(settings.tp === 1){
            if(data.id){
                setFilteredData((prev: any) => [{
                    _id: data.id, 
                    ...settings.dataToSend
                }, ...prev]);
                setRawData((prev: any) => [{
                    _id: data.id, 
                    ...settings.dataToSend
                }, ...prev]);
            }
        }
    }).catch((errorState: {name: string, status: number, message?: string | {[key: string]: string}}) => {
        if (errorState.name !== 'AbortError') {
            let error_ = ""
            const error: string | {[key: string]: string} | undefined = errorState?.message;
            console.error(errorState);
            if(error){
                if(typeof error === 'string'){
                    error_ = (error as any).message; 
                }else if(error !== undefined && error?.msg){
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
    });
}