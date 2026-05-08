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
    MdOutlinePushPin
} from "react-icons/md";
import type { CanvasPoint, NavigationResource, ObjectIdString } from "../model/types";
import type { CanvasMode } from "./OrganizationCanvas";

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
    id: string;
    startClientX: number;
    startClientY: number;
    startPoint: Point;
    hasMoved: boolean;
}
interface PanState {
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
}
interface ConnectionTopology {
    id: string;
    parentId: string;
    childId: string;
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
            .sort((a, b) => (
                (a.appId || "").localeCompare(b.appId || "")
                || getDepth(a, new Map(resources.map((item) => [`${item.appId}:${item.key}`, item]))) - getDepth(b, new Map(resources.map((item) => [`${item.appId}:${item.key}`, item])))
                || (a.order ?? 0) - (b.order ?? 0)
                || a.name.localeCompare(b.name)
            )),
        [resources],
    );
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
    const pendingDragRef = useRef<{ id: string; x: number; y: number } | null>(null);
    const suppressClickRef = useRef(false);

    useEffect(() => {
        setPositions((current) => {
            let changed = false;
            const next = { ...current };
            const validIds = new Set(activeResources.map((resource) => resource._id));
            activeResources.forEach((resource, index) => {
                const saved = layoutPositions?.[resource._id];
                const desired = Number.isFinite(saved?.x) && Number.isFinite(saved?.y)
                    ? { x: Number(saved.x), y: Number(saved.y) }
                    : next[resource._id] ?? computeInitialPosition(resource, index, byKey);
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
    }, [activeResources, byKey, layoutPositions]);

    useEffect(() => { positionsRef.current = positions; }, [positions]);
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

    const updateConnectedPathsForNode = useCallback((nodeId: string) => {
        for (const connection of connectionsRef.current) {
            if (connection.parentId !== nodeId && connection.childId !== nodeId) continue;
            const parentPoint = positionsRef.current[connection.parentId];
            const childPoint = positionsRef.current[connection.childId];
            if (!parentPoint || !childPoint) continue;
            const nextPath = buildPath(parentPoint, childPoint);
            pathRefs.current.get(connection.id)?.setAttribute("d", nextPath);
            hitPathRefs.current.get(connection.id)?.setAttribute("d", nextPath);
        }
    }, []);

    const scheduleNodeTransform = useCallback((id: string, point: Point) => {
        pendingDragRef.current = { id, x: point.x, y: point.y };
        if (frameRef.current !== null) return;
        frameRef.current = window.requestAnimationFrame(() => {
            frameRef.current = null;
            const pending = pendingDragRef.current;
            pendingDragRef.current = null;
            if (!pending) return;
            positionsRef.current[pending.id] = { x: pending.x, y: pending.y };
            const el = nodeRefs.current.get(pending.id);
            if (el) el.style.transform = `translate3d(${pending.x}px, ${pending.y}px, 0)`;
            updateConnectedPathsForNode(pending.id);
        });
    }, [updateConnectedPathsForNode]);

    const commitPositions = useCallback(() => {
        const next = { ...positionsRef.current };
        setPositions(next);
        onLayoutPositionsChange?.(next);
    }, [onLayoutPositionsChange]);

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
        panRefState.current = {
            pointerId: event.pointerId,
            startClientX: event.clientX,
            startClientY: event.clientY,
            startX: panRef.current.x,
            startY: panRef.current.y,
        };
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    }, []);

    const handleNodePointerDown = useCallback((event: ReactPointerEvent<HTMLElement>, resource: NavigationResource) => {
        event.stopPropagation();
        if (mode !== "move") return;
        const point = positionsRef.current[resource._id];
        if (!point) return;
        dragRef.current = {
            id: resource._id,
            startClientX: event.clientX,
            startClientY: event.clientY,
            startPoint: point,
            hasMoved: false,
        };
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    }, [mode]);

    const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
        const drag = dragRef.current;
        if (drag) {
            const deltaX = (event.clientX - drag.startClientX) / zoom;
            const deltaY = (event.clientY - drag.startClientY) / zoom;
            if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) drag.hasMoved = true;
            const point = { x: Math.round(drag.startPoint.x + deltaX), y: Math.round(drag.startPoint.y + deltaY) };
            scheduleNodeTransform(drag.id, point);
            suppressClickRef.current = true;
            return;
        }

        const panGesture = panRefState.current;
        if (panGesture) {
            const nextPan = {
                x: panGesture.startX + event.clientX - panGesture.startClientX,
                y: panGesture.startY + event.clientY - panGesture.startClientY,
            };
            setPan(nextPan);
            panRef.current = nextPan;
        }
    }, [scheduleNodeTransform, zoom]);

    const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLElement>) => {
        if (dragRef.current) {
            const drag = dragRef.current;
            dragRef.current = null;
            if (drag.hasMoved) commitPositions();
            window.setTimeout(() => { suppressClickRef.current = false; }, 0);
        }
        if (panRefState.current?.pointerId === event.pointerId) {
            panRefState.current = null;
        }
    }, [commitPositions]);

    const handleResourceClick = useCallback((resource: NavigationResource) => {
        if (suppressClickRef.current) return;
        onSelectResource(resource._id);
        if (mode === "connect") {
            if (!linkSourceId) {
                if (!canBeParent(resource)) return;
                setLinkSourceId(resource._id);
                return;
            }
            if (linkSourceId !== resource._id) onSetParent(linkSourceId, resource._id);
            setLinkSourceId(null);
        }
    }, [linkSourceId, mode, onSelectResource, onSetParent]);

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

const ResourceNode = memo(function ResourceNode({ nodeRef, resource, point, selected, linkSource, mode, onPointerDown, onClick }: {
    nodeRef: (element: HTMLDivElement | null) => void;
    resource: NavigationResource;
    point: Point;
    selected: boolean;
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
                shadow={selected || linkSource ? "2xl" : "lg"}
                border
                className={cx(
                    "relative bg-white/95 backdrop-blur transition-shadow dark:bg-neutral-900/95",
                    selected && "ring-2 ring-blue-500/80",
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
