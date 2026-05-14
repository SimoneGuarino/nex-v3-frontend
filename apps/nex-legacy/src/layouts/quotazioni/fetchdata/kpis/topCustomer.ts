// src/layouts/quotazioni/agents/fetchdata/kpis/topCustomer.ts
import { FetchData } from "examples/Fetch";
import type { MutableRefObject } from "react";
import type { UserState } from "types/UserContext";

type AbortLike = MutableRefObject<AbortController | null> | AbortController;

export interface KpiTopCustomerQuery {
    // default nel BE: days=30
    days?: number; // min 7 max 365

    // oppure range
    from?: string; // ISO
    to?: string;   // ISO

    // filtri admin/dev
    agentId?: string;
    buyerCode?: string;
}

export interface KpiTopCustomerResponse {
    period: { label: string; from: string; to: string; prevFrom: string; prevTo: string };
    scope: any;
    kpi: {
        customer: null | {
            code: string;
            name: string | null;
            label: string | null;
            quotations: number;
            maxValue: number;
            avgValue: number;
            totalValue: number;
            previousQuotations: number;
            previousTotalValue: number;
            trendPct: number | null;
        };
        topCustomers: Array<{
            code: string;
            quotations: number;
            totalValue: number;
            maxValue: number;
            avgValue: number;
        }>;
    };
}

export interface GetKpiTopCustomerProps {
    abortController: AbortLike;
    user?: UserState | null;
    query?: KpiTopCustomerQuery;
    HandleComplete: (payload: KpiTopCustomerResponse) => void;
    HandleError: (errorMessage: string) => void;
    ChangeLoadStatus?: (args: { from: string; bool: boolean }) => void;
}

const isObjectId = (v: unknown): v is string =>
    typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v.trim());

const isISODate = (v: unknown): v is string =>
    typeof v === "string" && !Number.isNaN(new Date(v).getTime());

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

const buildUrl = (base: string, query?: KpiTopCustomerQuery) => {
    const url = new URL(`${base}quotations/kpis/top-customer`);

    if (!query) return url;

    if (typeof query.days === "number" && Number.isFinite(query.days)) {
        url.searchParams.set("days", String(clamp(Math.trunc(query.days), 7, 365)));
    }

    if (query.from && query.to && isISODate(query.from) && isISODate(query.to)) {
        url.searchParams.set("from", query.from.trim());
        url.searchParams.set("to", query.to.trim());
    }

    if (query.agentId && isObjectId(query.agentId)) url.searchParams.set("agentId", query.agentId.trim());
    if (query.buyerCode && query.buyerCode.trim()) url.searchParams.set("buyerCode", query.buyerCode.trim());

    return url;
};

export async function getKpiTopCustomer({
    abortController,
    query,
    HandleComplete,
    HandleError,
    ChangeLoadStatus,
}: GetKpiTopCustomerProps): Promise<void> {
    const FROM = "getKpiTopCustomer";
    try {
        ChangeLoadStatus?.({ from: FROM, bool: true });

        if (query?.agentId && !isObjectId(query.agentId)) {
            HandleError("agentId non valido.");
            return;
        }

        if ((query?.from || query?.to) && !(query?.from && query?.to && isISODate(query.from) && isISODate(query.to))) {
            HandleError("range date non valido (from/to ISO richiesti).");
            return;
        }

        if (typeof query?.days === "number" && (!Number.isFinite(query.days) || query.days <= 0)) {
            HandleError("days non valido.");
            return;
        }

        const base = import.meta.env.VITE_API_ORDERS ?? import.meta.env.VITE_API_ORDER ?? "";
        const url = buildUrl(base, query);

        const res = await FetchData<KpiTopCustomerResponse>(
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
                    : e?.message?.msg || "Errore durante il recupero KPI cliente più quotato.";
            console.error("[getKpiTopCustomer] error:", err);
            HandleError(backendMsg);
        }
    } finally {
        ChangeLoadStatus?.({ from: FROM, bool: false });
    }
}
