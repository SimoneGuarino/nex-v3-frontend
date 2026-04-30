import type { RealtimeSnapshot } from "./store";

export const selectRealtimeSession = (snapshot: RealtimeSnapshot) => snapshot.session;
export const selectRealtimeConnection = (snapshot: RealtimeSnapshot) => snapshot.connection;
export const selectRealtimeMaintenanceMode = (snapshot: RealtimeSnapshot) => snapshot.maintenanceMode;
export const selectNotificationUnreadCount = (snapshot: RealtimeSnapshot) => snapshot.notificationUnreadCount;
export const selectChatUnreadCount = (snapshot: RealtimeSnapshot) => snapshot.chatUnreadCount;
export const selectLastNotification = (snapshot: RealtimeSnapshot) => snapshot.lastNotification;
export const selectLastChatEvent = (snapshot: RealtimeSnapshot) => snapshot.lastChatEvent;
export const selectUsersOnline = (snapshot: RealtimeSnapshot) => snapshot.usersOnline;

export const selectNotificationsHydrated = (snapshot: RealtimeSnapshot) => snapshot.notificationsHydrated;
