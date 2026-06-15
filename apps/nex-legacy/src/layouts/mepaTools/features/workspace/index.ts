/**
 * Public feature boundary for the MEPA workspace shell.
 *
 * The workspace feature owns tab navigation, lazy tab rendering, preload
 * strategy and local tab error isolation. It must not own tender data fetching:
 * controller hooks provide read models and callbacks, while this boundary only
 * exposes rendering infrastructure.
 */
export { WorkspaceScreen } from "./WorkspaceScreen";
export { MEPA_WORKSPACE_TABS } from "./workspaceTabs";
export type { WorkspaceTabConfig } from "./workspaceTabs";
export { preloadWorkspaceTab, renderWorkspaceTab, WorkspaceTabFallback } from "./workspaceTabLoader";

export { WorkspaceTabErrorBoundary } from "./WorkspaceTabErrorBoundary";
