import { FetchData } from 'examples/Fetch';
import { MutableRefObject } from 'react';

interface DataAPIProps {
    role: string;
    abortController: MutableRefObject<AbortController | null>;
    HandleComplete: (newRole: { newToken: string, ruolo: string; descrizione: string }) => void;
    HandleError: (errorMessage: string) => void;
};
export async function ChangeRoleAPI({ role, abortController, HandleComplete, HandleError }: DataAPIProps) {
    /*@deprecated con l'introduzione del nuovo endpoint /actAs per il cambio ruolo basato sul ar in sessione
        return await FetchData(`${import.meta.env.VITE_API_USERS}users/mn8hngld92ffdekxsl6r`, 'POST', {rs: role}, abortController)
        .then((res:  { ruolo: string; descrizione: string }) => {
            return HandleComplete(res);
        }).catch((errorState: any) => {
            if (errorState.name !== 'AbortError') {
                console.error(errorState);
            };
            HandleError('Qualcosa è andato storto, se questo errore persiste, perfavore contatta il nostro supporto tecnico.');
        });
    */
    return await FetchData(`${import.meta.env.VITE_API_ENDPOINT}mn8hngld92ffdekxsl6r/actAs`, 'POST', {ar: role}, abortController)
    .then((res:  { newToken: string, ruolo: string; descrizione: string }) => {
        return HandleComplete(res);
    }).catch((errorState: any) => {
        if (errorState.name !== 'AbortError') {
            console.error(errorState);
        };
        HandleError('Qualcosa è andato storto, se questo errore persiste, perfavore contatta il nostro supporto tecnico.');
    });
};