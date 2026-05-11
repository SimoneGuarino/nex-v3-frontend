import { useEffect, useMemo, useState } from "react";
import { isAuthInvalidationError } from "@nex/shared-platform";
import { fetchRuntimeNavigation } from "./api";
import { buildLegacyRoutesFromNavigationResources } from "./legacyRouteBuilder";
import type { LegacyRouteRegistry } from "./legacyRouteRegistry";
import type { LegacyNavigationRoutesState } from "./types";

const ENABLE_STATIC_NAVIGATION_FALLBACK =
    import.meta.env.VITE_LEGACY_NAVIGATION_STATIC_FALLBACK === "true";

const EMPTY_NAVIGATION_STATE: LegacyNavigationRoutesState = {
    routes: [],
    source: "navigation-resources",
    loading: false,
    error: null,
    version: null,
    failedClosed: false,
};

export function useLegacyNavigationRoutes(args: {
    registry: LegacyRouteRegistry;
    userDetails: any;
    tenant?: string;
    appId?: string;
}): LegacyNavigationRoutesState {
    const { registry, userDetails, tenant = "Focelda", appId = "legacy" } = args;
    const [state, setState] = useState<LegacyNavigationRoutesState>(EMPTY_NAVIGATION_STATE);

    const actorRole = userDetails?.ruolo;
    const username = userDetails?.username;
    const authzVersion = userDetails?.authz?.version;

    useEffect(() => {
        if (!userDetails) {
            setState(EMPTY_NAVIGATION_STATE);
            return;
        }

        const controller = new AbortController();
        let mounted = true;

        setState((previous) => ({
            ...previous,
            loading: true,
            error: null,
            failedClosed: false,
        }));

        fetchRuntimeNavigation({ tenant, appId, signal: controller.signal })
            .then((response) => {
                if (!mounted) return;

                const runtimeRoutes = buildLegacyRoutesFromNavigationResources({
                    resources: response.resources || [],
                    registry,
                });

                if (runtimeRoutes.length === 0) {
                    const message = "Nessuna navigation_resource applicabile trovata.";

                    if (ENABLE_STATIC_NAVIGATION_FALLBACK) {
                        console.warn("[legacy-navigation]", message, "Fallback statico abilitato da env.");
                        setState({
                            routes: [],
                            source: "navigation-resources",
                            loading: false,
                            error: `${message} Fallback statico non disponibile: usare legacyRouteRegistry + navigation_resources.`,
                            version: response.version ?? null,
                            failedClosed: false,
                        });
                        return;
                    }

                    setState({
                        routes: [],
                        source: "navigation-resources",
                        loading: false,
                        error: message,
                        version: response.version ?? null,
                        failedClosed: true,
                    });
                    return;
                }

                setState({
                    routes: runtimeRoutes,
                    source: "navigation-resources",
                    loading: false,
                    error: null,
                    version: response.version ?? null,
                    failedClosed: false,
                });
            })
            .catch((error) => {
                if (!mounted || controller.signal.aborted) return;
                if (isAuthInvalidationError(error)) return;

                const message = error instanceof Error ? error.message : "Runtime navigation non disponibile";

                if (ENABLE_STATIC_NAVIGATION_FALLBACK) {
                    console.warn("[legacy-navigation] runtime navigation non disponibile: fallback statico DEV", error);
                    setState({
                        routes: [],
                        source: "navigation-resources",
                        loading: false,
                        error: `${message}. Fallback statico non disponibile: usare legacyRouteRegistry + navigation_resources.`,
                        version: null,
                        failedClosed: false,
                    });
                    return;
                }

                console.error("[legacy-navigation] runtime navigation non disponibile: fail-closed", error);
                setState({
                    routes: [],
                    source: "navigation-resources",
                    loading: false,
                    error: message,
                    version: null,
                    failedClosed: true,
                });
            });

        return () => {
            mounted = false;
            controller.abort();
        };
    }, [appId, tenant, username, actorRole, authzVersion, registry, userDetails]);

    return useMemo(() => state, [state]);
}
