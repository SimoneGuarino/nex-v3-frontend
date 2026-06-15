import React from "react";
import { FiAlertTriangle, FiArchive, FiCheckCircle, FiCode, FiFile, FiFileText, FiGrid, FiImage, FiTrash2 } from "react-icons/fi";
import type { MepaTenderDocument } from "../../types";
import { formatDate, formatFileSize } from "../../utils/formatters";
import { documentStatusBadgeClass } from "../../utils/status";

type DocumentVisualTone = "red" | "blue" | "emerald" | "teal" | "amber" | "purple" | "violet" | "slate";

type DocumentVisual = {
    extension: string;
    label: string;
    tone: DocumentVisualTone;
    Icon: React.ComponentType<{ className?: string }>;
};

/**
 * Design-token map for file visual identity.
 *
 * Keeping color classes centralized prevents scattered Tailwind strings and makes
 * it easy to add new extensions without touching the row rendering logic.
 */
const DOCUMENT_VISUAL_TONE_CLASSES: Record<DocumentVisualTone, { shell: string; icon: string; badge: string }> = {
    red: {
        shell: "bg-red-50 text-red-600 ring-red-100 dark:bg-red-950/30 dark:text-red-300 dark:ring-red-900/40",
        icon: "text-red-600 dark:text-red-300",
        badge: "bg-red-50 text-red-700 ring-red-100 dark:bg-red-950/30 dark:text-red-200 dark:ring-red-900/40",
    },
    blue: {
        shell: "bg-blue-50 text-blue-600 ring-blue-100 dark:bg-blue-950/30 dark:text-blue-300 dark:ring-blue-900/40",
        icon: "text-blue-600 dark:text-blue-300",
        badge: "bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-950/30 dark:text-blue-200 dark:ring-blue-900/40",
    },
    emerald: {
        shell: "bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-900/40",
        icon: "text-emerald-600 dark:text-emerald-300",
        badge: "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-200 dark:ring-emerald-900/40",
    },
    teal: {
        shell: "bg-teal-50 text-teal-600 ring-teal-100 dark:bg-teal-950/30 dark:text-teal-300 dark:ring-teal-900/40",
        icon: "text-teal-600 dark:text-teal-300",
        badge: "bg-teal-50 text-teal-700 ring-teal-100 dark:bg-teal-950/30 dark:text-teal-200 dark:ring-teal-900/40",
    },
    amber: {
        shell: "bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900/40",
        icon: "text-amber-600 dark:text-amber-300",
        badge: "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-900/40",
    },
    purple: {
        shell: "bg-purple-50 text-purple-600 ring-purple-100 dark:bg-purple-950/30 dark:text-purple-300 dark:ring-purple-900/40",
        icon: "text-purple-600 dark:text-purple-300",
        badge: "bg-purple-50 text-purple-700 ring-purple-100 dark:bg-purple-950/30 dark:text-purple-200 dark:ring-purple-900/40",
    },
    violet: {
        shell: "bg-violet-50 text-violet-600 ring-violet-100 dark:bg-violet-950/30 dark:text-violet-300 dark:ring-violet-900/40",
        icon: "text-violet-600 dark:text-violet-300",
        badge: "bg-violet-50 text-violet-700 ring-violet-100 dark:bg-violet-950/30 dark:text-violet-200 dark:ring-violet-900/40",
    },
    slate: {
        shell: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700",
        icon: "text-slate-600 dark:text-neutral-300",
        badge: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700",
    },
};

/** Normalizes backend counters that may arrive as string, number or undefined. */
function compactCount(value: unknown, fallback = 0) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
}

/** Returns a lowercase extension without the leading dot. */
function normalizeExtension(value?: string | null) {
    return String(value ?? "").trim().replace(/^\./, "").toLowerCase();
}

/**
 * Selects the most human-readable filename available.
 *
 * The fallback chain is intentionally defensive because historical documents can
 * be stored with different metadata depending on upload version or migration path.
 */
function getDocumentFileName(doc: MepaTenderDocument) {
    return String(doc.documentTitle ?? doc.originalFileName ?? doc.normalizedFileName ?? doc.storageKey ?? doc.documentId ?? doc._id ?? "Documento gara").trim();
}

/**
 * Best-effort extension inference for documents without a file suffix.
 *
 * This is presentation-only: it never changes the persisted document metadata.
 */
