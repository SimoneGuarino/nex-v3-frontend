import React from "react";
import { FDSwitch } from "@nex/fd-ui";
import { enqueueSnackbar } from "components/MessageBox";
import { FetchFileData } from "examples/Fetch/FetchFileDataV2";
import { FaDownload, FaPlus } from "react-icons/fa";
import {
    SectionActionButton,
    SectionBlock,
    SectionContainer,
    SectionHeader,
    SectionKeyValue,
    SectionPill,
} from "../components/sectionUi";
import {
    buildQueryString,
    cn,
    ensureTrailingSlash,
    formatCurrencyIt,
    formatDateMaybe,
    formatNumberIt,
    toDisplayText,
} from "../helpers/panelUtils";

import type {
    CustomerStatementBusiness,
    CustomerStatementBusinessPayload,
    CustomerStatementDatasetPayload,
    CustomerStatementDeadlinesPayload,
    CustomerStatementPayload,
    CustomerStatementRow,
    CustomerStatementView,
    PanelMode,
} from "../types";
import {
    CUSTOMER_STATEMENT_PAGE_SIZE,
    fetchCustomerDeadlinesByBusiness,
    fetchCustomerStatementPaginatedByBusiness,
} from "../helpers/fetchUtils";

// -----------------------------------------------------------------------------
// LOOKUP MAPS
// -----------------------------------------------------------------------------
const businessLabelMap: Record<CustomerStatementBusiness, string> = {
    focelda: "focelda",
    iot: "iot",
};

const statementViewLabelMap: Record<CustomerStatementView, string> = {
    statement: "Estratto conto",
    deadlines: "Scadenze e insoluti",
    provisions: "Storico disposizioni",
};

const statementRowAliases = {
    descrizione: ["Descrizione", "DESCRIZIONE", "WDESU", "WDESS"],
    numeroRif: ["Numero_Riferimento", "NUMERO_RIFERIMENTO", "WNURI", "WNRRI"],
    anno: ["Anno_Riferimento", "ANNO_RIFERIMENTO", "WAARI"],
    dataDoc: ["Data_Doc", "DATA_DOC", "WDTDO"],
    numeroDoc: ["Numero_Documento", "NUMERO_DOCUMENTO", "WNUDO", "WNRDO"],
    importo: ["Importo", "IMPORTO", "WIMPO"],
    dataScadenza: ["Data_Scadenza", "DATA_SCADENZA", "WDTSC"],
} as const;

// -----------------------------------------------------------------------------
// PURE HELPERS
// -----------------------------------------------------------------------------
function buildDatasetKey(
    business: CustomerStatementBusiness,
    view: CustomerStatementView
): string {
    return `${business}:${view}`;
}

function pickRowValue(row: CustomerStatementRow, aliases: readonly string[]): unknown {
    const keys = Object.keys(row ?? {});
    for (const alias of aliases) {
        const found = keys.find((key) => key.toLowerCase() === alias.toLowerCase());
        if (found) return row[found];
    }
    return undefined;
}

function parseAmount(value: unknown): number {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const raw = String(value ?? "").trim();
    if (!raw) return 0;
    const normalized = raw.includes(",")
        ? raw.replace(/\./g, "").replace(",", ".")
        : raw;
    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? numeric : 0;
}

function toTableRowValues(row: CustomerStatementRow) {
    return {
        descrizione: pickRowValue(row, statementRowAliases.descrizione),
        numeroRif: pickRowValue(row, statementRowAliases.numeroRif),
        anno: pickRowValue(row, statementRowAliases.anno),
        dataDoc: pickRowValue(row, statementRowAliases.dataDoc),
        numeroDoc: pickRowValue(row, statementRowAliases.numeroDoc),
        importo: pickRowValue(row, statementRowAliases.importo),
        dataScadenza: pickRowValue(row, statementRowAliases.dataScadenza),
    };
}

