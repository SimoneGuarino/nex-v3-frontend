import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

/* ---------- type per tour-system - click fuori elemento ---------- */
export type CloseReason = "clickAway" | "escapeKeyDown" | "backdropClick" | "itemClick";

/* ---------- Utilities ---------- */
export function useClickOutside(
    refs: Array<React.RefObject<HTMLElement | null>>,
    //onClose: () => void
    onClose: (e?: any, reason?: CloseReason) => void
) {
    useEffect(() => {
        function handler(e: MouseEvent) {
            const target = e.target as Node;
            const clickedInsideAny = refs.some(r => r.current && r.current.contains(target));
            //if (!clickedInsideAny) onClose();
            if (!clickedInsideAny) onClose(undefined as any, "clickAway");
        }
        function onKey(e: KeyboardEvent) {
            //if (e.key === "Escape") onClose();
            if (e.key === "Escape") onClose(undefined as any, "escapeKeyDown");
        }
        document.addEventListener("mousedown", handler);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", handler);
            document.removeEventListener("keydown", onKey);
        };
    }, [refs, onClose]);
}

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

function isStart(p: Placement) {
    return p.endsWith("-start");
}
function isEnd(p: Placement) {
    return p.endsWith("-end");
}
function baseOf(p: Placement): PlacementBase | "auto" {
    if (p === "auto") return "auto";
    return (p.split("-")[0] as PlacementBase);
}

function transformOriginFor(placement: PlacementBase) {
    switch (placement) {
        case "top": return "bottom center";
        case "bottom": return "top center";
        case "left": return "center right";
        case "right": return "center left";
    }
}

