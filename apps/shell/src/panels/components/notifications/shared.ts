import type { CreateNotificationPayload, SharedSessionSnapshot } from "@nex/shared-platform";

export type NotificationItem = {
    _id: string;
    Name?: string;
    Type?: string;
    Title?: string;
    Date?: string | Date;
    Viewd?: boolean;
    tags?: string[];
    senderDetails?: {
        nome?: string;
        cognome?: string;
        immagini?: {
            avatar?: string;
            cover?: string;
        };
    };
};

export type FilterKey = "all" | "unread" | "read";
export type NotificationType = CreateNotificationPayload["type"];
export type NotificationModality = CreateNotificationPayload["modality"];
export type UsersTargetStatus = CreateNotificationPayload["usersTargetStatus"];

export type SenderOption = {
    key: "user" | "system";
    label: string;
    nome: string;
    fullName: string;
    system: boolean;
};

export type NotificationDraft = {
    senderKey: SenderOption["key"];
    type: NotificationType;
    modality: NotificationModality;
    usersTargetStatus: UsersTargetStatus;
    targetRole: string;
    user_target: string[];
    desc: string;
    timerMode: boolean;
    timer?: string;
};

export const API_USERS = import.meta.env.VITE_API_USERS;
export const ROLES_ENV = import.meta.env.VITE_ROLES;

export const FILTER_DEFINITIONS: Array<{ key: FilterKey; label: string }> = [
    { key: "all", label: "Tutte" },
    { key: "unread", label: "Da leggere" },
    { key: "read", label: "Lette" },
];

export const TYPE_OPTIONS: NotificationType[] = ["Manutenzione", "Info", "Allert"];
export const MODALITY_OPTIONS: NotificationModality[] = ["Generale", "Singola", "Ruolo"];
export const USER_STATUS_OPTIONS: UsersTargetStatus[] = ["Tutti", "Online", "Offline", "Assente"];

export function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

export function safeParseRoles(raw: string | undefined): string[] {
    if (!raw) return [];

    try {
        return Object.values(JSON.parse(raw) as Record<string, string>).filter((role) => role && role !== "Dev");
    } catch {
        return [];
    }
}

export function createDefaultDraft(): NotificationDraft {
    return {
        senderKey: "user",
        type: "Manutenzione",
        modality: "Generale",
        usersTargetStatus: "Tutti",
        targetRole: "",
        user_target: [],
        desc: "",
        timerMode: false,
    };
}

export function formatTimeAgo(input?: string | Date) {
    if (!input) return "Data non disponibile";

    const date = new Date(input);
    if (Number.isNaN(date.getTime())) return "Data non disponibile";

    const diffMs = date.getTime() - Date.now();
    const rtf = new Intl.RelativeTimeFormat("it", { numeric: "auto" });
    const minutes = Math.round(diffMs / 60_000);
    const hours = Math.round(diffMs / 3_600_000);
    const days = Math.round(diffMs / 86_400_000);

    if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
    if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
    return rtf.format(days, "day");
}

export function formatLocalDateTimeInput(date: Date) {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
}

export function getSenderOptions(session: SharedSessionSnapshot | null | undefined): SenderOption[] {
    const name = `${session?.details?.nome ?? ""} ${session?.details?.cognome ?? ""}`.trim();

    return [
        {
            key: "user",
            label: name || (session?.details?.username as string) || "Utente corrente",
            nome: String(session?.details?.nome ?? session?.details?.username ?? "Utente"),
            fullName: name || String(session?.details?.username ?? "Utente corrente"),
            system: false,
        },
        {
            key: "system",
            label: "Sistema",
            nome: "Sistema",
            fullName: "Sistema",
            system: true,
        },
    ];
}

export function typePillClass(type?: string) {
    const key = (type || "").toLowerCase();
    switch (key) {
        case "allert":
            return "bg-orange-100 text-orange-800 dark:bg-orange-400/20 dark:text-orange-300";
        case "manutenzione":
            return "bg-rose-100 text-rose-800 dark:bg-rose-400/20 dark:text-rose-300";
        case "info":
            return "bg-amber-100 text-amber-800 dark:bg-amber-400/20 dark:text-amber-300";
        case "pagamenti":
            return "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-400/20 dark:text-fuchsia-300";
        default:
            return "bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-200";
    }
}
