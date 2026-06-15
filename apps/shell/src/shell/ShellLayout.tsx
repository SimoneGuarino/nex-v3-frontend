import React from "react";
import { Link, useLocation } from "react-router-dom";
import { MICROFRONTENDS, resolveActiveMicrofrontend, type ShellChromeMode } from "../config/microfrontends";
import {
    toggleGlobalPanel,
} from "@nex/shared-platform";
import {
    useChatUnreadCount,
    useNotificationUnreadCount,
    useRealtimeConnection,
    useRealtimeMaintenanceMode,
    useRealtimeSession,
} from "@nex/realtime-store";

type Props = {
    children: React.ReactNode;
};

function NavItem({ to, label }: { to: string; label: string }) {
    const location = useLocation();
    const active = location.pathname === to || location.pathname.startsWith(`${to}/`);

    return (
        <Link
            to={to}
            style={{
                padding: "10px 12px",
                borderRadius: 10,
                textDecoration: "none",
                color: active ? "#0f172a" : "#e2e8f0",
                background: active ? "#f8fafc" : "transparent",
                fontWeight: 600,
            }}
        >
            {label}
        </Link>
    );
}

function StatusPill({ online, label }: { online: boolean; label: string }) {
    return (
        <span
            style={{
                padding: "6px 10px",
                borderRadius: 999,
                background: online ? "rgba(16,185,129,0.16)" : "rgba(148,163,184,0.16)",
                color: online ? "#6ee7b7" : "#cbd5e1",
                fontSize: 12,
                fontWeight: 700,
            }}
        >
            {label}: {online ? "online" : "offline"}
        </span>
    );
}

function HeaderAction({ label, count, onClick }: { label: string; count?: number; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.18)",
                background: "rgba(15,23,42,0.8)",
                color: "#e2e8f0",
                cursor: "pointer",
            }}
        >
            <span>{label}</span>
            {typeof count === "number" ? (
                <span style={{ padding: "2px 8px", borderRadius: 999, background: "rgba(59,130,246,0.22)", fontSize: 12, fontWeight: 700 }}>
                    {count}
                </span>
            ) : null}
        </button>
    );
}

function ShellHeader({ chromeMode }: { chromeMode: ShellChromeMode }) {
    const connection = useRealtimeConnection();
    const maintenanceMode = useRealtimeMaintenanceMode();
    const notificationUnreadCount = useNotificationUnreadCount();
    const chatUnreadCount = useChatUnreadCount();
    const session = useRealtimeSession();

    if (chromeMode === "hidden") return null;

    return (
        <header className="sticky w-full top-0 py-2 z-1 flex justify-between items-center pl-4
            border-b overflow-hidden min-h-[4rem] 
            border-gray-200
            dark:border-stone-800 dark:bg-stone-900"
        >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <StatusPill online={connection.user} label="User socket" />
                <StatusPill online={connection.chat} label="Chat socket" />
                <StatusPill online={connection.admin} label="Admin socket" />
                {maintenanceMode ? (
                    <span style={{ padding: "6px 10px", borderRadius: 999, background: "rgba(245,158,11,0.16)", color: "#fcd34d", fontSize: 12, fontWeight: 700 }}>
                        Maintenance mode
                    </span>
                ) : null}
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <HeaderAction label="Notifiche" count={notificationUnreadCount} onClick={() => toggleGlobalPanel("notifications", { source: "shell-header" })} />
                <HeaderAction label="Chat" count={chatUnreadCount} onClick={() => toggleGlobalPanel("chat", { source: "shell-header" })} />
                <HeaderAction label={`Utente${session?.details?.nome ? ` · ${session.details.nome}` : ""}`} onClick={() => toggleGlobalPanel("profile", { source: "shell-header" })} />
            </div>
        </header>
    );
}

export default function ShellLayout({ children }: Props) {
    const location = useLocation();
    const activeMicrofrontend = resolveActiveMicrofrontend(location as any);
    const chromeMode = activeMicrofrontend?.chrome ?? "minimal";
    const showSidebar = chromeMode === "full";
    const showHeader = chromeMode !== "hidden";

    if (chromeMode === "hidden") {
        return (
            <main style={{ position: "relative", width: "100%", height: "100%", background: "#020617" }}>
                {children}
            </main>
        );
    }

    return (
        <div style={{ /*display: "grid", gridTemplateColumns: showSidebar ? "260px 1fr" : "1fr",*/ width: "100%", height: "100%" }}>
            {showSidebar ? (
                <aside style={{ background: "#111827", borderRight: "1px solid rgba(148,163,184,0.15)", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>NEX Shell</div>
                    {Object.values(MICROFRONTENDS).map((mfe) => (
                        <NavItem key={mfe.name} to={mfe.route} label={mfe.label} />
                    ))}
                </aside>
            ) : null}

            <ShellHeader chromeMode={chromeMode} />
            <main style={{ minWidth: 0, minHeight: 0, background: "#020617" }}>
                {children}
            </main>

            {/*<section style={{ display: "grid", gridTemplateRows: showHeader ? "64px 1fr" : "1fr", minWidth: 0 }}>
                <ShellHeader chromeMode={chromeMode} />
                <main style={{ position: "relative", minWidth: 0, minHeight: 0, background: "#020617" }}>
                    {children}
                </main>
            </section>*/}
        </div>
    );
}
