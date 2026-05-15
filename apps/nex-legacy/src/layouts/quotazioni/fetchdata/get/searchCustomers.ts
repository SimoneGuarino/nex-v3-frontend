import { authenticatedFetch, isApiHttpError } from "@nex/shared-platform";
import { enqueueSnackbar } from "components/MessageBox";
import { CAPS, type Cap } from "authz/caps";
import { CustomerQuickDetailsDTO } from "layouts/quotazioni/types/customers";
import { ChangeLoadStatusArgs } from "layouts/quotazioni/types/quotations";

type CustomerSearchContext =
    | "quotations"
    | "credit"
    | "customers"
    | "orders"
    | "fatturati"
    | "trackings"
    | "generic";

type CustomerSearchModule = "basic" | "fido";

type HasCap = (cap: Cap | string) => boolean;

type SearchCustomersAPIProps = {
    abortController: AbortController;
    query: string;
    context?: CustomerSearchContext;
    limit?: number;
    requestedModules?: CustomerSearchModule[];
    hasCap: HasCap;
    ChangeLoadStatus: ({ from, bool }: ChangeLoadStatusArgs) => void;
};

type CustomerSearchPolicy = {
    requiredAny: readonly string[];
    defaultModules: readonly CustomerSearchModule[];
};

const DEFAULT_CONTEXT: CustomerSearchContext = "quotations";
const MAX_LIMIT = 50;

const CUSTOMER_SEARCH_POLICIES: Record<CustomerSearchContext, CustomerSearchPolicy> = {
    quotations: {
        requiredAny: [
            //CAPS.QUOTAZIONI_CUSTOMER_SEARCH_USE,
            CAPS.QUOTAZIONI_AGENT_MODE,
            CAPS.QUOTAZIONI_BUYER_MODE,
            CAPS.QUOTAZIONI_ADMIN_MODE,
        ],
        defaultModules: ["basic", "fido"],
    },
    credit: {
        requiredAny: [
            CAPS.CLIENTI_CUSTOMER_SEARCH_USE,
            CAPS.CLIENTI_SITUAZIONE_FIDI_MANAGE,
        ],
        defaultModules: ["basic", "fido"],
    },
    customers: {
        requiredAny: [
            CAPS.CUSTOMERS_SEARCH_USE,
            CAPS.CLIENTI_CUSTOMER_SEARCH_USE,
        ],
        defaultModules: ["basic", "fido"],
    },
    orders: {
        requiredAny: [
            CAPS.ORDINI_CUSTOMER_SEARCH_USE,
            CAPS.ORDINI_SBLOCCO_MANAGE,
            CAPS.ORDINI_FB_MANAGE,
            CAPS.ORDINI_FB_CNR_MANAGE,
        ],
        defaultModules: ["basic"],
    },
    fatturati: {
        requiredAny: [
            CAPS.FATTURATI_CUSTOMER_SEARCH_USE,
            CAPS.FATTURATI_ADVANCED_VIEW,
            CAPS.FATTURATI_IMPERSONATE,
        ],
        defaultModules: ["basic"],
    },
    trackings: {
        requiredAny: [
            CAPS.TRACKINGS_CUSTOMER_SEARCH_USE,
            CAPS.CUSTOMERS_SEARCH_USE,
        ],
        defaultModules: ["basic"],
    },
    generic: {
        requiredAny: [CAPS.CUSTOMERS_SEARCH_USE],
        defaultModules: ["basic"],
    },
};

function hasAnyCap(hasCap: HasCap, caps: readonly string[]): boolean {
    return caps.some((cap) => hasCap(cap));
}

function normalizeLimit(limit: number | undefined): number {
    const value = Number.isFinite(limit) ? Number(limit) : 20;
    return Math.min(Math.max(value || 20, 1), MAX_LIMIT);
}

function resolveAuthorizedModules(args: {
    context: CustomerSearchContext;
    requestedModules?: CustomerSearchModule[];
    hasCap: HasCap;
}): CustomerSearchModule[] {
    const policy = CUSTOMER_SEARCH_POLICIES[args.context] ?? CUSTOMER_SEARCH_POLICIES.generic;
    const requested = args.requestedModules?.length ? args.requestedModules : policy.defaultModules;
    const modules = new Set<CustomerSearchModule>();

    if (requested.includes("basic")) {
        modules.add("basic");
    }

    if (requested.includes("fido") && args.hasCap(CAPS.CUSTOMERS_FIDO_READ)) {
        modules.add("fido");
    }

    return Array.from(modules);
}

function ensureCustomerSearchAllowed(context: CustomerSearchContext, hasCap: HasCap): void {
    const policy = CUSTOMER_SEARCH_POLICIES[context] ?? CUSTOMER_SEARCH_POLICIES.generic;

    if (!hasAnyCap(hasCap, policy.requiredAny)) {
        throw new Error("Non hai i permessi necessari per cercare i clienti in questo contesto.");
    }
}

function buildSearchUrl(args: {
    query: string;
    context: CustomerSearchContext;
    limit?: number;
    modules: CustomerSearchModule[];
}): string {
    const base = import.meta.env.VITE_API_CUSTOMERSFIDO ?? "";
    const url = new URL(`${base}v2/customers/search`);

    url.searchParams.set("query", args.query.trim());
    url.searchParams.set("context", args.context);
    url.searchParams.set("limit", String(normalizeLimit(args.limit)));

    if (args.modules.length) {
        url.searchParams.set("modules", args.modules.join(","));
    }

    return url.toString();
}

function resolveErrorMessage(error: unknown): string {
    if (isApiHttpError(error)) return error.message;
    if (error instanceof Error) return error.message;

    const candidate = error as { message?: any } | undefined;
    return typeof candidate?.message === "string"
        ? candidate.message
        : candidate?.message?.msg || "Errore nel recupero dei clienti.";
}

export async function SearchCustomersAPI({
    abortController,
    ChangeLoadStatus,
    query,
    context = DEFAULT_CONTEXT,
    limit = 20,
    requestedModules,
    hasCap,
}: SearchCustomersAPIProps): Promise<CustomerQuickDetailsDTO[] | undefined> {
    try {
        ChangeLoadStatus({ from: "req_customersList", bool: true });

        const normalizedQuery = query.trim();
        if (normalizedQuery.length < 2) return [];

        ensureCustomerSearchAllowed(context, hasCap);

        const modules = resolveAuthorizedModules({
            context,
            requestedModules,
            hasCap,
        });

        const response = await authenticatedFetch(
            buildSearchUrl({
                query: normalizedQuery,
                context,
                limit,
                modules,
            }),
            {
                method: "GET",
                signal: abortController.signal,
                headers: {
                    Accept: "application/json",
                },
            },
            {
                source: `legacy-customer-search:${context}`,
            },
        );

        const res = await response.json();

        if (!res || !Array.isArray(res.items)) {
            throw new Error("Risposta dal server non valida");
        }

        return res.items as CustomerQuickDetailsDTO[];
    } catch (err: unknown) {
        const e = err as { name?: string };
        if (e?.name !== "AbortError") {
            const backendMsg = resolveErrorMessage(err);
            console.error("[SearchCustomersAPI] error:", err);
            enqueueSnackbar(backendMsg, {
                title: "Ops..",
                type: "error",
            });
        }
    } finally {
        ChangeLoadStatus({ from: "req_customersList", bool: false });
    }
}
