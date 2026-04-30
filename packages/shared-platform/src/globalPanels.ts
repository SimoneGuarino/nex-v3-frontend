export type NexGlobalPanelId = "chat" | "notifications" | "profile";

export type NexPanelPlacement =
  | "bottom-end"
  | "bottom-start"
  | "top-end"
  | "top-start"
  | "right-start"
  | "left-start"
  | "drawer-right"
  | "drawer-left"
  | "center";

export type NexPanelAnchorRect = {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
};

export type NexGlobalPanelOpenOptions = {
  source?: string;
  placement?: NexPanelPlacement;
  anchorRect?: NexPanelAnchorRect | null;
  offset?: number;
  modal?: boolean;
};

export type NexGlobalPanelState = {
  openPanel: NexGlobalPanelId | null;
  updatedAt: number;
  source?: string;
  placement: NexPanelPlacement;
  anchorRect: NexPanelAnchorRect | null;
  offset: number;
  modal: boolean;
};

type Listener = (state: NexGlobalPanelState) => void;

type Registry = {
  state: NexGlobalPanelState;
  listeners: Set<Listener>;
};

declare global {
  interface Window {
    __NEX_GLOBAL_PANELS__?: Registry;
  }
}

const initialState: NexGlobalPanelState = {
  openPanel: null,
  updatedAt: 0,
  placement: "drawer-right",
  anchorRect: null,
  offset: 12,
  modal: true,
};

function getRegistry(): Registry {
  if (typeof window === "undefined") {
    return { state: initialState, listeners: new Set() };
  }

  if (!window.__NEX_GLOBAL_PANELS__) {
    window.__NEX_GLOBAL_PANELS__ = {
      state: initialState,
      listeners: new Set(),
    };
  }

  return window.__NEX_GLOBAL_PANELS__;
}

function emit(state: NexGlobalPanelState): void {
  const registry = getRegistry();
  registry.listeners.forEach((listener) => listener(state));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("nex:global-panel", { detail: state }));
  }
}

function patch(partial: Partial<NexGlobalPanelState>): NexGlobalPanelState {
  const registry = getRegistry();
  registry.state = {
    ...registry.state,
    ...partial,
    updatedAt: Date.now(),
  };
  emit(registry.state);
  return registry.state;
}

export function getGlobalPanelState(): NexGlobalPanelState {
  return getRegistry().state;
}

export function subscribeGlobalPanels(listener: Listener): () => void {
  const registry = getRegistry();
  registry.listeners.add(listener);
  return () => {
    registry.listeners.delete(listener);
  };
}

export function getAnchorRectFromElement(element: Element | null): NexPanelAnchorRect | null {
  if (!element || typeof element.getBoundingClientRect !== "function") return null;
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    right: rect.right,
    bottom: rect.bottom,
  };
}

export function openGlobalPanel(panel: NexGlobalPanelId, options: NexGlobalPanelOpenOptions = {}): NexGlobalPanelState {
  return patch({
    openPanel: panel,
    source: options.source,
    placement: options.placement ?? "drawer-right",
    anchorRect: options.anchorRect ?? null,
    offset: options.offset ?? 12,
    modal: options.modal ?? true,
  });
}

export function closeGlobalPanel(source?: string): NexGlobalPanelState {
  return patch({ openPanel: null, source, anchorRect: null });
}

export function toggleGlobalPanel(panel: NexGlobalPanelId, options: NexGlobalPanelOpenOptions = {}): NexGlobalPanelState {
  const current = getGlobalPanelState();
  if (current.openPanel === panel) {
    return closeGlobalPanel(options.source);
  }
  return openGlobalPanel(panel, options);
}
