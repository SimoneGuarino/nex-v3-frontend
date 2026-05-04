import React from "react";
import { cn } from "../../helpers/panelUtils";

type SectionHeaderProps = {
    title: React.ReactNode;
    description?: React.ReactNode;
    rightContent?: React.ReactNode;
    dotClassName?: string;
    showDot?: boolean;
    className?: string;
};

export const SectionHeader: React.FC<SectionHeaderProps> = ({
    title,
    description,
    rightContent,
    dotClassName = "bg-sky-500",
    showDot = true,
    className,
}) => (
    <div
        className={cn(
            "px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-800/70 flex items-start justify-between gap-3",
            className
        )}
    >
        <div className="min-w-0">
            <div className="flex items-center gap-2">
                {showDot && <span className={cn("inline-flex h-2 w-2 rounded-full", dotClassName)} />}
                <h3 className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-50 truncate">{title}</h3>
            </div>

            {description && (
                <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2">
                    {description}
                </p>
            )}
        </div>

        {rightContent}
    </div>
);

