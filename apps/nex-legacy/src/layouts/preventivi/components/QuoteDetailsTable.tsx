import React from "react";
import { MdDownload } from "react-icons/md";
import { TableVirtualized } from "components/Virtualized/table";
import { downloadCsvFromRows } from "utils/exportCsv";
import type { QuoteDetailRow, QuoteDetailsResponse } from "../types";

import { SidePanelShell } from "components/UI/panels/customersPanel/components/SidePanelShell";
import { FDButton, FDSkeletonLayout, FDSkeletonSwitch } from "@nex/fd-ui";

import { clsx } from "clsx";

const DownloadIcon = MdDownload as React.FC<{ size?: number; className?: string }>;
const DETAILS_PAGE_SIZE = 50;

// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
type QuoteDetailsTableProps = {
    selected: {
        env: string;
        year: string;
        quoteNumber: string;
        customerCode?: string;
        customerName?: string;
        quoteDate?: string | number;
    } | null;
    data: QuoteDetailsResponse | null;
    loading: boolean;
    onClose: () => void;
};

type DetailGridRow = QuoteDetailRow & { IMPORTO_RIGA: number };

type InfoFieldProps = {
    label: string;
    value: string;
};

type QuoteDetailsCsvRow = {
    Magazzino: string;
    Articolo: string;
    Quantita: string | number;
    "Prezzo (EUR)": string | number;
    "Totale riga (Prezzo * Quantita)": string | number;
    "Totale quantita": string | number;
    "Totale importo": string | number;
};


// ——————————————————————————————————————————————————————————
// UTILS & HELPER COMPONENTS
// ——————————————————————————————————————————————————————————
/** Normalizza i numeri provenienti dal backend evitando NaN nelle somme.*/
function getNumber(value: unknown): number {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
};

/**Calcola il totale riga usato sia in UI sia nell'export CSV.*/
function getRowAmount(row: QuoteDetailRow): number {
    return getNumber(row.RQTRI) * getNumber(row.RPZRI);
};

/** Mantiene il formato numerico del CSV coerente e privo di valori sporchi.*/
function formatAmountForCsv(value: unknown): string {
    if (value == null || String(value).trim() === "") return "";
    return getNumber(value).toFixed(2);
};

/** Converte date AS400 `YYYYMMDD` in un formato leggibile lato UI.*/
function formatYyyyMmDd(value: unknown): string {
    const raw = String(value ?? "").trim();
    if (!/^\d{8}$/.test(raw)) return "-";
    return `${raw.slice(6, 8)}/${raw.slice(4, 6)}/${raw.slice(0, 4)}`;
};

/** Riusa la stessa data anche nel nome file dell'export.*/
function formatDateForFilename(value: unknown): string {
    const formatted = formatYyyyMmDd(value);
    return formatted === "-" ? "data-non-disponibile" : formatted.replace(/\//g, "-");
};

/** Campo informativo compatto con lo stesso trattamento visivo delle card del pannello cliente.*/
function InfoField({ label, value }: InfoFieldProps) {
    return (
        <div
            className={clsx(
                "rounded-xl border border-neutral-200/70 dark:border-neutral-800/70",
                "bg-neutral-50/60 dark:bg-neutral-900/40 p-3",
            )}
        >
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400">
                {label}
            </div>
            <div className="mt-2 text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 break-words">
                {value || "-"}
            </div>
        </div>
    );
};

/** Metrica riassuntiva usata nel footer dei totali.*/
function SummaryMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/60 dark:bg-neutral-900/40 p-3">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
            <p className="mt-1 text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                {value}
            </p>
        </div>
    );
};

