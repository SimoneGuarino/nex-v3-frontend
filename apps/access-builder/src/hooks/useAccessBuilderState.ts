import { useCallback, useEffect, useMemo, useState } from "react";
import { isAuthInvalidationError } from "@nex/shared-platform";
import { buildBuilderCanvasLayoutChange, createAccessBuilderUser, getAccessBuilderSnapshot, getAccessBuilderUserProfile, getEffectiveAccessPreview, isAccessBuilderConflictError, publishAccessBuilderChanges, updateAccessBuilderUserProfile } from "../api/accessBuilderApi";
import type { AccessBuilderSnapshot, BuilderCanvasWorkspaceType, CanvasPoint, EffectiveAccessPreview, GroupKind, NavigationResource, NavigationResourceCreatePayload, NavigationResourcePatch, ObjectIdString, PendingChange, UserCreatePayload, UserProfile, UserProfilePatch, UserSummary } from "../model/types";
import { buildCanvasNodeLayout, getWorkspaceCanvasPositions, normalizeCanvasPositions } from "../engine/canvas/layout";

const DEFAULT_TENANT = "Focelda";

function makeDraftId(prefix: string): string {
    return `draft:${prefix}:${Date.now()}:${Math.random().toString(16).slice(2)}`;
}

function createPendingChange(input: Omit<PendingChange, "id" | "createdAt">): PendingChange {
    return {
        ...input,
        id: makeDraftId(input.type),
        createdAt: new Date().toISOString(),
    };
}

function slugifyGroupKey(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || `group_${Date.now()}`;
}

function slugifyResourceKey(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9.]+/g, "_")
        .replace(/^_+|_+$/g, "") || `resource_${Date.now()}`;
}


function defaultNavigationPermission(type: NavigationResource["type"], key: string): string {
    const safeKey = slugifyResourceKey(key);
    if (type === "GROUP") return `ui.nav_group.${safeKey}.view`;
    if (type === "PANEL") return `ui.panel.${safeKey}.view`;
    if (type === "DATA_SCOPE") return `data_scope.${safeKey}`;
    return safeKey.includes(".") ? safeKey : `action.${safeKey}`;
}

function canNavigationResourceBeParent(resource: NavigationResource): boolean {
    return resource.type === "GROUP" || resource.type === "PANEL";
}

function buildLocalPreview(snapshot: AccessBuilderSnapshot, userId: ObjectIdString, actorRole: number): EffectiveAccessPreview {
    const userMemberships = snapshot.memberships.filter((membership) => membership.userId === userId);
    const directGroupIds = new Set(userMemberships.map((membership) => membership.groupId));
    const allGroupIds = new Set(directGroupIds);

    let changed = true;
    while (changed) {
        changed = false;
        for (const edge of snapshot.edges) {
            if (allGroupIds.has(edge.childGroupId) && !allGroupIds.has(edge.parentGroupId)) {
                allGroupIds.add(edge.parentGroupId);
                changed = true;
            }
        }
    }

    const roleMatches = (roles?: number[]) => !roles?.length || roles.includes(actorRole);
    const relevantGrants = snapshot.grants.filter((grant) => {
        const principalMatch = grant.principalType === "USER" ? grant.principalId === userId : allGroupIds.has(grant.principalId);
        return principalMatch && roleMatches(grant.context?.actorRoles);
    });

    const deniedSet = new Set(relevantGrants.filter((grant) => grant.effect === "DENY").map((grant) => grant.permission));
    const caps = Array.from(new Set(relevantGrants.filter((grant) => grant.effect === "ALLOW" && !deniedSet.has(grant.permission)).map((grant) => grant.permission))).sort();
    const panels = snapshot.resources.filter((resource) => resource.status === "ACTIVE" && resource.type === "PANEL" && caps.includes(resource.permission));

    return {
        tenant: snapshot.tenant,
        userId,
        actorRole,
        version: `draft:${Date.now()}`,
        groups: snapshot.groups.filter((group) => allGroupIds.has(group._id)).map((group) => ({ ...group, inherited: !directGroupIds.has(group._id) })),
        caps,
        panels,
        grants: relevantGrants,
        denied: relevantGrants
            .filter((grant) => grant.effect === "DENY")
            .map((grant) => ({ permission: grant.permission, source: grant.principalType, sourceId: grant.principalId })),
    };
}

