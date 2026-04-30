// src/layouts/dashboard/fetchData/CompareData.ts
import { FetchData } from 'examples/Fetch';
import { MutableRefObject } from 'react';

type CompareStats = {
    highter: number;   // Focelda più ALTO
    lower: number;     // Focelda più BASSO
    exclution: number; // Totale esclusi
    totale: number;    // Totale assegnati
};

interface DataAPIProps {
    abortController: MutableRefObject<AbortController | null>;
    HandleComplete: (response: CompareStats) => void;
    HandleError: (errorMessage: string) => void;
};

export async function ProductsToEditAPI({ abortController, HandleComplete, HandleError }: DataAPIProps) {
    // [PATCH] aggiunto widget=1 per forzare il filtro buyer lato BE const url = `${import.meta.env.VITE_API_USERS}dashboard/JHbokWNPjS2Sr56fJDaI?skip=0&disp=1&dfval=-0.1&dfcat=0&widget=1`
    //Elimino widget=1 
    const url = `${import.meta.env.VITE_API_USERS}dashboard/JHbokWNPjS2Sr56fJDaI?skip=0&disp=1&dfval=-0.1&dfcat=0`;
    return await FetchData(
        url,
        'GET',
        null,
        abortController
    )
        .then((res: CompareStats) => {
            return HandleComplete(res);
        }).catch((errorState: any) => {
            if (errorState.name !== 'AbortError') {
                console.error(errorState);
            };
            HandleError('Qualcosa è andato storto, se questo errore persiste, perfavore contatta il nostro supporto tecnico.');
        });
};
