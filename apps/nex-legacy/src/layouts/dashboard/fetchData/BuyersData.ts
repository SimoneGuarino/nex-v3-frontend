import { FetchData } from 'examples/Fetch';
import { MutableRefObject } from 'react';

type BuyerRow = {
    buyer: string;
    fatturatoTrimestreAttuale: number;
    fatturatoTrimestrePrecedente: number;
    fatturatoTrimestreAttualeNew?: number;      // "Fatturato Canali"
    fatturatoTrimestrePrecedenteNew?: number;   // "Fatturato Canali Prec."
    stock: number;
    backorder: number;
    ocfb: number;                                // OC/FB
};

interface DataAPIProps {
    abortController: MutableRefObject<AbortController | null>;
    HandleComplete: (response: BuyerRow[]) => void;
    HandleError: (errorMessage: string) => void;
};
export async function BuyersDataAPI({ abortController, HandleComplete, HandleError }: DataAPIProps) {
    return await FetchData(`${import.meta.env.VITE_API_STOCKS}targetStock/dh-rt-dt`, 
        'GET', null, abortController)
    .then((res: BuyerRow[]) => {
        return HandleComplete(res);
    }).catch((errorState: any) => {
        if (errorState.name !== 'AbortError') {
            console.error(errorState);
        };
        HandleError('Qualcosa è andato storto, se questo errore persiste, perfavore contatta il nostro supporto tecnico.');
    });
};