import type { AccessGroup, GroupMembership, PermissionGrant } from "../model/types";

interface Props {
  group: AccessGroup | null;
  memberships: GroupMembership[];
  grants: PermissionGrant[];
}

export function GroupInspectorPanel({ group, memberships, grants }: Props) {
  if (!group) {
    return (
      <aside className="ab-panel ab-right-panel">
        <p>Seleziona un gruppo per vedere dettagli, membri e grants.</p>
      </aside>
    );
  }

  return (
    <aside className="ab-panel ab-right-panel">
      <div className="ab-panel-header compact">
        <div>
          <div className="ab-eyebrow">Inspector</div>
          <h2>{group.name}</h2>
        </div>
        <span className={`ab-status ${group.status.toLowerCase()}`}>{group.status}</span>
      </div>

      <div className="ab-inspector-block">
        <label>Key</label>
        <code>{group.key}</code>
      </div>

      <div className="ab-inspector-block">
        <label>Descrizione</label>
        <p>{group.description || "Nessuna descrizione"}</p>
      </div>

      <div className="ab-kpi-grid">
        <div><strong>{memberships.length}</strong><span>Membri diretti</span></div>
        <div><strong>{grants.length}</strong><span>Grants diretti</span></div>
        <div><strong>{group.inheritedGrantsCount ?? 0}</strong><span>Ereditati</span></div>
      </div>

      <section className="ab-inspector-section">
        <h3>Membri</h3>
        {memberships.length === 0 ? <p className="ab-muted">Nessun membro diretto.</p> : memberships.map((membership) => (
          <div className="ab-user-row" key={membership._id}>
            <span>{membership.user?.nome?.[0] ?? "U"}</span>
            <div>
              <strong>{[membership.user?.nome, membership.user?.cognome].filter(Boolean).join(" ") || membership.userId}</strong>
              <small>{membership.user?.username}</small>
            </div>
          </div>
        ))}
      </section>

      <section className="ab-inspector-section">
        <h3>Grants diretti</h3>
        {grants.length === 0 ? <p className="ab-muted">Nessun grant diretto.</p> : grants.map((grant) => (
          <div className={`ab-grant-row ${grant.effect.toLowerCase()}`} key={grant._id}>
            <strong>{grant.effect}</strong>
            <span>{grant.permission}</span>
            <small>{grant.context?.actorRoles?.length ? `actorRole: ${grant.context.actorRoles.join(", ")}` : "role-agnostic"}</small>
          </div>
        ))}
      </section>
    </aside>
  );
}
