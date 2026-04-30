import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";
import type { PaymentRow } from "layouts/stocks/payments/fetchData/data";


// ——————————————————————————————————————————————————————————
// TYPES
// ——————————————————————————————————————————————————————————
type AnyRecord = Record<string, any>;

export type BackordersDetailsPayload = {
    total: number;
    items: AnyRecord[];
    nextOfs: number; // prossimo offset per "carica altri"
};

export type PaymentsDetailsPayload = {
    total: number;
    items: PaymentRow[];
    nextOfs: number;
};

export type CustomerFullPayload = {
    anagrafica: AnyRecord | null;
    creditsProfile: AnyRecord | null;
    creditsYears: AnyRecord | null;

    backordersSummary: {
        totalRows: number; // righe totali (da details.total)
        agg: AnyRecord | null; // RESIDUO / CONSEGNA / TOTALE da /customers/backorders
    } | null;

    backordersDetails: BackordersDetailsPayload | null; // ✅ prima pagina + total (1 sola chiamata)

    paymentsDetails: PaymentsDetailsPayload | null; // pagamenti cliente (prima pagina paginata)

    warnings: string[];
};


// ——————————————————————————————————————————————————————————
// HELPER FUNCTIONS
// ——————————————————————————————————————————————————————————
function apiBase(): string {
    const base = import.meta.env.VITE_API_CUSTOMERSFIDO || "";
    return base.endsWith("/") ? base : base + "/";
};

function errMsg(e: any, fallback: string) {
    return e?.msg || e?.message || fallback;
};

function asDigitString(v: any): string | null {
    const s = String(v ?? "").trim();
    if (!s) return null;
    return /^\d+$/.test(s) ? s : null;
};

function extractActm(creditsProfile: AnyRecord | null): string | null {
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
};


