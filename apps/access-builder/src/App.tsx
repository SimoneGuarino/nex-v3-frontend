import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { notifyShellLoadingReady } from "@nex/shared-platform";
import { FDBox, FDButton } from "@nex/fd-ui";
import { MdAccountTree, MdAddLink, MdClose, MdLibraryBooks, MdLinkOff, MdOpenWith, MdPendingActions, MdPersonSearch, MdSelectAll, MdTune } from "react-icons/md";
import { EffectiveAccessPreviewPanel } from "./components/EffectiveAccessPreviewPanel";
import { GroupInspectorPanel } from "./components/GroupInspectorPanel";
import { GroupTreePanel } from "./components/GroupTreePanel";
import { OrganizationCanvas, type CanvasMode } from "./components/OrganizationCanvas";
import { PendingChangesBar } from "./components/PendingChangesBar";
import { ResourceLibraryPanel } from "./components/ResourceLibraryPanel";
import { useAccessBuilderState } from "./hooks/useAccessBuilderState";
import "./styles.css";
import useRootThemeClass from "./bootstrap/useRootThemeClass";
import { useNexTheme } from "@nex/theme-system";

type DrawerKey = "groups" | "inspector" | "resources" | "preview" | "draft";
type DrawerSide = "left" | "right";

interface DrawerState {
    groups: boolean;
    inspector: boolean;
    resources: boolean;
    preview: boolean;
    draft: boolean;
}

const initialDrawers: DrawerState = {
    groups: false,
    inspector: false,
    resources: false,
    preview: false,
    draft: false,
};

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

