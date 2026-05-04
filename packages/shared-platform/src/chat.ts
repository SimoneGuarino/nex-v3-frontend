import { getChatSocket } from "@nex/realtime-core";
import { readToken, readSharedSessionSnapshot } from "./session";

export type ChatUserLite = { _id: string; nome?: string; cognome?: string };
export type ChatMessage = {
    _id?: string;
    msg: string;
    viewed?: boolean;
    date?: string | Date;
    user?: ChatUserLite;
    attachments?: unknown[];
    [key: string]: unknown;
};

export type ChatBlock = {
    idBlock: string;
    titleBlock?: string;
    path: string;
    disabilitato?: boolean;
    users?: ChatUserLite[];
    messages: ChatMessage[];
    lastInteraction?: number;
    [key: string]: unknown;
};

async function postJson<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json() as Promise<T>;
}

export async function loadChatMessages(options: { apiChat: string; idBlock?: string | null; oldestMessageDateByIdBlock?: Date | null; newestMessageDateByIdBlock?: Date | null; token?: string; }): Promise<{ remoteMessages: ChatMessage[]; isBlockDisabled?: boolean }> {
    const tk = options.token ?? readToken();
    if (!tk) throw new Error("Missing token");
    const payload: Record<string, unknown> = { tk, idb: options.idBlock ?? null };
    if (options.newestMessageDateByIdBlock) payload.newmsg = options.newestMessageDateByIdBlock;
    else if (options.oldestMessageDateByIdBlock) payload.oldmsg = options.oldestMessageDateByIdBlock;
    return postJson<{ remoteMessages: ChatMessage[]; isBlockDisabled?: boolean }>(`${options.apiChat}chats/h4jwekagk3z52j9c2siy`, payload);
}

export async function searchChatUsers(options: { apiChat: string; search: string; token?: string; }): Promise<Array<Record<string, unknown>>> {
    const tk = options.token ?? readToken();
    if (!tk) throw new Error("Missing token");
    return postJson<Array<Record<string, unknown>>>(`${options.apiChat}chats/tj8c7iywkj09pn4jf4cx`, { tk, sstr: options.search });
}

export async function ensureChatBlock(options: { apiChat: string; data: Record<string, unknown>; type: 0 | 1 | 2; idBlock?: string | null; }): Promise<string | null | undefined> {
    const response = await postJson<{ status: boolean; idb_gen: string | null }>(`${options.apiChat}chats/illoggicxzgsdqw8nyem`, {
        dt: options.data,
        tp: options.type,
    });
    if (!response.status) return options.idBlock ?? null;
    return options.idBlock ?? response.idb_gen ?? null;
}

export function sendChatMessage(options: { idBlock: string; path: string; message: string; }): Promise<{ status: boolean; message_id: string }> {
    const chatSocket = getChatSocket();
    const session = readSharedSessionSnapshot();
    const details = session?.details;
    if (!details?._id) return Promise.reject(new Error("Missing user details"));
    return new Promise((resolve, reject) => {
        try {
            chatSocket.emit(
                "privateMessage",
                {
                    idBlock: options.idBlock,
                    path: options.path,
                    user: { _id: details._id, nome: details.nome, cognome: details.cognome },
                    msg: options.message,
                    viewed: false,
                    date: new Date(),
                    attachments: [],
                },
                (response: { status: boolean; message_id: string }) => {
                    if (!response?.status) {
                        reject(new Error("Socket send failed"));
                        return;
                    }
                    resolve(response);
                },
            );
        } catch (error) {
            reject(error as Error);
        }
    });
};