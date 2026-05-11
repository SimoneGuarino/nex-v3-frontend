import type { NavigationRuntimeResource } from "./types";

type StaticRouteIndex = {
    byKey: Map<string, RouteElement>;
    byRoute: Map<string, RouteElement>;
    systemRoutes: RouteElement[];
};

const SYSTEM_ROUTE_KEYS = new Set([
    "dashboard",
    "sign_in",
    "profile",
    "404",
    "dettagli_quotazione",
]);

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

function flattenStaticRoutes(routes: RouteElement[], output: RouteElement[] = []): RouteElement[] {
    for (const route of routes || []) {
        output.push(route);
        const nested = Array.isArray(route.nested) ? route.nested : route.nested?.elements;
        if (Array.isArray(nested)) flattenStaticRoutes(nested, output);
    }

    return output;
}

function buildStaticRouteIndex(staticRoutes: RouteElement[]): StaticRouteIndex {
    const byKey = new Map<string, RouteElement>();
    const byRoute = new Map<string, RouteElement>();
    const systemRoutes: RouteElement[] = [];

    for (const route of flattenStaticRoutes(staticRoutes)) {
        const key = normalizeRouteKey(route.key);
        if (key && !byKey.has(key)) byKey.set(key, route);

        const routePath = normalizeRoutePath(route.route);
        if (routePath && !byRoute.has(routePath)) byRoute.set(routePath, route);

        if (key && SYSTEM_ROUTE_KEYS.has(key)) {
            systemRoutes.push(route);
        }
    }

    return { byKey, byRoute, systemRoutes };
}

function sortResources(a: NavigationRuntimeResource, b: NavigationRuntimeResource): number {
    const orderA = Number.isFinite(Number(a.order)) ? Number(a.order) : 0;
    const orderB = Number.isFinite(Number(b.order)) ? Number(b.order) : 0;
    if (orderA !== orderB) return orderA - orderB;
    return String(a.name || a.key).localeCompare(String(b.name || b.key), "it");
}

function findStaticRoute(index: StaticRouteIndex, resource: NavigationRuntimeResource): RouteElement | undefined {
    const byKey = index.byKey.get(resource.key);
    if (byKey) return byKey;

    const routePath = normalizeRoutePath(resource.route);
    if (routePath) return index.byRoute.get(routePath);

    return undefined;
}

function buildPanelRoute(resource: NavigationRuntimeResource, staticRoute: RouteElement | undefined): RouteElement | null {
    const meta = resource.meta || {};

    if (!staticRoute?.route || !(staticRoute as any).component) {
        console.warn(
            "[legacy-navigation] navigation_resource ignorata: nessun componente statico trovato per il pannello",
            { key: resource.key, route: resource.route },
        );
        return null;
    }

    const runtimeRoute = normalizeRoutePath(resource.route) || normalizeRoutePath(staticRoute.route);

    return {
        ...staticRoute,
        key: resource.key,
        name: resource.name || staticRoute.name,
        route: runtimeRoute || staticRoute.route,
        type: (meta.hidden === true || (staticRoute as any).type === "hidden") ? ("hidden" as any) : "visible",
        hide: Boolean(meta.hidden ?? staticRoute.hide),
        isNew: Boolean(meta.isNew ?? staticRoute.isNew),
        redirect: typeof meta.redirect === "string" ? meta.redirect : staticRoute.redirect,
        meta: {
            ...(staticRoute as any).meta,
            navigationResourceId: resource._id,
            navigationPermission: resource.permission,
            source: "navigation_resources",
        },
    } as RouteElement;
}

function buildGroupRoute(resource: NavigationRuntimeResource, staticRoute: RouteElement | undefined, children: RouteElement[]): RouteElement | null {
    const meta = resource.meta || {};

    if (children.length === 0 && meta.showWhenEmpty !== true) return null;

    const runtimeRoute = normalizeRoutePath(resource.route) || normalizeRoutePath(staticRoute?.route);

    return {
        ...(staticRoute || {}),
        key: resource.key,
        name: resource.name || staticRoute?.name || resource.key,
        route: runtimeRoute || staticRoute?.route || undefined,
        type: "nested",
        icon: staticRoute?.icon,
        component: (staticRoute as any)?.component,
        nested: { elements: children },
        meta: {
            ...((staticRoute as any)?.meta || {}),
            navigationResourceId: resource._id,
            navigationPermission: resource.permission,
            source: "navigation_resources",
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
    staticRoutes: RouteElement[];
}): RouteElement[] {
    const index = buildStaticRouteIndex(args.staticRoutes);

    const activeResources = (args.resources || [])
        .filter((resource) => resource?.status !== "DISABLED")
        .filter((resource) => NAVIGATION_TYPES.has(String(resource.type)))
        .sort(sortResources);

    const byParentKey = new Map<string, NavigationRuntimeResource[]>();
    const byKey = new Map<string, NavigationRuntimeResource>();

    for (const resource of activeResources) {
        byKey.set(resource.key, resource);
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

            const staticRoute = findStaticRoute(index, child);

            if (child.type === "GROUP") {
                const nextVisiting = new Set(visiting);
                nextVisiting.add(child.key);
                const nestedChildren = buildChildren(child.key, nextVisiting);
                const groupRoute = buildGroupRoute(child, staticRoute, nestedChildren);
                if (groupRoute) output.push(groupRoute);
                continue;
            }

            if (child.type === "PANEL") {
                const panelRoute = buildPanelRoute(child, staticRoute);
                if (panelRoute) output.push(panelRoute);
            }
        }

        return output;
    };

    const rootRoutes = buildChildren("");

    // Preserve non-menu/system routes required by the legacy router. These are not
    // the source of the side-nav anymore, but they keep deep links and detail pages alive
    // while navigation_resources progressively becomes the canonical navigation registry.
    const systemRoutes = index.systemRoutes.map((route) => ({ ...route }));

    return uniqueRoutesByKey([...rootRoutes, ...systemRoutes]);
}
