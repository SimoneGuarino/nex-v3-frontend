import { useMemo, useState } from "react";
import { FDBox, FDButton, FDInput, FDSelect } from "@nex/fd-ui";
import type { NavigationResource } from "../model/types";

interface Props {
    resources: NavigationResource[];
    onGrant: (permission: string, effect?: "ALLOW" | "DENY") => void;
}

type ResourceFilter = "ALL" | "PANEL" | "ACTION" | "DATA_SCOPE";

const typeOptions = [
    { value: "ALL", label: "Tutto" },
    { value: "PANEL", label: "Pannelli" },
    { value: "ACTION", label: "Azioni" },
    { value: "DATA_SCOPE", label: "Data scope" },
] satisfies Array<{ value: ResourceFilter; label: string }>;

const resourceTone: Record<string, string> = {
    PANEL: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-200",
    ACTION: "bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-200",
    DATA_SCOPE: "bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-200",
};

export function ResourceLibraryPanel({ resources, onGrant }: Props) {
    const [query, setQuery] = useState("");
    const [type, setType] = useState<ResourceFilter>("ALL");
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = useMemo(() => resources.filter((resource) => {
        if (type !== "ALL" && resource.type !== type) return false;
        if (!normalizedQuery) return true;
        return `${resource.name} ${resource.permission} ${resource.key} ${resource.route ?? ""}`.toLowerCase().includes(normalizedQuery);
    }), [normalizedQuery, resources, type]);

    return (
        <div className="flex h-full min-h-0 flex-col gap-4">
            <div className="grid gap-3">
                <FDInput
                    label="Cerca risorsa"
                    animatedLabel={false}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cerca permission, pannello, route…"
                    clearable
                    fullWidth
                />
                <FDSelect
                    label="Tipo risorsa"
                    animatedLabel={false}
                    value={type}
                    options={typeOptions}
                    onChange={(value) => setType((value as ResourceFilter | null) ?? "ALL")}
                    fullWidth
                />
            </div>

            <div className="min-h-0 flex-1 overflow-auto pr-1">
                <div className="grid gap-3">
                    {filtered.length === 0 ? (
                        <FDBox variant="gradient-simple" radius="2xl" pad="md" border className="text-sm font-semibold text-neutral-500">
                            Nessuna risorsa trovata.
                        </FDBox>
                    ) : filtered.map((resource) => (
                        <FDBox variant="gradient-simple" radius="2xl" pad="sm" border key={resource._id}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`rounded-full px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] ${resourceTone[resource.type] ?? "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"}`}>{resource.type}</span>
                                        <span className="truncate text-xs font-bold text-neutral-500">{resource.appId}</span>
                                    </div>
                                    <strong className="mt-2 block truncate text-base font-black tracking-tight">{resource.name}</strong>
                                    <code className="mt-2 block truncate rounded-xl bg-neutral-100 px-3 py-2 text-xs font-bold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">{resource.permission}</code>
                                    {resource.route ? <small className="mt-2 block truncate text-xs font-semibold text-neutral-500">{resource.route}</small> : null}
                                </div>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                <FDButton size="small" radius="xl" color="success" variant="soft" onClick={() => onGrant(resource.permission, "ALLOW")}>
                                    ALLOW
                                </FDButton>
                                <FDButton size="small" radius="xl" color="error" variant="soft" onClick={() => onGrant(resource.permission, "DENY")}>
                                    DENY
                                </FDButton>
                            </div>
                        </FDBox>
                    ))}
                </div>
            </div>
        </div>
    );
}
