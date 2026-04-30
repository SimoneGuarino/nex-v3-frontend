import type { MutableRefObject, Dispatch, SetStateAction } from 'react';
import { RetriveSupplierFromCookies } from 'utils/retriveSupplierFromCookies';
import { FetchData } from 'examples/Fetch';
import { enqueueSnackbar } from 'components/MessageBox';

interface SendFiltersProps {
    userContext: UserContextLike;
    buyerTarget: string | null;
    query: string;
    abortController: AbortLike;
    offset: MutableRefObject<number>;

    setPanelMode: Dispatch<SetStateAction<number>>;
    WarehouseRetriveData: WarehouseRetriveFn;
    ChangeLoadStatus: (status: { from: string; bool: boolean }) => void;
    setSearchDataContext: Dispatch<SetStateAction<SearchDataShape>>;
}

type SupplierCookie = { Name: string };
type WarehouseRetriveFn = ({ queryColumns, query, opt }: { queryColumns: SupplierCookie[]; query: string; opt?: { buyerFilterValue?: string } }) => void;

// 🔧 token reso opzionale per allinearsi a UserState
type UserContextLike = {
    token?: string;
    details?: unknown;
};

export type SearchDataShape = {
    dati: unknown[];
    dataLength: number;
} & Record<string, unknown>;

type SendFiltersResponse = {
    data: unknown[];
    dataLength: number;
};

type AbortLike = MutableRefObject<AbortController | null> | AbortController;



export async function SendFilters<S extends SearchDataShape>({
    setSearchDataContext, userContext, buyerTarget, query,
    abortController, setPanelMode, WarehouseRetriveData,
    ChangeLoadStatus, offset,
}: SendFiltersProps): Promise<void> {
    if (userContext.details === undefined) return;

    const base = import.meta.env.VITE_API_SEARCH_ENDPOINT ?? '';
    const url = `${base}table?${query}`;

    try {
        const res = await FetchData<SendFiltersResponse>(url, 'POST',
            {
                byid: buyerTarget,
                of: offset.current,
                __dist: RetriveSupplierFromCookies('stored_settings'),
            },
            abortController
        );

        setSearchDataContext((prev) => ({
            ...prev,
            dati: res.data,
            dataLength: res.dataLength,
        }));

        setPanelMode(0);
        offset.current++;

        if (WarehouseRetriveData) {
            let params: { query: string; queryColumns: SupplierCookie[]; opt?: { buyerFilterValue: string } } = {
                query, 
                queryColumns: RetriveSupplierFromCookies('stored_settings'), 
            };

            if(buyerTarget){
                params.opt = { buyerFilterValue: (buyerTarget as string) };
            };

            WarehouseRetriveData(params);
        }
    } catch (error) {
        console.error(error);
        enqueueSnackbar(
            'Sembra che ci sia stato un problema con il retrive dei Dati, perfavore contatta un tecnico.',
            { title: 'Ops..', type: 'error' }
        );
    } finally {
        ChangeLoadStatus({ from: 'table', bool: false });
    };
};