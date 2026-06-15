/**
 * MEPA AI front-end contract types.
 *
 * This file is the UI-side boundary between React components/controllers and the
 * service-ai API. The goal is not to encode every backend implementation detail,
 * but to give the front-end a stable vocabulary for tender lifecycle, document
 * processing, RAG retrieval, product matching, chat, indexing and dossier
 * governance.
 *
 * Enterprise rule: components should consume these types as read models and keep
 * business decisions inside selectors/controllers. Avoid spreading raw API
 * objects through JSX when a normalized view model can be derived once.
 */

// -----------------------------------------------------------------------------
// Tender lifecycle, documents and readiness
// -----------------------------------------------------------------------------

/** Lifecycle states of a MEPA tender workspace as seen by the front-end. */
export type MepaTenderStatus =
  | "DRAFT"
  | "DOCUMENTS_UPLOADED"
  | "FORM_PREFILLED"
  | "WORKSPACE_CREATED"
  | "ANALYSIS_RUNNING"
  | "READY_FOR_REVIEW"
  | "READY_FOR_QUOTATION"
  | "QUOTATION_CREATED"
  | "CLOSED";


/** Processing state for an uploaded tender document. */
export type MepaTenderDocumentStatus = "UPLOADED" | "PROCESSING" | "PROCESSED" | "FAILED" | "SUPERSEDED" | "DELETED";

/**
 * Tender document metadata and extraction progress.
 *
 * The UI never reads raw file content from this object. It only uses metadata,
 * extraction counters and processing status to drive document cards, readiness
 * and evidence navigation.
 */
