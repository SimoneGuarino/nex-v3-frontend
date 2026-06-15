import React, { useEffect, useRef } from "react";
import { FiCpu, FiFileText, FiMessageSquare, FiTarget } from "react-icons/fi";
import { HiOutlineSparkles } from "react-icons/hi2";
import { Panel } from "../../components/shared/Panel";
import { InfoMini } from "../../components/shared/InfoMini";
import { EmptyState } from "../../components/shared/EmptyState";
import { ReadinessCard } from "../shell";
import { ActionCard, CriticalityCard, ValidationSummary } from "../validation";
import type { WorkspaceSnapshot } from "../../domain/workspace.types";
import type { MepaAgentRunTrace, MepaTenderDocument, MepaTenderReadiness } from "../../types";
import { formatDate } from "../../utils/formatters";
import { providerBadgeClass, providerLabel } from "../../utils/status";
import { readTenderBusinessSummary } from "../../utils/dossier";
import { getLatestActiveTenderDocuments as getLatestActiveTenderDocumentRows, isTenderDocumentProcessed, OverviewDocumentPreviewRow } from "./documentPreview";
import { DeferredEmbeddedAi } from "./DeferredEmbeddedAi";

import {
    FiAlertTriangle, FiCheckCircle
} from "react-icons/fi";

const FiCheckCircleIcon = FiCheckCircle as React.FC<{ className?: string }>;
const FiAlertTriangleIcon = FiAlertTriangle as React.FC<{ className?: string }>;

/**
 * The Overview is a dashboard, not the full operational workspace.
 * Keep preview counts intentionally small so the page remains readable on laptop and tablet widths.
 */
const OVERVIEW_PREVIEW_LIMIT = 3;

/**
 * Static prompt presets are module-level constants so they are not re-created on every render.
 * The embedded AI card can mount/defer independently without changing these references.
 */
const OVERVIEW_AI_QUICK_PROMPTS = [
    "Analizza la documentazione e dimmi se è una gara adatta a noi.",
    "Quali sono i punti chiave da validare prima della quotazione?",
    "Quali prodotti risultano richiesti e quali hanno già un match catalogo?",
    "Prepara una sintesi operativa per il buyer.",
];

type OverviewTone = "emerald" | "amber" | "red" | "blue" | "slate" | "purple";

/** Counts unique non-empty identifiers from heterogeneous AI/workspace sources. */
function uniqueCount(values: unknown[]) {
    return new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)).size;
}

/** Normalizes unknown numeric values from backend snapshots, agent traces and dossier payloads. */
function compactCount(value: unknown, fallback = 0) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
}

/** Centralized tone-to-class mapping for Overview badges. */
function toneBadgeClass(tone: OverviewTone) {
    const classes: Record<OverviewTone, string> = {
        emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900",
        amber: "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900",
        red: "bg-red-50 text-red-700 ring-red-100 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900",
        blue: "bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-200 dark:ring-blue-900",
        slate: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700",
        purple: "bg-purple-50 text-purple-700 ring-purple-100 dark:bg-purple-950/40 dark:text-purple-200 dark:ring-purple-900",
    };
    return classes[tone];
}

/** Shared button style helper for compact Overview actions. */
function overviewButtonClass(variant: "primary" | "secondary" = "secondary") {
    if (variant === "primary") return "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";
    return "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800";
}

/**
 * Builds the document summary shown in the Overview card.
 *
 * The MEPA workspace can receive document signals from several read models: workspace snapshot,
 * readiness metrics, dossier evidence and latest agent runs. This adapter normalizes those sources
 * into one dashboard-friendly object so the JSX does not need to know every backend shape.
 */
