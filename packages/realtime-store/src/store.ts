import type { SharedSessionSnapshot } from "@nex/shared-platform";

export type RealtimeSnapshot = {
    session: SharedSessionSnapshot | null;
    maintenanceMode: boolean;
    usersOnline: unknown[];
    notifications: unknown[];
    notificationsHydrated: boolean;
    notificationUnreadCount: number;
    chatUnreadCount: number;
    connection: {
        user: boolean;
        chat: boolean;
        admin: boolean;
    };
    lastChatEvent: unknown | null;
    lastNotification: unknown | null;
    lastEventAt: number | null;
};

type Listener = () => void;

type RealtimeStore = {
    snapshot: RealtimeSnapshot;
    listeners: Set<Listener>;
};

declare global {
    interface Window {
        __NEX_REALTIME_STORE__?: RealtimeStore;
    }
}

const initialSnapshot: RealtimeSnapshot = {
    session: null,
    maintenanceMode: false,
    usersOnline: [],
    notifications: [],
    notificationsHydrated: false,
    notificationUnreadCount: 0,
    chatUnreadCount: 0,
    connection: {
        user: false,
        chat: false,
        admin: false,
    },
    lastChatEvent: null,
    lastNotification: null,
    lastEventAt: null,
};

function getStore(): RealtimeStore {
    if (typeof window === "undefined") {
        return {
            snapshot: initialSnapshot,
            listeners: new Set(),
        };
    }

    if (!window.__NEX_REALTIME_STORE__) {
        window.__NEX_REALTIME_STORE__ = {
            snapshot: initialSnapshot,
            listeners: new Set(),
        };
    }

    return window.__NEX_REALTIME_STORE__;
}

function emit(): void {
    const store = getStore();
    store.listeners.forEach((listener) => listener());
}

function patchSnapshot(recipe: (prev: RealtimeSnapshot) => RealtimeSnapshot): void {
    const store = getStore();
    store.snapshot = recipe(store.snapshot);
    emit();
}

export function getRealtimeSnapshot(): RealtimeSnapshot {
    return getStore().snapshot;
}

export function subscribeRealtimeStore(listener: Listener): () => void {
    const store = getStore();
    store.listeners.add(listener);
    return () => {
        store.listeners.delete(listener);
    };
}

export const realtimeStoreActions = {
    hydrateSession(session: SharedSessionSnapshot | null) {
        patchSnapshot((prev) => {
            const prevUserId = prev.session?.details?._id ?? null;
            const nextUserId = session?.details?._id ?? null;
            const sessionChanged = prevUserId !== nextUserId;

            if (!sessionChanged) {
                return { ...prev, session };
            }

            return {
                ...prev,
                session,
                notifications: [],
                notificationsHydrated: false,
                notificationUnreadCount: 0,
                lastNotification: null,
            };
        });
    },
    setConnection(channel: keyof RealtimeSnapshot["connection"], connected: boolean) {
        patchSnapshot((prev) => ({
            ...prev,
            connection: {
                ...prev.connection,
                [channel]: connected,
            },
        }));
    },
    setMaintenanceMode(maintenanceMode: boolean) {
        patchSnapshot((prev) => ({ ...prev, maintenanceMode, lastEventAt: Date.now() }));
    },
    setUsersOnline(usersOnline: unknown[]) {
        patchSnapshot((prev) => ({ ...prev, usersOnline, lastEventAt: Date.now() }));
    },
    setNotifications(notifications: unknown[]) {
        patchSnapshot((prev) => ({
            ...prev,
            notifications,
            notificationsHydrated: true,
            notificationUnreadCount: notifications.filter((item) => !(item as { Viewd?: boolean }).Viewd).length,
            lastEventAt: Date.now(),
        }));
    },
    prependNotification(notification: unknown) {
        patchSnapshot((prev) => ({
            ...prev,
            notificationsHydrated: true,
            notifications: [notification, ...prev.notifications],
            notificationUnreadCount: prev.notificationUnreadCount + 1,
            lastNotification: notification,
            lastEventAt: Date.now(),
        }));
    },
    markNotificationViewed(id: string) {
        patchSnapshot((prev) => {
            const notifications = prev.notifications.map((item) => {
                const typed = item as { _id?: string; Viewd?: boolean };
                if (typed._id === id) {
                    return { ...typed, Viewd: true };
                }
                return item;
            });

            return {
                ...prev,
                notifications,
                notificationUnreadCount: notifications.filter((item) => !(item as { Viewd?: boolean }).Viewd).length,
            };
        });
    },
    setChatUnreadCount(chatUnreadCount: number) {
        patchSnapshot((prev) => ({ ...prev, chatUnreadCount, lastEventAt: Date.now() }));
    },
    incrementChatUnread(by = 1) {
        patchSnapshot((prev) => ({ ...prev, chatUnreadCount: prev.chatUnreadCount + by, lastEventAt: Date.now() }));
    },
    resetChatUnread() {
        patchSnapshot((prev) => ({ ...prev, chatUnreadCount: 0, lastEventAt: Date.now() }));
    },
    noteChatEvent(lastChatEvent: unknown) {
        patchSnapshot((prev) => ({ ...prev, lastChatEvent, lastEventAt: Date.now() }));
    },
};