export interface MepaTenderDocument {
  _id?: string;
  tenderId: string;
  documentId: string;
  originalFileName?: string | null;
  normalizedFileName?: string | null;
  documentTitle?: string | null;
  documentType?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  checksumSha256?: string | null;
  storageKey?: string | null;
  version?: number;
  parentDocumentId?: string | null;
  processingStatus: MepaTenderDocumentStatus;
  extraction?: {
    method?: string | null;
    quality?: number | null;
    warnings?: string[];
    chunkCount?: number;
    indexedChunks?: number;
    vespaIndexedChunks?: number;
    processedAt?: string | null;
    failedAt?: string | null;
    error?: string | null;
  };
  chunkCount?: number;
  processedByAgents?: boolean;
  uploadedBy?: string | null;
  uploadedAt?: string;
  deletedBy?: string | null;
  deletedAt?: string | null;
  deleteReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Aggregated document counters returned by workspace/document endpoints. */
export interface MepaTenderDocumentsSummary {
  total: number;
  processed: number;
  processing: number;
  failed: number;
  deleted: number;
  chunks: number;
  stale: boolean;
}

/** Retrieval backend effectively used for a RAG operation. */
export type MepaRetrievalProvider = "VESPA" | "MONGO_FALLBACK" | "MONGO_ONLY";
/** Strategy selected by the RAG layer when Vespa is available. */
export type MepaVespaQueryStrategy = "HYBRID_VECTOR" | "LEXICAL_STRICT" | "RELAXED_SCOPED" | "NOT_USED";

/** Compact tender row used by list/search views and workspace headers. */
export interface MepaTenderListItem {
  _id: string;
  title: string;
  cig?: string;
  rdo?: string;
  ente?: string;
  deadlineAt?: string;
  status: MepaTenderStatus;
  goNoGo?: "GO" | "NO_GO" | "PENDING";
  extractedItemsCount?: number;
  ownerName?: string;
  quotationId?: string;
}


/** Overall readiness classification for moving from analysis to quotation. */
export type MepaTenderReadinessStatus = "READY" | "READY_WITH_WARNINGS" | "BLOCKED";
export type MepaTenderReadinessChecklistStatus = "OK" | "WARNING" | "BLOCKER";

/** Single readiness checklist entry shown to users as OK/WARNING/BLOCKER. */
export interface MepaTenderReadinessChecklistItem {
  key: string;
  label: string;
  status: MepaTenderReadinessChecklistStatus;
  description: string;
  count?: number;
}

/**
 * Server-driven readiness read model.
 *
 * These metrics are deliberately calculated by the backend so the UI does not
 * duplicate governance rules around documents, products, criticalities and
 * validations.
 */
export interface MepaTenderReadiness {
  tenderId: string;
  status: MepaTenderReadinessStatus;
  label: string;
  score: number;
  canProceedToNextPhase: boolean;
  checkedAt: string;
  checklist: MepaTenderReadinessChecklistItem[];
  blockers: string[];
  warnings: string[];
  nextRecommendedActions: string[];
  metrics: {
    documentsChunksCount: number;
    documentsWithPageCount: number;
    documentsWithSectionCount: number;
    extractedItemsTotal: number;
    extractedItemsValidated: number;
    extractedItemsCorrected: number;
    extractedItemsRejected: number;
    extractedItemsPendingReview: number;
    extractedItemsWithoutEvidence: number;
    highCriticalitiesCount: number;
    managedHighCriticalitiesCount: number;
    validationsCount: number;
    productMatchEligibleItems?: number;
    productMatchAiMatched?: number;
    productMatchValidated?: number;
    productMatchNeedsReview?: number;
    productMatchNoMatch?: number;
    productMatchOnlyIcecat?: number;
    productMatchDisabledWarnings?: number;
    productMatchWithRecommendation?: number;
    productMatchWithSubstitutes?: number;
    productMatchUsableWithReview?: number;
    latestAnalysisStatus: string | null;
    dossierVersion: number | null;
  };
}

// -----------------------------------------------------------------------------
// Product matching and product RAG contracts
// -----------------------------------------------------------------------------

/**
 * Catalog candidate proposed by the product matching layer.
 *
 * It can represent Focelda-coded products, supplier uncoded records or Icecat
 * candidates. UI code must use ranking/warning fields for display only; final
 * accept/reject governance remains explicit through validation actions.
 */
export interface MepaAiProductCandidate {
  source: "products" | "icecats";
  productId: string;
  title: string;
  brand?: string | null;
  manufacturerCode?: string | null;
  ean?: string | null;
  buyerCode?: string | null;
  sourcePriority: "FOCELDA_CODED" | "SUPPLIER_UNCODED" | "ICECAT" | "UNKNOWN";
  scores: {
    lexical: number;
    semantic?: number;
    attribute?: number;
    code?: number;
    business: number;
    businessPriorityScore?: number;
    catalogSourceScore?: number;
    buyerMappingScore?: number;
    icecatCommercialRiskScore?: number;
    commercialReadinessScore?: number;
    final: number;
  };
  rationale: string;
  matchReasons?: string[];
  verificationNotes?: string[];
  recommendationType?: "BEST_MATCH" | "SUBSTITUTE" | "CANDIDATE";
  confidence?: "HIGH" | "MEDIUM" | "LOW";
  quotationUsability?: {
    status: "USABLE" | "USABLE_WITH_REVIEW" | "NOT_RECOMMENDED";
    reasons: string[];
  };
  warnings: string[];
}

/** Search hit returned by tender-document RAG. */
export interface MepaDocumentChunkSearchResult {
  sourceType: "DOCUMENT_RAG";
  documentId?: string;
  chunkId?: string;
  page?: number;
  sectionTitle?: string;
  score: number;
  text: string;
  documentTitle?: string | null;
  documentType?: string | null;
  retrievalProvider?: MepaRetrievalProvider;
}


/** Detail payload used by the evidence modal to explain where an AI claim came from. */
export interface MepaEvidenceDetail {
  tenderId: string;
  evidence: {
    documentId?: string | null;
    documentTitle?: string | null;
    documentType?: string | null;
    chunkId?: string | null;
    chunkIndex?: number | null;
    page?: number | null;
    sectionTitle?: string | null;
    text: string;
    excerpt?: string | null;
    source?: Record<string, any>;
    quality?: { level?: string; hasPage?: boolean; hasSection?: boolean; hasText?: boolean };
    indexedAt?: string | null;
    updatedAt?: string | null;
  };
}

/** Diagnostics and chunks returned by a document RAG query. */
export interface MepaRagResponseData {
  chunks: MepaDocumentChunkSearchResult[];
  retrievalProvider: MepaRetrievalProvider;
  fallbackUsed: boolean;
  vespaEnabled: boolean;
  elapsedMs: number;
  retrievalMode?: "LEXICAL" | "HYBRID_VECTOR";
  vespaQueryStrategy?: MepaVespaQueryStrategy;
  fallbackReason?: "VESPA_ERROR" | "VESPA_NO_HITS" | null;
  embeddingError?: string | null;
  vespaHitsBeforeScope?: number | null;
  vespaScopedHits?: number | null;
  vespaSelfHealAttempted?: boolean;
  vespaSelfHealFed?: number;
  vespaSelfHealFailed?: number;
  vespaSelfHealEmbeddingFailed?: number;
  vespaSelfHealError?: string | null;
  embeddingsEnabled?: boolean;
  vectorSearchEnabled?: boolean;
}


/** Overall status for a batch catalog-matching run. */
export type MepaProductMatchingBatchStatus = "COMPLETED" | "COMPLETED_WITH_WARNINGS" | "PARTIAL" | "FAILED";
export type MepaProductMatchingItemStatus = "MATCHED" | "NO_CANDIDATES" | "SKIPPED" | "FAILED";

/** Batch result produced by the product catalog matching orchestrator. */
export interface MepaProductMatchingBatchResult {
  tenderId: string;
  status: MepaProductMatchingBatchStatus;
  correlationId: string;
  generatedAt: string;
  policy: "MEPA_PRODUCT_MATCHING_ORCHESTRATOR_V1";
  queryLayer: "VESPA_PRODUCT_CATALOG_FIRST";
  includeIcecat: boolean;
  validationStatuses: Array<"VALIDATED" | "CORRECTED" | "PENDING_REVIEW">;
  onlyWithEvidence: boolean;
  minFinalScore: number;
  summary: {
    eligibleItems: number;
    processedItems: number;
    matchedItems: number;
    noCandidateItems: number;
    skippedItems: number;
    failedItems: number;
    vespaHits: number;
    mongoFallbackHits: number;
    averageElapsedMs: number;
  };
  results: Array<{
    itemId: string;
    status: MepaProductMatchingItemStatus;
    queryText: string;
    runId?: string | null;
    candidates: MepaAiProductCandidate[];
    topCandidate?: MepaAiProductCandidate | null;
    retrievalProvider?: MepaRetrievalProvider;
    fallbackUsed?: boolean;
    fallbackReason?: "VESPA_ERROR" | "VESPA_NO_HITS" | null;
    searchMode?: "LEXICAL" | "HYBRID_VECTOR";
    elapsedMs?: number;
    warnings: string[];
    error?: { code: string; message: string } | null;
  }>;
}


/** End-to-end result of the product requirements + catalog matching agent pipeline. */
export interface MepaProductAgentsPipelineResult {
  status: "COMPLETED" | "COMPLETED_WITH_WARNINGS" | "FAILED";
  tenderId: string;
  analysisJobId: string;
  agentRunId: string;
  extractedItems: number;
  productCatalogMatchingSummary: {
    totalItems: number;
    matched: number;
    partial: number;
    noMatch: number;
    failed: number;
    vespaHits: number;
    fallbackHits: number;
    recommendedProducts: number;
    itemsWithSubstitutes: number;
    reviewRequired: number;
    averageElapsedMs: number;
    recommendationCoverageRatio: number;
    coverageRatio: number;
    policy: string;
  };
  productMatchingBatch: MepaProductMatchingBatchResult;
  productCatalogMatches: Array<{
    itemId: string;
    status: "MATCHED" | "PARTIAL_MATCH" | "NO_MATCH" | "FAILED";
    queryText: string;
    bestMatches: MepaAiProductCandidate[];
    substitutes: MepaAiProductCandidate[];
    retrievalProvider?: MepaRetrievalProvider | null;
    retrievalMeta?: Record<string, any>;
    warnings: string[];
    elapsedMs: number;
  }>;
}

/** Response for an on-demand product catalog search from the manual drawer. */
export interface MepaProductSearchResponseData {
  candidates: MepaAiProductCandidate[];
  retrievalProvider: MepaRetrievalProvider;
  fallbackUsed: boolean;
  fallbackReason?: "VESPA_ERROR" | "VESPA_NO_HITS" | null;
  vespaEnabled: boolean;
  elapsedMs: number;
  searchMode: "LEXICAL" | "HYBRID_VECTOR";
  embeddingsEnabled: boolean;
  vectorSearchEnabled: boolean;
  includeIcecat: boolean;
  queryTokens: string[];
  rankingPolicy?: "PRODUCT_BUSINESS_RANKING_V1";
}

/** Operational stats for the product search layer and its Vespa/Mongo coverage. */
export interface MepaProductSearchStats {
  vespa: {
    enabled: boolean;
    ok: boolean;
    endpoint: string;
    productCatalogTotalCount: number | null;
    productCatalogProductsCount: number | null;
    productCatalogIcecatsCount: number | null;
  };
  mongo: {
    productsEstimatedCount: number | null;
    icecatsEstimatedCount: number | null;
    productsDbName: string;
    icecatDbName: string;
  };
  embeddings?: {
    enabled: boolean;
    vectorSearchEnabled: boolean;
    provider: "OPENAI" | "LOCAL_HTTP" | "OLLAMA" | "DISABLED";
    model: string;
    dimensions: number;
  };
  config: {
    productSchema: string;
    ingestLimit: number;
    fallbackToMongo: boolean;
    icecatGovernance?: {
      requireFilter: boolean;
      maxUnfilteredItems: number;
      defaultCategories: string[];
      defaultBrands: string[];
    };
    ranking?: {
      policy: "PRODUCT_BUSINESS_RANKING_V1";
      semanticWeight: number;
      lexicalWeight: number;
      attributeWeight: number;
      codeWeight: number;
      businessWeight: number;
    };
  };
}

/** Operational stats for tender document RAG indexing. */
export interface MepaRagStats {
  tenderId: string;
  mongoChunks: number;
  mongoDocuments: number;
  vespaEnabled: boolean;
  vespaOk: boolean;
  vespaTotalCount: number | null;
  vespaSyncedChunks?: number;
  vespaFailedChunks?: number;
  vespaPendingChunks?: number;
  fallbackToMongo: boolean;
  schemas: {
    tenderDocumentChunk: string;
  };
  embeddings?: {
    enabled: boolean;
    vectorSearchEnabled: boolean;
    provider: "OPENAI" | "LOCAL_HTTP" | "OLLAMA" | "DISABLED";
    model: string;
    dimensions: number;
  };
  lastMongoChunkAt?: string | null;
  vespaDetails?: unknown;
}


// -----------------------------------------------------------------------------
// Tender chat contracts
// -----------------------------------------------------------------------------

/** Intent classification assigned to a chat question over tender documents. */
export type MepaTenderChatIntent =
  | "SUMMARY"
  | "REQUIREMENTS"
  | "CERTIFICATIONS"
  | "PRODUCTS"
  | "CRITICALITIES"
  | "DEADLINES"
  | "ADMINISTRATIVE"
  | "TECHNICAL"
  | "GO_NO_GO"
  | "BUYER_BRIEF"
  | "QUOTE_PREPARATION"
  | "GENERIC_DOCUMENT_QUESTION";

/** Citation/evidence pointer shown below chat answers and AI summaries. */
export interface MepaChatCitation {
  documentId?: string | null;
  documentTitle?: string | null;
  chunkId?: string | null;
  page?: number | null;
  sectionTitle?: string | null;
  excerpt?: string | null;
  relevance?: number | null;
}

/** Suggested next action emitted by the chat assistant. */
export interface MepaChatSuggestedAction {
  type: string;
  label: string;
  requiresConfirmation?: boolean;
}

/** Persisted or transient chat message in the MEPA tender thread. */
export interface MepaChatMessage {
  _id?: string;
  tenderId?: string;
  threadId?: string;
  role: "user" | "assistant" | "system";
  content: string;
  evidenceRefs?: MepaChatCitation[];
  retrievalProvider?: MepaRetrievalProvider | null;
  retrievalMeta?: Record<string, any>;
  suggestedActions?: MepaChatSuggestedAction[];
  createdAt?: string;
}

/** Full response from the MEPA tender chat endpoint. */
export interface MepaTenderChatResponseData {
  threadId: string;
  message: MepaChatMessage;
  answer: string;
  intent: MepaTenderChatIntent;
  confidence: number;
  citations: MepaChatCitation[];
  evidenceRefs: MepaChatCitation[];
  suggestedActions: MepaChatSuggestedAction[];
  limitations: string[];
  chunks: MepaDocumentChunkSearchResult[];
  retrievalProvider: MepaRetrievalProvider;
  fallbackUsed: boolean;
  vespaEnabled: boolean;
  elapsedMs: number;
  retrievalMode?: "LEXICAL" | "HYBRID_VECTOR";
  vespaQueryStrategy?: MepaVespaQueryStrategy;
  fallbackReason?: "VESPA_ERROR" | "VESPA_NO_HITS" | null;
  embeddingError?: string | null;
  vespaHitsBeforeScope?: number | null;
  vespaScopedHits?: number | null;
  vespaSelfHealAttempted?: boolean;
  vespaSelfHealFed?: number;
  vespaSelfHealFailed?: number;
  vespaSelfHealEmbeddingFailed?: number;
  vespaSelfHealError?: string | null;
  embeddingsEnabled?: boolean;
  vectorSearchEnabled?: boolean;
  usedOpenAI?: boolean;
  model?: string;
}

// -----------------------------------------------------------------------------
// Product index control-plane contracts
// -----------------------------------------------------------------------------

/** Product index source selectable in product RAG bootstrap/jobs. */
export type MepaProductIndexSource = "products" | "icecats" | "both";
export type MepaProductIndexJobStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";

/** Persisted product indexing job used by the observability/control-plane UI. */
export interface MepaProductIndexJob {
  _id: string;
  source: MepaProductIndexSource;
  status: MepaProductIndexJobStatus;
  progress: number;
  requestedBy?: string | null;
  correlationId: string;
  input: {
    batchSize: number;
    maxItems: number;
    includeEmbeddings: boolean;
    embeddingDimensions: number;
    productDbName: string;
    icecatDbName: string;
    vespaSchema: string;
    filters?: {
      categories?: string[];
      brands?: string[];
      textQuery?: string | null;
      sourcePriorities?: string[];
      allowUnfilteredIcecat?: boolean;
    };
    governance?: {
      requireIcecatFilter: boolean;
      icecatMaxUnfilteredItems: number;
      policy: string;
    };
  };
  cursors: { products?: string | null; icecats?: string | null };
  counters: { attempted: number; fed: number; failed: number; productsFed: number; icecatsFed: number };
  exhausted: { products: boolean; icecats: boolean };
  error?: { code: string; message: string; details?: unknown } | null;
  createdAt?: string;
  updatedAt?: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

/** Small control-plane overview for product indexing queue and latest jobs. */
export interface MepaProductIndexOverview {
  vespaEnabled: boolean;
  embeddingsEnabled: boolean;
  defaults: { batchSize: number; maxItems: number; includeEmbeddings: boolean };
  icecatGovernance?: { requireFilter: boolean; maxUnfilteredItems: number; defaultCategories: string[]; defaultBrands: string[] };
  counters: { running: number; queued: number; failed: number };
  latestJobs: MepaProductIndexJob[];
}


export type MepaProductIndexBootstrapMode = "PRODUCTS_FIRST" | "FOCELDA_ONLY" | "SUPPLIERS_ONLY" | "GOVERNED_ICECAT" | "PRODUCTS_AND_GOVERNED_ICECAT";

/** Product RAG control-plane snapshot rendered in Observability. */
export interface MepaProductRagControlPlane {
  architecture: string;
  policy: string;
  overview: MepaProductIndexOverview;
  stats: MepaProductSearchStats;
  coverage: {
    productCoverage: number | null;
    icecatCoverage: number | null;
    vespaProducts: number;
    mongoProducts: number;
    vespaIcecats: number;
    mongoIcecats: number;
  };
  recommendedActions: string[];
}

/** Response returned when product indexing bootstrap jobs are created. */
export interface MepaProductIndexBootstrapResult {
  mode: MepaProductIndexBootstrapMode;
  policy: string;
  jobs: MepaProductIndexJob[];
  runResults: MepaProductIndexRunResult[];
  warnings: string[];
  nextRecommendedActions: string[];
}

/** Result of running the next queued product indexing jobs. */
export interface MepaProductIndexRunNextResult {
  correlationId: string;
  processedJobs: number;
  elapsedMs: number;
  results: Array<MepaProductIndexRunResult | Record<string, any>>;
}

/** Per-job execution summary for product indexing workers. */
export interface MepaProductIndexRunResult {
  jobId: string;
  status: MepaProductIndexJobStatus;
  source: MepaProductIndexSource;
  attempted: number;
  fed: number;
  failed: number;
  productsFed: number;
  icecatsFed: number;
  lastProductCursor?: string | null;
  lastIcecatCursor?: string | null;
  elapsedMs: number;
  exhausted: { products: boolean; icecats: boolean };
  errors: string[];
}

// -----------------------------------------------------------------------------
// Agent orchestrator and dossier contracts
// -----------------------------------------------------------------------------

/** Agent roles participating in the MEPA analysis orchestrator. */
export type MepaAgentRole =
  | "DOCUMENT_EXTRACTION_AGENT"
  | "DOCUMENT_CHUNKING_AGENT"
  | "RAG_INDEXING_AGENT"
  | "FORM_PREFILL_AGENT"
  | "TENDER_OVERVIEW_AGENT"
  | "REQUIREMENTS_AGENT"
  | "PRODUCT_REQUIREMENTS_AGENT"
  | "PRODUCT_CATALOG_MATCHING_AGENT"
  | "CRITICALITY_AGENT"
  | "ACTION_PLANNER_AGENT"
  | "QUALITY_REVIEW_AGENT";

export type MepaAgentStepStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
export type MepaAgentRunStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";

/** Single agent step trace used for observability and debugging. */
export interface MepaAgentStepTrace {
  role: MepaAgentRole;
  status: MepaAgentStepStatus;
  startedAt?: string;
  completedAt?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: { code: string; message: string; details?: unknown } | null;
}

/** Full orchestrator run trace for a tender analysis. */
export interface MepaAgentRunTrace {
  _id: string;
  tenderId: string;
  analysisJobId: string;
  status: MepaAgentRunStatus;
  orchestrator: "MEPA_AGENT_ORCHESTRATOR_V1";
  pipelineVersion: string;
  steps: MepaAgentStepTrace[];
  outputs?: Record<string, unknown>;
  metrics?: Record<string, unknown>;
  error?: { code: string; message: string; details?: unknown } | null;
  correlationId: string;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string | null;
}

/** AI-generated prefill proposal used by the new tender wizard before human confirmation. */
export interface MepaTenderPrefill {
  title: string | null;
  ente: string | null;
  cig: string | null;
  cup: string | null;
  rdo: string | null;
  deadlineAt: string | null;
  procedureType: string | null;
  lots: Array<{ lotCode?: string | null; title?: string | null; amount?: number | null }>;
  confidence: number;
  missingFields: string[];
  rationale: string;
  evidenceRefs: unknown[];
  model: string;
  usedOpenAI: boolean;
}

/** Draft tender created before the workspace is finalized. */
export interface MepaTenderDraft {
  _id: string;
  title?: string | null;
  ente?: string | null;
  cig?: string | null;
  cup?: string | null;
  rdo?: string | null;
  deadlineAt?: string | null;
  status: string;
  draftPrefill?: MepaTenderPrefill | null;
}

/** Operational dossier report rendered in the Dossier AI tab. */
export interface MepaDossierOperationalReport {
  tenderId: string;
  title: string;
  generatedAt: string;
  tender: Record<string, any>;
  analysis: Record<string, any>;
  executiveSummary: string;
  overview: Record<string, any>;
  requirements: {
    certifications: Array<Record<string, any>>;
    operationalRequirements: string[];
    administrativeRequirements: string[];
    deliveryConstraints: string[];
    warrantyConstraints: string[];
    warnings: string[];
    evidenceRefs?: MepaChatCitation[];
  };
  sections: Array<Record<string, any>>;
  criticalities: Array<Record<string, any>>;
  actions: Array<Record<string, any>>;
  extractedItems: Array<Record<string, any>>;
  goNoGo: Record<string, any>;
  validationSummary: Record<string, number>;
  evidence: {
    documents: Array<Record<string, any>>;
    totalDocuments: number;
    totalChunks: number;
  };
  readiness: {
    canPrepareQuotation: boolean;
    blockers: string[];
    nextSuggestedStep: string;
  };
  markdown: string;
}


/** Quality/governance report used to decide whether the dossier is safe to use operationally. */
export interface MepaDossierQualityReport {
  tenderId: string;
  generatedAt: string;
  policy: "MEPA_DOSSIER_QUALITY_V1";
  analysisStatus?: string;
  score: number;
  level: "HIGH" | "MEDIUM" | "LOW";
  readiness: {
    canProceedToOperationalUse: boolean;
    blockers: string[];
    nextSuggestedStep: string;
  };
  metrics: {
    totalTargets: number;
    withEvidence: number;
    withValidEvidence: number;
    evidenceCoveragePct: number;
    validEvidenceCoveragePct: number;
    validationPct: number;
    validated: number;
    needsReview: number;
    rejected: number;
    linkedChunkIds: number;
    resolvedChunkIds: number;
    documents: number;
    chunks: number;
    documentPageCoveragePct: number;
    documentSectionCoveragePct: number;
  };
  breakdown: {
    byTargetType: Array<{ targetType: string; total: number; withEvidence: number; withValidEvidence: number; coveragePct: number }>;
  };
  issues: Array<{ severity: "LOW" | "MEDIUM" | "HIGH"; code: string; title: string; description: string; targetType?: string; targetId?: string; suggestedAction?: string }>;
  sourceQuality: Array<{ documentId?: string | null; documentTitle: string; chunks: number; withPage: number; withSection: number }>;
}
