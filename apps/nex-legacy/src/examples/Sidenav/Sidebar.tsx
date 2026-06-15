import React, {
    useEffect,
    useContext,
    useRef,
    useMemo,
    memo,
    useCallback,
    useState,
    MutableRefObject,
} from "react";
import { UserContext } from "../../context/UserContext";
import { useLocation, NavLink } from "react-router-dom";
import List from "@mui/material/List";

import {
    useMaterialUIController,
    setSidebarOpen
} from "context/index";

import PermissionMoudle from "../../classes/permission";
import { SideNavFooter } from "./footer/footer";
import { SideNavHeader } from "./header/header";
import { Tooltip } from "react-tooltip";
import type { UserState } from "types/UserContext";

import SidebarContainer from "./SidebarContainer";
import { useResponsiveSidebar } from "./useResponsiveSidebar";
import SidebarItem from "./SidebarItem";
import SidebarGroup from "./SidebarGroup";
import { useNexTheme } from "@nex/theme-system";

const Permission = new PermissionMoudle();

type SidenavProps = {
    color?: "primary" | "secondary" | "info" | "success" | "warning" | "error" | "dark" | "purple";
    brand?: string;
    brandName: string;
    routes: RouteElement[];
    runtimeManaged?: boolean;
    navigationLoading?: boolean;
    navigationError?: string | null;
    [key: string]: any;
};

const RenderedRoutes = memo(function RenderedRoutes({
    collapseName,
    miniSidenav,
    filteredRoutes,
}: {
    collapseName: string;
    miniSidenav: boolean;
    filteredRoutes: RouteElement[];
}) {
    return (
        <>
            {filteredRoutes.map(({ type, name, icon, title, noCollapse, key, route, nested, ref_type, isNew, redirect }) => {
                const type_ = ref_type || type;

                switch (type_) {
                    case "visible":
                        return (
                            <NavLink key={key} to={route ?? ""}>
                                <SidebarItem
                                    label={name}
                                    icon={icon}
                                    active={collapseName !== "" ? key === collapseName : key === "dashboard"}
                                    isNew={isNew}
                                    redirect={redirect}
                                />
                            </NavLink>
                        );

                    case "nested": {
                        const normalizedNested: RouteElement[] = Array.isArray(nested) ? nested : nested?.elements ?? [];
                        return (
                            <SidebarGroup
                                key={key}
                                icon={icon}
                                label={name}
                                collapseKey={key}
                                collapseName={collapseName}
                                items={normalizedNested}
                            />
                        );
                    }

                    case "title":
                        return (
                            <p
                                key={key}
                                className="px-7 mt-2 mb-1 ml-1 uppercase text-xs font-semibold text-neutral-800 dark:text-neutral-200"
                            >
                                {!miniSidenav && title}
                            </p>
                        );

                    case "divider":
                        return <span key={key} className="bg-gray-300 dark:bg-neutral-700 m-6 block h-px rounded-md" />;

                    default:
                        return null;
                }
            })}
        </>
    );
});

