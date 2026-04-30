import React from "react"
import { NavLink } from "react-router-dom";
import { setMiniSidenav, useMaterialUIController } from "context/index";

import { BsLayoutSidebar } from "react-icons/bs";

import nexLogo from "assets/images/login/logo_nex_transp.webp";
import nexLogoWhite from "assets/images/login/logo_nex_transp_white.webp";
import FDIconButton from "components/UI/buttons/FDIconButton";
import { useNexTheme } from "@nex/theme-system";

const SidebarIcon = BsLayoutSidebar as React.FC<{ size?: number }>;

interface SideNavHeaderProps {
    NavLink: typeof NavLink;
    isMobile: boolean;
    navIsFocused: boolean;
};

export const SideNavHeader: React.FC<SideNavHeaderProps> = ({ isMobile, navIsFocused }) => {
    const [controller, dispatch] = useMaterialUIController();
    const { miniSidenav } = controller;

    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";

    // per essere chiusa il sideNav deve essere settato su True
    const handleMiniSidenav = () => setMiniSidenav(dispatch, !miniSidenav);

    const btn = (className?: string) => (
        <FDIconButton
            icon={<SidebarIcon size={20} />}
            variant="text"
            dataTooltipId="general-sidenav-tooltip"
            dataTooltipContent={`${!miniSidenav ? "chiudi" : "apri"} barra di navigazione`}
            onClick={handleMiniSidenav}
            className={`${className} h-fit`}
        />
    );

    return <div className={`flex justify-between items-center mb-2 p-2 border-b border-neutral-200 dark:border-neutral-800`}>
        {(navIsFocused && miniSidenav) ? btn("ml-auto mr-auto") :
            <>
                <img src={darkMode ? nexLogoWhite : nexLogo} alt="Nex Logo" className={` ${miniSidenav ? "ml-0" : "ml-4"} w-full max-w-[150px] select-none`} />
                {!miniSidenav && btn()}
            </>}
    </div>
}