import { MutableRefObject } from "react";
import { getAuthToken } from "utils/auth/authToken";
import {
    MepaChatMessage, MepaEvidenceDetail, MepaProductIndexBootstrapMode, MepaProductIndexBootstrapResult, MepaProductIndexOverview, MepaProductIndexRunNextResult, MepaProductIndexRunResult, MepaProductRagControlPlane, MepaProductSearchResponseData, MepaProductMatchingBatchResult, MepaProductAgentsPipelineResult, MepaProductSearchStats, MepaRagResponseData, MepaRagStats,
    MepaDossierOperationalReport, MepaDossierQualityReport, MepaTenderChatResponseData, MepaTenderReadiness, MepaTenderDocument, MepaTenderDocumentsSummary
} from "../types";

const AI_BASE = import.meta.env.VITE_API_AI;

/**
 * Low-level HTTP adapter for the MEPA AI service.
 *
 * Responsibilities are intentionally limited to transport concerns:
 * attaching the auth token, serializing JSON bodies, wiring AbortController
 * and surfacing a normalized error payload. Domain-specific mapping must stay
 * inside feature hooks/selectors, not in this transport layer.
 */
async function fetchAI<T>(
    url: string,
    method: string,
    body: unknown,
    abortController: MutableRefObject<AbortController | null>
): Promise<T> {
    if (!abortController.current) abortController.current = new AbortController();

    const headers: Record<string, string> = { Accept: "application/json" };
    if (body != null) headers["Content-Type"] = "application/json";

    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, {
        method,
        headers,
        body: body == null ? undefined : JSON.stringify(body),
        signal: abortController.current.signal,
    });

    if (!res.ok) {
        let payload: unknown = null;
        try { payload = await res.json(); } catch { payload = await res.text(); }
        throw { status: res.status, payload };
    }

    return (await res.json()) as T;
}

/**
 * Creates or schedules the full MEPA analysis job for a tender workspace.
 *
 * The caller controls rebuild/immediate execution, while the backend owns the
 * orchestration. The generated idempotency key protects the service from quick
 * repeated clicks while still allowing explicit new runs when requested.
 */
export async function startMepaAnalysis(params: {
    abortController: MutableRefObject<AbortController | null>;
    tenderId: string;
    documentIds?: string[];
    forceRebuild?: boolean;
    runImmediately?: boolean;
}) {
    return fetchAI<any>(
        `${AI_BASE}v1/mepa/tenders/${encodeURIComponent(params.tenderId)}/analysis-jobs`,
        "POST",
        {
            documentIds: params.documentIds ?? [],
            forceRebuild: params.forceRebuild ?? false,
            runImmediately: params.runImmediately ?? false,
            idempotencyKey: `analysis-${params.tenderId}-${Date.now()}`,
        },
        params.abortController
    );
}

/**
 * Runs an on-demand catalog search for a single product description.
 *
 * Used by manual review flows, not by the full batch pipeline. Keeping it as a
 * dedicated endpoint wrapper prevents UI code from rebuilding product-search
 * URLs and default options in multiple places.
 */
export async function matchMepaProducts(params: {
    abortController: MutableRefObject<AbortController | null>;
    tenderId: string;
    description: string;
    includeIcecat?: boolean;
    limit?: number;
}): Promise<{ success: boolean; data: MepaProductSearchResponseData }> {
    return fetchAI<{ success: boolean; data: MepaProductSearchResponseData }>(
        `${AI_BASE}v1/mepa/tenders/${encodeURIComponent(params.tenderId)}/product-matches`,
        "POST",
        {
            description: params.description,
            includeIcecat: params.includeIcecat ?? true,
            limit: params.limit ?? 8,
        },
        params.abortController
    );
}


/**
 * Starts the agentic product extraction + catalog matching pipeline.
 *
 * This is the heavy product workflow. Defaults are intentionally conservative
 * enough for large tenders but still caller-overridable for diagnostics.
 */
