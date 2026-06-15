import React, { useMemo, useState } from "react";
import { FiRefreshCw, FiTarget } from "react-icons/fi";
import { Panel } from "../../components/shared/Panel";
import { InfoMini } from "../../components/shared/InfoMini";
import { EmptyState } from "../../components/shared/EmptyState";
import type { MepaProductRagControlPlane } from "../../types";

/** Formats unknown date-like values for diagnostic cards without throwing. */
const formatMaybeDate = (value: unknown) => {
    if (!value) return "—";
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("it-IT");
};

/**
 * Reads the first populated field from heterogeneous agent-run payloads.
 *
 * Agent traces can evolve across service-ai versions; this helper keeps the UI
 * backward compatible while avoiding optional-chain noise in the summary builder.
 */
const pickFirst = (source: any, keys: string[]) => {
    for (const key of keys) {
        const value = source?.[key];
        if (value !== undefined && value !== null && value !== "") return value;
    }
    return null;
};

/** Converts warning/error entries to a safe compact string for the UI. */
const stringifyDiagnosticEntry = (entry: unknown) => {
    if (typeof entry === "string") return entry;
    if (entry && typeof entry === "object" && "message" in entry) {
        return String((entry as { message?: unknown }).message ?? "Errore non dettagliato");
    }
    try {
        return JSON.stringify(entry);
    } catch {
        return "Errore non serializzabile.";
    }
};

/**
 * Builds a compact read model for the Agent Run panel.
 *
 * The raw run object can be large and nested. Rendering a compact summary first
 * prevents expensive JSON serialization during normal dashboard usage while
 * preserving the option to inspect the raw payload on demand.
 */
const buildAgentRunSummary = (agentRun: any) => {
    if (!agentRun) return null;

    const counters = agentRun.counters ?? agentRun.metrics ?? agentRun.stats ?? {};
    const errors = Array.isArray(agentRun.errors) ? agentRun.errors : Array.isArray(agentRun.warnings) ? agentRun.warnings : [];

    return {
        id: pickFirst(agentRun, ["_id", "id", "runId", "jobId"]),
        status: pickFirst(agentRun, ["status", "state", "phase"]),
        agent: pickFirst(agentRun, ["agent", "agentName", "type", "name"]),
        model: pickFirst(agentRun, ["model", "modelName"]),
        createdAt: formatMaybeDate(pickFirst(agentRun, ["createdAt", "startedAt", "created_at"])),
        updatedAt: formatMaybeDate(pickFirst(agentRun, ["updatedAt", "completedAt", "finishedAt", "updated_at"])),
        counters: {
            documents: counters.documents ?? counters.documentCount ?? agentRun.documentCount ?? "—",
            chunks: counters.chunks ?? counters.chunkCount ?? agentRun.chunkCount ?? "—",
            extractedItems: counters.extractedItems ?? counters.items ?? agentRun.extractedItemsCount ?? "—",
            errors: errors.length || counters.errors || counters.failed || 0,
        },
        sampleErrors: errors.slice(0, 3).map(stringifyDiagnosticEntry),
    };
};

/**
 * Operational observability tab for MEPA AI/RAG infrastructure.
 *
 * The tab is isolated from the main workspace file because it renders diagnostic payloads,
 * product indexing jobs and JSON traces that are not needed by the default user journey.
 * This keeps the core workspace lighter and prepares this area for future lazy-loading.
 */