function renderStatementRows({
    rows,
    keyPrefix,
    business,
    view,
}: {
    rows: CustomerStatementRow[];
    keyPrefix: string;
    business: CustomerStatementBusiness;
    view: CustomerStatementView;
}) {
    return rows.map((row, index) => {
        const values = toTableRowValues(row);

        return (
            <tr
                key={`${keyPrefix}-${business}-${view}-${index}-${String(values.numeroRif ?? "")}-${String(values.anno ?? "")}`}
                className="border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition"
            >
                <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300">{toDisplayText(values.descrizione)}</td>
                <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300">{toDisplayText(values.numeroRif)}</td>
                <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300">{toDisplayText(values.anno)}</td>
                <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300">{formatDateMaybe(values.dataDoc)}</td>
                <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300">{toDisplayText(values.numeroDoc)}</td>
                <td className="px-3 py-2 text-right text-neutral-700 dark:text-neutral-300 font-medium">
                    {formatCurrencyIt(parseAmount(values.importo))}
                </td>
                <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300">{formatDateMaybe(values.dataScadenza)}</td>
            </tr>
        );
    });
}

// -----------------------------------------------------------------------------
// PAYLOAD SELECTORS / UPDATERS
// -----------------------------------------------------------------------------
function getBusinessPayload(
    statement: CustomerStatementPayload,
    business: CustomerStatementBusiness
): CustomerStatementBusinessPayload {
    return business === "iot" ? statement.iot : statement.focelda;
}

function getDatasetPayloadFromBusiness(
    businessPayload: CustomerStatementBusinessPayload,
    view: CustomerStatementView
): CustomerStatementDatasetPayload | CustomerStatementDeadlinesPayload {
    switch (view) {
        case "statement":
            return businessPayload.statement;
        case "provisions":
            return businessPayload.provisions;
        case "deadlines":
        default:
            return businessPayload.deadlines;
    }
}

function getDatasetPayload(
    statement: CustomerStatementPayload,
    business: CustomerStatementBusiness,
    view: CustomerStatementView
): CustomerStatementDatasetPayload | CustomerStatementDeadlinesPayload {
    return getDatasetPayloadFromBusiness(getBusinessPayload(statement, business), view);
}

function setDatasetPayloadInBusiness(
    businessPayload: CustomerStatementBusinessPayload,
    view: CustomerStatementView,
    payload: CustomerStatementDatasetPayload | CustomerStatementDeadlinesPayload
): CustomerStatementBusinessPayload {
    switch (view) {
        case "statement":
            return { ...businessPayload, statement: payload as CustomerStatementDatasetPayload };
        case "provisions":
            return { ...businessPayload, provisions: payload as CustomerStatementDatasetPayload };
        case "deadlines":
        default:
            return { ...businessPayload, deadlines: payload as CustomerStatementDeadlinesPayload };
    }
}

function updateBusinessPayload(
    statement: CustomerStatementPayload,
    business: CustomerStatementBusiness,
    businessPayload: CustomerStatementBusinessPayload
): CustomerStatementPayload {
    if (business === "iot") {
        return { ...statement, iot: businessPayload };
    }
    return { ...statement, focelda: businessPayload };
}

const BusinessSwitch: React.FC<{
    activeBusiness: CustomerStatementBusiness;
    onChange: (nextBusiness: CustomerStatementBusiness) => void;
}> = ({ activeBusiness, onChange }) => {
    const isIotActive = activeBusiness === "iot";

    return (
        <div
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/80 dark:bg-neutral-900/50 px-2 py-1"
            onClick={(event) => event.stopPropagation()}
        >
            <button
                type="button"
                className={cn(
                    "px-2 py-[3px] rounded-full text-[11px] font-medium transition",
                    !isIotActive
                        ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200"
                        : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                )}
                onClick={(event) => {
                    event.stopPropagation();
                    onChange("focelda");
                }}
            >
                Focelda
            </button>

            <FDSwitch
                size="sm"
                color="primary"
                checked={isIotActive}
                ariaLabel="Mostra statement iot"
                onClick={(event) => event.stopPropagation()}
                onChange={(checked) => onChange(checked ? "iot" : "focelda")}
            />

            <button
                type="button"
                className={cn(
                    "px-2 py-[3px] rounded-full text-[11px] font-medium transition",
                    isIotActive
                        ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200"
                        : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                )}
                onClick={(event) => {
                    event.stopPropagation();
                    onChange("iot");
                }}
            >
                IOT
            </button>
        </div>
    );
};

