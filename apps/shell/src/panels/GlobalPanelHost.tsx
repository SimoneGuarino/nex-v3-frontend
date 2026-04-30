import React, { useMemo } from "react";
import {
    closeGlobalPanel,
    type NexGlobalPanelId,
    type NexPanelAnchorRect,
    type NexPanelPlacement,
} from "@nex/shared-platform";
import { FDBackdrop, FDBox } from "@nex/fd-ui";
import { useGlobalPanels } from "../hooks/useGlobalPanels";
import ChatPanel from "./components/ChatPanel";
import NotificationsPanel from "./components/NotificationsPanel";
import ProfilePanel from "./components/ProfilePanel";

const VIEWPORT_PADDING = 16;

type PanelMetrics = {
    popoverWidth: number;
    popoverHeight: number;
    drawerWidth: number;
};

const PANEL_METRICS: Record<NexGlobalPanelId, PanelMetrics> = {
    notifications: {
        popoverWidth: 560,
        popoverHeight: 760,
        drawerWidth: 560,
    },
    chat: {
        popoverWidth: 420,
        popoverHeight: 680,
        drawerWidth: 460,
    },
    profile: {
        popoverWidth: 360,
        popoverHeight: 560,
        drawerWidth: 380,
    },
};

type PositionedStyle = React.CSSProperties;

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(value, max));
}

function getViewportAwareMetrics(panelId: NexGlobalPanelId): PanelMetrics {
    const base = PANEL_METRICS[panelId];

    if (typeof window === "undefined") {
        return base;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const compactMobile = viewportWidth < 640;

    return {
        popoverWidth: Math.min(base.popoverWidth, compactMobile ? viewportWidth - 12 : viewportWidth - VIEWPORT_PADDING * 2),
        popoverHeight: Math.min(base.popoverHeight, viewportHeight - (compactMobile ? 12 : VIEWPORT_PADDING * 2)),
        drawerWidth: Math.min(base.drawerWidth, viewportWidth),
    };
}

function getPopoverPosition(
    panelId: NexGlobalPanelId,
    anchorRect: NexPanelAnchorRect | null,
    placement: NexPanelPlacement,
    offset: number,
): PositionedStyle {
    const metrics = getViewportAwareMetrics(panelId);

    if (typeof window === "undefined") {
        return {
            top: VIEWPORT_PADDING,
            right: VIEWPORT_PADDING,
            width: metrics.popoverWidth,
            height: metrics.popoverHeight,
        };
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const popoverWidth = metrics.popoverWidth;
    const popoverHeight = metrics.popoverHeight;

    if (!anchorRect) {
        return {
            top: VIEWPORT_PADDING,
            right: VIEWPORT_PADDING,
            width: popoverWidth,
            height: popoverHeight,
        };
    }

    let left = anchorRect.right - popoverWidth;
    let top = anchorRect.bottom + offset;

    switch (placement) {
        case "bottom-start":
            left = anchorRect.left;
            top = anchorRect.bottom + offset;
            break;
        case "bottom-end":
            left = anchorRect.right - popoverWidth;
            top = anchorRect.bottom + offset;
            break;
        case "top-start":
            left = anchorRect.left;
            top = anchorRect.top - popoverHeight - offset;
            break;
        case "top-end":
            left = anchorRect.right - popoverWidth;
            top = anchorRect.top - popoverHeight - offset;
            break;
        case "right-start":
            left = anchorRect.right + offset;
            top = anchorRect.top;
            break;
        case "left-start":
            left = anchorRect.left - popoverWidth - offset;
            top = anchorRect.top;
            break;
        default:
            break;
    }

    left = clamp(left, VIEWPORT_PADDING, viewportWidth - popoverWidth - VIEWPORT_PADDING);
    top = clamp(top, VIEWPORT_PADDING, viewportHeight - popoverHeight - VIEWPORT_PADDING);

    return {
        position: "fixed",
        left,
        top,
        width: popoverWidth,
        height: popoverHeight,
    };
}

function getContainerStyle(
    panelId: NexGlobalPanelId,
    placement: NexPanelPlacement,
    anchorRect: NexPanelAnchorRect | null,
    offset: number,
): PositionedStyle {
    const metrics = getViewportAwareMetrics(panelId);

    if (placement === "drawer-right") {
        return {
            position: "fixed",
            top: 0,
            right: 0,
            width: `min(${metrics.drawerWidth}px, 100vw)`,
            height: "100vh",
        };
    }

    if (placement === "drawer-left") {
        return {
            position: "fixed",
            top: 0,
            left: 0,
            width: `min(${metrics.drawerWidth}px, 100vw)`,
            height: "100vh",
        };
    }

    if (placement === "center") {
        return {
            position: "fixed",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: `min(${metrics.popoverWidth}px, calc(100vw - ${VIEWPORT_PADDING * 2}px))`,
            height: `min(${metrics.popoverHeight}px, calc(100vh - ${VIEWPORT_PADDING * 2}px))`,
        };
    }

    return getPopoverPosition(panelId, anchorRect, placement, offset);
};

function Overlay({
    children,
    modal,
    placement,
}: {
    children: React.ReactNode;
    modal: boolean;
    placement: NexPanelPlacement;
}) {
    const align = placement === "drawer-left" ? "justify-start" : placement === "center" ? "justify-center" : "justify-end";
    const items = placement === "center" ? "items-center" : "items-stretch";

    return (
        <div className={`fixed inset-0 z-40 flex ${align} ${items}`}>
            {modal ? <FDBackdrop onClick={() => closeGlobalPanel("overlay")} /> : null}
            {!modal ? <div role="presentation" className="absolute inset-0" onClick={() => closeGlobalPanel("overlay")} /> : null}
            <div className="relative z-50 flex min-h-0 min-w-0">{children}</div>
        </div>
    );
};

function PanelSurface({
    panelId,
    children,
    placement,
    anchorRect,
    offset,
    modal,
}: {
    panelId: NexGlobalPanelId;
    children: React.ReactNode;
    placement: NexPanelPlacement;
    anchorRect: NexPanelAnchorRect | null;
    offset: number;
    modal: boolean;
}) {
    const style = useMemo(() => getContainerStyle(panelId, placement, anchorRect, offset), [panelId, placement, anchorRect, offset]);
    const drawer = placement === "drawer-right" || placement === "drawer-left";

    return (
        <FDBox
            role="dialog"
            aria-modal={modal}
            onClick={(event) => event.stopPropagation()}
            style={style}
            variant="solid"
            color="light"
            shadow={drawer ? "2xl" : "xl"}
            radius={drawer ? "none" : "2xl"}
            pad="none"
            className={[
                "flex min-h-0 flex-col overflow-hidden",
                "border border-neutral-200 dark:border-neutral-800",
                drawer ? "!border-y-0" : "",
                placement === "drawer-right" ? "!border-r-0 !rounded-r-none" : "",
                placement === "drawer-left" ? "!border-l-0 !rounded-l-none" : "",
            ].join(" ")}
        >
            {children}
        </FDBox>
    );
};

export default function GlobalPanelHost() {
    const { openPanel, placement, anchorRect, offset, modal } = useGlobalPanels();

    if (!openPanel) return null;

    return (
        <Overlay modal={modal} placement={placement}>
            <PanelSurface panelId={openPanel} placement={placement} anchorRect={anchorRect} offset={offset} modal={modal}>
                {openPanel === "notifications" ? <NotificationsPanel /> : null}
                {openPanel === "chat" ? <ChatPanel /> : null}
                {openPanel === "profile" ? <ProfilePanel /> : null}
            </PanelSurface>
        </Overlay>
    );
};