export const ObservabilityTab = React.memo(function ObservabilityTab(props: any) {
    // Product RAG control plane is an operational read model produced by service-ai.
    // It can be null during refresh, so every downstream field must be optional.
    const productControl: MepaProductRagControlPlane | null = props.productRagControlPlane ?? null;
    const coverage = productControl?.coverage;
    const latestJobs = productControl?.overview?.latestJobs ?? [];
    const recommendedActions = productControl?.recommendedActions ?? [];
    // Local UI-only disclosure state. Keeping raw payload hidden by default avoids
    // serializing/rendering large agent traces on every tab render.
    const [showRawAgentRun, setShowRawAgentRun] = useState(false);
    // Derived compact summary recalculated only when the latest run reference changes.
    const agentRunSummary = useMemo(() => buildAgentRunSummary(props.latestAgentRun), [props.latestAgentRun]);
    // Raw JSON preview is computed only after the user explicitly opens it. This is
    // important for performance because agent runs can include chunks, prompts,
    // tool payloads and diagnostics.
    const rawAgentRunPreview = useMemo(() => {
        if (!showRawAgentRun) return "";
        try {
            return JSON.stringify(props.latestAgentRun ?? {}, null, 2);
        } catch {
            return "Payload non serializzabile.";
        }
    }, [props.latestAgentRun, showRawAgentRun]);

    return (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <Panel title="RAG / Vespa documentale" icon={<FiRefreshCw className="text-emerald-500" />}>
                <div className="mb-4 flex justify-end">
                    <button onClick={props.onLoadObservability} disabled={props.loading === "observability"} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300">Aggiorna diagnostica</button>
                </div>
                <p className="text-sm text-slate-600 dark:text-neutral-300">{props.vespaStatus}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-neutral-300">{props.embeddingStatus}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs md:grid-cols-3">
                    <InfoMini label="Documenti" value={String(props.ragStats?.mongoDocuments ?? "—")} />
                    <InfoMini label="Chunk Mongo" value={String(props.ragStats?.mongoChunks ?? "—")} />
                    <InfoMini label="Chunk Vespa" value={String(props.ragStats?.vespaTotalCount ?? "—")} />
                    <InfoMini label="Sync OK" value={String(props.ragStats?.vespaSyncedChunks ?? "—")} />
                    <InfoMini label="Sync KO" value={String(props.ragStats?.vespaFailedChunks ?? "—")} />
                    <InfoMini label="Vector" value={props.ragStats?.embeddings?.vectorSearchEnabled ? "ON" : "OFF"} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={props.onSyncTenderVespa} disabled={props.loading === "vespa-sync"} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300">Sync diretto chunk gara</button>
                </div>
                {props.ragStats?.vespaFailedChunks ? (
                    <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
                        Alcuni chunk risultano non sincronizzati con Vespa. Usa il sync diretto dopo aver verificato endpoint, schema e dimensione embedding.
                    </div>
                ) : null}
            </Panel>

            <Panel title="RAG catalogo prodotti" icon={<FiTarget className="text-blue-500" />}>
                <div className="rounded-2xl bg-blue-50 p-3 text-xs text-blue-800 dark:bg-blue-950/20 dark:text-blue-200">
                    <p className="font-semibold">Control plane Vespa products-first</p>
                    <p className="mt-1 leading-5">Il service-ai governa feed, policy e job verso Vespa. Le routine import verranno collegate nello step successivo tramite eventi/sync, senza duplicare logiche Vespa nei servizi routine.</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
                    <InfoMini label="Products Mongo" value={String(coverage?.mongoProducts ?? "—")} />
                    <InfoMini label="Products Vespa" value={String(coverage?.vespaProducts ?? "—")} />
                    <InfoMini label="Icecat Mongo" value={String(coverage?.mongoIcecats ?? "—")} />
                    <InfoMini label="Icecat Vespa" value={String(coverage?.vespaIcecats ?? "—")} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => props.onBootstrapProductRag?.("PRODUCTS_FIRST")} disabled={props.loading === "product-rag-bootstrap"} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Bootstrap products</button>
                    <button onClick={() => props.onBootstrapProductRag?.("FOCELDA_ONLY")} disabled={props.loading === "product-rag-bootstrap"} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300">Solo Focelda</button>
                    <button onClick={props.onRunNextProductIndexJobs} disabled={props.loading === "product-rag-run-next"} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300">Run next job</button>
                </div>
                {recommendedActions.length > 0 && <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/20 dark:text-amber-200">{recommendedActions.slice(0, 4).map((action: string, index: number) => <p key={index}>• {action}</p>)}</div>}
                <div className="mt-4 max-h-[220px] overflow-auto rounded-2xl border border-slate-100 dark:border-neutral-800">
                    {latestJobs.length ? latestJobs.map((job: any) => (
                        <div key={job._id} className="border-b border-slate-100 p-3 text-xs last:border-b-0 dark:border-neutral-800">
                            <div className="flex items-center justify-between gap-2"><p className="font-semibold">{job.source} · {job.status}</p><span>{Math.round(Number(job.progress ?? 0))}%</span></div>
                            <p className="mt-1 text-slate-500">fed {job.counters?.fed ?? 0} · failed {job.counters?.failed ?? 0} · batch {job.input?.batchSize ?? "—"}</p>
                        </div>
                    )) : <EmptyState text="Nessun job di indicizzazione prodotti ancora creato." />}
                </div>
            </Panel>

            <Panel title="Agent run" icon={<FiTarget className="text-purple-500" />}>
                {agentRunSummary ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 xl:grid-cols-4">
                            <InfoMini label="Stato" value={String(agentRunSummary.status ?? "—")} />
                            <InfoMini label="Agente" value={String(agentRunSummary.agent ?? "—")} />
                            <InfoMini label="Modello" value={String(agentRunSummary.model ?? "—")} />
                            <InfoMini label="Errori" value={String(agentRunSummary.counters.errors ?? 0)} />
                        </div>
                        <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 xl:grid-cols-4">
                            <InfoMini label="Documenti" value={String(agentRunSummary.counters.documents)} />
                            <InfoMini label="Chunk" value={String(agentRunSummary.counters.chunks)} />
                            <InfoMini label="Items" value={String(agentRunSummary.counters.extractedItems)} />
                            <InfoMini label="Aggiornato" value={agentRunSummary.updatedAt} />
                        </div>
                        {agentRunSummary.sampleErrors.length ? (
                            <div className="rounded-2xl bg-red-50 p-3 text-xs text-red-800 dark:bg-red-950/20 dark:text-red-100">
                                {agentRunSummary.sampleErrors.map((error: string, index: number) => (
                                    <p key={`${index}-${error.slice(0, 24)}`} className="break-words">• {error}</p>
                                ))}
                            </div>
                        ) : null}
                        <button
                            type="button"
                            onClick={() => setShowRawAgentRun((value) => !value)}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 dark:border-neutral-700 dark:text-neutral-300"
                        >
                            {showRawAgentRun ? "Nascondi payload raw" : "Mostra payload raw"}
                        </button>
                        {showRawAgentRun ? (
                            <pre className="max-h-[360px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{rawAgentRunPreview}</pre>
                        ) : null}
                    </div>
                ) : (
                    <EmptyState text="Nessun agent run disponibile per questa gara." />
                )}
            </Panel>
        </div>
    );
});
