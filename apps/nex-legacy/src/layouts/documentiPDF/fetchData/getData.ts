import { FetchData } from 'examples/Fetch';
import { MutableRefObject } from 'react';
import { DocumentItem } from '../types';

interface DataAPIProps {
    abortController: MutableRefObject<AbortController | null>;
    query: string;
    HandleError: (errorMessage: string) => void;
    ChangeLoadStatus: ({ from, bool }: { from: string; bool: boolean }) => void;
};
export async function GetDataAPI({ abortController, query, HandleError, ChangeLoadStatus }: DataAPIProps) {
    return await FetchData(`${import.meta.env.VITE_API_PDF_READER}pdf/v2/search?${query}`, 'GET', null, abortController)
    .then((res: { items: DocumentItem[], pagination: {[key: string]: string | number}}) => {
        return res;
    }).catch((errorState: any) => {
        if (errorState.name !== 'AbortError') {
            console.error(errorState);
        };
        HandleError('Qualcosa è andato storto, se questo errore persiste, perfavore contatta il nostro supporto tecnico.');
    });
}