const ViewSelect: React.FC<{
    activeView: CustomerStatementView;
    onChange: (nextView: CustomerStatementView) => void;
}> = ({ activeView, onChange }) => (
    <div onClick={(event) => event.stopPropagation()}>
        <select
            value={activeView}
            onChange={(event) => onChange(event.target.value as CustomerStatementView)}
            className="h-8 rounded-lg border border-neutral-200/70 dark:border-neutral-800/70 bg-white dark:bg-neutral-900 px-2 text-[12px] text-neutral-800 dark:text-neutral-200"
        >
            <option value="statement">{statementViewLabelMap.statement}</option>
            <option value="deadlines">{statementViewLabelMap.deadlines}</option>
            <option value="provisions">{statementViewLabelMap.provisions}</option>
        </select>
    </div>
);

const StatementTableHead: React.FC = () => (
    <thead>
        <tr className="border-b border-neutral-200 dark:border-neutral-800">
            <th className="px-3 py-2 text-left text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/50">Descrizione</th>
            <th className="px-3 py-2 text-left text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/50">Nr. Rif.</th>
            <th className="px-3 py-2 text-left text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/50">Anno</th>
            <th className="px-3 py-2 text-left text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/50">Data doc</th>
            <th className="px-3 py-2 text-left text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/50">Nr. doc</th>
            <th className="px-3 py-2 text-right text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/50">Importo</th>
            <th className="px-3 py-2 text-left text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/50">Scadenza</th>
        </tr>
    </thead>
);

const StatementLoadingPlaceholder: React.FC = () => (
    <div className="space-y-2">
        <div className="h-3 w-40 rounded bg-neutral-200/70 dark:bg-neutral-800/70 animate-pulse" />
        <div className="h-2 w-full rounded bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse" />
        <div className="h-2 w-5/6 rounded bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse" />
    </div>
);

function buildDatasetEmptyState(
    view: CustomerStatementView,
    business: CustomerStatementBusiness
): string {
    return `Nessun dato disponibile per "${statementViewLabelMap[view]}" in ${businessLabelMap[business]}.`;
}

