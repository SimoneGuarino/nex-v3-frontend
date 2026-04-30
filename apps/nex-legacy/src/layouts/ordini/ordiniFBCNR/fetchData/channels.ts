import { FetchData } from 'examples/Fetch';
import { MutableRefObject } from 'react';

interface ChannelsAPIProps {
    abortController: MutableRefObject<AbortController | null>;
    HandleComplete: (message: { response: string }) => void;
    HandleError: (errorMessage: string) => void;
};
export async function ChannelsAPI({ abortController, HandleComplete, HandleError }: ChannelsAPIProps) {
    return await FetchData(`${import.meta.env.VITE_API_ORDER}get-channels`, 'GET', null, abortController)
    .then((res: { session_id: string; response: string }) => {
        return HandleComplete(res);
    }).catch((errorState: any) => {
        if (errorState.name !== 'AbortError') {
            console.error(errorState);
        };
        HandleError('Qualcosa è andato storto, se questo errore persiste, perfavore contatta il nostro supporto tecnico.');
    });
}