function App() {
    const { preferences } = useNexTheme();
    const state = useAccessBuilderState();
    const [drawers, setDrawers] = useState<DrawerState>(initialDrawers);
    const [canvasMode, setCanvasMode] = useState<CanvasMode>("move");

    useRootThemeClass(preferences.mode === "dark");

    useEffect(() => {
        window.dispatchEvent(new CustomEvent("nex:mfe-ready", { detail: { app: "access-builder" } }));
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: "nex:mfe-ready", app: "access-builder" }, "*");
        }
        notifyShellLoadingReady({ app: "access-builder", source: "access-builder-root-mounted" });
    }, []);

    const selectedGroupName = state.selectedGroup?.name ?? "Nessun gruppo selezionato";

    const rightOpenCount = useMemo(() => {
        return (["inspector", "resources", "draft"] as DrawerKey[]).filter((key) => drawers[key]).length;
    }, [drawers]);

    const leftOpenCount = useMemo(() => {
        return (["groups", "preview"] as DrawerKey[]).filter((key) => drawers[key]).length;
    }, [drawers]);

    const toggleDrawer = (key: DrawerKey) => {
        setDrawers((current) => ({ ...current, [key]: !current[key] }));
    };

    const closeDrawer = (key: DrawerKey) => {
        setDrawers((current) => ({ ...current, [key]: false }));
    };

    if (state.isLoading) {
        return (
            <div className="grid min-h-screen place-items-center bg-neutral-100 p-6 text-neutral-700 dark:bg-neutral-950 dark:text-neutral-200">
                <FDBox radius="2xl" shadow="xl" pad="lg" border className="w-full max-w-md text-center">
                    <div className="text-xs font-black uppercase tracking-[0.24em] text-neutral-500">NEX v3</div>
                    <div className="mt-2 text-2xl font-black tracking-tight">Caricamento Access Builder…</div>
                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                        <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-600" />
                    </div>
                </FDBox>
            </div>
        );
    };

    if (state.error || !state.snapshot) {
        return (
            <div className="grid min-h-screen place-items-center bg-neutral-100 p-6 text-neutral-800 dark:bg-neutral-950 dark:text-neutral-100">
                <FDBox variant="gradient-simple" radius="2xl" shadow="xl" pad="lg" border className="w-full max-w-xl">
                    <div className="text-xs font-black uppercase tracking-[0.24em] text-red-600">Errore</div>
                    <h1 className="mt-2 text-2xl font-black tracking-tight text-neutral-600 dark:text-neutral-300">Access Builder non disponibile</h1>
                    <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">{state.error ?? "Snapshot non disponibile"}</p>
                </FDBox>
            </div>
        );
    };

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-neutral-100 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-100">
            <OrganizationCanvas
                groups={state.snapshot.groups}
                edges={state.snapshot.edges}
                selectedGroupId={state.selectedGroupId}
                mode={canvasMode}
                onSelectGroup={state.setSelectedGroupId}
                onCreateEdge={state.createEdge}
                onDeleteEdge={state.removeEdge}
            />

            <CanvasModeToolbar mode={canvasMode} onChange={setCanvasMode} />

            <FDBox
                radius="2xl"
                shadow="xl"
                pad="sm"
                border
                className="pointer-events-auto absolute left-1/2 top-4 z-40 flex w-[min(940px,calc(100vw-2rem))] -translate-x-1/2 items-center justify-between gap-3 bg-white/95 backdrop-blur dark:bg-neutral-900/95"
            >
                <div className="min-w-0">
                    <div className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-neutral-500">NEX v3 · Access Control</div>
                    <div className="truncate text-lg font-black tracking-tight">{selectedGroupName}</div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                    <ToolbarButton active={drawers.groups} icon={<MdAccountTree />} label="Gruppi" onClick={() => toggleDrawer("groups")} />
                    <ToolbarButton active={drawers.preview} icon={<MdPersonSearch />} label="Preview" onClick={() => toggleDrawer("preview")} />
                    <ToolbarButton active={drawers.inspector} icon={<MdTune />} label="Inspector" onClick={() => toggleDrawer("inspector")} />
                    <ToolbarButton active={drawers.resources} icon={<MdLibraryBooks />} label="Risorse" onClick={() => toggleDrawer("resources")} />
                    <ToolbarButton active={drawers.draft} icon={<MdPendingActions />} label={`Draft ${state.pendingChanges.length || ""}`} onClick={() => toggleDrawer("draft")} />
                    <FDButton
                        size="small"
                        radius="xl"
                        color="primary"
                        variant="solid"
                        disabled={state.pendingChanges.length === 0 || state.isPublishing}
                        loading={state.isPublishing}
                        onClick={async () => {
                            const result = await state.publish();
                            return result;
                        }}
                    >
                        Pubblica {state.pendingChanges.length > 0 ? `(${state.pendingChanges.length})` : ""}
                    </FDButton>
                </div>
            </FDBox>

            <SideDrawer
                title="Struttura gruppi"
                subtitle={`${state.snapshot.groups.length} gruppi · ${leftOpenCount} pannelli aperti a sinistra`}
                side="left"
                open={drawers.groups}
                topOffset={96}
                stackIndex={0}
                onClose={() => closeDrawer("groups")}
            >
                <GroupTreePanel
                    groups={state.snapshot.groups}
                    edges={state.snapshot.edges}
                    selectedGroupId={state.selectedGroupId}
                    onSelectGroup={state.setSelectedGroupId}
                    onCreateGroup={state.createGroup}
                />
            </SideDrawer>

            <SideDrawer
                title="Preview accessi"
                subtitle="Entitlements effettivi per utente e actorRole"
                side="left"
                open={drawers.preview}
                topOffset={96}
                stackIndex={drawers.groups ? 1 : 0}
                onClose={() => closeDrawer("preview")}
            >
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
            </SideDrawer>

            <SideDrawer
                title="Inspector gruppo"
                subtitle="Dettagli, membri e grants diretti"
                side="right"
                open={drawers.inspector}
                topOffset={96}
                stackIndex={0}
                onClose={() => closeDrawer("inspector")}
            >
                <GroupInspectorPanel
                    group={state.selectedGroup}
                    memberships={state.selectedGroupMemberships}
                    grants={state.selectedGroupGrants}
                    users={state.snapshot.users}
                    selectedUserId={state.selectedUserId}
                    onSelectUser={state.setSelectedUserId}
                    onAddSelectedUser={state.addSelectedUserToSelectedGroup}
                    onRemoveMembership={state.removeMembership}
                    onRemoveGrant={state.removeGrant}
                />
            </SideDrawer>

            <SideDrawer
                title="Pannelli & azioni"
                subtitle="Catalogo navigation_resources"
                side="right"
                open={drawers.resources}
                topOffset={96}
                stackIndex={drawers.inspector ? 1 : 0}
                onClose={() => closeDrawer("resources")}
            >
                <ResourceLibraryPanel resources={state.snapshot.resources} onGrant={state.grantResourceToSelectedGroup} />
            </SideDrawer>

            <SideDrawer
                title="Modifiche draft"
                subtitle={`${state.pendingChanges.length} modifiche non pubblicate · ${rightOpenCount} pannelli aperti a destra`}
                side="right"
                open={drawers.draft}
                topOffset={96}
                stackIndex={(drawers.inspector ? 1 : 0) + (drawers.resources ? 1 : 0)}
                onClose={() => closeDrawer("draft")}
            >
                <PendingChangesBar changes={state.pendingChanges} isPublishing={state.isPublishing} onDiscard={state.discardDraft} />
            </SideDrawer>
        </div>
    );
}

