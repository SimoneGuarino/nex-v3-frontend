import React from "react";
import { useUserContext } from "context/UserContext";

import { CheckAdminPermissions } from "utils/checkAdminPermissions";
import { OnlineUsers as OnlineUsersType, useGeneralDataContext } from "context/GeneralDataContext";

import MDTypography from "components/MDTypography";
import FDBox from "components/UI/box/FDBox";
import { UserAvatar } from "../userInfo";


export const OnlineUsers: React.FC<{ miniSidenav: boolean }> = ({ miniSidenav }) => {
    const [userContext] = useUserContext();
    const { usersOnline } = useGeneralDataContext();


    const userOnlineList = React.useMemo(() => {
        if (!usersOnline) { return };
        return <div className="flex -space-x-3 items-center justify-center">
            {(usersOnline || []).slice(0, 4).map((user: OnlineUsersType, index: number) => (
                <UserAvatar key={index} src={user.immagini?.avatar} name={user.nome}
                    cognome={user.cognome} size={10} cover={{ src: user.immagini?.cover, active: true }} bio={user.bio} />
            ))}
            {((usersOnline || []).length > 4 || usersOnline.length == 0) && <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-300 
            text-xs font-medium text-gray-600 border-2 border-white dark:border-gray-800 dark:bg-gray-700 dark:text-gray-200">
                {(usersOnline || []).length > 4 ? `+${(usersOnline || []).length - 4}` : 0}
            </div>}
        </div>
    }, [usersOnline]);


    if(!userContext || !userContext.details) { return <></> };

    return CheckAdminPermissions({
        userRole: userContext.details.ruolo,
        permissions: userContext.details.permissions, panelToCheck: 'user_management', where: 0
    }) ? <FDBox variant="ghost" className="ml-6">
        <MDTypography variant="body2" sx={{ fontSize: '0.7rem', textAlign: 'center' }}>Utenti Online</MDTypography>
        {userOnlineList}
    </FDBox> : <></>
}