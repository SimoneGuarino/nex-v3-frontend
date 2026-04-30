import { readSharedSessionSnapshot } from "./session";

export type CreateNotificationPayload = {
    user_from: string;
    user_from_details: { nome: string; fullName: string; system: boolean };
    user_target: string[];
    type: "Manutenzione" | "Info" | "Allert";
    modality: "Generale" | "Singola" | "Ruolo";
    usersTargetStatus: "Tutti" | "Online" | "Offline" | "Assente";
    desc: string;
    timerMode: boolean;
    timer?: string;
    targetRole?: string;
    usersTargetCodiceBuyer?: string;
};

async function postJson<T>(url: string, body: unknown, token?: string | null): Promise<T> {
    const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw data?.message?.msg || data?.msg || data?.message || "Richiesta notifiche non riuscita";
    }

    return data as T;
}

function requireToken(explicitToken?: string): string {
    const token = explicitToken ?? readSharedSessionSnapshot()?.token;
    if (!token) throw new Error("Sessione utente non disponibile.");
    return token;
}

export async function createNotification(args: {
    apiUsersEndpoint: string;
    body: CreateNotificationPayload;
    token?: string;
}): Promise<void> {
    const token = requireToken(args.token);
    await postJson(`${args.apiUsersEndpoint}notifications/create`, { tk: token, ...args.body }, token);
}

export async function markNotificationViewed(args: {
    apiUsersEndpoint: string;
    notificationId?: string;
    all?: boolean;
    token?: string;
}): Promise<void> {
    const token = requireToken(args.token);
    await postJson(
        `${args.apiUsersEndpoint}zt688wm2t88fsrj40bxz`,
        {
            tk: token,
            eid: args.notificationId,
            ...(args.all ? { tp: 1 } : {}),
        },
        token,
    );
}

export async function deleteNotification(args: {
    apiUsersEndpoint: string;
    notificationId?: string;
    all?: boolean;
    token?: string;
}): Promise<void> {
    const token = requireToken(args.token);
    await postJson(
        `${args.apiUsersEndpoint}s0i54hcrhee1o77fq2ix`,
        {
            tk: token,
            eid: args.notificationId,
            ...(args.all ? { tp: 1 } : {}),
        },
        token,
    );
}