function getExtensionFromMimeType(mimeType?: string | null) {
    const normalized = String(mimeType ?? "").toLowerCase();
    if (!normalized) return "";
    if (normalized.includes("pdf")) return "pdf";
    if (normalized.includes("spreadsheet") || normalized.includes("excel")) return "xlsx";
    if (normalized.includes("csv")) return "csv";
    if (normalized.includes("word") || normalized.includes("officedocument.wordprocessing")) return "docx";
    if (normalized.includes("zip") || normalized.includes("compressed")) return "zip";
    if (normalized.includes("xml")) return "xml";
    if (normalized.includes("image/")) return normalized.split("/")[1] ?? "image";
    if (normalized.includes("plain")) return "txt";
    return "";
}

/**
 * Resolves the extension used by the Overview icon/badge.
 *
 * Order matters: explicit filenames are more reliable than MIME type, while MIME
 * type is a safe fallback for object-storage keys that do not include suffixes.
 */
export function getTenderDocumentExtension(doc: MepaTenderDocument) {
    const candidates = [doc.originalFileName, doc.normalizedFileName, doc.documentTitle, doc.storageKey]
        .map((value) => String(value ?? ""))
        .filter(Boolean);

    for (const candidate of candidates) {
        const cleanCandidate = candidate.split(/[?#]/)[0] ?? "";
        const match = cleanCandidate.match(/\.([a-zA-Z0-9]{2,8})$/);
        if (match?.[1]) return normalizeExtension(match[1]);
    }

    return getExtensionFromMimeType(doc.mimeType);
}

/** Maps a tender document to its icon, label and color tone. */
export function getTenderDocumentVisual(doc: MepaTenderDocument): DocumentVisual {
    const extension = getTenderDocumentExtension(doc);
    if (["pdf"].includes(extension)) return { extension, label: "PDF", tone: "red", Icon: FiFileText };
    if (["doc", "docx", "rtf", "odt"].includes(extension)) return { extension, label: extension.toUpperCase(), tone: "blue", Icon: FiFileText };
    if (["xls", "xlsx", "xlsm", "ods"].includes(extension)) return { extension, label: extension.toUpperCase(), tone: "emerald", Icon: FiGrid };
    if (["csv"].includes(extension)) return { extension, label: "CSV", tone: "teal", Icon: FiGrid };
    if (["zip", "rar", "7z"].includes(extension)) return { extension, label: extension.toUpperCase(), tone: "amber", Icon: FiArchive };
    if (["png", "jpg", "jpeg", "webp", "gif", "tif", "tiff"].includes(extension)) return { extension, label: extension.toUpperCase(), tone: "purple", Icon: FiImage };
    if (["xml", "json", "html", "htm"].includes(extension)) return { extension, label: extension.toUpperCase(), tone: "violet", Icon: FiCode };
    if (["txt", "log"].includes(extension)) return { extension, label: extension.toUpperCase(), tone: "slate", Icon: FiFileText };
    return { extension: extension || "file", label: extension ? extension.toUpperCase() : "FILE", tone: "slate", Icon: FiFile };
}

/** Determines whether the document is usable by downstream AI/RAG workflows. */
export function isTenderDocumentProcessed(doc: MepaTenderDocument) {
    return Boolean(doc.processedByAgents || String(doc.processingStatus ?? "").toUpperCase() === "PROCESSED");
}

/** Reads chunk counts from all known response shapes produced by service-ai. */
export function getTenderDocumentChunks(doc: MepaTenderDocument) {
    return compactCount(doc.chunkCount ?? doc.extraction?.indexedChunks ?? doc.extraction?.chunkCount, 0);
}

/** Timestamp used for stable latest-documents sorting. */
export function getTenderDocumentTimestamp(doc: MepaTenderDocument) {
    const raw = doc.uploadedAt ?? doc.createdAt ?? doc.updatedAt ?? "";
    const value = raw ? new Date(raw).getTime() : 0;
    return Number.isFinite(value) ? value : 0;
}

/**
 * Returns the most recent active documents for the compact Overview card.
 *
 * Deleted/superseded documents stay available in the full document registry, but
 * the Overview should focus on the current operational evidence set.
 */
export function getLatestActiveTenderDocuments(source: MepaTenderDocument[] = [], limit = 5): MepaTenderDocument[] {
    return [...source]
        .filter((doc) => !["DELETED", "SUPERSEDED"].includes(String(doc.processingStatus ?? "").toUpperCase()))
        .sort((a, b) => getTenderDocumentTimestamp(b) - getTenderDocumentTimestamp(a))
        .slice(0, limit);
}

/** Human label for the processing badge shown in compact rows. */
function getProcessingLabel(status: string, processed: boolean) {
    if (processed) return "Elaborato";
    if (status === "PROCESSING") return "In corso";
    if (status === "FAILED") return "Errore";
    if (status === "UPLOADED") return "Caricato";
    return status || "N.D.";
}

/** Small file-icon atom used by every Overview document row. */
function DocumentFileIcon({ visual }: { visual: DocumentVisual }) {
    const toneClasses = DOCUMENT_VISUAL_TONE_CLASSES[visual.tone];
    const Icon = visual.Icon;

    return (
        <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${toneClasses.shell}`} aria-hidden="true">
            <Icon className={`h-5 w-5 ${toneClasses.icon}`} />
            <span className={`absolute -bottom-1 left-1/2 max-w-[42px] -translate-x-1/2 truncate rounded-md px-1.5 py-0.5 text-[9px] font-black leading-none ring-1 ${toneClasses.badge}`}>
                {visual.label}
            </span>
        </div>
    );
}

/**
 * Compact responsive document preview row for the tender overview.
 *
 * Status and chunk badges are intentionally rendered below the file metadata on
 * narrow cards. This preserves filename readability on constrained layouts and
 * avoids the badge cluster stealing horizontal space from the primary content.
 */
export const OverviewDocumentPreviewRow = React.memo(function OverviewDocumentPreviewRow({ doc, onDelete, loading }: { doc: MepaTenderDocument; onDelete?: (documentId: string) => void; loading?: string | null }) {
    // All values below are derived once per row render to keep JSX readable and
    // prevent repeating defensive fallback logic in multiple markup locations.
    const status = String(doc.processingStatus ?? "UPLOADED").toUpperCase();
    const processed = isTenderDocumentProcessed(doc);
    const chunks = getTenderDocumentChunks(doc);
    const documentId = doc.documentId ?? doc._id ?? "";
    const isDeleting = Boolean(documentId && loading === `document-delete-${documentId}`);
    const visual = getTenderDocumentVisual(doc);
    const fileName = getDocumentFileName(doc);
    const processingLabel = getProcessingLabel(status, processed);

    return (
        <article className="group px-3 py-3 transition hover:bg-slate-50/80 dark:hover:bg-neutral-900/60">
            <div className="flex min-w-0 items-start gap-3">
                <DocumentFileIcon visual={visual} />

                <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex min-w-0 items-start gap-2">
                        {processed ? <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" /> : <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />}
                        <p className="min-w-0 flex-1 truncate text-sm font-black text-slate-900 dark:text-neutral-100" title={fileName}>{fileName}</p>
                    </div>

                    <div className="mt-1 grid min-w-0 gap-1 text-xs text-slate-500 dark:text-neutral-400">
                        <div className="truncate font-semibold uppercase tracking-[0.04em] text-slate-400 dark:text-neutral-500" title={doc.documentType ?? "GARA_UPLOAD"}>{doc.documentType ?? "GARA_UPLOAD"}</div>
                        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="shrink-0">{formatFileSize(doc.sizeBytes)}</span>
                            <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-neutral-700" aria-hidden="true" />
                            <span className="shrink-0">{formatDate(doc.uploadedAt ?? doc.createdAt)}</span>
                        </div>
                    </div>
                </div>

                {documentId && onDelete && (
                    <button
                        type="button"
                        onClick={() => onDelete(documentId)}
                        disabled={isDeleting}
                        aria-label={`Elimina documento ${fileName}`}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-red-100 text-red-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-950/30"
                    >
                        <FiTrash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 pl-14 sm:flex sm:flex-wrap sm:justify-start">
                <span className={`min-w-0 truncate rounded-full px-2.5 py-1 text-center text-[11px] font-black ring-1 ${documentStatusBadgeClass(status)}`} title={processingLabel}>{processingLabel}</span>
                <span className="min-w-0 truncate rounded-full bg-slate-100 px-2.5 py-1 text-center text-[11px] font-black text-slate-600 dark:bg-neutral-800 dark:text-neutral-300" title={`${chunks} chunk indicizzati`}>{chunks} chunk</span>
            </div>
        </article>
    );
});
