import { useEffect, useState, type ReactNode } from "react";
import { notifyShellLoadingReady } from "@nex/shared-platform";
import { FDBox, FDButton } from "@nex/fd-ui";
import {
    MdAccountTree,
    MdAddLink,
    MdCenterFocusStrong,
    MdClose,
    MdLibraryBooks,
    MdLinkOff,
    MdOpenWith,
    MdPendingActions,
    MdPeople,
    MdPersonSearch,
    MdSelectAll,
    MdTune,
    MdZoomIn,
    MdZoomOut,
} from "react-icons/md";
import { EffectiveAccessPreviewPanel } from "./components/EffectiveAccessPreviewPanel";
import { GroupInspectorPanel } from "./components/GroupInspectorPanel";
import { GroupTreePanel } from "./components/GroupTreePanel";
import {
    OrganizationCanvas,
    type CanvasMode,
} from "./components/OrganizationCanvas";
import { PendingChangesBar } from "./components/PendingChangesBar";
import { ResourceLibraryPanel } from "./components/ResourceLibraryPanel";
import { useAccessBuilderState } from "./hooks/useAccessBuilderState";
import useRootThemeClass from "./bootstrap/useRootThemeClass";
import { useNexTheme } from "@nex/theme-system";

type PanelKey = "groups" | "inspector" | "resources" | "preview" | "draft";

type PanelMeta = {
    title: string;
    subtitle: string;
    icon: ReactNode;
};

const panelMeta: Record<PanelKey, PanelMeta> = {
    groups: {
        title: "Struttura gruppi",
        subtitle: "Gerarchia, reparti e sotto-gruppi",
        icon: <MdAccountTree />,
    },
    preview: {
        title: "Preview accessi",
        subtitle: "Entitlements effettivi per utente e actorRole",
        icon: <MdPersonSearch />,
    },
    inspector: {
        title: "Inspector gruppo",
        subtitle: "Dettagli, membri e grants diretti",
        icon: <MdTune />,
    },
    resources: {
        title: "Pannelli & azioni",
        subtitle: "Catalogo navigation_resources",
        icon: <MdLibraryBooks />,
    },
    draft: {
        title: "Modifiche draft",
        subtitle: "Modifiche non pubblicate",
        icon: <MdPendingActions />,
    },
};

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

function clampZoom(value: number) {
    return Math.min(2.25, Math.max(0.35, Number(value.toFixed(3))));
}