function extractDocumentOverview(props: any) {
    const snapshot: WorkspaceSnapshot | null = props.snapshot ?? null;
    const readiness: MepaTenderReadiness | null = props.readiness ?? null;
    const dossier = props.dossier ?? snapshot?.dossier ?? null;
    const latestAnalysisJob = props.latestAnalysisJob ?? snapshot?.latestAnalysisJob ?? null;
    const latestAgentRun = props.latestAgentRun ?? snapshot?.latestAgentRun ?? null;

    const registeredDocuments = Array.isArray(props.tenderDocuments) ? props.tenderDocuments : Array.isArray(snapshot?.documents) ? snapshot.documents : [];
    const registeredSummary = props.tenderDocumentsSummary ?? snapshot?.documentsSummary ?? (snapshot?.statusSummary as any)?.documentsSummary ?? null;

    const documentCandidates = [
        ...registeredDocuments,
        ...(Array.isArray(dossier?.evidence?.documents) ? dossier.evidence.documents : []),
        ...(Array.isArray(dossier?.documents) ? dossier.documents : []),
        ...(Array.isArray(dossier?.sourceDocuments) ? dossier.sourceDocuments : []),
        ...(Array.isArray(latestAnalysisJob?.documents) ? latestAnalysisJob.documents : []),
        ...(Array.isArray(latestAnalysisJob?.input?.documents) ? latestAnalysisJob.input.documents : []),
        ...(Array.isArray(latestAgentRun?.inputs?.documents) ? latestAgentRun.inputs.documents : []),
        ...(Array.isArray(latestAgentRun?.outputs?.evidence?.documents) ? latestAgentRun.outputs.evidence.documents : []),
    ];

    const explicitTotal = compactCount(
        registeredSummary?.total ??
        (snapshot?.statusSummary as any)?.documentsCount ??
        latestAnalysisJob?.documentsCount ??
        latestAnalysisJob?.inputDocumentsCount ??
        latestAgentRun?.inputs?.documentsCount ??
        dossier?.evidence?.totalDocuments,
        NaN,
    );

    const totalDocuments = Number.isFinite(explicitTotal)
        ? explicitTotal
        : uniqueCount(documentCandidates.map((doc: any) => doc?.documentId ?? doc?.id ?? doc?.storageKey ?? doc?.documentTitle ?? doc?.fileName ?? doc?.originalFileName ?? doc?.title));

    const indexedChunks = compactCount(registeredSummary?.chunks ?? readiness?.metrics?.documentsChunksCount ?? dossier?.evidence?.totalChunks ?? latestAnalysisJob?.chunksCount ?? latestAnalysisJob?.documentChunksCount, 0);
    const chunksWithPage = compactCount(readiness?.metrics?.documentsWithPageCount, 0);
    const chunksWithSection = compactCount(readiness?.metrics?.documentsWithSectionCount, 0);
    const failedDocuments = compactCount(registeredSummary?.failed ?? latestAnalysisJob?.failedDocumentsCount ?? latestAnalysisJob?.failedDocuments?.length ?? (snapshot?.statusSummary as any)?.failedDocumentsCount, 0);
    const processedDocuments = compactCount(registeredSummary?.processed, registeredDocuments.filter((doc: MepaTenderDocument) => isTenderDocumentProcessed(doc)).length);
    const processingDocuments = compactCount(registeredSummary?.processing, registeredDocuments.filter((doc: MepaTenderDocument) => ["UPLOADED", "PROCESSING"].includes(String(doc.processingStatus ?? "").toUpperCase())).length);
    const processingStatus = String(snapshot?.statusSummary?.analysisStatus ?? latestAnalysisJob?.status ?? latestAgentRun?.status ?? snapshot?.tender?.status ?? "").toUpperCase();

    const statusTone: OverviewTone = failedDocuments > 0 ? "red" : processingStatus.includes("RUNNING") || processingStatus.includes("PROCESSING") || processingStatus.includes("QUEUED") ? "blue" : indexedChunks > 0 ? "emerald" : "amber";
    const statusLabel = failedDocuments > 0 ? "Da verificare" : processingStatus.includes("RUNNING") || processingStatus.includes("PROCESSING") || processingStatus.includes("QUEUED") ? "Elaborazione in corso" : indexedChunks > 0 ? "Indicizzati" : "Da indicizzare";

    return {
        totalDocuments,
        indexedChunks,
        chunksWithPage,
        chunksWithSection,
        failedDocuments,
        processedDocuments,
        processingDocuments,
        statusTone,
        statusLabel,
        processingStatus: processingStatus || "N.D.",
        lastUpdatedAt: latestAnalysisJob?.updatedAt ?? latestAnalysisJob?.completedAt ?? latestAgentRun?.completedAt ?? latestAgentRun?.updatedAt ?? null,
    };
}

