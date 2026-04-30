import { FetchData } from 'examples/Fetch';
import { MutableRefObject } from 'react';
import { FidoStatusItem } from '../widgets/FidiStatusWidget';

interface DataAPIProps {
    abortController: MutableRefObject<AbortController | null>;
    HandleComplete: (response: FidoStatusItem[]) => void;
    HandleError: (errorMessage: string) => void;
};
export async function FidiAPI({ abortController, HandleComplete, HandleError }: DataAPIProps) {
    //andleError('Qualcosa è andato storto, se questo errore persiste, perfavore contatta il nostro supporto tecnico.');

    return await FetchData(`${import.meta.env.VITE_API_USERS}dashboard/tra43y5crrey7w2x4ohg`, 'GET', null, abortController)
    .then((res: FidoStatusItem[]) => {
        return HandleComplete(res);
    }).catch((errorState: any) => {
        if (errorState.name !== 'AbortError') {
            console.error(errorState);
        };
        HandleError('Qualcosa è andato storto, se questo errore persiste, perfavore contatta il nostro supporto tecnico.');
    });
}