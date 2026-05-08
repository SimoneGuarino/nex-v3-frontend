import { useEffect, useMemo, useState, type ReactNode } from "react";
import { FDBox, FDButton } from "@nex/fd-ui";
import { MdAdd, MdBolt, MdFolder, MdRoute } from "react-icons/md";
import type { NavigationResource, NavigationResourceCreatePayload, NavigationResourcePatch, ResourceType } from "../model/types";

interface Props {
    resources: NavigationResource[];
    selectedResource: NavigationResource | null;
    onSelectResource: (id: string) => void;
    onCreateResource: (payload: NavigationResourceCreatePayload) => void;
    onUpdateResource: (resourceId: string, patch: NavigationResourcePatch) => void;
    onClearParent: (resourceId: string) => void;
    onDisableResource: (resourceId: string) => void;
}

const resourceTypes: ResourceType[] = ["GROUP", "PANEL", "ACTION", "DATA_SCOPE"];

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

function slugify(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9.]+/g, "_")
        .replace(/^_+|_+$/g, "") || `resource_${Date.now()}`;
}

function defaultPermission(type: ResourceType, key: string): string {
    const safeKey = slugify(key);
    if (type === "GROUP") return `ui.nav_group.${safeKey}.view`;
    if (type === "PANEL") return `ui.panel.${safeKey}.view`;
    if (type === "DATA_SCOPE") return `data_scope.${safeKey}`;
    return safeKey.includes(".") ? safeKey : `action.${safeKey}`;
}

function createDraftFrom(resource: NavigationResource | null): NavigationResourcePatch {
    return {
        appId: resource?.appId ?? "legacy",
        key: resource?.key ?? "",
        type: resource?.type ?? "PANEL",
        name: resource?.name ?? "",
        route: resource?.route ?? "",
        parentKey: resource?.parentKey ?? null,
        permission: resource?.permission ?? "",
        order: resource?.order ?? 0,
        status: resource?.status ?? "ACTIVE",
        meta: resource?.meta ?? {},
    };
}

function createEmptyDraft(type: ResourceType, resourcesCount: number, parentKey: string | null = null): NavigationResourceCreatePayload {
    return {
        appId: "legacy",
        key: "",
        type,
        name: "",
        route: type === "PANEL" ? "/legacy/" : "",
        parentKey,
        permission: "",
        order: resourcesCount * 10 + 10,
        status: "ACTIVE",
        meta: {},
    };
}

function canBeParent(resource: NavigationResource) {
    return resource.type === "GROUP" || resource.type === "PANEL";
}

function typeLabel(type: ResourceType | undefined) {
    if (type === "GROUP") return "Gruppo contenitore";
    if (type === "PANEL") return "Pannello / Route";
    if (type === "ACTION") return "Azione";
    if (type === "DATA_SCOPE") return "Data scope";
    return "Resource";
}

function normalizedCreateDraft(draft: NavigationResourceCreatePayload): NavigationResourceCreatePayload {
    const key = slugify(draft.key || draft.name);
    const type = draft.type || "PANEL";
    return {
        ...draft,
        key,
        type,
        route: type === "PANEL" ? (draft.route || "/legacy/") : (draft.route || ""),
        permission: draft.permission?.trim() || defaultPermission(type, key),
    };
}

