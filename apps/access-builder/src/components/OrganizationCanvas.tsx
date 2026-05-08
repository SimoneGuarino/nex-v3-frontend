import {
    memo,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type PointerEvent as ReactPointerEvent,
    type WheelEvent as ReactWheelEvent,
} from "react";
import { FDBox } from "@nex/fd-ui";
import type { AccessGroup, GroupEdge, GroupMembership, ObjectIdString, UserSummary } from "../model/types";

export type CanvasMode = "move" | "connect" | "delete-link" | "multi-select";

interface Props {
    groups: AccessGroup[];
    edges: GroupEdge[];
    memberships: GroupMembership[];
    users: UserSummary[];
    selectedGroupId: ObjectIdString | null;
    mode: CanvasMode;
    zoom: number;
    showUsers: boolean;
    viewportResetSignal?: number;
    onZoomChange: (zoom: number) => void;
    onSelectGroup: (id: ObjectIdString) => void;
    onCreateEdge: (parentGroupId: ObjectIdString, childGroupId: ObjectIdString) => void;
    onDeleteEdge: (edgeId: ObjectIdString) => void;
}

interface Point {
    x: number;
    y: number;
}

interface NodeRect extends Point {
    width: number;
    height: number;
}

interface DragState {
    id: string;
    selectedIds: ObjectIdString[];
    startClientX: number;
    startClientY: number;
    startPositions: Record<ObjectIdString, Point>;
    hasMoved: boolean;
}

interface PendingPosition extends Point {
    id: string;
}

interface CanvasClickState {
    pointerId: number;
    startClientX: number;
    startClientY: number;
    hasMoved: boolean;
}

interface PanState {
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
    hasMoved: boolean;
}

interface TouchPoint {
    clientX: number;
    clientY: number;
}

interface PinchState {
    startDistance: number;
    startZoom: number;
    worldAnchor: Point;
}

interface ConnectionPorts {
    start: Point;
    end: Point;
    controlA: Point;
    controlB: Point;
}

const fallbackNodeWidth = 270;
const fallbackNodeHeight = 118;
const maxUserNodesPerGroup = 8;
const userNodeWidth = 224;
const userNodeHeight = 68;
const userNodeGap = 12;
const userBranchGap = 72;
const userBranchTop = 12;
const connectorGap = 3;
const minZoom = 0.35;
const maxZoom = 2.25;

const kindLabel: Record<string, string> = {
    ORG_UNIT: "Org Unit",
    TEAM: "Team",
    ROLE_GROUP: "Role",
    CAPABILITY_GROUP: "Capability",
};

const kindTone: Record<string, string> = {
    ORG_UNIT: "bg-blue-500",
    TEAM: "bg-emerald-500",
    ROLE_GROUP: "bg-violet-500",
    CAPABILITY_GROUP: "bg-orange-500",
};

function getUserDisplayName(user: UserSummary) {
    return [user.nome, user.cognome].filter(Boolean).join(" ") || user.username;
}

function getUserRoleLabel(user: UserSummary) {
    if (Array.isArray(user.desc_role)) return user.desc_role.filter(Boolean).join(", ");
    if (user.desc_role) return user.desc_role;
    if (Array.isArray(user.ruolo)) return user.ruolo.filter(Boolean).join(", ");
    return user.ruolo || "Utente";
}

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

function clampZoom(value: number) {
    if (!Number.isFinite(value)) return 1;
    return Math.min(maxZoom, Math.max(minZoom, Number(value.toFixed(3))));
}

