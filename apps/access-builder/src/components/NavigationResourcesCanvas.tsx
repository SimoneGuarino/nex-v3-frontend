import {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type PointerEvent as ReactPointerEvent,
    type WheelEvent as ReactWheelEvent,
} from "react";
import { FDBox } from "@nex/fd-ui";
import {
    MdAccountTree,
    MdArticle,
    MdBolt,
    MdDataObject,
    MdFolder,
    MdLink,
    MdLinkOff,
    MdOpenWith,
    MdOutlinePushPin,
    MdSelectAll,
} from "react-icons/md";
import type { CanvasPoint, NavigationResource, ObjectIdString } from "../model/types";
import type { CanvasMode } from "./OrganizationCanvas";
import { useCanvasSelection } from "../engine/canvas/useCanvasSelection";
import { normalizeCanvasPoint, normalizeCanvasPositions } from "../engine/canvas/layout";

interface Props {
    resources: NavigationResource[];
    selectedResourceId: ObjectIdString | null;
    mode: CanvasMode;
    zoom: number;
    viewportResetSignal?: number;
    layoutPositions?: Record<ObjectIdString, CanvasPoint>;
    onZoomChange: (zoom: number) => void;
    onSelectResource: (id: ObjectIdString) => void;
    onSetParent: (parentResourceId: ObjectIdString, childResourceId: ObjectIdString) => void;
    onClearParent: (resourceId: ObjectIdString) => void;
    onLayoutPositionsChange?: (positions: Record<ObjectIdString, CanvasPoint>) => void;
}

