import {
    readSharedSessionSnapshot,
    type SharedSessionSnapshot,
} from "@nex/shared-platform";
import { createRealtimeSocket, SOCKET_PATHS } from "./createRealtimeSocket";
import type { RealtimeEvent, RealtimeListener } from "./types";

class RealtimeKernel {
    private readonly listeners = new Set<RealtimeListener>();
    private session: SharedSessionSnapshot | null = null;
    private started = false;
    private forceLogoutHandler: (() => void) | null = null;
    private startedUserId: string | null = null;

    readonly userSocket = createRealtimeSocket(SOCKET_PATHS.user, { autoConnect: true });
    readonly chatSocket = createRealtimeSocket(SOCKET_PATHS.chat);
    readonly adminSocket = createRealtimeSocket(SOCKET_PATHS.admin);

    constructor() {
        this.bindStaticSocketEvents();
    }

    private emit(event: RealtimeEvent): void {
        this.listeners.forEach((listener) => listener(event));
    }

    private ensureConnected(): void {
        if (!this.userSocket.connected) {
            this.userSocket.connect();
        }
        if (!this.adminSocket.connected) {
            this.adminSocket.connect();
        }
        if (!this.chatSocket.connected) {
            this.chatSocket.connect();
        }
    }

    private bindStaticSocketEvents(): void {
        this.userSocket.on("connect", () => {
            this.emit({ type: "connection-state", payload: { channel: "user", connected: true } });
            if (this.startedUserId) {
                this.userSocket.emit("userConnected", this.startedUserId);
            }
        });
        this.userSocket.on("disconnect", () => {
            this.emit({ type: "connection-state", payload: { channel: "user", connected: false } });
        });
        this.userSocket.on("NTIF", (payload: { ntif?: unknown | unknown[]; all?: boolean }) => {
            if (payload?.all) {
                this.emit({ type: "notification-batch", payload: Array.isArray(payload.ntif) ? payload.ntif as any[] : [] });
                return;
            }
            if (payload?.ntif && !Array.isArray(payload.ntif)) {
                this.emit({ type: "notification-received", payload: payload.ntif as any });
            }
        });

        this.chatSocket.on("connect", () => {
            this.emit({ type: "connection-state", payload: { channel: "chat", connected: true } });
            if (this.startedUserId) {
                this.chatSocket.emit("join", { userId: this.startedUserId });
            }
        });
        this.chatSocket.on("disconnect", () => {
            this.emit({ type: "connection-state", payload: { channel: "chat", connected: false } });
        });
        this.chatSocket.on("receiveMessage", (payload: unknown) => {
            this.emit({ type: "chat-message", payload });
        });
        this.chatSocket.on("changeViewd", (idBlock: string, path: string) => {
            this.emit({ type: "chat-viewed", payload: { idBlock, path } });
        });
        this.chatSocket.on("sbloccoOrdiniUnread", (payload: unknown) => {
            this.emit({ type: "sblocco-ordini-unread", payload });
        });
        this.chatSocket.on("sbloccoOrdiniRead", (payload: unknown) => {
            this.emit({ type: "sblocco-ordini-read", payload });
        });
        this.chatSocket.on("messages", (payload: unknown[]) => {
            this.emit({ type: "chat-message-list", payload });
        });
        this.chatSocket.on("blockend", (idBlock: string) => {
            this.emit({ type: "chat-block-end", payload: { idBlock } });
        });
        this.chatSocket.on("fileuploaded", (payload: { idBlock: string; path: string; messageId: string }) => {
            this.emit({ type: "chat-file-uploaded", payload });
        });

        this.adminSocket.on("connect", () => {
            this.emit({ type: "connection-state", payload: { channel: "admin", connected: true } });
            if (this.startedUserId) {
                this.adminSocket.emit("userConnected", this.startedUserId);
                this.adminSocket.emit("MTCStatus");
            }
        });
        this.adminSocket.on("disconnect", () => {
            this.emit({ type: "connection-state", payload: { channel: "admin", connected: false } });
        });
        this.adminSocket.on("MTCStatus", (raw: unknown) => {
            this.emit({
                type: "maintenance-status",
                payload: { maintenanceMode: Boolean((raw as { Manutenzione?: boolean } | null)?.Manutenzione), raw },
            });
        });
        this.adminSocket.on("usersOnline", (updatedUsers: unknown[]) => {
            this.emit({ type: "users-online", payload: updatedUsers });
        });
        this.adminSocket.on("userBannedStatusUpdate", (payload: unknown) => {
            this.emit({ type: "user-banned-status-update", payload });
            const currentUserId = this.session?.details?._id;
            const eventUser = payload as { userId?: string; disabilitato?: boolean } | null;
            if (eventUser?.disabilitato && currentUserId && eventUser.userId === currentUserId) {
                this.forceLogoutHandler?.();
            }
        });
    }

    subscribe(listener: RealtimeListener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    setForceLogoutHandler(handler: (() => void) | null): void {
        this.forceLogoutHandler = handler;
    }

    setSession(nextSession: SharedSessionSnapshot | null): void {
        this.session = nextSession;
        this.emit({ type: "session-changed", payload: nextSession });
    }

    start(session = readSharedSessionSnapshot()): void {
        this.setSession(session);
        const nextUserId = session?.details?._id ?? null;

        if (!session?.token || !nextUserId) {
            this.stop();
            return;
        }

        this.started = true;
        this.startedUserId = nextUserId;
        this.ensureConnected();

        this.userSocket.emit("userConnected", nextUserId);
        this.adminSocket.emit("userConnected", nextUserId);
        this.adminSocket.emit("MTCStatus");
        this.chatSocket.emit("join", { userId: nextUserId });
    }

    stop(): void {
        this.started = false;
        this.startedUserId = null;
        this.userSocket.disconnect();
        this.chatSocket.disconnect();
        this.adminSocket.disconnect();
    }

    markUserState(status: "Online" | "Assente"): void {
        const userId = this.session?.details?._id;
        if (!userId) return;
        if (!this.userSocket.connected) {
            this.userSocket.connect();
        }
        this.userSocket.emit("userChangeState", userId, status);
    }
}

declare global {
    interface Window {
        __NEX_REALTIME_KERNEL__?: RealtimeKernel;
    }
}

export function getRealtimeKernel(): RealtimeKernel {
    if (typeof window === "undefined") {
        return new RealtimeKernel();
    }

    if (!window.__NEX_REALTIME_KERNEL__) {
        window.__NEX_REALTIME_KERNEL__ = new RealtimeKernel();
    }

    return window.__NEX_REALTIME_KERNEL__;
}
