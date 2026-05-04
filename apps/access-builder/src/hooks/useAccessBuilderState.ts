import { useCallback, useEffect, useMemo, useState } from "react";
import { getAccessBuilderSnapshot, getEffectiveAccessPreview, publishAccessBuilderChanges } from "../api/accessBuilderApi";
import type { AccessBuilderSnapshot, EffectiveAccessPreview, ObjectIdString, PendingChange } from "../model/types";

export function useAccessBuilderState() {
  const [snapshot, setSnapshot] = useState<AccessBuilderSnapshot | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<ObjectIdString | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<ObjectIdString | null>(null);
  const [selectedActorRole, setSelectedActorRole] = useState<number>(2);
  const [preview, setPreview] = useState<EffectiveAccessPreview | null>(null);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    getAccessBuilderSnapshot()
      .then((data) => {
        if (!mounted) return;
        setSnapshot(data);
        setSelectedGroupId(data.groups[0]?._id ?? null);
        setSelectedUserId(data.users[0]?._id ?? null);
      })
      .catch((e) => mounted && setError(String(e?.message ?? e)))
      .finally(() => mounted && setIsLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedUserId) return;
    let mounted = true;
    setIsPreviewLoading(true);
    getEffectiveAccessPreview({ userId: selectedUserId, actorRole: selectedActorRole })
      .then((data) => mounted && setPreview(data))
      .catch((e) => mounted && setError(String(e?.message ?? e)))
      .finally(() => mounted && setIsPreviewLoading(false));

    return () => {
      mounted = false;
    };
  }, [selectedUserId, selectedActorRole]);

  const selectedGroup = useMemo(() => snapshot?.groups.find((group) => group._id === selectedGroupId) ?? null, [snapshot, selectedGroupId]);
  const selectedGroupMemberships = useMemo(() => snapshot?.memberships.filter((m) => m.groupId === selectedGroupId) ?? [], [snapshot, selectedGroupId]);
  const selectedGroupGrants = useMemo(() => snapshot?.grants.filter((g) => g.principalType === "GROUP" && g.principalId === selectedGroupId) ?? [], [snapshot, selectedGroupId]);

  const addPendingChange = useCallback((input: Omit<PendingChange, "id" | "createdAt">) => {
    setPendingChanges((prev) => [
      ...prev,
      {
        ...input,
        id: `${input.type}:${Date.now()}:${Math.random().toString(16).slice(2)}`,
        createdAt: new Date().toISOString(),
      },
    ]);
  }, []);

  const grantResourceToSelectedGroup = useCallback((permission: string, effect: "ALLOW" | "DENY" = "ALLOW") => {
    if (!selectedGroupId) return;
    addPendingChange({
      type: "GRANT_ADD",
      label: `${effect} ${permission}`,
      payload: {
        principalType: "GROUP",
        principalId: selectedGroupId,
        permission,
        effect,
        scope: { kind: "GLOBAL" },
      },
    });
  }, [addPendingChange, selectedGroupId]);

  const publish = useCallback(async () => {
    const result = await publishAccessBuilderChanges(pendingChanges);
    setPendingChanges([]);
    return result;
  }, [pendingChanges]);

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
    error,
    setSelectedGroupId,
    setSelectedUserId,
    setSelectedActorRole,
    grantResourceToSelectedGroup,
    addPendingChange,
    publish,
  };
}
