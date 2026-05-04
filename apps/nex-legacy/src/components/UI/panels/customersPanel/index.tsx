import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { saveProfilazione } from "./fetchdata";
import { SidePanelShell } from "./components/SidePanelShell";
import { CustomersPanelDetailsContent } from "./components/CustomersPanelDetailsContent";
import { CustomersPanelPaymentsFooter } from "./components/CustomersPanelPaymentsFooter";
import { CustomersPanelPrimaryFooter } from "./components/CustomersPanelPrimaryFooter";
import { CustomersPanelSummaryContent } from "./components/CustomersPanelSummaryContent";
import { CustomersPanelTitle } from "./components/CustomersPanelTitle";
import { SectionActionButton } from "./components/sectionUi";
import { useCustomersPanelController } from "./hooks/useCustomersPanelController";
import { useCustomersPanelPaymentsState } from "./hooks/useCustomersPanelPaymentsState";
import type { AnyRecord, CustomersPanelProps } from "./types";

import { useUserContext } from "context/UserContext";

import { getDetailsPanelMeta } from "./helpers/panelSections";
import { cn } from "./helpers/panelUtils";

/**
 * Orchestratore principale del CustomersPanel.
 *
 * Responsabilita:
 * - render del pannello "summary" (primario)
 * - apertura del pannello "details" (secondario) in base a `activeSection`
 * - wiring tra stato/fetch e componenti di presentazione
 *
 * Checklist rapida per aggiungere una nuova section:
 * 1) estendere i tipi in `types.ts` (`DetailsSection` e, se serve, `LoadingSection`)
 * 2) agganciare fetch + payload in `fetchdata/index.ts`
 * 3) registrare la card summary in `CustomersPanelSummaryContent`
 * 4) registrare il case details in `CustomersPanelDetailsContent`
 * 5) definire titolo/scroll del pannello secondario in `helpers/panelSections.ts`
 */
