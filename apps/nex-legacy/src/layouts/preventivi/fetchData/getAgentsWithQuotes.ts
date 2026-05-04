/**
 * Lookup remoto per la select "Agente" dei filtri Preventivi.
 *
 * Segue intenzionalmente lo stesso pattern di `getCustomersWithQuotes`:
 * - ricerca server-side mentre l'utente digita
 * - payload piccolo e dedicato alla select
 * - nessuna dipendenza dalla lista preventivi principale
 *
 * Il FE usa questa rotta per mostrare suggerimenti leggibili (`CODICE - NOME`),
 * ma quando applica il filtro salva comunque solo il codice agente.
 */
import { FetchData } from "examples/Fetch";
import { isKeyInObject } from "vdck";
import type { AgentWithQuotes, PaginatedResponse } from "../types";
import { getPreventiviApiBase } from "./apiBase";

export async function getAgentsWithQuotes(args: {
    userContext: any;
    abortController: any;
    page: number;
    pageSize: number;
    env?: string;
    q?: string;
    sort?: string;
}): Promise<PaginatedResponse<AgentWithQuotes>> {
    const { userContext, abortController, page, pageSize, env, q, sort } = args;

    if (!isKeyInObject(userContext, "token", "s", { minLength: 1 })) {
        return { items: [], page: 1, pageSize, total: 0 };
    }

    const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
    });

    if (env) params.set("env", env);
    if (q) params.set("q", q);
    if (sort) params.set("sort", sort);

    const url = `${getPreventiviApiBase()}customers/quotes/agenti?${params.toString()}`;
    return FetchData<PaginatedResponse<AgentWithQuotes>>(url, "GET", undefined, abortController);
}
