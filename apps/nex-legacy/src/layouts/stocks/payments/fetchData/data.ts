// src/layouts/stocks/payments/fetchData/data.ts
import { FetchData } from "../../../../examples/Fetch";
import type { MutableRefObject } from "react";
import type { UserChoose } from "../types";

/** riga pagamenti come ritornata da GET /pagamenti (paginata) */
export interface PaymentRow {
    NUMOV: string;

    /** data movimento formattata in it (dd/mm/yyyy) */
    DAMOV: string;

    /** cliente */
    CLIFO?: string | null;
    CDCLI?: string; // se il BE lo mantiene, altrimenti puoi rimuoverlo

    /** anagrafica */
    RASCL?: string | null;

    /** agente */
    CDAGE?: string | null;

    /** dati pagamento */
    CAUSA: string;
    DERIG: string;
    IMPMO: number;
}

/** risposta paginata della rotta GET /pagamenti */
export interface PaymentsResponse {
    offset: number;
    limit: number;
    total: number;
    items: PaymentRow[];
}

// UserChoose è importato da ../types.ts

/** contesto utente minimale */
type UserContext = {
    token: string;
    details?: unknown;
};

/** firma callback caricamento */
type ChangeLoadStatusFn = (args: { from: "table" | "search"; bool: boolean }) => void;

/** AbortController o ref */
type AbortLike = AbortController | MutableRefObject<AbortController | null>;

/** helper querystring */
function buildQuery(params: Record<string, string | number | undefined | null>): string {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null) continue;
        const s = String(v).trim();
        if (!s) continue;
        qs.set(k, s);
    }
    const out = qs.toString();
    return out ? `?${out}` : "";
}

/**
 * recupero dati tabella paginata (filtri lato server)
 */
export function DataRetriveAPI(
    userContext: UserContext,
    abortController: AbortLike,
    setData: (rows: PaymentRow[]) => void,
    userChoose: UserChoose,
    ChangeLoadStatus: ChangeLoadStatusFn,
    // questi due ora non sono più utili per una paginazione vera,
    // li lascio per compatibilità firma: puoi rimuoverli se vuoi ripulire i chiamanti
    _containerBaseData: PaymentRow[],
    _setContainerBaseData: (updater: (prev: PaymentRow[]) => PaymentRow[] | PaymentRow[]) => void,
    setDataTotal: (n: number) => void
): void {
    if (userContext.details === undefined) return;

    const ofs = Number.isFinite(userChoose.ofs) && (userChoose.ofs as number) >= 0 ? Number(userChoose.ofs) : 0;
    const limit =
        Number.isFinite(userChoose.limit) && (userChoose.limit as number) > 0 ? Number(userChoose.limit) : 50;

    // mappatura filtri FE -> querystring BE
    const query = buildQuery({
        ofs,
        limit,
        numov: userChoose.nmv,
        ird: userChoose.ird,
        erd: userChoose.erd,
        ccli: userChoose.ccd ?? undefined,
        ccom: userChoose.acd ?? undefined,
    });

    FetchData<PaymentsResponse>(
        `${import.meta.env.VITE_API_STOCKS}pagamenti${query}`,
        "GET",
        undefined as any, // se FetchData richiede il body come argomento; altrimenti puoi passare null
        abortController
    )
        .then((res) => {
            setData(res.items ?? []);
            setDataTotal(Number(res.total ?? 0));

            ChangeLoadStatus({ from: "table", bool: false });
            ChangeLoadStatus({ from: "search", bool: false });
        })
        .catch((error: unknown) => {
            console.error(error);
            ChangeLoadStatus({ from: "table", bool: false });
            ChangeLoadStatus({ from: "search", bool: false });
        });
}
