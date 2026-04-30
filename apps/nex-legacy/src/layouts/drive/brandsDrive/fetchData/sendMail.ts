import React from "react";
import { isKeyInObject } from "vdck";

// Components
import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";

export function SendMailAPI({ userContext, abortController, body, setErr, ChangeLoadStatus, setEmailPanelStatus, setSuccess }: {
    userContext: { [key: string]: any },
    abortController: any,
    body: any,
    setErr: (prev: boolean) => void,
    ChangeLoadStatus: ({ from, bool }: { from: string, bool: boolean }) => void;
    setEmailPanelStatus: (prev: boolean) => void;
    setSuccess: (prev: boolean) => void;
}): void {
    // Check userContext
    if (!isKeyInObject(userContext, "token", "s", { minLength: 1 })) return;

    FetchData(`${import.meta.env.VITE_API_PDF_READER}brd/snd-bd-fls`, "POST", body, abortController)
        .then((_: any) => {
            setEmailPanelStatus(false);
            setSuccess(true);
            ChangeLoadStatus({ from: 'email', bool: false });
        })
        .catch((errorState: any) => {
            ChangeLoadStatus({ from: 'email', bool: false });
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