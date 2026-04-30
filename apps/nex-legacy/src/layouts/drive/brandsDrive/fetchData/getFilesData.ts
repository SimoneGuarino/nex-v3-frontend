import React from "react";
import { isKeyInObject } from "vdck";

// Components
import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";

export function getFilesData({ userContext, abortController, setData, ChangeLoadStatus, body, funcAfterFindFiles }: {
    userContext: { [key: string]: any };
    abortController: any;
    body: { [key: string]: any };
    setData: (prev: any) => void;
    ChangeLoadStatus: ({ from, bool }: { from: string, bool: boolean }) => void;
    funcAfterFindFiles?: (prev: any) => void;
}): void {
    // Check userContext
    if (!isKeyInObject(userContext, "token", "s", { minLength: 1 })) return;

    let bodyToSend: any = {
        tk: userContext.token,
        ...body
    };

    FetchData(`${import.meta.env.VITE_API_PDF_READER}brd/gt-bd-fls`, "POST", bodyToSend, abortController)
        .then((res: any) => {
            if (funcAfterFindFiles) {
                funcAfterFindFiles(res)
            } else {
                setData(res);
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