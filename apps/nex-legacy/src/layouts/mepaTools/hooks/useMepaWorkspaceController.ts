import { MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { enqueueSnackbar } from "components/MessageBox";
import {
    getMepaTenderReadiness,
    getMepaTenderWorkspace,
    listMepaTenders,
} from "../fetchData/mepaAi";
import type { MepaTenderListItem, MepaTenderReadiness, MepaTenderDocument, MepaTenderDocumentsSummary } from "../types";
import type { ScreenMode, WorkspaceSnapshot, WorkspaceTab } from "../domain/workspace.types";
import { isAnalysisStillRunning, isOperationalTenderWorkspace, normalizeTender, upsertTender } from "../utils/tender";

// Polling cadence for agentic analysis refresh.
// Keep this conservative: the workspace endpoint aggregates dossier, jobs,
// documents and previews, so aggressive polling would amplify backend load.
const WORKSPACE_POLL_INTERVAL_MS = 15000;

// Backoff window after HTTP 429.
// The controller pauses non-forced refreshes to avoid retry storms when the
// service-ai or reverse proxy is protecting itself with rate limits.
const WORKSPACE_RATE_LIMIT_PAUSE_MS = 15000;

const MOCK_TENDERS: MepaTenderListItem[] = [
    {
        _id: "campus-ia-tec-lotto-2",
        title: "Campus IA-TEC 4+2 - Lotto 2 Attrezzature informatiche",
        cig: "BB91F70868",
        rdo: "RDO 5123456",
        ente: "I.S.I.S. C. Facchinetti",
        deadlineAt: "2026-06-30T12:00:00.000Z",
        status: "READY_FOR_REVIEW",
        goNoGo: "GO",
        extractedItemsCount: 108,
        ownerName: "Ufficio Gare",
    },
];

type ResetWorkspaceFeatureState = () => void;

export type MepaWorkspaceController = ReturnType<typeof useMepaWorkspaceController>;

/**
 * Owns the MEPA workspace/list lifecycle and the polling strategy.
 *
 * Keeping this orchestration outside the page container prevents the main route
 * from becoming the owner of unrelated side effects. Feature tabs receive the
 * already-normalized workspace state and can focus only on their own domain.
 */
export function useMepaWorkspaceController(params: {
    abortController: MutableRefObject<AbortController | null>;
    onResetFeatureState?: ResetWorkspaceFeatureState;
}) {
    const { abortController, onResetFeatureState } = params;

    // Prevents overlapping workspace refreshes. This is a runtime guard, not UI state:
    // changing it must not trigger a render.
    const refreshInFlight = useRef(false);

    // Timestamp until which background refreshes are paused after a rate-limit.
    const retryPauseUntil = useRef(0);

    // Ref mirror of the latest snapshot used by polling without closing over stale state.
    const workspaceSnapshotRef = useRef<WorkspaceSnapshot | null>(null);

    // Current tender id mirror shared with other controllers for stale-response checks.
    const selectedTenderIdRef = useRef<string>("");

    // Route-level screen mode: list of tenders vs opened tender workspace.
    const [screenMode, setScreenMode] = useState<ScreenMode>("list");
    // Active workspace tab. It must stay in this controller so tab changes can
    // cooperate with route lifecycle and prefetching without coupling each tab.
    const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");

    // Tender list read model. A mock fallback keeps the route usable in local/dev
    // when the backend is temporarily unavailable.
    const [tenders, setTenders] = useState<MepaTenderListItem[]>(MOCK_TENDERS);

    // Currently selected tender summary. Detailed data lives in workspaceSnapshot.
    const [selectedTender, setSelectedTender] = useState<MepaTenderListItem>(MOCK_TENDERS[0]);

    // Aggregated workspace payload returned by service-ai.
    // This is the source for dossier, latest runs, previews and status summary.
    const [workspaceSnapshot, setWorkspaceSnapshot] = useState<WorkspaceSnapshot | null>(null);

    // Operational readiness model shown in the right column of the Overview.
    const [tenderReadiness, setTenderReadiness] = useState<MepaTenderReadiness | null>(null);

    // Document read model shared by Overview and Documents tab.
    const [tenderDocuments, setTenderDocuments] = useState<MepaTenderDocument[]>([]);

    // Compact counters for indexed/processed/chunked documents.
    const [tenderDocumentsSummary, setTenderDocumentsSummary] = useState<MepaTenderDocumentsSummary | null>(null);

    // Search text for the tender list. Kept client-side for immediate feedback.
    const [query, setQuery] = useState("");

    // Controls the new tender wizard modal.
    const [newTenderOpen, setNewTenderOpen] = useState(false);

    // Keep the polling interval reading the latest snapshot without making the
    // interval depend on every snapshot update.
    useEffect(() => {
        workspaceSnapshotRef.current = workspaceSnapshot;
    }, [workspaceSnapshot]);

    useEffect(() => {
        selectedTenderIdRef.current = selectedTender._id;
    }, [selectedTender._id]);

    /**
     * Client-side filter for the already loaded tender list.
     *
     * Backend search still happens in loadTenders, but this memo keeps keyboard
     * filtering responsive between requests and avoids recomputing on unrelated
     * renders.
     */
    const filteredTenders = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return tenders;
        return tenders.filter((tender) => [tender.title, tender.cig, tender.rdo, tender.ente].filter(Boolean).some((value) => String(value).toLowerCase().includes(needle)));
    }, [query, tenders]);

    /**
     * Loads the tender list from service-ai.
     *
     * Failure is intentionally non-blocking: local/mock data keeps the panel
     * accessible during backend maintenance and avoids blank-screen failures.
     */
    const loadTenders = useCallback(async () => {
        try {
            const res = await listMepaTenders({ abortController, q: query, limit: 50 });
            const loaded = (res?.data?.tenders ?? [])
                .map(normalizeTender)
                .filter((item) => item._id && isOperationalTenderWorkspace(item));
            setTenders(loaded);
        } catch (error) {
            console.warn("MEPA tenders list unavailable, using local/mock list", error);
        }
    }, [abortController, query]);

    /**
     * Normalizes the workspace response and fans it out to the route read models.
     *
     * The backend response is intentionally converted into a stable frontend
     * shape here, so individual tabs do not need to understand every backend
     * optional field or fallback path.
     */
    const applyWorkspaceResponse = useCallback((data: any) => {
        const tender = normalizeTender(data?.tender ?? {});
        if (!tender._id) return null;

        const snapshot: WorkspaceSnapshot = {
            tender,
            statusSummary: data?.statusSummary,
            dossier: data?.dossier ?? null,
            latestAgentRun: data?.latestAgentRun ?? null,
            latestAnalysisJob: data?.latestAnalysisJob ?? null,
            extractedItemsPreview: data?.extractedItemsPreview ?? [],
            documents: data?.documents ?? [],
            documentsSummary: data?.documentsSummary ?? data?.statusSummary?.documentsSummary,
        };

        setSelectedTender((current) => (current._id === tender._id ? { ...current, ...tender } : tender));
        setWorkspaceSnapshot(snapshot);
        setTenderDocuments(snapshot.documents ?? []);
        setTenderDocumentsSummary(snapshot.documentsSummary ?? null);
        setTenders((current) => upsertTender(current, tender));

        return snapshot;
    }, []);

    /**
     * Refreshes workspace data and readiness with concurrency/rate-limit guards.
     *
     * `force` bypasses the 429 pause and is used for explicit user actions or
     * after mutations. Background polling should call this without force.
     */
    const refreshWorkspaceData = useCallback(async (tenderId = selectedTenderIdRef.current, options: { force?: boolean } = {}) => {
        if (!tenderId) return;
        if (!options.force && Date.now() < retryPauseUntil.current) return;
        if (refreshInFlight.current) return;

        refreshInFlight.current = true;
        try {
            const res = await getMepaTenderWorkspace({ abortController, tenderId });
            applyWorkspaceResponse(res?.data);
            try {
                const readinessRes = await getMepaTenderReadiness({ abortController, tenderId });
                setTenderReadiness(readinessRes?.data ?? null);
            } catch (readinessError) {
                console.warn("MEPA readiness unavailable", readinessError);
                setTenderReadiness(null);
            }
        } catch (error: any) {
            if (error?.status === 429) retryPauseUntil.current = Date.now() + WORKSPACE_RATE_LIMIT_PAUSE_MS;
            console.warn("Workspace refresh unavailable", error);
        } finally {
            refreshInFlight.current = false;
        }
    }, [abortController, applyWorkspaceResponse]);

    /** Clears tender-specific runtime data before opening another workspace. */
    const resetWorkspaceRuntimeState = useCallback(() => {
        setWorkspaceSnapshot(null);
        setTenderReadiness(null);
        setTenderDocuments([]);
        setTenderDocumentsSummary(null);
        onResetFeatureState?.();
    }, [onResetFeatureState]);

    /** Opens a tender workspace and triggers the first forced refresh. */
    const openWorkspace = useCallback((tender: MepaTenderListItem) => {
        if (!isOperationalTenderWorkspace(tender)) {
            enqueueSnackbar?.("La bozza AI non è ancora un workspace: completa la revisione e conferma la creazione.", { variant: "warning" } as any);
            return;
        }
        setSelectedTender(tender);
        resetWorkspaceRuntimeState();
        setActiveTab("overview");
        setScreenMode("workspace");
        void refreshWorkspaceData(tender._id, { force: true });
    }, [refreshWorkspaceData, resetWorkspaceRuntimeState]);

    /**
     * Handles the optimistic transition after the New Tender wizard creates a workspace.
     *
     * The workspace is shown immediately in ANALYSIS_RUNNING state while the
     * backend agents continue in background; a delayed refresh reconciles the UI
     * with the persisted backend state.
     */
    const handleWizardCreated = useCallback((createdTender: any) => {
        const tender = normalizeTender(createdTender?.tender ?? createdTender);
        if (!tender._id) return;

        const workspaceTender = { ...tender, status: tender.status ?? "ANALYSIS_RUNNING", goNoGo: "PENDING" as const };
        setTenders((current) => upsertTender(current, workspaceTender));
        setSelectedTender(workspaceTender);
        setWorkspaceSnapshot({ tender: workspaceTender, statusSummary: { analysisStatus: "ANALYSIS_RUNNING", dossierReady: false, extractedItemsCount: 0 } });
        setTenderReadiness(null);
        setTenderDocuments([]);
        setTenderDocumentsSummary(null);
        setNewTenderOpen(false);
        setActiveTab("overview");
        setScreenMode("workspace");
        onResetFeatureState?.();
        enqueueSnackbar?.("Workspace gara creato. Analisi agentica in corso in background.", { variant: "success" } as any);
        window.setTimeout(() => void refreshWorkspaceData(workspaceTender._id, { force: true }), 1500);
    }, [onResetFeatureState, refreshWorkspaceData]);

    // Initial tender list bootstrap.
    useEffect(() => {
        void loadTenders();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Conditional polling while the selected workspace still has running agents.
    // The interval is mounted only in workspace mode and self-checks the tender id
    // to avoid updating a workspace after the user switched gara.
    useEffect(() => {
        if (screenMode !== "workspace" || !selectedTender._id) return undefined;

        const tenderId = selectedTender._id;
        void refreshWorkspaceData(tenderId, { force: true });

        const interval = window.setInterval(() => {
            const currentTenderId = selectedTenderIdRef.current;
            if (!currentTenderId || currentTenderId !== tenderId) return;
            if (isAnalysisStillRunning(workspaceSnapshotRef.current)) {
                void refreshWorkspaceData(currentTenderId);
            }
        }, WORKSPACE_POLL_INTERVAL_MS);

        return () => window.clearInterval(interval);
    }, [screenMode, selectedTender._id, refreshWorkspaceData]);

    return {
        screenMode,
        setScreenMode,
        activeTab,
        setActiveTab,
        tenders,
        setTenders,
        filteredTenders,
        selectedTender,
        setSelectedTender,
        workspaceSnapshot,
        setWorkspaceSnapshot,
        tenderReadiness,
        setTenderReadiness,
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
        applyWorkspaceResponse,
        refreshWorkspaceData,
        openWorkspace,
        handleWizardCreated,
    };
}
