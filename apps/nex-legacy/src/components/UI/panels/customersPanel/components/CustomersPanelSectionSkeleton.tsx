import React from "react";

export const CustomersPanelSectionSkeleton: React.FC = () => (
    <div className="rounded-2xl border border-neutral-200/70 dark:border-neutral-800/70 bg-white/60 dark:bg-neutral-900/40 p-4">
        <div className="h-3 w-40 rounded bg-neutral-200/70 dark:bg-neutral-800/70 animate-pulse" />
        <div className="mt-4 space-y-2">
            <div className="h-2 w-full rounded bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse" />
            <div className="h-2 w-5/6 rounded bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse" />
        </div>
    </div>
);