export function NavigationResourceInspectorPanel({
    resources,
    selectedResource,
    onSelectResource,
    onCreateResource,
    onUpdateResource,
    onClearParent,
    onDisableResource,
}: Props) {
    const [query, setQuery] = useState("");
    const [draft, setDraft] = useState<NavigationResourcePatch>(() => createDraftFrom(selectedResource));
    const [createOpen, setCreateOpen] = useState(false);
    const [createDraft, setCreateDraft] = useState<NavigationResourceCreatePayload>(() => createEmptyDraft("GROUP", resources.length));

    useEffect(() => {
        setDraft(createDraftFrom(selectedResource));
    }, [selectedResource?._id]);

    const filteredResources = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        return resources
            .slice()
            .sort((a, b) => (a.appId || "").localeCompare(b.appId || "") || (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name))
            .filter((resource) => {
                if (!normalized) return true;
                return `${resource.appId} ${resource.key} ${resource.type} ${resource.name} ${resource.route ?? ""} ${resource.permission}`.toLowerCase().includes(normalized);
            })
            .slice(0, 250);
    }, [query, resources]);

    const selectedAppId = draft.appId ?? selectedResource?.appId ?? "legacy";
    const parentOptions = useMemo(() => resources.filter((resource) => (
        resource._id !== selectedResource?._id
        && resource.appId === selectedAppId
        && canBeParent(resource)
    )), [resources, selectedAppId, selectedResource?._id]);

    const createParentOptions = useMemo(() => resources.filter((resource) => (
        resource.appId === createDraft.appId
        && canBeParent(resource)
    )), [createDraft.appId, resources]);

    const canCreate = Boolean(createDraft.name?.trim() && (createDraft.key?.trim() || createDraft.name?.trim()));
    const canSave = Boolean(selectedResource && draft.name?.trim() && draft.key?.trim());

    const openCreate = (type: ResourceType) => {
        setCreateDraft(createEmptyDraft(type, resources.length, selectedResource && canBeParent(selectedResource) ? selectedResource.key : null));
        setCreateOpen(true);
    };

    return (
        <div className="flex h-full min-h-0 min-w-0 flex-col gap-4 overflow-hidden">
            <FDBox radius="2xl" border pad="md" className="bg-white/70 dark:bg-neutral-950/30">
                <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0">
                        <div className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">Navigation Engine</div>
                        <div className="mt-1 text-sm font-bold text-neutral-600 dark:text-neutral-300">
                            Crea gruppi contenitore, pannelli, azioni e sotto-gerarchie da MongoDB.
                        </div>
                    </div>
                    <div className="flex min-w-0 flex-wrap gap-2">
                        <FDButton size="small" radius="xl" variant="solid" color="primary" icon={<MdFolder />} onClick={() => openCreate("GROUP")}>
                            Gruppo
                        </FDButton>
                        <FDButton size="small" radius="xl" variant="outline" color="primary" icon={<MdRoute />} onClick={() => openCreate("PANEL")}>
                            Pannello
                        </FDButton>
                        <FDButton size="small" radius="xl" variant="outline" icon={<MdBolt />} onClick={() => openCreate("ACTION")}>
                            Azione
                        </FDButton>
                    </div>
                </div>
            </FDBox>

            {createOpen ? (
                <FDBox radius="2xl" border pad="md" shadow="lg" className="min-w-0 bg-blue-50/70 dark:bg-blue-950/20">
                    <div className="flex items-center gap-2 text-sm font-black">
                        <MdAdd /> Crea {typeLabel(createDraft.type)}
                    </div>
                    <ResourceForm
                        value={createDraft}
                        parentOptions={createParentOptions}
                        onChange={(patch) => setCreateDraft((current) => {
                            const next = { ...current, ...patch };
                            if ((patch.key !== undefined || patch.name !== undefined || patch.type !== undefined) && !current.permission?.trim()) {
                                const nextKey = slugify(next.key || next.name || "");
                                if (nextKey) next.permission = defaultPermission(next.type || "PANEL", nextKey);
                            }
                            return next;
                        })}
                    />
                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                        <FDButton size="small" radius="xl" variant="ghost" onClick={() => setCreateOpen(false)}>Annulla</FDButton>
                        <FDButton
                            size="small"
                            radius="xl"
                            color="primary"
                            variant="solid"
                            disabled={!canCreate}
                            onClick={() => {
                                onCreateResource(normalizedCreateDraft(createDraft));
                                setCreateOpen(false);
                                setCreateDraft(createEmptyDraft("GROUP", resources.length + 1));
                            }}
                        >
                            Crea
                        </FDButton>
                    </div>
                </FDBox>
            ) : null}

            <div className="grid min-h-0 min-w-0 flex-1 gap-4 xl:grid-cols-[minmax(220px,0.78fr)_minmax(0,1.22fr)]">
                <FDBox radius="2xl" border pad="sm" className="min-h-0 min-w-0 overflow-hidden bg-white/70 dark:bg-neutral-950/30">
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Cerca group, panel, key, permission..."
                        className="mb-3 w-full min-w-0 rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500 dark:border-neutral-800 dark:bg-neutral-900"
                    />
                    <div className="flex max-h-[34dvh] min-w-0 flex-col gap-2 overflow-auto pr-1 xl:max-h-none">
                        {filteredResources.map((resource) => (
                            <button
                                key={resource._id}
                                type="button"
                                onClick={() => onSelectResource(resource._id)}
                                className={cx(
                                    "min-w-0 rounded-2xl border px-3 py-2 text-left transition",
                                    selectedResource?._id === resource._id
                                        ? "border-blue-500 bg-blue-50 text-blue-950 dark:bg-blue-950/40 dark:text-blue-50"
                                        : "border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800",
                                )}
                            >
                                <div className="truncate text-sm font-black">{resource.name}</div>
                                <div className="mt-1 truncate text-[0.65rem] font-black uppercase tracking-[0.13em] text-neutral-500">{resource.appId} · {typeLabel(resource.type)} · {resource.key}</div>
                            </button>
                        ))}
                    </div>
                </FDBox>

                <FDBox radius="2xl" border pad="md" className="min-h-0 min-w-0 overflow-auto bg-white/70 dark:bg-neutral-950/30">
                    {selectedResource ? (
                        <>
                            <div className="mb-4 min-w-0">
                                <div className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">Inspector resource</div>
                                <div className="mt-1 break-words text-xl font-black">{selectedResource.name}</div>
                                <div className="mt-1 break-all text-xs font-bold text-neutral-500">{selectedResource.appId} · {selectedResource.key}</div>
                            </div>
                            <ResourceForm value={draft} parentOptions={parentOptions} onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))} />
                            <div className="mt-4 flex flex-wrap justify-end gap-2">
                                {selectedResource.parentKey ? (
                                    <FDButton size="small" radius="xl" variant="ghost" onClick={() => onClearParent(selectedResource._id)}>
                                        Rimuovi parent
                                    </FDButton>
                                ) : null}
                                <FDButton size="small" radius="xl" variant="ghost" onClick={() => onDisableResource(selectedResource._id)}>
                                    Disabilita
                                </FDButton>
                                <FDButton
                                    size="small"
                                    radius="xl"
                                    color="primary"
                                    variant="solid"
                                    disabled={!canSave}
                                    onClick={() => onUpdateResource(selectedResource._id, draft)}
                                >
                                    Salva draft
                                </FDButton>
                            </div>
                        </>
                    ) : (
                        <div className="grid h-full min-h-[220px] place-items-center text-center text-sm font-semibold text-neutral-500">
                            Seleziona un nodo route dal canvas o dalla lista.
                        </div>
                    )}
                </FDBox>
            </div>
        </div>
    );
}

