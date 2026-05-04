import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";
import { SearchResponse } from "layouts/quotazioni/types/qts_product";
import { ChangeLoadStatusArgs } from "layouts/quotazioni/types/quotations";

type GetCustomersDataAPIProps = {
    abortController: AbortController;
    quotationId: string;
    query: string;
    ChangeLoadStatus: ({ from, bool }: ChangeLoadStatusArgs) => void;
}
export async function SearchProductsAPI({
    abortController, ChangeLoadStatus, quotationId, query
}: GetCustomersDataAPIProps): Promise<SearchResponse | undefined> {
    try {
        ChangeLoadStatus({ from: "req_customersList", bool: true });

        const base = import.meta.env.VITE_API_ORDER ?? "";
        const baseUrl = new URL(`${base}quotations/${quotationId}/search/global`);
        const incomingParams = new URLSearchParams(query);

        incomingParams.forEach((value, key) => {
            baseUrl.searchParams.set(key, value);
        });

        const res = await FetchData(
            baseUrl.toString(),
            "GET",
            null,
            abortController
        );

        if (!res || (res && !Array.isArray(res.items))) {
            throw new Error("Risposta dal server non valida");
        };
        return res;
    } catch (err: unknown) {
        const e = err as { name?: string; message?: any };
        if (e?.name !== "AbortError") {
            const backendMsg =
                typeof e?.message === "string"
                    ? e.message
                    : e?.message?.msg || "Errore nel recupero delle quotazioni.";
            console.error("[getOwnQuotationsData] error:", err);
            enqueueSnackbar(backendMsg, {
                title: 'Ops..',
                type: 'error',
            });
        }
    } finally {
        ChangeLoadStatus({ from: "req_customersList", bool: false });
    }
};
