import { FetchData } from "examples/Fetch";
import type { MutableRefObject } from "react";
import type { UserState } from "types/UserContext";

type AbortLike = MutableRefObject<AbortController | null> | AbortController;

export interface KpiDomandaQuery {
    month?: string; // YYYY-MM
    from?: string; // ISO
    to?: string; // ISO

    // filtri admin/dev
    agentId?: string;
    buyerCode?: string;

    // opzionali
    topN?: number; // default 10 (max 20 lato BE)
    hideDrafts?: boolean;
}

export interface KpiDomandaResponse {
    period: { label: string; from: string; to: string };
    scope: any;
    kpi: {
        topProduct: null | {
            productId: string;
            label: string;
            qty: number;
            lines: number;
            sharePct: number;
            trendPct: number | null; // <-- aggiunto
        };
        totalQty: number;
        totalProductLines: number;
        totalQuotations: number;
        avgProductsPerQuotation: number;
        topProducts: Array<{
            productId: string;
            label: string;
            qty: number;
            lines: number;
        }>;
        seriesDaily: Array<{ date: string; qty: number; lines: number }>;
    };
}

export interface GetKpiDomandaProps {
    abortController: AbortLike;
    user?: UserState | null;
    query?: KpiDomandaQuery;
    HandleComplete: (payload: KpiDomandaResponse) => void;
    HandleError: (errorMessage: string) => void;
    ChangeLoadStatus?: (args: { from: string; bool: boolean }) => void;
}

const isObjectId = (v: unknown): v is string =>
    typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v.trim());

const isISODate = (v: unknown): v is string =>
    typeof v === "string" && !Number.isNaN(new Date(v).getTime());

const isMonth = (v: unknown): v is string =>
    typeof v === "string" && /^\d{4}-\d{2}$/.test(v.trim());

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

const buildUrl = (base: string, query?: KpiDomandaQuery) => {
    const url = new URL(`${base}quotations/kpis/domanda`);

    if (!query) return url;

    if (query.month && isMonth(query.month)) url.searchParams.set("month", query.month.trim());

    if (query.from && query.to && isISODate(query.from) && isISODate(query.to)) {
        url.searchParams.set("from", query.from.trim());
        url.searchParams.set("to", query.to.trim());
    }

    if (query.agentId && isObjectId(query.agentId)) url.searchParams.set("agentId", query.agentId.trim());
    if (query.buyerCode && query.buyerCode.trim()) url.searchParams.set("buyerCode", query.buyerCode.trim());

    if (typeof query.topN === "number" && Number.isFinite(query.topN)) {
        url.searchParams.set("topN", String(clamp(Math.trunc(query.topN), 1, 20)));
    }

    if (query.hideDrafts) url.searchParams.set("hideDrafts", "1");

    return url;
};

export async function getKpiDomanda({
    abortController,
    query,
    HandleComplete,
    HandleError,
    ChangeLoadStatus,
}: GetKpiDomandaProps): Promise<void> {
    const FROM = "getKpiDomanda";
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
        if (typeof query?.topN === "number" && (!Number.isFinite(query.topN) || query.topN <= 0)) {
            HandleError("topN non valido.");
            return;
        }

        const base = import.meta.env.VITE_API_ORDERS ?? import.meta.env.VITE_API_ORDER ?? "";
        const url = buildUrl(base, query);

        const res = await FetchData<KpiDomandaResponse>(
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
                    : e?.message?.msg || "Errore durante il recupero KPI domanda.";
            console.error("[getKpiDomanda] error:", err);
            HandleError(backendMsg);
        }
    } finally {
        ChangeLoadStatus?.({ from: FROM, bool: false });
    }
}
