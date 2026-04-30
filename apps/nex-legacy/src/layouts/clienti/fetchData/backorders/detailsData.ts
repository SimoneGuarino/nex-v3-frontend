//src\layouts\clienti\fetchData\backorders\detailsData.ts
import { isKeyInObject } from "vdck";
import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";

export function getData({
    userContext,
    abortController,
    body,
    offset,
    setData,
    setErr,
    ChangeLoadStatus,
    setTotal,
}: {
    userContext: { [key: string]: any };
    abortController: any;
    body: { [key: string]: any }; // deve contenere almeno business + customerCode
    offset: any;
    setData: (updater: any) => void;
    setErr: (prev: boolean) => void;
    ChangeLoadStatus: ({ from, bool }: { from: string; bool: boolean }) => void;
    setTotal?: (n: number) => void;
}): Promise<any> {
    // ✅ gate autenticazione
    if (!isKeyInObject(userContext, "token", "s", { minLength: 1 })) {
        return Promise.resolve(false);
    }

    const PAGE_SIZE = 50;

    const ofs =
        offset && typeof offset.current === "number" && offset.current >= 0
            ? offset.current
            : 0;

    // rotta di dettaglio backorders
    const url = `${import.meta.env.VITE_API_CUSTOMERSFIDO}customers/backorders/details?ofs=${ofs}`;
    const payload = { ...body, limit: PAGE_SIZE };

    ChangeLoadStatus({ from: "data", bool: true });

    return FetchData(url, "POST", payload, abortController)
        .then((res: any) => {
            const items = Array.isArray(res?.items) ? res.items : [];

            if (typeof setTotal === "function" && Number.isFinite(res?.total)) {
                setTotal(Number(res.total));
            }

            // se ofs === 0 sovrascrivo, altrimenti append (per eventuale infinite scroll)
            setData((prev: any[]) => (ofs === 0 ? items : [...(prev || []), ...items]));

            ChangeLoadStatus({ from: "data", bool: false });

            offset.current = ofs + items.length;
            return true;
        })
        .catch((error: any) => {
            if (error.name !== "AbortError") {
                ChangeLoadStatus({ from: "data", bool: false });
                console.error(error);
                let error_ =
                    "Sembra che ci sia stato un problema nel retrive del dettaglio backorders, perfavore contatta un tecnico.";
                if (error && (error?.msg || error?.message)) error_ = error.msg || error.message;
                enqueueSnackbar(error_, { title: "Ops..", type: "error" });
                setErr(true);
            }
            throw error;
        });
}
