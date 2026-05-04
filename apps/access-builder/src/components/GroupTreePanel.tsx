import type { AccessGroup, GroupEdge, ObjectIdString } from "../model/types";

interface Props {
  groups: AccessGroup[];
  edges: GroupEdge[];
  selectedGroupId: ObjectIdString | null;
  onSelectGroup: (id: ObjectIdString) => void;
}

function groupChildren(groups: AccessGroup[], edges: GroupEdge[], parentId: string | null): AccessGroup[] {
  if (parentId === null) {
    const childIds = new Set(edges.map((edge) => edge.childGroupId));
    return groups.filter((group) => !childIds.has(group._id));
  }
  const ids = edges.filter((edge) => edge.parentGroupId === parentId).map((edge) => edge.childGroupId);
  return ids.map((id) => groups.find((group) => group._id === id)).filter((group): group is AccessGroup => Boolean(group));
}

export function GroupTreePanel({ groups, edges, selectedGroupId, onSelectGroup }: Props) {
  const renderNode = (group: AccessGroup, depth = 0) => {
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
        {children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <aside className="ab-panel ab-left-panel">
      <div className="ab-panel-header">
        <div>
          <div className="ab-eyebrow">Struttura</div>
          <h2>Gruppi</h2>
        </div>
        <button className="ab-icon-button" type="button" title="Nuovo gruppo">+</button>
      </div>
      <div className="ab-search">Cerca gruppo, reparto o capability…</div>
      <div className="ab-tree">{groupChildren(groups, edges, null).map((group) => renderNode(group))}</div>
    </aside>
  );
}
