import { FetchData } from 'examples/Fetch';
import { enqueueSnackbar } from 'components/MessageBox';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
};

interface LoadStatusProps {
    correlations: boolean;
    dataOnInspect: boolean;
};

interface SearchItemAPIProps {
    userContext: UserContext;
    abortController: any;
    ChangeErrorStatus: () => void;
    setLineList: (prev: any) => void;
    setCorrelations: (prev: any) => void;
    setData: (prev: any) => void;
    setLoadStatus: (prev: any) => void;
    setSellerCHList: (prev: any) => void;
};


export function CorrelationsDataAPI({ userContext, abortController, ChangeErrorStatus, setLineList,
setCorrelations, setData, setLoadStatus, setSellerCHList}: SearchItemAPIProps): void {
    if (userContext.details === undefined) { return; }
    FetchData(`${import.meta.env.VITE_API_CONFIGURATORS}agttgt/conf/gt-flt`, 'POST', {
        tk: userContext.token,
    }, abortController).then((res: any) => {
        if(res && res.dt && res.odc && res.sch){
            setCorrelations(res.odc); //lista completa delle linee con all'interno i brand.
            setLineList(res.dt); //lista delle linee filtrata in base alle configurazioni presenti nel db.
            setSellerCHList(res.sch); //lista dei canali di vendita

            setData((_: any) => {
                const arr = [];
                for (let i = 0; i < res.odc.length; i++) {
                    const line = res.odc[i];
                    const check = res.dt.findIndex((x: {linea: string}) => x.linea === line.linea);
                    if(check === -1){
                        arr.push(line);
                    };
                }
                return arr;
            });
            setLoadStatus((prev: LoadStatusProps) => {
                return {...prev, correlations: false}
            });
        }else{
            enqueueSnackbar("Sembra che i dati al momento non siano disponibili, perfavore contatta un tecnico.", {
                title: 'Ops..',
                type: 'error',
            });
        };
    }).catch((error: any) => {
        if (error.name !== 'AbortError') {
            console.error(error);
            ChangeErrorStatus(); //Modifica lo statehook dedicato all'errore generale.
            let error_ = "Sembra che ci sia stato un problema nel comunicare con il server, perfavore contatta l'assistenza"
            if(error && (error?.msg || error?.message)){    error_ = (error.msg || error.message);     };
            return enqueueSnackbar(error_, {
                title: 'Ops..',
                type: 'error',
            });
        };
    });
}