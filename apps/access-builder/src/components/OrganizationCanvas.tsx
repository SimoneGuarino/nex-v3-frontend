import { memo, useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { FDBox } from "@nex/fd-ui";
import type { AccessGroup, GroupEdge, ObjectIdString } from "../model/types";

export type CanvasMode = "move" | "connect" | "delete-link" | "multi-select";

interface Props {
    groups: AccessGroup[];
    edges: GroupEdge[];
    selectedGroupId: ObjectIdString | null;
    mode: CanvasMode;
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
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
    hasMoved: boolean;
}

interface PendingPosition extends Point {
    id: string;
}

interface ConnectionPorts {
    start: Point;
    end: Point;
    controlA: Point;
    controlB: Point;
}

const fallbackNodeWidth = 270;
const fallbackNodeHeight = 118;
const connectorGap = 3;

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

function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
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

export function OrganizationCanvas({ groups, edges, selectedGroupId, mode, onSelectGroup, onCreateEdge, onDeleteEdge }: Props) {
    const [positions, setPositions] = useState<Record<string, Point>>({});
    const [nodeSizes, setNodeSizes] = useState<Record<string, { width: number; height: number }>>({});
    const [linkSourceId, setLinkSourceId] = useState<ObjectIdString | null>(null);
    const [multiSelectedIds, setMultiSelectedIds] = useState<Set<ObjectIdString>>(() => new Set());

    const positionsRef = useRef<Record<string, Point>>({});
    const nodeSizesRef = useRef<Record<string, { width: number; height: number }>>({});
    const dragRef = useRef<DragState | null>(null);
    const suppressClickRef = useRef(false);
    const captureTargetRef = useRef<HTMLButtonElement | null>(null);
    const pendingPositionRef = useRef<PendingPosition | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const nodeElementRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const pathElementRefs = useRef<Map<string, SVGPathElement>>(new Map());

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
        if (mode !== "connect") setLinkSourceId(null);
        if (mode !== "multi-select") setMultiSelectedIds(new Set());
    }, [mode]);

    useEffect(() => {
        return () => {
            if (animationFrameRef.current !== null) {
                window.cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    const canvasSize = useMemo(() => {
        const points = Object.values(positions);
        const maxX = Math.max(1400, ...points.map((point) => point.x + fallbackNodeWidth + 220));
        const maxY = Math.max(850, ...points.map((point) => point.y + fallbackNodeHeight + 220));
        return { width: maxX, height: maxY };
    }, [positions]);

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

    const applyNodePosition = useCallback((nextPosition: PendingPosition) => {
        positionsRef.current[nextPosition.id] = { x: nextPosition.x, y: nextPosition.y };
        const nodeElement = nodeElementRefs.current.get(nextPosition.id);
        if (nodeElement) {
            nodeElement.style.transform = `translate3d(${nextPosition.x}px, ${nextPosition.y}px, 0)`;
        }
        updateConnectedEdgePaths(nextPosition.id);
    }, [updateConnectedEdgePaths]);

    const scheduleDomPositionCommit = useCallback((nextPosition: PendingPosition) => {
        pendingPositionRef.current = nextPosition;

        if (animationFrameRef.current !== null) return;

        animationFrameRef.current = window.requestAnimationFrame(() => {
            const pending = pendingPositionRef.current;
            pendingPositionRef.current = null;
            animationFrameRef.current = null;

            if (!pending) return;
            applyNodePosition(pending);
        });
    }, [applyNodePosition]);

    const flushPendingPosition = useCallback(() => {
        const pending = pendingPositionRef.current;
        pendingPositionRef.current = null;

        if (animationFrameRef.current !== null) {
            window.cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        if (pending) applyNodePosition(pending);

        setPositions({ ...positionsRef.current });
    }, [applyNodePosition]);

    const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag) return;

        const deltaX = event.clientX - drag.startClientX;
        const deltaY = event.clientY - drag.startClientY;

        if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
            drag.hasMoved = true;
        }

        event.preventDefault();

        const nextX = Math.max(24, drag.startX + deltaX);
        const nextY = Math.max(24, drag.startY + deltaY);
        scheduleDomPositionCommit({ id: drag.id, x: nextX, y: nextY });
    };

    const stopDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (drag) {
            suppressClickRef.current = drag.hasMoved;
            try {
                captureTargetRef.current?.releasePointerCapture(event.pointerId);
            } catch {
                // Pointer capture can already be released by the browser.
            }
            window.setTimeout(() => {
                suppressClickRef.current = false;
            }, 0);
        }
        flushPendingPosition();
        dragRef.current = null;
        captureTargetRef.current = null;
    };

    const startDrag = (event: ReactPointerEvent<HTMLButtonElement>, group: AccessGroup) => {
        if (event.button !== 0 || mode !== "move") return;
        onSelectGroup(group._id);
        const point = positionsRef.current[group._id] ?? positions[group._id] ?? computeInitialPosition(group, 0, edges);
        dragRef.current = {
            id: group._id,
            startClientX: event.clientX,
            startClientY: event.clientY,
            startX: point.x,
            startY: point.y,
            hasMoved: false,
        };
        captureTargetRef.current = event.currentTarget;
        event.currentTarget.setPointerCapture(event.pointerId);
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

    const registerNodeElement = useCallback((groupId: ObjectIdString, element: HTMLDivElement | null) => {
        if (!element) {
            nodeElementRefs.current.delete(groupId);
            return;
        }

        nodeElementRefs.current.set(groupId, element);
        const width = element.offsetWidth || fallbackNodeWidth;
        const height = element.offsetHeight || fallbackNodeHeight;

        setNodeSizes((current) => {
            const existing = current[groupId];
            if (existing?.width === width && existing.height === height) return current;
            return { ...current, [groupId]: { width, height } };
        });
    }, []);

    const registerPathElement = useCallback((edgeId: ObjectIdString, element: SVGPathElement | null) => {
        if (!element) {
            pathElementRefs.current.delete(edgeId);
            return;
        }
        pathElementRefs.current.set(edgeId, element);
    }, []);

    const modeCopy = useMemo(() => {
        if (mode === "connect") return linkSourceId ? "Seleziona il gruppo di destinazione per creare il collegamento." : "Seleziona il gruppo sorgente da collegare.";
        if (mode === "delete-link") return "Clicca direttamente su una linea per rimuovere il collegamento.";
        if (mode === "multi-select") return `${multiSelectedIds.size} blocchi selezionati.`;
        return "Trascina i blocchi per organizzare visivamente gruppi, reparti e capability.";
    }, [linkSourceId, mode, multiSelectedIds.size]);

    return (
        <main className="absolute inset-0 overflow-hidden">
            <div
                className="h-full w-full overflow-auto [background-size:24px_24px]
                    bg-neutral-100 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.16)_1px,transparent_0)]
                    dark:bg-neutral-950 dark:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.09)_1px,transparent_0)]"
                onPointerMove={onPointerMove}
                onPointerUp={stopDrag}
                onPointerCancel={stopDrag}
            >
                <div className="relative" style={{ width: canvasSize.width, height: canvasSize.height }}>
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

                    <div className="opacity-50 pointer-events-none absolute left-6 top-6 z-10 max-w-sm rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-xl backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80">
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
            </div>
        </main>
    );
}