export async function runMepaProductAgentsPipeline(params: {
    abortController: MutableRefObject<AbortController | null>;
    tenderId: string;
    forceRebuild?: boolean;
    includeIcecat?: boolean;
    limitPerItem?: number;
    maxItems?: number;
}): Promise<{ success: boolean; data: MepaProductAgentsPipelineResult }> {
    return fetchAI<{ success: boolean; data: MepaProductAgentsPipelineResult }>(
        `${AI_BASE}v1/mepa/tenders/${encodeURIComponent(params.tenderId)}/agents/product-pipeline/run`,
        "POST",
        {
            forceRebuild: params.forceRebuild ?? true,
            includeIcecat: params.includeIcecat ?? true,
            limitPerItem: params.limitPerItem ?? 12,
            maxItems: params.maxItems ?? 160,
        },
        params.abortController
    );
}


/**
 * Executes Vespa/catalog matching for many extracted items in one backend job.
 *
 * The UI sends validation status filters instead of raw item arrays so the
 * backend remains the source of truth for which rows are eligible.
 */
export async function runMepaProductMatchingBatch(params: {
    abortController: MutableRefObject<AbortController | null>;
    tenderId: string;
    validationStatuses?: Array<"VALIDATED" | "CORRECTED" | "PENDING_REVIEW">;
    includeIcecat?: boolean;
    limitPerItem?: number;
    maxItems?: number;
    onlyWithEvidence?: boolean;
    minFinalScore?: number;
}): Promise<{ success: boolean; data: MepaProductMatchingBatchResult }> {
    return fetchAI<{ success: boolean; data: MepaProductMatchingBatchResult }>(
        `${AI_BASE}v1/mepa/tenders/${encodeURIComponent(params.tenderId)}/product-matches/run-batch`,
        "POST",
        {
            validationStatuses: params.validationStatuses ?? ["VALIDATED", "CORRECTED", "PENDING_REVIEW"],
            includeIcecat: params.includeIcecat ?? true,
            limitPerItem: params.limitPerItem ?? 8,
            maxItems: params.maxItems ?? 100,
            onlyWithEvidence: params.onlyWithEvidence ?? true,
            minFinalScore: params.minFinalScore ?? 0.5,
        },
        params.abortController
    );
}

/**
 * Sends a user question to the tender chat endpoint.
 *
 * The request defaults to FULL_CONTEXT with dossier and validated data enabled,
 * because the MEPA chat is intended to answer from governed workspace evidence,
 * not from a generic LLM conversation.
 */
export async function askMepaAi(params: {
    abortController: MutableRefObject<AbortController | null>;
    tenderId: string;
    question: string;
    threadId?: string;
    includeDossier?: boolean;
    includeValidatedData?: boolean;
}) {
    return fetchAI<{ success: boolean; data: MepaTenderChatResponseData }>(
        `${AI_BASE}v1/mepa/tenders/${encodeURIComponent(params.tenderId)}/chat/messages`,
        "POST",
        {
            question: params.question,
            threadId: params.threadId,
            mode: "FULL_CONTEXT",
            includeDossier: params.includeDossier ?? true,
            includeValidatedData: params.includeValidatedData ?? true,
        },
        params.abortController
    );
}

/**
 * Loads persisted chat memory for the current tender/thread.
 *
 * The controller uses this to rehydrate the chat tab and avoid losing context
 * when the user switches between workspace tabs.
 */
export async function getMepaChatMessages(params: {
    abortController: MutableRefObject<AbortController | null>;
    tenderId: string;
    threadId?: string;
    limit?: number;
}) {
    const qs = new URLSearchParams();
    if (params.threadId) qs.set("threadId", params.threadId);
    qs.set("limit", String(params.limit ?? 50));
    return fetchAI<{ success: boolean; data: { threadId: string; thread?: any; memory?: any; messages: MepaChatMessage[] } }>(
        `${AI_BASE}v1/mepa/tenders/${encodeURIComponent(params.tenderId)}/chat/messages?${qs.toString()}`,
        "GET",
        null,
        params.abortController
    );
}


export type MepaTenderUploadDocumentPayload = {
    documentId?: string;
    documentTitle?: string;
    documentType?: string;
    fileName?: string;
    mimeType?: string;
    rawFileBase64?: string;
    text?: string;
};

/**
 * Uploads raw or text-only tender documents to service-ai.
 *
 * Current contract supports Base64 payloads. Browser controllers therefore
 * sequence conversions to reduce memory spikes before calling this transport.
 */
