import React, { memo } from "react";
import { FiTrash2 } from "react-icons/fi";
import { FDIconButton } from "@nex/fd-ui";
import type { NotificationItem } from "./shared";
import { API_USERS, cx, formatTimeAgo, typePillClass } from "./shared";

const TrashIcon = FiTrash2 as React.FC<{ size?: number; className?: string }>;

function UserAvatar({ item }: { item: NotificationItem }) {
    const src = item?.senderDetails?.immagini?.avatar;
    const name = item?.senderDetails?.nome || item?.Name || "?";
    const surname = item?.senderDetails?.cognome || "";
    const initials = `${name} ${surname}`
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((chunk) => chunk[0]?.toUpperCase())
        .join("");

    if (src) {
        return <img src={`${API_USERS}${src}`} alt={name} className="h-10 w-10 shrink-0 rounded-full border border-neutral-200 object-cover dark:border-neutral-700" />;
    }

    return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-sm font-semibold text-white shadow-sm">
            {initials || "?"}
        </div>
    );
}

const NotificationRow = memo(function NotificationRow({
    item,
    onMarkRead,
    onRemove,
}: {
    item: NotificationItem;
    onMarkRead: (id: string) => void;
    onRemove: (id: string) => void;
}) {
    const isUnread = !item.Viewd;

    return (
        <article className={cx("group relative border-b border-neutral-200 px-4 py-3 transition-colors dark:border-neutral-800", isUnread && "bg-sky-50/60 dark:bg-sky-950/20")}>
            {isUnread ? <div className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-sky-500" /> : null}

            <button
                type="button"
                onClick={() => onMarkRead(item._id)}
                className="flex w-full items-start gap-3 pr-12 text-left"
                aria-label={isUnread ? "Segna notifica come letta" : "Apri notifica"}
            >
                <UserAvatar item={item} />

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">{item.Name || "Sistema"}</span>
                                {item.Type ? (
                                    <span className={cx("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", typePillClass(item.Type))}>
                                        {item.Type}
                                    </span>
                                ) : null}
                            </div>

                            <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{formatTimeAgo(item.Date)}</div>
                        </div>

                        {isUnread ? <span className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-500" aria-hidden="true" /> : null}
                    </div>

                    {Array.isArray(item.tags) && item.tags.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {item.tags.map((tag) => (
                                <span key={tag} className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    ) : null}

                    {item.Title ? (
                        <div className="mt-2 overflow-hidden text-sm leading-5 text-neutral-700 dark:text-neutral-300" dangerouslySetInnerHTML={{ __html: String(item.Title) }} />
                    ) : null}
                </div>
            </button>

            <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                <FDIconButton
                    icon={<TrashIcon size={15} />}
                    variant="text"
                    rounded="full"
                    onClick={(event) => {
                        event.stopPropagation();
                        onRemove(item._id);
                    }}
                    ariaLabel="Elimina notifica"
                />
            </div>
        </article>
    );
});

export default NotificationRow;