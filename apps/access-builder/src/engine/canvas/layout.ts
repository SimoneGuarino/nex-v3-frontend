import type {
    AccessBuilderSnapshot,
    BuilderCanvasNodeLayout,
    BuilderCanvasWorkspaceType,
    CanvasPoint,
    ObjectIdString,
} from "../../model/types";

export function normalizeCanvasPositions(positions: Record<ObjectIdString, CanvasPoint>): Record<ObjectIdString, CanvasPoint> {
    return Object.entries(positions).reduce<Record<ObjectIdString, CanvasPoint>>((acc, [id, point]) => {
        if (Number.isFinite(point?.x) && Number.isFinite(point?.y)) {
            acc[id] = {
                x: Math.round(point.x),
                y: Math.round(point.y),
            };
        }
        return acc;
    }, {});
}

export function areCanvasPositionsEqual(
    left: Record<ObjectIdString, CanvasPoint>,
    right: Record<ObjectIdString, CanvasPoint>,
): boolean {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) return false;
    return leftKeys.every((key) => left[key]?.x === right[key]?.x && left[key]?.y === right[key]?.y);
}

export function buildCanvasNodeLayout(
    positions: Record<ObjectIdString, CanvasPoint>,
    previousNodes: Record<ObjectIdString, BuilderCanvasNodeLayout> = {},
    metadata: { updatedAt?: string | null; updatedBy?: string | null } = {},
): Record<ObjectIdString, BuilderCanvasNodeLayout> {
    const normalized = normalizeCanvasPositions(positions);
    const updatedAt = metadata.updatedAt ?? new Date().toISOString();
    const updatedBy = metadata.updatedBy ?? null;

    return Object.entries(normalized).reduce<Record<ObjectIdString, BuilderCanvasNodeLayout>>((acc, [id, position]) => {
        const previous = previousNodes[id];
        acc[id] = {
            ...(previous ?? {}),
            position,
            updatedAt,
            updatedBy,
        };
        return acc;
    }, {});
}

export function extractCanvasPositionsFromNodes(
    nodes: Record<ObjectIdString, BuilderCanvasNodeLayout> | undefined,
): Record<ObjectIdString, CanvasPoint> {
    if (!nodes) return {};
    return Object.entries(nodes).reduce<Record<ObjectIdString, CanvasPoint>>((acc, [id, node]) => {
        const position = node?.position;
        if (Number.isFinite(position?.x) && Number.isFinite(position?.y)) {
            acc[id] = {
                x: Math.round(position.x),
                y: Math.round(position.y),
            };
        }
        return acc;
    }, {});
}

export function getWorkspaceCanvasPositions(
    snapshot: AccessBuilderSnapshot | null | undefined,
    workspace: BuilderCanvasWorkspaceType,
): Record<ObjectIdString, CanvasPoint> {
    if (!snapshot) return {};

    const workspaceNodes = snapshot.builderEngine?.canvas?.workspaces?.[workspace]?.nodes;
    const normalizedFromEngine = extractCanvasPositionsFromNodes(workspaceNodes);
    if (Object.keys(normalizedFromEngine).length > 0) return normalizedFromEngine;

    // Backward compatibility while older generals_configs.accessBuilder data exists in DB.
    if (workspace === "access") return normalizeCanvasPositions(snapshot.canvasLayout?.positions ?? {});
    if (workspace === "route") return normalizeCanvasPositions(snapshot.canvasLayout?.navigationPositions ?? {});
    return normalizeCanvasPositions(snapshot.canvasLayout?.configPositions ?? {});
}

export function normalizeCanvasPoint(value: unknown): CanvasPoint | null {
    if (!value || typeof value !== "object") {
        return null;
    }

    const point = value as Partial<CanvasPoint>;

    const x = Number(point.x);
    const y = Number(point.y);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return null;
    }

    return { x, y };
}