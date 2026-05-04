import { useMemo, useState } from "react";
import type { NavigationResource } from "../model/types";

interface Props {
    resources: NavigationResource[];
    onGrant: (permission: string, effect?: "ALLOW" | "DENY") => void;
}

export function ResourceLibraryPanel({ resources, onGrant }: Props) {
    const [query, setQuery] = useState("");
    const [type, setType] = useState<"ALL" | "PANEL" | "ACTION" | "DATA_SCOPE">("ALL");
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = useMemo(() => resources.filter((resource) => {
        if (type !== "ALL" && resource.type !== type) return false;
        if (!normalizedQuery) return true;
        return `${resource.name} ${resource.permission} ${resource.key} ${resource.route ?? ""}`.toLowerCase().includes(normalizedQuery);
    }), [normalizedQuery, resources, type]);

    return (
        <section className="ab-panel ab-resource-library">
            <div className="ab-panel-header compact">
                <div>
                    <div className="ab-eyebrow">Catalogo</div>
                    <h2>Pannelli & azioni</h2>
                </div>
            </div>

            <div className="ab-resource-filters">
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca permission, pannello, route…" />
                <select value={type} onChange={(event) => setType(event.target.value as typeof type)}>
                    <option value="ALL">Tutto</option>
                    <option value="PANEL">Pannelli</option>
                    <option value="ACTION">Azioni</option>
                    <option value="DATA_SCOPE">Data scope</option>
                </select>
            </div>

            <div className="ab-resource-section">
                <h3>Risorse disponibili</h3>
                {filtered.length === 0 ? <p className="ab-muted">Nessuna risorsa trovata.</p> : filtered.map((resource) => (
                    <div className="ab-resource-card" key={resource._id}>
                        <div>
                            <strong>{resource.name}</strong>
                            <span>{resource.permission}</span>
                            {resource.route ? <small>{resource.route}</small> : null}
                        </div>
                        <div className="ab-resource-actions">
                            <button type="button" onClick={() => onGrant(resource.permission, "ALLOW")}>ALLOW</button>
                            <button type="button" className="deny" onClick={() => onGrant(resource.permission, "DENY")}>DENY</button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