interface Point { x: number; y: number; }
interface DragState {
    primaryId: ObjectIdString;
    draggedIds: ObjectIdString[];
    startClientX: number;
    startClientY: number;
    startPositions: Record<ObjectIdString, Point>;
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
interface ConnectionTopology {
    id: string;
    parentId: ObjectIdString;
    childId: ObjectIdString;
    parent: NavigationResource;
    child: NavigationResource;
}

const nodeWidth = 302;
const nodeHeight = 124;
const minZoom = 0.35;
const maxZoom = 2.25;

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

function clampZoom(value: number) {
    if (!Number.isFinite(value)) return 1;
    return Math.min(maxZoom, Math.max(minZoom, Number(value.toFixed(3))));
}

function getDepth(resource: NavigationResource, byKey: Map<string, NavigationResource>, seen = new Set<string>()): number {
    const parentKey = resource.parentKey || null;
    if (!parentKey) return 0;
    const parentMapKey = `${resource.appId}:${parentKey}`;
    if (seen.has(parentMapKey)) return 0;
    seen.add(parentMapKey);
    const parent = byKey.get(parentMapKey);
    if (!parent) return 0;
    return 1 + getDepth(parent, byKey, seen);
}

function computeInitialPosition(resource: NavigationResource, index: number, byKey: Map<string, NavigationResource>): Point {
    const depth = getDepth(resource, byKey);
    const appOffset = resource.appId === "shell" ? 0 : resource.appId === "legacy" ? 120 : 220;
    return {
        x: 90 + depth * 410 + appOffset,
        y: 180 + (index % 7) * 154 + Math.floor(index / 7) * 160,
    };
}

function buildPath(parent: Point, child: Point) {
    const parentCenterY = parent.y + nodeHeight / 2;
    const childCenterY = child.y + nodeHeight / 2;
    const parentCenterX = parent.x + nodeWidth / 2;
    const childCenterX = child.x + nodeWidth / 2;
    const childIsRight = childCenterX >= parentCenterX;

    const start = childIsRight
        ? { x: parent.x + nodeWidth + 6, y: parentCenterY }
        : { x: parent.x - 6, y: parentCenterY };
    const end = childIsRight
        ? { x: child.x - 8, y: childCenterY }
        : { x: child.x + nodeWidth + 8, y: childCenterY };
    const direction = childIsRight ? 1 : -1;
    const control = Math.max(84, Math.abs(end.x - start.x) * 0.45);

    return `M ${start.x} ${start.y} C ${start.x + control * direction} ${start.y}, ${end.x - control * direction} ${end.y}, ${end.x} ${end.y}`;
}

function canBeParent(resource: NavigationResource) {
    return resource.type === "GROUP" || resource.type === "PANEL";
}

function reconcileOrphanLayoutPositions(
    resources: NavigationResource[],
    layoutPositions?: Record<ObjectIdString, CanvasPoint>,
): Record<ObjectIdString, CanvasPoint> | undefined {
    if (!layoutPositions || Object.keys(layoutPositions).length === 0) return layoutPositions;

    const resourceIds = new Set(resources.map((resource) => resource._id));
    const directMatches = resources.filter((resource) => layoutPositions[resource._id]).length;

    if (directMatches > 0) return layoutPositions;

    const orphanPositions = Object.entries(layoutPositions)
        .filter(([id]) => !resourceIds.has(id))
        .map(([, point]) => point)
        .filter((point) => Number.isFinite(point?.x) && Number.isFinite(point?.y));

    // Defensive migration path: early fallback navigation resources used volatile ObjectIds.
    // When the DB/resource identity becomes stable, remap the old layout by the same
    // rendered order once; the next publish persists the layout using durable IDs.
    if (orphanPositions.length !== resources.length) return layoutPositions;

    return resources.reduce<Record<ObjectIdString, CanvasPoint>>((acc, resource, index) => {
        const point = orphanPositions[index];
        if (point) acc[resource._id] = { x: Math.round(point.x), y: Math.round(point.y) };
        return acc;
    }, {});
}

function resourceIcon(type: string) {
    if (type === "GROUP") return <MdFolder />;
    if (type === "ACTION") return <MdBolt />;
    if (type === "DATA_SCOPE") return <MdDataObject />;
    return <MdArticle />;
}

function resourceTone(type: string) {
    if (type === "GROUP") return "bg-slate-800 dark:bg-slate-200 dark:text-slate-950";
    if (type === "ACTION") return "bg-amber-500";
    if (type === "DATA_SCOPE") return "bg-violet-500";
    return "bg-blue-500";
}

function resourceLabel(type: string) {
    if (type === "GROUP") return "Gruppo menu";
    if (type === "PANEL") return "Pannello";
    if (type === "ACTION") return "Azione";
    if (type === "DATA_SCOPE") return "Data scope";
    return type;
}

export function NavigationResourcesCanvas({
    resources,
    selectedResourceId,
    mode,
    zoom,
    viewportResetSignal = 0,
    layoutPositions,
    onZoomChange,
    onSelectResource,
    onSetParent,
    onClearParent,
    onLayoutPositionsChange,
}: Props) {
    const activeResources = useMemo(
        () => resources
            .filter((resource) => resource.status !== "DISABLED")
            .slice()
            .sort((a, b) => {
                const map = new Map(resources.map((item) => [`${item.appId}:${item.key}`, item]));
                return (a.appId || "").localeCompare(b.appId || "")
                    || getDepth(a, map) - getDepth(b, map)
                    || (a.order ?? 0) - (b.order ?? 0)
                    || a.name.localeCompare(b.name);
            }),
        [resources],
    );
    const activeResourceIds = useMemo(() => new Set(activeResources.map((resource) => resource._id)), [activeResources]);
    const reconciledLayoutPositions = useMemo(
        () => reconcileOrphanLayoutPositions(activeResources, layoutPositions),
        [activeResources, layoutPositions],
    );
    const selection = useCanvasSelection();

    const byKey = useMemo(() => {
        const map = new Map<string, NavigationResource>();
        for (const resource of activeResources) map.set(`${resource.appId}:${resource.key}`, resource);
        return map;
    }, [activeResources]);

    const [positions, setPositions] = useState<Record<string, Point>>({});
    const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
    const [linkSourceId, setLinkSourceId] = useState<ObjectIdString | null>(null);
    const positionsRef = useRef<Record<string, Point>>({});
    const panRef = useRef<Point>({ x: 0, y: 0 });
    const viewportRef = useRef<HTMLElement | null>(null);
    const dragRef = useRef<DragState | null>(null);
    const panRefState = useRef<PanState | null>(null);
    const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const pathRefs = useRef<Map<string, SVGPathElement>>(new Map());
    const hitPathRefs = useRef<Map<string, SVGPathElement>>(new Map());
    const connectionsRef = useRef<ConnectionTopology[]>([]);
    const frameRef = useRef<number | null>(null);
    const pendingDragRef = useRef<Record<string, Point> | null>(null);
    const suppressClickRef = useRef(false);

    useEffect(() => {
        setPositions((current) => {
            let changed = false;
            const next = { ...current };
            const validIds = new Set(activeResources.map((resource) => resource._id));
            activeResources.forEach((resource, index) => {
                const saved = normalizeCanvasPoint(reconciledLayoutPositions?.[resource._id]);

                const desired =
                    saved ??
                    next[resource._id] ??
                    computeInitialPosition(resource, index, byKey);
                    
                if (!next[resource._id] || next[resource._id].x !== desired.x || next[resource._id].y !== desired.y) {
                    next[resource._id] = desired;
                    changed = true;
                }
            });
            for (const id of Object.keys(next)) {
                if (!validIds.has(id)) {
                    delete next[id];
                    changed = true;
                }
            }
            return changed ? next : current;
        });
    }, [activeResources, byKey, reconciledLayoutPositions]);

    useEffect(() => {
        positionsRef.current = positions;
    }, [positions]);
    useEffect(() => { panRef.current = pan; }, [pan]);
    useEffect(() => {
        setPan({ x: 0, y: 0 });
        panRef.current = { x: 0, y: 0 };
        dragRef.current = null;
        panRefState.current = null;
    }, [viewportResetSignal]);

    useEffect(() => {
        if (mode !== "connect") setLinkSourceId(null);
    }, [mode]);

    useEffect(() => {
        const nextSelected = selection.selectedIds.filter((id) => activeResourceIds.has(id));
        if (nextSelected.length !== selection.selectedIds.length) selection.setMany(nextSelected);
    }, [activeResourceIds, selection]);

    const canvasSize = useMemo(() => {
        const maxX = Math.max(1900, ...activeResources.map((resource, index) => {
            const point = positions[resource._id] ?? computeInitialPosition(resource, index, byKey);
            return point.x + nodeWidth + 680;
        }));
        const maxY = Math.max(1300, ...activeResources.map((resource, index) => {
            const point = positions[resource._id] ?? computeInitialPosition(resource, index, byKey);
            return point.y + nodeHeight + 520;
        }));
        return { width: maxX, height: maxY };
    }, [activeResources, byKey, positions]);

    const connectionTopology = useMemo<ConnectionTopology[]>(() => activeResources.flatMap((resource) => {
        if (!resource.parentKey) return [];
        const parent = byKey.get(`${resource.appId}:${resource.parentKey}`);
        if (!parent) return [];
        return [{
            id: `${parent._id}:${resource._id}`,
            parentId: parent._id,
            childId: resource._id,
            parent,
            child: resource,
        }];
    }), [activeResources, byKey]);

    useEffect(() => {
        connectionsRef.current = connectionTopology;
    }, [connectionTopology]);

    const updateConnectedPathsForNodes = useCallback((nodeIds: Iterable<string>) => {
        const affected = new Set(nodeIds);
        for (const connection of connectionsRef.current) {
            if (!affected.has(connection.parentId) && !affected.has(connection.childId)) continue;
            const parentPoint = positionsRef.current[connection.parentId];
            const childPoint = positionsRef.current[connection.childId];
            if (!parentPoint || !childPoint) continue;
            const nextPath = buildPath(parentPoint, childPoint);
            pathRefs.current.get(connection.id)?.setAttribute("d", nextPath);
            hitPathRefs.current.get(connection.id)?.setAttribute("d", nextPath);
        }
    }, []);

    const scheduleNodeTransforms = useCallback((nextPositions: Record<string, Point>) => {
        pendingDragRef.current = {
            ...(pendingDragRef.current ?? {}),
            ...nextPositions,
        };
        if (frameRef.current !== null) return;
        frameRef.current = window.requestAnimationFrame(() => {
            frameRef.current = null;
            const pending = pendingDragRef.current;
            pendingDragRef.current = null;
            if (!pending) return;
            const affectedIds = Object.keys(pending);
            for (const [id, point] of Object.entries(pending)) {
                positionsRef.current[id] = { x: point.x, y: point.y };
                const el = nodeRefs.current.get(id);
                if (el) el.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`;
            }
            updateConnectedPathsForNodes(affectedIds);
        });
    }, [updateConnectedPathsForNodes]);

    const flushPendingNodeTransforms = useCallback(() => {
        if (frameRef.current !== null) {
            window.cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        }

        const pending = pendingDragRef.current;
        pendingDragRef.current = null;
        if (!pending) return;

        const affectedIds = Object.keys(pending);
        for (const [id, point] of Object.entries(pending)) {
            positionsRef.current[id] = { x: point.x, y: point.y };
            const el = nodeRefs.current.get(id);
            if (el) el.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`;
        }
        updateConnectedPathsForNodes(affectedIds);
    }, [updateConnectedPathsForNodes]);

    const commitPositions = useCallback(() => {
        flushPendingNodeTransforms();
        const next = normalizeCanvasPositions(positionsRef.current);
        positionsRef.current = next;
        setPositions(next);
        onLayoutPositionsChange?.(next);
    }, [flushPendingNodeTransforms, onLayoutPositionsChange]);

    const handleWheel = useCallback((event: ReactWheelEvent<HTMLElement>) => {
        event.preventDefault();
        const viewport = viewportRef.current;
        if (!viewport) return;
        const rect = viewport.getBoundingClientRect();
        const nextZoom = clampZoom(zoom * (event.deltaY > 0 ? 0.92 : 1.08));
        if (nextZoom === zoom) return;
        const cursor = { x: event.clientX - rect.left, y: event.clientY - rect.top };
        const world = {
            x: (cursor.x - panRef.current.x) / zoom,
            y: (cursor.y - panRef.current.y) / zoom,
        };
        const nextPan = {
            x: cursor.x - world.x * nextZoom,
            y: cursor.y - world.y * nextZoom,
        };
        setPan(nextPan);
        panRef.current = nextPan;
        onZoomChange(nextZoom);
    }, [onZoomChange, zoom]);

    const handleBackgroundPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
        if (event.button !== 0 && event.button !== 1) return;
        const target = event.target as HTMLElement;
        if (target.closest("[data-nav-node='true']")) return;
        if (mode === "multi-select") selection.clear();
        panRefState.current = {
            pointerId: event.pointerId,
            startClientX: event.clientX,
            startClientY: event.clientY,
            startX: panRef.current.x,
            startY: panRef.current.y,
            hasMoved: false,
        };
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    }, [mode, selection]);

    const handleNodePointerDown = useCallback((event: ReactPointerEvent<HTMLElement>, resource: NavigationResource) => {
        event.stopPropagation();
        if (mode !== "move") return;
        const primaryPoint = positionsRef.current[resource._id];
        if (!primaryPoint) return;

        const shouldGroupDrag = selection.selectedIdsSet.has(resource._id) && selection.selectedIds.length > 0;
        const draggedIds = shouldGroupDrag ? selection.selectedIds.filter((id) => positionsRef.current[id]) : [resource._id];
        if (!shouldGroupDrag) selection.selectOnly(resource._id);

        const startPositions = draggedIds.reduce<Record<string, Point>>((acc, id) => {
            const point = positionsRef.current[id];
            if (point) acc[id] = { ...point };
            return acc;
        }, {});

        dragRef.current = {
            primaryId: resource._id,
            draggedIds,
            startClientX: event.clientX,
            startClientY: event.clientY,
            startPositions,
            hasMoved: false,
        };
        viewportRef.current?.setPointerCapture(event.pointerId);
    }, [mode, selection]);

    const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
        const drag = dragRef.current;
        if (drag) {
            const deltaX = (event.clientX - drag.startClientX) / zoom;
            const deltaY = (event.clientY - drag.startClientY) / zoom;
            if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) drag.hasMoved = true;
            const nextPositions = drag.draggedIds.reduce<Record<string, Point>>((acc, id) => {
                const start = drag.startPositions[id];
                if (!start) return acc;
                acc[id] = {
                    x: Math.round(start.x + deltaX),
                    y: Math.round(start.y + deltaY),
                };
                return acc;
            }, {});
            scheduleNodeTransforms(nextPositions);
            suppressClickRef.current = true;
            return;
        }

