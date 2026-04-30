// src/layouts/compare/virtualziedTable/fetchData/CSVDataRequest.ts
import { CreateAndDownloadCSV } from "utils/dwdFile";
import { FetchData } from "examples/Fetch";
import { RetriveSupplierFromCookies } from "utils/retriveSupplierFromCookies";
import type { MutableRefObject } from "react";

// tipi minimi utili
type UserContextLike = {
    token?: string;
    details?: { username?: string } | null | undefined;
} | null;

type AbortLike = MutableRefObject<AbortController | null> | AbortController;

type SupplierFilter = { Name: string };

// l’endpoint ritorna una stringa CSV (JSON-parsed string)
type CSVResponse = string;

export async function CSVDataRequest(
    userContext: UserContextLike,
    buyerTarget: string | null,
    abortController: AbortLike,
    query: string
): Promise<void> {
    if (userContext?.details === undefined) return;

    const __dist: SupplierFilter[] = RetriveSupplierFromCookies("stored_settings");

    try {
        const res = await FetchData<CSVResponse>(
            `${import.meta.env.VITE_API_SEARCH_ENDPOINT}tablecsv?skip=0&${query}`,
            "POST",
            {
                username: (userContext?.details as { username?: string } | undefined)?.username,
                csv: 1,
                byid: buyerTarget,
                __dist,
            },
            abortController
        );

        const fileName =
            "export_focelda_comp_" +
            new Date().toLocaleDateString().split("/").join("_");

        CreateAndDownloadCSV(res, fileName);
    } catch (error) {
        console.error(error);
    }
}
