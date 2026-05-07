import { useMemo, useState } from "react";
import { FDBox, FDButton, FDInput, FDSelect } from "@nex/fd-ui";
import type { AccessGroup, GroupEdge, GroupKind, ObjectIdString } from "../model/types";

interface Props {
    groups: AccessGroup[];
    edges: GroupEdge[];
    selectedGroupId: ObjectIdString | null;
    onSelectGroup: (id: ObjectIdString) => void;
    onCreateGroup: (name: string, kind: GroupKind, parentGroupId?: ObjectIdString | null) => void;
}

const kindOptions = [
    { value: "ORG_UNIT", label: "Org Unit" },
    { value: "TEAM", label: "Team" },
    { value: "ROLE_GROUP", label: "Role Group" },
    { value: "CAPABILITY_GROUP", label: "Capability Group" },
] satisfies Array<{ value: GroupKind; label: string }>;

const kindTone: Record<GroupKind, string> = {
    ORG_UNIT: "bg-blue-500",
    TEAM: "bg-emerald-500",
    ROLE_GROUP: "bg-violet-500",
    CAPABILITY_GROUP: "bg-orange-500",
};

function groupChildren(groups: AccessGroup[], edges: GroupEdge[], parentId: string | null): AccessGroup[] {
    if (parentId === null) {
        const childIds = new Set(edges.map((edge) => edge.childGroupId));
        return groups.filter((group) => !childIds.has(group._id));
    }
    const ids = edges.filter((edge) => edge.parentGroupId === parentId).map((edge) => edge.childGroupId);
    return ids.map((id) => groups.find((group) => group._id === id)).filter((group): group is AccessGroup => Boolean(group));
}

export function GroupTreePanel({ groups, edges, selectedGroupId, onSelectGroup, onCreateGroup }: Props) {
    const [query, setQuery] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [name, setName] = useState("");
    const [kind, setKind] = useState<GroupKind>("TEAM");
    const [createUnderSelected, setCreateUnderSelected] = useState(true);

    const normalizedQuery = query.trim().toLowerCase();
    const visibleGroups = useMemo(() => {
        if (!normalizedQuery) return groups;
        return groups.filter((group) => `${group.name} ${group.key} ${group.kind}`.toLowerCase().includes(normalizedQuery));
    }, [groups, normalizedQuery]);

    const visibleIds = useMemo(() => new Set(visibleGroups.map((group) => group._id)), [visibleGroups]);

    const submitCreate = () => {
        const trimmed = name.trim();
        if (!trimmed) return;
        onCreateGroup(trimmed, kind, createUnderSelected ? selectedGroupId : null);
        setName("");
        setIsCreating(false);
    };

    const renderNode = (group: AccessGroup, depth = 0) => {
        if (!visibleIds.has(group._id) && normalizedQuery) return null;
        const children = groupChildren(groups, edges, group._id);
        const selected = selectedGroupId === group._id;

        return (
            <div key={group._id}>
                <button
                    type="button"
                    className={`group flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition ${selected ? "border-blue-500 bg-blue-50 text-blue-800 shadow-sm dark:bg-blue-950/40 dark:text-blue-100" : "border-transparent hover:border-neutral-200 hover:bg-neutral-50 dark:hover:border-neutral-800 dark:hover:bg-neutral-800/60"}`}
                    style={{ paddingLeft: 12 + depth * 18 }}
                    onClick={() => onSelectGroup(group._id)}
                >
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${kindTone[group.kind]}`} />
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-black">{group.name}</span>
                        <span className="block truncate text-xs font-semibold text-neutral-500">{group.key}</span>
                    </span>
                    <span className="grid h-7 min-w-7 place-items-center rounded-full bg-neutral-100 px-2 text-xs font-black text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">{group.membersCount ?? 0}</span>
                </button>
                {!normalizedQuery && children.length > 0 ? <div className="mt-1 space-y-1">{children.map((child) => renderNode(child, depth + 1))}</div> : null}
            </div>
        );
    };

    return (
        <div className="flex h-full min-h-0 flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-neutral-500">Organization graph</div>
                    <div className="text-sm font-bold text-neutral-600 dark:text-neutral-300">Gerarchia gruppi e sotto-gruppi</div>
                </div>
                <FDButton size="small" radius="xl" color="primary" variant="solid" onClick={() => setIsCreating((value) => !value)}>
                    Nuovo
                </FDButton>
            </div>

            {isCreating ? (
                <FDBox radius="2xl" pad="sm" border className="grid gap-3 bg-neutral-50 dark:bg-neutral-900">
                    <FDInput
                        label="Nome gruppo"
                        animatedLabel={false}
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Es. Buyer Notebook"
                        fullWidth
                    />
                    <FDSelect
                        label="Tipo gruppo"
                        animatedLabel={false}
                        value={kind}
                        options={kindOptions}
                        onChange={(value) => setKind((value as GroupKind | null) ?? "TEAM")}
                        fullWidth
                    />
                    <label className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-neutral-700 shadow-sm dark:bg-neutral-950 dark:text-neutral-200">
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-neutral-300"
                            checked={createUnderSelected}
                            onChange={(event) => setCreateUnderSelected(event.target.checked)}
                        />
                        Crea sotto il gruppo selezionato
                    </label>
                    <FDButton radius="xl" color="primary" variant="solid" disabled={!name.trim()} onClick={submitCreate}>
                        Crea gruppo
                    </FDButton>
                </FDBox>
            ) : null}

            <FDInput
                label="Cerca gruppo"
                animatedLabel={false}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cerca gruppo, reparto o capability…"
                clearable
                fullWidth
            />

            <div className="min-h-0 flex-1 overflow-auto pr-1">
                <div className="space-y-1">
                    {normalizedQuery
                        ? visibleGroups.map((group) => renderNode(group, 0))
                        : groupChildren(groups, edges, null).map((group) => renderNode(group))}
                </div>
            </div>
        </div>
    );
}