function getDistance(a: TouchPoint, b: TouchPoint) {
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function getMidpoint(a: TouchPoint, b: TouchPoint): TouchPoint {
    return {
        clientX: (a.clientX + b.clientX) / 2,
        clientY: (a.clientY + b.clientY) / 2,
    };
}

function getDepth(groupId: string, edges: GroupEdge[], seen = new Set<string>()): number {
    if (seen.has(groupId)) return 0;
    seen.add(groupId);
    const parent = edges.find((edge) => edge.childGroupId === groupId);
    if (!parent) return 0;
    return 1 + getDepth(parent.parentGroupId, edges, seen);
}

function computeInitialPosition(group: AccessGroup, index: number, edges: GroupEdge[]): Point {
    const depth = getDepth(group._id, edges);
    const siblingsBefore = index % 5;
    return {
        x: 90 + depth * 380,
        y: 170 + siblingsBefore * 170 + Math.floor(index / 5) * 90,
    };
}

function getCenter(rect: NodeRect): Point {
    return {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
    };
}

function getConnectionPorts(from: NodeRect, to: NodeRect): ConnectionPorts {
    const fromCenter = getCenter(from);
    const toCenter = getCenter(to);
    const dx = toCenter.x - fromCenter.x;
    const dy = toCenter.y - fromCenter.y;
    const useHorizontalPorts = Math.abs(dx) >= Math.abs(dy);

    if (useHorizontalPorts) {
        const targetIsRight = dx >= 0;
        const start: Point = targetIsRight
            ? { x: from.x + from.width + connectorGap, y: fromCenter.y }
            : { x: from.x - connectorGap, y: fromCenter.y };
        const end: Point = targetIsRight
            ? { x: to.x - connectorGap, y: toCenter.y }
            : { x: to.x + to.width + connectorGap, y: toCenter.y };
        const controlDistance = Math.max(72, Math.abs(end.x - start.x) * 0.45);

        return {
            start,
            end,
            controlA: { x: start.x + (targetIsRight ? controlDistance : -controlDistance), y: start.y },
            controlB: { x: end.x - (targetIsRight ? controlDistance : -controlDistance), y: end.y },
        };
    }

    const targetIsBelow = dy >= 0;
    const start: Point = targetIsBelow
        ? { x: fromCenter.x, y: from.y + from.height + connectorGap }
        : { x: fromCenter.x, y: from.y - connectorGap };
    const end: Point = targetIsBelow
        ? { x: toCenter.x, y: to.y - connectorGap }
        : { x: toCenter.x, y: to.y + to.height + connectorGap };
    const controlDistance = Math.max(72, Math.abs(end.y - start.y) * 0.45);

    return {
        start,
        end,
        controlA: { x: start.x, y: start.y + (targetIsBelow ? controlDistance : -controlDistance) },
        controlB: { x: end.x, y: end.y - (targetIsBelow ? controlDistance : -controlDistance) },
    };
}

function buildConnectionPath(ports: ConnectionPorts): string {
    const { start, controlA, controlB, end } = ports;
    return `M ${start.x} ${start.y} C ${controlA.x} ${controlA.y}, ${controlB.x} ${controlB.y}, ${end.x} ${end.y}`;
}

function buildConnection(edge: GroupEdge, positions: Record<string, Point>, sizes: Record<string, { width: number; height: number }>) {
    const fromPosition = positions[edge.parentGroupId];
    const toPosition = positions[edge.childGroupId];
    if (!fromPosition || !toPosition) return null;

    const fromSize = sizes[edge.parentGroupId] ?? { width: fallbackNodeWidth, height: fallbackNodeHeight };
    const toSize = sizes[edge.childGroupId] ?? { width: fallbackNodeWidth, height: fallbackNodeHeight };
    const ports = getConnectionPorts(
        { ...fromPosition, ...fromSize },
        { ...toPosition, ...toSize },
    );

    return {
        path: buildConnectionPath(ports),
        ports,
    };
}

export function OrganizationCanvas({
    groups,
    edges,
    memberships,
    users,
    selectedGroupId,
    mode,
    zoom,
    showUsers,
    viewportResetSignal = 0,
    onZoomChange,
    onSelectGroup,
    onCreateEdge,
    onDeleteEdge,
}: Props) {
    const [positions, setPositions] = useState<Record<string, Point>>({});
    const [nodeSizes, setNodeSizes] = useState<Record<string, { width: number; height: number }>>({});
    const [linkSourceId, setLinkSourceId] = useState<ObjectIdString | null>(null);
    const [multiSelectedIds, setMultiSelectedIds] = useState<Set<ObjectIdString>>(() => new Set());
    const [pan, setPan] = useState<Point>({ x: 0, y: 0 });

    const viewportRef = useRef<HTMLElement | null>(null);
    const panRef = useRef<Point>({ x: 0, y: 0 });
    const panGestureRef = useRef<PanState | null>(null);
    const activePointersRef = useRef<Map<number, TouchPoint>>(new Map());
    const pinchRef = useRef<PinchState | null>(null);
    const positionsRef = useRef<Record<string, Point>>({});
    const nodeSizesRef = useRef<Record<string, { width: number; height: number }>>({});
    const dragRef = useRef<DragState | null>(null);
    const suppressClickRef = useRef(false);
    const captureTargetRef = useRef<HTMLElement | null>(null);
    const pendingPositionRef = useRef<PendingPosition[] | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const nodeElementRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const nodeResizeObserverRefs = useRef<Map<string, ResizeObserver>>(new Map());
    const pathElementRefs = useRef<Map<string, SVGPathElement>>(new Map());
    const canvasClickRef = useRef<CanvasClickState | null>(null);

    useEffect(() => {
        setPositions((current) => {
            let changed = false;
            const next = { ...current };

            groups.forEach((group, index) => {
                if (!next[group._id]) {
                    next[group._id] = computeInitialPosition(group, index, edges);
                    changed = true;
                }
            });

            Object.keys(next).forEach((groupId) => {
                if (!groups.some((group) => group._id === groupId)) {
                    delete next[groupId];
                    changed = true;
                }
            });

            return changed ? next : current;
        });
    }, [edges, groups]);

    useEffect(() => {
        positionsRef.current = positions;
    }, [positions]);

    useEffect(() => {
        nodeSizesRef.current = nodeSizes;
    }, [nodeSizes]);

    useEffect(() => {
        panRef.current = pan;
    }, [pan]);

    useEffect(() => {
        const nextPan = { x: 0, y: 0 };
        setPan(nextPan);
        panRef.current = nextPan;
        activePointersRef.current.clear();
        panGestureRef.current = null;
        pinchRef.current = null;
    }, [viewportResetSignal]);

    useEffect(() => {
        if (mode !== "connect") setLinkSourceId(null);
        if (mode !== "move") {
            panGestureRef.current = null;
        }
    }, [mode]);

    useEffect(() => {
        return () => {
            if (animationFrameRef.current !== null) {
                window.cancelAnimationFrame(animationFrameRef.current);
            }
            for (const observer of nodeResizeObserverRefs.current.values()) {
                observer.disconnect();
            }
            nodeResizeObserverRefs.current.clear();
        };
    }, []);

    const canvasSize = useMemo(() => {
        const memberCountByGroup = new Map<ObjectIdString, number>();

        if (showUsers) {
            for (const membership of memberships) {
                memberCountByGroup.set(
                    membership.groupId,
                    (memberCountByGroup.get(membership.groupId) ?? 0) + 1,
                );
            }
        }

        const maxX = Math.max(
            1800,
            ...groups.map((group, index) => {
                const point = positions[group._id] ?? computeInitialPosition(group, index, edges);
                const memberCount = memberCountByGroup.get(group._id) ?? 0;
                const branchWidth = showUsers && memberCount > 0
                    ? userBranchGap + userNodeWidth + 360
                    : 520;
                return point.x + fallbackNodeWidth + branchWidth;
            }),
        );

        const maxY = Math.max(
            1200,
            ...groups.map((group, index) => {
                const point = positions[group._id] ?? computeInitialPosition(group, index, edges);
                const memberCount = memberCountByGroup.get(group._id) ?? 0;
                const renderedMemberNodes = memberCount > maxUserNodesPerGroup
                    ? maxUserNodesPerGroup + 1
                    : memberCount;
                const branchHeight = showUsers && renderedMemberNodes > 0
                    ? userBranchTop + renderedMemberNodes * userNodeHeight + Math.max(0, renderedMemberNodes - 1) * userNodeGap
                    : 0;
                return point.y + Math.max(fallbackNodeHeight, branchHeight) + 520;
            }),
        );

        return { width: maxX, height: maxY };
    }, [edges, groups, memberships, positions, showUsers]);

    const updateConnectedEdgePaths = useCallback((groupId: ObjectIdString) => {
        const currentPositions = positionsRef.current;
        const currentSizes = nodeSizesRef.current;
        for (const edge of edges) {
            if (edge.parentGroupId !== groupId && edge.childGroupId !== groupId) continue;
            const connection = buildConnection(edge, currentPositions, currentSizes);
            const pathElement = pathElementRefs.current.get(edge._id);
            if (connection && pathElement) {
                pathElement.setAttribute("d", connection.path);
            }
        }
    }, [edges]);

    const applyNodePositions = useCallback((nextPositions: PendingPosition[]) => {
        const touchedGroupIds = new Set<ObjectIdString>();

        for (const nextPosition of nextPositions) {
            positionsRef.current[nextPosition.id] = { x: nextPosition.x, y: nextPosition.y };
            touchedGroupIds.add(nextPosition.id);

            const nodeElement = nodeElementRefs.current.get(nextPosition.id);
            if (nodeElement) {
                nodeElement.style.transform = `translate3d(${nextPosition.x}px, ${nextPosition.y}px, 0)`;
            }
        }

        for (const groupId of touchedGroupIds) {
            updateConnectedEdgePaths(groupId);
        }
    }, [updateConnectedEdgePaths]);

    const scheduleDomPositionCommit = useCallback((nextPositions: PendingPosition[]) => {
        pendingPositionRef.current = nextPositions;

        if (animationFrameRef.current !== null) return;

        animationFrameRef.current = window.requestAnimationFrame(() => {
            const pending = pendingPositionRef.current;
            pendingPositionRef.current = null;
            animationFrameRef.current = null;

            if (!pending) return;
            applyNodePositions(pending);
        });
    }, [applyNodePositions]);

    const getViewportRect = useCallback(() => viewportRef.current?.getBoundingClientRect() ?? null, []);

    const screenToWorld = useCallback((clientX: number, clientY: number, sourcePan = panRef.current, sourceZoom = zoom): Point => {
        const rect = getViewportRect();
        if (!rect) return { x: 0, y: 0 };
        return {
            x: (clientX - rect.left - sourcePan.x) / sourceZoom,
            y: (clientY - rect.top - sourcePan.y) / sourceZoom,
        };
    }, [getViewportRect, zoom]);

    const applyZoomAtClientPoint = useCallback((rawNextZoom: number, clientX: number, clientY: number) => {
        const nextZoom = clampZoom(rawNextZoom);
        const rect = getViewportRect();
        if (!rect) {
            onZoomChange(nextZoom);
            return;
        }

        const worldPoint = screenToWorld(clientX, clientY, panRef.current, zoom);
        const nextPan = {
            x: clientX - rect.left - worldPoint.x * nextZoom,
            y: clientY - rect.top - worldPoint.y * nextZoom,
        };

        panRef.current = nextPan;
        setPan(nextPan);
        onZoomChange(nextZoom);
    }, [getViewportRect, onZoomChange, screenToWorld, zoom]);

    const applyZoomAroundWorldAnchor = useCallback((rawNextZoom: number, anchorClient: TouchPoint, worldAnchor: Point) => {
        const nextZoom = clampZoom(rawNextZoom);
        const rect = getViewportRect();
        if (!rect) {
            onZoomChange(nextZoom);
            return;
        }

        const nextPan = {
            x: anchorClient.clientX - rect.left - worldAnchor.x * nextZoom,
            y: anchorClient.clientY - rect.top - worldAnchor.y * nextZoom,
        };

        panRef.current = nextPan;
        setPan(nextPan);
        onZoomChange(nextZoom);
    }, [getViewportRect, onZoomChange]);

    const flushPendingPosition = useCallback(() => {
        const pending = pendingPositionRef.current;
        pendingPositionRef.current = null;

        if (animationFrameRef.current !== null) {
            window.cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        if (pending) applyNodePositions(pending);

        setPositions({ ...positionsRef.current });
    }, [applyNodePositions]);

    const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
        if (activePointersRef.current.has(event.pointerId)) {
            activePointersRef.current.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });
        }

        const touchPoints = Array.from(activePointersRef.current.values());
        if (pinchRef.current && touchPoints.length >= 2) {
            event.preventDefault();
            const [first, second] = touchPoints;
            const distance = getDistance(first, second);
            const center = getMidpoint(first, second);
            const nextZoom = pinchRef.current.startZoom * (distance / Math.max(1, pinchRef.current.startDistance));
            applyZoomAroundWorldAnchor(nextZoom, center, pinchRef.current.worldAnchor);
            return;
        }

        const drag = dragRef.current;
        if (drag) {
            const deltaX = (event.clientX - drag.startClientX) / zoom;
            const deltaY = (event.clientY - drag.startClientY) / zoom;

            if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
                drag.hasMoved = true;
            }

            event.preventDefault();

            const nextPositions = drag.selectedIds.map((id) => {
                const startPosition = drag.startPositions[id] ?? positionsRef.current[id] ?? { x: 24, y: 24 };
                return {
                    id,
                    x: Math.max(24, startPosition.x + deltaX),
                    y: Math.max(24, startPosition.y + deltaY),
                };
            });

            scheduleDomPositionCommit(nextPositions);
            return;
        }

        const canvasClick = canvasClickRef.current;
        if (canvasClick?.pointerId === event.pointerId) {
            const deltaX = event.clientX - canvasClick.startClientX;
            const deltaY = event.clientY - canvasClick.startClientY;
            if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
                canvasClick.hasMoved = true;
            }
        }

        const panGesture = panGestureRef.current;
        if (panGesture) {
            const deltaX = event.clientX - panGesture.startClientX;
            const deltaY = event.clientY - panGesture.startClientY;

            if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
                panGesture.hasMoved = true;
            }

            event.preventDefault();
            const nextPan = {
                x: panGesture.startX + deltaX,
                y: panGesture.startY + deltaY,
            };
            panRef.current = nextPan;
            setPan(nextPan);
        }
    };

    const stopGesture = (event: ReactPointerEvent<HTMLElement>) => {
        activePointersRef.current.delete(event.pointerId);

        if (pinchRef.current && activePointersRef.current.size < 2) {
            pinchRef.current = null;
            const remainingPointer = Array.from(activePointersRef.current.entries())[0];
            if (remainingPointer && mode === "move") {
                const [pointerId, point] = remainingPointer;
                panGestureRef.current = {
                    pointerId,
                    startClientX: point.clientX,
                    startClientY: point.clientY,
                    startX: panRef.current.x,
                    startY: panRef.current.y,
                    hasMoved: false,
                };
            }
        }

        const panGesture = panGestureRef.current;
        if (panGesture?.pointerId === event.pointerId) {
            if (!panGesture.hasMoved && multiSelectedIds.size > 0) {
                setMultiSelectedIds(new Set());
            }
            panGestureRef.current = null;
        }

        const canvasClick = canvasClickRef.current;
        if (canvasClick?.pointerId === event.pointerId) {
            if (!canvasClick.hasMoved && multiSelectedIds.size > 0) {
                setMultiSelectedIds(new Set());
            }
            canvasClickRef.current = null;
        }

        const drag = dragRef.current;
        if (drag) {
            suppressClickRef.current = drag.hasMoved;
            window.setTimeout(() => {
                suppressClickRef.current = false;
            }, 0);
        }

        try {
            captureTargetRef.current?.releasePointerCapture(event.pointerId);
        } catch {
            // Pointer capture can already be released by the browser.
        }

        flushPendingPosition();
        dragRef.current = null;
        if (!panGestureRef.current && !pinchRef.current) {
            captureTargetRef.current = null;
        }
    };

    const startDrag = (event: ReactPointerEvent<HTMLButtonElement>, group: AccessGroup) => {
        if (event.button !== 0 || mode !== "move") return;

        const selectedIds = multiSelectedIds.has(group._id) && multiSelectedIds.size > 1
            ? Array.from(multiSelectedIds)
            : [group._id];

        if (!multiSelectedIds.has(group._id) && multiSelectedIds.size > 0) {
            setMultiSelectedIds(new Set());
        }

        onSelectGroup(group._id);

        const startPositions = selectedIds.reduce<Record<ObjectIdString, Point>>((acc, groupId) => {
            const groupIndex = groups.findIndex((item) => item._id === groupId);
            const selectedGroup = groups[groupIndex];
            acc[groupId] = positionsRef.current[groupId]
                ?? positions[groupId]
                ?? (selectedGroup ? computeInitialPosition(selectedGroup, Math.max(0, groupIndex), edges) : { x: 24, y: 24 });
            return acc;
        }, {});

        dragRef.current = {
            id: group._id,
            selectedIds,
            startClientX: event.clientX,
            startClientY: event.clientY,
            startPositions,
            hasMoved: false,
        };
        captureTargetRef.current = event.currentTarget;
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const startCanvasGesture = (event: ReactPointerEvent<HTMLElement>) => {
        const target = event.target as HTMLElement | null;
        const isInteractiveTarget = Boolean(target?.closest('[data-canvas-interactive="true"]'));
        const isPrimaryOrMiddle = event.button === 0 || event.button === 1;

        if (!isPrimaryOrMiddle || (isInteractiveTarget && event.button !== 1)) return;

        event.preventDefault();
        activePointersRef.current.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });
        captureTargetRef.current = event.currentTarget;
        event.currentTarget.setPointerCapture(event.pointerId);

        const touchPoints = Array.from(activePointersRef.current.values());
        if (touchPoints.length >= 2) {
            const [first, second] = touchPoints;
            const center = getMidpoint(first, second);
            pinchRef.current = {
                startDistance: getDistance(first, second),
                startZoom: zoom,
                worldAnchor: screenToWorld(center.clientX, center.clientY),
            };
            panGestureRef.current = null;
            canvasClickRef.current = null;
            return;
        }

        if (!isInteractiveTarget && event.button === 0) {
            canvasClickRef.current = {
                pointerId: event.pointerId,
                startClientX: event.clientX,
                startClientY: event.clientY,
                hasMoved: false,
            };
        }

        if (mode !== "move" && event.button !== 1) return;

        panGestureRef.current = {
            pointerId: event.pointerId,
            startClientX: event.clientX,
            startClientY: event.clientY,
            startX: panRef.current.x,
            startY: panRef.current.y,
            hasMoved: false,
        };
    };

    const handleWheel = (event: ReactWheelEvent<HTMLElement>) => {
        event.preventDefault();
        const multiplier = event.ctrlKey || event.metaKey ? 0.008 : 0.0018;
        const zoomFactor = Math.exp(-event.deltaY * multiplier);
        applyZoomAtClientPoint(zoom * zoomFactor, event.clientX, event.clientY);
    };

    const handleNodeClick = (groupId: ObjectIdString) => {
        if (suppressClickRef.current) return;

        if (mode === "connect") {
            if (!linkSourceId) {
                setLinkSourceId(groupId);
                onSelectGroup(groupId);
                return;
            }

            if (linkSourceId !== groupId) {
                onCreateEdge(linkSourceId, groupId);
            }
            setLinkSourceId(null);
            onSelectGroup(groupId);
            return;
        }

        if (mode === "multi-select") {
            setMultiSelectedIds((current) => {
                const next = new Set(current);
                if (next.has(groupId)) next.delete(groupId);
                else next.add(groupId);
                return next;
            });
            onSelectGroup(groupId);
            return;
        }

        onSelectGroup(groupId);
    };

    const setMeasuredNodeSize = useCallback((groupId: ObjectIdString, element: HTMLDivElement) => {
        const width = element.offsetWidth || fallbackNodeWidth;
        const height = element.offsetHeight || fallbackNodeHeight;
        const existingRefSize = nodeSizesRef.current[groupId];

        if (existingRefSize?.width === width && existingRefSize.height === height) {
            return;
        }

        const nextSize = { width, height };
        nodeSizesRef.current = { ...nodeSizesRef.current, [groupId]: nextSize };

        setNodeSizes((current) => {
            const existing = current[groupId];
            if (existing?.width === width && existing.height === height) return current;
            return { ...current, [groupId]: nextSize };
        });
    }, []);

    const registerNodeElement = useCallback((groupId: ObjectIdString, element: HTMLDivElement | null) => {
        nodeResizeObserverRefs.current.get(groupId)?.disconnect();
        nodeResizeObserverRefs.current.delete(groupId);

        if (!element) {
            nodeElementRefs.current.delete(groupId);
            return;
        }

        nodeElementRefs.current.set(groupId, element);
        setMeasuredNodeSize(groupId, element);

        if (typeof ResizeObserver !== "undefined") {
            const observer = new ResizeObserver(() => {
                setMeasuredNodeSize(groupId, element);
                updateConnectedEdgePaths(groupId);
            });
            observer.observe(element);
            nodeResizeObserverRefs.current.set(groupId, observer);
        }
    }, [setMeasuredNodeSize, updateConnectedEdgePaths]);

    const registerPathElement = useCallback((edgeId: ObjectIdString, element: SVGPathElement | null) => {
        if (!element) {
            pathElementRefs.current.delete(edgeId);
            return;
        }
        pathElementRefs.current.set(edgeId, element);
    }, []);

    const usersById = useMemo(() => {
        const map = new Map<ObjectIdString, UserSummary>();
        for (const user of users) map.set(user._id, user);
        return map;
    }, [users]);

    const membersByGroup = useMemo(() => {
        const map = new Map<ObjectIdString, UserSummary[]>();
        for (const membership of memberships) {
            const user = membership.user ?? usersById.get(membership.userId);
            if (!user) continue;
            const current = map.get(membership.groupId) ?? [];
            current.push(user);
            map.set(membership.groupId, current);
        }
        return map;
    }, [memberships, usersById]);

    const modeCopy = useMemo(() => {
        if (mode === "connect") return linkSourceId ? "Seleziona il gruppo di destinazione per creare il collegamento." : "Seleziona il gruppo sorgente da collegare.";
        if (mode === "delete-link") return "Clicca direttamente su una linea per rimuovere il collegamento.";
        if (mode === "multi-select") return multiSelectedIds.size > 0
            ? `${multiSelectedIds.size} blocchi selezionati. Passa a Sposta e trascina un blocco selezionato per muoverli insieme.`
            : "Tocca o clicca i blocchi da selezionare. Tocca lo sfondo per svuotare la selezione.";
        return multiSelectedIds.size > 1
            ? `${multiSelectedIds.size} blocchi selezionati: trascinane uno selezionato per muovere il gruppo. Clicca lo sfondo per annullare.`
            : "Trascina i blocchi per spostarli. Trascina lo sfondo per muovere la telecamera. Rotella/pinch per lo zoom.";
    }, [linkSourceId, mode, multiSelectedIds.size]);

    return (
        <main
            ref={viewportRef}
            className={cx(
                "absolute inset-0 overflow-hidden touch-none [background-size:24px_24px]",
                "bg-neutral-100 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.16)_1px,transparent_0)]",
                "dark:bg-neutral-950 dark:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.09)_1px,transparent_0)]",
                mode === "move" ? "cursor-grab active:cursor-grabbing" : "cursor-default",
            )}
            onPointerDown={startCanvasGesture}
            onPointerMove={onPointerMove}
            onPointerUp={stopGesture}
            onPointerCancel={stopGesture}
            onWheel={handleWheel}
        >
            <div
                className="absolute left-0 top-0 origin-top-left"
                style={{
                    width: canvasSize.width,
                    height: canvasSize.height,
                    transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
                }}
            >
                <svg className={cx("absolute inset-0 z-0", mode === "delete-link" ? "pointer-events-auto" : "pointer-events-none")} width={canvasSize.width} height={canvasSize.height} aria-hidden="true">
                    <defs>
                        <marker id="ab-arrow" viewBox="0 0 12 12" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="userSpaceOnUse">
                            <path d="M1,1 L1,11 L11,6 z" className="fill-neutral-400 dark:fill-neutral-600" />
                        </marker>
                    </defs>
                    {edges.map((edge) => {
                        const connection = buildConnection(edge, positions, nodeSizes);
                        if (!connection) return null;
                        const removable = mode === "delete-link";
                        return (
                            <g key={edge._id}>
                                {removable && (
                                    <path
                                        data-canvas-interactive="true"
                                        d={connection.path}
                                        className="pointer-events-auto cursor-pointer fill-none stroke-transparent stroke-[18]"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            onDeleteEdge(edge._id);
                                        }}
                                    />
                                )}
                                <path
                                    ref={(element) => registerPathElement(edge._id, element)}
                                    d={connection.path}
                                    className={cx(
                                        "fill-none stroke-2",
                                        removable ? "stroke-red-400 dark:stroke-red-500" : "stroke-neutral-400 dark:stroke-neutral-700",
                                    )}
                                    markerEnd="url(#ab-arrow)"
                                />
                                <circle
                                    cx={connection.ports.end.x}
                                    cy={connection.ports.end.y}
                                    r={4}
                                    className={cx(
                                        "stroke-2",
                                        removable ? "fill-red-400 stroke-red-950 dark:fill-red-500" : "fill-neutral-300 stroke-neutral-700 dark:fill-neutral-600 dark:stroke-neutral-950",
                                    )}
                                />
                            </g>
                        );
                    })}
                </svg>

                <div className="pointer-events-none absolute left-6 top-6 z-10 max-w-sm rounded-2xl border border-neutral-200 bg-white/80 p-4 opacity-50 shadow-xl backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80">
                    <div className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-neutral-500">Builder canvas</div>
                    <h1 className="mt-1 text-xl font-black tracking-tight">Organigramma permessi</h1>
                    <p className="mt-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">{modeCopy}</p>
                </div>

                {groups.map((group) => {
                    const point = positions[group._id] ?? computeInitialPosition(group, 0, edges);
                    return (
                        <GroupNode
                            key={group._id}
                            refCallback={registerNodeElement}
                            group={group}
                            point={point}
                            members={membersByGroup.get(group._id) ?? []}
                            showUsers={showUsers}
                            selected={selectedGroupId === group._id}
                            connectSource={linkSourceId === group._id}
                            multiSelected={multiSelectedIds.has(group._id)}
                            mode={mode}
                            onPointerDown={startDrag}
                            onClick={handleNodeClick}
                        />
                    );
                })}
            </div>
        </main>
    );
}

