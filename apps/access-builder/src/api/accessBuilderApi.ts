import { authenticatedFetch, isAuthInvalidationError } from "@nex/shared-platform";
import { accessBuilderFixture } from "../fixtures/accessBuilderFixture";
import type { AccessBuilderSnapshot, EffectiveAccessPreview, ObjectIdString, PendingChange } from "../model/types";

const ADMIN_BASE = normalizeBase(import.meta.env.VITE_API_ADMIN ?? "");
const AUTH_BASE = normalizeBase(import.meta.env.VITE_AUTH_API_ENDPOINT ?? import.meta.env.VITE_API_AUTH ?? "");
const ACCESS_BASE = normalizeBase(import.meta.env.VITE_API_ACCESS_BUILDER ?? ADMIN_BASE);
const USE_MOCK_FALLBACK = (import.meta.env.VITE_ACCESS_BUILDER_MOCK_FALLBACK ?? "true") !== "false";

function normalizeBase(value: string): string {
    if (!value) return "";
    return value.endsWith("/") ? value : `${value}/`;
}

function joinUrl(base: string, path: string): string {
    if (!base) return path.startsWith("/") ? path : `/${path}`;
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return `${base}${cleanPath}`;
}

function accessUrl(path: string): string {
    const base = ACCESS_BASE;
    const normalized = path.startsWith("/") ? path : `/${path}`;

    // services/admin mounts admin requests under /requests. If VITE_API_ACCESS_BUILDER
    // already points directly to /requests, do not duplicate the segment.
    if (base.endsWith("/requests/") || base.endsWith("/requests")) {
        return joinUrl(base, normalized.replace(/^\/requests\//, ""));
    }

    return joinUrl(base, normalized.startsWith("/requests/") ? normalized : `/requests${normalized}`);
}

function authUrl(path: string): string {
    return joinUrl(AUTH_BASE, path);
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
    const headers = new Headers(init?.headers ?? {});
    if (!headers.has("Content-Type") && init?.body) {
        headers.set("Content-Type", "application/json");
    }

    const res = await authenticatedFetch(url, {
        ...init,
        headers,
    }, { source: "access-builder" });

    const data = (await res.json()) as unknown;
    return unwrapApiEnvelope<T>(data);
}

function unwrapApiEnvelope<T>(data: unknown): T {
    if (data && typeof data === "object") {
        const maybe = data as Record<string, unknown>;
        if ("payload" in maybe) return maybe.payload as T;
        if ("data" in maybe && Object.keys(maybe).length <= 3) return maybe.data as T;
    }

    return data as T;
}

function withMockFallback<T>(operation: () => Promise<T>, fallback: () => T): Promise<T> {
    if (!USE_MOCK_FALLBACK) return operation();
    return operation().catch((error) => {
        if (isAuthInvalidationError(error)) {
            throw error;
        }

        console.warn("[access-builder] API non disponibile, uso fixture locale", error);
        return fallback();
    });
}

export async function getAccessBuilderSnapshot(tenant = "Focelda"): Promise<AccessBuilderSnapshot> {
    return withMockFallback(
        () => requestJson<AccessBuilderSnapshot>(accessUrl(`/access-builder/snapshot?tenant=${encodeURIComponent(tenant)}`)),
        () => accessBuilderFixture,
    );
}

export async function getEffectiveAccessPreview(args: { userId: ObjectIdString; actorRole: number; tenant?: string }): Promise<EffectiveAccessPreview> {
    const tenant = args.tenant ?? "Focelda";
    return withMockFallback(
        () => requestJson<EffectiveAccessPreview>(authUrl(`/entitlements/preview?tenant=${encodeURIComponent(tenant)}&userId=${encodeURIComponent(args.userId)}&actorRole=${args.actorRole}`)),
        () => buildFixturePreview(args.userId, args.actorRole, tenant),
    );
}

export async function publishAccessBuilderChanges(changes: PendingChange[], tenant = "Focelda"): Promise<{ ok: true; applied: number }> {
    return withMockFallback(
        () => requestJson<{ ok: true; applied: number }>(accessUrl("/access-builder/publish"), {
            method: "POST",
            body: JSON.stringify({ tenant, changes }),
        }),
        () => ({ ok: true, applied: changes.length }),
    );
}

function buildFixturePreview(userId: ObjectIdString, actorRole: number, tenant: string): EffectiveAccessPreview {
    const userMemberships = accessBuilderFixture.memberships.filter((m) => m.userId === userId);
    const directGroupIds = new Set(userMemberships.map((m) => m.groupId));
    const allGroupIds = new Set(directGroupIds);

    let changed = true;
    while (changed) {
        changed = false;
        for (const edge of accessBuilderFixture.edges) {
            if (allGroupIds.has(edge.childGroupId) && !allGroupIds.has(edge.parentGroupId)) {
                allGroupIds.add(edge.parentGroupId);
                changed = true;
            }
        }
    }

    const roleMatches = (roles?: number[]) => !roles?.length || roles.includes(actorRole);
    const relevantGrants = accessBuilderFixture.grants.filter((grant) => {
        const principalMatch = grant.principalType === "USER" ? grant.principalId === userId : allGroupIds.has(grant.principalId);
        return principalMatch && roleMatches(grant.context?.actorRoles);
    });

    const denied = new Set(relevantGrants.filter((g) => g.effect === "DENY").map((g) => g.permission));
    const caps = Array.from(new Set(relevantGrants.filter((g) => g.effect === "ALLOW" && !denied.has(g.permission)).map((g) => g.permission))).sort();
    const panels = accessBuilderFixture.resources.filter((resource) => resource.type === "PANEL" && caps.includes(resource.permission));

    return {
        tenant,
        userId,
        actorRole,
        version: `fixture:${Date.now()}`,
        groups: accessBuilderFixture.groups.filter((group) => allGroupIds.has(group._id)).map((group) => ({ ...group, inherited: !directGroupIds.has(group._id) })),
        caps,
        panels,
        grants: relevantGrants,
        denied: relevantGrants
            .filter((grant) => grant.effect === "DENY")
            .map((grant) => ({ permission: grant.permission, source: grant.principalType, sourceId: grant.principalId })),
    };
}
