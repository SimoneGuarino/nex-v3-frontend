// src/layouts/stocks/payments/fetchData/filtersData.ts
import { FetchData } from "../../../../examples/Fetch";
import type { MutableRefObject } from "react";

/** risposta OK: array di clienti (come da rotta /clientsPayments/filters) */
export interface Customer {
    CodiceAgente: string;
    RagioneSociale: string;
    CodiceCliente: string;
    CodiceFiscale: string;
    PartitaIVA: string;
}
export type FiltersDataResponse = Customer[];

/** contesto utente minimale per questa chiamata */
type UserContext = {
    token: string;
    details?: unknown; // se hai un tipo preciso lato app, mettilo qui
};

/** firma della callback per lo stato di caricamento */
type ChangeLoadStatusFn = (args: { from: "filters"; bool: boolean }) => void;

/** AbortController o ref ad esso */
type AbortLike = AbortController | MutableRefObject<AbortController | null>;

/** opzionale: se usi un tuo wrapper d’errore, tipizzalo qui */
type FetchError = unknown;

export function FiltersDataAPI(
    userContext: UserContext,
    abortController: AbortLike,
    setFiltersData: (data: FiltersDataResponse) => void,
    ChangeLoadStatus: ChangeLoadStatusFn
): void {
    if (userContext.details === undefined) return;

    FetchData<FiltersDataResponse>(
        `${import.meta.env.VITE_API_STOCKS}clients-payments/rt-py-flt`,
        "POST",
        { tk: userContext.token },
        abortController
    )
        .then((res) => {
            setFiltersData(res);
            ChangeLoadStatus({ from: "filters", bool: false });
        })
        .catch((error: FetchError) => {
            console.error(error);
        });
}
