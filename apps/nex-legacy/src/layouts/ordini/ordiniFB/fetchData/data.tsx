import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from '../../../../examples/Fetch';


interface SafeUserContext {
    token?: string;
    details?: {
        ruolo?: string;
        permissions?: string[];
    };
}

interface DataContextType {
    dati: any[];
    dataLength: number;
    warehouseToT: any;
}

export function DataRetrive(
    setDataContext: React.Dispatch<React.SetStateAction<DataContextType>>,
    userContext: SafeUserContext,
    abortController: AbortController | null,
    setMainLoad: React.Dispatch<React.SetStateAction<boolean>>,
    codiceCommerciale: string | null,
    daySelected: number,
    copyDataContext: any[],
    setCopyDataContext: React.Dispatch<React.SetStateAction<any[]>>,
    setLoadingSendFilter: React.Dispatch<React.SetStateAction<boolean>>,
    setErr: React.Dispatch<React.SetStateAction<boolean>>
) {

    if (!userContext.details) return;

    //Se è stato passato un AbortController già creato → uso quello.
    //Se invece arriva null (o undefined) → creo un nuovo AbortController con new AbortController()
    const controller = abortController ?? new AbortController();

    FetchData(import.meta.env.VITE_API_ORDER + 'orders/fb-pistb', 'POST', {
        tk: userContext.token,
        ut: codiceCommerciale,
        days: daySelected
    }, controller)
        .then(res => {
            setDataContext(prev => ({
                ...prev,
                dati: res.data,
                dataLength: res.data.length,
                warehouseToT: res.warehouseToT
            }));
            if (copyDataContext.length < 1) {
                setCopyDataContext(res.data)
            };
            setMainLoad(false);
            setLoadingSendFilter(false);
        })
        .catch(error => {
            setErr(true);
            setMainLoad(false);
            setLoadingSendFilter(false);

            if (error.name !== 'AbortError') {
                console.error(error);
                enqueueSnackbar(
                    "Sembra che ci sia stato un problema nel comunicare con il server, perfavore contatta l'assistenza",
                    { title: 'Ops..', type: 'error' });
            };
        })
}