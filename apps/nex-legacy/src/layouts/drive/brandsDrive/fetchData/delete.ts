import React from "react";
import { isKeyInObject } from "vdck";

// Components
import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";

export function DeleteAPI({ userContext, abortController, body, setErr, ChangeLoadStatus, successOperation }: {
    userContext: { [key: string]: any },
    abortController: any,
    body: any,
    setErr: (prev: boolean) => void,
    ChangeLoadStatus: ({ from, bool }: { from: string, bool: boolean }) => void;
    successOperation: () => void;
}): void {
    // Check userContext
    if (!isKeyInObject(userContext, "token", "s", { minLength: 1 })) return;

    FetchData(`${import.meta.env.VITE_API_PDF_READER}brd/et-bd-fls`, "POST", body, abortController)
        .then((_: any) => {
            ChangeLoadStatus({ from: 'delete', bool: false });
            successOperation();
        })
        .catch((errorState: any) => {
            ChangeLoadStatus({ from: 'delete', bool: false });
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