/** Footer CTA used by preview cards to jump from dashboard preview to the full tab. */
function OverviewLinkFooter({ shown, total, label, onClick }: { shown: number; total: number; label: string; onClick: () => void }) {
    if (total <= shown) return null;
    return (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs dark:bg-neutral-950">
            <span className="text-slate-500 dark:text-neutral-400">Mostrati {shown} di {total}. Il dettaglio completo resta nel Dossier AI.</span>
            <button type="button" onClick={onClick} className="font-bold text-blue-600 hover:text-blue-700 dark:text-blue-300">
                {label}
            </button>
        </div>
    );
}

/**
 * Dashboard card for tender documents.
 *
 * It intentionally shows only operational counters and a small latest-documents preview. The full
 * registry remains in the Documenti tab to keep the Overview lightweight and usable on small screens.
 */
function DocumentsOverviewCard(props: any) {
    // Hidden file input ref: upload is triggered by the styled action button without causing renders.
    const inputRef = useRef<HTMLInputElement | null>(null);
    // Normalized document counters from multiple backend/read-model sources.
    const summary = extractDocumentOverview(props);
    const snapshot: WorkspaceSnapshot | null = props.snapshot ?? null;
    const documentSource = Array.isArray(props.tenderDocuments) && props.tenderDocuments.length
        ? props.tenderDocuments
        : Array.isArray(snapshot?.documents)
            ? snapshot.documents
            : [];
    const documents = getLatestActiveTenderDocumentRows(documentSource, 5);
    const hasDocuments = summary.totalDocuments > 0 || summary.indexedChunks > 0 || documents.length > 0;

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);
        event.target.value = "";
        if (files.length) void props.onUploadDocuments?.(files);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-sm leading-6 text-slate-600 dark:text-neutral-300">
                        Traccia sintetica dei documenti usati dall'AI per costruire dossier, evidenze e talk-with-documents. Qui vedi gli ultimi 5 file caricati, con stato agent e azioni rapide per mantenere operativo il set documentale.
                    </p>
                    {summary.lastUpdatedAt && <p className="mt-1 text-xs text-slate-400">Ultimo aggiornamento analisi: {formatDate(summary.lastUpdatedAt)}</p>}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${toneBadgeClass(summary.statusTone)}`}>{summary.statusLabel}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <InfoMini label="Documenti" value={hasDocuments ? String(summary.totalDocuments || documents.length || "—") : "—"} />
                <InfoMini label="Elaborati" value={String(summary.processedDocuments ?? documents.filter((doc) => isTenderDocumentProcessed(doc)).length)} />
                <InfoMini label="In lavorazione" value={String(summary.processingDocuments ?? documents.filter((doc) => ["UPLOADED", "PROCESSING"].includes(String(doc.processingStatus ?? "").toUpperCase())).length)} />
                <InfoMini label="Chunk RAG" value={String(summary.indexedChunks)} />
            </div>

            {documents.length ? (
                <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-neutral-800">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
                        <span className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">Ultimi documenti caricati</span>
                        <button type="button" onClick={() => props.setActiveTab?.("documents")} className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-300">
                            Vai al registro
                        </button>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-neutral-800">
                        {documents.map((doc) => <OverviewDocumentPreviewRow key={doc.documentId ?? doc._id ?? doc.storageKey ?? doc.originalFileName} doc={doc} onDelete={props.onDeleteDocument} loading={props.loading} />)}
                    </div>
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-400">
                    Nessun documento registrato nel workspace. Carica capitolato, disciplinare o allegati per alimentare l'analisi AI della gara.
                </div>
            )}

            {summary.failedDocuments > 0 && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-3 text-xs leading-5 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
                    Sono presenti {summary.failedDocuments} documento/i con errore di elaborazione. Verifica il set documentale prima di considerare il dossier definitivo.
                </div>
            )}

            <input ref={inputRef} type="file" multiple className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.xml,.zip,application/pdf" onChange={handleInputChange} />
            <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => inputRef.current?.click()} disabled={props.loading === "documents-upload"} className={overviewButtonClass("primary")}>Carica altri documenti</button>
                <button type="button" onClick={() => props.setActiveTab?.("documents")} className={overviewButtonClass("secondary")}>Gestisci documenti</button>
                <button type="button" onClick={props.onLoadDocuments ?? props.onRefresh} disabled={props.loading === "documents" || props.loading === "workspace"} className={overviewButtonClass("secondary")}>Aggiorna documenti</button>
                <button type="button" onClick={props.onSyncTenderVespa} disabled={!props.onSyncTenderVespa || props.loading === "vespa-sync"} className={overviewButtonClass("secondary")}>Sincronizza RAG</button>
            </div>
        </div>
    );
}

/** Preview of high-impact criticalities with optional human-in-the-loop validation actions. */
function CriticalitiesOverviewPreview({ items, onValidate, onViewAll }: { items: any[]; onValidate?: (params: any) => void; onViewAll: () => void }) {
    const safeItems = Array.isArray(items) ? items : [];
    const visibleItems = safeItems.slice(0, OVERVIEW_PREVIEW_LIMIT);
    return (
        <div>
            {visibleItems.length ? (
                <div className="flex flex-col gap-2">
                    {visibleItems.map((item: any, index: number) => <CriticalityCard key={index} item={item} targetId={String(item?.id ?? item?.key ?? index)} onValidate={onValidate} />)}
                </div>
            ) : <EmptyState text="Le criticità saranno disponibili al completamento dell'analisi agentica." />}
            <OverviewLinkFooter shown={visibleItems.length} total={safeItems.length} label="Visualizza altre" onClick={onViewAll} />
        </div>
    );
}

/** Preview of AI-suggested actions. Full prioritization and governance live in the Dossier tab. */
function ActionsOverviewPreview({ items, onValidate, onViewAll }: { items: any[]; onValidate?: (params: any) => void; onViewAll: () => void }) {
    const safeItems = Array.isArray(items) ? items : [];
    const visibleItems = safeItems.slice(0, OVERVIEW_PREVIEW_LIMIT);
    return (
        <div>
            {visibleItems.length ? (
                <div className="flex flex-col gap-2">
                    {visibleItems.map((item: any, index: number) => <ActionCard key={index} item={item} targetId={String(item?.id ?? item?.key ?? index)} onValidate={onValidate} />)}
                </div>
            ) : <EmptyState text="Le azioni suggerite saranno disponibili nel dossier AI." />}
            <OverviewLinkFooter shown={visibleItems.length} total={safeItems.length} label="Visualizza altre" onClick={onViewAll} />
        </div>
    );
}

/**
 * Compact products status card.
 *
 * This must not duplicate the full product review board. It exposes only counts and navigation
 * because product matching/validation can be heavy and is handled in the lazy Products tab.
 */
function ProductsOverviewCard(props: any) {
    // Product counters can arrive from snapshot summaries, selected tender metadata or loaded rows.
    const extractedCount = compactCount(props.snapshot?.statusSummary?.extractedItemsCount ?? props.selectedTender?.extractedItemsCount ?? props.extractedItems?.length, 0);
    const validationSummary = props.snapshot?.statusSummary?.validationSummary ?? {};
    const validated = compactCount(validationSummary.validated, 0);
    const needsReview = compactCount(validationSummary.needsReview, 0);
    const corrected = compactCount(validationSummary.corrected, 0);
    const rejected = compactCount(validationSummary.rejected, 0);
    // Matching summary may come from either batch matching or full agentic pipeline output.
    const matchSummary = props.productBatchResult?.summary ?? props.productAgentsPipelineResult?.productCatalogMatchingSummary ?? {};
    const recommended = compactCount(matchSummary.recommendedProducts ?? matchSummary.aiMatched ?? props.readiness?.metrics?.productMatchWithRecommendation, 0);

    return (
        <div className="space-y-4">
            <p className="text-sm leading-6 text-slate-600 dark:text-neutral-300">
                Vista sintetica delle righe estratte e del governo prodotto. Il dettaglio operativo, editing riga, matching catalogo e validazione prodotto restano nella tab dedicata.
            </p>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <InfoMini label="Righe estratte" value={String(extractedCount)} />
                <InfoMini label="Validate" value={String(validated + corrected)} />
                <InfoMini label="Da review" value={String(needsReview)} />
                <InfoMini label="Match proposti" value={String(recommended)} />
            </div>
            {rejected > 0 && <p className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-neutral-950 dark:text-neutral-400">{rejected} riga/e risultano rigettate e non dovrebbero alimentare automaticamente la quotazione.</p>}
            <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => props.setActiveTab?.("products")} className={overviewButtonClass("primary")}>Apri prodotti estratti</button>
                <button type="button" onClick={props.onLoadProducts} disabled={!props.onLoadProducts || props.loading === "items"} className={overviewButtonClass("secondary")}>Aggiorna prodotti</button>
            </div>
        </div>
    );
}

/**
 * Compact agent pipeline progress card.
 * Raw payloads and detailed traces are intentionally kept in Osservabilità to avoid heavy rendering.
 */
function AgentRunOverviewCard({ latestAgentRun, onOpenObservability }: { latestAgentRun?: MepaAgentRunTrace | null; onOpenObservability: () => void }) {
    if (!latestAgentRun) return <EmptyState text="Trace agentico non ancora disponibile. L'esecuzione completa resta consultabile in Osservabilità appena disponibile." />;
    // Steps are normalized defensively because traces can evolve independently from the UI.
    const steps = Array.isArray(latestAgentRun.steps) ? latestAgentRun.steps : [];
    const completed = steps.filter((step: any) => ["COMPLETED", "DONE", "SUCCESS"].includes(String(step?.status ?? "").toUpperCase())).length;
    const failed = steps.filter((step: any) => ["FAILED", "ERROR"].includes(String(step?.status ?? "").toUpperCase())).length;
    const total = steps.length || compactCount((latestAgentRun as any)?.totalSteps, 0);
    const status = String(latestAgentRun.status ?? "N.D.").toUpperCase();
    // Tone communicates operational health without exposing raw trace complexity in the dashboard.
    const tone: OverviewTone = failed > 0 || status.includes("FAILED") ? "red" : status.includes("RUNNING") || status.includes("QUEUED") ? "blue" : status.includes("COMPLETED") ? "emerald" : "slate";

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-neutral-100">Pipeline AI</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">{completed}/{total || "—"} step completati{failed ? ` · ${failed} falliti` : ""}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${toneBadgeClass(tone)}`}>{status}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-neutral-800">
                <div className="h-full rounded-full bg-blue-600" style={{ width: total ? `${Math.max(0, Math.min(100, Math.round((completed / total) * 100)))}%` : "0%" }} />
            </div>
            <button type="button" onClick={onOpenObservability} className={overviewButtonClass("secondary")}>Apri osservabilità</button>
        </div>
    );
}


