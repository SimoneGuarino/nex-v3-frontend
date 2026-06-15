import React from "react";
import type { WorkspaceTab } from "../../domain/workspace.types";
import { WorkspaceStatusStrip } from "../shell";
import { MEPA_WORKSPACE_TABS } from "./workspaceTabs";
import { preloadWorkspaceTab, scheduleWorkspaceTabPreload } from "./workspaceTabLoader";

/**
 * Public contract of the MEPA workspace shell.
 *
 * The screen deliberately receives a large `featureProps` bag from the page
 * container instead of importing feature controllers directly. This keeps the
 * workspace shell framework-level only: it controls tab navigation, ARIA wiring,
 * lazy-tab preloading and panel boundaries, while domain hooks remain owned by
 * `index.tsx`. In a future migration this contract can be typed more strictly
 * per tab without changing the rendering strategy.
 */
type WorkspaceScreenProps = {
    selectedTender: any;
    snapshot: any;
    activeTab: WorkspaceTab;
    setActiveTab: (tab: WorkspaceTab) => void;
    renderActiveTab: (tab: WorkspaceTab, props: Record<string, unknown>) => React.ReactNode;
    [key: string]: unknown;
};

/**
 * Workspace-level shell and tab router for the selected MEPA tender.
 *
 * This component owns only navigation chrome. Feature state and business logic
 * remain outside the shell and are rendered through `renderActiveTab`, allowing
 * each tab to be extracted/lazy-loaded incrementally without changing the
 * public workspace contract.
 */
function WorkspaceScreenComponent({ selectedTender, snapshot, activeTab, setActiveTab, renderActiveTab, ...featureProps }: WorkspaceScreenProps) {
    // Render is delegated to the workspace tab loader so this shell never imports
    // heavyweight tab implementations. This is the key separation that allows
    // code-splitting and feature-by-feature scalability.
    const activeContent = renderActiveTab(activeTab, { selectedTender, snapshot, activeTab, setActiveTab, ...featureProps });

    // After the active tab is mounted, warm the most likely neighbour chunks during
    // browser idle time. The cleanup returned by the scheduler prevents obsolete
    // preloads from continuing after a fast tab change.
    React.useEffect(() => scheduleWorkspaceTabPreload(activeTab), [activeTab]);

    // User intent preloading: hover/focus/touch signals that the next click is
    // likely. We download only the code chunk, never the tab data, so backend
    // traffic and business side effects remain unchanged.
    const handleTabIntent = React.useCallback((tab: WorkspaceTab) => {
        preloadWorkspaceTab(tab);
    }, []);

    return (
        <div className="flex flex-col gap-5">
            <WorkspaceStatusStrip selectedTender={selectedTender} snapshot={snapshot} />
            <div
                role="tablist"
                aria-label="Sezioni workspace MEPA"
                className="flex snap-x gap-2 overflow-x-auto rounded-[24px] border border-white/70 bg-white p-2 shadow-sm scrollbar-thin scrollbar-thumb-slate-200 dark:border-neutral-800 dark:bg-neutral-900 dark:scrollbar-thumb-neutral-700 sm:flex-wrap"
            >
                {MEPA_WORKSPACE_TABS.map(({ key, label }) => (
                    <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === key}
                        aria-controls={`mepa-workspace-panel-${key}`}
                        id={`mepa-workspace-tab-${key}`}
                        onMouseEnter={() => handleTabIntent(key)}
                        onFocus={() => handleTabIntent(key)}
                        onTouchStart={() => handleTabIntent(key)}
                        onClick={() => setActiveTab(key)}
                        className={`shrink-0 snap-start rounded-2xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900 ${activeTab === key ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:bg-slate-50 dark:text-neutral-400 dark:hover:bg-neutral-800"}`}
                    >
                        {label}
                    </button>
                ))}
            </div>
            <section
                id={`mepa-workspace-panel-${activeTab}`}
                role="tabpanel"
                aria-labelledby={`mepa-workspace-tab-${activeTab}`}
                className="min-w-0"
            >
                {activeContent}
            </section>
        </div>
    );
}

export const WorkspaceScreen = React.memo(WorkspaceScreenComponent);
