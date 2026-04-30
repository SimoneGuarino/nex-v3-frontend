export type NexLoadingAppId = "legacy" | "survey" | "shell" | "unknown";
export type NexLoadingReason = "initial-load" | "route-change" | "cross-app-navigation" | "auth" | "manual";

export type ShellLoadingPayload = {
  app?: NexLoadingAppId;
  reason?: NexLoadingReason;
  progress?: number;
  label?: string;
  source?: string;
};

type StartHandler = (payload: ShellLoadingPayload) => void;
type ReadyHandler = (payload: ShellLoadingPayload) => void;
type ProgressHandler = (payload: ShellLoadingPayload) => void;

const START_EVENT = "nex:shell-loading-start";
const READY_EVENT = "nex:shell-loading-ready";
const PROGRESS_EVENT = "nex:shell-loading-progress";

function emit(eventName: string, payload: ShellLoadingPayload): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(eventName, { detail: payload }));
}

export function notifyShellLoadingStart(payload: ShellLoadingPayload = {}): void {
  emit(START_EVENT, payload);
}

export function notifyShellLoadingReady(payload: ShellLoadingPayload = {}): void {
  emit(READY_EVENT, payload);
}

export function notifyShellLoadingProgress(payload: ShellLoadingPayload): void {
  emit(PROGRESS_EVENT, payload);
}

export function subscribeShellLoading(handlers: {
  onStart?: StartHandler;
  onReady?: ReadyHandler;
  onProgress?: ProgressHandler;
}): () => void {
  if (typeof window === "undefined") return () => undefined;

  const startListener = (event: Event) => handlers.onStart?.((event as CustomEvent<ShellLoadingPayload>).detail ?? {});
  const readyListener = (event: Event) => handlers.onReady?.((event as CustomEvent<ShellLoadingPayload>).detail ?? {});
  const progressListener = (event: Event) => handlers.onProgress?.((event as CustomEvent<ShellLoadingPayload>).detail ?? {});

  window.addEventListener(START_EVENT, startListener as EventListener);
  window.addEventListener(READY_EVENT, readyListener as EventListener);
  window.addEventListener(PROGRESS_EVENT, progressListener as EventListener);

  return () => {
    window.removeEventListener(START_EVENT, startListener as EventListener);
    window.removeEventListener(READY_EVENT, readyListener as EventListener);
    window.removeEventListener(PROGRESS_EVENT, progressListener as EventListener);
  };
}