export async function uploadMepaTenderDocuments(params: {
    abortController: MutableRefObject<AbortController | null>;
    tenderId: string;
    documents: MepaTenderUploadDocumentPayload[];
    forceRebuild?: boolean;
}) {
    return fetchAI<any>(
        `${AI_BASE}v1/mepa/tenders/${encodeURIComponent(params.tenderId)}/documents/upload`,
        "POST",
        { documents: params.documents, forceRebuild: params.forceRebuild ?? true },
        params.abortController
    );
}


/**
 * Reads the document list and summary for a tender workspace.
 *
 * The summary powers dashboard counters while the document list powers both the
 * document tab and overview preview.
 */
export async function getMepaTenderDocuments(params: {
    abortController: MutableRefObject<AbortController | null>;
    tenderId: string;
}): Promise<{ success: boolean; data: { documents: MepaTenderDocument[]; summary: MepaTenderDocumentsSummary } }> {
    return fetchAI<{ success: boolean; data: { documents: MepaTenderDocument[]; summary: MepaTenderDocumentsSummary } }>(
        `${AI_BASE}v1/mepa/tenders/${encodeURIComponent(params.tenderId)}/documents`,
        "GET",
        null,
        params.abortController
    );
}

/**
 * Removes one uploaded tender document from the workspace.
 *
 * The reason is always explicit so audit logs can explain whether a deletion was
 * user-driven, cleanup-driven or part of a future governance flow.
 */
export async function deleteMepaTenderDocument(params: {
    abortController: MutableRefObject<AbortController | null>;
    tenderId: string;
    documentId: string;
    reason?: string;
}): Promise<{ success: boolean; data: { documents: MepaTenderDocument[]; summary: MepaTenderDocumentsSummary } }> {
    return fetchAI<{ success: boolean; data: { documents: MepaTenderDocument[]; summary: MepaTenderDocumentsSummary } }>(
        `${AI_BASE}v1/mepa/tenders/${encodeURIComponent(params.tenderId)}/documents/${encodeURIComponent(params.documentId)}`,
        "DELETE",
        { reason: params.reason ?? "Documento rimosso dal workspace MEPA" },
        params.abortController
    );
}

/**
 * Runs the AI form-prefill agent against the indexed tender context.
 *
 * Documents can be passed for legacy compatibility, but the optimized flow
 * uploads/indexes documents first and invokes this agent with an empty payload.
 */
export async function runMepaTenderFormPrefillAgent(params: {
    abortController: MutableRefObject<AbortController | null>;
    tenderId: string;
    documents?: MepaTenderUploadDocumentPayload[];
    forceRebuild?: boolean;
}) {
    return fetchAI<any>(
        `${AI_BASE}v1/mepa/tenders/${encodeURIComponent(params.tenderId)}/agents/form-prefill/run`,
        "POST",
        { documents: params.documents ?? [], forceRebuild: params.forceRebuild ?? true },
        params.abortController
    );
}

/**
 * Indexes plain text for a tender document.
 *
 * Useful for fallback/manual ingestion paths where text is already available and
 * the client does not need to send the original binary payload.
 */
export async function indexMepaDocumentText(params: {
    abortController: MutableRefObject<AbortController | null>;
    tenderId: string;
    documentId: string;
    documentTitle?: string;
    documentType?: string;
    text: string;
    forceRebuild?: boolean;
    runImmediately?: boolean;
}) {
    return fetchAI<any>(
        `${AI_BASE}v1/mepa/tenders/${encodeURIComponent(params.tenderId)}/documents/index`,
        "POST",
        {
            documentId: params.documentId,
            documentTitle: params.documentTitle,
            documentType: params.documentType,
            text: params.text,
            forceRebuild: params.forceRebuild ?? false,
        },
        params.abortController
    );
}

/**
 * Executes a direct RAG search inside the tender document corpus.
 *
 * This powers diagnostics and evidence-oriented features. User-facing chat goes
 * through askMepaAi so reasoning and answer formatting remain server-governed.
 */