/**
 * Embedded AI assistant for quick contextual questions.
 *
 * Enterprise UX rule: the embedded chat must never control the dashboard height. It has a bounded,
 * internally scrollable body; long conversations belong in the dedicated Chat AI tab.
 */
function OverviewAiChatCard(props: any) {
    // Stable tender id used to reset deferred AI layout measurements when the workspace changes.
    const tenderId = String(props.selectedTender?._id ?? props.snapshot?.tender?._id ?? "mepa");
    // Ref used only for layout measurement nudges; not state because it must not trigger renders.
    const chatShellRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        // L'AI embedded contiene animazioni e canvas assoluti: al primo mount dentro il mosaico
        // può leggere misure non definitive. Forziamo due layout tick senza rimontare tutta la pagina.
        const timers = [0, 80, 240].map((delay) => window.setTimeout(() => {
            chatShellRef.current?.getBoundingClientRect();
            window.dispatchEvent(new Event("resize"));
        }, delay));
        return () => timers.forEach(window.clearTimeout);
    }, [tenderId]);

    // Quick prompts open the global AI dock with a prefilled question, preserving the Overview role.
    const askPrompt = (prompt: string) => {
        props.setChatQuestion?.(prompt);
        props.onOpenGlobalAi?.();
    };

    return (
        <Panel
            title="Assistente AI"
            icon={<FiMessageSquare className="text-blue-500" />}
            className="flex h-[640px] max-h-[calc(100vh-80px)] min-h-[460px] flex-col overflow-hidden sm:h-[680px] xl:h-[720px] 2xl:h-[calc(100vh-150px)]"
        >
            <div className="mb-4 shrink-0 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white p-4 dark:border-blue-900/40 dark:from-blue-950/30 dark:via-neutral-900 dark:to-neutral-900">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${providerBadgeClass(props.retrievalProvider ?? "VESPA")}`}>{providerLabel(props.retrievalProvider ?? "VESPA")}</span>
                        <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-200 dark:ring-blue-900/50">Beta</span>
                    </div>
                    <button type="button" onClick={() => props.setActiveTab?.("chat")} className="rounded-full border border-blue-100 bg-white px-3 py-1.5 text-[11px] font-bold text-blue-700 transition hover:bg-blue-50 dark:border-blue-900/50 dark:bg-neutral-950 dark:text-blue-200 dark:hover:bg-blue-950/20">
                        Apri tab Chat AI
                    </button>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-neutral-50">Chat contestuale sulla gara</p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-neutral-400">
                    Fai domande sui documenti caricati, sui requisiti, sulle criticità e sui prodotti estratti. L'assistente mantiene il contesto della pratica MEPA corrente.
                </p>
                <div className="mt-3 grid grid-cols-1 gap-2">
                    {OVERVIEW_AI_QUICK_PROMPTS.slice(0, 3).map((prompt) => (
                        <button
                            key={prompt}
                            type="button"
                            onClick={() => askPrompt(prompt)}
                            className="rounded-2xl border border-blue-100 bg-white px-3 py-2 text-left text-xs font-semibold leading-5 text-blue-700 transition hover:bg-blue-50 dark:border-blue-900/40 dark:bg-neutral-950 dark:text-blue-200 dark:hover:bg-blue-950/30"
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
            </div>

            <div
                ref={chatShellRef}
                className="min-h-0 flex-1 overflow-hidden rounded-[28px] bg-slate-50/40 dark:bg-neutral-950/20"
            >
                <DeferredEmbeddedAi tenderId={tenderId} />
            </div>
        </Panel>
    );
}

/**
 * Overview tab composition root.
 *
 * This component coordinates dashboard cards only. Heavy workflows are delegated to lazy tabs and
 * controller hooks. The grid uses items-start/self-start to prevent one tall card from stretching
 * the entire dashboard, especially when the AI assistant returns long answers.
 */
function OverviewTabBase(props: any) {
    // Local navigation helper: keeps preview cards declarative and avoids passing tab names around.
    const openDossier = () => props.setActiveTab?.("dossier");
    // Business summary merges dossier + latest run + generated report into a single user-facing text.
    const businessSummary = readTenderBusinessSummary(props.dossier, props.latestAgentRun, props.dossierReport);
    // Technical summary is optional diagnostic text; trimmed once before rendering.
    const technicalSummary = String(props.dossierSummary ?? "").trim();
    return (
        <div className="mb-10 grid grid-cols-1 items-start gap-5 xl:grid-cols-12 xl:[grid-auto-flow:dense]">
            <div className="min-w-0 xl:col-span-6 2xl:col-span-3 h-full">
                <Panel title="Documenti gara" icon={<FiFileText className="text-blue-500" />} className="h-full">
                    <DocumentsOverviewCard {...props} />
                </Panel>
            </div>

            <div className="min-w-0 self-start xl:col-span-12 2xl:col-span-5 2xl:row-span-1 h-full">
                <OverviewAiChatCard {...props} />
            </div>

            <div className="min-w-0 xl:col-span-6 2xl:col-span-4 h-full">
                <Panel title="Readiness operativa" icon={<FiCheckCircleIcon className="text-emerald-500" />} className="h-full">
                    <ReadinessCard readiness={props.readiness} />
                </Panel>
            </div>

            <div className="min-w-0 xl:col-span-6 2xl:col-span-6 h-full">
                <Panel title="Sintesi AI" className="h-full" icon={<HiOutlineSparkles className="text-blue-500 h-full" />}>
                    <div className="space-y-4">
                        <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-300">Sintesi gara</p>
                                <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-200 dark:ring-blue-900">Dossier AI</span>
                            </div>
                            {businessSummary ? (
                                <p className="whitespace-pre-line text-sm leading-6 text-slate-700 dark:text-neutral-200">{businessSummary}</p>
                            ) : (
                                <p className="text-sm leading-6 text-slate-500 dark:text-neutral-400">La sintesi funzionale della gara sarà disponibile appena il Dossier AI avrà prodotto una descrizione operativa del contenuto documentale.</p>
                            )}
                        </div>

                        {technicalSummary && (
                            <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4 dark:border-neutral-800 dark:bg-neutral-950/70">
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Stato pipeline AI</p>
                                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-neutral-400">{technicalSummary}</p>
                            </div>
                        )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" onClick={openDossier} className={overviewButtonClass("primary")}>Visualizza dossier completo</button>
                        <button type="button" onClick={() => props.setActiveTab?.("chat")} className={overviewButtonClass("secondary")}>Fai una domanda all'AI</button>
                    </div>
                </Panel>
            </div>

            <div className="min-w-0 xl:col-span-6 2xl:col-span-6 space-y-4">
                <Panel title="Orchestratore AI" icon={<FiCpu className="text-purple-500" />}>
                    <AgentRunOverviewCard latestAgentRun={props.latestAgentRun} onOpenObservability={() => props.setActiveTab?.("observability")} />
                </Panel>

                <Panel title="Validazione human-in-the-loop" icon={<FiCheckCircleIcon className="text-emerald-500" />}>
                    <ValidationSummary summary={props.snapshot?.statusSummary?.validationSummary} />
                </Panel>

                <Panel title="Prodotti/servizi rilevati" icon={<FiTarget className="text-blue-500" />}>
                    <ProductsOverviewCard {...props} />
                </Panel>
            </div>

            <div className="min-w-0 xl:col-span-6 2xl:col-span-6">
                <Panel title="Criticità principali" icon={<FiAlertTriangleIcon className="text-amber-500" />} className="h-full">
                    <CriticalitiesOverviewPreview items={props.criticalities} onValidate={props.onValidate} onViewAll={openDossier} />
                </Panel>
            </div>

            <div className="min-w-0 xl:col-span-6 2xl:col-span-6">
                <Panel title="Azioni suggerite" icon={<FiCheckCircleIcon className="text-emerald-500" />} className="h-full">
                    <ActionsOverviewPreview items={props.actions} onValidate={props.onValidate} onViewAll={openDossier} />
                </Panel>
            </div>
        </div>
    );
} 


/**
 * Overview tab for the MEPA workspace.
 *
 * Kept isolated from the main page container because it mounts multiple rich cards,
 * the embedded AI dock and derived counters. This allows future lazy loading and
 * keeps the workspace orchestrator focused on state ownership instead of rendering.
 */
export const OverviewTab = React.memo(OverviewTabBase);
export default OverviewTab;
