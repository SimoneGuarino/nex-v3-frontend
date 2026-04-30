import { io, type ManagerOptions, type Socket, type SocketOptions } from "socket.io-client";

export const SOCKET_PATHS = {
    user: "/socket.io/n9m3fs6fvdmgds2bjoo9/",
    chat: "/socket.io/2l7wh6keja8fkzbxi27f/",
    admin: "/socket.io/k0f2cje9xkf3hlmc6s6w/",
} as const;

let serverHost = "";

export function configureRealtimeCore(config: { serverHost: string }) {
    serverHost = config.serverHost;
}

export function createRealtimeSocket(
    path: string,
    options: Partial<ManagerOptions & SocketOptions> = {},
): Socket {
    if (!serverHost) {
        throw new Error("Realtime core non configurato: serverHost mancante");
    }

    return io(serverHost, {
        path,
        transports: ["websocket"],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        autoConnect: false,
        ...options,
    });
}