function Sidenav({ color = "info", brand = "", brandName, routes, runtimeManaged = true, navigationLoading = false, navigationError = null, ...rest }: SidenavProps) {
    const [userContext, setUserContext] = useContext(UserContext) as [
        UserState | null,
        React.Dispatch<React.SetStateAction<UserState | null>>
    ];
    const [controller, dispatch] = useMaterialUIController();
    const { miniSidenav, transparentSidenav, whiteSidenav } = controller;
    const { isMobile } = useResponsiveSidebar(); // ora abbiamo isMobile

    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";

    const location = useLocation();
    const collapseName = location.pathname.replace("/", "");

    // Stati di caricamento generali
    const [loadStatus, setLoadStatus] = React.useState<{ [key: string]: any }>({
        new_role: false, // Stato di caricamento per i messaggi
    });

    const [menuRole, setMenuRole] = useState<boolean>(false);
    const menuRef = useRef<HTMLDivElement>(null) as MutableRefObject<HTMLDivElement | null>; // Riferimento per il menu contestuale dei messaggi fissati

    // chiudi su cambio route, se mobile
    useEffect(() => {
        if (isMobile) setSidebarOpen(dispatch, false);
    }, [location.pathname, isMobile, dispatch]);

    // chiudi su ESC
    useEffect(() => {
        if (!isMobile) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setSidebarOpen(dispatch, false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isMobile, dispatch]);


    // Navigation is now owned by navigation_resources.
    // Fail closed: never render the legacy static routes while the runtime navigation is loading/failing.
    const filteredRoutes = useMemo(() => {
        const details = userContext?.details;
        if (!details || navigationLoading || navigationError) return [];

        if (runtimeManaged) {
            return routes;
        }

        // Development-only legacy fallback path. Production should always use runtimeManaged=true.
        const result = Permission.RouteToShow(
            details.ruolo,
            routes,
            details.username,
            details.permissions
        );

        return (result?.Data as RouteElement[] | undefined) ?? [];
    }, [userContext?.details, routes, runtimeManaged, navigationLoading, navigationError]);



    // hover/scrollbar show-hide
    const [navIsFocused, setNavIsFocused] = useState(false);
    const activedBar = useRef(false);
    const timeoutId = useRef<number | null>(null);

    const handleFocus = useCallback(() => {
        activedBar.current = true;
        if (timeoutId.current) {
            window.clearTimeout(timeoutId.current);
            timeoutId.current = null;
        }
        setNavIsFocused(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        activedBar.current = false;
        timeoutId.current = window.setTimeout(() => setNavIsFocused(false), 800);
    }, []);

    useEffect(() => {
        return () => {
            if (timeoutId.current && !activedBar.current) {
                window.clearTimeout(timeoutId.current);
            }
        };
    }, []);


    return (
        <>
            {/* Backdrop mobile */}
            {isMobile && !miniSidenav && (
                <div
                    onClick={() => setSidebarOpen(dispatch, false)}
                    className="fixed inset-0 z-10 bg-black/40 backdrop-blur-[1px]"
                    aria-hidden
                />
            )}

            <SidebarContainer
                onMouseEnter={handleFocus}
                onMouseLeave={handleMouseLeave}
                transparent={transparentSidenav}
                white={whiteSidenav}
                dark={darkMode}
                isMobile={isMobile}
                open={miniSidenav}
            >
                <SideNavHeader NavLink={NavLink} isMobile={isMobile} navIsFocused={navIsFocused} />

                <List
                    className={`transition-all-css ${navIsFocused ? "overflow-y-auto overflow-x-hidden" : "overflow-hidden"}`}
                    style={{ flexBasis: "100%" }}
                    translate="no"
                >
                    {navigationLoading ? (
                        <div className="space-y-3 px-4 py-3" aria-label="Caricamento navigazione">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="h-10 animate-pulse rounded-xl bg-neutral-200/80 dark:bg-neutral-800/80"
                                />
                            ))}
                        </div>
                    ) : navigationError ? (
                        <div className="mx-3 my-4 rounded-xl border border-amber-300/50 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100">
                            <div className="font-semibold">Navigazione non disponibile</div>
                            {!miniSidenav && <div className="mt-1 opacity-80">{navigationError}</div>}
                        </div>
                    ) : (
                        <RenderedRoutes
                            collapseName={collapseName}
                            miniSidenav={miniSidenav}
                            filteredRoutes={filteredRoutes}
                        />
                    )}
                </List>

                <SideNavFooter menuRef={menuRef} setMenuRole={setMenuRole} />
            </SidebarContainer>


            <Tooltip
                id="general-sidenav-tooltip"
                place="bottom"
                style={{
                    maxWidth: "15vw",
                    minWidth: 150,
                    fontSize: "0.87rem",
                    textAlign: "center",
                    zIndex: 9999,
                }}
            />
        </>
    );
}

export default memo(Sidenav);