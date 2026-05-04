import { isKeyInObject } from "vdck";
import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";
import { ChangeLoadArgs, ImpaginationState } from "components/UI/panels/customerNotes/types";

export function getTotals({
    userContext,
    abortController,
    body,
    setErr,
    ChangeLoadStatus,
    setPagination,
}: {
    userContext: { [key: string]: any };
    abortController: any;
    body: { [key: string]: any };
    setErr: (prev: boolean) => void;
    ChangeLoadStatus: ({ from, bool }: ChangeLoadArgs) => void;
    setPagination: React.Dispatch<React.SetStateAction<ImpaginationState>>;
}): Promise<any> {
    if (!isKeyInObject(userContext, "token", "s", { minLength: 1 })) {
        return Promise.resolve(false);
    }

    const url = `${import.meta.env.VITE_API_CUSTOMERSFIDO}customers/report/note-clienti/list`;
    const payload = { ...body };

    return FetchData(url, "POST", payload, abortController)
        .then((res: any) => {
            setPagination((pagination: ImpaginationState) => ({
                ...pagination,
                total: Number.isFinite(res?.total) ? Number(res.total) : pagination?.total,
            }));

            ChangeLoadStatus({ from: "total", bool: false });
            return true;
        })
        .catch((error: any) => {
            if (error.name !== "AbortError") {
                ChangeLoadStatus({ from: "search", bool: false });
                console.error(error);
                let error_ =
                    "Sembra che ci sia stato un problema nel retrive dei dati nella tabella delle note clienti, perfavore contatta un tecnico.";
                if (error && (error?.msg || error?.message)) error_ = error.msg || error.message;
                enqueueSnackbar(error_, { title: "Ops..", type: "error" });
                setErr(true);
            }
            throw error;
        });
}