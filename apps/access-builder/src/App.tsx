import { useEffect } from "react";
import { notifyShellLoadingReady } from "@nex/shared-platform";
import { AccessBuilderHeader } from "./components/AccessBuilderHeader";
import { EffectiveAccessPreviewPanel } from "./components/EffectiveAccessPreviewPanel";
import { GroupInspectorPanel } from "./components/GroupInspectorPanel";
import { GroupTreePanel } from "./components/GroupTreePanel";
import { OrganizationCanvas } from "./components/OrganizationCanvas";
import { PendingChangesBar } from "./components/PendingChangesBar";
import { ResourceLibraryPanel } from "./components/ResourceLibraryPanel";
import { useAccessBuilderState } from "./hooks/useAccessBuilderState";
import "./styles.css";

function App() {
    const state = useAccessBuilderState();

    useEffect(() => {
        window.dispatchEvent(new CustomEvent("nex:mfe-ready", { detail: { app: "access-builder" } }));
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: "nex:mfe-ready", app: "access-builder" }, "*");
        }
        notifyShellLoadingReady({ app: "access-builder", source: "access-builder-root-mounted" });
    }, []);

    if (state.isLoading) {
        return <div className="ab-loading">Caricamento Access Builder…</div>;
    }

    if (state.error || !state.snapshot) {
        return (
            <div className="ab-error">
                <strong>Access Builder non disponibile</strong>
                <p>{state.error ?? "Snapshot non disponibile"}</p>
            </div>
        );
    }

    return (
        <div className="ab-app">
            <AccessBuilderHeader
                pendingChanges={state.pendingChanges}
                onPublish={async () => {
                    const result = await state.publish();
                    return result;
                }}
            />

            <div className="ab-main-grid">
                <GroupTreePanel
                    groups={state.snapshot.groups}
                    edges={state.snapshot.edges}
                    selectedGroupId={state.selectedGroupId}
                    onSelectGroup={state.setSelectedGroupId}
                />

                <div className="ab-center-stack">
                    <OrganizationCanvas
                        groups={state.snapshot.groups}
                        edges={state.snapshot.edges}
                        selectedGroupId={state.selectedGroupId}
                        onSelectGroup={state.setSelectedGroupId}
                    />
                    <EffectiveAccessPreviewPanel
                        users={state.snapshot.users}
                        roles={state.snapshot.roles}
                        selectedUserId={state.selectedUserId}
                        selectedActorRole={state.selectedActorRole}
                        preview={state.preview}
                        isLoading={state.isPreviewLoading}
                        onSelectUser={state.setSelectedUserId}
                        onSelectActorRole={state.setSelectedActorRole}
                    />
                </div>

                <div className="ab-right-stack">
                    <GroupInspectorPanel
                        group={state.selectedGroup}
                        memberships={state.selectedGroupMemberships}
                        grants={state.selectedGroupGrants}
                    />
                    <ResourceLibraryPanel resources={state.snapshot.resources} onGrant={state.grantResourceToSelectedGroup} />
                </div>
            </div>

            <PendingChangesBar changes={state.pendingChanges} />
        </div>
    );
}

export default App;
