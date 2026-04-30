import { FetchData } from "examples/Fetch";
import { Stato } from "layouts/quotazioni/types/quotations";
import type { MutableRefObject } from "react";
import type { UserState } from "types/UserContext";

type AbortLike = MutableRefObject<AbortController | null> | AbortController;

export interface KpiQuotazioniQuery {
    // periodo
    month?: string; // YYYY-MM
    from?: string;  // ISO
    to?: string;    // ISO

    // filtri admin/dev
    agentId?: string;    // userId
    buyerCode?: string;  // codice buyer

    // opzionali
    hideDrafts?: boolean; // 1 per admin/dev
}

export interface KpiQuotazioniResponse {
    period: {
        label: string;
        from: string;
        to: string;
        prevFrom: string;
        prevTo: string;
    };
    scope: any;
    kpi: {
        totalQuotations: number;
        previousTotalQuotations: number;
        trendPct: number | null;
        statuses: Record<Stato, number>;
        negative: number;
        positive: number;
        // Nuove metriche di chiusura finale (workflow attuale: OK/KO).
        // Questi campi sono opzionali per compatibilità con ambienti/risposte BE
        // che non li espongono ancora.
        closedOutcomes?: number;
        previousClosedOutcomes?: number;
        // Metriche legacy mantenute per compatibilità storica.
        // Usate dal FE come fallback per non mostrare card vuote su dataset vecchi.
        legacyClosedOutcomes?: number;
        previousLegacyClosedOutcomes?: number;
        seriesDaily: Array<{ date: string; count: number }>;
    };
}

export interface GetKpiQuotazioniProps {
    abortController: AbortLike;
    user?: UserState | null;
    query?: KpiQuotazioniQuery;
    HandleComplete: (payload: KpiQuotazioniResponse) => void;
    HandleError: (errorMessage: string) => void;
    ChangeLoadStatus?: (args: { from: string; bool: boolean }) => void;
}

const isObjectId = (v: unknown): v is string =>
    typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v.trim());

const isISODate = (v: unknown): v is string =>
    typeof v === "string" && !Number.isNaN(new Date(v).getTime());

const isMonth = (v: unknown): v is string =>
    typeof v === "string" && /^\d{4}-\d{2}$/.test(v.trim());

const buildUrl = (base: string, query?: KpiQuotazioniQuery) => {
    const url = new URL(`${base}quotations/kpis/quotazioni`);

    if (!query) return url;

    if (query.month && isMonth(query.month)) url.searchParams.set("month", query.month.trim());

    if (query.from && query.to && isISODate(query.from) && isISODate(query.to)) {
        url.searchParams.set("from", query.from.trim());
        url.searchParams.set("to", query.to.trim());
    }

    if (query.agentId && isObjectId(query.agentId)) url.searchParams.set("agentId", query.agentId.trim());
    if (query.buyerCode && query.buyerCode.trim()) url.searchParams.set("buyerCode", query.buyerCode.trim());

    if (query.hideDrafts) url.searchParams.set("hideDrafts", "1");

    return url;
};

export async function getKpiQuotazioni({
    abortController,
    query,
    HandleComplete,
    HandleError,
    ChangeLoadStatus,
}: GetKpiQuotazioniProps): Promise<void> {
    const FROM = "getKpiQuotazioni";
    try {
        ChangeLoadStatus?.({ from: FROM, bool: true });

        // se passano agentId/buyerCode, validiamo solo “soft” (il BE gestisce i permessi)
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

        const res = await FetchData<KpiQuotazioniResponse>(
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
                    : e?.message?.msg || "Errore durante il recupero KPI quotazioni.";
            console.error("[getKpiQuotazioni] error:", err);
            HandleError(backendMsg);
        }
    } finally {
        ChangeLoadStatus?.({ from: FROM, bool: false });
    }
}
