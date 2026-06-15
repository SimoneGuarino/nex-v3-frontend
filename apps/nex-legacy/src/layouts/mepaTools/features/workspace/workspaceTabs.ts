import type { WorkspaceTab } from "../../domain/workspace.types";

/**
 * Metadata needed by the workspace tab bar.
 *
 * The object deliberately contains only stable navigation data. Loading,
 * permissions, rendering and prefetching live in the workspace loader/screen so
 * this config can remain a simple source of truth.
 */
export type WorkspaceTabConfig = {
    /** Stable tab id used by routing, aria attributes and lazy-loader maps. */
    key: WorkspaceTab;
    /** User-facing label rendered in the tab bar. */
    label: string;
};

/**
 * Single source of truth for the MEPA workspace navigation.
 *
 * Keeping tab metadata outside the page component prevents duplicated labels,
 * makes future feature-flagging easier and keeps the workspace shell purely
 * declarative.
 */
export const MEPA_WORKSPACE_TABS: WorkspaceTabConfig[] = [
    // Ordering is a UX decision: overview first for situational awareness, then
    // operational tabs from source documents to products, chat and diagnostics.
    { key: "overview", label: "Overview" },
    { key: "documents", label: "Documenti" },
    { key: "dossier", label: "Dossier AI" },
    { key: "products", label: "Prodotti estratti" },
    { key: "chat", label: "Chat AI" },
    { key: "observability", label: "Osservabilità" },
    { key: "quotation", label: "Quotazione collegata" },
];
