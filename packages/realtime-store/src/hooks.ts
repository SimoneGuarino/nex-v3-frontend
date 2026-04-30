import { useRealtimeSelector } from "./useRealtimeStore";
import {
  selectChatUnreadCount,
  selectNotificationUnreadCount,
  selectNotificationsHydrated,
  selectRealtimeConnection,
  selectRealtimeMaintenanceMode,
  selectRealtimeSession,
  selectUsersOnline,
} from "./selectors";

export function useRealtimeSession() {
  return useRealtimeSelector(selectRealtimeSession);
}

export function useRealtimeConnection() {
  return useRealtimeSelector(selectRealtimeConnection);
}

export function useRealtimeMaintenanceMode() {
  return useRealtimeSelector(selectRealtimeMaintenanceMode);
}

export function useNotificationUnreadCount() {
  return useRealtimeSelector(selectNotificationUnreadCount);
}

export function useChatUnreadCount() {
  return useRealtimeSelector(selectChatUnreadCount);
}

export function useRealtimeUsersOnline() {
  return useRealtimeSelector(selectUsersOnline);
}

export function useNotificationsHydrated() {
  return useRealtimeSelector(selectNotificationsHydrated);
}
