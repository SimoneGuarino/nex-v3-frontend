import { FetchData } from 'examples/Fetch';
import { enqueueSnackbar } from 'components/MessageBox';

interface UserContext {
    details?: {
        username: string;
    };
    token: string;
}

interface LoadStatusProps {
    correlations: boolean;
    dataOnInspect: boolean;
};

interface SearchAPIProps {
    userContext: UserContext;
    abortController: any;
    line: string;
    setDataOnInspect: (prev: any) => void;
    setLoadStatus: (prev: any) => void;
    QuartersDifference: ({ data } : { data: any }) => void;
    ChangeLoadStatus: ({from, bool} : {from: "create" | "dataOnInspect" | "correlations" | "search"; bool?: boolean}) => void;
}


export function SearchAPI({ userContext, abortController, line, setDataOnInspect, setLoadStatus, ChangeLoadStatus, QuartersDifference}: SearchAPIProps): void {
    if (userContext.details === undefined) { return; }
    FetchData(`${import.meta.env.VITE_API_CONFIGURATORS}/agttgt/conf/gt-dt`, 'POST', {
        tk: userContext.token,
        lin: line
    }, abortController).then((res: any) => {
        if(res){    
            setDataOnInspect(res); 
            QuartersDifference({data: res});
        };
        setLoadStatus((prev: LoadStatusProps) => {
            return {...prev, dataOnInspect: false}
        });
        
        ChangeLoadStatus({ from: 'search', bool: false });
    }).catch((error: any) => {
        ChangeLoadStatus({ from: 'search', bool: false });

        if (error.name !== 'AbortError') {
            console.error(error);
            let error_ = "Sembra che i dati al momento non siano disponibili, perfavore contatta un tecnico."
            if(error && (error?.msg || error?.message)){    error_ = (error.msg || error.message);     };
            return enqueueSnackbar(error_, {
                title: 'Ops..',
                type: 'error',
            });
        };
    });
}