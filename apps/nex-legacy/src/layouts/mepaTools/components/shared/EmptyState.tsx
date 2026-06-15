type EmptyStateProps = {
    /**
     * Empty-state message rendered inside the feature surface.
     *
     * Keep the message operational and actionable: users should understand why
     * the area is empty and what the next possible step is.
     */
    text: string;
};

/**
 * Shared empty state for MEPA tabs.
 *
 * The component is intentionally presentation-only. It does not decide whether
 * an empty state is caused by loading, filters, missing permissions or missing
 * data; those decisions are owned by the feature that has the necessary domain
 * context.
 */
export function EmptyState({ text }: EmptyStateProps) {
    return <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-neutral-950 dark:text-neutral-400">{text}</p>;
}