export const CustomersPanel: React.FC<CustomersPanelProps> = ({
    cliente,
    openFor,
    onClose,
    sizeClassName = "max-w-xl lg:max-w-2xl",
    closeOnBackdrop = true,
    closeOnEsc = true,
    className,
    zIndexClassName = "z-20",
}) => {
    const navigate = useNavigate();
    const open = Boolean(openFor);

    const {
        loading,
        hasErr,
        loadingStates,
        sectionFetchStates,
        data,
        secondaryOpen,
        activeSection,
        openDetails,
        closeSecondary,
        setPanelData,
        anagrafica,
        creditsProfile,
        creditsYears,
        profilazioneReport,
    } = useCustomersPanelController({ open, customerCode: cliente });

    // Stato locale dedicato esclusivamente al dettaglio "payments"
    // (reload manuale, loading tabella, statistiche footer).
    const {
        reloadToken: paymentsReloadToken,
        triggerReload: triggerPaymentsReload,
        detailsLoading: paymentsDetailsLoading,
        setDetailsLoading: setPaymentsDetailsLoading,
        setFooterStats: setPaymentsFooterStats,
        currentFooterStats,
    } = useCustomersPanelPaymentsState({
        activeSection,
        paymentsDetails: data.paymentsDetails,
    });

    const [openAddresses, setOpenAddresses] = React.useState(false);
    const [userContext] = useUserContext();

    const customerTitle = anagrafica?.RAGIONE_SOCIALE
        ? `${cliente} - ${String(anagrafica.RAGIONE_SOCIALE ?? "").trim()}`
        : String(cliente ?? "").trim() || "Cliente";

    // Metadati UI del pannello secondario, centralizzati in una helper
    // per mantenere uniforme il comportamento tra sezioni.
    const detailsMeta = React.useMemo(
        () => getDetailsPanelMeta(activeSection, customerTitle),
        [activeSection, customerTitle]
    );

    const handleDocumentiClick = React.useCallback(() => {
        navigate(`/documentiPDF?cc=${encodeURIComponent(cliente)}`);
    }, [navigate, cliente]);

    const handleSaveProfilazione = React.useCallback(
        (profilazionePayload: AnyRecord) => {
            const abortController = new AbortController();
            return saveProfilazione({
                abortController,
                customerCode: cliente,
                body: {},
                profilazionePayload,
                setData: setPanelData,
            });
        },
        [cliente, setPanelData]
    );

    React.useEffect(() => {
        if (!open || !closeOnEsc) return;

        // ESC chiude prima il pannello secondario, poi (solo se assente)
        // chiude il pannello principale.
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            if (secondaryOpen) {
                closeSecondary();
                return;
            }
            onClose();
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, closeOnEsc, secondaryOpen, closeSecondary, onClose]);

    const handleBackdropClick = () => {
        if (!closeOnBackdrop) return;
        if (secondaryOpen) {
            closeSecondary();
            return;
        }
        onClose();
    };

    // Azioni header del pannello secondario.
    // Ogni section puo aggiungere azioni contestuali tramite guardie su `activeSection`.
    const secondaryHeaderActions = (
        <>
            {activeSection === "payments" && (
                <SectionActionButton
                    onClick={triggerPaymentsReload}
                    disabled={paymentsDetailsLoading}
                >
                    <span>{paymentsDetailsLoading ? "Aggiorno..." : "Ricarica"}</span>
                </SectionActionButton>
            )}
        </>
    );

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        className={cn("fixed inset-0", zIndexClassName, "bg-black/35 dark:bg-black/55")}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { duration: 0.16 } }}
                        exit={{ opacity: 0, transition: { duration: 0.16 } }}
                        onClick={handleBackdropClick}
                    />

                    <div
                        className={cn("fixed inset-0", zIndexClassName, "flex justify-end pointer-events-none")}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div
                            className={cn(
                                "relative h-full w-full ml-auto pointer-events-none",
                                "transition-[max-width] duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)]",
                                secondaryOpen ? "max-w-6xl" : sizeClassName
                            )}
                        >
                            <div
                                className={cn("absolute inset-y-0 right-0 w-full z-20 pointer-events-auto", className ?? "")}
                                onClick={(event) => event.stopPropagation()}
                            >
                                <SidePanelShell
                                    title={
                                        <CustomersPanelTitle
                                            customerTitle={customerTitle}
                                            loading={loading}
                                            hasErr={hasErr}
                                            hasAnagrafica={Boolean(anagrafica)}
                                        />
                                    }
                                    onClose={onClose}
                                    animateVariant={secondaryOpen ? "background" : "visible"}
                                    contentState={secondaryOpen ? "background" : "front"}
                                    footer={
                                        <CustomersPanelPrimaryFooter
                                            updatedAt={creditsProfile?.Aggiornato}
                                            // warningsCount={data.warnings?.length ?? 0} @deprecated
                                            onDocumentiClick={handleDocumentiClick}
                                            onOpenAddresses={() => setOpenAddresses(true)}
                                            addressesOpen={openAddresses}
                                            onCloseAddresses={() => setOpenAddresses(false)}
                                            customerCode={cliente}
                                            userContext={(userContext ?? {}) as AnyRecord}
                                            customerLabel={String(anagrafica?.RAGIONE_SOCIALE ?? "")}
                                            onOpenNotes={() => openDetails("notes")}
                                        />
                                    }
                                >
                                    <CustomersPanelSummaryContent
                                        loading={loading}
                                        hasErr={hasErr}
                                        loadingStates={loadingStates}
                                        sectionFetchStates={sectionFetchStates}
                                        data={data}
                                        customerCode={cliente}
                                        anagrafica={anagrafica}
                                        creditsProfile={creditsProfile}
                                        creditsYears={creditsYears}
                                        profilazioneReport={profilazioneReport}
                                        onOpenDetails={openDetails}
                                    />
                                </SidePanelShell>
                            </div>

                            <AnimatePresence>
                                {secondaryOpen && (
                                    <div className="absolute inset-y-0 right-0 z-30 pointer-events-auto w-[92%]">
                                        <SidePanelShell
                                            title={detailsMeta.title}
                                            animateVariant="visible"
                                            contentState="front"
                                            onClose={closeSecondary}
                                            headerActions={secondaryHeaderActions}
                                            footer={
                                                activeSection === "payments" && currentFooterStats ? (
                                                    <CustomersPanelPaymentsFooter stats={currentFooterStats} />
                                                ) : undefined
                                            }
                                            bodyScrollable={detailsMeta.bodyScrollable}
                                            bodyClassName={detailsMeta.bodyClassName}
                                        >
                                            <CustomersPanelDetailsContent
                                                activeSection={activeSection}
                                                loadingStates={loadingStates}
                                                customerCode={cliente}
                                                anagrafica={anagrafica}
                                                creditsProfile={creditsProfile}
                                                creditsYears={creditsYears}
                                                profilazioneReport={profilazioneReport}
                                                backordersSummary={data.backordersSummary}
                                                backordersDetails={data.backordersDetails}
                                                paymentsDetails={data.paymentsDetails}
                                                sconti={data.sconti}
                                                paymentsReloadToken={paymentsReloadToken}
                                                onPaymentsLoadingChange={(value) => setPaymentsDetailsLoading(value)}
                                                onPaymentsStatsChange={(stats) => setPaymentsFooterStats(stats)}
                                                onSaveProfilazione={handleSaveProfilazione}
                                                userContext={(userContext ?? {}) as AnyRecord}
                                            />
                                        </SidePanelShell>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};
