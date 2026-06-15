import React from "react";
import { EmptyState } from "../../components/shared/EmptyState";
import { readinessBadgeClass, readinessChecklistClass, readinessChecklistLabel } from "../../utils/status";
import type { MepaTenderReadiness } from "../../types";

/**
 * Pre-quotation readiness widget.
 *
 * Readiness is derived server-side and only rendered here. This prevents the UI
 * from duplicating business rules that decide if a tender can move to quotation.
 */
/**
 * Readiness checklist for the selected MEPA workspace.
 *
 * The card intentionally renders server-produced readiness checks instead of
 * recomputing completeness on the client. This keeps business validation rules
 * in service-ai/backend and makes the UI resilient to new checklist items.
 */
export function ReadinessCard({ readiness }: { readiness?: MepaTenderReadiness | null }) {
    if (!readiness) return <EmptyState text="Readiness operativa non ancora calcolata. Aggiorna il workspace dopo il completamento dell'analisi." />;

    const primaryActions = readiness.nextRecommendedActions?.slice(0, 3) ?? [];
    const checklist = readiness.checklist ?? [];

    return (
        <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-neutral-800 dark:bg-neutral-950/70">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Stato pre-quotazione</p>
                        <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-neutral-100">{readiness.label}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${readinessBadgeClass(readiness.status)}`}>{readiness.status}</span>
                </div>
                <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span>Score operativo</span>
                        <span>{readiness.score}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white dark:bg-neutral-800">
                        <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(0, Math.min(100, readiness.score))}%` }} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
                {checklist.map((item) => (
                    <div key={item.key} className={`rounded-2xl border p-3 ${readinessChecklistClass(item.status)}`}>
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold">{item.label}</p>
                                <p className="mt-1 text-xs leading-5 opacity-80">{item.description}</p>
                            </div>
                            <span className="shrink-0 rounded-full bg-white/70 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] dark:bg-neutral-900/70">{readinessChecklistLabel(item.status)}</span>
                        </div>
                    </div>
                ))}
            </div>

            {primaryActions.length > 0 && (
                <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Prossime azioni</p>
                    <ul className="space-y-2 text-sm text-slate-600 dark:text-neutral-300">
                        {primaryActions.map((action, index) => <li key={`${action}-${index}`}>• {action}</li>)}
                    </ul>
                </div>
            )}
        </div>
    );
}