function updateSnapshotWorkspaceLayout(
    snapshot: AccessBuilderSnapshot,
    workspace: BuilderCanvasWorkspaceType,
    positions: Record<ObjectIdString, CanvasPoint>,
): AccessBuilderSnapshot {
    const now = new Date().toISOString();
    const currentWorkspace = snapshot.builderEngine?.canvas?.workspaces?.[workspace];
    const nodes = buildCanvasNodeLayout(positions, currentWorkspace?.nodes ?? {}, { updatedAt: now, updatedBy: null });

    const nextBuilderEngine = {
        ...(snapshot.builderEngine ?? { revision: snapshot.meta?.revision ?? "0" }),
        canvas: {
            ...(snapshot.builderEngine?.canvas ?? {}),
            workspaces: {
                ...(snapshot.builderEngine?.canvas?.workspaces ?? {}),
                [workspace]: {
                    ...(currentWorkspace ?? {}),
                    nodes,
                    updatedAt: now,
                    updatedBy: null,
                },
            },
        },
    };

    const nextCanvasLayout = {
        ...(snapshot.canvasLayout ?? { positions: {} }),
        positions: workspace === "access" ? positions : snapshot.canvasLayout?.positions ?? getWorkspaceCanvasPositions(snapshot, "access"),
        navigationPositions: workspace === "route" ? positions : snapshot.canvasLayout?.navigationPositions ?? getWorkspaceCanvasPositions(snapshot, "route"),
        configPositions: workspace === "config" ? positions : snapshot.canvasLayout?.configPositions ?? getWorkspaceCanvasPositions(snapshot, "config"),
        updatedAt: workspace === "access" ? now : snapshot.canvasLayout?.updatedAt ?? null,
        updatedBy: workspace === "access" ? null : snapshot.canvasLayout?.updatedBy ?? null,
        navigationUpdatedAt: workspace === "route" ? now : snapshot.canvasLayout?.navigationUpdatedAt ?? null,
        navigationUpdatedBy: workspace === "route" ? null : snapshot.canvasLayout?.navigationUpdatedBy ?? null,
        configUpdatedAt: workspace === "config" ? now : snapshot.canvasLayout?.configUpdatedAt ?? null,
        configUpdatedBy: workspace === "config" ? null : snapshot.canvasLayout?.configUpdatedBy ?? null,
    };

    return {
        ...snapshot,
        builderEngine: nextBuilderEngine,
        canvasLayout: nextCanvasLayout,
    };
}


