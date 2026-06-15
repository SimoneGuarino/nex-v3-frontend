import React, {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { createPortal } from "react-dom";

export type CloseReason =
    | "clickAway"
    | "escapeKeyDown"
    | "backdropClick"
    | "itemClick";

type PlacementBase = "top" | "bottom" | "left" | "right";
type Placement =
    | "auto"
    | PlacementBase
    | "top-start"
    | "top-end"
    | "bottom-start"
    | "bottom-end"
    | "left-start"
    | "left-end"
    | "right-start"
    | "right-end";

type MenuButton = {
    title: string;
    icon?: React.ReactNode;
    hide?: boolean;
    disabled?: boolean;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    childrenMenu?: { component: React.ReactNode }[];
    separator?: boolean;
    className?: string;
    action?: boolean;
    "data-tour"?: string;
};

type Coords = {
    top: number;
    left: number;
    origin: string;
};

type ContextMenuOwnProps = {
    openFor: string | boolean | null;
    pos: React.RefObject<HTMLElement | null>;
    menuButtons?: MenuButton[];
    panel?: React.ReactNode;
    onClose: (e?: any, reason?: CloseReason) => void;
    placement?: Placement;
    offset?: number;
    viewportPadding?: number;
    portal?: boolean;
    stopMouseDownPropagation?: boolean;
    repositionOnScroll?: boolean;
    closeOnResize?: boolean;
    ignoreOutsideClickSelectors?: string[];
};

type ContextMenuProps = ContextMenuOwnProps &
    Omit<
        HTMLMotionProps<"div">,
        | "children"
        | "ref"
        | "style"
        | "className"
        | "role"
    > & {
        className?: string;
        style?: React.CSSProperties;
    };

const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect;

function useEvent<T extends (...args: any[]) => any>(handler: T): T {
    const handlerRef = useRef(handler);

    useIsomorphicLayoutEffect(() => {
        handlerRef.current = handler;
    }, [handler]);

    return useCallback(((...args: any[]) => handlerRef.current(...args)) as T, []);
}

function isStart(p: Placement) {
    return p.endsWith("-start");
}

function isEnd(p: Placement) {
    return p.endsWith("-end");
}

function baseOf(p: Placement): PlacementBase | "auto" {
    if (p === "auto") return "auto";
    return p.split("-")[0] as PlacementBase;
}

function transformOriginFor(base: PlacementBase) {
    switch (base) {
        case "top":
            return "bottom center";
        case "bottom":
            return "top center";
        case "left":
            return "center right";
        case "right":
            return "center left";
        default:
            return "top left";
    }
}

function areCoordsEqual(a: Coords | null, b: Coords | null) {
    if (a === b) return true;
    if (!a || !b) return false;
    return a.top === b.top && a.left === b.left && a.origin === b.origin;
}

function getViewportSize() {
    if (typeof window === "undefined") {
        return { width: 0, height: 0 };
    }

    const vv = window.visualViewport;
    return {
        width: Math.round(vv?.width ?? window.innerWidth),
        height: Math.round(vv?.height ?? window.innerHeight),
    };
}

function autoChoosePlacement(
    trigger: DOMRect,
    menuW: number,
    menuH: number,
    vw: number,
    vh: number,
    offset: number
): Placement {
    const spaceTop = trigger.top;
    const spaceBottom = vh - trigger.bottom;
    const spaceLeft = trigger.left;
    const spaceRight = vw - trigger.right;

    const verticalPreferred =
        spaceBottom >= menuH + offset || spaceBottom >= spaceTop;

    if (verticalPreferred) {
        const fitsStart = trigger.left + menuW <= vw;
        const fitsEnd = trigger.right - menuW >= 0;
        if (fitsStart) return "bottom-start";
        if (fitsEnd) return "bottom-end";
        return "bottom";
    }

    if (spaceTop >= menuH + offset) {
        const fitsStart = trigger.left + menuW <= vw;
        const fitsEnd = trigger.right - menuW >= 0;
        if (fitsStart) return "top-start";
        if (fitsEnd) return "top-end";
        return "top";
    }

    if (spaceRight >= menuW + offset || spaceRight >= spaceLeft) {
        return "right-start";
    }

    return "left-start";
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function computeMainPosition(params: {
    triggerRect: DOMRect;
    menuRect: DOMRect;
    placement: Placement;
    offset: number;
    viewportPadding: number;
    viewportWidth: number;
    viewportHeight: number;
}): Coords {
    const {
        triggerRect,
        menuRect,
        placement,
        offset,
        viewportPadding,
        viewportWidth,
        viewportHeight,
    } = params;

    const menuW = menuRect.width || 160;
    const menuH = menuRect.height || 200;

    const desiredPlacement =
        placement === "auto"
            ? autoChoosePlacement(
                triggerRect,
                menuW,
                menuH,
                viewportWidth,
                viewportHeight,
                offset
            )
            : placement;

    const baseDir = baseOf(desiredPlacement) as PlacementBase;

    let top = 0;
    let left = 0;

    if (baseDir === "bottom") {
        top = triggerRect.bottom + offset;

        if (isStart(desiredPlacement)) {
            left = triggerRect.left;
        } else if (isEnd(desiredPlacement)) {
            left = triggerRect.right - menuW;
        } else {
            left = triggerRect.left + (triggerRect.width - menuW) / 2;
        }
    } else if (baseDir === "top") {
        top = triggerRect.top - menuH - offset;

        if (isStart(desiredPlacement)) {
            left = triggerRect.left;
        } else if (isEnd(desiredPlacement)) {
            left = triggerRect.right - menuW;
        } else {
            left = triggerRect.left + (triggerRect.width - menuW) / 2;
        }
    } else if (baseDir === "right") {
        left = triggerRect.right + offset;

        if (isStart(desiredPlacement)) {
            top = triggerRect.top;
        } else if (isEnd(desiredPlacement)) {
            top = triggerRect.bottom - menuH;
        } else {
            top = triggerRect.top + (triggerRect.height - menuH) / 2;
        }
    } else {
        left = triggerRect.left - menuW - offset;

        if (isStart(desiredPlacement)) {
            top = triggerRect.top;
        } else if (isEnd(desiredPlacement)) {
            top = triggerRect.bottom - menuH;
        } else {
            top = triggerRect.top + (triggerRect.height - menuH) / 2;
        }
    }

    left = clamp(left, viewportPadding, viewportWidth - viewportPadding - menuW);
    top = clamp(top, viewportPadding, viewportHeight - viewportPadding - menuH);

    return {
        top,
        left,
        origin: transformOriginFor(baseDir),
    };
}

function computeSubmenuPosition(params: {
    containerRect: DOMRect;
    itemRect: DOMRect;
    submenuRect: DOMRect;
    viewportPadding: number;
    viewportWidth: number;
    viewportHeight: number;
    gap?: number;
}): Coords {
    const {
        containerRect,
        itemRect,
        submenuRect,
        viewportPadding,
        viewportWidth,
        viewportHeight,
        gap = 8,
    } = params;

    const submenuW = Math.max(submenuRect.width || 0, 220);
    const submenuH = submenuRect.height || 1;

    let left = containerRect.right + gap;
    let top = itemRect.top;

    const shouldFlipLeft = left + submenuW > viewportWidth - viewportPadding;

    if (shouldFlipLeft) {
        left = containerRect.left - gap - submenuW;
    }

    top = clamp(
        top,
        viewportPadding,
        Math.max(viewportPadding, viewportHeight - viewportPadding - submenuH)
    );

    return {
        top,
        left,
        origin: shouldFlipLeft ? "center right" : "center left",
    };
}

function useClickOutside(params: {
    enabled: boolean;
    refs: Array<React.RefObject<HTMLElement | null>>;
    onClose: (e?: any, reason?: CloseReason) => void;
    ignoreSelectors?: string[];
}) {
    const { enabled, refs, onClose, ignoreSelectors = [] } = params;
    const onCloseEvent = useEvent(onClose);

    useEffect(() => {
        if (!enabled) return;

        const handlePointerDown = (e: MouseEvent | PointerEvent) => {
            const target = e.target as Node | null;
            if (!target) return;

            const clickedInsideKnownRefs = refs.some((r) =>
                r.current?.contains(target)
            );

            if (clickedInsideKnownRefs) return;

            if (target instanceof Element && ignoreSelectors.length > 0) {
                const matchedIgnoredArea = ignoreSelectors.some((selector) =>
                    target.closest(selector)
                );

                if (matchedIgnoredArea) return;
            }

            onCloseEvent(undefined, "clickAway");
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onCloseEvent(undefined, "escapeKeyDown");
            }
        };

        document.addEventListener("mousedown", handlePointerDown, true);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handlePointerDown, true);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [enabled, refs, ignoreSelectors, onCloseEvent]);
}

export function ContextMenu({
    openFor,
    pos,
    menuButtons,
    panel,
    onClose,
    placement = "auto",
    offset = 8,
    viewportPadding = 8,
    portal = true,
    className = "",
    style,
    stopMouseDownPropagation = false,
    repositionOnScroll = false,
    closeOnResize = false,
    ignoreOutsideClickSelectors = ['[data-fd-select-portal="true"]'],
    ...rest
}: ContextMenuProps & React.HTMLAttributes<HTMLDivElement>) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const submenuRef = useRef<HTMLDivElement | null>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const rafRef = useRef<number | null>(null);
    const lastCoordsRef = useRef<Coords | null>(null);
    const lastSubmenuCoordsRef = useRef<Coords | null>(null);

    const [coords, setCoords] = useState<Coords | null>(null);
    const [submenuCoords, setSubmenuCoords] = useState<Coords | null>(null);
    const [activeChildIndex, setActiveChildIndex] = useState<number | null>(null);

    const isOpen = Boolean(openFor);
    const buttons = useMemo(
        () => (menuButtons ?? []).filter((btn) => !btn.hide),
        [menuButtons]
    );

    const onCloseEvent = useEvent(onClose);

    useClickOutside({
        enabled: isOpen,
        refs: [containerRef, submenuRef],
        ignoreSelectors: ignoreOutsideClickSelectors,
        onClose: (_e, reason) => {
            setActiveChildIndex(null);
            onCloseEvent(undefined, reason);
        },
    });

    const scheduleMainPositionCompute = useEvent(() => {
        if (!isOpen) return;
        if (!pos.current || !containerRef.current) return;

        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
        }

        rafRef.current = requestAnimationFrame(() => {
            const trigger = pos.current;
            const menuEl = containerRef.current;
            if (!trigger || !menuEl) return;

            const { width: viewportWidth, height: viewportHeight } = getViewportSize();

            const triggerRect = trigger.getBoundingClientRect();

            const previousVisibility = menuEl.style.visibility;
            const previousPointerEvents = menuEl.style.pointerEvents;

            menuEl.style.visibility = "hidden";
            menuEl.style.pointerEvents = "none";

            const menuRect = menuEl.getBoundingClientRect();

            const nextCoords = computeMainPosition({
                triggerRect,
                menuRect,
                placement,
                offset,
                viewportPadding,
                viewportWidth,
                viewportHeight,
            });

            menuEl.style.visibility = previousVisibility;
            menuEl.style.pointerEvents = previousPointerEvents;

            if (!areCoordsEqual(lastCoordsRef.current, nextCoords)) {
                lastCoordsRef.current = nextCoords;
                setCoords(nextCoords);
            }
        });
    });

    const scheduleSubmenuPositionCompute = useEvent(() => {
        if (!isOpen) return;
        if (activeChildIndex === null) return;
        if (!containerRef.current || !submenuRef.current) return;

        const item = itemRefs.current[activeChildIndex];
        if (!item) return;

        requestAnimationFrame(() => {
            const containerEl = containerRef.current;
            const submenuEl = submenuRef.current;
            const itemEl = itemRefs.current[activeChildIndex];

            if (!containerEl || !submenuEl || !itemEl) return;

            const { width: viewportWidth, height: viewportHeight } = getViewportSize();

            const previousVisibility = submenuEl.style.visibility;
            const previousTop = submenuEl.style.top;
            const previousLeft = submenuEl.style.left;
            const previousPointerEvents = submenuEl.style.pointerEvents;

            submenuEl.style.visibility = "hidden";
            submenuEl.style.pointerEvents = "none";
            submenuEl.style.top = "-9999px";
            submenuEl.style.left = "-9999px";

            const nextCoords = computeSubmenuPosition({
                containerRect: containerEl.getBoundingClientRect(),
                itemRect: itemEl.getBoundingClientRect(),
                submenuRect: submenuEl.getBoundingClientRect(),
                viewportPadding,
                viewportWidth,
                viewportHeight,
            });

            submenuEl.style.visibility = previousVisibility;
            submenuEl.style.pointerEvents = previousPointerEvents;
            submenuEl.style.top = previousTop;
            submenuEl.style.left = previousLeft;

            if (!areCoordsEqual(lastSubmenuCoordsRef.current, nextCoords)) {
                lastSubmenuCoordsRef.current = nextCoords;
                setSubmenuCoords(nextCoords);
            }
        });
    });

    useIsomorphicLayoutEffect(() => {
        if (!isOpen) {
            setCoords(null);
            setSubmenuCoords(null);
            setActiveChildIndex(null);
            lastCoordsRef.current = null;
            lastSubmenuCoordsRef.current = null;
            return;
        }

        scheduleMainPositionCompute();
    }, [isOpen, scheduleMainPositionCompute, panel, buttons.length]);

    useEffect(() => {
        if (!isOpen) return;
        if (!containerRef.current) return;

        const menuEl = containerRef.current;
        const triggerEl = pos.current;

        const resizeHandler = () => {
            if (closeOnResize) {
                setActiveChildIndex(null);
                onCloseEvent(undefined, "backdropClick");
                return;
            }
            scheduleMainPositionCompute();
            if (activeChildIndex !== null) {
                scheduleSubmenuPositionCompute();
            }
        };

        const scrollHandler = () => {
            if (!repositionOnScroll) return;
            scheduleMainPositionCompute();
            if (activeChildIndex !== null) {
                scheduleSubmenuPositionCompute();
            }
        };

        const resizeObserver = new ResizeObserver(() => {
            scheduleMainPositionCompute();
            if (activeChildIndex !== null) {
                scheduleSubmenuPositionCompute();
            }
        });

        resizeObserver.observe(menuEl);
        if (triggerEl) resizeObserver.observe(triggerEl);

        window.addEventListener("resize", resizeHandler, { passive: true });

        if (repositionOnScroll) {
            window.addEventListener("scroll", scrollHandler, { passive: true });
        }

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("resize", resizeHandler);

            if (repositionOnScroll) {
                window.removeEventListener("scroll", scrollHandler);
            }
        };
    }, [
        isOpen,
        pos,
        repositionOnScroll,
        closeOnResize,
        activeChildIndex,
        scheduleMainPositionCompute,
        scheduleSubmenuPositionCompute,
        onCloseEvent,
    ]);

    useIsomorphicLayoutEffect(() => {
        if (!isOpen || activeChildIndex === null) {
            setSubmenuCoords(null);
            lastSubmenuCoordsRef.current = null;
            return;
        }

        scheduleSubmenuPositionCompute();
    }, [isOpen, activeChildIndex, scheduleSubmenuPositionCompute]);

    useEffect(() => {
        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

    if (!isOpen) return null;

    const maxHeight =
        typeof window === "undefined"
            ? 400
            : Math.max(240, getViewportSize().height - viewportPadding * 2);

    const menuNode = (
        <AnimatePresence>
            <motion.div
                key="context-menu"
                ref={containerRef}
                role="menu"
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.55 }}
                className={[
                    "fixed z-[1500] rounded-lg shadow-lg",
                    "bg-[#161616] text-white border border-[#2a2a2a]",
                    "select-none will-change-transform",
                    "max-w-[min(92vw,540px)]",
                    panel ? "" : "overflow-y-auto overflow-x-hidden",
                    className,
                ].join(" ")}
                style={{
                    top: coords?.top ?? -9999,
                    left: coords?.left ?? -9999,
                    transformOrigin: coords?.origin ?? "top left",
                    maxHeight,
                    ...(panel ? { overflow: "hidden" } : null),
                    ...style,
                }}
                onMouseDownCapture={(e) => {
                    if (stopMouseDownPropagation) e.stopPropagation();
                }}
                onPointerDownCapture={(e) => {
                    if (stopMouseDownPropagation) e.stopPropagation();
                }}
                {...rest}
            >
                {panel ? (
                    <div className="p-2">{panel}</div>
                ) : (
                    <div className="p-1">
                        {buttons.map((button, idx) => (
                            <React.Fragment
                                key={`${button.title}-${idx}`}
                            >
                                <motion.button
                                    ref={(el) => {
                                        itemRefs.current[idx] = el;
                                    }}
                                    whileTap={{ scale: 0.98, transition: { duration: 0.06 } }}
                                    role="menuitem"
                                    disabled={button.disabled}
                                    className={[
                                        button.className,
                                        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm",
                                        button.disabled
                                            ? "cursor-not-allowed opacity-55"
                                            : button.action === undefined || button.action
                                                ? "cursor-pointer hover:bg-[#2e2e2e] focus:bg-[#2e2e2e] focus:outline-none"
                                                : "",
                                    ].join(" ")}
                                    onClick={(e) => {
                                        e.stopPropagation();

                                        if (button.disabled) return;

                                        if (button.childrenMenu?.length) {
                                            setActiveChildIndex((prev) =>
                                                prev === idx ? null : idx
                                            );
                                        } else {
                                            setActiveChildIndex(null);
                                            button.onClick?.(e);
                                            onCloseEvent(undefined, "itemClick");
                                            return;
                                        }

                                        button.onClick?.(e);

                                    }}
                                    {...(button["data-tour"]
                                        ? { "data-tour": button["data-tour"] }
                                        : {})}
                                >
                                    {button.icon}
                                    {button.title && <span className="truncate text-inherit">
                                        {button.title}
                                    </span>}
                                </motion.button>

                                {button.separator && (
                                    <div className="my-1 border-t border-[#353535]" />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                )}

                {!panel &&
                    activeChildIndex !== null &&
                    buttons[activeChildIndex]?.childrenMenu?.length &&
                    createPortal(
                        <AnimatePresence>
                            <motion.div
                                key="context-submenu"
                                ref={submenuRef}
                                role="menu"
                                initial={{ scale: 0.98, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.98, opacity: 0 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 420,
                                    damping: 32,
                                    mass: 0.55,
                                }}
                                className="fixed z-[1501] rounded-lg border border-[#2a2a2a] bg-[#161616] p-2 text-white shadow-lg overflow-y-auto"
                                style={{
                                    top: submenuCoords?.top ?? -9999,
                                    left: submenuCoords?.left ?? -9999,
                                    transformOrigin:
                                        submenuCoords?.origin ?? "left center",
                                    maxHeight,
                                    minWidth: 220,
                                }}
                            >
                                {buttons[activeChildIndex].childrenMenu!.map(
                                    (child, childIndex) => (
                                        <div
                                            key={`submenu-item-${childIndex}`}
                                            className="mb-1 last:mb-0"
                                        >
                                            {child.component}
                                        </div>
                                    )
                                )}
                            </motion.div>
                        </AnimatePresence>,
                        document.body
                    )}
            </motion.div>
        </AnimatePresence>
    );

    return portal ? createPortal(menuNode, document.body) : menuNode;
}

export default ContextMenu;