export async function searchMepaRag(params: {
    abortController: MutableRefObject<AbortController | null>;
    tenderId: string;
    q: string;
    limit?: number;
}) {
    return fetchAI<{ success: boolean; data: MepaRagResponseData; meta?: Record<string, unknown> }>(
        `${AI_BASE}v1/mepa/tenders/${encodeURIComponent(params.tenderId)}/rag/search?q=${encodeURIComponent(params.q)}&limit=${params.limit ?? 8}`,
        "GET",
        null,
        params.abortController
    );
}


/**
 * Fetches one evidence chunk by id for the explainability modal.
 */
export async function getMepaEvidence(params: {
    abortController: MutableRefObject<AbortController | null>;
    tenderId: string;
    chunkId: string;
}) {
    return fetchAI<{ success: boolean; data: MepaEvidenceDetail }>(
        `${AI_BASE}v1/mepa/tenders/${encodeURIComponent(params.tenderId)}/evidence/${encodeURIComponent(params.chunkId)}`,
        "GET",
        null,
        params.abortController
    );
}

/**
 * Reads RAG corpus statistics for the tender workspace.
 */
export async function getMepaRagStats(params: {
    abortController: MutableRefObject<AbortController | null>;
    tenderId: string;
}) {
    return fetchAI<{ success: boolean; data: MepaRagStats }>(
        `${AI_BASE}v1/mepa/tenders/${encodeURIComponent(params.tenderId)}/rag/stats`,
        "GET",
        null,
        params.abortController
    );
}


/**
 * Loads backend readiness checks for the selected tender.
 */
export async function getMepaTenderReadiness(params: {
    abortController: MutableRefObject<AbortController | null>;
    tenderId: string;
}) {
    return fetchAI<{ success: boolean; data: MepaTenderReadiness }>(
        `${AI_BASE}v1/mepa/tenders/${encodeURIComponent(params.tenderId)}/readiness`,
        "GET",
        null,
        params.abortController
    );
}

/**
 * Loads the raw/structured AI dossier for the tender.
 */
export async function getMepaDossier(params: {
    abortController: MutableRefObject<AbortController | null>;
    tenderId: string;
}) {
    return fetchAI<any>(
        `${AI_BASE}v1/mepa/tenders/${encodeURIComponent(params.tenderId)}/dossier`,
        "GET",
        null,
        params.abortController
    );
}


/**
 * Loads the operational dossier report used by the Dossier tab and Overview.
 */
export async function getMepaDossierReport(params: {
    abortController: MutableRefObject<AbortController | null>;
    tenderId: string;
}) {
    return fetchAI<{ success: boolean; data: MepaDossierOperationalReport }>(
        `${AI_BASE}v1/mepa/tenders/${encodeURIComponent(params.tenderId)}/dossier/report`,
        "GET",
        null,
        params.abortController
    );
}

/**
 * Loads dossier quality metrics and validation coverage.
 */
export async function getMepaDossierQuality(params: {
    abortController: MutableRefObject<AbortController | null>;
    tenderId: string;
}) {
    return fetchAI<{ success: boolean; data: MepaDossierQualityReport }>(
        `${AI_BASE}v1/mepa/tenders/${encodeURIComponent(params.tenderId)}/dossier/quality`,
        "GET",
        null,
        params.abortController
    );
}

/**
 * Reads extracted tender product rows from the backend read model.
 */
export async function getMepaExtractedItems(params: {
    abortController: MutableRefObject<AbortController | null>;
    tenderId: string;
}) {
    return fetchAI<any>(
        `${AI_BASE}v1/mepa/tenders/${encodeURIComponent(params.tenderId)}/items`,
        "GET",
        null,
        params.abortController
    );
}

/**
 * Persists a human validation decision for an AI-generated output.
 *
 * The wrapper stays generic because the same governance endpoint validates
 * products, criticalities, actions and future AI sections via target metadata.
 */
export async function validateMepaAiOutput(params: {
    abortController: MutableRefObject<AbortController | null>;
    tenderId: string;
    targetType: "TENDER_FIELD" | "DOSSIER" | "DOSSIER_SECTION" | "CRITICALITY" | "SUGGESTED_ACTION" | "EXTRACTED_ITEM" | "PRODUCT_MATCH";
    targetId: string;
    sectionKey?: string | null;
    fieldKey?: string | null;
    decision: "VALIDATED" | "CORRECTED" | "REJECTED" | "NEEDS_REVIEW";
    correctedValue?: unknown;
    note?: string | null;
}) {
    return fetchAI<any>(
        `${AI_BASE}v1/mepa/tenders/${encodeURIComponent(params.tenderId)}/validations`,
        "POST",
        {
            targetType: params.targetType,
            targetId: params.targetId,
            sectionKey: params.sectionKey ?? null,
            fieldKey: params.fieldKey ?? null,
            decision: params.decision,
            correctedValue: params.correctedValue,
            note: params.note ?? null,
        },
        params.abortController
    );
}

