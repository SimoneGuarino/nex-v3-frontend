export type NavigationResourceType = "GROUP" | "PANEL" | "ACTION" | "DATA_SCOPE";

export interface NavigationRuntimeResource {
    _id: string;
    tenant: string;
    appId: string;
    key: string;
    type: NavigationResourceType;
    name: string;
    route?: string;
    parentKey?: string | null;
    permission?: string;
    order?: number;
    status?: "ACTIVE" | "DISABLED";
    meta?: Record<string, unknown>;
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

export type LegacyNavigationSource = "static-routes" | "navigation-resources";

export interface LegacyNavigationRoutesState {
    routes: RouteElement[];
    source: LegacyNavigationSource;
    loading: boolean;
    error: string | null;
    version: string | null;
}
