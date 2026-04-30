import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";
import { ChangeLoadStatusArgs } from "layouts/quotazioni/types/quotations";
import { ProductDetailsApiResponse } from "../types/product";

type GetCustomersDataAPIProps = {
    abortController: AbortController;
    id_product: string;
    ChangeLoadStatus: ({ from, bool }: ChangeLoadStatusArgs) => void;
}
export async function ProductDetailsAPI({
    abortController, ChangeLoadStatus, id_product
}: GetCustomersDataAPIProps): Promise<ProductDetailsApiResponse | undefined> {
    try {
        ChangeLoadStatus({ from: "req_customersList", bool: true });

        const base = import.meta.env.VITE_API_SEARCH_ENDPOINT ?? "";
        const url = new URL(`${base}v1/products/${id_product}`);

        const res = await FetchData(
            url.toString(),
            "GET",
            null,
            abortController
        );

        if(!res || (res && !Array.isArray(res.items))) {
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
}