function App() {
    const { preferences } = useNexTheme();
    const state = useAccessBuilderState();
    const [activePanel, setActivePanel] = useState<PanelKey | null>(null);
    const [canvasMode, setCanvasMode] = useState<CanvasMode>("move");
    const [showUsersOnCanvas, setShowUsersOnCanvas] = useState(false);
    const [canvasZoom, setCanvasZoom] = useState(1);
    const [viewportResetSignal, setViewportResetSignal] = useState(0);

    useRootThemeClass(preferences.mode === "dark");

    useEffect(() => {
        window.dispatchEvent(
            new CustomEvent("nex:mfe-ready", { detail: { app: "access-builder" } }),
        );
        if (window.parent && window.parent !== window) {
            window.parent.postMessage(
                { type: "nex:mfe-ready", app: "access-builder" },
                "*",
            );
        }
        notifyShellLoadingReady({
            app: "access-builder",
            source: "access-builder-root-mounted",
        });
    }, []);

    const selectedGroupName =
        state.selectedGroup?.name ?? "Nessun gruppo selezionato";

    const togglePanel = (key: PanelKey) => {
        setActivePanel((current) => (current === key ? null : key));
    };

    const resetCanvasViewport = () => {
        setCanvasZoom(1);
        setViewportResetSignal((value) => value + 1);
    };

    if (state.isLoading) {
        return (
            <div className="grid min-h-screen place-items-center bg-neutral-100 p-6 text-neutral-700 dark:bg-neutral-950 dark:text-neutral-200">
                <FDBox
                    radius="2xl"
                    shadow="xl"
                    pad="lg"
                    border
                    className="w-full max-w-md text-center"
                >
                    <div className="text-xs font-black uppercase tracking-[0.24em] text-neutral-500">
                        NEX v3
                    </div>
                    <div className="mt-2 text-2xl font-black tracking-tight">
                        Caricamento Access Builder…
                    </div>
                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                        <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-600" />
                    </div>
                </FDBox>
            </div>
        );
    }

    if (state.error || !state.snapshot) {
        return (
            <div className="grid min-h-screen place-items-center bg-neutral-100 p-6 text-neutral-800 dark:bg-neutral-950 dark:text-neutral-100">
                <FDBox
                    variant="gradient-simple"
                    radius="2xl"
                    shadow="xl"
                    pad="lg"
                    border
                    className="w-full max-w-xl"
                >
                    <div className="text-xs font-black uppercase tracking-[0.24em] text-red-600">
                        Errore
                    </div>
                    <h1 className="mt-2 text-2xl font-black tracking-tight text-neutral-600 dark:text-neutral-300">
                        Access Builder non disponibile
                    </h1>
                    <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
                        {state.error ?? "Snapshot non disponibile"}
                    </p>
                </FDBox>
            </div>
        );
    }

    const activeMeta = activePanel ? panelMeta[activePanel] : null;

    return (
        <div className="relative h-dvh w-screen overflow-hidden bg-neutral-100 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-100">
            <OrganizationCanvas
                groups={state.snapshot.groups}
                edges={state.snapshot.edges}
                memberships={state.snapshot.memberships}
                users={state.snapshot.users}
                selectedGroupId={state.selectedGroupId}
                selectedUserId={state.selectedUserId}
                mode={canvasMode}
                zoom={canvasZoom}
                showUsers={showUsersOnCanvas}
                viewportResetSignal={viewportResetSignal}
                onZoomChange={(nextZoom) => setCanvasZoom(clampZoom(nextZoom))}
                onSelectGroup={state.setSelectedGroupId}
                onSelectUser={state.setSelectedUserId}
                onCreateEdge={state.createEdge}
                onDeleteEdge={state.removeEdge}
                onRemoveMembership={state.removeMembership}
                onMoveMembership={state.moveMembershipToGroup}
            />

            <FDBox
                radius="2xl"
                shadow="xl"
                pad="sm"
                border
                variant="gradient"
                className="pointer-events-auto !fixed left-3 right-3 top-20 z-40 flex flex-col gap-3 lg:left-1/2 lg:right-auto lg:w-[min(1040px,calc(100vw-2rem))] lg:-translate-x-1/2 lg:flex-row lg:items-center lg:justify-between"
            >
                <div className="min-w-0">
                    <div className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-neutral-500">
                        NEX v3 · Access Control
                    </div>
                    <div className="truncate text-lg font-black tracking-tight">
                        {selectedGroupName}
                    </div>
                </div>

                <div className="flex min-w-0 flex-wrap items-center justify-start gap-2 lg:justify-end">
                    <ToolbarButton
                        active={activePanel === "groups"}
                        icon={panelMeta.groups.icon}
                        label="Gruppi"
                        onClick={() => togglePanel("groups")}
                    />
                    <ToolbarButton
                        active={activePanel === "preview"}
                        icon={panelMeta.preview.icon}
                        label="Preview"
                        onClick={() => togglePanel("preview")}
                    />
                    <ToolbarButton
                        active={activePanel === "inspector"}
                        icon={panelMeta.inspector.icon}
                        label="Inspector"
                        onClick={() => togglePanel("inspector")}
                    />
                    <ToolbarButton
                        active={activePanel === "resources"}
                        icon={panelMeta.resources.icon}
                        label="Risorse"
                        onClick={() => togglePanel("resources")}
                    />
                    <ToolbarButton
                        active={activePanel === "draft"}
                        icon={panelMeta.draft.icon}
                        label={`Draft ${state.pendingChanges.length || ""}`}
                        onClick={() => togglePanel("draft")}
                    />
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
                        Pubblica{" "}
                        {state.pendingChanges.length > 0
                            ? `(${state.pendingChanges.length})`
                            : ""}
                    </FDButton>
                </div>
            </FDBox>

            <CanvasActionToolbar
                mode={canvasMode}
                showUsers={showUsersOnCanvas}
                onChangeMode={setCanvasMode}
                onToggleUsers={() => setShowUsersOnCanvas((value) => !value)}
            />

            <CanvasZoomToolbar
                zoom={canvasZoom}
                onZoomIn={() => setCanvasZoom((value) => clampZoom(value * 1.12))}
                onZoomOut={() => setCanvasZoom((value) => clampZoom(value / 1.12))}
                onZoomReset={resetCanvasViewport}
            />

            {activePanel && activeMeta ? (
                <WorkspacePanel
                    title={activeMeta.title}
                    subtitle={
                        activePanel === "draft"
                            ? `${state.pendingChanges.length} modifiche non pubblicate`
                            : activeMeta.subtitle
                    }
                    icon={activeMeta.icon}
                    onClose={() => setActivePanel(null)}
                >
                    {activePanel === "groups" ? (
                        <GroupTreePanel
                            groups={state.snapshot.groups}
                            edges={state.snapshot.edges}
                            selectedGroupId={state.selectedGroupId}
                            onSelectGroup={state.setSelectedGroupId}
                            onCreateGroup={state.createGroup}
                        />
                    ) : null}

                    {activePanel === "preview" ? (
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
                    ) : null}

                    {activePanel === "inspector" ? (
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
                    ) : null}

                    {activePanel === "resources" ? (
                        <ResourceLibraryPanel
                            resources={state.snapshot.resources}
                            onGrant={state.grantResourceToSelectedGroup}
                        />
                    ) : null}

                    {activePanel === "draft" ? (
                        <PendingChangesBar
                            changes={state.pendingChanges}
                            isPublishing={state.isPublishing}
                            onDiscard={state.discardDraft}
                        />
                    ) : null}
                </WorkspacePanel>
            ) : null}
        </div>
    );
}

