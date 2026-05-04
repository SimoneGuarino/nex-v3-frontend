import { FetchData } from 'examples/Fetch';

interface InfiniteScrollAPIProps {
    abortController: React.MutableRefObject<AbortController | null>;
    page: number;
    filters?: Record<string, any>;
}

const setIfDefined = (sp: URLSearchParams, key: string, value?: string | number) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
        sp.set(key, String(value));
    }
};

export function GetMoreOwnQuotations({
    abortController,
    page,
    filters = {},
}: InfiniteScrollAPIProps): Promise<any> {
    const base = import.meta.env.VITE_API_ORDER ?? "";
    const url = new URL(`${base}quotations/get/own`);

    setIfDefined(url.searchParams, "stato", filters?.stato);
    setIfDefined(url.searchParams, "tipologia", filters?.tipologia);
    setIfDefined(url.searchParams, "limit", filters?.limit);
    setIfDefined(url.searchParams, "sortBy", filters?.sortBy);
    setIfDefined(url.searchParams, "order", filters?.order);
    setIfDefined(url.searchParams, "dateFrom", filters?.dateFrom);
    setIfDefined(url.searchParams, "dateTo", filters?.dateTo);
    setIfDefined(url.searchParams, "prog_num", filters?.prog_num);
    setIfDefined(url.searchParams, "valoreMin", filters?.valoreMin);
    setIfDefined(url.searchParams, "valoreMax", filters?.valoreMax);
    setIfDefined(url.searchParams, "buyerCode", filters?.buyerCode);
    setIfDefined(url.searchParams, "agenteId", filters?.agenteId);
    setIfDefined(url.searchParams, "osf", page);

    return FetchData(
        url.toString(),
        'GET',
        null,
        abortController
    );
}