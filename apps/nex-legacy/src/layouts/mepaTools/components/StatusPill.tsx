const STYLES: Record<string, string> = {
    DRAFT: "bg-neutral-100 text-neutral-700 border-neutral-200",
    DOCUMENTS_UPLOADED: "bg-sky-50 text-sky-700 border-sky-100",
    ANALYSIS_RUNNING: "bg-indigo-50 text-indigo-700 border-indigo-100",
    READY_FOR_REVIEW: "bg-violet-50 text-violet-700 border-violet-100",
    READY_FOR_QUOTATION: "bg-emerald-50 text-emerald-700 border-emerald-100",
    QUOTATION_CREATED: "bg-blue-50 text-blue-700 border-blue-100",
    CLOSED: "bg-slate-100 text-slate-700 border-slate-200",
};

/**
 * Normalized tender status badge.
 *
 * Unknown statuses intentionally fall back to a neutral style. This allows the
 * backend to introduce new workflow states without breaking older front-end
 * bundles during a rolling deployment.
 */
export function StatusPill({ value }: { value: string }) {
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${STYLES[value] ?? STYLES.DRAFT}`}>
            {value.replaceAll("_", " ")}
        </span>
    );
}
