import React from "react";
import { cn } from "../../helpers/panelUtils";

export type SectionPillTone = "neutral" | "ok" | "warn";

const toneClassName: Record<SectionPillTone, string> = {
    ok: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-200",
    warn: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200",
    neutral:
        "bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300",
};

type SectionPillProps = {
    tone?: SectionPillTone;
    className?: string;
    children: React.ReactNode;
};

export const SectionPill: React.FC<SectionPillProps> = ({ tone = "neutral", className, children }) => (
    <span
        className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-[3px] text-[10px] font-medium",
            toneClassName[tone],
            className
        )}
    >
        {children}
    </span>
);

