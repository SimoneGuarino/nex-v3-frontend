// ——————————————————————————————————————————————————————————
// HELPER FUNCTIONS
// ——————————————————————————————————————————————————————————
import { FetchData } from "examples/Fetch";
import {
    AnyRecord,
    CustomerStatementBusiness,
    CustomerStatementBusinessPayload,
    CustomerStatementDatasetPayload,
    CustomerStatementDeadlinesPayload,
    CustomerStatementRow,
    CustomerStatementSummary,
    CustomerStatementView,
    ScontiDetailsPayload,
} from "../types";
import { buildQueryString, ensureTrailingSlash } from "./panelUtils";

export const CUSTOMER_STATEMENT_PAGE_SIZE = 50;


export function errMsg(e: any, fallback: string) {
    return e?.msg || e?.message || fallback;
};

export function asDigitString(v: any): string | null {
    const s = String(v ?? "").trim();
    if (!s) return null;
    return /^\d+$/.test(s) ? s : null;
};

export function extractActm(creditsProfile: AnyRecord | null): string | null {
    if (!creditsProfile) return null;

    const candidates = [
        creditsProfile?.actm,
        creditsProfile?.Anagrafica?.actm,

        creditsProfile?.CodiceCliente?.IOT,
        creditsProfile?.Anagrafica?.CodiceCliente?.IOT,

        creditsProfile?.CodiceClienteIOT,
        creditsProfile?.Anagrafica?.CodiceClienteIOT,

        creditsProfile?.IOT,
        creditsProfile?.Anagrafica?.IOT,
    ];

    for (const c of candidates) {
        const d = asDigitString(c);
        if (d) return d;
    }
    return null;
};

function createAbortError(): Error {
    try {
        return new DOMException("Operation aborted", "AbortError");
    } catch {
        const err = new Error("Operation aborted");
        (err as any).name = "AbortError";
        return err;
    }
}

export function throwIfAborted(signal: AbortSignal) {
    if (signal.aborted) throw createAbortError();
}

export function hasObjectData(value: any): value is AnyRecord {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0;
}

export function normalizeScontiDetailsPayload(response: any): ScontiDetailsPayload {
    const items = Array.isArray(response)
        ? response
        : Array.isArray(response?.items)
            ? response.items
            : Array.isArray(response?.data)
                ? response.data
                : Array.isArray(response?.data?.items)
                    ? response.data.items
                    : [];
    const total = Number(
        response?.total ??
        response?.totale ??
        response?.count ??
        response?.data?.total ??
        0
    );
    const normalizedTotal = Number.isFinite(total) ? Math.max(total, items.length) : items.length;

    return {
        total: normalizedTotal,
        items,
    };
}

// -----------------------------------------------------------------------------
// STATEMENT HELPERS
// -----------------------------------------------------------------------------
function isPaginatedStatementView(view: CustomerStatementView): view is "statement" | "provisions" {
    return view === "statement" || view === "provisions";
}

function toStatementRows(response: any): CustomerStatementRow[] {
    if (Array.isArray(response)) return response as CustomerStatementRow[];
    if (Array.isArray(response?.items)) return response.items as CustomerStatementRow[];
    if (Array.isArray(response?.data)) return response.data as CustomerStatementRow[];
    return [];
}

function toSummaryText(value: unknown): string | null {
    const text = String(value ?? "").trim();
    return text || null;
}

// Reads backend summary as-is (already aggregated on full dataset server-side).
function readStatementSummaryFromResponse(response: any): CustomerStatementSummary | null {
    const raw = response?.summary;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

    return {
        saldoPartita: toNumberOrFallback((raw as any)?.saldoPartita, 0),
        saldoComplessivo: toNumberOrFallback((raw as any)?.saldoComplessivo, 0),
        scadenzaUltimoRecord: toSummaryText((raw as any)?.scadenzaUltimoRecord),
        annoUltimoRecord: toSummaryText((raw as any)?.annoUltimoRecord),
        descrizioneUltimoRecord: toSummaryText((raw as any)?.descrizioneUltimoRecord),
    };
}

function toNumberOrFallback(value: unknown, fallback: number): number {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
}

function readStatementTotal(response: any, fallback: number): number {
    const raw = response?.totale ?? response?.total ?? response?.count ?? response?.data?.totale ?? response?.data?.total;
    return Math.max(toNumberOrFallback(raw, fallback), fallback);
}

// -----------------------------------------------------------------------------
// PAYLOAD FACTORIES
// -----------------------------------------------------------------------------
function createEmptyStatementDatasetPayload(options: {
    paginated: boolean;
    pageSize?: number;
}): CustomerStatementDatasetPayload {
    return {
        loaded: false,
        total: 0,
        items: [],
        nextOfs: 0,
        pageSize: options.pageSize ?? CUSTOMER_STATEMENT_PAGE_SIZE,
        paginated: options.paginated,
        summary: null,
    };
}

