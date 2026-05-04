import type { NavigationResource } from "../model/types";

interface Props {
  resources: NavigationResource[];
  onGrant: (permission: string, effect?: "ALLOW" | "DENY") => void;
}

export function ResourceLibraryPanel({ resources, onGrant }: Props) {
  const panels = resources.filter((resource) => resource.type === "PANEL");
  const actions = resources.filter((resource) => resource.type === "ACTION");

  return (
    <section className="ab-panel ab-resource-library">
      <div className="ab-panel-header compact">
        <div>
          <div className="ab-eyebrow">Catalogo</div>
          <h2>Pannelli & azioni</h2>
        </div>
      </div>

      <div className="ab-resource-section">
        <h3>Pannelli</h3>
        {panels.map((resource) => (
          <div className="ab-resource-card" key={resource._id}>
            <div>
              <strong>{resource.name}</strong>
              <span>{resource.permission}</span>
            </div>
            <button type="button" onClick={() => onGrant(resource.permission, "ALLOW")}>ALLOW</button>
          </div>
        ))}
      </div>

      <div className="ab-resource-section">
        <h3>Azioni</h3>
        {actions.map((resource) => (
          <div className="ab-resource-card" key={resource._id}>
            <div>
              <strong>{resource.name}</strong>
              <span>{resource.permission}</span>
            </div>
            <button type="button" onClick={() => onGrant(resource.permission, "ALLOW")}>ALLOW</button>
          </div>
        ))}
      </div>
    </section>
  );
}