// ——————————————————————————————————————————————————————————
// MAIN FUNCTION
// ——————————————————————————————————————————————————————————
export async function getData({
    abortController,
    customerCode,
    body,
    setData,
    setErr,
    setLoadingState,
}: {
    abortController: AbortController;
    customerCode: string | number;
    body?: { [key: string]: any };
    setData: (updater: any) => void;
    setErr: (prev: boolean) => void;
    setLoadingState?: (section: "anagrafica" | "credits" | "creditsYears" | "backorders" | "payments", isLoading: boolean) => void;
}): Promise<boolean> {
    const ctm = asDigitString(customerCode);
    if (!ctm) {
        enqueueSnackbar("Numero cliente non valido", { title: "Ops..", type: "error" });
        setErr(true);
        return false;
    }

    const base = apiBase();

    const anagraficaUrl = `${base}customers/anagrafica?ofs=0`;
    const anagraficaPayload = {
        ...(body || {}),
        limit: 1,
        ccli: ctm,
    };

    const creditsUrl = `${base}gt-cpd`;
    const creditsPayload = { ctm };

    const creditsYearsUrl = `${base}gt-cpdyrs`;

    const backordersUrl = `${base}customers/backorders?ofs=0`;
    const backordersDetailsUrl = `${base}customers/backorders/details?ofs=0`;

    // quante righe details pre-caricare (prima pagina)
    const BO_PAGE_SIZE = 50;
    const PAYMENTS_PAGE_SIZE = 50;

    try {
        const warnings: string[] = [];

        // 1) PRIMA: anagrafica (gating) - SERIALE
        let anagrafica: AnyRecord | null = null;

        try {
            setLoadingState?.("anagrafica", true);
            const anaResp = await FetchData(anagraficaUrl, "POST", anagraficaPayload, abortController);
            setLoadingState?.("anagrafica", false);

            const items = Array.isArray((anaResp as any)?.items) ? (anaResp as any).items : [];
            anagrafica = items[0] || null;

            if (anagrafica) {
                setData((prev: CustomerFullPayload) => ({ ...prev, anagrafica }));
            };

            if (!anagrafica) {
                const payload: CustomerFullPayload = {
                    anagrafica: null,
                    creditsProfile: null,
                    creditsYears: null,
                    backordersSummary: null,
                    backordersDetails: null,
                    paymentsDetails: null,
                    warnings: [],
                };

                setData(() => payload);
                setErr(false);

                enqueueSnackbar("Cliente non disponibile o non autorizzato", {
                    title: "Attenzione",
                    type: "warning",
                });

                return true;
            };
        } catch (e: any) {
            if (e?.name === "AbortError") throw e;

            warnings.push(`anagrafica: ${errMsg(e, "errore nel recupero anagrafica")}`);

            const payload: CustomerFullPayload = {
                anagrafica: null,
                creditsProfile: null,
                creditsYears: null,
                backordersSummary: null,
                backordersDetails: null,
                paymentsDetails: null,
                warnings,
            };

            setData(() => payload);
            setErr(true);

            enqueueSnackbar("Impossibile caricare l'anagrafica del cliente", {
                title: "Ops..",
                type: "error",
            });

            return false;
        };

        // 2) DOPO anagrafica: tutte le altre IN PARALLELO
        setLoadingState?.("credits", true);
        setLoadingState?.("backorders", true);
        setLoadingState?.("payments", true);

        const creditsPromise = (async () => {
            try {
                const result = await FetchData(creditsUrl, "POST", creditsPayload, abortController);
                setData((prev: CustomerFullPayload) => ({ ...prev, creditsProfile: result ?? null }));
                return result ?? null;
            } catch (e: any) {
                if (e?.name === "AbortError") throw e;
                warnings.push(`credits: ${errMsg(e, "errore nel recupero profilo fido")}`);
                return null;
            } finally {
                setLoadingState?.("credits", false);
            }
        })();

        const backordersAggPromise = (async () => {
            try {
                const boResp = await FetchData(
                    backordersUrl,
                    "POST",
                    { ...(body || {}), limit: 1, ccli: ctm },
                    abortController
                );
                const boItems = Array.isArray((boResp as any)?.items) ? (boResp as any).items : [];
                const agg = boItems[0] ?? null;

                setData((prev: CustomerFullPayload) => ({
                    ...prev,
                    backordersSummary: {
                        totalRows: prev.backordersSummary?.totalRows ?? prev.backordersDetails?.total ?? 0,
                        agg,
                    },
                }));

                return agg;
            } catch (e: any) {
                if (e?.name === "AbortError") throw e;
                warnings.push(`backorders: ${errMsg(e, "errore nel recupero backorders (aggregato)")}`);
                return null;
            }
        })();

        const backordersDetailsPromise = (async () => {
            try {
                const boDetResp = await FetchData(
                    backordersDetailsUrl,
                    "POST",
                    { ...(body || {}), limit: BO_PAGE_SIZE, ccli: ctm },
                    abortController
                );

                const items = Array.isArray((boDetResp as any)?.items) ? (boDetResp as any).items : [];
                const total = Number((boDetResp as any)?.total ?? 0);
                const backordersTotalRows = Number.isFinite(total) ? total : 0;

                const details = {
                    total: backordersTotalRows,
                    items,
                    nextOfs: items.length,
                } as BackordersDetailsPayload;

                setData((prev: CustomerFullPayload) => ({
                    ...prev,
                    backordersDetails: details,
                    backordersSummary: {
                        totalRows: details.total ?? 0,
                        agg: prev.backordersSummary?.agg ?? null,
                    },
                }));

                return details;
            } catch (e: any) {
                if (e?.name === "AbortError") throw e;
                warnings.push(`backordersDetails: ${errMsg(e, "errore nel recupero backorders (details)")}`);
                return null;
            } finally {
                setLoadingState?.("backorders", false);
            }
        })();

        const paymentsPromise = (async () => {
            try {
                const paymentsUrl = `${import.meta.env.VITE_API_STOCKS}pagamenti`;
                const paymentsQuery = buildQuery({
                    ofs: 0,
                    limit: PAYMENTS_PAGE_SIZE,
                    ccli: ctm,
                });

                const paymentsResp = await FetchData(
                    `${paymentsUrl}${paymentsQuery}`,
                    "GET",
                    undefined as any,
                    abortController
                );

                const items = Array.isArray((paymentsResp as any)?.items) ? (paymentsResp as any).items : [];
                const total = Number((paymentsResp as any)?.total ?? 0);

                const details = {
                    total: Number.isFinite(total) ? total : 0,
                    items: items as PaymentRow[],
                    nextOfs: items.length,
                } as PaymentsDetailsPayload;

                setData((prev: CustomerFullPayload) => ({ ...prev, paymentsDetails: details }));

                return details;
            } catch (e: any) {
                if (e?.name === "AbortError") throw e;
                warnings.push(`payments: ${errMsg(e, "errore nel recupero pagamenti")}`);
                return null;
            } finally {
                setLoadingState?.("payments", false);
            }
        })();

        let creditsProfile: AnyRecord | null = null;
        try {
            creditsProfile = await creditsPromise;
        } catch (e: any) {
            await Promise.allSettled([backordersAggPromise, backordersDetailsPromise, paymentsPromise]);
            throw e;
        }

        const creditsYearsPromise = (async () => {
            try {
                setLoadingState?.("creditsYears", true);
                const actm = extractActm(creditsProfile);
                const creditsYearsPayload: AnyRecord = { ctm };
                if (actm && actm !== ctm) creditsYearsPayload.actm = actm;

                const result = await FetchData(creditsYearsUrl, "POST", creditsYearsPayload, abortController);
                const years = result ?? null;

                setData((prev: CustomerFullPayload) => ({ ...prev, creditsYears: years }));

                return years;
            } catch (e: any) {
                if (e?.name === "AbortError") throw e;
                warnings.push(`creditsYears: ${errMsg(e, "errore nel recupero dati anni")}`);
                return null;
            } finally {
                setLoadingState?.("creditsYears", false);
            }
        })();

        const settled = await Promise.allSettled([
            backordersAggPromise,
            backordersDetailsPromise,
            paymentsPromise,
            creditsYearsPromise,
        ]);

        for (const r of settled) {
            if (r.status === "rejected" && r.reason?.name === "AbortError") {
                throw r.reason;
            }
        };

        const backordersAgg =
            settled[0].status === "fulfilled" ? (settled[0].value ?? null) : null;
        const boDetails =
            settled[1].status === "fulfilled" ? (settled[1].value ?? null) : null;
        const paymentsDetails =
            settled[2].status === "fulfilled" ? (settled[2].value ?? null) : null;
        const creditsYears =
            settled[3].status === "fulfilled" ? (settled[3].value ?? null) : null;

        const backordersTotalRows = boDetails?.total ?? 0;

        const payload: CustomerFullPayload = {
            anagrafica,
            creditsProfile,
            creditsYears,
            backordersSummary: {
                totalRows: backordersTotalRows,
                agg: backordersAgg,
            },
            backordersDetails: boDetails,
            paymentsDetails,
            warnings,
        };

        setData(() => payload);
        setErr(false);

        if (warnings.length) {
            enqueueSnackbar("Alcuni dati non sono stati caricati (vedi console)", {
                title: "Attenzione",
                type: "warning",
            });
            console.warn("[customersPanel] warnings:", warnings);
        }

        return true;
    } catch (error: any) {
        if (error?.name !== "AbortError") {
            console.error(error);
            enqueueSnackbar(errMsg(error, "Problema nel recupero dati cliente, contatta un tecnico."), {
                title: "Ops..",
                type: "error",
            });
            setErr(true);
        }
        throw error;
    };
};