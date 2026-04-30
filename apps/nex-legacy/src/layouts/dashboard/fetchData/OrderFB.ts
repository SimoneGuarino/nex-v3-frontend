import { FetchData } from 'examples/Fetch';
import { MutableRefObject } from 'react';

type FBStats = { pis: number; cnr: number };

interface DataAPIProps {
    abortController: MutableRefObject<AbortController | null>;
    HandleComplete: (response: FBStats) => void;
    HandleError: (errorMessage: string) => void;
};
export async function OrderFBAPI({ abortController, HandleComplete, HandleError }: DataAPIProps) {
    return await FetchData(`${import.meta.env.VITE_API_USERS}dashboard/esztmzjkp8myop5pb90z`, 
        'GET', null, abortController)
    .then((res: FBStats) => {
        return HandleComplete(res);
    }).catch((errorState: any) => {
        if (errorState.name !== 'AbortError') {
            console.error(errorState);
        };
        HandleError('Qualcosa è andato storto, se questo errore persiste, perfavore contatta il nostro supporto tecnico.');
    });
};