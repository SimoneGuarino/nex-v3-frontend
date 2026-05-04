/**
 * Centralizza:
 * - parsing della querystring iniziale (env, agente, cliente, anno, magazzino, numero, pagina, sort);
 * - regole RBAC lato UI sul filtro agente (utente libero vs commerciale vincolato ai propri codici);
 * - gestione separata tra filtri "draft" del form e filtri "applied" usati per fetch/export;
 * - azioni condivise di apply/reset filtri con reset coerente di paginazione e ordinamento.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

export type HeaderSortPayload = { columnKey: string; sortDirection: number };

export type AppliedFilters = {
    env: string;
    agentCodes: string[];
    customerCode: string;
    year: string;
    warehouse: string;
    quoteNumber: string;
};

export type InitialQueryState = {
    env: string;
    agentCodes: string[];
    customerCode: string;
    year: string;
    warehouse: string;
    quoteNumber: string;
    pageQuotes: number;
    sort: string;
};

type UsePreventiviFiltersStateArgs = {
    initial: InitialQueryState;
    stateCustomerCode: string;
    canSelectAgent: boolean;
    ownAgentCodes: string[];
};

/**
 * Normalizza un elenco codici (agente) in forma canonica:
 * - trim
 * - uppercase
 * - deduplica
 */
export function normalizeCodeArray(input: unknown): string[] {
    if (!Array.isArray(input)) return [];
    const out = input
        .map((item) => String(item ?? "").trim().toUpperCase())
        .filter(Boolean);
    return Array.from(new Set(out));
}

/**
 * Traduce la querystring della pagina nello stato iniziale della vista Preventivi.
 * Supporta sia `agentCodes=AG1,AG2` sia il legacy `agentCode=AG1`.
 */
export function buildInitialQueryState(search: string): InitialQueryState {
    const p = new URLSearchParams(search);
    const agentCodesRaw = p.get("agentCodes") ?? "";
    const parsedAgentCodes = agentCodesRaw
        .split(",")
        .map((code) => code.trim().toUpperCase())
        .filter(Boolean);
    const fallbackAgentCode = (p.get("agentCode") ?? "").trim().toUpperCase();
    const agentCodes = parsedAgentCodes.length > 0 ? parsedAgentCodes : fallbackAgentCode ? [fallbackAgentCode] : [];

    return {
        env: p.get("env") ?? "",
        agentCodes,
        customerCode: p.get("customerCode") ?? "",
        year: p.get("year") ?? "",
        warehouse: p.get("warehouse") ?? "",
        quoteNumber: p.get("quoteNumber") ?? "",
        pageQuotes: Number(p.get("pageQuotes") ?? "1") || 1,
        sort: p.get("sort") ?? "",
    };
}

/**
 * Hook wrapper del parser query per mantenere referenza stabile tra render.
 */
export function usePreventiviInitialQueryState(search: string) {
    return useMemo(() => buildInitialQueryState(search), [search]);
}

/**
 * Estrae i codici agente disponibili dal contesto utente (codice principale + eventuali codici aggiuntivi).
 */
export function getOwnAgentCodesFromContext(userContext: any): string[] {
    const primary = String(userContext?.details?.codici?.agente ?? userContext?.codici?.agente ?? "").trim().toUpperCase();
    const additionalRaw = Array.isArray(userContext?.details?.codici?.ulterioriAgente)
        ? userContext.details.codici.ulterioriAgente
        : Array.isArray(userContext?.codici?.ulterioriAgente)
            ? userContext.codici.ulterioriAgente
            : Array.isArray(userContext?.details?.agentCodes)
                ? userContext.details.agentCodes
                : Array.isArray(userContext?.agentCodes)
                    ? userContext.agentCodes
                    : [];

    return normalizeCodeArray([primary, ...additionalRaw]);
}

/**
 * Definisce se l'utente puo cambiare liberamente il filtro agente.
 * Mantiene lo stesso criterio usato in altre aree (Purchases) per coerenza RBAC.
 */
export function canSelectAgentByContext(userContext: any): boolean {
    const roleRaw = userContext?.details?.ruolo ?? userContext?.ruolo;
    const actorRoleRaw = userContext?.details?.actorRole ?? userContext?.actorRole;

    const roleLabel = String(roleRaw ?? "").trim().toLowerCase();
    const actorRole = Number(actorRoleRaw);

    const isAdminByRoleNumber = Number.isFinite(actorRole) && (actorRole === 0 || actorRole === 1);
    const isAdminByRoleLabel = ["admin", "dev", "amministrativo", "amministrazione"].includes(roleLabel);

    const caps = Array.isArray(userContext?.details?.caps)
        ? userContext.details.caps
        : Array.isArray(userContext?.caps)
            ? userContext.caps
            : [];

    const canByCap = caps.includes("fido.purchases.agent.select") || caps.includes("purchases.customers.agent.select");
    return isAdminByRoleNumber || isAdminByRoleLabel || canByCap;
}

