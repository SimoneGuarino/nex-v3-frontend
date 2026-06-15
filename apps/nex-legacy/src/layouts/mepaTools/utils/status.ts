import type { MepaRetrievalProvider } from "../types";

/**
 * Maps retrieval provider enum values to short labels used in diagnostics.
 */
export function providerLabel(provider?: MepaRetrievalProvider) {
    if (provider === "VESPA") return "VESPA";
    if (provider === "MONGO_FALLBACK") return "Mongo fallback";
    if (provider === "MONGO_ONLY") return "Mongo only";
    return "Provider n.d.";
}

/**
 * Maps retrieval provider enum values to badge styles.
 */
export function providerBadgeClass(provider?: MepaRetrievalProvider) {
    if (provider === "VESPA") return "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900";
    if (provider === "MONGO_FALLBACK") return "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900";
    return "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700";
}

/**
 * Maps criticality severity to a badge style.
 */
export function severityClass(value?: string) {
    const normalized = String(value ?? "").toUpperCase();
    if (normalized === "HIGH") return "bg-red-50 text-red-700 ring-red-100 dark:bg-red-950/30 dark:text-red-200 dark:ring-red-900";
    if (normalized === "MEDIUM") return "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-900";
    return "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700";
}

/**
 * Maps overall readiness status to a badge style.
 */
export function readinessBadgeClass(status?: string) {
    if (status === "READY") return "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900";
    if (status === "READY_WITH_WARNINGS") return "bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900";
    return "bg-red-50 text-red-700 ring-red-100 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900";
}

/**
 * Maps individual readiness check status to a card style.
 */
export function readinessChecklistClass(status?: string) {
    if (status === "OK") return "border-emerald-100 bg-emerald-50/60 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200";
    if (status === "WARNING") return "border-amber-100 bg-amber-50/60 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200";
    return "border-red-100 bg-red-50/60 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200";
}

/**
 * Maps individual readiness check status to a short label.
 */
export function readinessChecklistLabel(status?: string) {
    if (status === "OK") return "OK";
    if (status === "WARNING") return "Warning";
    return "Blocco";
}

/**
 * Maps document ingestion/indexing status to a badge style.
 */
export function documentStatusBadgeClass(status?: string) {
    const normalized = String(status ?? "").toUpperCase();
    if (["PROCESSED", "READY", "COMPLETED"].includes(normalized)) return "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-200 dark:ring-emerald-900/40";
    if (["PROCESSING", "INDEXING", "UPLOADED"].includes(normalized)) return "bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-950/30 dark:text-blue-200 dark:ring-blue-900/40";
    if (["FAILED", "ERROR"].includes(normalized)) return "bg-red-50 text-red-700 ring-red-100 dark:bg-red-950/30 dark:text-red-200 dark:ring-red-900/40";
    return "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700";
}

/**
 * Maps agent execution status to a badge style.
 */
export function agentStatusClass(status?: string) {
    const normalized = String(status ?? "").toUpperCase();
    if (["COMPLETED", "SUCCESS"].includes(normalized)) return "bg-emerald-50 text-emerald-700 ring-emerald-100";
    if (["RUNNING", "QUEUED", "PENDING"].includes(normalized)) return "bg-blue-50 text-blue-700 ring-blue-100";
    if (["FAILED", "ERROR"].includes(normalized)) return "bg-red-50 text-red-700 ring-red-100";
    return "bg-slate-100 text-slate-600 ring-slate-200";
}