function CanvasActionToolbar({
    mode,
    showUsers,
    onChangeMode,
    onToggleUsers,
}: {
    mode: CanvasMode;
    showUsers: boolean;
    onChangeMode: (mode: CanvasMode) => void;
    onToggleUsers: () => void;
}) {
    const items: Array<{
        key: CanvasMode;
        label: string;
        description: string;
        icon: ReactNode;
    }> = [
            {
                key: "move",
                label: "Sposta",
                description: "Sposta blocchi, utenti, gruppi selezionati e camera",
                icon: <MdOpenWith />,
            },
            {
                key: "connect",
                label: "Collega",
                description: "Crea collegamenti o ricollega utenti",
                icon: <MdAddLink />,
            },
            {
                key: "delete-link",
                label: "Rimuovi",
                description: "Rimuovi collegamenti o utenti dal gruppo",
                icon: <MdLinkOff />,
            },
            {
                key: "multi-select",
                label: "Seleziona",
                description: "Seleziona più blocchi, poi passa a Sposta",
                icon: <MdSelectAll />,
            },
        ];

    return (
        <FDBox
            radius="2xl"
            shadow="xl"
            pad="xs"
            border
            variant="gradient"
            className="!fixed bottom-4 right-3 z-40 flex max-h-[calc(100dvh-7rem)] flex-col items-center gap-2 overflow-y-auto lg:bottom-auto lg:right-5 lg:top-1/2 lg:-translate-y-1/2 lg:overflow-visible"
            aria-label="Azioni canvas"
        >
            <div className="px-2 pb-1 pt-1 text-center text-[0.56rem] font-black uppercase tracking-[0.2em] text-neutral-500">
                Canvas
            </div>
            {items.map((item) => (
                <IconButton
                    key={item.key}
                    active={mode === item.key}
                    icon={item.icon}
                    label={item.label}
                    title={item.description}
                    onClick={() => onChangeMode(item.key)}
                />
            ))}

            <div className="mx-0 h-px w-8 shrink-0 bg-neutral-200 dark:bg-neutral-800" />

            <IconButton
                active={showUsers}
                icon={<MdPeople />}
                label="Utenti"
                title="Mostra utenti come nodi collegati"
                onClick={onToggleUsers}
            />
        </FDBox>
    );
}

