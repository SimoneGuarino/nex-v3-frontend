import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
export interface NoPromoMysqlFilters {
    flag_gest: string[];
    buyer: string[];
    rag_prod: string[];
};


// ——————————————————————————————————————————————————————————
// API CALLS
// ——————————————————————————————————————————————————————————
/**
 * Recupera la lista delle categorie/brands per popolare i select.
 * @param abortController - controller per abort
 * @param setData - callback per impostare i dati
 * @param ChangeLoadStatus - callback per aggiornare lo stato di loading
 */
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
};

/**
 * Recupera i valori (flag_gest, buyer, rag_prod) dal backend per popolare i filtri.
 * @param abortController - controller per abort
 * @param setData - callback che riceve NoPromoMysqlFilters
 * @param ChangeLoadStatus - callback per aggiornare loading
 */
export function GetNoPromoMysqlFiltersAPI({ abortController, setData, ChangeLoadStatus }: {
    abortController: any,
    setData: (data: NoPromoMysqlFilters) => void,
    ChangeLoadStatus: ({ from, bool }: { from: string, bool: boolean }) => void;
}): void {

    FetchData(`${import.meta.env.VITE_API_PRODUCTS}noPromo/filtri`, "GET", null, abortController)
        .then((res: any) => {
            if (res && res.success && res.data) {
                setData({
                    flag_gest: Array.isArray(res.data.flag_gest) ? res.data.flag_gest : [],
                    buyer: Array.isArray(res.data.buyer) ? res.data.buyer : [],
                    rag_prod: Array.isArray(res.data.rag_prod) ? res.data.rag_prod : [],
                });
            }
            ChangeLoadStatus({ from: 'mysqlFilters', bool: false });
        })
        .catch((errorState: any) => {
            ChangeLoadStatus({ from: 'mysqlFilters', bool: false });
            if (errorState.name !== 'AbortError') {
                let error_ = "";
                const error: string | { [key: string]: string } | undefined = errorState?.message;
                console.error(errorState);
                if (error) {
                    if (typeof error === 'string') {
                        error_ = (error as any).message;
                    } else if (error !== undefined && error?.msg) {
                        error_ = error.msg;
                    }
                }

                if (!error_ || error_.trim() == "") {
                    error_ = "Sembra che ci sia stato un problema nel recupero dei filtri, perfavore contatta un tecnico."
                }

                enqueueSnackbar(error_, {
                    title: 'Ops..',
                    type: 'error',
                });
                return;
            }
        });
};