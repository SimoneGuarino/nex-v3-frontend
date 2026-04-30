import { notifyShellLoadingStart, type NexLoadingAppId } from "./loading";

export type NexAppId = "legacy" | "survey" | "login";

export const APP_ROUTES: Record<NexAppId, string> = {
    legacy: "/legacy",
    survey: "/survey-builder",
    login: "/login",
} as const;

export function getAppRoute(appId: NexAppId): string {
    return APP_ROUTES[appId];
}

function inferAppFromPath(path: string): NexLoadingAppId {
  if (path.startsWith("/legacy")) return "legacy";
  if (path.startsWith("/survey-builder")) return "survey";
  if (path.startsWith("/login")) return "shell";
  return "unknown";
}

export function navigateToPath(path: string, options?: { replace?: boolean }): void {
  if (typeof window === "undefined") return;

  const currentPath = window.location.pathname + window.location.search + window.location.hash;
  if (currentPath === path) return;

  notifyShellLoadingStart({ app: inferAppFromPath(path), reason: "cross-app-navigation", label: "Cambio applicazione..." });

  if (options?.replace) {
    window.history.replaceState(null, "", path);
  } else {
    window.history.pushState(null, "", path);
  }

  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function navigateToApp(appId: NexAppId, options?: { replace?: boolean }): void {
  navigateToPath(getAppRoute(appId), options);
}
