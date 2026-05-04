import React, { useCallback, useState } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import { Tooltip } from "react-tooltip";
import { enqueueSnackbar } from "components/MessageBox";
import { useGeneralDataContext } from "context/GeneralDataContext";
import { useUserContext } from "context/UserContext";
import { PdfViewer } from "layouts/documentiPDF/components/PdfViewer";
import { buildPdfUrl } from "layouts/documentiPDF/lib/openPdf";
import { downloadPdfSingleAPI } from "layouts/documentiPDF/lib/downloadDocuments";
import TopBar from "./components/TopBar";
import PurchasesTable from "./components/PurchasesTable";
import { usePurchasesData } from "./hooks/usePurchasesData";
import { usePurchasesQueryState } from "./hooks/usePurchasesQueryState";
import type { PurchaseRow } from "./types";

/**
 * Pagina principale "Dati acquistato clienti/Acquisti clienti".
 *
 * Responsabilità:
 * - comporre i componenti di UI (TopBar, tabella, viewer PDF);
 * - collegare gli hook di stato/query e quelli di caricamento dati;
 * - delegare a funzioni dedicate le azioni utente (ricerca, reset, export, apertura documenti).
 */
export default function PurchasesPage() {
    const [userContext] = useUserContext() as any;
    const { globalData } = useGeneralDataContext() as any;
    const location = useLocation();

    const {
        draftQuery,
        appliedQuery,
        sortState,
        canSelectAgent,
        patchDraftQuery,
        handleSortChange,
        applyDraftFilters,
        resetFilters,
    } = usePurchasesQueryState({
        locationState: location.state,
        userContext,
    });

    const {
        items,
        setItems,
        total,
        summary,
        filterOptions,
        loadingList,
        loadingMore,
        loadingFilters,
        loadingCustomerSearch,
        loadingExport,
        loadingSummary,
        setCustomerSearchText,
        loadMore,
        refreshFilters,
        clearResults,
        exportCurrentResult,
    } = usePurchasesData({
        userContext,
        globalAgents: globalData?.agents,
        appliedQuery,
    });

    // Stato del viewer documento: `pdfDoc` contiene il file selezionato, `openPdf` governa il modal.
    const [openPdf, setOpenPdf] = useState(false);
    const [pdfDoc, setPdfDoc] = useState<{ name: string; company: "FOCELDA" | "IOT" } | null>(null);

    /**
     * Applica i filtri in bozza alla ricerca effettiva.
     * La logica concreta resta nell'hook, qui manteniamo solo il wiring UI.
     */
    const handleSearch = useCallback(() => {
        /**
         * Refresh lookup esplicito al click su "Applica filtri".
         *
         * `force: true` ci garantisce un riallineamento immediato delle opzioni
         * anche se lo scope base non è cambiato ma il backend ha aggiornato il dataset.
         */
        void refreshFilters(draftQuery, { force: true });
        applyDraftFilters();
    }, [applyDraftFilters, draftQuery, refreshFilters]);

    /**
     * Ripristina i filtri di default e pulisce i risultati correnti in tabella/KPI.
     */
    const handleReset = useCallback(() => {
        resetFilters();
        clearResults();
    }, [clearResults, resetFilters]);

    /**
     * Apre il documento PDF (fattura o bolla) per la riga selezionata.
     * Se il documento non è disponibile, mostra un warning all'utente.
     */
    const openDocument = useCallback((row: PurchaseRow, type: "invoice" | "delivery") => {
        const doc = type === "invoice" ? row.invoice : row.deliveryNote;
        if (!doc?.available || !doc.fileName) {
            enqueueSnackbar("Documento non disponibile per questa riga.", {
                title: "Info",
                type: "warning",
            });
            return;
        }

        setPdfDoc({
            name: String(doc.fileName),
            company: row.environment,
        });
        setOpenPdf(true);
    }, []);

    /**
     * Trigger dell'export CSV coerente con i filtri attualmente applicati.
     */
    const exportAction = useCallback(() => {
        void exportCurrentResult();
    }, [exportCurrentResult]);

    return (
        <DashboardLayout>
            <div className="w-full h-full flex flex-col gap-4 p-2">
                <TopBar
                    draftQuery={draftQuery}
                    onPatchDraftQuery={patchDraftQuery}
                    filterOptions={filterOptions}
                    canSelectAgent={canSelectAgent}
                    customerSearchLoading={loadingCustomerSearch}
                    onCustomerSearchChange={setCustomerSearchText}
                    onSearch={handleSearch}
                    onReset={handleReset}
                    onExportCsv={exportAction}
                    loadingExport={loadingExport || loadingFilters}
                    onOpenFilters={() => {
                        /**
                         * Carichiamo i lookup all'apertura menu in modo deduplicato.
                         *
                         * La deduplica è gestita nell'hook con una scope-key:
                         * click ripetuti su "Filtri" non causano nuove chiamate inutili.
                         */
                        void refreshFilters(appliedQuery);
                    }}
                    summary={summary}
                    loadingSummary={loadingSummary}
                />

                <PurchasesTable
                    items={items}
                    setItems={setItems}
                    total={total}
                    loading={loadingList}
                    loadingMore={loadingMore}
                    onLoadMore={loadMore}
                    sortState={sortState}
                    onSortChange={handleSortChange}
                    onOpenInvoice={(row) => openDocument(row, "invoice")}
                    onOpenDeliveryNote={(row) => openDocument(row, "delivery")}
                />
            </div>

            <Tooltip
                id="purchases-tooltip"
                place="bottom"
                style={{
                    maxWidth: "15vw",
                    minWidth: 150,
                    fontSize: "0.87rem",
                    textAlign: "center",
                    zIndex: 999999,
                }}
            />

            {pdfDoc && (
                <PdfViewer
                    open={openPdf}
                    // Chiude solo il viewer lasciando in memoria il documento corrente.
                    onClose={() => setOpenPdf(false)}
                    title={pdfDoc.name}
                    source={{ type: "url", url: buildPdfUrl({ fileName: pdfDoc.name, company: pdfDoc.company }) }}
                    // Download manuale del PDF dall'azione interna al viewer.
                    onDownload={() => downloadPdfSingleAPI(pdfDoc.name, pdfDoc.company, { asAttachment: true, credentials: "include" })}
                />
            )}
        </DashboardLayout>
    );
}
