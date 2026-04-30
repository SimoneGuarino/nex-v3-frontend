// src/layouts/compare/virtualziedTable/fetchData/warehouse.ts
import { FetchData } from "examples/Fetch";
import type { Dispatch, SetStateAction, MutableRefObject } from "react";

interface WarehouseDataProps {
    userContext: UserContextLike;
    abortController: AbortLike;
    query?: string | null;

    buyerTarget: string | null;
    queryColumns?: SupplierFilter[] | unknown;

    ChangeLoadStatus?: (params: { from: string; bool: boolean }) => void;
    CategoriesRetriveData: CategoriesRetriveFn | null;
    setLastDateDist?: Dispatch<SetStateAction<any[]>> | null;
    setSearchDataContext: Dispatch<SetStateAction<SearchDataShape>>;
}

// ---- tipi minimi utili ----
type SearchDataShape = {
    dati?: unknown[];
    dataLength?: number;
    warehouseToT?: number | string;
    [k: string]: unknown;
};

// token opzionale (allineato a UserState)
type UserContextLike = {
    token?: string;
    details?: { username?: string } | null | undefined;
} | null;

type AbortLike = MutableRefObject<AbortController | null> | AbortController;

type SupplierFilter = { Name: string };

type WarehouseResponse = {
    warehouseToT: number | string;
    totalfound: number;
    lastRetrieve?: unknown;
};

//type CategoriesRetriveFn = (queryColumns: unknown) => void;
type CategoriesRetriveFn = (queryColumns: unknown, opt?: { buyerFilterValue?: string }) => void;

export async function WarehouseData({
    userContext, buyerTarget, abortController, query = null, queryColumns = [],
    CategoriesRetriveData, ChangeLoadStatus, setLastDateDist = null, setSearchDataContext,
}: WarehouseDataProps): Promise<void> {
    if (userContext?.details === undefined) return;

    const link =
        query == null
            ? `${import.meta.env.VITE_API_SEARCH_ENDPOINT}tabletotal`
            : `${import.meta.env.VITE_API_SEARCH_ENDPOINT}tabletotal?${query}`;

    try {
        const res = await FetchData<WarehouseResponse>(link, "POST",
            {
                byid: buyerTarget,
                __dist: queryColumns,
            },
            abortController
        );

        setSearchDataContext((prev) => ({
            ...prev,
            warehouseToT: res.warehouseToT,
            dataLength: res.totalfound,
        }));

        if (setLastDateDist) setLastDateDist(() => res.lastRetrieve);
        if (ChangeLoadStatus) ChangeLoadStatus({ from: "warehouse", bool: false });
        //if (CategoriesRetriveData) CategoriesRetriveData(queryColumns as unknown);
        if (CategoriesRetriveData) {
            let params: { queryColumns: unknown; opt?: { buyerFilterValue: string } } = {
                queryColumns,
            };

            if (buyerTarget) {
                params.opt = { buyerFilterValue: (buyerTarget as string) };
            };
            
            CategoriesRetriveData(params)

        };
    } catch (error) {
        console.error(error);
    }
}