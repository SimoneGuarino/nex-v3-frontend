import React from "react";
import type { WorkspaceTab } from "../../domain/workspace.types";
import { WorkspaceTabErrorBoundary } from "./WorkspaceTabErrorBoundary";

/**
 * Central registry for all lazy workspace chunks.
 *
 * Every entry must point to the feature barrel (`../overview`, `../products`, ...)
 * instead of the concrete component file. This keeps imports stable if a tab is
 * internally refactored and gives the workspace one single place to manage
 * preload policy, error boundaries and future feature flags.
 */
const workspaceTabLoaders = {
    overview: () => import("../overview"),
    documents: () => import("../documents"),
    dossier: () => import("../dossier"),
    products: () => import("../products"),
    chat: () => import("../chat"),
    observability: () => import("../observability"),
    quotation: () => import("../quotation"),
} satisfies Record<WorkspaceTab, () => Promise<any>>;

// React.lazy declarations intentionally live next to the loader registry. This
// prevents accidental static imports in the page shell and guarantees that heavy
// tabs such as Products, Dossier and Observability stay outside the initial MEPA bundle.
const OverviewTab = React.lazy(() => workspaceTabLoaders.overview().then((module) => ({ default: module.OverviewTab })));
const DocumentsTab = React.lazy(() => workspaceTabLoaders.documents().then((module) => ({ default: module.DocumentsTab })));
const DossierTab = React.lazy(() => workspaceTabLoaders.dossier().then((module) => ({ default: module.DossierTab })));
const ProductsTab = React.lazy(() => workspaceTabLoaders.products().then((module) => ({ default: module.ProductsTab })));
const ChatTab = React.lazy(() => workspaceTabLoaders.chat().then((module) => ({ default: module.ChatTab })));
const ObservabilityTab = React.lazy(() => workspaceTabLoaders.observability().then((module) => ({ default: module.ObservabilityTab })));
const QuotationTab = React.lazy(() => workspaceTabLoaders.quotation().then((module) => ({ default: module.QuotationTab })));

// Module-level cache for chunks already requested in this browser session.
// It avoids duplicate dynamic-import calls when hover, focus and idle preloading
// fire close to each other for the same tab.
const preloadedTabs = new Set<WorkspaceTab>();

/**
 * Warms the code-split chunk for a workspace tab on user intent.
 *
 * The tab remains lazy-loaded for the initial page render, but pointer/focus
 * intent lets the browser download the next likely chunk before the click.
 * This improves perceived performance on slower office devices without
 * eagerly loading every heavy MEPA feature at startup.
 */
export function preloadWorkspaceTab(tab: WorkspaceTab) {
    if (preloadedTabs.has(tab)) return;
    preloadedTabs.add(tab);
    void workspaceTabLoaders[tab]().catch(() => {
        preloadedTabs.delete(tab);
    });
}

// Default priority order after Overview. These tabs represent the common buyer
// workflow: inspect documents, review extracted products, open dossier, then
// check infrastructure/AI observability if something looks inconsistent.
const OVERVIEW_IDLE_PRELOAD_TABS: WorkspaceTab[] = ["documents", "products", "dossier", "observability"];
/**
 * Lightweight navigation graph used for speculative preload.
 *
 * This is intentionally declarative: changing product behaviour does not require
 * editing component logic. If analytics later show different usage patterns, only
 * this map needs to be adjusted.
 */
const TAB_NEIGHBOURS: Record<WorkspaceTab, WorkspaceTab[]> = {
    overview: OVERVIEW_IDLE_PRELOAD_TABS,
    documents: ["overview", "dossier", "products"],
    dossier: ["documents", "products", "overview"],
    products: ["dossier", "documents", "observability"],
    chat: ["overview", "dossier"],
    observability: ["products", "dossier", "overview"],
    quotation: ["overview", "products"],
};

/**
 * Detects constrained network conditions before scheduling speculative work.
 *
 * Big dashboards should not optimize desktop transitions at the cost of users on
 * mobile hotspots or data-saver. When the Network Information API is unavailable
 * we fall back to the normal preload strategy because modern browsers simply omit
 * the signal rather than exposing a false slow-connection state.
 */