const GroupNode = memo(function GroupNode({ refCallback, group, point, selected, connectSource, multiSelected, mode, onPointerDown, onClick }: {
    refCallback: (groupId: ObjectIdString, element: HTMLDivElement | null) => void;
    group: AccessGroup;
    point: Point;
    selected: boolean;
    connectSource: boolean;
    multiSelected: boolean;
    mode: CanvasMode;
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>, group: AccessGroup) => void;
    onClick: (id: ObjectIdString) => void;
}) {
    const cursorClass = mode === "move" ? "cursor-grab active:cursor-grabbing" : mode === "connect" ? "cursor-crosshair" : mode === "multi-select" ? "cursor-cell" : "cursor-default";

    return (
        <div
            ref={(element) => refCallback(group._id, element)}
            className="absolute left-0 top-0 z-20 w-[270px] touch-none select-none will-change-transform"
            style={{ transform: `translate3d(${point.x}px, ${point.y}px, 0)` }}
        >
            <FDBox
                radius="2xl"
                shadow={selected || connectSource || multiSelected ? "2xl" : "lg"}
                border
                className={cx(
                    "bg-white/95 backdrop-blur transition-shadow dark:bg-neutral-900/95",
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
                            <span className="rounded-xl bg-neutral-100 px-2 py-1 dark:bg-neutral-800"><b className="block text-sm text-neutral-900 dark:text-neutral-100">{group.membersCount ?? 0}</b>Membri</span>
                            <span className="rounded-xl bg-neutral-100 px-2 py-1 dark:bg-neutral-800"><b className="block text-sm text-neutral-900 dark:text-neutral-100">{group.grantsCount ?? 0}</b>Grant</span>
                            <span className="rounded-xl bg-neutral-100 px-2 py-1 dark:bg-neutral-800"><b className="block text-sm text-neutral-900 dark:text-neutral-100">{group.inheritedGrantsCount ?? 0}</b>Ered.</span>
                        </span>
                    </span>
                </button>
            </FDBox>
        </div>
    );
});
