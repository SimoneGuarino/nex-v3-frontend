import React from "react";
import {FDButton, type FDButtonProps } from "@nex/fd-ui";

const baseClassName =
    "inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-[11px] text-neutral-800 dark:text-neutral-200 shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition disabled:opacity-50 disabled:cursor-not-allowed";

export type SectionActionButtonProps = FDButtonProps;

export const SectionActionButton: React.FC<SectionActionButtonProps> = ({
    className,
    children,
    onClick,
    disabled,
    rightIcon
}) => (
    <FDButton
        variant="outline"
        onClick={onClick}
        radius="xl"
        color="neutral"
        size="small"
        className={className}
        disabled={disabled}
        rightIcon={rightIcon}
    >
        {children}
    </FDButton>
);

