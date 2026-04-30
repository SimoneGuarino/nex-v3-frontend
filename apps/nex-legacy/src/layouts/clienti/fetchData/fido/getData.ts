//src\layouts\clienti\fetchData\fido\getData.ts
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
    setTotals,
}: {
    userContext: { [key: string]: any };
    abortController: any;
    body: { [key: string]: any };
    offset: React.MutableRefObject<number>;
    setData: (updater: any) => void;
    setErr: (prev: boolean) => void;
    ChangeLoadStatus: ({ from, bool }: ChangeLoadStatusArgs) => void;
    setTotal?: (n: number) => void;
    setTotals?: (v: { sfrs: number; sftot: number }) => void;
}): Promise<any> {

    if (!isKeyInObject(userContext, "token", "s", { minLength: 1 })) {
        return Promise.resolve(false);
    }

    const ofs = Number.isFinite(offset.current) && offset.current >= 0 ? offset.current : 0;
    const baseUrl = `${import.meta.env.VITE_API_CUSTOMERSFIDO}customers/fido`;

    // 1) se siamo alla prima pagina e ci hanno passato i setter per i totali,
    //    facciamo anche la chiamata con tt: true (totali)
    const totalsPromise =
        ofs === 0 && (setTotal || setTotals)
            ? FetchData(
                `${baseUrl}?ofs=0`,
                "POST",
                { ...body, tt: true },
                abortController
            )
                .then((totalsRes: any) => {
                    if (typeof setTotal === "function" && Number.isFinite(totalsRes?.total)) {
                        setTotal(Number(totalsRes.total));
                    }
                    if (typeof setTotals === "function") {
                        setTotals({
                            sfrs: Number(totalsRes?.sfrs ?? 0),
                            sftot: Number(totalsRes?.sftot ?? 0),
                        });
                    }
                })
                .catch((error: any) => {
                    // i totali non devono bloccare la tabella
                    if (error.name !== "AbortError") {
                        console.error(error);
                    }
                })
            : Promise.resolve();

    // 2) chiamata lista (tt: false), come prima
    const bodyToSend: any = { tt: false, ...body };

    const listPromise = FetchData(
        `${baseUrl}?ofs=${ofs}`,
        "POST",
        bodyToSend,
        abortController
    );

    return Promise.all([totalsPromise, listPromise])
        .then(([, res]: [any, any]) => {
            const items = Array.isArray(res?.items)
                ? res.items
                : Array.isArray(res)
                    ? res
                    : [];

            setData((prev: any[]) => (ofs === 0 ? items : [...(prev || []), ...items]));
            offset.current = ofs + items.length;

            ChangeLoadStatus({ from: "infiniteScroll", bool: false });
            // Reset search flag quando la prima pagina finisce (ofs === 0)
            if (ofs === 0) {
                ChangeLoadStatus({ from: "search", bool: false });
            }
            return true;
        })
        .catch((error: any) => {
            if (error.name !== "AbortError") {
                ChangeLoadStatus({ from: "infiniteScroll", bool: false });
                ChangeLoadStatus({ from: "search", bool: false });
                console.error(error);
                let error_ =
                    "Sembra che ci sia stato un problema nel retrive dei dati nella tabella, perfavore contatta un tecnico.";
                if (error && (error?.msg || error?.message)) error_ = error.msg || error.message;
                enqueueSnackbar(error_, { title: "Ops..", type: "error" });
                setErr(true);
            }
            throw error;
        });
}
