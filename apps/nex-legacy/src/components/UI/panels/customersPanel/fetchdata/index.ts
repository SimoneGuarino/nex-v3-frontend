import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";
import { getPurchasesList } from "layouts/purchases/fetchData/getPurchasesList";
import { getQuotesList } from "layouts/preventivi/fetchData/getQuotesList";
import type {
    AnyRecord,
    BackordersDetailsPayload,
    CustomerPurchasesSummaryPayload,
    CustomerQuotesSummaryPayload,
    CustomerStatementPayload,
    CustomerFullPayload,
    LoadingSection,
    PaymentsDetailsPayload,
    SectionFetchState,
    ScontiPayload,
    TrackingsDetailsPayload,
} from "../types";
import { buildQueryString, ensureTrailingSlash } from "../helpers/panelUtils";
import { asDigitString } from "../../customerNotes/utils";
import { createEmptyStatementBusinessPayload, errMsg, extractActm, fetchCustomerDeadlinesByBusiness, hasObjectData, normalizeScontiDetailsPayload, throwIfAborted } from "../helpers/fetchUtils";


export type SaveProfilazioneResponse = {
    status: boolean;
    operation: "created" | "updated" | string | null;
    item: AnyRecord | null;
};


// ——————————————————————————————————————————————————————————
// MAIN FUNCTION
// ——————————————————————————————————————————————————————————
export async function getData({
    userContext,
    abortController,
    customerCode,
    body,
    setData,
    setErr,
    setLoadingState,
    setFetchState,
}: {
    userContext: any;
    abortController: AbortController;
    customerCode: string | number;
    body?: { [key: string]: any };
    setData: (updater: any) => void;
    setErr: (prev: boolean) => void;
    setLoadingState?: (section: LoadingSection, isLoading: boolean) => void;
    setFetchState?: (section: LoadingSection, state: SectionFetchState) => void;
}): Promise<boolean> {
    /**
     * Pipeline fetch del CustomersPanel.
     *
     * Ogni section segue lo stesso contratto operativo:
     * - setLoadingState(section, true/false)
     * - fetch/normalizzazione payload
     * - setData(...) sul campo dedicato in `CustomerFullPayload`
     * - setFetchState(section, "success" | "error")
     * - warning non bloccante in caso di errore parziale
     *
     * Checklist estensione nuova section:
     * 1) aggiungi la loading key in `LoadingSection`
     * 2) aggiungi il campo payload in `CustomerFullPayload`
     * 3) crea promessa dedicata qui dentro con lo schema sopra
     * 4) includi la promessa nel `Promise.allSettled` finale
     * 5) collega la UI in SummaryContent/DetailsContent
     */
    const ctm = asDigitString(customerCode);
    if (!ctm) {
        enqueueSnackbar("Numero cliente non valido", { title: "Ops..", type: "error" });
        setErr(true);
        return false;
    }

    const base = ensureTrailingSlash(import.meta.env.VITE_API_CUSTOMERSFIDO);

    const anagraficaUrl = `${base}customers/anagrafica?ofs=0`;
    const anagraficaPayload = {
        ...(body || {}),
        limit: 1,
        ccli: { codice: ctm },
    };

    const creditsUrl = `${base}gt-cpd`;
    const creditsPayload = { ctm };

    const creditsYearsUrl = `${base}gt-cpdyrs`;

    const backordersUrl = `${base}customers/backorders?ofs=0`;
    const backordersDetailsUrl = `${base}customers/backorders/details?ofs=0`;
    const scontiBaseUrl = `${base}customers/sconti`;

    const BO_PAGE_SIZE = 50;
    const PAYMENTS_PAGE_SIZE = 50;
    const TRACKINGS_PAGE_SIZE = 50;
    const QUOTES_PREVIEW_PAGE_SIZE = 5;
    const PURCHASES_PREVIEW_PAGE_SIZE = 10;

    try {
        const warnings: string[] = [];

        const cmp = typeof body?.cmp === "number" || typeof body?.cmp === "string" ? body.cmp : undefined;
        const ccom = typeof body?.ccom === "string" ? body.ccom : undefined;
        const profilazioneUrl = `${base}customers/profilazione/${encodeURIComponent(ctm)}${buildQueryString({ cmp, ccom })}`;
        const trackingUrl = `${ensureTrailingSlash(import.meta.env.VITE_API_LOGISTICS)}trackings?ofs=0`;

        const anagraficaPromise = (async () => {
            setLoadingState?.("anagrafica", true);
            try {
                throwIfAborted(abortController.signal);
                const anaResp = await FetchData(anagraficaUrl, "POST", anagraficaPayload, abortController);
                throwIfAborted(abortController.signal);

                const items = Array.isArray((anaResp as any)?.items) ? (anaResp as any).items : [];
                const anagrafica = (items[0] ?? null) as AnyRecord | null;

                setData((prev: CustomerFullPayload) => ({ ...prev, anagrafica }));
                setFetchState?.("anagrafica", "success");
                return anagrafica;
            } catch (e: any) {
                if (e?.name === "AbortError") throw e;
                warnings.push(`anagrafica: ${errMsg(e, "errore nel recupero anagrafica")}`);
                setFetchState?.("anagrafica", "error");
                return null;
            } finally {
                setLoadingState?.("anagrafica", false);
            }
        })();

        const creditsPromise = (async () => {
            setLoadingState?.("credits", true);
            try {
                throwIfAborted(abortController.signal);
                const result = await FetchData(creditsUrl, "POST", creditsPayload, abortController);
                throwIfAborted(abortController.signal);

                const creditsProfile = hasObjectData(result) ? result : null;
                setData((prev: CustomerFullPayload) => ({ ...prev, creditsProfile }));

                setFetchState?.("credits", "success");
                return creditsProfile;
            } catch (e: any) {
                if (e?.name === "AbortError") throw e;
                warnings.push(`credits: ${errMsg(e, "errore nel recupero profilo fido")}`);
                setFetchState?.("credits", "error");
                return null;
            } finally {
                setLoadingState?.("credits", false);
            }
        })();

        const creditsYearsPromise = (async () => {
            setLoadingState?.("creditsYears", true);
            try {
                const creditsProfile = await creditsPromise;
                throwIfAborted(abortController.signal);

                const actm = extractActm(creditsProfile);
                const creditsYearsPayload: AnyRecord = { ctm };
                if (actm && actm !== ctm) creditsYearsPayload.actm = actm;

                const result = await FetchData(creditsYearsUrl, "POST", creditsYearsPayload, abortController);
                throwIfAborted(abortController.signal);

                const creditsYears = hasObjectData(result) ? result : null;
                setData((prev: CustomerFullPayload) => ({ ...prev, creditsYears }));

                setFetchState?.("creditsYears", "success");
                return creditsYears;
            } catch (e: any) {
                if (e?.name === "AbortError") throw e;
                warnings.push(`creditsYears: ${errMsg(e, "errore nel recupero dati anni")}`);
                setFetchState?.("creditsYears", "error");
                return null;
            } finally {
                setLoadingState?.("creditsYears", false);
            }
        })();

        const statementPromise = (async () => {
            setLoadingState?.("statement", true);
            try {
                throwIfAborted(abortController.signal);
                const foceldaDeadlines = await fetchCustomerDeadlinesByBusiness({
                    customerCode: ctm,
                    business: "focelda",
                    abortController,
                });
                throwIfAborted(abortController.signal);

                const statement: CustomerStatementPayload = {
                    activeBusiness: "focelda",
                    activeView: "statement",
                    focelda: {
                        ...createEmptyStatementBusinessPayload(),
                        deadlines: foceldaDeadlines,
                    },
                    iot: createEmptyStatementBusinessPayload(),
                };

                setData((prev: CustomerFullPayload) => ({
                    ...prev,
                    statement,
                }));
                setFetchState?.("statement", "success");
                return statement;
            } catch (e: any) {
                if (e?.name === "AbortError") throw e;
                warnings.push(`statement: ${errMsg(e, "errore nel recupero statement cliente")}`);
                setData((prev: CustomerFullPayload) => ({
                    ...prev,
                    statement: null,
                }));
                setFetchState?.("statement", "error");
                return null;
            } finally {
                setLoadingState?.("statement", false);
            }
        })();

        const backordersPromise = (async () => {
            setLoadingState?.("backorders", true);
            try {
                throwIfAborted(abortController.signal);

                const [aggResult, detailsResult] = await Promise.allSettled([
                    FetchData(
                        backordersUrl,
                        "POST",
                        { ...(body || {}), limit: 1, ccli: { codice: ctm } },
                        abortController
                    ),
                    FetchData(
                        backordersDetailsUrl,
                        "POST",
                        { ...(body || {}), limit: BO_PAGE_SIZE, ccli: { codice: ctm } },
                        abortController
                    ),
                ]);

                throwIfAborted(abortController.signal);

                if (aggResult.status === "rejected" && aggResult.reason?.name === "AbortError") {
                    throw aggResult.reason;
                }
                if (detailsResult.status === "rejected" && detailsResult.reason?.name === "AbortError") {
                    throw detailsResult.reason;
                }

                if (aggResult.status === "rejected") {
                    warnings.push(`backorders: ${errMsg(aggResult.reason, "errore nel recupero backorders (aggregato)")}`);
                }

                if (detailsResult.status === "rejected") {
                    warnings.push(`backordersDetails: ${errMsg(detailsResult.reason, "errore nel recupero backorders (details)")}`);
                }

                const hasAtLeastOneSuccessfulCall =
                    aggResult.status === "fulfilled" || detailsResult.status === "fulfilled";

                if (!hasAtLeastOneSuccessfulCall) {
                    setData((prev: CustomerFullPayload) => ({
                        ...prev,
                        backordersSummary: null,
                        backordersDetails: null,
                    }));
                    setFetchState?.("backorders", "error");
                    return { summary: null, details: null };
                }

                const aggResp = aggResult.status === "fulfilled" ? aggResult.value : null;
                const aggItems = Array.isArray((aggResp as any)?.items) ? (aggResp as any).items : [];
                const agg = (aggItems[0] ?? null) as AnyRecord | null;

                const detailsResp = detailsResult.status === "fulfilled" ? detailsResult.value : null;
                const detailsItems = Array.isArray((detailsResp as any)?.items) ? (detailsResp as any).items : [];
                const detailsTotal = Number((detailsResp as any)?.total ?? 0);
                const normalizedDetailsTotal = Number.isFinite(detailsTotal) ? detailsTotal : 0;
                const details: BackordersDetailsPayload | null = detailsResp
                    ? {
                        total: normalizedDetailsTotal,
                        items: detailsItems,
                        nextOfs: detailsItems.length,
                    }
                    : null;

                const hasDetails = Boolean(details && (details.total > 0 || details.items.length > 0));
                const hasAgg = hasObjectData(agg);
                const hasBackordersData = hasDetails || hasAgg;

                const backordersSummary = hasBackordersData
                    ? {
                        totalRows: details?.total ?? 0,
                        agg: hasAgg ? agg : null,
                    }
                    : null;
                const backordersDetails = hasDetails ? details : null;

                setData((prev: CustomerFullPayload) => ({
                    ...prev,
                    backordersSummary,
                    backordersDetails,
                }));
                setFetchState?.("backorders", "success");

                return {
                    summary: backordersSummary,
                    details: backordersDetails,
                };
            } catch (e: any) {
                if (e?.name === "AbortError") throw e;
                warnings.push(`backorders: ${errMsg(e, "errore nel recupero backorders")}`);
                setData((prev: CustomerFullPayload) => ({
                    ...prev,
                    backordersSummary: null,
                    backordersDetails: null,
                }));
                setFetchState?.("backorders", "error");
                return { summary: null, details: null };
            } finally {
                setLoadingState?.("backorders", false);
            }
        })();

        const paymentsPromise = (async () => {
            setLoadingState?.("payments", true);
            try {
                throwIfAborted(abortController.signal);
                const paymentsUrl = `${import.meta.env.VITE_API_STOCKS}pagamenti`;
                const paymentsQuery = buildQueryString({
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
                throwIfAborted(abortController.signal);

                const items = Array.isArray((paymentsResp as any)?.items) ? (paymentsResp as any).items : [];
                const total = Number((paymentsResp as any)?.total ?? 0);

                const details: PaymentsDetailsPayload = {
                    total: Number.isFinite(total) ? total : 0,
                    items,
                    nextOfs: items.length,
                };
                const hasPaymentsData = details.total > 0 || details.items.length > 0;
                const paymentsDetails = hasPaymentsData ? details : null;

                setData((prev: CustomerFullPayload) => ({ ...prev, paymentsDetails }));
                setFetchState?.("payments", "success");

                return paymentsDetails;
            } catch (e: any) {
                if (e?.name === "AbortError") throw e;
                warnings.push(`payments: ${errMsg(e, "errore nel recupero pagamenti")}`);
                setFetchState?.("payments", "error");
                return null;
            } finally {
                setLoadingState?.("payments", false);
            }
        })();

        const quotesPromise = (async () => {
            setLoadingState?.("quotes", true);
            try {
                throwIfAborted(abortController.signal);

                /**
                 * Nel pannello cliente non vogliamo replicare la pagina Preventivi:
                 * qui carichiamo solo una preview compatta, limitata a 5 righe,
                 * ordinata per data decrescente e usata come punto di accesso rapido.
                 *
                 * Usiamo comunque la stessa fetch della vista Preventivi, così il dato
                 * resta coerente e non introduciamo un endpoint o una trasformazione ad hoc.
                 */
                const result = await getQuotesList({
                    userContext,
                    abortController,
                    page: 1,
                    pageSize: QUOTES_PREVIEW_PAGE_SIZE,
                    customerCode: ctm,
                    sort: "date:desc",
                });
                throwIfAborted(abortController.signal);

                // Salviamo un payload minimale: al pannello basta sapere
                // quante righe esistono in totale e quali mostrare in preview.
                const quotesSummary: CustomerQuotesSummaryPayload = {
                    total: Number(result?.total ?? 0) || 0,
                    items: Array.isArray(result?.items) ? result.items : [],
                };

                setData((prev: CustomerFullPayload) => ({ ...prev, quotesSummary }));
                setFetchState?.("quotes", "success");

                return quotesSummary;
            } catch (e: any) {
                if (e?.name === "AbortError") throw e;
                warnings.push(`quotes: ${errMsg(e, "errore nel recupero preventivi cliente")}`);
                setFetchState?.("quotes", "error");
                return null;
            } finally {
                setLoadingState?.("quotes", false);
            }
        })();

        const purchasesPromise = (async () => {
            setLoadingState?.("purchases", true);
            try {
                throwIfAborted(abortController.signal);

                /**
                 * Preview acquisti cliente:
                 * - stessa API della pagina completa acquisti
                 * - limit fisso 10
                 * - ordinamento data documento decrescente
                 *
                 * In questo modo preview e vista completa condividono la stessa semantica.
                 */
                const result = await getPurchasesList({
                    userContext,
                    abortController,
                    page: 1,
                    pageSize: PURCHASES_PREVIEW_PAGE_SIZE,
                    query: {
                        env: "",
                        agentCodes: [],
                        customerCodes: [ctm],
                        brandCodes: [],
                        lineCodes: [],
                        groupCodes: [],
                        familyCodes: [],
                        dateFrom: "",
                        dateTo: "",
                        sortField: "dataDocumento",
                        sortDirection: "desc",
                    },
                });
                throwIfAborted(abortController.signal);

                const purchasesSummary: CustomerPurchasesSummaryPayload = {
                    total: Number(result?.total ?? 0) || 0,
                    items: Array.isArray(result?.items) ? result.items : [],
                };

                setData((prev: CustomerFullPayload) => ({ ...prev, purchasesSummary }));
                setFetchState?.("purchases", "success");
                return purchasesSummary;
            } catch (e: any) {
                if (e?.name === "AbortError") throw e;
                warnings.push(`purchases: ${errMsg(e, "errore nel recupero acquisti cliente")}`);
                setFetchState?.("purchases", "error");
                return null;
            } finally {
                setLoadingState?.("purchases", false);
            }
        })();

        const profilazionePromise = (async () => {
            setLoadingState?.("profilazione", true);
            try {
                throwIfAborted(abortController.signal);
                const result = await FetchData(
                    profilazioneUrl,
                    "GET",
                    undefined as any,
                    abortController
                );
                throwIfAborted(abortController.signal);

                const report = hasObjectData(result) ? result : null;
                setData((prev: CustomerFullPayload) => ({ ...prev, profilazioneReport: report }));

                setFetchState?.("profilazione", "success");
                return report;
            } catch (e: any) {
                if (e?.name === "AbortError") throw e;
                warnings.push(`profilazione: ${errMsg(e, "errore nel recupero report profilazione")}`);
                setFetchState?.("profilazione", "error");
                return null;
            } finally {
                setLoadingState?.("profilazione", false);
            }
        })();

        const trackingsPromise = (async () => {
            setLoadingState?.("trackings", true);
            try {
                throwIfAborted(abortController.signal);
                const trackingsResp = await FetchData(
                    trackingUrl,
                    "POST",
                    {
                        ...(body || {}),
                        offset: 0,
                        limit: TRACKINGS_PAGE_SIZE,
                        ccd: [ctm],
                        ccli: [{ codice: ctm }],
                    },
                    abortController
                );
                throwIfAborted(abortController.signal);

                const items = Array.isArray((trackingsResp as any)?.items) ? (trackingsResp as any).items : [];
                const total = Number((trackingsResp as any)?.total ?? 0);
                const normalizedTotal = Number.isFinite(total) ? total : 0;
                const hasTrackingsData = items.length > 0 || normalizedTotal > 0;

                const details: TrackingsDetailsPayload = {
                    total: normalizedTotal,
                    items,
                    nextOfs: items.length,
                };
                const trackingDetails = hasTrackingsData
                    ? {
                        ...details,
                    }
                    : null;

                setData((prev: CustomerFullPayload) => ({
                    ...prev,
                    trackingDetails,
                }));

                setFetchState?.("trackings", "success");
                return trackingDetails;
            } catch (e: any) {
                if (e?.name === "AbortError") throw e;
                warnings.push(`trackings: ${errMsg(e, "errore nel recupero trackings")}`);
                setData((prev: CustomerFullPayload) => ({
                    ...prev,
                    trackingDetails: null,
                }));
                setFetchState?.("trackings", "error");
                return null;
            } finally {
                setLoadingState?.("trackings", false);
            }
        })();

        const scontiPromise = (async () => {
            setLoadingState?.("sconti", true);
            try {
                throwIfAborted(abortController.signal);
                const payload = {
                    ...(body || {}),
                    codiceCliente: ctm,
                };

                const [clienteResult, categoriaResult] = await Promise.allSettled([
                    FetchData(
                        `${scontiBaseUrl}/cliente`,
                        "POST",
                        { ...payload },
                        abortController
                    ),
                    FetchData(
                        `${scontiBaseUrl}/categoria`,
                        "POST",
                        { ...payload },
                        abortController
                    ),
                ]);

                throwIfAborted(abortController.signal);

                if (clienteResult.status === "rejected" && clienteResult.reason?.name === "AbortError") {
                    throw clienteResult.reason;
                }
                if (categoriaResult.status === "rejected" && categoriaResult.reason?.name === "AbortError") {
                    throw categoriaResult.reason;
                }

                if (clienteResult.status === "rejected") {
                    warnings.push(`sconti cliente: ${errMsg(clienteResult.reason, "errore nel recupero sconti cliente")}`);
                }

                if (categoriaResult.status === "rejected") {
                    warnings.push(`sconti categoria: ${errMsg(categoriaResult.reason, "errore nel recupero sconti categoria")}`);
                }

                const cliente = clienteResult.status === "fulfilled"
                    ? normalizeScontiDetailsPayload(clienteResult.value)
                    : { total: 0, items: [] };

                const categoria = categoriaResult.status === "fulfilled"
                    ? normalizeScontiDetailsPayload(categoriaResult.value)
                    : { total: 0, items: [] };

                const hasAtLeastOneSuccessfulCall =
                    clienteResult.status === "fulfilled" || categoriaResult.status === "fulfilled";

                if (!hasAtLeastOneSuccessfulCall) {
                    setData((prev: CustomerFullPayload) => ({
                        ...prev,
                        sconti: null,
                    }));
                    setFetchState?.("sconti", "error");
                    return null;
                }

                const totaleAssoluto = cliente.total + categoria.total;
                const sconti: ScontiPayload = {
                    total: totaleAssoluto,
                    cliente,
                    categoria,
                };

                setData((prev: CustomerFullPayload) => ({
                    ...prev,
                    sconti,
                }));
                setFetchState?.("sconti", "success");

                return sconti;
            } catch (e: any) {
                if (e?.name === "AbortError") throw e;
                warnings.push(`sconti: ${errMsg(e, "errore nel recupero dei sconti")}`);
                setData((prev: CustomerFullPayload) => ({
                    ...prev,
                    sconti: null,
                }));
                setFetchState?.("sconti", "error");
                return null;
            } finally {
                setLoadingState?.("sconti", false);
            }
        })();

        const settled = await Promise.allSettled([
            anagraficaPromise,
            creditsPromise,
            creditsYearsPromise,
            statementPromise,
            backordersPromise,
            paymentsPromise,
            quotesPromise,
            purchasesPromise,
            profilazionePromise,
            trackingsPromise,
            scontiPromise,
        ]);

        for (const result of settled) {
            if (result.status === "rejected" && result.reason?.name === "AbortError") {
                throw result.reason;
            }
        }

        setData((prev: CustomerFullPayload) => ({ ...prev, warnings: [...warnings] }));
        setErr(false);

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
    }
};

export async function saveProfilazione({
    abortController,
    customerCode,
    body,
    profilazionePayload,
    setData,
}: {
    abortController: AbortController;
    customerCode: string | number;
    body?: { [key: string]: any };
    profilazionePayload: AnyRecord;
    setData?: (updater: any) => void;
}): Promise<SaveProfilazioneResponse> {
    const ctm = asDigitString(customerCode);
    if (!ctm) {
        const message = "Numero cliente non valido";
        enqueueSnackbar(message, { title: "Ops..", type: "error" });
        throw new Error(message);
    }

    const base = ensureTrailingSlash(import.meta.env.VITE_API_CUSTOMERSFIDO);
    const cmp = typeof body?.cmp === "number" || typeof body?.cmp === "string" ? body.cmp : undefined;
    const ccom = typeof body?.ccom === "string" ? body.ccom : undefined;
    const profilazioneUrl = `${base}customers/profilazione/${encodeURIComponent(ctm)}${buildQueryString({ cmp, ccom })}`;

    const payload = {
        ...(profilazionePayload || {}),
        "CODICE CLIENTE": ctm,
    };

    try {
        const res = await FetchData(profilazioneUrl, "PUT", payload, abortController);

        const response: SaveProfilazioneResponse = {
            status: Boolean((res as any)?.status),
            operation: (res as any)?.operation ?? null,
            item: ((res as any)?.item ?? null) as AnyRecord | null,
        };

        if (setData) {
            setData((prev: CustomerFullPayload) => ({
                ...prev,
                profilazioneReport: response.item ?? null,
            }));
        }

        return response;
    } catch (e: any) {
        if (e?.name === "AbortError") throw e;
        enqueueSnackbar(errMsg(e, "Errore durante il salvataggio della profilazione"), {
            title: "Ops..",
            type: "error",
        });
        throw e;
    }
};
