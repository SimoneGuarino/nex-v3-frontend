import type {
    MepaAgentRunTrace,
    MepaTenderDocument,
    MepaTenderDocumentsSummary,
    MepaTenderListItem,
} from "../types";
import type { ExtractedItemView } from "../features/products/products.types";

/**
 * Workspace tabs available after a tender is opened.
 *
 * This union is intentionally explicit: adding a tab should fail fast at compile
 * time until navigation metadata, lazy loader and tab renderer are updated.
 */
export type WorkspaceTab = "overview" | "documents" | "dossier" | "products" | "chat" | "observability" | "quotation";

/**
 * Top-level page mode.
 *
 * `list` keeps the page focused on tender discovery/creation; `workspace` means
 * a specific tender is selected and all controllers can resolve against its id.
 */
export type ScreenMode = "list" | "workspace";

/**
 * Canonical client-side snapshot for a selected MEPA tender workspace.
 *
 * The back-end can return partial entities depending on the current pipeline phase;
 * this type keeps the UI contract explicit and avoids leaking raw response shapes
 * across tabs.
 */
export type WorkspaceSnapshot = {
    /** Selected tender normalized for UI rendering. */
    tender: MepaTenderListItem;
    /**
     * Lightweight operational status returned by the workspace endpoint.
     *
     * It powers readiness chips and overview counters without forcing every tab
     * to load its full read model immediately.
     */
    statusSummary?: {
        analysisStatus?: string;
        agentRunStatus?: string | null;
        completedSteps?: number;
        totalSteps?: number;
        runningStep?: string | null;
        failedStep?: string | null;
        dossierReady?: boolean;
        extractedItemsCount?: number;
        validationSummary?: { total?: number; validated?: number; corrected?: number; rejected?: number; needsReview?: number };
    };
    /** Latest dossier read model when already included in the workspace response. */
    dossier?: any | null;
    /** Last orchestrator trace used by observability panels and status strips. */
    latestAgentRun?: MepaAgentRunTrace | null;
    /** Latest analysis job metadata, kept loose because backend job details are operational diagnostics. */
    latestAnalysisJob?: any | null;
    /** Small product preview for Overview. Full review data is loaded by the products controller. */
    extractedItemsPreview?: ExtractedItemView[];
    /** Documents already known by the workspace endpoint. Full document actions stay in the documents controller. */
    documents?: MepaTenderDocument[];
    /** Aggregated document counters used by readiness and overview cards. */
    documentsSummary?: MepaTenderDocumentsSummary;
};
