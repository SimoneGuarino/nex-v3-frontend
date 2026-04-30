import { useContext, useState, useMemo, useRef } from "react";

import { UserContext } from "./context/UserContext";
import routes from "routes";
import { useMaterialUIController } from "context";
import { useGSettingsContext } from "./context/GSettingsContext";
import PermissionMoudle from './classes/permission';
import { useGeneralDataContext } from "context/GeneralDataContext";
import AppShell from "./shell/AppShell";
import AppRuntimeEffects from "./runtime/AppRuntimeEffects";
import useAppBootstrap from "bootstrap/useAppBootstrap";
import useRootThemeClass from "bootstrap/useRootThemeClass";
import useExternalScriptBootstrap from "bootstrap/useExternalScriptBootstrap";
import ShellRouteHost from "shell/ShellRouteHost";
import LegacyRealtimeAdapter from "./runtime/LegacyRealtimeAdapter";
import { useNexTheme } from "@nex/theme-system";

const Permission = new PermissionMoudle();

export default function App() {
    const { preferences } = useNexTheme();
    const [userContext, setUserContext] = useContext<any>(UserContext);

    const { GSettingsMode, setGSettingsMode, canAccess } = useGSettingsContext();
    const { setUsersOnline, upsertIncomingMessageFromSocket, setOverviewMessage,
        ViewdMessages, setPrivateMessagesData, setMessagesData, setChatLoad, CloseBlock } = useGeneralDataContext();

    const [controller] = useMaterialUIController();
    const {
        layout,
        sidenavColor,
        transparentSidenav,
    } = controller;
    const darkMode = preferences.mode === "dark";

    const abortController = useRef(null);
    const [messageSound] = useState(null);

    useAppBootstrap({ setUserContext });
    useRootThemeClass(darkMode);
    useExternalScriptBootstrap();

    const shellContent = useMemo(() => {
        if (!userContext?.details) return null;

        return (
            <ShellRouteHost
                routes={routes}
                permission={Permission}
                userDetails={userContext.details}
            />
        );
    }, [userContext]);

    return (
        <AppRuntimeEffects
            userContext={userContext}
        >
            <LegacyRealtimeAdapter
                userContext={userContext}
                setUserContext={setUserContext}
                abortController={abortController}
                setGSettingsMode={setGSettingsMode}
                setUsersOnline={setUsersOnline}
                upsertIncomingMessageFromSocket={upsertIncomingMessageFromSocket}
                ViewdMessages={ViewdMessages}
                CloseBlock={CloseBlock}
                setMessagesData={setMessagesData}
                setPrivateMessagesData={setPrivateMessagesData}
                setOverviewMessage={setOverviewMessage}
                setChatLoad={setChatLoad}
                audio={messageSound}
            />
            <AppShell
                maintenanceMode={GSettingsMode.Manutenzione}
                canAccess={canAccess}
                userContext={userContext}
                layout={layout}
                sidenavColor={sidenavColor}
                transparentSidenav={transparentSidenav}
                darkMode={darkMode}
                routes={routes}
            >
                {shellContent}
            </AppShell>
        </AppRuntimeEffects>
    );
};
