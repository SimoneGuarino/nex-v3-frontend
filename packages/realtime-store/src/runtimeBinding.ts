import {
  getRealtimeKernel,
  type RealtimeEvent,
} from "@nex/realtime-core";
import {
  readSharedSessionSnapshot,
  subscribeSessionSnapshot,
} from "@nex/shared-platform";
import { realtimeStoreActions } from "./store";

declare global {
  interface Window {
    __NEX_REALTIME_STORE_BOUND__?: boolean;
  }
}

function onRealtimeEvent(event: RealtimeEvent): void {
  switch (event.type) {
    case "session-changed":
      realtimeStoreActions.hydrateSession(event.payload);
      return;
    case "connection-state":
      realtimeStoreActions.setConnection(event.payload.channel, event.payload.connected);
      return;
    case "maintenance-status":
      realtimeStoreActions.setMaintenanceMode(event.payload.maintenanceMode);
      return;
    case "users-online":
      realtimeStoreActions.setUsersOnline(event.payload);
      return;
    case "notification-batch":
      realtimeStoreActions.setNotifications(event.payload);
      return;
    case "notification-received":
      realtimeStoreActions.prependNotification(event.payload);
      return;
    case "chat-message":
      realtimeStoreActions.incrementChatUnread(1);
      realtimeStoreActions.noteChatEvent(event.payload);
      return;
    case "chat-viewed":
      realtimeStoreActions.resetChatUnread();
      realtimeStoreActions.noteChatEvent(event.payload);
      return;
    case "chat-message-list":
    case "chat-block-end":
    case "chat-file-uploaded":
    case "sblocco-ordini-unread":
    case "sblocco-ordini-read":
    case "user-banned-status-update":
      realtimeStoreActions.noteChatEvent(event.payload);
      return;
    default:
      return;
  }
}

export function bindRealtimeStoreToKernel(): () => void {
  const kernel = getRealtimeKernel();

  if (typeof window !== "undefined" && window.__NEX_REALTIME_STORE_BOUND__) {
    return () => undefined;
  }

  if (typeof window !== "undefined") {
    window.__NEX_REALTIME_STORE_BOUND__ = true;
  }

  realtimeStoreActions.hydrateSession(readSharedSessionSnapshot());
  const unlistenKernel = kernel.subscribe(onRealtimeEvent);
  const unlistenSession = subscribeSessionSnapshot((snapshot) => {
    realtimeStoreActions.hydrateSession(snapshot);
    kernel.start(snapshot);
  });

  return () => {
    unlistenKernel();
    unlistenSession();
    if (typeof window !== "undefined") {
      window.__NEX_REALTIME_STORE_BOUND__ = false;
    }
  };
}