const GroupNode = memo(function GroupNode({ refCallback, group, point, members, showUsers, selected, connectSource, multiSelected, mode, onPointerDown, onClick }: {
    refCallback: (groupId: ObjectIdString, element: HTMLDivElement | null) => void;
    group: AccessGroup;
    point: Point;
    members: UserSummary[];
    showUsers: boolean;
    selected: boolean;
    connectSource: boolean;
    multiSelected: boolean;
    mode: CanvasMode;
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>, group: AccessGroup) => void;
    onClick: (id: ObjectIdString) => void;
}) {
    const cursorClass = mode === "move" ? "cursor-grab active:cursor-grabbing" : mode === "connect" ? "cursor-crosshair" : mode === "multi-select" ? "cursor-cell" : "cursor-default";
    const nodeRef = useRef<HTMLDivElement | null>(null);

    useLayoutEffect(() => {
        const element = nodeRef.current;
        if (!element) return;

        refCallback(group._id, element);

        return () => {
            refCallback(group._id, null);
        };
    }, [group._id, refCallback]);

    return (
        <div
            ref={nodeRef}
            data-canvas-interactive="true"
            className="absolute left-0 top-0 z-20 w-[270px] touch-none select-none will-change-transform"
            style={{ transform: `translate3d(${point.x}px, ${point.y}px, 0)` }}
        >
            {multiSelected ? (
                <span className="pointer-events-none absolute -right-2 -top-2 z-30 rounded-full bg-violet-600 px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.14em] text-white shadow-lg shadow-violet-950/20">
                    Selezionato
                </span>
            ) : null}
            <FDBox
                radius="2xl"
                shadow={selected || connectSource || multiSelected ? "2xl" : "lg"}
                border
                className={cx(
                    "relative z-20 bg-white/95 backdrop-blur transition-shadow dark:bg-neutral-900/95",
                    selected && "ring-2 ring-blue-500/70",
                    connectSource && "ring-2 ring-emerald-500/80",
                    multiSelected && "ring-2 ring-violet-500/80",
                )}
            >
                <button
                    type="button"
                    onPointerDown={(event) => onPointerDown(event, group)}
                    onClick={() => onClick(group._id)}
                    className={cx("flex w-full items-start gap-3 p-4 text-left", cursorClass)}
                >
                    <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${kindTone[group.kind] ?? "bg-neutral-500"}`} />
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-base font-black tracking-tight dark:text-neutral-200">{group.name}</span>
                        <span className="mt-0.5 block truncate text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">{group.key}</span>
                        <span className="mt-1 block truncate text-[0.68rem] font-black uppercase tracking-[0.18em] text-neutral-500">{kindLabel[group.kind] ?? group.kind}</span>
                        <span className="mt-3 grid grid-cols-3 gap-2 text-center text-[0.68rem] font-black text-neutral-500">
                            <span className="rounded-xl bg-neutral-100 px-2 py-1 dark:bg-neutral-800"><b className="block text-sm text-neutral-900 dark:text-neutral-100">{group.membersCount ?? members.length}</b>Membri</span>
                            <span className="rounded-xl bg-neutral-100 px-2 py-1 dark:bg-neutral-800"><b className="block text-sm text-neutral-900 dark:text-neutral-100">{group.grantsCount ?? 0}</b>Grant</span>
                            <span className="rounded-xl bg-neutral-100 px-2 py-1 dark:bg-neutral-800"><b className="block text-sm text-neutral-900 dark:text-neutral-100">{group.inheritedGrantsCount ?? 0}</b>Ered.</span>
                        </span>
                    </span>
                </button>
            </FDBox>

            {showUsers ? <MemberBranch groupId={group._id} members={members} /> : null}
        </div>
    );
});

const MemberBranch = memo(function MemberBranch({ groupId, members }: { groupId: ObjectIdString; members: UserSummary[] }) {
    if (members.length === 0) return null;

    const visibleMembers = members.slice(0, maxUserNodesPerGroup);
    const overflowCount = Math.max(0, members.length - visibleMembers.length);
    const renderedNodeCount = visibleMembers.length + (overflowCount > 0 ? 1 : 0);
    const branchHeight = userBranchTop + renderedNodeCount * userNodeHeight + Math.max(0, renderedNodeCount - 1) * userNodeGap;
    const startX = fallbackNodeWidth + 6;
    const startY = 74;
    const endX = fallbackNodeWidth + userBranchGap;
    const markerId = `ab-user-arrow-${groupId}`;

    return (
        <div
            className="pointer-events-none absolute left-0 top-0 z-10"
            aria-hidden="true"
            style={{
                width: fallbackNodeWidth + userBranchGap + userNodeWidth,
                height: Math.max(branchHeight + userBranchTop, fallbackNodeHeight),
            }}
        >
            <svg
                className="absolute left-0 top-0 overflow-visible"
                width={fallbackNodeWidth + userBranchGap + userNodeWidth}
                height={Math.max(branchHeight + userBranchTop, fallbackNodeHeight)}
            >
                <defs>
                    <marker id={markerId} viewBox="0 0 12 12" markerWidth="10" markerHeight="10" refX="10" refY="6" orient="auto" markerUnits="userSpaceOnUse">
                        <path d="M1,1 L1,11 L11,6 z" className="fill-blue-400 dark:fill-blue-500" />
                    </marker>
                </defs>
                {Array.from({ length: renderedNodeCount }).map((_, index) => {
                    const centerY = userBranchTop + index * (userNodeHeight + userNodeGap) + userNodeHeight / 2;
                    const controlA = startX + Math.max(36, (endX - startX) * 0.55);
                    const controlB = endX - 34;
                    return (
                        <path
                            key={index}
                            d={`M ${startX} ${startY} C ${controlA} ${startY}, ${controlB} ${centerY}, ${endX - 4} ${centerY}`}
                            className="fill-none stroke-blue-300 stroke-[1.8] [stroke-dasharray:5_5] dark:stroke-blue-700"
                            markerEnd={`url(#${markerId})`}
                        />
                    );
                })}
            </svg>

            <div
                className="absolute flex flex-col gap-3"
                style={{
                    left: fallbackNodeWidth + userBranchGap,
                    top: userBranchTop,
                    width: userNodeWidth,
                }}
            >
                {visibleMembers.map((user) => (
                    <UserMemberNode key={user._id} user={user} />
                ))}
                {overflowCount > 0 ? <UserOverflowNode count={overflowCount} /> : null}
            </div>
        </div>
    );
});