function ResourceForm({ value, parentOptions, onChange }: { value: NavigationResourcePatch; parentOptions: NavigationResource[]; onChange: (patch: NavigationResourcePatch) => void }) {
    return (
        <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2">
            <Field label="Tipo">
                <select className="w-full min-w-0 rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500 dark:border-neutral-800 dark:bg-neutral-900" value={value.type ?? "PANEL"} onChange={(event) => onChange({ type: event.target.value as ResourceType })}>
                    {resourceTypes.map((type) => <option key={type} value={type}>{typeLabel(type)}</option>)}
                </select>
            </Field>
            <Field label="App">
                <input className="w-full min-w-0 rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500 dark:border-neutral-800 dark:bg-neutral-900" value={value.appId ?? "legacy"} onChange={(event) => onChange({ appId: event.target.value })} />
            </Field>
            <Field label="Nome">
                <input className="w-full min-w-0 rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500 dark:border-neutral-800 dark:bg-neutral-900" value={value.name ?? ""} onChange={(event) => onChange({ name: event.target.value })} />
            </Field>
            <Field label="Key">
                <input className="w-full min-w-0 rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500 dark:border-neutral-800 dark:bg-neutral-900" value={value.key ?? ""} onChange={(event) => onChange({ key: event.target.value })} />
            </Field>
            <Field label="Route">
                <input className="w-full min-w-0 rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500 dark:border-neutral-800 dark:bg-neutral-900" value={value.route ?? ""} onChange={(event) => onChange({ route: event.target.value })} placeholder={value.type === "GROUP" ? "Vuoto per gruppi contenitore" : "/legacy/..."} />
            </Field>
            <Field label="Permission">
                <input className="w-full min-w-0 rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500 dark:border-neutral-800 dark:bg-neutral-900" value={value.permission ?? ""} onChange={(event) => onChange({ permission: event.target.value })} />
            </Field>
            <Field label="Parent">
                <select className="w-full min-w-0 rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500 dark:border-neutral-800 dark:bg-neutral-900" value={value.parentKey ?? ""} onChange={(event) => onChange({ parentKey: event.target.value || null })}>
                    <option value="">Nessun parent</option>
                    {parentOptions.map((resource) => <option key={resource._id} value={resource.key}>{typeLabel(resource.type)} · {resource.name} · {resource.key}</option>)}
                </select>
            </Field>
            <Field label="Ordine">
                <input type="number" className="w-full min-w-0 rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500 dark:border-neutral-800 dark:bg-neutral-900" value={value.order ?? 0} onChange={(event) => onChange({ order: Number(event.target.value) })} />
            </Field>
            <Field label="Stato">
                <select className="w-full min-w-0 rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500 dark:border-neutral-800 dark:bg-neutral-900" value={value.status ?? "ACTIVE"} onChange={(event) => onChange({ status: event.target.value as "ACTIVE" | "DISABLED" })}>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="DISABLED">DISABLED</option>
                </select>
            </Field>
        </div>
    );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <label className="block min-w-0">
            <span className="mb-1 block text-[0.65rem] font-black uppercase tracking-[0.14em] text-neutral-500">{label}</span>
            {children}
        </label>
    );
}
