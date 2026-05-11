import type { NavigationRuntimeResource, NavigationResourceContext } from "./types";
import type { LegacyRouteRegistry, LegacyRouteRegistryEntry } from "./legacyRouteRegistry";
import { resolveNavigationIcon } from "./navigationIconRegistry";

type RegistryIndex = {
    byKey: Map<string, LegacyRouteRegistryEntry>;
};

const NAVIGATION_TYPES = new Set(["GROUP", "PANEL"]);

function normalizeRoutePath(value: unknown): string {
    const route = typeof value === "string" ? value.trim() : "";
    if (!route) return "";

    if (route === "/legacy") return "/";
    if (route.startsWith("/legacy/")) {
        const stripped = route.slice("/legacy".length);
        return stripped || "/";
    }

    return route;
}

function normalizeRouteKey(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function buildRegistryIndex(registry: LegacyRouteRegistry): RegistryIndex {
    const byKey = new Map<string, LegacyRouteRegistryEntry>();

    for (const entry of registry || []) {
        const key = normalizeRouteKey(entry.key);
        if (key && !byKey.has(key)) byKey.set(key, entry);
    }

    return { byKey };
}

function sortResources(a: NavigationRuntimeResource, b: NavigationRuntimeResource): number {
    const orderA = Number.isFinite(Number(a.order)) ? Number(a.order) : 0;
    const orderB = Number.isFinite(Number(b.order)) ? Number(b.order) : 0;
    if (orderA !== orderB) return orderA - orderB;
    return String(a.name || a.key).localeCompare(String(b.name || b.key), "it");
}

function getContext(resource: NavigationRuntimeResource): NavigationResourceContext {
    const context = resource.context && typeof resource.context === "object" ? resource.context : {};
    const meta = resource.meta && typeof resource.meta === "object" ? resource.meta : {};

    // Backward compatibility for resources created before context existed.
    return {
        ...context,
        route: context.route ?? resource.route,
        hidden: context.hidden ?? meta.hidden,
        isNew: context.isNew ?? meta.isNew,
        redirect: context.redirect ?? meta.redirect,
        system: context.system ?? meta.system,
        showWhenEmpty: context.showWhenEmpty ?? meta.showWhenEmpty,
        public: context.public ?? meta.public,
        alwaysVisible: context.alwaysVisible ?? meta.alwaysVisible,
        presentation: {
            ...(context.presentation || {}),
            icon: context.presentation?.icon ?? meta.icon,
        },
        legacy: {
            ...(context.legacy || {}),
            componentKey: context.legacy?.componentKey ?? meta.legacyRouteKey,
            routeKey: context.legacy?.routeKey ?? meta.legacyRouteKey,
        },
    };
}

function findRegistryEntry(index: RegistryIndex, resource: NavigationRuntimeResource): LegacyRouteRegistryEntry | undefined {
    const context = getContext(resource);

    const componentKey = normalizeRouteKey(context.legacy?.componentKey || context.legacy?.routeKey);
    if (componentKey) {
        const byComponentKey = index.byKey.get(componentKey);
        if (byComponentKey) return byComponentKey;
    }

    const byKey = index.byKey.get(resource.key);
    if (byKey) return byKey;

    return undefined;
}

function buildPanelRoute(resource: NavigationRuntimeResource, registryEntry: LegacyRouteRegistryEntry | undefined): RouteElement | null {
    const context = getContext(resource);

    if (!registryEntry?.component) {
        console.warn(
            "[legacy-navigation] navigation_resource ignorata: nessun componente registry trovato per il pannello",
            { key: resource.key, componentKey: context.legacy?.componentKey, route: context.route },
        );
        return null;
    }

    const runtimeRoute = normalizeRoutePath(context.route);

    if (!runtimeRoute) {
        console.warn(
            "[legacy-navigation] navigation_resource ignorata: route runtime assente nel context",
            { key: resource.key, componentKey: context.legacy?.componentKey },
        );
        return null;
    }

    const hidden = context.hidden === true;

    return {
        key: resource.key,
        name: resource.name || registryEntry.key,
        route: runtimeRoute,
        type: hidden ? ("hidden" as any) : "visible",
        hide: hidden,
        isNew: context.isNew === true,
        redirect: typeof context.redirect === "string" ? context.redirect : undefined,
        icon: resolveNavigationIcon(context.presentation?.icon),
        component: registryEntry.component,
        meta: {
            navigationResourceId: resource._id,
            navigationPermission: resource.permission,
            source: "navigation_resources",
            system: context.system === true,
            context,
        },
    } as RouteElement;
}

function buildGroupRoute(resource: NavigationRuntimeResource, registryEntry: LegacyRouteRegistryEntry | undefined, children: RouteElement[]): RouteElement | null {
    const context = getContext(resource);

    if (children.length === 0 && context.showWhenEmpty !== true) return null;

    const runtimeRoute = normalizeRoutePath(context.route);
    const hidden = context.hidden === true;

    return {
        key: resource.key,
        name: resource.name || registryEntry?.key || resource.key,
        route: runtimeRoute || undefined,
        type: hidden ? ("hidden" as any) : "nested",
        hide: hidden,
        isNew: context.isNew === true,
        redirect: typeof context.redirect === "string" ? context.redirect : undefined,
        icon: resolveNavigationIcon(context.presentation?.icon),
        component: registryEntry?.component,
        nested: { elements: children },
        meta: {
            navigationResourceId: resource._id,
            navigationPermission: resource.permission,
            source: "navigation_resources",
            system: context.system === true,
            context,
        },
    } as RouteElement;
}

function uniqueRoutesByKey(routes: RouteElement[]): RouteElement[] {
    const seen = new Set<string>();
    const output: RouteElement[] = [];

    for (const route of routes) {
        const key = normalizeRouteKey(route.key);
        if (key && seen.has(key)) continue;
        if (key) seen.add(key);
        output.push(route);
    }

    return output;
}

export function buildLegacyRoutesFromNavigationResources(args: {
    resources: NavigationRuntimeResource[];
    registry: LegacyRouteRegistry;
}): RouteElement[] {
    const index = buildRegistryIndex(args.registry);

    const activeResources = (args.resources || [])
        .filter((resource) => resource?.status !== "DISABLED")
        .filter((resource) => NAVIGATION_TYPES.has(String(resource.type)))
        .sort(sortResources);

    const byParentKey = new Map<string, NavigationRuntimeResource[]>();

    for (const resource of activeResources) {
        const parentKey = normalizeRouteKey(resource.parentKey);
        const values = byParentKey.get(parentKey) || [];
        values.push(resource);
        byParentKey.set(parentKey, values);
    }

    const buildChildren = (parentKey: string, visiting = new Set<string>()): RouteElement[] => {
        const children = byParentKey.get(parentKey) || [];
        const output: RouteElement[] = [];

        for (const child of children) {
            if (visiting.has(child.key)) {
                console.warn("[legacy-navigation] ciclo navigation_resources ignorato", child.key);
                continue;
            }

            const registryEntry = findRegistryEntry(index, child);

            if (child.type === "GROUP") {
                const nextVisiting = new Set(visiting);
                nextVisiting.add(child.key);
                const nestedChildren = buildChildren(child.key, nextVisiting);
                const groupRoute = buildGroupRoute(child, registryEntry, nestedChildren);
                if (groupRoute) output.push(groupRoute);
                continue;
            }

            if (child.type === "PANEL") {
                const panelRoute = buildPanelRoute(child, registryEntry);
                if (panelRoute) output.push(panelRoute);
            }
        }

        return output;
    };

    return uniqueRoutesByKey(buildChildren(""));
}