/* ---------- Component ---------- */
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
    ...rest
}: {
    openFor: string | boolean | null;
    pos: React.RefObject<HTMLElement | null>;
    menuButtons?: {
        title: string;
        icon?: React.ReactNode;
        hide?: boolean;
        onClick?: () => void;
        childrenMenu?: { component: React.ReactNode }[];
        separator?: boolean;
        className?: string;
        action?: boolean;
        "data-tour"?: string;
    }[];
    panel?: React.ReactNode;
    //onClose: () => void;
    onClose: (e?: any, reason?: CloseReason) => void;
    placement?: Placement; // Posizionamento del menu
    offset?: number; // Distanza tra il menu e il suo attivatore
    viewportPadding?: number; // Padding interno del viewport
    portal?: boolean; // se true il menu viene renderizzato in un portale
    className?: string;
    style?: React.CSSProperties;
    stopMouseDownPropagation?: boolean; // se true, ferma la propagazione dell'evento mouseDown (utile per evitare chiusure indesiderate)
}) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const submenuRef = useRef<HTMLDivElement | null>(null);
    const [activeChildIndex, setActiveChildIndex] = useState<number | null>(null);
    const menuButtons_ = useMemo(() => {
        return menuButtons?.filter((button) => !button.hide) || [];
    }, [menuButtons]);

    // main menu computed position
    const [coords, setCoords] = useState<{ top: number; left: number; origin: string } | null>(null);
    const [submenuCoords, setSubmenuCoords] = useState<{ top: number; left: number; origin: string } | null>(null);

    useClickOutside([containerRef, submenuRef], (_e, reason?: CloseReason) => {
        onClose(undefined as any, reason);
        setActiveChildIndex(null);
    });

    const triggerRect = pos.current?.getBoundingClientRect() ?? null;

    const isOpen = Boolean(openFor) && Boolean(triggerRect);

    // Compute main menu position after it renders (so we know its size)
    useLayoutEffect(() => {
        if (!isOpen || !containerRef.current || !triggerRect) return;

        const el = containerRef.current;
        // Temporarily make it visible but not animated to measure
        const prevVis = el.style.visibility;
        const prevOp = el.style.opacity;
        el.style.visibility = "hidden";
        el.style.opacity = "0";
        // Force layout
        const rect = el.getBoundingClientRect();
        const menuW = rect.width || 160;
        const menuH = rect.height || 200;

        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Desired placement
        //const base = baseOf(placement);
        const want = (placement === "auto") ? autoChoosePlacement(triggerRect, menuW, menuH, vw, vh, offset) : (placement as Placement);

        let top = 0, left = 0;
        const baseDir = baseOf(want) as PlacementBase;

        if (baseDir === "bottom") {
            top = triggerRect.bottom + offset;
            if (isStart(want)) left = triggerRect.left;
            else if (isEnd(want)) left = triggerRect.right - menuW;
            else left = triggerRect.left + (triggerRect.width - menuW) / 2;
        } else if (baseDir === "top") {
            top = triggerRect.top - offset - menuH;
            if (isStart(want)) left = triggerRect.left;
            else if (isEnd(want)) left = triggerRect.right - menuW;
            else left = triggerRect.left + (triggerRect.width - menuW) / 2;
        } else if (baseDir === "right") {
            left = triggerRect.right + offset;
            if (isStart(want)) top = triggerRect.top;
            else if (isEnd(want)) top = triggerRect.bottom - menuH;
            else top = triggerRect.top + (triggerRect.height - menuH) / 2;
        } else if (baseDir === "left") {
            left = triggerRect.left - offset - menuW;
            if (isStart(want)) top = triggerRect.top;
            else if (isEnd(want)) top = triggerRect.bottom - menuH;
            else top = triggerRect.top + (triggerRect.height - menuH) / 2;
        }

        // Flip if overflow (horizontal/vertical)
        // Horizontal
        if (left < viewportPadding) left = viewportPadding;
        if (left + menuW > vw - viewportPadding) left = vw - viewportPadding - menuW;
        // Vertical
        if (top < viewportPadding) top = viewportPadding;
        if (top + menuH > vh - viewportPadding) top = vh - viewportPadding - menuH;

        el.style.visibility = prevVis;
        el.style.opacity = prevOp;

        setCoords({ top, left, origin: transformOriginFor(baseDir) });
        // re-run on open, window size changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, placement, offset, viewportPadding]);

    // Recompute on resize/scroll while open
    useEffect(() => {
        if (!isOpen) return;
        const onWin = () => {
            setCoords(null); // force re-measure next frame
            requestAnimationFrame(() => setCoords((c) => c)); // noop to trigger effect
        };
        window.addEventListener("resize", onWin, { passive: true });
        window.addEventListener("scroll", onWin, { passive: true });
        return () => {
            window.removeEventListener("resize", onWin);
            window.removeEventListener("scroll", onWin);
        };
    }, [isOpen]);

    // Compute submenu position when it opens/changes
    useLayoutEffect(() => {
        if (!isOpen || activeChildIndex === null) {
            setSubmenuCoords(null);
            return;
        }
        const cont = containerRef.current;
        const item = itemRefs.current[activeChildIndex];
        if (!cont || !item) return;

        const contRect = cont.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // 1) monta il contenitore submenu invisibile per misurarlo
        const el = submenuRef.current;
        if (!el) return;

        // mettiamolo off-screen per evitare flicker ma permettere misurazione
        const prevVis = el.style.visibility;
        const prevTop = el.style.top;
        const prevLeft = el.style.left;
        el.style.visibility = "hidden";
        el.style.top = "-9999px";
        el.style.left = "-9999px";

        // forza layout e misura
        const rect = el.getBoundingClientRect();
        const menuW = Math.max(rect.width, 220); // salvaguardia minWidth
        const menuH = rect.height || 1;

        // 2) prova a destra
        let left = contRect.right + 8;
        let top = itemRect.top;

        // se non c’è spazio a destra → flip a sinistra
        const preferLeft = left + menuW > vw - viewportPadding;
        if (preferLeft) left = contRect.left - 8 - menuW;

        // clamp verticale
        const maxTop = vh - viewportPadding - menuH;
        top = Math.min(Math.max(top, viewportPadding), Math.max(viewportPadding, maxTop));

        // ripristina visibilità
        el.style.visibility = prevVis;
        el.style.top = prevTop;
        el.style.left = prevLeft;

        setSubmenuCoords({
            top,
            left,
            origin: preferLeft ? "center right" : "center left",
        });
    }, [isOpen, activeChildIndex, viewportPadding]);


    // Max heights for scrollable content
    const maxHeights = useMemo(() => {
        const maxMain = typeof window === "undefined" ? 400 : (window.innerHeight - viewportPadding * 2);
        const maxSub = typeof window === "undefined" ? 360 : (window.innerHeight - viewportPadding * 2);
        return { maxMain, maxSub };
    }, [viewportPadding]);

    if (!isOpen) return null;

    // Main menu node
    const menuNode = (
        <AnimatePresence>
            <motion.div
                key="ctx"
                layout
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.6 }}
                ref={containerRef}
                role="menu"
                className={[
                    "fixed z-[1500] rounded-lg shadow-lg",
                    "bg-[#161616] text-white",
                    "border border-[#2a2a2a]",
                    "p-1",
                    "will-change-transform",
                    "select-none",
                    "max-w-[min(92vw,540px)]", //380px
                    panel ? "" : "overflow-y-auto overflow-hidden",
                    className,
                    "max-h-[90%]"
                ].join(" ")}
                style={{
                    top: coords?.top ?? -9999,
                    left: coords?.left ?? -9999,
                    transformOrigin: coords?.origin ?? "top left",
                    maxHeight: maxHeights.maxMain,
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
                {/* Main items */}
                {panel ? (
                    <div className="p-2">{panel}</div>
                ) : menuButtons_?.map((button, idx) => (
                    <React.Fragment key={idx}>
                        <motion.button
                            ref={(el) => { itemRefs.current[idx] = el; }}
                            whileTap={{ scale: 0.96, transition: { duration: 0.06 } }}
                            className={[
                                button.className,
                                "flex items-center gap-2 w-full text-left text-sm",
                                "px-3 py-2 rounded-md",
                                (button.action == undefined || button.action) &&
                                "hover:bg-[#2e2e2e] focus:bg-[#2e2e2e] focus:outline-none cursor-pointer",
                            ].join(" ")}
                            role="menuitem"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (button.childrenMenu?.length) {
                                    setActiveChildIndex((prev) => (prev === idx ? null : idx));
                                } else {
                                    setActiveChildIndex(null);
                                    //onClose();
                                    onClose(undefined as any, "itemClick");
                                }
                                button.onClick?.();
                            }}
                            {...(button["data-tour"] ? { "data-tour": button["data-tour"] } : {})}
                        >
                            {button.icon}
                            <span className="truncate text-inherit">{button.title}</span>
                        </motion.button>

                        {button.separator && <div className="my-1 border-t border-[#353535]" />}
                    </React.Fragment>
                ))}

                {/* Submenu */}
                {!panel && createPortal(
                    <AnimatePresence>
                        {isOpen &&
                            activeChildIndex !== null &&
                            menuButtons_?.[activeChildIndex]?.childrenMenu?.length ? (
                            <motion.div
                                key="submenu"
                                ref={submenuRef}
                                layout
                                initial={{ scale: 0.96, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.96, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.6 }}
                                role="menu"
                                className={[
                                    "fixed z-[1001] rounded-lg shadow-lg",
                                    "bg-[#161616] text-white",
                                    "border border-[#2a2a2a]",
                                    "p-2",
                                    "overflow-y-auto",
                                    "max-h-[90%]"
                                ].join(" ")}
                                style={{
                                    top: submenuCoords?.top ?? -9999,
                                    left: submenuCoords?.left ?? -9999,
                                    transformOrigin: submenuCoords?.origin ?? "left center",
                                    maxHeight: (typeof window === "undefined" ? 360 : window.innerHeight - viewportPadding * 2),
                                    minWidth: 220,
                                }}
                            >
                                {menuButtons_![activeChildIndex]!.childrenMenu!.map((child, cidx) => (
                                    <div key={cidx} className="mb-1 last:mb-0">
                                        {child.component}
                                    </div>
                                ))}
                            </motion.div>
                        ) : null}
                    </AnimatePresence>,
                    document.body
                )}
            </motion.div>
        </AnimatePresence>
    );

    return portal ? createPortal(menuNode, document.body) : menuNode;
}

/* ---------- Helpers ---------- */

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
    //const spaceLeft = trigger.left;
    //const spaceRight = vw - trigger.right;

    // Prefer vertical expansion near the trigger
    if (spaceBottom >= menuH + offset || spaceBottom >= spaceTop) {
        // bottom preferred
        // decide horizontal alignment
        const fitsStart = trigger.left + menuW <= vw;
        const fitsEnd = trigger.right - menuW >= 0;
        if (fitsStart) return "bottom-start";
        if (fitsEnd) return "bottom-end";
        return "bottom";
    } else {
        // top preferred
        const fitsStart = trigger.left + menuW <= vw;
        const fitsEnd = trigger.right - menuW >= 0;
        if (fitsStart) return "top-start";
        if (fitsEnd) return "top-end";
        return "top";
    }

    // se il verticale è impossibile (molto raro), si potrebbe tornare a sinistra/destra confrontando spaceLeft/spaceRight.
}

export default ContextMenu;