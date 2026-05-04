import { FetchData } from 'examples/Fetch';
import { enqueueSnackbar } from "components/MessageBox";
import { CustomerOption } from '../types';

type ChangeLoadStatusArgs = {
    from: string;
    bool: boolean;
};

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

        const base = import.meta.env.VITE_API_API_CUSTOMERSFIDO ?? "";
        const url = new URL(`${base}/v2/customers/search?${params}`);

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
                    : e?.message?.msg || "Errore nel recupero dei clienti.";
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