/** Formatters dedicati ai valori mostrati nel footer.*/
function formatAmount(value: number): string {
    return value.toLocaleString("it-IT", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

function formatInteger(value: number): string {
    return value.toLocaleString("it-IT");
};

/** Empty state riusabile per evitare markup duplicato nei rami senza dati.*/
function EmptyState({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/60 dark:bg-neutral-900/40 p-4">
            <p className="text-[12px] text-neutral-500 dark:text-neutral-400">{children}</p>
        </div>
    );
};

/** Footer con le metriche aggregate del dettaglio preventivo.*/
function TotalsBar({
    qtyTotal,
    amountTotal,
}: {
    qtyTotal: number;
    amountTotal: number;
}) {
    return (
        <div className="border-t border-neutral-200/60 dark:border-neutral-800/70 px-4 py-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <SummaryMetric label="Totale quantità" value={formatInteger(qtyTotal)} />
                <SummaryMetric label="Totale importo" value={formatAmount(amountTotal)} />
            </div>
        </div>
    );
};


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
export default function QuoteDetailsTable({
    selected,
    data,
    loading,
    onClose,
}: QuoteDetailsTableProps) {
    // La tabella vive dentro un drawer/modal, quindi usiamo un'altezza calcolata
    // per lasciare spazio a header, intestazione e footer dei totali.
    const tableHeight = "calc(90vh - 320px)";
    const rows = React.useMemo(() => data?.items ?? [], [data?.items]);
    const [allRows, setAllRows] = React.useState<DetailGridRow[]>([]);
    const [visibleRows, setVisibleRows] = React.useState<DetailGridRow[]>([]);
    const [loadingMore, setLoadingMore] = React.useState(false);

    React.useEffect(() => {
        // Il backend restituisce tutte le righe in una sola risposta.
        // Le esponiamo a chunk per alleggerire il mount iniziale della tabella.
        const nextRows = rows.map((row) => ({
            ...row,
            IMPORTO_RIGA: getRowAmount(row),
        }));
        setAllRows(nextRows);
        setVisibleRows(nextRows.slice(0, DETAILS_PAGE_SIZE));
    }, [rows]);

    /** Carica progressivamente altre righe nel virtualized scroll.*/
    const loadMoreDetails = React.useCallback(async () => {
        if (loading || loadingMore) return false;
        if (visibleRows.length >= allRows.length) return false;

        setLoadingMore(true);
        try {
            setVisibleRows(allRows.slice(0, visibleRows.length + DETAILS_PAGE_SIZE));
            return true;
        } finally {
            setLoadingMore(false);
        }
    }, [allRows, loading, loadingMore, visibleRows.length]);

    const qtyTotal = getNumber(
        data?.totals?.qtyTotal ?? rows.reduce((acc, row) => acc + getNumber(row.RQTRI), 0)
    );
    const amountTotal = getNumber(
        data?.totals?.amountTotal ?? rows.reduce((acc, row) => acc + getRowAmount(row), 0)
    );

    const customerValue = selected
        ? `${selected.customerCode || "-"}${selected.customerName ? ` - ${selected.customerName}` : ""}`
        : "-";

    const showTable = loading || visibleRows.length > 0;

    /** Esporta tutte le righe già arricchite con il totale riga e una riga finale di totalizzazione.*/
    const handleDownloadCsv = React.useCallback(() => {
        if (!allRows.length) return;

        const exportRows: QuoteDetailsCsvRow[] = allRows.map((row) => ({
            Magazzino: row.RCDMA || row.WDSMA || "",
            Articolo: row.RDES || row.RCDAR || "",
            Quantita: row.RQTRI ?? "",
            "Prezzo (EUR)": formatAmountForCsv(row.RPZRI),
            "Totale riga (Prezzo * Quantita)": formatAmountForCsv(row.IMPORTO_RIGA),
            "Totale quantita": "",
            "Totale importo": "",
        }));

        exportRows.push({
            Magazzino: "",
            Articolo: "",
            Quantita: "",
            "Prezzo (EUR)": "",
            "Totale riga (Prezzo * Quantita)": "",
            "Totale quantita": qtyTotal,
            "Totale importo": formatAmountForCsv(amountTotal),
        });

        const quoteNumber = selected?.quoteNumber || "-";
        const quoteDate = formatDateForFilename(selected?.quoteDate);
        const customerCode = selected?.customerCode || "-";

        downloadCsvFromRows(exportRows, {
            columns: [
                "Magazzino",
                "Articolo",
                "Quantita",
                "Prezzo (EUR)",
                "Totale riga (Prezzo * Quantita)",
                "Totale quantita",
                "Totale importo",
            ],
            filenameBase: `Dettaglio preventivo n. ${quoteNumber} del ${quoteDate} - Cod. Cliente ${customerCode}`,
            forcedTextCols: ["Magazzino"],
            sanitizeFilename: false,
        });
    }, [allRows, amountTotal, qtyTotal, selected?.customerCode, selected?.quoteDate, selected?.quoteNumber]);

    const layout = {
        type: "col",
        gap: 0.75,
        children: [
            { type: "block", className: "h-88 w-full" }, // titolo
        ],
    } as const;

    return (
        <SidePanelShell
            title={<div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex h-2 w-2 rounded-full bg-sky-500" />
                        <h2 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 truncate">
                            Dettaglio Preventivo
                            {selected?.quoteNumber ? ` - Preventivo n. ${selected.quoteNumber}` : ""}
                        </h2>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <FDButton
                        variant="outline"
                        color="neutral"
                        size="small"
                        radius="full"
                        asMotion={false}
                        onClick={handleDownloadCsv}
                        disabled={!allRows.length}
                        icon={<DownloadIcon className="mr-0.5" />}
                        className="bg-white dark:bg-neutral-900 border-neutral-300 text-sm dark:border-neutral-700 shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    >
                        Scarica CSV
                    </FDButton>
                </div>
            </div>}
            onClose={onClose}
            animateVariant={false ? "background" : "visible"}
            contentState={false ? "background" : "front"}
            footer={<TotalsBar qtyTotal={qtyTotal} amountTotal={amountTotal} />}
        >
            <div className="space-y-3">
                {selected ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <InfoField
                            label="Cliente"
                            value={customerValue}
                        />
                        <InfoField
                            label="Data preventivo"
                            value={formatYyyyMmDd(selected.quoteDate)}
                        />
                    </div>
                ) : (
                    <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/60 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-800/70 flex items-start gap-3">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex h-2 w-2 rounded-full bg-sky-500" />
                                    <h3 className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-50 truncate">
                                        Intestazione preventivo
                                    </h3>
                                </div>
                                <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2">
                                    Nessun preventivo selezionato.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 space-y-3">
                            <EmptyState>
                                Seleziona un preventivo dalla tabella per vedere il dettaglio.
                            </EmptyState>
                        </div>
                    </div>
                )}

                {selected && (
                    <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/40 overflow-hidden min-h-[320px]">
                        {showTable ? (
                            <TableVirtualized
                                data={visibleRows}
                                setData={setVisibleRows}
                                tableName="Dettaglio Preventivo Cliente"
                                textCenter
                                loadStatus={loading}
                                results={allRows.length}
                                whereToFindData={false}
                                footer={false}
                                infiniteScroll={{
                                    func: loadMoreDetails,
                                    loadStatus: loadingMore,
                                }}
                                height={tableHeight}
                                className="h-full min-h-0"
                            />
                        ) : (
                            <FDSkeletonSwitch
                                loading={loading}
                                skeleton={<FDSkeletonLayout layout={layout} />}
                            >
                                <EmptyState>Nessun dettaglio presente per questo preventivo.</EmptyState>
                            </FDSkeletonSwitch>
                        )}
                    </div>
                )}
            </div>
        </SidePanelShell>
    );
}
