import clsx from "clsx";
import React from "react";

type Props = {
    transparent: boolean;
    white: boolean;
    dark: boolean;
    isMobile: boolean;
    open: boolean;
    className?: string;
    children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>;

export default function SidebarContainer({
    transparent, white, dark, isMobile, open, className, children, ...rest
}: Props) {
    return (
        <aside
            {...rest}
            className={clsx(
                "fixed z-10 flex flex-col h-full shrink-0 left-0 top-0",   // z più alto per stare sopra
                (open && !isMobile) ? "w-[88px]" : "w-[280px]",
                white ? "bg-white" : (dark && "bg-stone-900"),
                !transparent && (dark ? "border-r border-stone-800" : "border-r border-neutral-200"),
                dark ? "text-white" : "text-black",
                // 👇 animazione: su mobile usiamo translateX
                isMobile
                    ? clsx(
                        "transition-transform duration-200 ease-in-out",
                        !open ? "translate-x-0" : "-translate-x-full"
                    )
                    : "transition-[width,background-color] duration-200 ease-in-out",
                className
            )}
        >
            {children}
        </aside>
    );
}