import { useMemo, useState } from "react";
import { FDBox, FDInput, FDSelect } from "@nex/fd-ui";
import type { GrantEffect, NavigationResource, PermissionGrant } from "../model/types";

interface Props {
    resources: NavigationResource[];
    directGrants: PermissionGrant[];
    selectedGroupName?: string;
    onGrantChange: (permission: string, effect: GrantEffect | null) => void;
}

type ResourceFilter = "ALL" | "GROUP" | "PANEL" | "ACTION" | "DATA_SCOPE";
type GrantAssignmentState = "NONE" | GrantEffect | "CONFLICT";

const typeOptions = [
    { value: "ALL", label: "Tutto" },
    { value: "GROUP", label: "Gruppi menu" },
    { value: "PANEL", label: "Pannelli" },
    { value: "ACTION", label: "Azioni" },
    { value: "DATA_SCOPE", label: "Data scope" },
] satisfies Array<{ value: ResourceFilter; label: string }>;

const resourceTone: Record<string, string> = {
    GROUP: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200",
    PANEL: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-200",
    ACTION: "bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-200",
    DATA_SCOPE: "bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-200",
};

function getGrantState(grants: PermissionGrant[], permission: string): GrantAssignmentState {
    const matching = grants.filter((grant) => grant.permission === permission);
    const hasAllow = matching.some((grant) => grant.effect === "ALLOW");
    const hasDeny = matching.some((grant) => grant.effect === "DENY");

    if (hasAllow && hasDeny) return "CONFLICT";
    if (hasAllow) return "ALLOW";
    if (hasDeny) return "DENY";
    return "NONE";
}

function stateLabel(state: GrantAssignmentState): string {
    if (state === "ALLOW") return "Assegnato: ALLOW";
    if (state === "DENY") return "Assegnato: DENY";
    if (state === "CONFLICT") return "Conflitto ALLOW/DENY";
    return "Non assegnato";
}

function stateTone(state: GrantAssignmentState): string {
    if (state === "ALLOW") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200";
    if (state === "DENY") return "bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-200";
    if (state === "CONFLICT") return "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-200";
    return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200";
}

function actionButtonClass(active: boolean, tone: "neutral" | "allow" | "deny") {
    const base = "min-h-10 rounded-xl border px-3 py-2 text-xs font-black transition-colors";
    if (active && tone === "allow") return `${base} border-emerald-500 bg-emerald-600 text-white shadow-sm`;
    if (active && tone === "deny") return `${base} border-red-500 bg-red-600 text-white shadow-sm`;
    if (active) return `${base} border-neutral-500 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950`;
    return `${base} border-neutral-200 bg-white/70 text-neutral-600 hover:border-neutral-400 hover:text-neutral-950 dark:border-neutral-800 dark:bg-neutral-950/50 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:text-white`;
}

export function ResourceLibraryPanel({ resources, directGrants, selectedGroupName, onGrantChange }: Props) {
    const [query, setQuery] = useState("");
    const [type, setType] = useState<ResourceFilter>("ALL");
    const normalizedQuery = query.trim().toLowerCase();

    const grantStateByPermission = useMemo(() => {
        const map = new Map<string, GrantAssignmentState>();
        for (const resource of resources) {
            if (resource.permission) {
                map.set(resource.permission, getGrantState(directGrants, resource.permission));
            }
        }
        return map;
    }, [directGrants, resources]);

    const filtered = useMemo(() => resources.filter((resource) => {
        if (type !== "ALL" && resource.type !== type) return false;
        if (!normalizedQuery) return true;
        return `${resource.name} ${resource.permission} ${resource.key} ${resource.context?.route ?? resource.route ?? ""}`.toLowerCase().includes(normalizedQuery);
    }), [normalizedQuery, resources, type]);

    return (
        <div className="flex h-full min-h-0 flex-col gap-4">
            <FDBox variant="gradient-simple" radius="2xl" pad="sm" border className="text-xs font-semibold leading-5 text-neutral-600 dark:text-neutral-300">
                Gestione tri-state sul gruppo selezionato: ogni risorsa può essere non assegnata, ALLOW oppure DENY. ALLOW e DENY sono mutuamente esclusivi per evitare duplicati e stati ambigui.
            {selectedGroupName ? (
                    <span className="mt-2 block text-[0.7rem] font-black uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">Gruppo: {selectedGroupName}</span>
                ) : null}
            </FDBox>

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
                    ) : filtered.map((resource) => {
                        const state = resource.permission ? grantStateByPermission.get(resource.permission) ?? "NONE" : "NONE";
                        const disabled = !resource.permission;

                        return (
                            <FDBox
                                variant="gradient-simple"
                                radius="2xl"
                                pad="sm"
                                border
                                key={resource._id}
                                className={state === "CONFLICT" ? "border-amber-300 dark:border-amber-700" : undefined}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`rounded-full px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] ${resourceTone[resource.type] ?? "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"}`}>{resource.type}</span>
                                            <span className="truncate text-xs font-bold text-neutral-500">{resource.appId}</span>
                                            <span className={`rounded-full px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] ${stateTone(state)}`}>{stateLabel(state)}</span>
                                        </div>
                                        <strong className="mt-2 block truncate text-base font-black tracking-tight">{resource.name}</strong>
                                        {resource.permission ? (
                                            <code className="mt-2 block truncate rounded-xl bg-neutral-100 px-3 py-2 text-xs font-bold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">{resource.permission}</code>
                                        ) : (
                                            <small className="mt-2 block rounded-xl border border-dashed border-neutral-300 px-3 py-2 text-xs font-bold text-neutral-500 dark:border-neutral-700">Risorsa senza permission: non assegnabile come grant.</small>
                                        )}
                                        {resource.context?.route || resource.route ? <small className="mt-2 block truncate text-xs font-semibold text-neutral-500">{resource.context?.route ?? resource.route}</small> : null}
                                    </div>
                                </div>

                                <div className="mt-3 grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        disabled={disabled}
                                        className={actionButtonClass(state === "NONE", "neutral")}
                                        onClick={() => onGrantChange(resource.permission, null)}
                                    >
                                        Non assegnato
                                    </button>
                                    <button
                                        type="button"
                                        disabled={disabled}
                                        className={actionButtonClass(state === "ALLOW", "allow")}
                                        onClick={() => onGrantChange(resource.permission, "ALLOW")}
                                    >
                                        ALLOW
                                    </button>
                                    <button
                                        type="button"
                                        disabled={disabled}
                                        className={actionButtonClass(state === "DENY", "deny")}
                                        onClick={() => onGrantChange(resource.permission, "DENY")}
                                    >
                                        DENY
                                    </button>
                                </div>
                            </FDBox>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
