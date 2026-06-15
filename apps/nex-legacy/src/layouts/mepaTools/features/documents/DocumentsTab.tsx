import React, { useRef } from "react";
import { FiAlertTriangle, FiCheckCircle, FiFileText, FiRefreshCw, FiTrash2, FiUploadCloud } from "react-icons/fi";
import { Panel } from "../../components/shared/Panel";
import { InfoMini } from "../../components/shared/InfoMini";
import { documentStatusBadgeClass } from "../../utils/status";
import { formatDate, formatFileSize } from "../../utils/formatters";
import type { MepaTenderDocument, MepaTenderDocumentsSummary } from "../../types";

/**
 * Documents workspace tab.
 *
 * The component owns only the rendering and browser-file selection of the document registry.
 * Fetching, upload/delete side effects and workspace refresh remain owned by the page/container
 * layer, keeping this tab cheap to render and safe to memoize or lazy-load in later phases.
 */
export const DocumentsTab = React.memo(function DocumentsTab(props: any) {
    // Hidden native file input. A ref is preferable to state here because selecting
    // files is an imperative browser action and should not re-render the table.
    const inputRef = useRef<HTMLInputElement | null>(null);
    // Controller-provided read model. The array guard keeps the tab resilient while
    // the workspace is refreshing or while old tenders without documents are opened.
    const documents: MepaTenderDocument[] = Array.isArray(props.tenderDocuments) ? props.tenderDocuments : [];
    // Prefer the backend/controller summary when available. The fallback keeps the UI
    // useful during partial refreshes and protects older API responses that did not
    // yet expose an aggregated summary.
    const summary: MepaTenderDocumentsSummary = props.tenderDocumentsSummary ?? {
        total: documents.filter((doc) => doc.processingStatus !== "DELETED" && doc.processingStatus !== "SUPERSEDED").length,
        processed: documents.filter((doc) => doc.processingStatus === "PROCESSED").length,
        processing: documents.filter((doc) => ["UPLOADED", "PROCESSING"].includes(doc.processingStatus)).length,
        failed: documents.filter((doc) => doc.processingStatus === "FAILED").length,
        deleted: documents.filter((doc) => doc.processingStatus === "DELETED").length,
        chunks: documents.reduce((sum, doc) => sum + Number(doc.chunkCount ?? doc.extraction?.indexedChunks ?? doc.extraction?.chunkCount ?? 0), 0),
        stale: documents.some((doc) => ["UPLOADED", "PROCESSING", "FAILED"].includes(doc.processingStatus)),
    };

    // The full registry may include deleted entries for audit, but the operational
    // tab lists active/superseded-visible documents only. This mirrors the UI
    // expectation without mutating the controller state.
    const activeDocuments = documents.filter((doc) => doc.processingStatus !== "DELETED");

    // Reads the selected FileList and immediately clears the input value. Clearing is
    // required so the same file can be uploaded again after a failed attempt.
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);
        event.target.value = "";
        if (files.length) void props.onUploadDocuments?.(files);
    };

    return (
        <div className="flex flex-col gap-5">
            <Panel title="Documenti della gara" icon={<FiFileText className="text-blue-500" />}>
                <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="max-w-4xl text-sm leading-6 text-slate-600 dark:text-neutral-300">
                            Registro operativo dei documenti collegati alla pratica. Ogni file viene tracciato nel service-ai, elaborato dagli agent e collegato ai chunk RAG usati da dossier e chat documentale.
                        </p>
                        {summary.stale && (
                            <p className="mt-2 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                                Il set documentale contiene file non elaborati, in errore o modificati: il dossier potrebbe non essere pienamente aggiornato.
                            </p>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <input ref={inputRef} type="file" multiple className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.xml,.zip,application/pdf" onChange={handleInputChange} />
                        <button type="button" onClick={() => inputRef.current?.click()} disabled={props.loading === "documents-upload"} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                            <FiUploadCloud /> Carica documenti
                        </button>
                        <button type="button" onClick={props.onLoadDocuments} disabled={props.loading === "documents"} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
                            <FiRefreshCw /> Aggiorna
                        </button>
                    </div>
                </div>

                <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
                    <InfoMini label="Documenti attivi" value={String(summary.total)} />
                    <InfoMini label="Elaborati" value={String(summary.processed)} />
                    <InfoMini label="In lavorazione" value={String(summary.processing)} />
                    <InfoMini label="Errori" value={String(summary.failed)} />
                    <InfoMini label="Chunk RAG" value={String(summary.chunks)} />
                </div>

                {activeDocuments.length ? (
                    <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-neutral-800">
                        <div className="hidden bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.08em] text-slate-400 dark:bg-neutral-950 lg:grid lg:grid-cols-[minmax(0,1.5fr)_140px_140px_120px_160px_120px]">
                            <span>Documento</span>
                            <span>Tipo</span>
                            <span>Stato agent</span>
                            <span>Chunk</span>
                            <span>Upload</span>
                            <span className="text-right">Azioni</span>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-neutral-800">
                            {activeDocuments.map((doc) => {
                                // Per-row derived fields are kept local to avoid
                                // pushing table-specific presentation state into
                                // the document controller.
                                const status = String(doc.processingStatus ?? "UPLOADED").toUpperCase();
                                const processed = Boolean(doc.processedByAgents || status === "PROCESSED");
                                const chunks = Number(doc.chunkCount ?? doc.extraction?.indexedChunks ?? doc.extraction?.chunkCount ?? 0);
                                return (
                                    <div key={doc.documentId} className="grid gap-3 px-4 py-4 text-sm lg:grid-cols-[minmax(0,1.5fr)_140px_140px_120px_160px_120px] lg:items-center">
                                        <div className="min-w-0">
                                            <div className="flex min-w-0 items-center gap-2">
                                                {processed ? <FiCheckCircle className="shrink-0 text-emerald-500" /> : <FiAlertTriangle className="shrink-0 text-amber-500" />}
                                                <p className="truncate font-bold text-slate-900 dark:text-neutral-100">{doc.documentTitle ?? doc.originalFileName ?? doc.documentId}</p>
                                            </div>
                                            <p className="mt-1 truncate text-xs text-slate-500 dark:text-neutral-400">{doc.originalFileName ?? doc.storageKey ?? doc.documentId}</p>
                                            <p className="mt-1 text-xs text-slate-400">{formatFileSize(doc.sizeBytes)} · v{doc.version ?? 1}</p>
                                            {doc.extraction?.error && <p className="mt-2 text-xs text-red-600 dark:text-red-300">{doc.extraction.error}</p>}
                                        </div>
                                        <div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">{doc.documentType ?? "GARA_UPLOAD"}</span></div>
                                        <div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${documentStatusBadgeClass(status)}`}>{processed ? "Elaborato" : status}</span></div>
                                        <div className="text-sm font-bold text-slate-700 dark:text-neutral-200">{chunks}</div>
                                        <div className="text-xs text-slate-500 dark:text-neutral-400">{formatDate(doc.uploadedAt ?? doc.createdAt)}</div>
                                        <div className="flex justify-end gap-2">
                                            <button type="button" onClick={() => props.onDeleteDocument?.(doc.documentId)} disabled={props.loading === `document-delete-${doc.documentId}`} className="inline-flex items-center gap-2 rounded-xl border border-red-100 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-950/30">
                                                <FiTrash2 /> Elimina
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-neutral-700 dark:bg-neutral-950">
                        <FiFileText className="mx-auto mb-3 text-3xl text-slate-300" />
                        <p className="font-bold text-slate-700 dark:text-neutral-200">Nessun documento registrato nel workspace</p>
                        <p className="mt-2 text-sm text-slate-500 dark:text-neutral-400">Carica capitolato, disciplinare, allegati tecnici, chiarimenti o rettifiche per alimentare il Dossier AI.</p>
                        <button type="button" onClick={() => inputRef.current?.click()} className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white"><FiUploadCloud /> Carica primo documento</button>
                    </div>
                )}
            </Panel>
        </div>
    );
});
