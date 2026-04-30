// Components
import { enqueueSnackbar } from "components/MessageBox";
import { FetchFileData } from "examples/Fetch/FetchFileData";

export function UploadAPI({ abortController, body, ChangeLoadStatus, successOperation }: {
    abortController: any,
    body: any,
    ChangeLoadStatus: ({ from, bool }: { from: string, bool: boolean }) => void;
    successOperation: (idList: Array<{ id: string; nome: string }>) => void;
}): void {

    FetchFileData(`${import.meta.env.VITE_API_STOCKS}swot/files/upload`, "POST", body, abortController)
        .then((res: any) => {
            ChangeLoadStatus({ from: 'upload', bool: false });
            successOperation(res);
        }).catch((errorState: any) => {
            ChangeLoadStatus({ from: 'upload', bool: false });
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
                };

                enqueueSnackbar(error_, {
                    title: 'Ops..',
                    type: 'error',
                });
                return;
            };
        });
}