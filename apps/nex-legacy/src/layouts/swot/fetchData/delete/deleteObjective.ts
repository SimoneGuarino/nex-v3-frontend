// Components
import { enqueueSnackbar } from "components/MessageBox";
import { FetchFileData } from "examples/Fetch/FetchFileData";

export function DeleteTargetAPI({ abortController, quarterTargetId, ChangeLoadStatus, successOperation }: {
    abortController: any,
    quarterTargetId: string | undefined,
    ChangeLoadStatus: ({ from, bool }: { from: string, bool: boolean }) => void;
    successOperation: () => void;
}): any {
    if (!quarterTargetId) {
        console.warn("Quarter Target ID is missing for deletion");
        ChangeLoadStatus({ from: 'deleteQuarterTarget', bool: false });
        return enqueueSnackbar("Sembra che non siamo riusciti a trovare il tuo Target del trimestre", {
            title: 'Ops..',
            type: 'error',
        });
    }

    FetchFileData(`${import.meta.env.VITE_API_STOCKS}swot/quarter/delete/${quarterTargetId}`, "DELETE", null, abortController)
        .then((_: any) => {
            successOperation();
        }).catch((errorState: any) => {
            ChangeLoadStatus({ from: 'deleteQuarterTarget', bool: false });
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