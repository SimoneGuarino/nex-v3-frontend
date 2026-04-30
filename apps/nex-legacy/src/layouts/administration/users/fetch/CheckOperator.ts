import { FetchData } from 'examples/Fetch';
import { MutableRefObject } from 'react';

interface DataAPIProps {
    abortController: MutableRefObject<AbortController | null>;
    body: {
        tp: string;
    };
    HandleComplete: (message: { response: string }) => void;
    HandleError: (errorMessage: string) => void;
};
export async function CheckOperatorAPI({ abortController, body, HandleComplete, HandleError }: DataAPIProps) {
    return await FetchData(`${import.meta.env.VITE_API_ADMIN}requests/users/read/JHbokWNPjS2Sr56fJDaI`, 'POST', body, abortController)
    .then((res: any) => {
        return HandleComplete(res);
    }).catch((errorState: any) => {
        if (errorState.name !== 'AbortError') {
            console.error(errorState);
        };
        HandleError('Qualcosa è andato storto, se questo errore persiste, perfavore contatta il nostro supporto tecnico.');
    });
}