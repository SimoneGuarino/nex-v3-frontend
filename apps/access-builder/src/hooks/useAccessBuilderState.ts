import { useCallback, useEffect, useMemo, useState } from "react";
import { getAccessBuilderSnapshot, getEffectiveAccessPreview, publishAccessBuilderChanges } from "../api/accessBuilderApi";
import type { AccessBuilderSnapshot, EffectiveAccessPreview, GroupKind, ObjectIdString, PendingChange } from "../model/types";

const DEFAULT_TENANT = "Focelda";

function makeDraftId(prefix: string): string {
    return `draft:${prefix}:${Date.now()}:${Math.random().toString(16).slice(2)}`;
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

export function useAccessBuilderState() {
    const [snapshot, setSnapshot] = useState<AccessBuilderSnapshot | null>(null);
    const [selectedGroupId, setSelectedGroupId] = useState<ObjectIdString | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<ObjectIdString | null>(null);
    const [selectedActorRole, setSelectedActorRole] = useState<number>(2);
    const [preview, setPreview] = useState<EffectiveAccessPreview | null>(null);
    const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshSnapshot = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getAccessBuilderSnapshot(DEFAULT_TENANT);
            setSnapshot(data);
            setSelectedGroupId((current) => current ?? data.groups[0]?._id ?? null);
            setSelectedUserId((current) => current ?? data.users[0]?._id ?? null);
        } catch (e) {
            setError(String((e as Error)?.message ?? e));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void refreshSnapshot();
    }, [refreshSnapshot]);

    useEffect(() => {
        if (!selectedUserId) return;
        let mounted = true;
        setIsPreviewLoading(true);
        getEffectiveAccessPreview({ userId: selectedUserId, actorRole: selectedActorRole, tenant: DEFAULT_TENANT })
            .then((data) => mounted && setPreview(data))
            .catch((e) => mounted && setError(String((e as Error)?.message ?? e)))
            .finally(() => mounted && setIsPreviewLoading(false));

        return () => {
            mounted = false;
        };
    }, [selectedUserId, selectedActorRole, pendingChanges.length]);

    const selectedGroup = useMemo(() => snapshot?.groups.find((group) => group._id === selectedGroupId) ?? null, [snapshot, selectedGroupId]);
    const selectedGroupMemberships = useMemo(() => snapshot?.memberships.filter((m) => m.groupId === selectedGroupId) ?? [], [snapshot, selectedGroupId]);
    const selectedGroupGrants = useMemo(() => snapshot?.grants.filter((g) => g.principalType === "GROUP" && g.principalId === selectedGroupId) ?? [], [snapshot, selectedGroupId]);

    const addPendingChange = useCallback((input: Omit<PendingChange, "id" | "createdAt">) => {
        setPendingChanges((prev) => [
            ...prev,
            {
                ...input,
                id: makeDraftId(input.type),
                createdAt: new Date().toISOString(),
            },
        ]);
    }, []);

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

    const discardDraft = useCallback(() => {
        setPendingChanges([]);
        void refreshSnapshot();
    }, [refreshSnapshot]);

    const publish = useCallback(async () => {
        setIsPublishing(true);
        try {
            const result = await publishAccessBuilderChanges(pendingChanges, DEFAULT_TENANT);
            setPendingChanges([]);
            await refreshSnapshot();
            return result;
        } finally {
            setIsPublishing(false);
        }
    }, [pendingChanges, refreshSnapshot]);

    return {
        snapshot,
        selectedGroup,
        selectedGroupId,
        selectedGroupMemberships,
        selectedGroupGrants,
        selectedUserId,
        selectedActorRole,
        preview,
        pendingChanges,
        isLoading,
        isPreviewLoading,
        isPublishing,
        error,
        setSelectedGroupId,
        setSelectedUserId,
        setSelectedActorRole,
        createGroup,
        addSelectedUserToSelectedGroup,
        removeMembership,
        removeGrant,
        grantResourceToSelectedGroup,
        addPendingChange,
        discardDraft,
        publish,
    };
}