export const Statement: React.FC<{
    mode: PanelMode;
    customerCode: string | number;
    statement: CustomerStatementPayload;
    onOpenDetails?: () => void;
    onStatementChange?: (
        updater: (prev: CustomerStatementPayload | null) => CustomerStatementPayload | null
    ) => void;
}> = ({
    mode,
    customerCode,
    statement,
    onOpenDetails,
    onStatementChange,
}) => {
        const isSummary = mode === "summary";
        // Selection is local to the panel and synced into parent statement payload.
        const [selection, setSelection] = React.useState<{
            business: CustomerStatementBusiness;
            view: CustomerStatementView;
        }>({
            business: statement.activeBusiness,
            view: statement.activeView,
        });
        const [loadingByDataset, setLoadingByDataset] = React.useState<Record<string, boolean>>({});
        const [unavailableByDataset, setUnavailableByDataset] = React.useState<Record<string, boolean>>({});
        const [downloadLoading, setDownloadLoading] = React.useState(false);

        const datasetAbortRef = React.useRef<Record<string, AbortController | null>>({});
        const requestSeqByDatasetRef = React.useRef<Record<string, number>>({});

        // Cleanup pending requests when component unmounts.
        React.useEffect(() => {
            return () => {
                Object.values(datasetAbortRef.current).forEach((controller) => controller?.abort());
                datasetAbortRef.current = {};
                requestSeqByDatasetRef.current = {};
            };
        }, []);

        React.useEffect(() => {
            setSelection({
                business: statement.activeBusiness,
                view: statement.activeView,
            });
        }, [customerCode, statement.activeBusiness, statement.activeView]);

        React.useEffect(() => {
            setLoadingByDataset({});
            setUnavailableByDataset({});
            Object.values(datasetAbortRef.current).forEach((controller) => controller?.abort());
            datasetAbortRef.current = {};
            requestSeqByDatasetRef.current = {};
        }, [customerCode]);

        const activeBusiness = selection.business;
        const activeView = selection.view;

        const selectedPayload = React.useMemo(
            () => getDatasetPayload(statement, activeBusiness, activeView),
            [statement, activeBusiness, activeView]
        );
        const selectedDatasetKey = buildDatasetKey(activeBusiness, activeView);

        const selectedLoading = Boolean(loadingByDataset[selectedDatasetKey]);
        const selectedUnavailable = Boolean(unavailableByDataset[selectedDatasetKey]);

        const persistSelection = React.useCallback(
            (nextBusiness: CustomerStatementBusiness, nextView: CustomerStatementView) => {
                setSelection({ business: nextBusiness, view: nextView });
                onStatementChange?.((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        activeBusiness: nextBusiness,
                        activeView: nextView,
                    };
                });
            },
            [onStatementChange]
        );

        /**
         * Loads one dataset identified by business + view.
         * Guards against race conditions with:
         * - one AbortController per dataset key
         * - one request sequence number per dataset key
         */
        const loadDataset = React.useCallback(
            async ({
                business,
                view,
                ofs = 0,
            }: {
                business: CustomerStatementBusiness;
                view: CustomerStatementView;
                ofs?: number;
            }) => {
                if (!onStatementChange) return;

                const datasetKey = buildDatasetKey(business, view);
                const requestSeq = (requestSeqByDatasetRef.current[datasetKey] ?? 0) + 1;
                requestSeqByDatasetRef.current[datasetKey] = requestSeq;
                datasetAbortRef.current[datasetKey]?.abort();
                const abortController = new AbortController();
                datasetAbortRef.current[datasetKey] = abortController;

                setLoadingByDataset((prev) => ({ ...prev, [datasetKey]: true }));
                setUnavailableByDataset((prev) => ({ ...prev, [datasetKey]: false }));

                try {
                    if (view === "deadlines") {
                        const payload = await fetchCustomerDeadlinesByBusiness({
                            customerCode,
                            business,
                            abortController,
                        });

                        if (requestSeq !== requestSeqByDatasetRef.current[datasetKey]) return;

                        onStatementChange((prev) => {
                            if (!prev) return prev;
                            const businessPayload = getBusinessPayload(prev, business);
                            const nextBusinessPayload = setDatasetPayloadInBusiness(
                                businessPayload,
                                "deadlines",
                                payload
                            );
                            return updateBusinessPayload(prev, business, nextBusinessPayload);
                        });
                        return;
                    }

                    const pagePayload = await fetchCustomerStatementPaginatedByBusiness({
                        customerCode,
                        business,
                        view,
                        ofs,
                        limit: CUSTOMER_STATEMENT_PAGE_SIZE,
                        abortController,
                    });

                    if (requestSeq !== requestSeqByDatasetRef.current[datasetKey]) return;

                    onStatementChange((prev) => {
                        if (!prev) return prev;
                        const businessPayload = getBusinessPayload(prev, business);
                        const currentPayload = getDatasetPayloadFromBusiness(
                            businessPayload,
                            view
                        ) as CustomerStatementDatasetPayload;

                        const mergedItems =
                            ofs === 0
                                ? pagePayload.items
                                : [...currentPayload.items, ...pagePayload.items];

                        const mergedPayload: CustomerStatementDatasetPayload = {
                            ...pagePayload,
                            loaded: true,
                            items: mergedItems,
                            nextOfs: mergedItems.length,
                            total: Math.max(pagePayload.total, mergedItems.length),
                            paginated: true,
                        };

                        const nextBusinessPayload = setDatasetPayloadInBusiness(
                            businessPayload,
                            view,
                            mergedPayload
                        );

                        return updateBusinessPayload(prev, business, nextBusinessPayload);
                    });
                } catch (error: any) {
                    if (requestSeq !== requestSeqByDatasetRef.current[datasetKey]) return;
                    if (error?.name === "AbortError") return;
                    console.error(error);
                    setUnavailableByDataset((prev) => ({ ...prev, [datasetKey]: true }));
                } finally {
                    if (requestSeq === requestSeqByDatasetRef.current[datasetKey]) {
                        setLoadingByDataset((prev) => ({ ...prev, [datasetKey]: false }));
                        if (datasetAbortRef.current[datasetKey] === abortController) {
                            datasetAbortRef.current[datasetKey] = null;
                        }
                    }
                }
            },
            [customerCode, onStatementChange]
        );

        // Auto-load the currently selected dataset when missing.
        React.useEffect(() => {
            if (selectedPayload.loaded) return;
            if (selectedLoading) return;
            if (selectedUnavailable) return;
            void loadDataset({
                business: activeBusiness,
                view: activeView,
                ofs: 0,
            });
        }, [
            selectedPayload.loaded,
            selectedLoading,
            selectedUnavailable,
            activeBusiness,
            activeView,
            loadDataset,
        ]);

        // Switch business and eager-load selected view if not present.
        const handleBusinessChange = React.useCallback(
            (nextBusiness: CustomerStatementBusiness) => {
                if (nextBusiness === activeBusiness) return;
                persistSelection(nextBusiness, activeView);

                const nextBusinessCurrent = getDatasetPayload(
                    statement,
                    nextBusiness,
                    activeView
                );
                if (!nextBusinessCurrent.loaded) {
                    void loadDataset({
                        business: nextBusiness,
                        view: activeView,
                        ofs: 0,
                    });
                }
            },
            [activeBusiness, activeView, loadDataset, persistSelection, statement]
        );

        // Switch view and fetch immediately to avoid stale preview.
        const handleViewChange = React.useCallback(
            (nextView: CustomerStatementView) => {
                if (nextView === activeView) return;
                persistSelection(activeBusiness, nextView);

                const payload = getDatasetPayload(statement, activeBusiness, nextView);
                if (payload.loaded) return;

                void loadDataset({
                    business: activeBusiness,
                    view: nextView,
                    ofs: 0,
                });
            },
            [activeBusiness, activeView, loadDataset, persistSelection, statement]
        );

        const handleLoadMore = React.useCallback(() => {
            if (!selectedPayload.paginated) return;
            if (!selectedPayload.loaded) return;
            if (selectedPayload.items.length >= selectedPayload.total) return;
            if (selectedLoading) return;

            void loadDataset({
                business: activeBusiness,
                view: activeView,
                ofs: selectedPayload.nextOfs,
            });
        }, [
            activeBusiness,
            activeView,
            loadDataset,
            selectedLoading,
            selectedPayload,
        ]);

        const handleReloadSelected = React.useCallback(() => {
            void loadDataset({
                business: activeBusiness,
                view: activeView,
                ofs: 0,
            });
        }, [activeBusiness, activeView, loadDataset]);

        const handleDownload = React.useCallback(async () => {
            if (downloadLoading) return;
            if (activeView !== "deadlines") return;

            const cliente = String(customerCode ?? "").trim();
            if (!cliente) {
                enqueueSnackbar("Numero cliente non valido", { title: "Ops..", type: "error" });
                return;
            }

            const base = ensureTrailingSlash(import.meta.env.VITE_API_CUSTOMERSFIDO);
            const cmp = activeBusiness === "iot" ? 1 : 0;
            const url = `${base}customers/deadlines/export${buildQueryString({ cmp })}`;
            const abortRef = { current: null as AbortController | null };

            setDownloadLoading(true);
            try {
                const result = await FetchFileData(url, {
                    method: "POST",
                    body: JSON.stringify({ cliente }),
                    headers: {
                        "Content-Type": "application/json",
                    },
                    abortRef,
                    responseType: "blob",
                });

                if (result.kind !== "blob") {
                    enqueueSnackbar((result as any)?.json?.msg || "Non e stato possibile scaricare il file.", {
                        title: "Ops..",
                        type: "error",
                    });
                    return;
                }

                const blobUrl = URL.createObjectURL(result.blob);
                const link = document.createElement("a");
                link.href = blobUrl;
                link.download = result.filename || `customer_statement_${businessLabelMap[activeBusiness]}.xlsx`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                URL.revokeObjectURL(blobUrl);
            } catch (error: any) {
                if (error?.name !== "AbortError") {
                    enqueueSnackbar(error?.msg || error?.message || "Errore durante il download dello statement cliente.", {
                        title: "Ops..",
                        type: "error",
                    });
                }
            } finally {
                setDownloadLoading(false);
            }
        }, [activeBusiness, activeView, customerCode, downloadLoading]);

        const selectedShown = selectedPayload.items.length;
        const selectedTotal = selectedPayload.total;
        const selectedHasRows = selectedPayload.loaded && selectedShown > 0;
        const canLoadMore =
            selectedPayload.paginated &&
            selectedPayload.loaded &&
            selectedShown < selectedTotal &&
            !selectedLoading;
        const detailsEmptyState =
            (!selectedLoading && selectedPayload.loaded && selectedShown === 0) ||
            (!selectedLoading && !selectedPayload.loaded && selectedUnavailable);
        const summaryDatasetLoading =
            selectedLoading || (!selectedPayload.loaded && !selectedUnavailable);
        const summaryDatasetEmptyState =
            (!summaryDatasetLoading && selectedPayload.loaded && selectedShown === 0) ||
            (!summaryDatasetLoading && !selectedPayload.loaded && selectedUnavailable);
        const summaryPreviewRows = React.useMemo(
            () => selectedPayload.items.slice(0, 3),
            [selectedPayload.items]
        );
        const summaryHiddenRows = Math.max(selectedShown - summaryPreviewRows.length, 0);
        // Summary is backend-aggregated over the full dataset, not only loaded rows.
        const selectedSummary = selectedPayload.summary;

        const saldoPartita = selectedSummary?.saldoPartita ?? 0;
        const saldoComplessivo = selectedSummary?.saldoComplessivo ?? 0;
        const scadenzaUltimoRecord = selectedSummary?.scadenzaUltimoRecord ?? null;
        const annoUltimoRecord = selectedSummary?.annoUltimoRecord ?? null;
        const descrizioneUltimoRecord = selectedSummary?.descrizioneUltimoRecord ?? null;

        // Shared summary block rendered in both preview and details mode.
        const overviewContent = (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <SectionBlock>
                    <SectionKeyValue k="Saldo partita" v={formatCurrencyIt(saldoPartita)} />
                    <SectionKeyValue k="Saldo complessivo" v={formatCurrencyIt(saldoComplessivo)} />
                </SectionBlock>

                <SectionBlock>
                    <SectionKeyValue k="Scadenza" v={formatDateMaybe(scadenzaUltimoRecord)} />
                    <SectionKeyValue k="Anno" v={toDisplayText(annoUltimoRecord)} />
                    <SectionKeyValue k="Ultimo record" v={toDisplayText(descrizioneUltimoRecord)} />
                </SectionBlock>
            </div>
        );

        if (isSummary) {
            return (
                <SectionContainer clickable={false} onActivate={onOpenDetails} dataTour="scheda-cliente-statement">
                    <SectionHeader
                        title="Statement"
                        description="Estratto conto, scadenze e insoluti, storico disposizioni"
                        rightContent={
                            <div className="flex flex-wrap items-center justify-end gap-2">
                                <SectionPill tone="warn">
                                    ultima partita: <span className="ml-1 font-semibold">{formatCurrencyIt(saldoPartita)}</span>
                                </SectionPill>
                                {typeof onOpenDetails === "function" && (
                                    <SectionActionButton
                                        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                                            event.stopPropagation();
                                            onOpenDetails?.();
                                        }}
                                        rightIcon={FaPlus({})}
                                    >
                                        <span>Dettagli</span>
                                    </SectionActionButton>
                                )}
                            </div>
                        }
                    />

                    <div className="p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <p className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100">
                                    Azienda attiva: {businessLabelMap[activeBusiness]}
                                </p>
                                <ViewSelect activeView={activeView} onChange={handleViewChange} />
                            </div>
                            <BusinessSwitch activeBusiness={activeBusiness} onChange={handleBusinessChange} />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <SectionPill tone={selectedTotal > 0 ? "warn" : "neutral"}>
                                {statementViewLabelMap[activeView]}:{" "}
                                <span className="ml-1 font-semibold">
                                    {selectedPayload.loaded
                                        ? selectedPayload.paginated
                                            ? `${formatNumberIt(selectedShown)}/${formatNumberIt(selectedTotal)}`
                                            : formatNumberIt(selectedTotal)
                                        : selectedLoading
                                            ? "caricamento..."
                                            : "non caricato"}
                                </span>
                            </SectionPill>
                        </div>
                        {overviewContent}

                        <SectionBlock title={`Anteprima ${statementViewLabelMap[activeView]}`}>
                            {summaryDatasetLoading && <StatementLoadingPlaceholder />}

                            {summaryDatasetEmptyState && (
                                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                    {buildDatasetEmptyState(activeView, activeBusiness)}
                                </p>
                            )}

                            {!summaryDatasetLoading && !summaryDatasetEmptyState && (
                                <div className="space-y-2">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-[12px]">
                                            <StatementTableHead />
                                            <tbody>
                                                {renderStatementRows({
                                                    rows: summaryPreviewRows,
                                                    keyPrefix: "summary",
                                                    business: activeBusiness,
                                                    view: activeView,
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {summaryHiddenRows > 0 && (
                                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                            Sono presenti altri {formatNumberIt(summaryHiddenRows)} record in questa vista.
                                        </p>
                                    )}
                                </div>
                            )}
                        </SectionBlock>
                    </div>
                </SectionContainer>
            );
        }

        return (
            <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <SectionPill tone={selectedTotal > 0 ? "warn" : "neutral"}>
                            {selectedPayload.paginated
                                ? `elementi: ${formatNumberIt(selectedShown)}/${formatNumberIt(selectedTotal)}`
                                : `elementi: ${formatNumberIt(selectedTotal)}`}
                        </SectionPill>
                        <SectionPill>{businessLabelMap[activeBusiness]}</SectionPill>
                        <SectionPill>{statementViewLabelMap[activeView]}</SectionPill>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {activeView === "deadlines" && (
                            <SectionActionButton
                                disabled={downloadLoading}
                                onClick={handleDownload}
                                rightIcon={FaDownload({})}
                            >
                                <span>{downloadLoading ? "Scarico..." : "Download"}</span>
                            </SectionActionButton>
                        )}
                        <SectionActionButton
                            onClick={handleReloadSelected}
                            disabled={selectedLoading}
                        >
                            <span>{selectedLoading ? "Aggiorno..." : "Ricarica"}</span>
                        </SectionActionButton>
                        <ViewSelect activeView={activeView} onChange={handleViewChange} />
                        <BusinessSwitch activeBusiness={activeBusiness} onChange={handleBusinessChange} />
                    </div>
                </div>

                <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/40 p-4">
                    {overviewContent}
                </div>

                {selectedLoading && !selectedPayload.loaded && (
                    <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/40 p-4">
                        <StatementLoadingPlaceholder />
                    </div>
                )}

                {detailsEmptyState && (
                    <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/40 p-4">
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                            {buildDatasetEmptyState(activeView, activeBusiness)}
                        </p>
                    </div>
                )}

                {!selectedLoading && !detailsEmptyState && selectedHasRows && (
                    <>
                        <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/70 dark:bg-neutral-900/40 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-[12px]">
                                    <StatementTableHead />
                                    <tbody>
                                        {renderStatementRows({
                                            rows: selectedPayload.items,
                                            keyPrefix: "details",
                                            business: activeBusiness,
                                            view: activeView,
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {selectedPayload.paginated && (
                            <div className="flex items-center justify-center">
                                <SectionActionButton
                                    disabled={!canLoadMore}
                                    onClick={handleLoadMore}
                                    className="px-4 py-2"
                                >
                                    <span>
                                        {selectedShown >= selectedTotal
                                            ? "Tutti caricati"
                                            : selectedLoading
                                                ? "Carico..."
                                                : "Carica altri"}
                                    </span>
                                </SectionActionButton>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    };
