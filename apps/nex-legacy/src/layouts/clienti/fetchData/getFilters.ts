import { isKeyInObject } from "vdck";
import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";

type Option = { value: string; label: string };

export type FidoFiltersOptions = {
    statoCliente: Option[];
    statoCommerciale: Option[];
    microSettore: Option[];
    macroSettore: Option[];
    canaleVendita: Option[];
    areaGeografica: Option[];
    categoriaSconto: Option[];
    brand: Option[];
    partnership: Option[];
    linee: Option[];
    gruppi: Option[];
    province: Option[];
    microSettoreAgg: Option[];
    clientelaRif: Option[];
};

export function getFilters({
    userContext,
    abortController,
    setData,
    setErr,
    ChangeLoadStatus,
}: {
    userContext: { [key: string]: any };
    abortController: any;
    setData: (data: FidoFiltersOptions) => void;
    setErr: (prev: boolean) => void;
    ChangeLoadStatus: ({ from, bool }: { from: string; bool: boolean }) => void;
}): void {
    if (!isKeyInObject(userContext, "token", "s", { minLength: 1 })) return;

    const url = `${import.meta.env.VITE_API_CUSTOMERSFIDO}customers/filtri`;
    const bodyToSend = { tk: userContext.token }; // opzionale per BE, ma manteniamo

    ChangeLoadStatus({ from: "filters", bool: true });

    FetchData<FidoFiltersOptions>(url, "POST", bodyToSend, abortController)
        .then((res) => {
            setData(res);
            ChangeLoadStatus({ from: "filters", bool: false });
        })
        .catch((error: any) => {
            if (error.name === "AbortError") return;

            ChangeLoadStatus({ from: "filters", bool: false });

            console.error(error);
            let error_ =
                "Sembra che ci sia stato un problema nel recupero dei filtri, per favore contatta un tecnico.";
            if (error && (error?.msg || error?.message)) {
                error_ = (error.msg || error.message) as string;
            }

            enqueueSnackbar(error_, { title: "Ops..", type: "error" });
            setErr(true);
        });
}
