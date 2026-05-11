import { useEffect, useMemo, useState } from "react";
import { isAuthInvalidationError } from "@nex/shared-platform";
import { fetchRuntimeNavigation } from "./api";
import { buildLegacyRoutesFromNavigationResources } from "./legacyRouteBuilder";
import type { LegacyNavigationRoutesState } from "./types";

export function useLegacyNavigationRoutes(args: {
    staticRoutes: RouteElement[];
    userDetails: any;
    tenant?: string;
    appId?: string;
}): LegacyNavigationRoutesState {
    const { staticRoutes, userDetails, tenant = "Focelda", appId = "legacy" } = args;
    const [state, setState] = useState<LegacyNavigationRoutesState>({
        routes: staticRoutes,
        source: "static-routes",
        loading: false,
        error: null,
        version: null,
    });

    const actorRole = userDetails?.ruolo;
    const username = userDetails?.username;
    const authzVersion = userDetails?.authz?.version;

    useEffect(() => {
        if (!userDetails) {
            setState({ routes: staticRoutes, source: "static-routes", loading: false, error: null, version: null });
            return;
        }

        const controller = new AbortController();
        let mounted = true;

        setState((previous) => ({ ...previous, loading: true, error: null }));

        fetchRuntimeNavigation({ tenant, appId, signal: controller.signal })
            .then((response) => {
                if (!mounted) return;

                const runtimeRoutes = buildLegacyRoutesFromNavigationResources({
                    resources: response.resources || [],
                    staticRoutes,
                });

                if (runtimeRoutes.length === 0) {
                    setState({
                        routes: staticRoutes,
                        source: "static-routes",
                        loading: false,
                        error: "Nessuna navigation_resource applicabile trovata: uso routes.ts come fallback.",
                        version: response.version ?? null,
                    });
                    return;
                }

                setState({
                    routes: runtimeRoutes,
                    source: "navigation-resources",
                    loading: false,
                    error: null,
                    version: response.version ?? null,
                });
            })
            .catch((error) => {
                if (!mounted || controller.signal.aborted) return;
                if (isAuthInvalidationError(error)) return;

                console.warn("[legacy-navigation] runtime navigation non disponibile: uso routes.ts come fallback", error);
                setState({
                    routes: staticRoutes,
                    source: "static-routes",
                    loading: false,
                    error: error instanceof Error ? error.message : "Runtime navigation non disponibile",
                    version: null,
                });
            });

        return () => {
            mounted = false;
            controller.abort();
        };
    }, [appId, tenant, username, actorRole, authzVersion, staticRoutes, userDetails]);

    return useMemo(() => state, [state]);
}
