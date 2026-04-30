// src/layouts/compare/virtualziedTable/fetchData/categories.ts
import { FetchData } from "examples/Fetch";
import type { Dispatch, SetStateAction, MutableRefObject } from "react";

interface CategoriesDataProps {
    setSearchDataContext: Dispatch<SetStateAction<SearchDataShape>>,
    userContext: UserContextLike,
    buyerTarget: string | null,
    ChangeLoadStatus: (params: { from: string; bool: boolean }) => void,
    abortController: AbortLike,
    queryColumns?: SupplierFilter[] | unknown
}

// shape minimale dello stato tabella
type SearchDataShape = {
    brand?: unknown[];
    categories?: unknown[];
    [k: string]: unknown;
};

// user context minimale (token opzionale, come nel tuo UserState)
type UserContextLike = {
    token?: string;
    details?: { username?: string } | null | undefined;
} | null;

// tipo compatibile con FetchData
type AbortLike = MutableRefObject<AbortController | null> | AbortController;

// filtri fornitore (da cookie) eventualmente passati
type SupplierFilter = { Name: string };

// risposta API
type CategoriesResponse = {
    categories: unknown[];
    brand: unknown[];
};

export async function CategoriesData({
    userContext,
    buyerTarget,
    abortController,
    queryColumns,
    setSearchDataContext,
    ChangeLoadStatus,
}: CategoriesDataProps): Promise<void> {
    if (userContext?.details === undefined) return;

    try {
        const res = await FetchData<CategoriesResponse>(`${import.meta.env.VITE_API_SEARCH_ENDPOINT}tablecategories`, "POST",
            {
                username: (userContext?.details as { username?: string } | undefined)?.username,
                byid: buyerTarget,
                __dist: queryColumns,
            },
            abortController
        );

        setSearchDataContext((prev) => ({
            ...prev,
            categories: res.categories,
            brand: res.brand,
        }));

        if (ChangeLoadStatus) ChangeLoadStatus({ from: "categories", bool: false });
    } catch (error) {
        console.error(error);
    }
}