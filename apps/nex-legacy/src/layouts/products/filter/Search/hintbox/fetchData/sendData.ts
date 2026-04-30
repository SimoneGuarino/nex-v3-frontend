// src/layouts/compare/filter/Search/hintbox/fetchData/sendData.ts
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { FetchData } from 'examples/Fetch';

// ---------------------- tipi locali utili ----------------------

// userContext: allineato a UserState (token opzionale)
type UserContextLike = {
    token?: string;
    details?: unknown;
};

// AbortController passato come ref o come istanza
type AbortLike = MutableRefObject<AbortController | null> | AbortController;

// stato minimo che aggiorniamo: deve avere almeno "dati"
type HasDatiState = { dati: unknown[] } & Record<string, unknown>;

// risposta attesa dall'endpoint "search/ret"
type SearchRetResponse = {
    Descrizione?: string;
    [k: string]: unknown;
};

// ---------------------- funzione principale ----------------------

export async function SendData<S extends HasDatiState>(
    userContext: UserContextLike,
    abortController: AbortLike,
    setSearchDataContext: Dispatch<SetStateAction<S>>,
    e_id: string,                       // product id
    e_da: string | number,              // parametro "da" (mantengo flessibile)
    setHintBoxActive: Dispatch<SetStateAction<boolean>>,
    setInfiniteSCrollAnim: Dispatch<SetStateAction<boolean>>
): Promise<void> {
    if (userContext.details === undefined) return;

    const base = import.meta.env.VITE_API_SEARCH_ENDPOINT ?? '';
    const url = `${base}pds/search/ret`;

    try {
        const data = await FetchData<SearchRetResponse>(
            url,
            'POST',
            { pid: e_id, da: e_da },
            abortController
        );

        const Obj = {
            ...data,
            Descrizione: { Corta: data?.Descrizione }, // mantengo il mapping originale
            onEvidance: true,
        };

        setSearchDataContext((oldValues) => {
            const current = Array.isArray(oldValues?.dati) ? oldValues.dati : [];
            return { ...oldValues, dati: [Obj, ...current] } as S;
        });

        setHintBoxActive(false);
        setInfiniteSCrollAnim(false);
    } catch (error) {
        console.error(error);
    }
}
