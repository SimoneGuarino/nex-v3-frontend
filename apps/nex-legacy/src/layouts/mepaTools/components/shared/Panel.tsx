import React from "react";

type PanelProps = {
    /**
     * Human-readable title rendered in the card header.
     *
     * Keep this value short because the panel is reused inside responsive grids
     * where long labels can reduce the available content width on tablets.
     */
    title: string;
    /**
     * Decorative or semantic icon shown before the title.
     *
     * The caller owns the icon choice so this primitive remains design-system
     * agnostic and does not depend on a specific react-icons package import.
     */
    icon: React.ReactNode;
    /**
     * Panel body. The component does not impose scroll behavior: each feature
     * tab decides whether its content should be free-flowing, bounded or
     * virtualized.
     */
    children: React.ReactNode;
    /**
     * Optional Tailwind extension point used by complex cards that need custom
     * height, overflow or grid placement without duplicating the panel chrome.
     */
    className?: string;
};

/**
 * Generic MEPA panel shell.
 *
 * This is intentionally a very small presentational primitive. In a scalable
 * front-end architecture, shared components like this must not know anything
 * about tenders, documents, products or AI outputs: they only standardize
 * spacing, borders, background and heading layout. Domain-specific behavior
 * belongs in feature components and controllers.
 */
export function Panel({ title, icon, children, className }: PanelProps) {
    return (
        <div className={`rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 ${className ?? ""}`}>
            <div className="mb-4 flex items-center gap-2">
                <span>{icon}</span>
                <h3 className="font-semibold">{title}</h3>
            </div>
            {children}
        </div>
    );
}