function toStatementDeadlinesPayload(response: any): CustomerStatementDeadlinesPayload {
    const normalizedItems = toStatementRows(response);
    const total = readStatementTotal(response, normalizedItems.length);

    return {
        loaded: true,
        total,
        items: normalizedItems,
        nextOfs: total,
        pageSize: total > 0 ? total : CUSTOMER_STATEMENT_PAGE_SIZE,
        paginated: false,
        // Summary is computed server-side on the full dataset, not on loaded rows.
        summary: readStatementSummaryFromResponse(response),
    };
}

function toStatementPaginatedPayload({
    response,
    requestedOfs,
    requestedLimit,
}: {
    response: any;
    requestedOfs: number;
    requestedLimit: number;
}): CustomerStatementDatasetPayload {
    const items = toStatementRows(response);
    const total = readStatementTotal(response, requestedOfs + items.length);
    const nextOfs = requestedOfs + items.length;
    const pageSize = Math.max(
        1,
        toNumberOrFallback(response?.limit, requestedLimit > 0 ? requestedLimit : CUSTOMER_STATEMENT_PAGE_SIZE)
    );

    return {
        loaded: true,
        total,
        items,
        nextOfs,
        pageSize,
        paginated: true,
        summary: readStatementSummaryFromResponse(response),
    };
}

// -----------------------------------------------------------------------------
// ROUTE MAPPING + API CALLS
// -----------------------------------------------------------------------------
function getStatementRoute(view: CustomerStatementView): string {
    switch (view) {
        case "deadlines":
            return "customers/deadlines";
        case "statement":
            return "customers/statement";
        case "provisions":
            return "customers/provisions";
        default:
            return "customers/deadlines";
    }
}

export function createEmptyStatementBusinessPayload(): CustomerStatementBusinessPayload {
    return {
        deadlines: {
            ...createEmptyStatementDatasetPayload({ paginated: false }),
            summary: null,
        },
        statement: createEmptyStatementDatasetPayload({ paginated: true }),
        provisions: createEmptyStatementDatasetPayload({ paginated: true }),
    };
}

export async function fetchCustomerDeadlinesByBusiness({
    customerCode,
    business,
    abortController,
}: {
    customerCode: string | number;
    business: CustomerStatementBusiness;
    abortController: AbortController;
}): Promise<CustomerStatementDeadlinesPayload> {
    const ctm = asDigitString(customerCode);
    if (!ctm) {
        throw new Error("Numero cliente non valido");
    }

    const base = ensureTrailingSlash(import.meta.env.VITE_API_CUSTOMERSFIDO);
    const cmp = business === "iot" ? 1 : 0;
    const statementUrl = `${base}${getStatementRoute("deadlines")}${buildQueryString({
        cliente: ctm,
        cmp,
    })}`;

    const response = await FetchData(statementUrl, "GET", undefined as any, abortController);
    return toStatementDeadlinesPayload(response);
}

export async function fetchCustomerStatementPaginatedByBusiness({
    customerCode,
    business,
    view,
    ofs = 0,
    limit = CUSTOMER_STATEMENT_PAGE_SIZE,
    abortController,
}: {
    customerCode: string | number;
    business: CustomerStatementBusiness;
    view: CustomerStatementView;
    ofs?: number;
    limit?: number;
    abortController: AbortController;
}): Promise<CustomerStatementDatasetPayload> {
    if (!isPaginatedStatementView(view)) {
        throw new Error("La vista richiesta non supporta la paginazione");
    }

    const ctm = asDigitString(customerCode);
    if (!ctm) {
        throw new Error("Numero cliente non valido");
    }

    const normalizedOfs = Math.max(0, Number.isFinite(ofs) ? Number(ofs) : 0);
    const normalizedLimit = Math.max(
        1,
        Math.min(CUSTOMER_STATEMENT_PAGE_SIZE, Number.isFinite(limit) ? Number(limit) : CUSTOMER_STATEMENT_PAGE_SIZE)
    );

    const base = ensureTrailingSlash(import.meta.env.VITE_API_CUSTOMERSFIDO);
    const cmp = business === "iot" ? 1 : 0;
    const query = buildQueryString({
        cliente: ctm,
        cmp,
        ofs: normalizedOfs,
        limit: normalizedLimit,
    });

    const url = `${base}${getStatementRoute(view)}${query}`;
    const response = await FetchData(url, "GET", undefined as any, abortController);

    return toStatementPaginatedPayload({
        response,
        requestedOfs: normalizedOfs,
        requestedLimit: normalizedLimit,
    });
}
