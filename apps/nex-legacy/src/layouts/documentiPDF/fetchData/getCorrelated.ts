import { FetchData } from 'examples/Fetch';
import { MutableRefObject } from 'react';
import { DocumentItem } from '../types';

interface CorrelatedAPIProps {
    abortController: MutableRefObject<AbortController | null>;
    query: string;
    HandleError: (errorMessage: string) => void;
};

type CorrelatedPagination = {
    mode: "offset";
    limit: number;
    offset: number;
    nextOffset: number | null;
    hasMore: boolean;
};

type CorrelatedResponse = {
    items: DocumentItem[];
    pagination: CorrelatedPagination;
};

/*
    Recupera i documenti correlati ad un PDF selezionato.
    Endpoint BE:
    - GET /pdf/v2/correlated
    Parametri attesi:
    - from: "FOCELDA" | "IOT" (il BE mappa IOT -> ADJ)
    - fileName: "DOC-BOLLA-..." o "DOC-FATTURA-..."
    - limit/offset: paginazione offset-based
    Nota:
    - ritorna lo stesso "shape" di /pdf/v2/search: { items, pagination }
    - così possiamo riusare la stessa logica di mapping in UI.
 */
export async function GetCorrelatedAPI({ abortController, query, HandleError }: CorrelatedAPIProps) {
    return await FetchData(
        `${import.meta.env.VITE_API_PDF_READER}pdf/v2/correlated?${query}`,
        'GET',
        null,
        abortController
    )
        .then((res: CorrelatedResponse) => {
            return res;
        })
        .catch((errorState: any) => {
            if (errorState.name === 'AbortError') return;
            console.error(errorState);
            HandleError('Qualcosa è andato storto, se questo errore persiste, per favore contatta il nostro supporto tecnico.');
        });
};