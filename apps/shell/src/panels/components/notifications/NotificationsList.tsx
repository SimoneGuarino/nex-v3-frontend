import React, { useCallback, useMemo } from "react";
import { deleteNotification, markNotificationViewed } from "@nex/shared-platform";
import { realtimeStoreActions, useRealtimeSession } from "@nex/realtime-store";
import NotificationEmptyState from "./NotificationEmptyState";
import NotificationRow from "./NotificationRow";
import NotificationsSkeleton from "./NotificationsSkeleton";
import { API_USERS, type FilterKey, type NotificationItem } from "./shared";

export default function NotificationsList({ data, activeFilter, loading = false }: { data: NotificationItem[]; activeFilter: FilterKey; loading?: boolean }) {
    const session = useRealtimeSession();
    const token = session?.token ?? undefined;

    const filteredData = useMemo(() => {
        switch (activeFilter) {
            case "unread":
                return data.filter((item) => !item.Viewd);
            case "read":
                return data.filter((item) => item.Viewd);
            default:
                return data;
        }
    }, [activeFilter, data]);

    const markRead = useCallback(
        async (id: string) => {
            const target = data.find((item) => item._id === id);
            if (!target || target.Viewd) return;

            realtimeStoreActions.markNotificationViewed(id);
            try {
                await markNotificationViewed({
                    apiUsersEndpoint: API_USERS,
                    notificationId: id,
                    token,
                });
            } catch (error) {
                console.error("markNotificationViewed failed", error);
            }
        },
        [data, token],
    );

    const removeRow = useCallback(
        async (id: string) => {
            realtimeStoreActions.setNotifications(data.filter((item) => item._id !== id));
            try {
                await deleteNotification({
                    apiUsersEndpoint: API_USERS,
                    notificationId: id,
                    token,
                });
            } catch (error) {
                console.error("deleteNotification failed", error);
            }
        },
        [data, token],
    );

    if (loading) {
        return <NotificationsSkeleton />;
    }

    if (!filteredData.length) {
        return <NotificationEmptyState filter={activeFilter} />;
    }

    return (
        <div className="h-full min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
            {filteredData.map((item) => (
                <NotificationRow key={item._id} item={item} onMarkRead={markRead} onRemove={removeRow} />
            ))}
        </div>
    );
};