/**
 * Persists buyer validation for a product match/proposal.
 */
export async function updateMepaProductMatchValidation(params: {
    abortController: MutableRefObject<AbortController | null>;
    tenderId: string;
    itemId: string;
    action: "VALIDATE_BEST_MATCH" | "VALIDATE_SUBSTITUTE" | "REJECT" | "NEEDS_REVIEW" | "MANUAL_OVERRIDE";
    selectedCandidateRef?: string | null;
    manualProduct?: Record<string, unknown> | null;
    reason?: string | null;
}) {
    return fetchAI<any>(
        `${AI_BASE}v1/mepa/tenders/${encodeURIComponent(params.tenderId)}/items/${encodeURIComponent(params.itemId)}/product-match`,
        "PATCH",
        {
            action: params.action,
            selectedCandidateRef: params.selectedCandidateRef ?? null,
            manualProduct: params.manualProduct ?? null,
            reason: params.reason ?? null,
        },
        params.abortController
    );
}

/**
 * Reads Vespa health from service-ai observability endpoints.
 */
export async function getMepaVespaHealth(params: {
    abortController: MutableRefObject<AbortController | null>;
}) {
    return fetchAI<any>(`${AI_BASE}v1/mepa/vespa/health`, "GET", null, params.abortController);
}


/**
 * Reads embedding service health from service-ai observability endpoints.
 */
export async function getMepaEmbeddingHealth(params: {
    abortController: MutableRefObject<AbortController | null>;
}) {
    return fetchAI<any>(`${AI_BASE}v1/mepa/embeddings/health`, "GET", null, params.abortController);
}

/**
 * Triggers synchronization of tender document chunks into Vespa.
 */
export async function syncMepaTenderChunksToVespa(params: {
    abortController: MutableRefObject<AbortController | null>;
    tenderId: string;
    limit?: number;
}) {
    return fetchAI<any>(
        `${AI_BASE}v1/mepa/tenders/${encodeURIComponent(params.tenderId)}/rag/sync-vespa`,
        "POST",
        { limit: params.limit ?? 500 },
        params.abortController
    );
}

/**
 * Triggers product catalog synchronization into Vespa for product RAG.
 */
export async function syncMepaProductsToVespa(params: {
    abortController: MutableRefObject<AbortController | null>;
    limit?: number;
    includeIcecat?: boolean;
}) {
    return fetchAI<any>(
        `${AI_BASE}v1/mepa/products/sync-vespa`,
        "POST",
        { limit: params.limit ?? 1000, includeIcecat: params.includeIcecat ?? false },
        params.abortController
    );
}



/**
 * Reads product RAG indexing control-plane status and queue information.
 */
export async function getMepaProductRagControlPlane(params: {
    abortController: MutableRefObject<AbortController | null>;
    limit?: number;
}) {
    return fetchAI<{ success: boolean; data: MepaProductRagControlPlane }>(
        `${AI_BASE}v1/mepa/products/index-control-plane?limit=${params.limit ?? 8}`,
        "GET",
        null,
        params.abortController
    );
}

/**
 * Creates product RAG index jobs according to the requested bootstrap mode.
 */
export async function bootstrapMepaProductRagIndex(params: {
    abortController: MutableRefObject<AbortController | null>;
    mode?: MepaProductIndexBootstrapMode;
    runImmediately?: boolean;
    maxBatchesPerJob?: number;
    batchSize?: number;
    productsMaxItems?: number;
    icecatMaxItems?: number;
    includeEmbeddings?: boolean;
    icecatFilters?: {
        categories?: string[];
        brands?: string[];
        textQuery?: string | null;
        allowUnfilteredIcecat?: boolean;
    };
}) {
    return fetchAI<{ success: boolean; data: MepaProductIndexBootstrapResult }>(
        `${AI_BASE}v1/mepa/products/index-jobs/bootstrap`,
        "POST",
        {
            mode: params.mode ?? "PRODUCTS_FIRST",
            runImmediately: params.runImmediately ?? false,
            maxBatchesPerJob: params.maxBatchesPerJob ?? 1,
            batchSize: params.batchSize,
            productsMaxItems: params.productsMaxItems,
            icecatMaxItems: params.icecatMaxItems,
            includeEmbeddings: params.includeEmbeddings,
            icecatFilters: params.icecatFilters,
        },
        params.abortController
    );
}