        const panGesture = panRefState.current;
        if (panGesture) {
            const movedX = event.clientX - panGesture.startClientX;
            const movedY = event.clientY - panGesture.startClientY;
            if (Math.abs(movedX) > 2 || Math.abs(movedY) > 2) panGesture.hasMoved = true;
            const nextPan = {
                x: panGesture.startX + movedX,
                y: panGesture.startY + movedY,
            };
            setPan(nextPan);
            panRef.current = nextPan;
        }
    }, [scheduleNodeTransforms, zoom]);

    const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLElement>) => {
        if (dragRef.current) {
            const drag = dragRef.current;
            dragRef.current = null;
            if (drag.hasMoved) commitPositions();
            window.setTimeout(() => { suppressClickRef.current = false; }, 0);
        }
        if (panRefState.current?.pointerId === event.pointerId) {
            const panGesture = panRefState.current;
            panRefState.current = null;
            if (!panGesture.hasMoved && mode !== "multi-select") selection.clear();
        }
    }, [commitPositions, mode, selection]);

    const handleResourceClick = useCallback((resource: NavigationResource) => {
        if (suppressClickRef.current) return;
        onSelectResource(resource._id);

        if (mode === "multi-select") {
            selection.toggle(resource._id);
            return;
        }

        if (mode === "connect") {
            if (!linkSourceId) {
                if (!canBeParent(resource)) return;
                setLinkSourceId(resource._id);
                return;
            }
            if (linkSourceId !== resource._id) onSetParent(linkSourceId, resource._id);
            setLinkSourceId(null);
            return;
        }

        if (mode === "delete-link") {
            onClearParent(resource._id);
        }
    }, [linkSourceId, mode, onClearParent, onSelectResource, onSetParent, selection]);

    return (
        <main
            ref={viewportRef}
            className={cx("absolute inset-0 touch-none overflow-hidden bg-[radial-gradient(circle_at_1px_1px,rgba(120,120,120,0.20)_1px,transparent_0)] [background-size:28px_28px]",
                mode === "move" ? "cursor-grab active:cursor-grabbing" : "cursor-default",
            )}
            onWheel={handleWheel}
            onPointerDown={handleBackgroundPointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            <div
                className="absolute left-0 top-0 origin-top-left"
                style={{ width: canvasSize.width, height: canvasSize.height, transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})` }}
            >
                <div className="pointer-events-none absolute left-6 top-6 z-10 max-w-sm rounded-2xl border border-neutral-200 bg-white/80 p-4 opacity-50 shadow-xl backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80">
                    <div className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-neutral-500 flex items-center gap-1"><MdOutlinePushPin size={20} /> Navigation Engine</div>
                    <h1 className="mt-1 text-xl font-black tracking-tight">{activeResources.length} nodi</h1>
                    <p className="mt-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">GROUP = contenitore, PANEL = route, ACTION/DATA_SCOPE = capacità</p>
                    {selection.hasSelection ? (
                        <p className="mt-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.13em] text-blue-700 dark:bg-blue-950/40 dark:text-blue-200">
                            {selection.selectedIds.length} selezionati
                        </p>
                    ) : null}
                </div>

                <svg className="pointer-events-none absolute inset-0 overflow-visible" width={canvasSize.width} height={canvasSize.height}>
                    <defs>
                        <marker id="nav-resource-arrow" viewBox="0 0 12 12" markerWidth="10" markerHeight="10" refX="10" refY="6" orient="auto" markerUnits="userSpaceOnUse">
                            <path d="M1,1 L1,11 L11,6 z" className="fill-blue-500" />
                        </marker>
                    </defs>
                    {connectionTopology.map((connection) => {
                        const parentPoint = positions[connection.parentId];
                        const childPoint = positions[connection.childId];
                        const path = parentPoint && childPoint ? buildPath(parentPoint, childPoint) : "";
                        return (
                            <g key={connection.id}>
                                {mode === "delete-link" ? (
                                    <path
                                        ref={(element) => {
                                            if (element) hitPathRefs.current.set(connection.id, element);
                                            else hitPathRefs.current.delete(connection.id);
                                        }}
                                        data-canvas-interactive="true"
                                        d={path}
                                        className="pointer-events-auto cursor-pointer fill-none stroke-transparent stroke-[18]"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            onClearParent(connection.child._id);
                                        }}
                                    />
                                ) : null}
                                <path
                                    ref={(element) => {
                                        if (element) pathRefs.current.set(connection.id, element);
                                        else pathRefs.current.delete(connection.id);
                                    }}
                                    d={path}
                                    className={cx(
                                        "fill-none stroke-[2.2]",
                                        connection.parent.type === "GROUP" ? "stroke-slate-400 dark:stroke-slate-500" : "stroke-blue-300 dark:stroke-blue-700",
                                        mode === "delete-link" && "stroke-red-300 dark:stroke-red-700",
                                    )}
                                    markerEnd="url(#nav-resource-arrow)"
                                />
                            </g>
                        );
                    })}
                </svg>

                {activeResources.map((resource, index) => {
                    const point = positions[resource._id] ?? computeInitialPosition(resource, index, byKey);
                    return (
                        <ResourceNode
                            key={resource._id}
                            nodeRef={(element) => {
                                if (element) nodeRefs.current.set(resource._id, element);
                                else nodeRefs.current.delete(resource._id);
                            }}
                            resource={resource}
                            point={point}
                            selected={selectedResourceId === resource._id}
                            multiSelected={selection.isSelected(resource._id)}
                            linkSource={linkSourceId === resource._id}
                            mode={mode}
                            onPointerDown={handleNodePointerDown}
                            onClick={handleResourceClick}
                        />
                    );
                })}
            </div>
        </main>
    );
}

const ResourceNode = memo(function ResourceNode({ nodeRef, resource, point, selected, multiSelected, linkSource, mode, onPointerDown, onClick }: {
    nodeRef: (element: HTMLDivElement | null) => void;
    resource: NavigationResource;
    point: Point;
    selected: boolean;
    multiSelected: boolean;
    linkSource: boolean;
    mode: CanvasMode;
    onPointerDown: (event: ReactPointerEvent<HTMLElement>, resource: NavigationResource) => void;
    onClick: (resource: NavigationResource) => void;
}) {
    const cursorClass = mode === "move" ? "cursor-grab active:cursor-grabbing" : mode === "connect" ? "cursor-crosshair" : mode === "delete-link" ? "cursor-pointer" : "cursor-cell";
    const isContainer = resource.type === "GROUP";
    return (
        <div
            ref={nodeRef}
            data-nav-node="true"
            className="absolute left-0 top-0 z-20 w-[302px] touch-none select-none will-change-transform"
            style={{ transform: `translate3d(${point.x}px, ${point.y}px, 0)` }}
        >
            <FDBox
                radius="2xl"
                shadow={selected || linkSource || multiSelected ? "2xl" : "lg"}
                border
                className={cx(
                    "relative bg-white/95 backdrop-blur transition-shadow dark:bg-neutral-900/95",
                    selected && "ring-2 ring-blue-500/80",
                    multiSelected && "ring-2 ring-cyan-500/90",
                    linkSource && "ring-2 ring-emerald-500/90",
                    resource.status === "DISABLED" && "opacity-60 grayscale",
                    isContainer && "border-slate-300 bg-slate-50/95 dark:border-slate-700 dark:bg-slate-950/80",
                )}
            >
                <button
                    type="button"
                    onPointerDown={(event) => onPointerDown(event, resource)}
                    onClick={() => onClick(resource)}
                    className={cx("flex w-full items-start gap-3 p-4 text-left", cursorClass)}
                >
                    <span className={cx("mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl text-white", resourceTone(resource.type))}>
                        {resourceIcon(resource.type)}
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-base font-black tracking-tight text-neutral-900 dark:text-neutral-100">{resource.name}</span>
                        <span className="mt-0.5 block truncate text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">{resource.appId} · {resource.key}</span>
                        <span className="mt-2 inline-flex rounded-full bg-neutral-100 px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.14em] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                            {resourceLabel(resource.type)} · {resource.status}
                        </span>
                        {multiSelected ? (
                            <span className="ml-2 mt-2 inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.14em] text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-200">
                                <MdSelectAll /> Selezionato
                            </span>
                        ) : null}
                        {resource.route ? (
                            <span className="mt-2 block truncate rounded-xl bg-blue-50 px-2 py-1 text-[0.68rem] font-bold text-blue-700 dark:bg-blue-950/30 dark:text-blue-200">{resource.route}</span>
                        ) : (
                            <span className="mt-2 block truncate rounded-xl bg-neutral-100 px-2 py-1 text-[0.68rem] font-bold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">Contenitore / capability senza route</span>
                        )}
                    </span>
                    <span className="mt-1 text-neutral-400" aria-hidden="true">
                        {mode === "move" ? <MdOpenWith /> : mode === "connect" ? <MdLink /> : <MdLinkOff />}
                    </span>
                </button>
                {isContainer ? (
                    <div className="pointer-events-none absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-slate-900 text-white shadow-lg dark:bg-slate-100 dark:text-slate-950" title="Nodo contenitore">
                        <MdAccountTree />
                    </div>
                ) : null}
            </FDBox>
        </div>
    );
});
