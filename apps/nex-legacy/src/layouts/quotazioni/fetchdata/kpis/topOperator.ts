// src/layouts/quotazioni/agents/fetchdata/kpis/topOperator.ts
import { FetchData } from "examples/Fetch";
import type { MutableRefObject } from "react";
import type { UserState } from "types/UserContext";

type AbortLike = MutableRefObject<AbortController | null> | AbortController;

export interface KpiTopOperatorQuery {
    month?: string; // YYYY-MM
    from?: string;  // ISO
    to?: string;    // ISO

    // admin/dev: view=agent|buyer (per gli altri ruoli viene forzato dal BE)
    view?: "agent" | "buyer";

    // filtri admin/dev
    agentId?: string;
    buyerCode?: string;
}

export interface KpiTopOperatorResponse {
    period: { label: string; from: string; to: string; prevFrom: string; prevTo: string };
    scope: any;
    view: "agent" | "buyer";
    kpi: {
        totalValue: number;
        previousTotalValue: number;
        trendPct: number | null;
        topByQuotations: null | { id: string; label: string; quotations: number; completed: number; value: number };
        topByCompleted: null | { id: string; label: string; quotations: number; completed: number; value: number };
        ranking: Array<{ id: string; label: string; quotations: number; completed: number; value: number }>;
    };
}

export interface GetKpiTopOperatorProps {
    abortController: AbortLike;
    user?: UserState | null;
    query?: KpiTopOperatorQuery;
    HandleComplete: (payload: KpiTopOperatorResponse) => void;
    HandleError: (errorMessage: string) => void;
    ChangeLoadStatus?: (args: { from: string; bool: boolean }) => void;
}

const isObjectId = (v: unknown): v is string =>
    typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v.trim());

const isISODate = (v: unknown): v is string =>
    typeof v === "string" && !Number.isNaN(new Date(v).getTime());

const isMonth = (v: unknown): v is string =>
    typeof v === "string" && /^\d{4}-\d{2}$/.test(v.trim());

const buildUrl = (base: string, query?: KpiTopOperatorQuery) => {
    const url = new URL(`${base}quotations/kpis/top-operator`);

    if (!query) return url;

    if (query.month && isMonth(query.month)) url.searchParams.set("month", query.month.trim());

    if (query.from && query.to && isISODate(query.from) && isISODate(query.to)) {
        url.searchParams.set("from", query.from.trim());
        url.searchParams.set("to", query.to.trim());
    }

    if (query.view === "agent" || query.view === "buyer") url.searchParams.set("view", query.view);

    if (query.agentId && isObjectId(query.agentId)) url.searchParams.set("agentId", query.agentId.trim());
    if (query.buyerCode && query.buyerCode.trim()) url.searchParams.set("buyerCode", query.buyerCode.trim());

    return url;
};

export async function getKpiTopOperator({
    abortController,
    query,
    HandleComplete,
    HandleError,
    ChangeLoadStatus,
}: GetKpiTopOperatorProps): Promise<void> {
    const FROM = "getKpiTopOperator";
    try {
        ChangeLoadStatus?.({ from: FROM, bool: true });

        if (query?.agentId && !isObjectId(query.agentId)) {
            HandleError("agentId non valido.");
            return;
        }
        if (query?.month && !isMonth(query.month)) {
            HandleError("month non valido (formato atteso YYYY-MM).");
            return;
        }
        if ((query?.from || query?.to) && !(query?.from && query?.to && isISODate(query.from) && isISODate(query.to))) {
            HandleError("range date non valido (from/to ISO richiesti).");
            return;
        }

        const base = import.meta.env.VITE_API_ORDERS ?? import.meta.env.VITE_API_ORDER ?? "";
        const url = buildUrl(base, query);

        const res = await FetchData<KpiTopOperatorResponse>(
            url.toString(),
            "GET",
            null,
            abortController
        );

        HandleComplete(res);
    } catch (err: unknown) {
        const e = err as { name?: string; message?: any };
        if (e?.name !== "AbortError") {
            const backendMsg =
                typeof e?.message === "string"
                    ? e.message
                    : e?.message?.msg || "Errore durante il recupero KPI top operator.";
            console.error("[getKpiTopOperator] error:", err);
            HandleError(backendMsg);
        }
    } finally {
        ChangeLoadStatus?.({ from: FROM, bool: false });
    }
}
