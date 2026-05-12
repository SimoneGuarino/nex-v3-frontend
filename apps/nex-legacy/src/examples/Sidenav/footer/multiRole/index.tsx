import React, { MutableRefObject } from 'react';

import { UserContext } from "context/UserContext";
import { IoDiamondSharp } from "react-icons/io5";
import { useMaterialUIController } from 'context/index';

const DiamondIcon = IoDiamondSharp as React.FC<{ size?: number; className?: string }>;

interface UserTeamContextProps {
    menuRef: MutableRefObject<HTMLDivElement | null>;
    setMenuRole: React.Dispatch<React.SetStateAction<boolean>>;
}

export const UserMultiRoles: React.FC<UserTeamContextProps> = ({ menuRef }) => {
    const [userContext] = React.useContext<any>(UserContext);
    const [controller] = useMaterialUIController();
    const { miniSidenav } = controller;

    const groupContexts = Array.isArray(userContext?.details?.authz?.groupContexts)
        ? userContext.details.authz.groupContexts
        : [];
    const activeGroupId = userContext?.details?.authz?.activeGroupId ?? null;
    const activeGroup = groupContexts.find((group: any) => group?._id === activeGroupId) ?? groupContexts[0] ?? null;
    const label = activeGroup?.name || activeGroup?.key || 'Nessun team';

    return (
        <div
            ref={menuRef}
            translate="no"
            className="mx-4 flex items-center gap-2 overflow-hidden rounded-md bg-gray-100 p-2 dark:bg-neutral-800"
            data-tooltip-id="general-sidenav-tooltip"
            data-tooltip-content="Team operativo attivo"
        >
            <div className="rounded-md bg-teal-500 p-2">
                <DiamondIcon size={20} className="text-white" />
            </div>
            {!miniSidenav && (
                <div className="min-w-0">
                    <p className="text-xs uppercase text-neutral-500">Team</p>
                    <p className="truncate text-sm">{label}</p>
                </div>
            )}
        </div>
    );
};
