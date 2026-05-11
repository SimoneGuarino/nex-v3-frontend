export type NavigationResourceType = "GROUP" | "PANEL" | "ACTION" | "DATA_SCOPE";


export interface NavigationRuntimeIconSpec {
    pack: string;
    name: string;
}

export interface NavigationResourceContext {
    /** Runtime path used by microfrontends. Example: /legacy/commerciale/quotazioni. */
    route?: string;
    /** Hides the resource from the sidebar while keeping it routable. */
    hidden?: boolean;
    /** Shows the legacy "new" badge in the sidebar. */
    isNew?: boolean;
    /** Optional external redirect target. */
    redirect?: string;
    /** Core/system route, still data-driven from MongoDB. */
    system?: boolean;
    /** Allows an empty group/container to be rendered. */
    showWhenEmpty?: boolean;
    /** Public navigation item, bypassing caps only when backend allows it. */
    public?: boolean;
    alwaysVisible?: boolean;
    presentation?: {
        icon?: NavigationRuntimeIconSpec | string | null;
        badge?: string | null;
        tone?: string | null;
    };
    legacy?: {
        /** Technical component key in legacyRouteRegistry. */
        componentKey?: string;
        routeKey?: string;
    };
    [key: string]: unknown;
}

export interface NavigationRuntimeResource {
    _id: string;
    tenant: string;
    appId: string;
    key: string;
    type: NavigationResourceType;
    name: string;
    /** @deprecated Use context.route. Kept only for backward compatibility. */
    route?: string;
    parentKey?: string | null;
    permission?: string;
    order?: number;
    status?: "ACTIVE" | "DISABLED";
    meta?: Record<string, unknown>;
    context?: NavigationResourceContext;
    createdAt?: string;
    updatedAt?: string;
}

export interface NavigationRuntimeResponse {
    tenant: string;
    appId: string;
    actorRole: number;
    version: string;
    caps: string[];
    resources: NavigationRuntimeResource[];
    denied?: Array<{ permission: string; source: string; sourceId: string }>;
}

export type LegacyNavigationSource = "navigation-resources";

export interface LegacyNavigationRoutesState {
    routes: RouteElement[];
    source: LegacyNavigationSource;
    loading: boolean;
    error: string | null;
    version: string | null;
    /**
     * True when the runtime navigation API failed and static fallback is intentionally disabled.
     * The shell/sidebar should fail closed instead of rendering legacy routes.
     */
    failedClosed?: boolean;
}
