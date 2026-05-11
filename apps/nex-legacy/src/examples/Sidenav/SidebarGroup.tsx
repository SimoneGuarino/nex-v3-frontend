import React, { useMemo, useState, useCallback } from "react";
import Collapse from "@mui/material/Collapse";
import List from "@mui/material/List";
import { NavLink } from "react-router-dom";
import SidebarItem from "./SidebarItem";
import { IoIosArrowUp } from "react-icons/io";
import { IoChevronForwardOutline } from "react-icons/io5";


const IconsArrowUp = IoIosArrowUp as React.FC<{ size?: number; className?: string, style?: React.CSSProperties }>;
const ChevronRightIcon = IoChevronForwardOutline as React.FC<{ size?: number, className?: string, style?: React.CSSProperties }>;

type SidebarGroupProps = {
    icon?: React.ReactNode | string;
    label: string;
    collapseKey: string;      // es. "settings"
    collapseName: string;     // route corrente senza "/"
    items: RouteElement[];    // figli del gruppo
};

export default function SidebarGroup({
    icon,
    label,
    collapseKey,
    collapseName,
    items,
}: SidebarGroupProps) {
    const children = useMemo<RouteElement[]>(
        () => (Array.isArray(items) ? items.filter((e) => e.hide !== true) : []),
        [items]
    );

    const isChildActive = useMemo(
        () => children.some((e) => `${collapseKey}/${e.key}` === collapseName),
        [children, collapseKey, collapseName]
    );

    const [open, setOpen] = useState<boolean>(isChildActive);
    const toggle = useCallback(() => setOpen((v) => !v), []);

    return (
        <>
            <SidebarItem
                label={label}
                icon={icon}
                active={collapseKey === collapseName}
                highlight={open || isChildActive}
                onClick={toggle}
                endAdornment={
                    <ChevronRightIcon 
                    size={15}
                    className={open ? "text-gray-600 dark:text-gray-400" : "text-gray-400/70 dark:text-neutral-700"} 
                    style={{transition: "transform 150ms ease-in", transform: open ? "rotate(90deg)" : "rotate(0)" }} />
                }
            />

            <Collapse in={open} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                    {children.map((data) => {
                        const active =
                            collapseName !== ""
                                ? `${collapseKey}/${data.key}` === collapseName
                                : data.key === "dashboard";

                        const childNode = (
                            <SidebarItem
                                key={data.key}
                                label={data.name}
                                icon={data.icon}
                                active={active}
                                depth={1}
                                isNew={data.isNew}
                                redirect={data.redirect}
                            />
                        );

                        return data.route ? (
                            <NavLink key={data.key} to={data.route}>
                                {childNode}
                            </NavLink>
                        ) : (
                            childNode
                        );
                    })}
                </List>
            </Collapse>
        </>
    );
}