/**
 * Executes the next pending product index jobs from the control plane.
 */
export async function runNextMepaProductIndexJobs(params: {
    abortController: MutableRefObject<AbortController | null>;
    maxJobs?: number;
    maxBatchesPerJob?: number;
}) {
    return fetchAI<{ success: boolean; data: MepaProductIndexRunNextResult }>(
        `${AI_BASE}v1/mepa/products/index-jobs/run-next`,
        "POST",
        { maxJobs: params.maxJobs ?? 1, maxBatchesPerJob: params.maxBatchesPerJob ?? 1 },
        params.abortController
    );
}

/**
 * Reads product search/indexing statistics used by observability panels.
 */
export async function getMepaProductSearchStats(params: {
    abortController: MutableRefObject<AbortController | null>;
}) {
    return fetchAI<{ success: boolean; data: MepaProductSearchStats }>(`${AI_BASE}v1/mepa/products/search/stats`, "GET", null, params.abortController);
}


/**
 * Reads product indexing overview counters and freshness metadata.
 */
export async function getMepaProductIndexOverview(params: {
    abortController: MutableRefObject<AbortController | null>;
    limit?: number;
}) {
    return fetchAI<{ success: boolean; data: MepaProductIndexOverview }>(
        `${AI_BASE}v1/mepa/products/index-jobs?limit=${params.limit ?? 5}`,
        "GET",
        null,
        params.abortController
    );
}

/**
 * Creates a targeted product index job for diagnostics or manual reindexing.
 */
export async function createMepaProductIndexJob(params: {
    abortController: MutableRefObject<AbortController | null>;
    source?: "products" | "icecats" | "both";
    batchSize?: number;
    maxItems?: number;
    includeEmbeddings?: boolean;
    filters?: {
        categories?: string[];
        brands?: string[];
        textQuery?: string | null;
        sourcePriorities?: Array<"FOCELDA_CODED" | "SUPPLIER_UNCODED" | "ICECAT" | "UNKNOWN">;
        allowUnfilteredIcecat?: boolean;
    };
    runImmediately?: boolean;
    maxBatches?: number;
}) {
    return fetchAI<{ success: boolean; data: { job: unknown; runResult: MepaProductIndexRunResult | null } }>(
        `${AI_BASE}v1/mepa/products/index-jobs`,
        "POST",
        {
            source: params.source ?? "products",
            batchSize: params.batchSize ?? 100,
            maxItems: params.maxItems ?? 1000,
            includeEmbeddings: params.includeEmbeddings,
            filters: params.filters,
            runImmediately: params.runImmediately ?? true,
            maxBatches: params.maxBatches ?? 1,
            idempotencyKey: `product-index-${Date.now()}`,
        },
        params.abortController
    );
}

/**
 * Runs one specific product index job immediately.
 */
export async function runMepaProductIndexJobOnce(params: {
    abortController: MutableRefObject<AbortController | null>;
    jobId: string;
    maxBatches?: number;
}) {
    return fetchAI<{ success: boolean; data: MepaProductIndexRunResult }>(
        `${AI_BASE}v1/mepa/products/index-jobs/${encodeURIComponent(params.jobId)}/run-once`,
        "POST",
        { maxBatches: params.maxBatches ?? 1 },
        params.abortController
    );
}

/**
 * Reads the latest MEPA agent run trace for overview/observability diagnostics.
 */
export async function getLatestMepaAgentRun(params: {
    abortController: MutableRefObject<AbortController | null>;
    tenderId: string;
}) {
    return fetchAI<{ success: boolean; data: import("../types").MepaAgentRunTrace }>(
        `${AI_BASE}v1/mepa/tenders/${encodeURIComponent(params.tenderId)}/agent-runs/latest`,
        "GET",
        null,
        params.abortController
    );
}