function CanvasModeToolbar({ mode, onChange }: { mode: CanvasMode; onChange: (mode: CanvasMode) => void }) {
    const items: Array<{ key: CanvasMode; label: string; description: string; icon: ReactNode }> = [
        { key: "move", label: "Sposta", description: "Sposta i blocchi", icon: <MdOpenWith /> },
        { key: "connect", label: "Collega", description: "Crea collegamenti", icon: <MdAddLink /> },
        { key: "delete-link", label: "Rimuovi", description: "Rimuovi collegamenti", icon: <MdLinkOff /> },
        { key: "multi-select", label: "Seleziona", description: "Selezione multipla", icon: <MdSelectAll /> },
    ];

    return (
        <FDBox
            radius="2xl"
            shadow="xl"
            pad="xs"
            border
            className="!fixed right-5 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-2 bg-white/95 backdrop-blur-xl dark:bg-neutral-900/95"
            aria-label="Modalità canvas"
        >
            <div className="px-2 pb-1 pt-1 text-center text-[0.56rem] font-black uppercase tracking-[0.2em] text-neutral-500">Mode</div>
            {items.map((item) => (
                <button
                    key={item.key}
                    type="button"
                    onClick={() => onChange(item.key)}
                    title={item.description}
                    className={cx(
                        "grid h-11 w-11 place-items-center rounded-2xl border text-lg transition",
                        mode === item.key
                            ? "border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                            : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
                    )}
                    aria-label={item.label}
                    aria-pressed={mode === item.key}
                >
                    {item.icon}
                </button>
            ))}
        </FDBox>
    );
}

function ToolbarButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
    return (
        <FDButton
            size="small"
            radius="xl"
            color={active ? "primary" : "light"}
            variant={active ? "solid" : "outline"}
            icon={icon}
            onClick={onClick}
            className={cx("whitespace-nowrap", active && "shadow-md")}
        >
            {label}
        </FDButton>
    );
}

function SideDrawer({ title, subtitle, side, open, topOffset, stackIndex, onClose, children }: {
    title: string;
    subtitle: string;
    side: DrawerSide;
    open: boolean;
    topOffset: number;
    stackIndex: number;
    onClose: () => void;
    children: ReactNode;
}) {
    const viewport = useViewportSize();
    const requestedWidth = 390;
    const minSafeWidth = 300;
    const width = Math.min(requestedWidth, Math.max(minSafeWidth, viewport.width - 32));
    const gap = 14;
    const requestedOffset = 16 + stackIndex * (width + gap);
    const maxVisibleOffset = Math.max(16, viewport.width - width - 16);
    const offset = Math.min(requestedOffset, maxVisibleOffset);
    const translateClosed = side === "left" ? "-translate-x-[110vw]" : "translate-x-[110vw]";

    const drawerStyle: CSSProperties = {
        top: topOffset,
        bottom: 16,
        width,
        zIndex: 50 + stackIndex,
    };

    if (side === "left") drawerStyle.left = offset;
    else drawerStyle.right = offset;

    return (
        <FDBox
            radius="2xl"
            shadow="2xl"
            border
            className={cx(
                "fixed flex max-w-[calc(100vw-2rem)] flex-col overflow-hidden bg-white/95 backdrop-blur-xl transition-transform duration-300 dark:bg-neutral-900/95",
                open ? "pointer-events-auto translate-x-0" : `pointer-events-none ${translateClosed}`,
            )}
            style={drawerStyle}
            role="complementary"
            aria-hidden={!open}
        >
            <div className="flex items-start justify-between gap-3 border-b border-neutral-200 p-4 dark:border-neutral-800">
                <div className="min-w-0">
                    <div className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-neutral-500">{subtitle}</div>
                    <h2 className="mt-1 truncate text-lg font-black tracking-tight">{title}</h2>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-sm transition hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
                    aria-label={`Chiudi ${title}`}
                >
                    <MdClose />
                </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-4">{children}</div>
        </FDBox>
    );
}

function useViewportSize() {
    const [viewport, setViewport] = useState(() => ({
        width: typeof window === "undefined" ? 1440 : window.innerWidth,
        height: typeof window === "undefined" ? 900 : window.innerHeight,
    }));

    useEffect(() => {
        const onResize = () => {
            setViewport({ width: window.innerWidth, height: window.innerHeight });
        };

        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    return viewport;
}

export default App;
