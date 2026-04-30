import { FetchData } from 'examples/Fetch';
import { MutableRefObject } from 'react';

interface DataAPIProps {
    abortController: MutableRefObject<AbortController | null>;
    prompt: {
        session_id: string;
        question: string;
        model: string;
        version: number;
    };
    HandleComplete: (message: { response: string }) => void;
    HandleError: (errorMessage: string) => void;
    ChangeLoadStatus: ({ from, bool }: { from: string; bool: boolean }) => void;
};
export async function AgentAPI({ abortController, prompt, HandleComplete, HandleError, ChangeLoadStatus }: DataAPIProps) {
    //andleError('Qualcosa è andato storto, se questo errore persiste, perfavore contatta il nostro supporto tecnico.');
    /*${import.meta.env.VITE_API_AI} */
    return await FetchData(`${import.meta.env.VITE_API_AI}v2/chat/start`, 'POST', prompt, abortController)
    .then((res: { session_id: string; response: string }) => {
        console.log("AgentAPI response:", res);
        return HandleComplete(res);
    }).catch((errorState: any) => {
        if (errorState.name !== 'AbortError') {
            console.error(errorState);
        };
        HandleError('Qualcosa è andato storto, se questo errore persiste, perfavore contatta il nostro supporto tecnico.');
    });
}