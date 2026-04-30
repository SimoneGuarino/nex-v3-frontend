import { FetchData } from "examples/Fetch";
import React from "react";

type UserContext = {
    token: string;
    details?: unknown; // basta controllare undefined come nel codice originale
};

type SearchItem = Record<string, any> & {
    Descrizione?: any;
};

type SearchState = Record<string, any> & {
    dati?: SearchItem[];
};

type AbortCtrlArg =
    | React.MutableRefObject<AbortController | null | undefined>
    | AbortController
    | null
    | undefined;

export async function SendData(
    userContext: UserContext,
    abortController: AbortCtrlArg,
    setSearchDataContext: React.Dispatch<React.SetStateAction<SearchState>>,
    e_id: number | string,
    setHintBoxActive: React.Dispatch<React.SetStateAction<boolean>>,
    setInfiniteSCrollAnim: React.Dispatch<React.SetStateAction<boolean>>
): Promise<void> {
    if (userContext?.details === undefined) return;

    try {
        const endpoint = (import.meta.env.VITE_API_SEARCH_ENDPOINT ?? "") + "search/ret";

        // se FetchData non ha tipi, TS lo considera any: forziamo T a unknown e poi normalizziamo
        const data = (await FetchData(
            endpoint,
            "POST",
            { tk: userContext.token, pid: e_id },
            abortController as any
        )) as unknown as Record<string, any>;

        const Obj: SearchItem = {
            ...data,
            Descrizione: { Corta: data?.Descrizione },
        };

        setSearchDataContext((oldValues) => {
            const prev = oldValues?.dati ?? [];
            return { ...oldValues, dati: [Obj, ...prev] };
        });

        setHintBoxActive(false);
        setInfiniteSCrollAnim(false);
    } catch (error) {
        console.error(error);
    }
}
