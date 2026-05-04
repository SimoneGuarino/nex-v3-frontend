import React from "react";
import { cn } from "../../helpers/panelUtils";

type SectionBlockProps = {
    title?: React.ReactNode;
    className?: string;
    titleClassName?: string;
    contentClassName?: string;
    children: React.ReactNode;
};

export const SectionBlock: React.FC<SectionBlockProps> = ({
    title,
    className,
    titleClassName,
    contentClassName,
    children,
}) => (
    <div
        className={cn(
            "rounded-xl border border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/60 dark:bg-neutral-900/40 p-3",
            className
        )}
    >
        {title && (
            <p
                className={cn(
                    "text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400",
                    titleClassName
                )}
            >
                {title}
            </p>
        )}
        <div className={cn(title ? "mt-2" : "", contentClassName)}>{children}</div>
    </div>
);

