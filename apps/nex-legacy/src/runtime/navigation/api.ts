import { authenticatedFetch, isAuthInvalidationError } from "@nex/shared-platform";
import type { NavigationRuntimeResponse } from "./types";

const AUTH_BASE = normalizeBase(import.meta.env.VITE_AUTH_API_ENDPOINT ?? import.meta.env.VITE_API_AUTH ?? import.meta.env.VITE_API_ENDPOINT ?? "");

function normalizeBase(value: string): string {
    if (!value) return "";
    return value.endsWith("/") ? value : `${value}/`;
}

function joinUrl(base: string, path: string): string {
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return `${base}${cleanPath}`;
}

export async function fetchRuntimeNavigation(args: {
    tenant?: string;
    appId: string;
    signal?: AbortSignal;
}): Promise<NavigationRuntimeResponse> {
    const tenant = args.tenant ?? "Focelda";
    const url = joinUrl(
        AUTH_BASE,
        `entitlements/navigation?tenant=${encodeURIComponent(tenant)}&appId=${encodeURIComponent(args.appId)}`,
    );

    try {
        const response = await authenticatedFetch(
            url,
            { method: "GET", signal: args.signal },
            { source: "legacy-navigation" },
        );

        return await response.json() as NavigationRuntimeResponse;
    } catch (error) {
        // Auth errors must bubble up: shared-platform already invalidates the session
        // and the shell AuthGate owns the redirect to /login.
        if (isAuthInvalidationError(error)) throw error;
        throw error;
    }
}
