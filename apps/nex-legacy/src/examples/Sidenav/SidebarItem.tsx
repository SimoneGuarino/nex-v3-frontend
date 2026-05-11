import React, { createElement, useMemo } from "react";
import ListItemIcon from "@mui/material/ListItemIcon";
import Icon from "@mui/material/Icon";
import clsx from "clsx";
import { useMaterialUIController } from "../../context/index";

import { MdOutlineFiberNew } from "react-icons/md";
import { useNexTheme } from "@nex/theme-system";

const MdOutlineFiberNewIcon = MdOutlineFiberNew as React.FC<{ size?: number; className?: string }>;

type SidebarItemProps = {
    icon?: React.ReactNode | string;
    label: string;
    active?: boolean;
    depth?: number;
    onClick?: () => void;
    redirect?: string; // Aggiunto per indicare se l'elemento è un redirect
    endAdornment?: React.ReactNode;
    highlight?: boolean; // Aggiunto per evidenziare l'elemento
    isNew?: boolean; // Aggiunto per indicare se l'elemento è nuovo
};

const activeGradientByColor: Record<string, string> = {
    primary: "bg-neutral-300/50 dark:bg-neutral-800 font-normal",
    info: "bg-gradient-to-r from-sky-500 to-sky-600 text-white",
    success: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white",
    warning: "bg-gradient-to-r from-amber-500 to-amber-600 text-white",
    error: "bg-gradient-to-r from-rose-500 to-rose-600 text-white",
    dark: "bg-gradient-to-r from-neutral-800 to-neutral-900 text-white",
    purple: "bg-gradient-to-r from-violet-500 to-violet-600 text-white",
};

const SidebarItem: React.FC<SidebarItemProps> = ({
    icon,
    label,
    active = false,
    depth = 0,
    onClick,
    endAdornment,
    highlight = false, // Aggiunto per evidenziare l'elemento
    isNew = false, // Aggiunto per indicare se l'elemento è nuovo
    redirect, // Aggiunto per indicare se l'elemento è un redirect
}) => {
    const [controller] = useMaterialUIController();
    const { miniSidenav, sidenavColor = "primary" } = controller;

    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";

    const iconNode = useMemo(() => (
        <ListItemIcon
            className={clsx(
                "!min-w-[28px] !min-h-[28px] grid place-items-center rounded-md justify-center",
                // colore icona base
                darkMode ? "text-white" : "text-neutral-800"
            )}
        >
            {typeof icon === "string" ? (
                <Icon className={clsx(active ? "opacity-100" : "opacity-90")}>{icon}</Icon>
            ) : (<>
                {isNew ? <MdOutlineFiberNewIcon size={25} className="mr-2 rounded-md text-red-500 dark:text-red-400  bg-red-200/30 dark:bg-red-800/20" /> : null}
                {icon ? (
                    <span
                        className={`inline-flex items-center h-[25px] 
                            ${active ? "text-sky-600 dark:text-red-700" : "text-gray-400 dark:text-neutral-600"}`}
                    >
                        {createElement(icon as React.ElementType)}
                    </span>
                ) : null}
            </>
            )}
        </ListItemIcon>
    ), [icon, active, darkMode, isNew]);
    return (
        <div
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={(e) => {
                if (!onClick) return;
                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); }
            }}
            onClick={redirect ? () => window.location.href = redirect : onClick}
            data-tooltip-id="general-sidenav-tooltip"
            data-tooltip-content={miniSidenav ? label : undefined} // tooltip solo se miniSidenav
            className={clsx(
                "flex items-center mx-4 my-[1px] py-[7px] px-2 rounded-md cursor-pointer transition-colors",
                // bordino/indent se child
                depth > 0 && "border-l border-neutral-300 dark:border-neutral-700 !rounded-l-[0px]",
                depth === 0 && !active && highlight && "border-l-4 border-indigo-300 dark:border-pink-800 pl-1.5",
                depth > 0 && (miniSidenav ? "ml-[15px]" : "ml-10"),
                // hover states
                !active && `${darkMode ? "hover:bg-neutral-800" : "hover:bg-neutral-200"} font-light`,
                // evidenziazione soft quando il gruppo è aperto o ha un figlio attivo
                (!active && highlight) && (darkMode ? "bg-neutral-900/60" : "bg-neutral-200/70"),
                // active gradient usando mappa
                active && activeGradientByColor[sidenavColor] || "",
            )}
        >
            {iconNode}

            <p
                className={clsx(
                    "transition-all text-sm mr-auto text-current",
                    darkMode ? "text-neutral-200" : "text-current",
                    miniSidenav
                        ? "xl:opacity-0 xl:max-w-0 xl:ml-0 xl:h-0"
                        : "xl:opacity-100 xl:max-w-full xl:ml-2"
                )}
            >{label}</p>

            {!miniSidenav && endAdornment}
        </div>
    );
};

export default React.memo(SidebarItem, (a, b) => {
    const keysA = Object.keys(a) as (keyof typeof a)[];
    const keysB = Object.keys(b) as (keyof typeof b)[];
    if (keysA.length !== keysB.length) return false;
    return keysA.every((k) => a[k] === b[k]);
});