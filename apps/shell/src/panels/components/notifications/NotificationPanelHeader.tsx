import React from "react";
import { FaRegEdit } from "react-icons/fa";
import { FiSettings, FiTrash2 } from "react-icons/fi";
import { RiCheckDoubleFill } from "react-icons/ri";
import { FDBox, FDButton, FDIconButton } from "@nex/fd-ui";

const CheckAllIcon = RiCheckDoubleFill as React.FC<{ size?: number; className?: string }>;
const TrashIcon = FiTrash2 as React.FC<{ size?: number; className?: string }>;
const EditIcon = FaRegEdit as React.FC<{ size?: number; className?: string }>;
const SettingsIcon = FiSettings as React.FC<{ size?: number; className?: string }>;

export default function NotificationPanelHeader({
    unreadCount,
    canSend,
    onCompose,
    onMarkAllRead,
    onDeleteAll,
}: {
    unreadCount: number;
    canSend: boolean;
    onCompose: () => void;
    onMarkAllRead: () => void;
    onDeleteAll: () => void;
}) {
    return (
        <FDBox variant="gradient" radius="none" pad="md" className="border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                        <h3 className="text-[22px] font-semibold leading-none text-neutral-900 dark:text-neutral-100">Notifiche</h3>
                        <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                            {unreadCount} da leggere
                        </span>
                    </div>
                    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">Centro notifiche globale condiviso tra shell e microfrontend.</p>
                </div>

                <div className="flex items-center gap-2">
                    {canSend ? (
                        <FDButton variant="soft" color="primary" size="small" icon={<EditIcon size={14} />} onClick={onCompose}>
                            Nuova
                        </FDButton>
                    ) : null}

                    <FDIconButton icon={<CheckAllIcon size={16} />} variant="text" rounded="full" onClick={onMarkAllRead} ariaLabel="Segna tutte come lette" />
                    <FDIconButton icon={<TrashIcon size={16} />} variant="text" rounded="full" onClick={onDeleteAll} ariaLabel="Elimina tutte" />
                    <FDIconButton icon={<SettingsIcon size={16} />} variant="text" rounded="full" ariaLabel="Impostazioni notifiche" />
                </div>
            </div>
        </FDBox>
    );
}