export function useAccessBuilderState() {
    const [snapshot, setSnapshot] = useState<AccessBuilderSnapshot | null>(null);
    const [selectedGroupId, setSelectedGroupId] = useState<ObjectIdString | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<ObjectIdString | null>(null);
    const [selectedResourceId, setSelectedResourceId] = useState<ObjectIdString | null>(null);
    const [selectedActorRole, setSelectedActorRole] = useState<number>(2);
    const [preview, setPreview] = useState<EffectiveAccessPreview | null>(null);
    const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);
    const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isUserProfileLoading, setIsUserProfileLoading] = useState(false);
    const [isUserProfileSaving, setIsUserProfileSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [publishConflict, setPublishConflict] = useState<Record<string, unknown> | null>(null);

    const refreshSnapshot = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getAccessBuilderSnapshot(DEFAULT_TENANT);
            setSnapshot(data);
            setPublishConflict(null);
            setSelectedGroupId((current) => current ?? data.groups[0]?._id ?? null);
            setSelectedUserId((current) => current ?? data.users[0]?._id ?? null);
            setSelectedResourceId((current) => current ?? data.resources[0]?._id ?? null);
        } catch (e) {
            if (!isAuthInvalidationError(e)) {
                setError(String((e as Error)?.message ?? e));
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void refreshSnapshot();
    }, [refreshSnapshot]);

    useEffect(() => {
        if (!selectedUserId || !snapshot) return;

        if (pendingChanges.length > 0) {
            setIsPreviewLoading(false);
            setPreview(buildLocalPreview(snapshot, selectedUserId, selectedActorRole));
            return;
        }

        let mounted = true;
        setIsPreviewLoading(true);
        getEffectiveAccessPreview({ userId: selectedUserId, actorRole: selectedActorRole, tenant: DEFAULT_TENANT })
            .then((data) => mounted && setPreview(data))
            .catch((e) => {
                if (mounted && !isAuthInvalidationError(e)) {
                    setError(String((e as Error)?.message ?? e));
                }
            })
            .finally(() => mounted && setIsPreviewLoading(false));

        return () => {
            mounted = false;
        };
    }, [selectedUserId, selectedActorRole, pendingChanges.length, snapshot]);

    useEffect(() => {
        if (!selectedUserId) {
            setSelectedUserProfile(null);
            return;
        }

        let mounted = true;
        setIsUserProfileLoading(true);
        getAccessBuilderUserProfile(selectedUserId, DEFAULT_TENANT)
            .then((profile) => {
                if (mounted) setSelectedUserProfile(profile);
            })
            .catch((e) => {
                if (mounted && !isAuthInvalidationError(e)) {
                    setError(String((e as Error)?.message ?? e));
                }
            })
            .finally(() => {
                if (mounted) setIsUserProfileLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [selectedUserId]);

    const selectedGroup = useMemo(() => snapshot?.groups.find((group) => group._id === selectedGroupId) ?? null, [snapshot, selectedGroupId]);
    const selectedGroupMemberships = useMemo(() => snapshot?.memberships.filter((m) => m.groupId === selectedGroupId) ?? [], [snapshot, selectedGroupId]);
    const selectedGroupGrants = useMemo(() => snapshot?.grants.filter((g) => g.principalType === "GROUP" && g.principalId === selectedGroupId) ?? [], [snapshot, selectedGroupId]);
    const selectedResource = useMemo(() => snapshot?.resources.find((resource) => resource._id === selectedResourceId) ?? null, [snapshot, selectedResourceId]);

    const addPendingChange = useCallback((input: Omit<PendingChange, "id" | "createdAt">) => {
        setPendingChanges((prev) => [...prev, createPendingChange(input)]);
    }, []);

    const accessCanvasPositions = useMemo(() => getWorkspaceCanvasPositions(snapshot, "access"), [snapshot]);
    const routeCanvasPositions = useMemo(() => getWorkspaceCanvasPositions(snapshot, "route"), [snapshot]);
    const configCanvasPositions = useMemo(() => getWorkspaceCanvasPositions(snapshot, "config"), [snapshot]);

    const recordWorkspaceLayoutPositions = useCallback((workspace: BuilderCanvasWorkspaceType, positions: Record<ObjectIdString, CanvasPoint>) => {
        const nextPositions = normalizeCanvasPositions(positions);

        setSnapshot((current) => current ? updateSnapshotWorkspaceLayout(current, workspace, nextPositions) : current);

        setPendingChanges((current) => {
            const change = buildBuilderCanvasLayoutChange(workspace, nextPositions);
            const existingIndex = current.findIndex((item) => {
                if (item.type !== "BUILDER_CANVAS_LAYOUT_UPDATE") return false;
                const payload = item.payload as { workspace?: string } | null | undefined;
                return payload?.workspace === workspace;
            });
            if (existingIndex < 0) return [...current, change];

            const next = [...current];
            next[existingIndex] = {
                ...next[existingIndex],
                label: change.label,
                payload: change.payload,
                createdAt: change.createdAt,
            };
            return next;
        });
    }, []);

    const recordCanvasLayoutPositions = useCallback((positions: Record<ObjectIdString, CanvasPoint>) => {
        recordWorkspaceLayoutPositions("access", positions);
    }, [recordWorkspaceLayoutPositions]);

    const recordNavigationLayoutPositions = useCallback((positions: Record<ObjectIdString, CanvasPoint>) => {
        recordWorkspaceLayoutPositions("route", positions);
    }, [recordWorkspaceLayoutPositions]);

    const recordConfigLayoutPositions = useCallback((positions: Record<ObjectIdString, CanvasPoint>) => {
        recordWorkspaceLayoutPositions("config", positions);
    }, [recordWorkspaceLayoutPositions]);

    const createGroup = useCallback((name: string, kind: GroupKind = "TEAM", parentGroupId?: ObjectIdString | null) => {
        if (!snapshot) return;
        const groupId = makeDraftId("group");
        const key = slugifyGroupKey(name);

        setSnapshot((current) => current ? {
            ...current,
            groups: [
                ...current.groups,
                {
                    _id: groupId,
                    tenant: DEFAULT_TENANT,
                    key,
                    name,
                    kind,
                    status: "ACTIVE",
                    parentGroupIds: parentGroupId ? [parentGroupId] : [],
                    membersCount: 0,
                    grantsCount: 0,
                    inheritedGrantsCount: 0,
                },
            ],
            edges: parentGroupId ? [
                ...current.edges,
                {
                    _id: makeDraftId("edge"),
                    tenant: DEFAULT_TENANT,
                    parentGroupId,
                    childType: "GROUP",
                    childGroupId: groupId,
                },
            ] : current.edges,
        } : current);

        addPendingChange({
            type: "GROUP_CREATE",
            label: `Crea gruppo ${name}`,
            payload: { _id: groupId, tenant: DEFAULT_TENANT, key, name, kind, status: "ACTIVE", parentGroupId: parentGroupId ?? null },
        });
        setSelectedGroupId(groupId);
    }, [addPendingChange, snapshot]);

    const addSelectedUserToSelectedGroup = useCallback(() => {
        if (!snapshot || !selectedGroupId || !selectedUserId) return;
        const alreadyMember = snapshot.memberships.some((membership) => membership.groupId === selectedGroupId && membership.userId === selectedUserId);
        if (alreadyMember) return;
        const user = snapshot.users.find((item) => item._id === selectedUserId);
        const membershipId = makeDraftId("membership");

        setSnapshot((current) => current ? {
            ...current,
            memberships: [
                ...current.memberships,
                { _id: membershipId, tenant: DEFAULT_TENANT, groupId: selectedGroupId, userId: selectedUserId, user },
            ],
            groups: current.groups.map((group) => group._id === selectedGroupId ? { ...group, membersCount: (group.membersCount ?? 0) + 1 } : group),
        } : current);

        addPendingChange({
            type: "MEMBERSHIP_ADD",
            label: `Aggiungi ${user?.username ?? selectedUserId} al gruppo`,
            payload: { tenant: DEFAULT_TENANT, groupId: selectedGroupId, userId: selectedUserId },
        });
    }, [addPendingChange, selectedGroupId, selectedUserId, snapshot]);

    const removeMembership = useCallback((membershipId: ObjectIdString) => {
        if (!snapshot) return;
        const membership = snapshot.memberships.find((item) => item._id === membershipId);
        if (!membership) return;

        setSnapshot((current) => current ? {
            ...current,
            memberships: current.memberships.filter((item) => item._id !== membershipId),
            groups: current.groups.map((group) => group._id === membership.groupId ? { ...group, membersCount: Math.max(0, (group.membersCount ?? 0) - 1) } : group),
        } : current);

        addPendingChange({
            type: "MEMBERSHIP_REMOVE",
            label: `Rimuovi membro dal gruppo`,
            payload: { tenant: DEFAULT_TENANT, groupId: membership.groupId, userId: membership.userId, membershipId: membership._id },
        });
    }, [addPendingChange, snapshot]);

    const moveMembershipToGroup = useCallback((membershipId: ObjectIdString, targetGroupId: ObjectIdString) => {
        if (!snapshot) return;

        const membership = snapshot.memberships.find((item) => item._id === membershipId);
        if (!membership || membership.groupId === targetGroupId) return;

        const sourceGroup = snapshot.groups.find((group) => group._id === membership.groupId);
        const targetGroup = snapshot.groups.find((group) => group._id === targetGroupId);
        if (!targetGroup) return;

        const user = membership.user ?? snapshot.users.find((item) => item._id === membership.userId);
        const targetAlreadyMember = snapshot.memberships.some((item) => (
            item._id !== membershipId
            && item.groupId === targetGroupId
            && item.userId === membership.userId
        ));

        setSnapshot((current) => {
            if (!current) return current;

            const nextMemberships = targetAlreadyMember
                ? current.memberships.filter((item) => item._id !== membershipId)
                : current.memberships.map((item) => item._id === membershipId
                    ? { ...item, groupId: targetGroupId, user }
                    : item);

            return {
                ...current,
                memberships: nextMemberships,
                groups: current.groups.map((group) => {
                    if (group._id === membership.groupId) {
                        return { ...group, membersCount: Math.max(0, (group.membersCount ?? 0) - 1) };
                    }
                    if (group._id === targetGroupId && !targetAlreadyMember) {
                        return { ...group, membersCount: (group.membersCount ?? 0) + 1 };
                    }
                    return group;
                }),
            };
        });

        const userLabel = user?.username ?? membership.userId;
        const sourceLabel = sourceGroup?.name ?? membership.groupId;
        const targetLabel = targetGroup.name;

        setPendingChanges((current) => {
            const draftAddIndex = current.findIndex((change) => {
                if (change.type !== "MEMBERSHIP_ADD") return false;
                const payload = change.payload as { groupId?: ObjectIdString; userId?: ObjectIdString };
                return payload.groupId === membership.groupId && payload.userId === membership.userId;
            });

            if (draftAddIndex >= 0) {
                const next = [...current];
                const previous = next[draftAddIndex];
                next[draftAddIndex] = {
                    ...previous,
                    label: `Sposta ${userLabel}: ${sourceLabel} → ${targetLabel}`,
                    payload: {
                        ...(previous.payload as Record<string, unknown>),
                        groupId: targetGroupId,
                        userId: membership.userId,
                    },
                    createdAt: new Date().toISOString(),
                };
                return next;
            }

            const changes: PendingChange[] = [
                createPendingChange({
                    type: "MEMBERSHIP_REMOVE",
                    label: `Rimuovi ${userLabel} da ${sourceLabel}`,
                    payload: {
                        tenant: DEFAULT_TENANT,
                        groupId: membership.groupId,
                        userId: membership.userId,
                        membershipId: membership._id,
                    },
                }),
            ];

            if (!targetAlreadyMember) {
                changes.push(createPendingChange({
                    type: "MEMBERSHIP_ADD",
                    label: `Aggiungi ${userLabel} a ${targetLabel}`,
                    payload: {
                        tenant: DEFAULT_TENANT,
                        groupId: targetGroupId,
                        userId: membership.userId,
                    },
                }));
            }

            return [...current, ...changes];
        });
    }, [snapshot]);

    const grantResourceToSelectedGroup = useCallback((permission: string, effect: "ALLOW" | "DENY" = "ALLOW") => {
        if (!selectedGroupId) return;
        const grantId = makeDraftId("grant");

        setSnapshot((current) => current ? {
            ...current,
            grants: [
                ...current.grants,
                {
                    _id: grantId,
                    tenant: DEFAULT_TENANT,
                    principalType: "GROUP",
                    principalId: selectedGroupId,
                    permission,
                    effect,
                    scope: { kind: "GLOBAL" },
                    context: { actorRoles: [selectedActorRole] },
                },
            ],
            groups: current.groups.map((group) => group._id === selectedGroupId ? { ...group, grantsCount: (group.grantsCount ?? 0) + 1 } : group),
        } : current);

        addPendingChange({
            type: "GRANT_ADD",
            label: `${effect} ${permission}`,
            payload: {
                tenant: DEFAULT_TENANT,
                principalType: "GROUP",
                principalId: selectedGroupId,
                permission,
                effect,
                scope: { kind: "GLOBAL" },
                context: { actorRoles: [selectedActorRole] },
            },
        });
    }, [addPendingChange, selectedActorRole, selectedGroupId]);

    const removeGrant = useCallback((grantId: ObjectIdString) => {
        if (!snapshot) return;
        const grant = snapshot.grants.find((item) => item._id === grantId);
        if (!grant) return;

        setSnapshot((current) => current ? {
            ...current,
            grants: current.grants.filter((item) => item._id !== grantId),
            groups: current.groups.map((group) => group._id === grant.principalId ? { ...group, grantsCount: Math.max(0, (group.grantsCount ?? 0) - 1) } : group),
        } : current);

        addPendingChange({
            type: "GRANT_REMOVE",
            label: `Rimuovi ${grant.permission}`,
            payload: { tenant: DEFAULT_TENANT, grantId: grant._id, principalType: grant.principalType, principalId: grant.principalId, permission: grant.permission },
        });
    }, [addPendingChange, snapshot]);

    const wouldCreateCycle = useCallback((parentGroupId: ObjectIdString, childGroupId: ObjectIdString) => {
        if (!snapshot) return true;
        if (parentGroupId === childGroupId) return true;

        const adjacency = new Map<ObjectIdString, ObjectIdString[]>();
        for (const edge of snapshot.edges) {
            const children = adjacency.get(edge.parentGroupId) ?? [];
            children.push(edge.childGroupId);
            adjacency.set(edge.parentGroupId, children);
        }

        const stack = [childGroupId];
        const visited = new Set<ObjectIdString>();
        while (stack.length > 0) {
            const current = stack.pop();
            if (!current || visited.has(current)) continue;
            if (current === parentGroupId) return true;
            visited.add(current);
            for (const next of adjacency.get(current) ?? []) {
                stack.push(next);
            }
        }

        return false;
    }, [snapshot]);

    const createEdge = useCallback((parentGroupId: ObjectIdString, childGroupId: ObjectIdString) => {
        if (!snapshot) return;
        if (parentGroupId === childGroupId) return;
        if (snapshot.edges.some((edge) => edge.parentGroupId === parentGroupId && edge.childGroupId === childGroupId)) return;
        if (wouldCreateCycle(parentGroupId, childGroupId)) return;

        const edgeId = makeDraftId("edge");
        const parentGroup = snapshot.groups.find((group) => group._id === parentGroupId);
        const childGroup = snapshot.groups.find((group) => group._id === childGroupId);

        setSnapshot((current) => current ? {
            ...current,
            edges: [
                ...current.edges,
                {
                    _id: edgeId,
                    tenant: DEFAULT_TENANT,
                    parentGroupId,
                    childType: "GROUP",
                    childGroupId,
                },
            ],
            groups: current.groups.map((group) => group._id === childGroupId
                ? { ...group, parentGroupIds: Array.from(new Set([...(group.parentGroupIds ?? []), parentGroupId])) }
                : group),
        } : current);

        addPendingChange({
            type: "EDGE_CREATE",
            label: `Collega ${parentGroup?.name ?? parentGroupId} → ${childGroup?.name ?? childGroupId}`,
            payload: { tenant: DEFAULT_TENANT, parentGroupId, childGroupId },
        });
    }, [addPendingChange, snapshot, wouldCreateCycle]);

    const removeEdge = useCallback((edgeId: ObjectIdString) => {
        if (!snapshot) return;
        const edge = snapshot.edges.find((item) => item._id === edgeId);
        if (!edge) return;
        const parentGroup = snapshot.groups.find((group) => group._id === edge.parentGroupId);
        const childGroup = snapshot.groups.find((group) => group._id === edge.childGroupId);

        setSnapshot((current) => current ? {
            ...current,
            edges: current.edges.filter((item) => item._id !== edgeId),
            groups: current.groups.map((group) => group._id === edge.childGroupId
                ? { ...group, parentGroupIds: (group.parentGroupIds ?? []).filter((parentId) => parentId !== edge.parentGroupId) }
                : group),
        } : current);

        addPendingChange({
            type: "EDGE_DELETE",
            label: `Rimuovi collegamento ${parentGroup?.name ?? edge.parentGroupId} → ${childGroup?.name ?? edge.childGroupId}`,
            payload: {
                tenant: DEFAULT_TENANT,
                edgeId: edge._id,
                parentGroupId: edge.parentGroupId,
                childGroupId: edge.childGroupId,
            },
        });
    }, [addPendingChange, snapshot]);

    const createNavigationResource = useCallback((input: NavigationResourceCreatePayload) => {
        if (!snapshot) return;
        const resourceId = makeDraftId("resource");
        const key = slugifyResourceKey(input.key || input.name);
        const order = Number.isFinite(Number(input.order)) ? Number(input.order) : snapshot.resources.length * 10 + 10;
        const resource: NavigationResource = {
            _id: resourceId,
            tenant: DEFAULT_TENANT,
            appId: input.appId || "legacy",
            key,
            type: input.type || "PANEL",
            name: input.name,
            route: input.type === "PANEL" ? (input.route || "") : (input.route || ""),
            parentKey: input.parentKey ?? null,
            permission: input.permission || defaultNavigationPermission(input.type || "PANEL", key),
            order,
            status: input.status || "ACTIVE",
            meta: input.meta || {},
        };

        setSnapshot((current) => current ? {
            ...current,
            resources: [...current.resources, resource].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name)),
        } : current);
        setSelectedResourceId(resourceId);

        addPendingChange({
            type: "NAV_RESOURCE_CREATE",
            label: `Crea route ${resource.name}`,
            payload: { tenant: DEFAULT_TENANT, resource },
        });
    }, [addPendingChange, snapshot]);

    const updateNavigationResource = useCallback((resourceId: ObjectIdString, patch: NavigationResourcePatch) => {
        if (!snapshot) return;
        const currentResource = snapshot.resources.find((resource) => resource._id === resourceId);
        if (!currentResource) return;
        const nextResource = { ...currentResource, ...patch };

        setSnapshot((current) => current ? {
            ...current,
            resources: current.resources.map((resource) => resource._id === resourceId ? nextResource : resource),
        } : current);

        addPendingChange({
            type: "NAV_RESOURCE_UPDATE",
            label: `Aggiorna route ${nextResource.name}`,
            payload: { tenant: DEFAULT_TENANT, resourceId, appId: currentResource.appId, key: currentResource.key, patch },
        });
    }, [addPendingChange, snapshot]);

    const setNavigationParent = useCallback((parentResourceId: ObjectIdString, childResourceId: ObjectIdString) => {
        if (!snapshot || parentResourceId === childResourceId) return;
        const parent = snapshot.resources.find((resource) => resource._id === parentResourceId);
        const child = snapshot.resources.find((resource) => resource._id === childResourceId);
        if (!parent || !child) return;
        if (!canNavigationResourceBeParent(parent)) return;

        const wouldCycle = (nextParentKey: string, childKey: string) => {
            let cursor: string | null | undefined = nextParentKey;
            const visited = new Set<string>();
            while (cursor) {
                if (cursor === childKey) return true;
                if (visited.has(cursor)) return true;
                visited.add(cursor);
                cursor = snapshot.resources.find((resource) => resource.appId === child.appId && resource.key === cursor)?.parentKey;
            }
            return false;
        };

        if (parent.appId !== child.appId) return;
        if (wouldCycle(parent.key, child.key)) return;

        setSnapshot((current) => current ? {
            ...current,
            resources: current.resources.map((resource) => resource._id === childResourceId ? { ...resource, parentKey: parent.key } : resource),
        } : current);

        addPendingChange({
            type: "NAV_RESOURCE_PARENT_SET",
            label: `Collega route ${parent.name} → ${child.name}`,
            payload: { tenant: DEFAULT_TENANT, resourceId: childResourceId, appId: child.appId, key: child.key, parentKey: parent.key },
        });
    }, [addPendingChange, snapshot]);

    const clearNavigationParent = useCallback((resourceId: ObjectIdString) => {
        if (!snapshot) return;
        const resource = snapshot.resources.find((item) => item._id === resourceId);
        if (!resource || !resource.parentKey) return;
        const parent = snapshot.resources.find((item) => item.appId === resource.appId && item.key === resource.parentKey);

        setSnapshot((current) => current ? {
            ...current,
            resources: current.resources.map((item) => item._id === resourceId ? { ...item, parentKey: null } : item),
        } : current);

        addPendingChange({
            type: "NAV_RESOURCE_PARENT_SET",
            label: `Rimuovi parent route ${parent?.name ?? resource.parentKey} → ${resource.name}`,
            payload: { tenant: DEFAULT_TENANT, resourceId, appId: resource.appId, key: resource.key, parentKey: null },
        });
    }, [addPendingChange, snapshot]);

    const disableNavigationResource = useCallback((resourceId: ObjectIdString) => {
        if (!snapshot) return;
        const resource = snapshot.resources.find((item) => item._id === resourceId);
        if (!resource) return;

        setSnapshot((current) => current ? {
            ...current,
            resources: current.resources.map((item) => item._id === resourceId ? { ...item, status: "DISABLED" } : item),
        } : current);

        addPendingChange({
            type: "NAV_RESOURCE_DISABLE",
            label: `Disabilita route ${resource.name}`,
            payload: { tenant: DEFAULT_TENANT, resourceId, appId: resource.appId, key: resource.key },
        });
    }, [addPendingChange, snapshot]);

    const upsertUserInSnapshot = useCallback((profile: UserProfile) => {
        const summary: UserSummary = {
            _id: profile._id,
            username: profile.username,
            nome: profile.nome,
            cognome: profile.cognome,
            ruolo: profile.ruolo,
            multiRuolo: profile.multiRuolo,
            disabilitato: profile.disabilitato,
            immagini: profile.details?.immagini,
        };

        setSnapshot((current) => {
            if (!current) return current;
            const exists = current.users.some((user) => user._id === profile._id);
            return {
                ...current,
                users: exists
                    ? current.users.map((user) => user._id === profile._id ? { ...user, ...summary } : user)
                    : [...current.users, summary].sort((a, b) => `${a.cognome ?? ""}${a.nome ?? ""}${a.username}`.localeCompare(`${b.cognome ?? ""}${b.nome ?? ""}${b.username}`)),
                memberships: current.memberships.map((membership) => membership.userId === profile._id
                    ? { ...membership, user: { ...(membership.user ?? {}), ...summary } }
                    : membership),
            };
        });
    }, []);

    const saveSelectedUserProfile = useCallback(async (patch: UserProfilePatch) => {
        if (!selectedUserId) return null;
        setIsUserProfileSaving(true);
        try {
            const profile = await updateAccessBuilderUserProfile(selectedUserId, patch, DEFAULT_TENANT, snapshot?.builderEngine?.revision ?? snapshot?.meta?.revision);
            setSelectedUserProfile(profile);
            upsertUserInSnapshot(profile);
            return profile;
        } catch (e) {
            if (isAccessBuilderConflictError(e)) {
                setPublishConflict(e.conflict);
            } else if (!isAuthInvalidationError(e)) {
                setError(String((e as Error)?.message ?? e));
            }
            throw e;
        } finally {
            setIsUserProfileSaving(false);
        }
    }, [selectedUserId, snapshot?.builderEngine?.revision ?? snapshot?.meta?.revision, upsertUserInSnapshot]);

    const createUser = useCallback(async (payload: UserCreatePayload) => {
        setIsUserProfileSaving(true);
        try {
            const profile = await createAccessBuilderUser(payload, DEFAULT_TENANT, snapshot?.builderEngine?.revision ?? snapshot?.meta?.revision);
            setSelectedUserId(profile._id);
            setSelectedUserProfile(profile);
            upsertUserInSnapshot(profile);
            return profile;
        } catch (e) {
            if (isAccessBuilderConflictError(e)) {
                setPublishConflict(e.conflict);
            } else if (!isAuthInvalidationError(e)) {
                setError(String((e as Error)?.message ?? e));
            }
            throw e;
        } finally {
            setIsUserProfileSaving(false);
        }
    }, [snapshot?.builderEngine?.revision ?? snapshot?.meta?.revision, upsertUserInSnapshot]);

    const refreshSelectedUserProfile = useCallback(async () => {
        if (!selectedUserId) return null;
        setIsUserProfileLoading(true);
        try {
            const profile = await getAccessBuilderUserProfile(selectedUserId, DEFAULT_TENANT);
            setSelectedUserProfile(profile);
            upsertUserInSnapshot(profile);
            return profile;
        } catch (e) {
            if (!isAuthInvalidationError(e)) {
                setError(String((e as Error)?.message ?? e));
            }
            throw e;
        } finally {
            setIsUserProfileLoading(false);
        }
    }, [selectedUserId, snapshot?.builderEngine?.revision ?? snapshot?.meta?.revision, upsertUserInSnapshot]);

    const discardDraft = useCallback(() => {
        setPendingChanges([]);
        void refreshSnapshot();
    }, [refreshSnapshot]);

    const publish = useCallback(async () => {
        setIsPublishing(true);
        try {
            const result = await publishAccessBuilderChanges(pendingChanges, DEFAULT_TENANT, snapshot?.builderEngine?.revision ?? snapshot?.meta?.revision);
            setPendingChanges([]);
            setPublishConflict(null);
            await refreshSnapshot();
            return result;
        } catch (e) {
            if (isAccessBuilderConflictError(e)) {
                setPublishConflict(e.conflict);
            } else if (!isAuthInvalidationError(e)) {
                setError(String((e as Error)?.message ?? e));
            }
            throw e;
        } finally {
            setIsPublishing(false);
        }
    }, [pendingChanges, refreshSnapshot, snapshot?.builderEngine?.revision ?? snapshot?.meta?.revision]);

    return {
        snapshot,
        accessCanvasPositions,
        routeCanvasPositions,
        configCanvasPositions,
        selectedGroup,
        selectedGroupId,
        selectedGroupMemberships,
        selectedGroupGrants,
        selectedResource,
        selectedResourceId,
        selectedUserId,
        selectedActorRole,
        selectedUserProfile,
        preview,
        pendingChanges,
        isLoading,
        isPreviewLoading,
        isPublishing,
        isUserProfileLoading,
        isUserProfileSaving,
        error,
        publishConflict,
        setSelectedGroupId,
        setSelectedResourceId,
        setSelectedUserId,
        setSelectedActorRole,
        createGroup,
        addSelectedUserToSelectedGroup,
        saveSelectedUserProfile,
        createUser,
        refreshSelectedUserProfile,
        removeMembership,
        moveMembershipToGroup,
        removeGrant,
        createEdge,
        removeEdge,
        grantResourceToSelectedGroup,
        addPendingChange,
        recordCanvasLayoutPositions,
        recordNavigationLayoutPositions,
        recordConfigLayoutPositions,
        recordWorkspaceLayoutPositions,
        createNavigationResource,
        updateNavigationResource,
        setNavigationParent,
        clearNavigationParent,
        disableNavigationResource,
        discardDraft,
        publish,
    };
}
