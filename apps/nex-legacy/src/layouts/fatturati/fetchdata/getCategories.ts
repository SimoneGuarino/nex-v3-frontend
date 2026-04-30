// src\layouts\fatturati\fetchdata\getCategories.ts
import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";

// Lista dei brands e types disponibili
export function GetCategoriesAPI({ abortController, setData, ChangeLoadStatus }: {
    abortController: any,
    setData: (prev: any) => void,
    ChangeLoadStatus: ({ from, bool }: { from: string, bool: boolean }) => void;
}): void {

    FetchData(`${import.meta.env.VITE_API_STOCKS}swot/categories`, "GET", null, abortController)
        .then((res: any) => {
            if (res && Array.isArray(res) && res.length > 0) {
                setData(res);
            };
            ChangeLoadStatus({ from: 'categories', bool: false });
        })
        .catch((errorState: any) => {
            ChangeLoadStatus({ from: 'categories', bool: false });
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