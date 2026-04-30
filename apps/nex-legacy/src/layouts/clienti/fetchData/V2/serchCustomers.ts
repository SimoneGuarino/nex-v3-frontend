import { FetchData } from 'examples/Fetch';
import { enqueueSnackbar } from "components/MessageBox";
import { ChangeLoadStatusArgs } from 'layouts/clienti/types/load';
import { CustomerOption } from 'layouts/clienti/types/view';


type GetCustomersDataAPIProps = {
    abortController: AbortController;
    params: string;
    ChangeLoadStatus: ({ from, bool }: ChangeLoadStatusArgs) => void;
}

export async function SearchCustomersAPI({
    abortController, ChangeLoadStatus, params
}: GetCustomersDataAPIProps): Promise<CustomerOption[] | undefined> {
    try {
        ChangeLoadStatus({ from: "search_customers", bool: true });

        const base = import.meta.env.VITE_API_CUSTOMERSFIDO ?? "";
        const url = new URL(`${base}/v2/customers/search?${params.toString()}`);

        const res = await FetchData(
            url.toString(),
            "GET",
            null,
            abortController
        );

        if(!res || (res && !Array.isArray(res.items))) {
            throw new Error("Risposta dal server non valida");
        };
        return res.items;
    } catch (err: unknown) {
        const e = err as { name?: string; message?: any };
        if (e?.name !== "AbortError") {
            const backendMsg =
                typeof e?.message === "string"
                    ? e.message
                    : e?.message?.msg || "Errore nel recupero delle quotazioni.";
            console.error("[SearchCustomersAPI] error:", err);
            enqueueSnackbar(backendMsg, {
                title: 'Ops..',
                type: 'error',
            });
        }
    } finally {
        ChangeLoadStatus({ from: "search_customers", bool: false });
    }
}