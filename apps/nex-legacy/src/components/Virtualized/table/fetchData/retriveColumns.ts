import { FetchData } from 'examples/Fetch';

type RetriveColumnsRequest = {
    tabella: string;
};

export type RetriveColumnConfig = {
    key?: string;
    nome?: string;
    descrizione?: string;
    type?: string;
    sort?: boolean;
    sortType?: string;
    width?: number;
    hide?: boolean;
    [key: string]: unknown;
};

type RetriveColumnsResponse = {
    dt?: RetriveColumnConfig[];
};

export async function RetriveColumnsAPI(
    payload: RetriveColumnsRequest,
    abortController: AbortController
): Promise<RetriveColumnConfig[]> {
    const res = await FetchData<RetriveColumnsResponse>(
        `${import.meta.env.VITE_API_CONFIGURATORS}columns/retriveColumns`,
        'POST',
        payload,
        abortController
    );

    return Array.isArray(res?.dt) ? res.dt : [];
}
