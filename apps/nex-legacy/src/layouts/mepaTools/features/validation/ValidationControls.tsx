import React from "react";
import { InfoMini } from "../../components/shared/InfoMini";
import { severityClass } from "../../utils/status";

/**
 * Compact validation card for a single AI-generated criticality.
 *
 * The card deliberately receives a loose `item` because dossier sections may be
 * produced by different agents over time. The component normalizes only the
 * fields it needs for display and delegates governance decisions to the parent
 * through `onValidate`.
 */
export function CriticalityCard({ item, targetId, onValidate }: { item: any; targetId?: string; onValidate?: (params: any) => void }) {
    const severity = String(item?.severity ?? item?.priority ?? "MEDIUM").toUpperCase();
    const id = targetId ?? String(item?.id ?? item?.key ?? item?.title ?? "criticality");

    return (
        <div className="mb-2 rounded-2xl border border-slate-100 p-3 text-sm dark:border-neutral-800">
            <div className="flex items-start justify-between gap-3">
                <p className="font-semibold">{item?.title ?? "Criticità"}</p>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${severityClass(severity)}`}>{severity}</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-neutral-400">{item?.description ?? item?.rationale ?? "Dettaglio non disponibile."}</p>
            <EvidenceHint evidenceRefs={item?.evidenceRefs} />
            <ValidationActions status={item?.validationStatus} targetType="CRITICALITY" targetId={id} onValidate={onValidate} />
        </div>
    );
}

/**
 * Compact validation card for one suggested operational action.
 *
 * Suggested actions are not automatically applied: the card exposes validate,
 * review and reject decisions so human-in-the-loop governance remains explicit.
 */
export function ActionCard({ item, targetId, onValidate }: { item: any; targetId?: string; onValidate?: (params: any) => void }) {
    const priority = String(item?.priority ?? "MEDIUM").toUpperCase();
    const id = targetId ?? String(item?.id ?? item?.key ?? item?.title ?? "action");

    return (
        <div className="mb-2 rounded-2xl border border-slate-100 p-3 text-sm dark:border-neutral-800">
            <div className="flex items-start justify-between gap-3">
                <p className="font-semibold">{item?.title ?? "Azione suggerita"}</p>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${severityClass(priority)}`}>{priority}</span>
            </div>
            <p className="mt-1 text-xs font-medium text-slate-500">Owner: {item?.ownerRole ?? "UFFICIO_GARE"}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-neutral-400">{item?.rationale ?? item?.description ?? "Dettaglio non disponibile."}</p>
            <ValidationActions status={item?.validationStatus} targetType="SUGGESTED_ACTION" targetId={id} onValidate={onValidate} />
        </div>
    );
}

/**
 * Small aggregate strip for human validation progress.
 *
 * It is intentionally presentation-only: totals are read from backend/read
 * model data and never recalculated here, avoiding UI/business-rule drift.
 */
export function ValidationSummary({ summary }: { summary?: { total?: number; validated?: number; corrected?: number; rejected?: number; needsReview?: number } }) {
    const total = summary?.total ?? 0;

    return (
        <div className="grid grid-cols-2 gap-2 text-xs">
            <InfoMini label="Totale" value={String(total)} />
            <InfoMini label="Validate" value={String(summary?.validated ?? 0)} />
            <InfoMini label="Corrette" value={String(summary?.corrected ?? 0)} />
            <InfoMini label="Rigettate" value={String(summary?.rejected ?? 0)} />
        </div>
    );
}

/**
 * Visual status badge for AI/human validation state.
 *
 * Unknown states fall back to a neutral style so newly introduced backend states
 * do not break rendering during progressive deployments.
 */
export function ValidationStatusBadge({ value }: { value?: string }) {
    const normalized = String(value ?? "AI_PROPOSED").toUpperCase();
    const cls = normalized === "VALIDATED" ? "bg-emerald-50 text-emerald-700" : normalized === "CORRECTED" ? "bg-blue-50 text-blue-700" : normalized === "REJECTED" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600";

    return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${cls}`}>{normalized}</span>;
}

/**
 * Reusable action bar for human-in-the-loop validation.
 *
 * `targetType`, `targetId` and optional `sectionKey` are passed through without
 * interpretation. This makes the component reusable for criticalities, actions,
 * product rows and future AI outputs while keeping backend validation contracts
 * centralized in the controller/container.
 */
export function ValidationActions({ status, targetType, targetId, sectionKey, onValidate }: { status?: string; targetType: string; targetId: string; sectionKey?: string | null; onValidate?: (params: any) => void }) {
    if (!onValidate) return null;
    const normalized = String(status ?? "AI_PROPOSED").toUpperCase();

    return (
        <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={normalized === "VALIDATED"} onClick={() => onValidate({ targetType, targetId, sectionKey, decision: "VALIDATED" })} className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40">Valida</button>
            <button type="button" onClick={() => onValidate({ targetType, targetId, sectionKey, decision: "NEEDS_REVIEW" })} className="rounded-xl border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:border-amber-900 dark:text-amber-200">Da revisionare</button>
            <button type="button" onClick={() => onValidate({ targetType, targetId, sectionKey, decision: "REJECTED" })} className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 dark:border-red-900 dark:text-red-200">Rigetta</button>
        </div>
    );
}

/**
 * Renders the first available evidence reference as an interactive source link.
 *
 * The component communicates with the global evidence controller through a
 * custom DOM event. That keeps deeply nested dossier/product cards decoupled
 * from modal state and avoids prop-drilling evidence handlers through every tab.
 */
export function EvidenceHint({ evidenceRefs }: { evidenceRefs?: Array<Record<string, unknown>> }) {
    if (!Array.isArray(evidenceRefs) || !evidenceRefs.length) return null;
    const first = evidenceRefs[0];
    const chunkId = first?.chunkId ? String(first.chunkId) : "";
    const label = `${String(first.documentTitle ?? first.documentId ?? "documento")} ${first.page ? `· pag. ${first.page}` : ""} ${chunkId ? `· chunk ${chunkId.slice(0, 8)}` : ""}`;

    if (!chunkId) return <p className="mt-2 text-[11px] text-blue-600 dark:text-blue-300">Fonte: {label}</p>;

    return (
        <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("nex:mepa:evidence:open", { detail: { chunkId } }))}
            className="mt-2 text-left text-[11px] font-semibold text-blue-600 underline-offset-2 hover:underline dark:text-blue-300"
        >
            Fonte: {label}
        </button>
    );
}
