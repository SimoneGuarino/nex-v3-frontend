import type { MepaTenderListItem } from "../types";
import type { WorkspaceSnapshot } from "../domain/workspace.types";

const PRE_WORKSPACE_TENDER_STATUSES = new Set(["DRAFT", "DOCUMENTS_UPLOADED", "FORM_PREFILLED"]);

/**
 * Returns true only for finalized/operational MEPA workspaces.
 *
 * The creation wizard uses backend draft records as temporary ingestion state
 * before human confirmation. Those records must not be shown in the portfolio
 * or opened as real workspaces.
 */
export function isOperationalTenderWorkspace(tender: Pick<MepaTenderListItem, "status" | "_id"> | null | undefined): boolean {
    if (!tender?._id) return false;
    return !PRE_WORKSPACE_TENDER_STATUSES.has(String(tender.status ?? ""));
}

/**
 * Normalizes mixed tender API payloads into the list/workspace contract consumed by the UI.
 * The function keeps fallback paths for draft, finalized and legacy shapes to make FE/BE
 * migrations non-breaking while the AI service evolves.
 */
export function normalizeTender(raw: any): MepaTenderListItem {
    const rawGoNoGo = raw?.goNoGo?.suggestion ?? raw?.goNoGo?.decision ?? raw?.goNoGo;
    const normalizedGoNoGo = rawGoNoGo === "GO_WITH_WARNINGS" ? "GO" : rawGoNoGo;
    return {
        _id: String(raw?._id ?? raw?.id ?? ""),
        title: raw?.title ?? raw?.finalizedInput?.title ?? raw?.draftPrefill?.title ?? "Nuova gara MEPA",
        cig: raw?.cig ?? raw?.finalizedInput?.cig ?? raw?.draftPrefill?.cig ?? undefined,
        rdo: raw?.rdo ?? raw?.finalizedInput?.rdo ?? raw?.draftPrefill?.rdo ?? undefined,
        ente: raw?.ente ?? raw?.finalizedInput?.ente ?? raw?.draftPrefill?.ente ?? undefined,
        deadlineAt: raw?.deadlineAt ?? raw?.finalizedInput?.deadlineAt ?? raw?.draftPrefill?.deadlineAt ?? undefined,
        status: raw?.status ?? "ANALYSIS_RUNNING",
        goNoGo: normalizedGoNoGo === "GO" || normalizedGoNoGo === "NO_GO" ? normalizedGoNoGo : "PENDING",
        extractedItemsCount: raw?.extractedItemsCount ?? 0,
        ownerName: raw?.ownerName ?? "Ufficio Gare",
        quotationId: raw?.quotationId ?? undefined,
    };
}

/**
 * Determines whether workspace polling should continue.
 *
 * It checks all known status locations because the service may report progress
 * at tender, job or agent-run level during different migration phases.
 */
export function isAnalysisStillRunning(snapshot: WorkspaceSnapshot | null) {
    const status = String(snapshot?.statusSummary?.analysisStatus ?? snapshot?.latestAnalysisJob?.status ?? snapshot?.latestAgentRun?.status ?? snapshot?.tender?.status ?? "");
    return ["DRAFT", "WORKSPACE_CREATED", "ANALYSIS_RUNNING", "RUNNING", "QUEUED", "PENDING"].includes(status);
}

/**
 * Inserts or replaces a tender in the in-memory list while keeping newest first.
 */
export function upsertTender(list: MepaTenderListItem[], tender: MepaTenderListItem) {
    const next = list.filter((item) => item._id !== tender._id);
    return [tender, ...next];
}
