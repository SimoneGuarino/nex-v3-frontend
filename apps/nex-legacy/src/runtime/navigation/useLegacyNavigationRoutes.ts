import { useMemo } from "react";
import { buildLegacyRoutesFromNavigationResources } from "./legacyRouteBuilder";
import type { LegacyRouteRegistry } from "./legacyRouteRegistry";
import type {
    LegacyNavigationRoutesState,
    NavigationRuntimeResource,
} from "./types";

const EMPTY_NAVIGATION_STATE: LegacyNavigationRoutesState = {
    routes: [],
    source: "navigation-resources",
    loading: false,
    error: null,
    version: null,
    failedClosed: false,
};

function isNavigationRuntimeResource(value: unknown): value is NavigationRuntimeResource {
    if (!value || typeof value !== "object") return false;

    const candidate = value as Partial<NavigationRuntimeResource>;

    return (
        typeof candidate.key === "string" &&
        typeof candidate.type === "string" &&
        typeof candidate.name === "string"
    );
}

function readAuthzResources(userDetails: any): NavigationRuntimeResource[] {
    const resources = userDetails?.authz?.resources;
    if (!Array.isArray(resources)) return [];

    return resources.filter(isNavigationRuntimeResource);
}

function hasHydratedAuthz(userDetails: any): boolean {
    const authz = userDetails?.authz;
    if (!authz || typeof authz !== "object") return false;

    return (
        typeof authz.version === "string" ||
        Array.isArray(authz.resources) ||
        Array.isArray(authz.caps)
    );
}

export function useLegacyNavigationRoutes(args: {
    registry: LegacyRouteRegistry;
    userDetails: any;
    tenant?: string;
    appId?: string;
}): LegacyNavigationRoutesState {
    const { registry, userDetails } = args;

    return useMemo<LegacyNavigationRoutesState>(() => {
        if (!userDetails) {
            return EMPTY_NAVIGATION_STATE;
        }

        const authzReady = hasHydratedAuthz(userDetails);
        const authz = userDetails?.authz ?? {};
        const version = typeof authz.version === "string" ? authz.version : null;

        if (!authzReady) {
            return {
                ...EMPTY_NAVIGATION_STATE,
                loading: true,
                version,
            };
        }

        const resources = readAuthzResources(userDetails);
        const runtimeRoutes = buildLegacyRoutesFromNavigationResources({
            resources,
            registry,
        });

        if (runtimeRoutes.length === 0) {
            return {
                routes: [],
                source: "navigation-resources",
                loading: false,
                error: "Nessuna navigation_resource applicabile trovata nello snapshot AuthZ condiviso.",
                version,
                failedClosed: true,
            };
        }

        return {
            routes: runtimeRoutes,
            source: "navigation-resources",
            loading: false,
            error: null,
            version,
            failedClosed: false,
        };
    }, [registry, userDetails]);
}
