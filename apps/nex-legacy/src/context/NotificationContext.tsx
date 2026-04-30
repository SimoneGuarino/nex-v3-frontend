import React, {
    createContext, useContext, useMemo, useCallback
} from "react";
import { useRealtimeSelector } from "@nex/realtime-store";
import { realtimeStoreActions } from "@nex/realtime-store";
import type { Notification } from "types/notifications";

type NTIFTuple = [
    Notification[],
    (next: Notification[] | ((prev: Notification[]) => Notification[])) => void
];

const NotificationContext = createContext<NTIFTuple | undefined>(undefined);

export function useNTIFContext(): NTIFTuple {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error("useNTIFContext deve essere usato dentro NTIFProvider");
    return ctx;
}

export function useNTIFUnreadCount(): number {
    return useRealtimeSelector((snapshot) => snapshot.notificationUnreadCount);
}

export function useNTIFActions() {
    const [items, setItems] = useNTIFContext();
    const markViewed = useCallback((id: string) => {
        realtimeStoreActions.markNotificationViewed(id);
    }, []);

    const remove = useCallback((id: string) => {
        setItems(prev => prev.filter(x => x._id !== id));
    }, [setItems]);

    const clear = useCallback(() => setItems([]), [setItems]);

    const prepend = useCallback((n: Notification) => {
        realtimeStoreActions.prependNotification(n);
    }, []);

    return { items, setItems, markViewed, remove, clear, prepend };
}

export const NTIFProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const items = useRealtimeSelector((snapshot) => snapshot.notifications as Notification[]);

    const setItems = useCallback<NTIFTuple[1]>((next) => {
        if (typeof next === "function") {
            const computed = (next as (prev: Notification[]) => Notification[])(items);
            realtimeStoreActions.setNotifications(computed);
            return;
        }

        realtimeStoreActions.setNotifications(next);
    }, [items]);

    const value = useMemo<NTIFTuple>(() => [items, setItems], [items, setItems]);
    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};