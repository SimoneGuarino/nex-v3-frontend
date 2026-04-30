// src/layouts/compare/virtualziedTable/fetchData/excludeElements.ts
import type { Dispatch, SetStateAction, MutableRefObject } from 'react';
import { enqueueSnackbar } from 'components/MessageBox';
import { FetchData } from 'examples/Fetch';
import type { SearchDataShape } from './sendFilters';

type UserDetails = { username?: string };

// 🔧 token reso opzionale per allinearsi a UserState
type UserContextLike = {
    token?: string;
    details?: UserDetails;
};

type AbortLike = MutableRefObject<AbortController | null> | AbortController;

type ExcludeResponse = {
    dati: unknown[];
    dataLength: number;
};

export async function ExcludeElements<S extends SearchDataShape>(
    setSearchDataContext: Dispatch<SetStateAction<S>>,
    userContext: UserContextLike,
    buyerTarget: string | null,
    abortController: AbortLike,
    setPanelMode: Dispatch<SetStateAction<number>>,
): Promise<void> {
    if (userContext.details === undefined) return;

    const base = import.meta.env.VITE_API_SEARCH_ENDPOINT ?? '';
    const url = `${base}exclude/read/items`;

    try {
        const res = await FetchData<ExcludeResponse>(url, 'POST',
            {
                username: userContext.details?.username,
                tk: userContext.token,                // può essere undefined
                byid: buyerTarget,
            },
            abortController
        );

        setSearchDataContext((prev) => ({
            ...prev,
            dati: res.dati,
            dataLength: res.dataLength,
        }));

        setPanelMode(1);
    } catch (error) {
        console.error(error);
        enqueueSnackbar(
            'Sembra che ci sia stato un problema con il retrive dei Dati, perfavore contatta un tecnico.',
            { title: 'Ops..', type: 'error' }
        );
    }
}
