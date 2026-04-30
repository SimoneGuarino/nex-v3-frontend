import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from 'examples/Fetch';

interface GlobalDataAPIProps{
    abortController: any;
    setGlobalData: (prev: any) => void;
};

export function GlobalDataAPI({abortController, setGlobalData} : GlobalDataAPIProps): void {   
    FetchData(`${import.meta.env.VITE_API_ADMIN}glbs-rt`, 'GET', null, abortController).then(async (res: any) => {
        setGlobalData(res);
    }).catch((error: any) => {
        console.error(error);
        let error_ = "C'è stato un problema nel recuperare i dati globali, perfavore contatta l'assistenza."
        if(error && error?.msg){    error_ = error.msg;     };
        return enqueueSnackbar(error_, {
            title: 'Ops..',
            type: 'error',
        });
    });
}