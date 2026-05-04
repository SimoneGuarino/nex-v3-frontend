import React from "react";
import { cn } from "../../helpers/panelUtils";

const baseClassName =
    "rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/60 shadow-sm";

type SectionContainerProps = {
    children: React.ReactNode;
    clickable?: boolean;
    onActivate?: () => void;
    className?: string;
    clickableClassName?: string;
};

export const SectionContainer: React.FC<SectionContainerProps> = ({
    children,
    clickable = false,
    onActivate,
    className,
    clickableClassName = "cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/80 transition",
}) => {
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!clickable) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onActivate?.();
    };

    return (
        <div
            className={cn(baseClassName, clickable ? clickableClassName : "", className)}
            onClick={() => clickable && onActivate?.()}
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : undefined}
            onKeyDown={handleKeyDown}
        >
            {children}
        </div>
    );
};

