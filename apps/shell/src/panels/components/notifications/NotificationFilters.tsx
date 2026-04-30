import React from "react";
import { FDButton } from "@nex/fd-ui";
import type { FilterKey } from "./shared";

export type FilterDefinition = {
    key: FilterKey;
    label: string;
};

export default function NotificationFilters({
    activeFilter,
    definitions,
    counters,
    onChange,
}: {
    activeFilter: FilterKey;
    definitions: FilterDefinition[];
    counters: Record<FilterKey, number>;
    onChange: (key: FilterKey) => void;
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {definitions.map((definition) => {
                const selected = definition.key === activeFilter;
                return (
                    <FDButton
                        key={definition.key}
                        variant={selected ? "soft" : "ghost"}
                        color={selected ? "primary" : "neutral"}
                        size="small"
                        className="!rounded-full"
                        onClick={() => onChange(definition.key)}
                    >
                        <span className="inline-flex items-center gap-2">
                            <span>{definition.label}</span>
                            <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-semibold dark:bg-white/10">{counters[definition.key]}</span>
                        </span>
                    </FDButton>
                );
            })}
        </div>
    );
}