const UserMemberNode = memo(function UserMemberNode({ user }: { user: UserSummary }) {
    const displayName = getUserDisplayName(user);
    const initials = displayName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "U";

    return (
        <div
            className={cx(
                "flex h-[68px] w-[224px] items-center gap-3 rounded-2xl border bg-white/95 px-3 shadow-md backdrop-blur dark:bg-neutral-900/95",
                user.disabilitato
                    ? "border-red-200 dark:border-red-900/70"
                    : "border-blue-200 dark:border-blue-900/70",
            )}
        >
            <span
                className={cx(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-xs font-black",
                    user.disabilitato
                        ? "bg-red-50 text-red-700 dark:bg-red-950/70 dark:text-red-200"
                        : "bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-200",
                )}
            >
                {initials}
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black text-neutral-900 dark:text-neutral-100">
                    {displayName}
                </span>
                <span className="mt-0.5 block truncate text-[0.68rem] font-bold uppercase tracking-[0.12em] text-neutral-500">
                    {getUserRoleLabel(user)}
                </span>
                {user.disabilitato ? (
                    <span className="mt-1 inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[0.58rem] font-black uppercase tracking-[0.14em] text-red-700 dark:bg-red-950/60 dark:text-red-200">
                        Disabilitato
                    </span>
                ) : null}
            </span>
        </div>
    );
});

const UserOverflowNode = memo(function UserOverflowNode({ count }: { count: number }) {
    return (
        <div className="grid h-[68px] w-[224px] place-items-center rounded-2xl border border-dashed border-neutral-300 bg-white/75 px-3 text-center shadow-sm backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/75">
            <span>
                <span className="block text-sm font-black text-neutral-900 dark:text-neutral-100">+{count} utenti</span>
                <span className="mt-1 block text-[0.62rem] font-black uppercase tracking-[0.18em] text-neutral-500">altri membri diretti</span>
            </span>
        </div>
    );
});