/**
 * Creates a draft tender workspace before document ingestion starts.
 */
export async function createMepaTenderDraft(params: {
    abortController: MutableRefObject<AbortController | null>;
    title?: string;
}) {
    return fetchAI<{ success: boolean; data: import("../types").MepaTenderDraft }>(
        `${AI_BASE}v1/mepa/tenders/drafts`,
        "POST",
        { title: params.title, idempotencyKey: `mepa-draft-${Date.now()}` },
        params.abortController
    );
}

/**
 * Legacy/simple prefill endpoint wrapper kept for compatibility.
 */
export async function prefillMepaTenderForm(params: {
    abortController: MutableRefObject<AbortController | null>;
    tenderId: string;
}) {
    return fetchAI<{ success: boolean; data: { prefill: import("../types").MepaTenderPrefill } }>(
        `${AI_BASE}v1/mepa/tenders/${encodeURIComponent(params.tenderId)}/form-prefill`,
        "POST",
        { forceRebuild: true },
        params.abortController
    );
}

/**
 * Finalizes a draft tender into an operational workspace and optionally starts analysis.
 */
export async function finalizeMepaTenderWorkspace(params: {
    abortController: MutableRefObject<AbortController | null>;
    tenderId: string;
    input: {
        title?: string | null;
        ente?: string | null;
        cig?: string | null;
        cup?: string | null;
        rdo?: string | null;
        deadlineAt?: string | null;
        procedureType?: string | null;
        runAnalysis?: boolean;
    };
}) {
    return fetchAI<any>(
        `${AI_BASE}v1/mepa/tenders/${encodeURIComponent(params.tenderId)}/finalize`,
        "POST",
        { ...params.input, idempotencyKey: `mepa-finalize-${params.tenderId}-${Date.now()}` },
        params.abortController
    );
}

/**
 * Lists MEPA tender workspaces using server-side query parameters.
 */
export async function listMepaTenders(params: {
    abortController: MutableRefObject<AbortController | null>;
    q?: string;
    status?: string;
    limit?: number;
}) {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.status) qs.set("status", params.status);
    qs.set("limit", String(params.limit ?? 50));
    return fetchAI<{ success: boolean; data: { tenders: import("../types").MepaTenderListItem[] } }>(
        `${AI_BASE}v1/mepa/tenders?${qs.toString()}`,
        "GET",
        null,
        params.abortController
    );
}

/**
 * Loads the complete workspace snapshot for one tender.
 */
export async function getMepaTenderWorkspace(params: {
    abortController: MutableRefObject<AbortController | null>;
    tenderId: string;
}) {
    return fetchAI<{
        success: boolean;
        data: {
            tender: import("../types").MepaTenderListItem;
            statusSummary?: Record<string, unknown>;
            dossier?: any;
            latestAgentRun?: import("../types").MepaAgentRunTrace | null;
            latestAnalysisJob?: any;
            extractedItemsPreview?: any[];
        };
    }>(
        `${AI_BASE}v1/mepa/tenders/${encodeURIComponent(params.tenderId)}`,
        "GET",
        null,
        params.abortController
    );
}

/**
 * Updates one extracted product row after buyer correction/review.
 */
export async function updateMepaExtractedItem(params: {
    abortController: MutableRefObject<AbortController | null>;
    tenderId: string;
    itemId: string;
    patch: Record<string, unknown>;
}) {
    return fetchAI<any>(
        `${AI_BASE}v1/mepa/tenders/${encodeURIComponent(params.tenderId)}/items/${encodeURIComponent(params.itemId)}`,
        "PATCH",
        params.patch,
        params.abortController
    );
}

/**
 * Creates a manually-entered extracted product row inside the tender workspace.
 */
export async function createManualMepaExtractedItem(params: {
    abortController: MutableRefObject<AbortController | null>;
    tenderId: string;
    item: Record<string, unknown>;
}) {
    return fetchAI<any>(
        `${AI_BASE}v1/mepa/tenders/${encodeURIComponent(params.tenderId)}/items/manual`,
        "POST",
        params.item,
        params.abortController
    );
}
