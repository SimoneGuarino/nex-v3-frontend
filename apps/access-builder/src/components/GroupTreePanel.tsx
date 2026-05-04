import { useState } from "react";
import type { AccessGroup, GroupEdge, GroupKind, ObjectIdString } from "../model/types";
import { FDBox } from "@nex/fd-ui";

interface Props {
    groups: AccessGroup[];
    edges: GroupEdge[];
    selectedGroupId: ObjectIdString | null;
    onSelectGroup: (id: ObjectIdString) => void;
    onCreateGroup: (name: string, kind: GroupKind, parentGroupId?: ObjectIdString | null) => void;
}

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
    const visibleGroups = normalizedQuery
        ? groups.filter((group) => `${group.name} ${group.key} ${group.kind}`.toLowerCase().includes(normalizedQuery))
        : groups;
    const visibleIds = new Set(visibleGroups.map((group) => group._id));

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
        return (
            <div key={group._id}>
                <button
                    type="button"
                    className={`ab-tree-node ${selectedGroupId === group._id ? "is-selected" : ""}`}
                    style={{ paddingLeft: 12 + depth * 18 }}
                    onClick={() => onSelectGroup(group._id)}
                >
                    <span className={`ab-kind-dot ${group.kind.toLowerCase()}`} />
                    <span className="ab-tree-title">{group.name}</span>
                    <span className="ab-tree-count">{group.membersCount ?? 0}</span>
                </button>
                {!normalizedQuery && children.map((child) => renderNode(child, depth + 1))}
            </div>
        );
    };

    return (
        <div className="absolute left-0 top-0 bottom-0 w-80 h-full">
            <FDBox className="flex flex-col h-full" pad="sm" radius="md">
                <div className="ab-panel-header">
                    <div>
                        <div className="ab-eyebrow">Struttura</div>
                        <h2>Gruppi</h2>
                    </div>
                    <button className="ab-icon-button" type="button" title="Nuovo gruppo" onClick={() => setIsCreating((value) => !value)}>+</button>
                </div>

                {isCreating && (
                    <div className="ab-create-card">
                        <label>Nome gruppo</label>
                        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Es. Buyer Notebook" />
                        <label>Tipo gruppo</label>
                        <select value={kind} onChange={(event) => setKind(event.target.value as GroupKind)}>
                            <option value="ORG_UNIT">Org Unit</option>
                            <option value="TEAM">Team</option>
                            <option value="ROLE_GROUP">Role Group</option>
                            <option value="CAPABILITY_GROUP">Capability Group</option>
                        </select>
                        <label className="ab-checkbox-row">
                            <input type="checkbox" checked={createUnderSelected} onChange={(event) => setCreateUnderSelected(event.target.checked)} />
                            Crea sotto il gruppo selezionato
                        </label>
                        <button type="button" className="ab-button ab-button-primary" onClick={submitCreate}>Crea gruppo</button>
                    </div>
                )}

                <input className="ab-search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca gruppo, reparto o capability…" />
                <div className="ab-tree">
                    {normalizedQuery
                        ? visibleGroups.map((group) => renderNode(group, 0))
                        : groupChildren(groups, edges, null).map((group) => renderNode(group))}
                </div>
            </FDBox>
        </div>
    );
}
