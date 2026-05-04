import React from "react";

type SectionKeyValueProps = {
    k: string;
    v: React.ReactNode;
};

export const SectionKeyValue: React.FC<SectionKeyValueProps> = ({ k, v }) => (
    <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] text-neutral-500 dark:text-neutral-400">{k}</span>
        <span className="text-[11px] font-medium text-neutral-900 dark:text-neutral-100 text-right break-words max-w-[65%]">
            {v}
        </span>
    </div>
);

