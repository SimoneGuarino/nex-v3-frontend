//src\layouts\clienti\fetchData\reportProfilazione\richCambioAgente\getData.ts
import { isKeyInObject } from "vdck";
import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";
import { ChangeLoadStatusArgs } from "layouts/clienti/types/load";

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
    body: { [key: string]: any };
    offset: React.MutableRefObject<number>;
    setData: (updater: any) => void;
    setErr: (prev: boolean) => void;
    ChangeLoadStatus: (args: ChangeLoadStatusArgs) => void;
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

    const url = `${import.meta.env.VITE_API_CUSTOMERSFIDO}customers/report/cambio-agente/list?ofs=${ofs}`;
    const payload = { ...body, limit: PAGE_SIZE };

    return FetchData(url, "POST", payload, abortController)
        .then((res: any) => {
            const items = Array.isArray(res?.items) ? res.items : [];

            if (typeof setTotal === "function" && Number.isFinite(res?.total)) {
                setTotal(Number(res.total));
            }

            setData((prev: any[]) => (ofs === 0 ? items : [...(prev || []), ...items]));
            // Reset search flag quando la prima pagina finisce (ofs === 0)
            if (ofs === 0) {
                ChangeLoadStatus({ from: "search", bool: false });
            }

            offset.current = ofs + items.length;
            return true;
        })
        .catch((error: any) => {
            if (error.name !== "AbortError") {
                ChangeLoadStatus({ from: "search", bool: false });
                console.error(error);
                let error_ =
                    "Sembra che ci sia stato un problema nel retrive dei dati nella tabella richieste cambio agente, perfavore contatta un tecnico.";
                if (error && (error?.msg || error?.message)) error_ = error.msg || error.message;
                enqueueSnackbar(error_, { title: "Ops..", type: "error" });
                setErr(true);
            }
            throw error;
        });
}
