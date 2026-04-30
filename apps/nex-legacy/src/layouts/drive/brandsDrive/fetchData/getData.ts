import { isKeyInObject } from "vdck";

// Components
import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";

// Lista dei brands e types disponibili
export function getData({ userContext, abortController, setFolderList, setTypesList, setErr, ChangeLoadStatus }: {
    userContext: { [key: string]: any },
    abortController: any,
    setFolderList: (prev: any) => void,
    setTypesList: (prev: any) => void,
    setErr: (prev: boolean) => void,
    ChangeLoadStatus: ({ from, bool }: { from: string, bool: boolean }) => void;
}): void {
    // Check userContext
    if (!isKeyInObject(userContext, "token", "s", { minLength: 1 })) return;

    let bodyToSend: any = {
        tk: userContext.token,
    };

    FetchData(`${import.meta.env.VITE_API_PDF_READER}brd/gt-bd-fld`, "POST", bodyToSend, abortController)
        .then((res: any) => {
            if (res) {
                if (res.brands && Array.isArray(res.brands) && res.brands.length > 0) {
                    setFolderList(res.brands);
                };
                if (res.types && Array.isArray(res.types) && res.types.length > 0) {
                    setTypesList(res.types);
                };
            };
            ChangeLoadStatus({ from: 'data', bool: false });
        })
        .catch((errorState: any) => {
            ChangeLoadStatus({ from: 'data', bool: false });
            if (errorState.name !== 'AbortError') {
                let error_ = "";
                const error: string | { [key: string]: string } | undefined = errorState?.message;
                console.error(errorState);
                if (error) {
                    if (typeof error === 'string') {
                        error_ = (error as any).message;
                    } else if (error !== undefined && error?.msg) {
                        error_ = error.msg;
                    };
                };

                if (!error_ || error_.trim() == "") {
                    error_ = "Sembra che ci sia stato un problema nel retrive dei dati nella tabella, perfavore contatta un tecnico."
                }

                enqueueSnackbar(error_, {
                    title: 'Ops..',
                    type: 'error',
                });
                return;
            };
        });
}