function CanvasZoomToolbar({
    zoom,
    onZoomIn,
    onZoomOut,
    onZoomReset,
}: {
    zoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomReset: () => void;
}) {
    return (
        <FDBox
            radius="2xl"
            shadow="xl"
            pad="xs"
            border
            variant="gradient"
            className="pointer-events-auto !fixed bottom-4 left-4 z-40 flex max-w-[calc(100vw-6.5rem)] items-center gap-2 overflow-x-auto"
            aria-label="Controlli zoom canvas"
        >
            <div className="hidden px-2 text-[0.56rem] font-black uppercase tracking-[0.2em] text-neutral-500 sm:block">
                Zoom
            </div>
            <IconButton
                icon={<MdZoomOut />}
                label="Zoom -"
                title="Zoom out"
                onClick={onZoomOut}
            />
            <button
                type="button"
                onClick={onZoomReset}
                title="Reset zoom e camera"
                className="grid h-11 min-w-16 shrink-0 place-items-center rounded-2xl border border-neutral-200 bg-white px-3 text-xs font-black text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
                aria-label="Reset zoom e camera"
            >
                {Math.round(zoom * 100)}%
            </button>
            <IconButton
                icon={<MdZoomIn />}
                label="Zoom +"
                title="Zoom in"
                onClick={onZoomIn}
            />
            <IconButton
                icon={<MdCenterFocusStrong />}
                label="Reset"
                title="Reset zoom e camera"
                onClick={onZoomReset}
            />
        </FDBox>
    );
}

function ToolbarButton({
    active,
    icon,
    label,
    onClick,
}: {
    active: boolean;
    icon: ReactNode;
    label: string;
    onClick: () => void;
}) {
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

function IconButton({
    active,
    icon,
    label,
    title,
    onClick,
}: {
    active?: boolean;
    icon: ReactNode;
    label: string;
    title: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={cx(
                "grid h-11 w-11 shrink-0 place-items-center rounded-2xl border text-lg transition",
                active
                    ? "border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800",
            )}
            aria-label={label}
            aria-pressed={active}
        >
            {icon}
        </button>
    );
}

function WorkspacePanel({
    title,
    subtitle,
    icon,
    onClose,
    children,
}: {
    title: string;
    subtitle: string;
    icon: ReactNode;
    onClose: () => void;
    children: ReactNode;
}) {
    return (
        <FDBox
            radius="2xl"
            shadow="2xl"
            border
            variant="gradient"
            className="!fixed inset-x-3 bottom-20 top-auto z-50 flex max-h-[70dvh] flex-col overflow-hidden lg:inset-x-auto lg:bottom-5 lg:left-5 lg:top-24 lg:h-auto lg:max-h-none lg:w-[min(440px,calc(100vw-2rem))]"
            role="complementary"
        >
            <div className="flex items-start justify-between gap-3 border-b border-neutral-200 p-4 dark:border-neutral-800">
                <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-50 text-xl text-blue-700 dark:bg-blue-950/60 dark:text-blue-200">
                        {icon}
                    </span>
                    <div className="min-w-0">
                        <div className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-neutral-500">
                            {subtitle}
                        </div>
                        <h2 className="mt-1 truncate text-lg font-black tracking-tight">
                            {title}
                        </h2>
                    </div>
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

export default App;
