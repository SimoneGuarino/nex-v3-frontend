import type { AccessGroup, GroupEdge, ObjectIdString } from "../model/types";

interface Props {
  groups: AccessGroup[];
  edges: GroupEdge[];
  selectedGroupId: ObjectIdString | null;
  onSelectGroup: (id: ObjectIdString) => void;
}

const kindLabel: Record<string, string> = {
  ORG_UNIT: "Org Unit",
  TEAM: "Team",
  ROLE_GROUP: "Role",
  CAPABILITY_GROUP: "Capability",
};

export function OrganizationCanvas({ groups, edges, selectedGroupId, onSelectGroup }: Props) {
  return (
    <main className="ab-canvas-wrap">
      <div className="ab-canvas-toolbar">
        <div>
          <strong>Organization graph</strong>
          <span>Parent → child, ereditarietà top-down tramite group_edges.</span>
        </div>
        <div className="ab-toolbar-meta">
          <span>{groups.length} gruppi</span>
          <span>{edges.length} edges</span>
        </div>
      </div>

      <div className="ab-canvas">
        {groups.map((group, index) => {
          const column = index % 2;
          const level = group.parentGroupIds?.length ? (group.key.includes("approvers") ? 2 : 1) : 0;
          return (
            <button
              key={group._id}
              type="button"
              className={`ab-node ${selectedGroupId === group._id ? "is-selected" : ""}`}
              style={{ top: 42 + level * 145, left: 60 + column * 310 + level * 44 }}
              onClick={() => onSelectGroup(group._id)}
            >
              <span className={`ab-kind-dot ${group.kind.toLowerCase()}`} />
              <span className="ab-node-main">
                <strong>{group.name}</strong>
                <small>{kindLabel[group.kind] ?? group.kind}</small>
              </span>
              <span className="ab-node-meta">{group.grantsCount ?? 0} grants</span>
            </button>
          );
        })}

        <svg className="ab-canvas-lines" aria-hidden="true">
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L8,3 z" />
            </marker>
          </defs>
          {edges.map((edge, index) => (
            <path key={edge._id} d={`M ${140 + (index % 2) * 230} ${104 + index * 58} C ${240 + (index % 2) * 140} ${120 + index * 48}, ${300 + index * 60} ${180 + index * 38}, ${410 + index * 50} ${210 + index * 34}`} />
          ))}
        </svg>
      </div>
    </main>
  );
}
