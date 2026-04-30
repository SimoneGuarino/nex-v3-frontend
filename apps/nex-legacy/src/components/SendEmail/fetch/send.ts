import { isKeyInObject } from "vdck";

// Components
import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";

export function SendMailAPI({ userContext, abortController, fetchSettings, closeMailPanel, setSuccess, ChangeLoadStatus }: {
    userContext: { [key: string]: any },
    abortController: any,
    fetchSettings: { url: string, body: {[key: string] : string | number} },
    ChangeLoadStatus: ({from, bool} : {from: string, bool: boolean}) => void;
    closeMailPanel: () => void;
    setSuccess: (bool: boolean) => void;
}): void {
    // Check userContext
    if (!isKeyInObject(userContext, "token", "s", { minLength: 1 })) return;

    let bodyToSend: any = {
        tk: userContext.token,
        ...fetchSettings.body
    };

    FetchData(fetchSettings.url, "POST", bodyToSend, abortController)
        .then((_: any) => {
            ChangeLoadStatus({from: 'mail', bool: false});
            closeMailPanel();
            setSuccess(true);
        })
        .catch((error: any) => {
            if (error.name !== "AbortError") {
                ChangeLoadStatus({from: 'mail', bool: false});
                console.error(error);
                let error_ = "Sembra che ci sia stato un problema nel retrive dei dati nella tabella, perfavore contatta un tecnico."
                if(error && (error?.msg || error?.message)){    error_ = (error.msg || error.message);     };
                enqueueSnackbar(error_, {
                    title: "Ops..",
                    type: "error",
                });
            };
        });
}