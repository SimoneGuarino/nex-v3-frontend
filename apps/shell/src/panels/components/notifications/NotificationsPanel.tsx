import { useCallback, useMemo, useState } from "react";
import { deleteNotification, markNotificationViewed } from "@nex/shared-platform";
import { FDBox } from "@nex/fd-ui";
import { realtimeStoreActions, useRealtimeSelector, useRealtimeSession } from "@nex/realtime-store";
import NotificationComposerDialog from "./NotificationComposerDialog";
import NotificationFilters from "./NotificationFilters";
import NotificationPanelHeader from "./NotificationPanelHeader";
import NotificationsList from "./NotificationsList";
import { API_USERS, FILTER_DEFINITIONS, type FilterKey, type NotificationItem } from "./shared";

export default function NotificationsPanel() {
    const session = useRealtimeSession();
    const data = useRealtimeSelector((snapshot) => snapshot.notifications as NotificationItem[]);
    const [composerOpen, setComposerOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

    const canSend = session?.details?.ruolo === "Dev" || session?.details?.ruolo === "Admin";

    const counters = useMemo(
        () => ({
            all: data.length,
            unread: data.filter((item) => !item.Viewd).length,
            read: data.filter((item) => item.Viewd).length,
        }),
        [data],
    );

    const readAll = useCallback(async () => {
        const hasUnread = data.some((item) => item?.Viewd === false);
        if (!hasUnread) return;

        realtimeStoreActions.setNotifications(data.map((item) => ({ ...item, Viewd: true })));
        try {
            await markNotificationViewed({
                apiUsersEndpoint: API_USERS,
                all: true,
                token: session?.token ?? undefined,
            });
        } catch (error) {
            console.error("markNotificationViewed(all) failed", error);
        }
    }, [data, session?.token]);

    const deleteAll = useCallback(async () => {
        if (!data.length) return;

        realtimeStoreActions.setNotifications([]);
        try {
            await deleteNotification({
                apiUsersEndpoint: API_USERS,
                all: true,
                token: session?.token ?? undefined,
            });
        } catch (error) {
            console.error("deleteNotification(all) failed", error);
        }
    }, [data.length, session?.token]);

    return (
        <FDBox variant="gradient" pad="none" radius="none" className="flex h-full min-h-0 w-full flex-col overflow-hidden">
            <NotificationPanelHeader
                unreadCount={counters.unread}
                canSend={canSend}
                onCompose={() => setComposerOpen(true)}
                onMarkAllRead={readAll}
                onDeleteAll={deleteAll}
            />
            
            <div className="flex flex-col gap-4 border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
                <NotificationFilters activeFilter={activeFilter} definitions={FILTER_DEFINITIONS} counters={counters} onChange={setActiveFilter} />
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
                <NotificationsList data={data} activeFilter={activeFilter} />
            </div>

            <NotificationComposerDialog open={composerOpen} onClose={() => setComposerOpen(false)} />
        </FDBox>
    );
};