import type { EffectiveAccessPreview, RoleOption, UserSummary } from "../model/types";

interface Props {
  users: UserSummary[];
  roles: RoleOption[];
  selectedUserId: string | null;
  selectedActorRole: number;
  preview: EffectiveAccessPreview | null;
  isLoading: boolean;
  onSelectUser: (id: string) => void;
  onSelectActorRole: (role: number) => void;
}

export function EffectiveAccessPreviewPanel({ users, roles, selectedUserId, selectedActorRole, preview, isLoading, onSelectUser, onSelectActorRole }: Props) {
  return (
    <section className="ab-preview-panel">
      <div className="ab-preview-controls">
        <div>
          <label>Preview utente</label>
          <select value={selectedUserId ?? ""} onChange={(e) => onSelectUser(e.target.value)}>
            {users.map((user) => (
              <option key={user._id} value={user._id}>{[user.nome, user.cognome].filter(Boolean).join(" ") || user.username}</option>
            ))}
          </select>
        </div>
        <div>
          <label>actorRole</label>
          <select value={selectedActorRole} onChange={(e) => onSelectActorRole(Number(e.target.value))}>
            {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? <div className="ab-skeleton">Calcolo entitlements…</div> : preview && (
        <div className="ab-preview-grid">
          <div>
            <h3>Gruppi effettivi</h3>
            {preview.groups.map((group) => <span className="ab-chip" key={group._id}>{group.name}{group.inherited ? " · inherited" : ""}</span>)}
          </div>
          <div>
            <h3>Pannelli visibili</h3>
            {preview.panels.map((panel) => <span className="ab-chip panel" key={panel._id}>{panel.name}</span>)}
          </div>
          <div>
            <h3>Caps</h3>
            {preview.caps.map((cap) => <code className="ab-cap" key={cap}>{cap}</code>)}
          </div>
          <div>
            <h3>DENY applicati</h3>
            {preview.denied.length === 0 ? <span className="ab-muted">Nessun deny.</span> : preview.denied.map((deny) => <code className="ab-cap deny" key={deny.permission}>{deny.permission}</code>)}
          </div>
        </div>
      )}
    </section>
  );
}