function shouldUseConservativePreload() {
    if (typeof navigator === "undefined") return false;
    const connection = (navigator as any).connection;
    return Boolean(connection?.saveData || ["slow-2g", "2g"].includes(String(connection?.effectiveType ?? "").toLowerCase()));
}

/**
 * Preloads the most likely next workspace chunks during idle time.
 *
 * This keeps the initial Overview render light, but makes common transitions
 * such as Overview -> Documenti/Prodotti/Dossier feel immediate. The scheduler
 * intentionally backs off when the browser reports data-saver or very slow
 * connections, avoiding unnecessary network pressure on constrained devices.
 */
export function scheduleWorkspaceTabPreload(activeTab: WorkspaceTab) {
    if (typeof window === "undefined" || shouldUseConservativePreload()) return () => undefined;

    const tabs = (TAB_NEIGHBOURS[activeTab] ?? OVERVIEW_IDLE_PRELOAD_TABS).filter((tab) => tab !== activeTab);
    let cancelled = false;

    const run = () => {
        if (cancelled) return;
        tabs.forEach(preloadWorkspaceTab);
    };

    if ("requestIdleCallback" in window) {
        const idleId = (window as any).requestIdleCallback(run, { timeout: 1800 });
        return () => {
            cancelled = true;
            (window as any).cancelIdleCallback?.(idleId);
        };
    }

    const timeoutId = window.setTimeout(run, 900);
    return () => {
        cancelled = true;
        window.clearTimeout(timeoutId);
    };
}

/**
 * Skeleton displayed while a lazy workspace tab is downloading.
 *
 * The fallback is intentionally generic and small: it stabilizes layout without
 * importing tab-specific dependencies, keeping the Suspense boundary cheap.
 */
export function WorkspaceTabFallback() {
    return (
        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
            <div className="h-3 w-36 animate-pulse rounded-full bg-slate-200 dark:bg-neutral-800" />
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="h-24 animate-pulse rounded-3xl bg-slate-100 dark:bg-neutral-800" />
                <div className="h-24 animate-pulse rounded-3xl bg-slate-100 dark:bg-neutral-800" />
                <div className="h-24 animate-pulse rounded-3xl bg-slate-100 dark:bg-neutral-800" />
            </div>
        </div>
    );
}

/**
 * Renders the selected workspace tab behind a local Suspense boundary.
 *
 * The switch is centralized to keep the page container independent from tab
 * implementation details and to make future feature flags, access control or
 * chunk-level preloading changes isolated to the workspace feature boundary.
 */
export function renderWorkspaceTab(tab: WorkspaceTab, workspaceProps: Record<string, any>) {
    // Keep tab-specific prop mapping here instead of leaking it into `index.tsx`.
    // Dossier and Quotation require narrower contracts than the generic tabs,
    // while the remaining tabs can safely receive the full workspace prop bag.
    let tabContent: React.ReactNode = null;

    if (tab === "overview") tabContent = <OverviewTab {...workspaceProps} />;
    if (tab === "documents") tabContent = <DocumentsTab {...workspaceProps} />;
    if (tab === "dossier") {
        tabContent = (
            <DossierTab
                dossier={workspaceProps.dossier}
                latestAgentRun={workspaceProps.latestAgentRun}
                summary={workspaceProps.dossierSummary}
                report={workspaceProps.dossierReport}
                quality={workspaceProps.dossierQuality}
                onLoadReport={workspaceProps.onLoadDossierReport}
                onLoadQuality={workspaceProps.onLoadDossierQuality}
                loading={workspaceProps.loading}
                criticalities={workspaceProps.criticalities}
                actions={workspaceProps.actions}
                onValidate={workspaceProps.onValidate}
            />
        );
    }
    if (tab === "products") tabContent = <ProductsTab {...workspaceProps} />;
    if (tab === "chat") tabContent = <ChatTab {...workspaceProps} />;
    if (tab === "observability") tabContent = <ObservabilityTab {...workspaceProps} />;
    if (tab === "quotation") tabContent = <QuotationTab selectedTender={workspaceProps.selectedTender} />;

    return (
        <WorkspaceTabErrorBoundary tab={tab}>
            <React.Suspense fallback={<WorkspaceTabFallback />}>{tabContent}</React.Suspense>
        </WorkspaceTabErrorBoundary>
    );
}
