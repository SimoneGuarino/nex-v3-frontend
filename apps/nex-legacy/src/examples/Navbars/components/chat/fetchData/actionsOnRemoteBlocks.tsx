import { FetchData } from 'examples/Fetch';
import type { MutableRefObject } from 'react';

interface UserContext {
    details?: { username: string };
    token: string;
}

interface DataProps {
    idb: string | null;               // id del blocco (null se creazione)
    titleBlock?: string;
    path?: string;
    to?: { _id: string; nome: string; cognome: string };
    users?: Record<string, unknown>[];
}

type AbortLike = MutableRefObject<AbortController | null> | AbortController;

interface ActionsOnRemoteBlocksProps {
    userContext: UserContext;
    abortController: AbortLike;            // <— tipizza l’abort che ora può essere ref o controller
    data?: DataProps;
    tp: 0 | 1 | 2;
    idBlock?: null | string;
    Action?: ({parms}: {parms?: any}) => void;
}

// risorsa / risposta dell’endpoint
type ApiResponse = { status: boolean; idb_gen: string | null };

export async function ActionsOnRemoteBlocksAPI({
    userContext,
    abortController,
    data,
    tp,
    idBlock,
    Action,
}: ActionsOnRemoteBlocksProps): Promise<string | null | undefined> {
    if (!userContext.details) return;

    try {
        const res = await FetchData<ApiResponse>(            // <— passa il generico QUI
            `${import.meta.env.VITE_API_CHAT}chats/illoggicxzgsdqw8nyem`,
            'POST',
            { dt: data, tp },
            abortController
        );

        if (res.status) {
            if (!idBlock && res.idb_gen) idBlock = res.idb_gen; // aggiorna se serve
            Action?.({ parms: { newIdBlock: idBlock } }); // passa il nuovo idBlock se creato
            return idBlock ?? null;
        }

        return idBlock ?? null;
    } catch (error) {
        console.error(error);
        return undefined;
    }
}