/**
 * Espone i due valori di sicurezza usati dalla vista:
 * - `canSelectAgent` per decidere se mostrare la multiselect agente
 * - `ownAgentCodes` per vincolare il commerciale ai suoi codici
 */
export function usePreventiviAgentScope(userContext: any) {
    const canSelectAgent = useMemo(() => canSelectAgentByContext(userContext), [userContext]);
    const ownAgentCodes = useMemo(() => getOwnAgentCodesFromContext(userContext), [userContext]);

    return {
        canSelectAgent,
        ownAgentCodes,
    };
}

/**
 * Gestisce lo stato dei filtri Preventivi separando:
 * - valori draft compilati nella UI
 * - `appliedFilters` realmente inviati al backend in ricerca/export
 */
export function usePreventiviFiltersState({
    initial,
    stateCustomerCode,
    canSelectAgent,
    ownAgentCodes,
}: UsePreventiviFiltersStateArgs) {
    const [env, setEnv] = useState<string>(initial.env);
    const [agentSearch, setAgentSearch] = useState<string>("");
    const [agentCodes, setAgentCodes] = useState<string[]>(normalizeCodeArray(initial.agentCodes));
    const [customerSearch, setCustomerSearch] = useState<string>("");
    const [customerCode, setCustomerCode] = useState<string>(stateCustomerCode || initial.customerCode);
    const [year, setYear] = useState<string>(initial.year);
    const [warehouse, setWarehouse] = useState<string>(initial.warehouse);
    const [quoteNumber, setQuoteNumber] = useState<string>(initial.quoteNumber);

    const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>(() => ({
        env: initial.env,
        agentCodes: normalizeCodeArray(initial.agentCodes),
        customerCode: stateCustomerCode || initial.customerCode,
        year: initial.year,
        warehouse: initial.warehouse,
        quoteNumber: initial.quoteNumber,
    }));

    const [pageQuotes, setPageQuotes] = useState<number>(initial.pageQuotes);
    const [sort, setSort] = useState<string>(initial.sort);
    const [sortState, setSortState] = useState<HeaderSortPayload>({
        columnKey: "",
        sortDirection: 0,
    });

    /**
     * Ripristina i filtri in stato "vuoto" (o forzato RBAC per commerciale)
     * e azzera paginazione/ordinamento della lista.
     */
    const handleResetQuotesFilters = useCallback(() => {
        setCustomerSearch("");
        setCustomerCode("");
        setAgentSearch("");
        setAgentCodes(canSelectAgent ? [] : ownAgentCodes);
        setEnv("");
        setYear("");
        setWarehouse("");
        setQuoteNumber("");
        setAppliedFilters({
            env: "",
            agentCodes: canSelectAgent ? [] : ownAgentCodes,
            customerCode: "",
            year: "",
            warehouse: "",
            quoteNumber: "",
        });
        setPageQuotes(1);
        setSort("");
        setSortState({ columnKey: "", sortDirection: 0 });
    }, [canSelectAgent, ownAgentCodes]);

    /**
     * Congela i valori correnti del form come filtri applicati.
     * La fetch lista reagisce a `appliedFilters`, non ai campi draft.
     */
    const handleApplyQuotesFilters = useCallback(() => {
        setAppliedFilters({
            env,
            // Backend quotes applica RBAC agente lato server; qui anticipiamo la stessa regola lato UX.
            agentCodes: canSelectAgent ? normalizeCodeArray(agentCodes) : ownAgentCodes,
            customerCode,
            year,
            warehouse,
            quoteNumber,
        });
        setPageQuotes(1);
    }, [canSelectAgent, ownAgentCodes, env, agentCodes, customerCode, year, warehouse, quoteNumber]);

    useEffect(() => {
        if (canSelectAgent) return;

        /**
         * Hardening UX/RBAC:
         * quando il filtro agente non e modificabile, manteniamo sempre i codici "owned"
         * sia in stato draft sia nei filtri applicati.
         */
        const secureCodes = ownAgentCodes;
        setAgentCodes((prev) => {
            const prevKey = prev.join("|");
            const nextKey = secureCodes.join("|");
            return prevKey === nextKey ? prev : secureCodes;
        });
        setAppliedFilters((prev) => {
            const prevKey = (prev.agentCodes ?? []).join("|");
            const nextKey = secureCodes.join("|");
            return prevKey === nextKey ? prev : { ...prev, agentCodes: secureCodes };
        });
    }, [canSelectAgent, ownAgentCodes]);

    return {
        env,
        setEnv,
        agentSearch,
        setAgentSearch,
        agentCodes,
        setAgentCodes,
        customerSearch,
        setCustomerSearch,
        customerCode,
        setCustomerCode,
        year,
        setYear,
        warehouse,
        setWarehouse,
        quoteNumber,
        setQuoteNumber,
        appliedFilters,
        pageQuotes,
        setPageQuotes,
        sort,
        setSort,
        sortState,
        setSortState,
        handleResetQuotesFilters,
        handleApplyQuotesFilters,
    };
}
