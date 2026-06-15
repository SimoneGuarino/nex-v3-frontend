import { MutableRefObject, useCallback } from "react";
import { enqueueSnackbar } from "components/MessageBox";
import {
    deleteMepaTenderDocument,
    getMepaTenderDocuments,
    uploadMepaTenderDocuments,
    type MepaTenderUploadDocumentPayload,
} from "../fetchData/mepaAi";
import type { MepaTenderDocument, MepaTenderDocumentsSummary } from "../types";

/**
 * Creates a client-side document id for uploads.
 *
 * The backend still owns persistence, but a stable local id lets the upload
 * payload stay deterministic and traceable before the document is processed.
 */
function createDocumentId(): string {
    const randomId = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    return `doc-${randomId}`;
}

/** Reads one browser File as DataURL for the current service-ai base64 contract. */
function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

/**
 * Builds the upload payload expected by service-ai.
 *
 * This function intentionally performs heavy file conversion outside the React
 * component tree, making the controller easier to test and keeping the route
 * container free from low-level browser FileReader details.
 */
async function buildUploadDocumentsPayload(files: File[]): Promise<MepaTenderUploadDocumentPayload[]> {
    const payload: MepaTenderUploadDocumentPayload[] = [];

    /**
     * Files are intentionally processed sequentially.
     *
     * The current service-ai contract still expects base64 payloads. Reading all selected
     * files in parallel would multiply browser memory usage because every file exists as
     * File, DataURL and JSON string at the same time. Sequential conversion keeps the UI
     * much safer on laptops and mobile devices until the backend supports multipart or
     * signed uploads.
     */
    for (const file of files) {
        payload.push({
            documentId: createDocumentId(),
            documentTitle: file.name,
            documentType: "GARA_UPLOAD",
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            rawFileBase64: await readFileAsDataUrl(file),
        });
    }

    return payload;
}

/**
 * Owns the document list/upload/delete lifecycle for the selected MEPA tender.
 *
 * The controller receives setters for the shared workspace document read model
 * because the same state is consumed by Overview and Documents tab.
 */
export function useMepaDocumentsController(params: {
    abortController: MutableRefObject<AbortController | null>;
    tenderId: string | undefined;
    setLoading: (loading: string | null) => void;
    setTenderDocuments: (documents: MepaTenderDocument[]) => void;
    setTenderDocumentsSummary: (summary: MepaTenderDocumentsSummary | null) => void;
    refreshWorkspaceData: (tenderId?: string, options?: { force?: boolean }) => Promise<void> | void;
}) {
    const {
        abortController,
        tenderId,
        setLoading,
        setTenderDocuments,
        setTenderDocumentsSummary,
        refreshWorkspaceData,
    } = params;

    /** Loads documents and their summary counters for the active tender. */
    const loadDocuments = useCallback(async () => {
        if (!tenderId) return;
        try {
            setLoading("documents");
            const res = await getMepaTenderDocuments({ abortController, tenderId });
            setTenderDocuments(res?.data?.documents ?? []);
            setTenderDocumentsSummary(res?.data?.summary ?? null);
        } catch (error) {
            console.error(error);
            enqueueSnackbar?.("Non riesco a caricare i documenti della gara.", { variant: "warning" } as any);
        } finally {
            setLoading(null);
        }
    }, [abortController, setLoading, setTenderDocuments, setTenderDocumentsSummary, tenderId]);

    /**
     * Uploads user-selected files and forces workspace re-hydration afterwards.
     *
     * The forced refresh is required because upload processing can update not
     * only the document list, but also readiness, chunks and agent status.
     */
    const uploadWorkspaceDocuments = useCallback(async (files: File[]) => {
        if (!tenderId || !files.length) return;
        try {
            setLoading("documents-upload");
            const documents = await buildUploadDocumentsPayload(files);
            const res = await uploadMepaTenderDocuments({ abortController, tenderId, documents, forceRebuild: true });
            setTenderDocuments(res?.data?.documents ?? []);
            setTenderDocumentsSummary(res?.data?.summary ?? null);
            enqueueSnackbar?.(`${files.length} documento/i caricati ed elaborati dagli agent.`, { variant: "success" } as any);
            await refreshWorkspaceData(tenderId, { force: true });
        } catch (error) {
            console.error(error);
            enqueueSnackbar?.("Upload documenti non riuscito. Verifica dimensione file e service-ai.", { variant: "error" } as any);
        } finally {
            setLoading(null);
        }
    }, [abortController, refreshWorkspaceData, setLoading, setTenderDocuments, setTenderDocumentsSummary, tenderId]);

    /** Deletes a document and reconciles both local document state and workspace status. */
    const deleteWorkspaceDocument = useCallback(async (documentId: string) => {
        if (!tenderId || !documentId) return;
        try {
            setLoading(`document-delete-${documentId}`);
            const res = await deleteMepaTenderDocument({ abortController, tenderId, documentId });
            setTenderDocuments(res?.data?.documents ?? []);
            setTenderDocumentsSummary(res?.data?.summary ?? null);
            enqueueSnackbar?.("Documento rimosso dal workspace. Il dossier va considerato da verificare se era già stato usato dall'AI.", { variant: "success" } as any);
            await refreshWorkspaceData(tenderId, { force: true });
        } catch (error) {
            console.error(error);
            enqueueSnackbar?.("Non riesco a eliminare il documento selezionato.", { variant: "error" } as any);
        } finally {
            setLoading(null);
        }
    }, [abortController, refreshWorkspaceData, setLoading, setTenderDocuments, setTenderDocumentsSummary, tenderId]);

    return {
        loadDocuments,
        uploadWorkspaceDocuments,
        deleteWorkspaceDocument,
    };
}
