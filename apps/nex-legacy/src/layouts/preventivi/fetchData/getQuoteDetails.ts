/**
 * Chiama l'endpoint backend `quotes/details`
 * passando la chiave documento (ambiente, anno, numero preventivo),
 * normalizza la risposta e restituisce al layout i dati necessari
 * per popolare il drawer/tabella di dettaglio.
 */
import { FetchData } from "examples/Fetch";
import { isKeyInObject } from "vdck";
import type { QuoteDetailsResponse } from "../types";
import { getPreventiviApiBase } from "./apiBase";

export async function getQuoteDetails(args: {
    userContext: any;
    abortController: any;
    env: string;
    year: string;
    quoteNumber: string;
}): Promise<QuoteDetailsResponse> {
    const { userContext, abortController, env, year, quoteNumber } = args;

    if (!isKeyInObject(userContext, "token", "s", { minLength: 1 })) {
        return { items: [], totals: { qtyTotal: 0, amountTotal: 0 } };
    }

    const url = `${getPreventiviApiBase()}customers/quotes/details/${env}/${year}/${quoteNumber}`;
    return FetchData<QuoteDetailsResponse>(url, "GET", undefined, abortController);
}
