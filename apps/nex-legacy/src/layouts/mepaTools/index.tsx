import {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { enqueueSnackbar } from "components/MessageBox";
import { AIContext } from "context/AIContext";
import { NewTenderWizard } from "./components/NewTenderWizard";
import { EvidenceViewer } from "./components/evidence/EvidenceViewer";
import { MepaPageHeader, TenderListScreen } from "./features/shell";
import { WorkspaceScreen, renderWorkspaceTab } from "./features/workspace";
import { validateMepaAiOutput } from "./fetchData/mepaAi";
import type { WorkspaceTab } from "./domain/workspace.types";

import { readActions, readCriticalities, readSummary } from "./utils/dossier";
import { useMepaWorkspaceController } from "./hooks/useMepaWorkspaceController";
import { useMepaDocumentsController } from "./hooks/useMepaDocumentsController";
import { useMepaDossierController } from "./hooks/useMepaDossierController";
import { useMepaEvidenceController } from "./hooks/useMepaEvidenceController";
import { useMepaObservabilityController } from "./hooks/useMepaObservabilityController";
import { useMepaProductsController } from "./hooks/useMepaProductsController";
import { useMepaChatController } from "./hooks/useMepaChatController";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import { Tooltip } from "react-tooltip";

/**
 * MEPA AI route container.
 *
 * This component must remain an orchestration shell: it wires global context,
 * domain controllers and workspace tab props, but it should not own feature
 * business logic. New state should normally live in a dedicated controller hook
 * so the route stays testable, readable and cheap to re-render.
 */
export default function MepaTools() {
    // Global AI shell integration.
    // The MEPA workspace can switch the shared AI layout between floating mode
    // and page-docked mode without duplicating AI state inside this route.
    const {
        open: globalAiOpen,
        setOpen: setGlobalAiOpen,
        setAiScope,
        setAiPresentationMode,
        setConversation,
    } = useContext(AIContext);
    // Shared abort channel passed to API helpers.
    // Keeping a single ref allows every controller to join the same cancellation
    // model without forcing this component to recreate callbacks on each render.
    const abortController = useRef<AbortController | null>(null);

    // Human-in-the-loop validation is a cross-tab operation.
    // This set prevents duplicate writes caused by double-clicks, touch retries or
    // repeated keyboard activation while the same validation request is in flight.
    const validationInFlightRef = useRef<Set<string>>(new Set());

    // Shared loading token consumed by the current UI.
    // IMPORTANT: keep string tokens stable because several tabs compare specific
    // values such as "documents-upload", "product-batch" or "chat".
    const [loading, setLoading] = useState<string | null>(null);

    // Reserved extension point used by the workspace controller when switching
    // tender. Feature controllers already reset themselves from tenderId changes;
    // this no-op keeps the lifecycle contract explicit for future controllers.
    const resetFeatureState = useCallback(() => undefined, []);

    const {
        screenMode,
        setScreenMode,
        activeTab,
        setActiveTab,
        filteredTenders,
        selectedTender,
        workspaceSnapshot,
        tenderReadiness,
        tenderDocuments,
        setTenderDocuments,
        tenderDocumentsSummary,
        setTenderDocumentsSummary,
        query,
        setQuery,
        newTenderOpen,
        setNewTenderOpen,
        selectedTenderIdRef,
        loadTenders,
        refreshWorkspaceData,
        openWorkspace,
        handleWizardCreated,
    } = useMepaWorkspaceController({
        abortController,
        onResetFeatureState: resetFeatureState,
    });

    // Derived read-models from the workspace snapshot.
    // They are memoized because the same dossier data feeds Overview, Dossier,
    // validation controls and readiness cards.
    const dossier = workspaceSnapshot?.dossier ?? null;
    const latestAgentRun = workspaceSnapshot?.latestAgentRun ?? null;
    const latestAnalysisJob = workspaceSnapshot?.latestAnalysisJob ?? null;
    const selectedCriticalities = useMemo(
        () => readCriticalities(dossier, latestAgentRun),
        [dossier, latestAgentRun],
    );
    const selectedActions = useMemo(
        () => readActions(dossier, latestAgentRun),
        [dossier, latestAgentRun],
    );
    const dossierSummary = useMemo(
        () => readSummary(dossier, latestAgentRun),
        [dossier, latestAgentRun],
    );
    const {
        loadDocuments: handleLoadDocuments,
        uploadWorkspaceDocuments: handleUploadWorkspaceDocuments,
        deleteWorkspaceDocument: handleDeleteWorkspaceDocument,
    } = useMepaDocumentsController({
        abortController,
        tenderId: selectedTender._id,
        setLoading,
        setTenderDocuments,
        setTenderDocumentsSummary,
        refreshWorkspaceData,
    });

    const {
        dossierReport,
        dossierQuality,
        loadDossierReport: handleLoadDossierReport,
        loadDossierQuality: handleLoadDossierQuality,
    } = useMepaDossierController({
        abortController,
        tenderId: selectedTender._id,
        setLoading,
    });

    const { selectedEvidence, evidenceLoading, closeEvidence } =
        useMepaEvidenceController({
            abortController,
            selectedTenderIdRef,
        });

    const {
        ragStats,
        vespaStatus,
        embeddingStatus,
        productRagControlPlane,
        loadObservability: handleLoadObservability,
        syncTenderVespa: handleSyncTenderVespa,
        bootstrapProductRag: handleBootstrapProductRag,
        runNextProductIndexJobs: handleRunNextProductIndexJobs,
    } = useMepaObservabilityController({
        abortController,
        tenderId: selectedTender._id,
        setLoading,
    });

    const {
        extractedItems,
        productQuery,
        setProductQuery,
        candidates,
        productSearchMeta,
        productBatchResult,
        productAgentsPipelineResult,
        loadProducts: handleLoadProducts,
        matchProducts: handleMatchProducts,
        runProductMatchingBatch: handleRunProductMatchingBatch,
        runProductAgentsPipeline: handleRunProductAgentsPipeline,
        updateExtractedItem: handleUpdateExtractedItem,
        validateProductMatch: handleValidateProductMatch,
        createManualExtractedItem: handleCreateManualExtractedItem,
    } = useMepaProductsController({
        abortController,
        tenderId: selectedTender._id,
        setLoading,
        refreshWorkspaceData,
    });


    const {
        chatQuestion,
        setChatQuestion,
        chatAnswer,
        chatMessages,
        chatSuggestedActions,
        chatConfidence,
        chatIntent,
        chatLimitations,
        ragChunks,
        retrievalProvider,
        fallbackUsed,
        ragElapsedMs,
        retrievalMode,
        vespaQueryStrategy,
        fallbackReason,
        embeddingError,
        vespaHitsBeforeScope,
        vespaScopedHits,
        vespaSelfHealAttempted,
        vespaSelfHealFed,
        vespaSelfHealFailed,
        vespaSelfHealEmbeddingFailed,
        vespaSelfHealError,
        loadChatMessages: handleLoadChatMessages,
        askAi: handleAskAi,
    } = useMepaChatController({
        abortController,
        tenderId: selectedTender._id,
        setLoading,
    });

    // Lightweight preview for the Overview. The Products tab owns the full list,
    // while the dashboard only needs a bounded subset to avoid layout and render
    // pressure on first paint.
    const previewItems = (
        workspaceSnapshot?.extractedItemsPreview ?? extractedItems
    ).slice(0, 12);

    /**
     * Synchronizes the global AI dock with the selected MEPA workspace.
     *
     * The effect is intentionally kept here because it crosses feature boundaries:
     * it depends on route mode, active tab and the global AI provider. Feature
     * controllers should never directly mutate global shell presentation.
     */
    useEffect(() => {
        if (screenMode === "workspace" && selectedTender._id) {
            setAiScope({
                kind: "MEPA_TENDER",
                tenderId: selectedTender._id,
                title: selectedTender.title,
                subtitle: [
                    selectedTender.ente,
                    selectedTender.cig ? `CIG ${selectedTender.cig}` : null,
                    selectedTender.rdo ? `RDO ${selectedTender.rdo}` : null,
                ]
                    .filter(Boolean)
                    .join(" · "),
            });

            // The MEPA assistant has two presentation modes:
            // - Overview: page-docked, embedded inside the dashboard card.
            // - Other workspace tabs: normal floating global AI, opened only on top-bar click.
            //
            // This avoids leaving the global AILayout permanently hidden after the user
            // visits Overview and then navigates to another NEX panel or MEPA tab.
            if (activeTab === "overview") {
                setAiPresentationMode("PAGE_DOCKED");
                setGlobalAiOpen(true);
            } else {
                setAiPresentationMode("FLOATING");
                setGlobalAiOpen(false);
            }
            return;
        }

        // Quando si torna alla lista gare il dock AI contestuale deve essere smontato
        // e il pannello globale non deve ereditare lo stato/dimensioni dell'embedded chat.
        setAiScope({ kind: "GENERAL" });
        setAiPresentationMode("FLOATING");
        setConversation(null);
        setGlobalAiOpen(false);
    }, [
        screenMode,
        activeTab,
        selectedTender._id,
        selectedTender.title,
        selectedTender.ente,
        selectedTender.cig,
        selectedTender.rdo,
        setAiScope,
        setAiPresentationMode,
        setConversation,
        setGlobalAiOpen,
    ]);

    useEffect(() => {
        return () => {
            setAiScope({ kind: "GENERAL" });
            setAiPresentationMode("FLOATING");
            setConversation(null);
            setGlobalAiOpen(false);
        };
    }, [setAiScope, setAiPresentationMode, setConversation, setGlobalAiOpen]);

    /**
     * Persists human-in-the-loop validation for AI generated outputs.
     *
     * The validation action is shared by Overview, Dossier and Product Review.
     * Keeping this handler in the page orchestration layer preserves a single
     * refresh policy across tabs while the actual feature state remains isolated
     * inside the dedicated controllers. The in-flight set prevents accidental
     * double-submit from rapid clicks or touch devices.
     */
    const handleValidateAiOutput = useCallback(
        async (params: any) => {
            if (!selectedTender._id || !params?.targetType || !params?.targetId) return;

            const validationKey = [
                selectedTender._id,
                params.targetType,
                params.targetId,
                params.sectionKey ?? "",
                params.fieldKey ?? "",
                params.decision ?? "",
            ].join(":");

            if (validationInFlightRef.current.has(validationKey)) return;
            validationInFlightRef.current.add(validationKey);

            try {
                setLoading("validation");
                await validateMepaAiOutput({
                    abortController,
                    tenderId: selectedTender._id,
                    targetType: params.targetType,
                    targetId: params.targetId,
                    sectionKey: params.sectionKey ?? null,
                    fieldKey: params.fieldKey ?? null,
                    decision: params.decision,
                    correctedValue: params.correctedValue,
                    note: params.note ?? null,
                });

                enqueueSnackbar?.("Validazione AI salvata.", {
                    variant: "success",
                } as any);

                if (params.targetType === "EXTRACTED_ITEM") {
                    await handleLoadProducts();
                }

                if (
                    params.targetType === "DOSSIER" ||
                    params.targetType === "DOSSIER_SECTION" ||
                    params.targetType === "CRITICALITY" ||
                    params.targetType === "SUGGESTED_ACTION"
                ) {
                    await handleLoadDossierReport();
                }

                await refreshWorkspaceData(selectedTender._id, { force: true });
            } catch (error) {
                console.error(error);
                enqueueSnackbar?.("Non riesco a salvare la validazione AI.", {
                    variant: "error",
                } as any);
            } finally {
                validationInFlightRef.current.delete(validationKey);
                setLoading(null);
            }
        },
        [
            abortController,
            handleLoadDossierReport,
            handleLoadProducts,
            refreshWorkspaceData,
            selectedTender._id,
            setLoading,
        ],
    );

    const renderActiveWorkspaceTab = useCallback(
        (tab: WorkspaceTab, workspaceProps: Record<string, any>) =>
            renderWorkspaceTab(tab, workspaceProps),
        [],
    );

    return (
        <DashboardLayout>
            <div className="min-h-screen px-3 py-4 text-slate-900 sm:px-4 sm:py-5 lg:px-6 lg:py-6 dark:bg-neutral-950 dark:text-white">
                <div className="mx-auto flex max-w-[1500px] flex-col gap-6">
                    <MepaPageHeader
                        screenMode={screenMode}
                        selectedTender={selectedTender}
                        snapshot={workspaceSnapshot}
                        loading={loading}
                        onBackToList={() => {
                            setScreenMode("list");
                            setActiveTab("overview");
                            setAiScope({ kind: "GENERAL" });
                            setAiPresentationMode("FLOATING");
                            setConversation(null);
                            setGlobalAiOpen(false);
                        }}
                        onCreateTender={() => setNewTenderOpen(true)}
                        onRefreshWorkspace={() =>
                            selectedTender
                                ? refreshWorkspaceData(selectedTender._id, { force: true })
                                : loadTenders()
                        }
                        onOpenQuotation={() => setActiveTab("quotation")}
                    />

                    {screenMode === "list" ? (
                        <TenderListScreen
                            tenders={filteredTenders}
                            query={query}
                            setQuery={setQuery}
                            onOpenWorkspace={openWorkspace}
                            onRefresh={loadTenders}
                        />
                    ) : (
                        <WorkspaceScreen
                            selectedTender={selectedTender}
                            snapshot={workspaceSnapshot}
                            readiness={tenderReadiness}
                            activeTab={activeTab}
                            setActiveTab={(tab: WorkspaceTab) => {
                                setActiveTab(tab);
                                if (tab === "documents") void handleLoadDocuments();
                                if (tab === "dossier") void handleLoadDossierReport();
                                if (tab === "products") void handleLoadProducts();
                                if (tab === "observability") void handleLoadObservability();
                                if (tab === "chat") {
                                    void handleLoadChatMessages();
                                }
                            }}
                            dossier={dossier}
                            dossierSummary={dossierSummary}
                            dossierReport={dossierReport}
                            dossierQuality={dossierQuality}
                            onLoadDossierReport={handleLoadDossierReport}
                            onLoadDossierQuality={handleLoadDossierQuality}
                            criticalities={selectedCriticalities}
                            actions={selectedActions}
                            latestAgentRun={latestAgentRun}
                            latestAnalysisJob={latestAnalysisJob}
                            tenderDocuments={tenderDocuments}
                            tenderDocumentsSummary={tenderDocumentsSummary}
                            onLoadDocuments={handleLoadDocuments}
                            onUploadDocuments={handleUploadWorkspaceDocuments}
                            onDeleteDocument={handleDeleteWorkspaceDocument}
                            extractedItems={
                                activeTab === "products" ? extractedItems : previewItems
                            }
                            ragStats={ragStats}
                            vespaStatus={vespaStatus}
                            embeddingStatus={embeddingStatus}
                            loading={loading}
                            onRefresh={() =>
                                refreshWorkspaceData(selectedTender._id, { force: true })
                            }
                            onLoadProducts={handleLoadProducts}
                            onLoadObservability={handleLoadObservability}
                            onSyncTenderVespa={handleSyncTenderVespa}
                            productRagControlPlane={productRagControlPlane}
                            onBootstrapProductRag={handleBootstrapProductRag}
                            onRunNextProductIndexJobs={handleRunNextProductIndexJobs}
                            chatQuestion={chatQuestion}
                            setChatQuestion={setChatQuestion}
                            chatAnswer={chatAnswer}
                            chatMessages={chatMessages}
                            chatSuggestedActions={chatSuggestedActions}
                            chatConfidence={chatConfidence}
                            chatIntent={chatIntent}
                            chatLimitations={chatLimitations}
                            onLoadChatMessages={handleLoadChatMessages}
                            ragChunks={ragChunks}
                            retrievalProvider={retrievalProvider}
                            fallbackUsed={fallbackUsed}
                            ragElapsedMs={ragElapsedMs}
                            retrievalMode={retrievalMode}
                            vespaQueryStrategy={vespaQueryStrategy}
                            fallbackReason={fallbackReason}
                            embeddingError={embeddingError}
                            vespaHitsBeforeScope={vespaHitsBeforeScope}
                            vespaScopedHits={vespaScopedHits}
                            vespaSelfHealAttempted={vespaSelfHealAttempted}
                            vespaSelfHealFed={vespaSelfHealFed}
                            vespaSelfHealFailed={vespaSelfHealFailed}
                            vespaSelfHealEmbeddingFailed={vespaSelfHealEmbeddingFailed}
                            vespaSelfHealError={vespaSelfHealError}
                            onAskAi={handleAskAi}
                            productQuery={productQuery}
                            setProductQuery={setProductQuery}
                            candidates={candidates}
                            productSearchMeta={productSearchMeta}
                            onMatchProducts={handleMatchProducts}
                            onRunProductMatchingBatch={handleRunProductMatchingBatch}
                            onRunProductAgentsPipeline={handleRunProductAgentsPipeline}
                            productAgentsPipelineResult={productAgentsPipelineResult}
                            productBatchResult={productBatchResult}
                            onValidate={handleValidateAiOutput}
                            onUpdateItem={handleUpdateExtractedItem}
                            onCreateManualItem={handleCreateManualExtractedItem}
                            onValidateProductMatch={handleValidateProductMatch}
                            renderActiveTab={renderActiveWorkspaceTab}
                            globalAiOpen={globalAiOpen}
                            onOpenGlobalAi={() => setGlobalAiOpen(true)}
                        />
                    )}
                </div>

                <NewTenderWizard
                    open={newTenderOpen}
                    onClose={() => setNewTenderOpen(false)}
                    abortController={abortController}
                    onCreated={handleWizardCreated}
                />
                <EvidenceViewer
                    evidence={selectedEvidence}
                    loading={evidenceLoading}
                    onClose={closeEvidence}
                />
                <Tooltip id="general-mepa-ai-tooltip" place="bottom" className="max-w-[15vw] min-w-[150px] !text-xs text-center z-50 !rounded-md" />
            </div>
        </DashboardLayout>
    );
}
