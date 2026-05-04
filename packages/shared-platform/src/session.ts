import Cookies from "js-cookie";

export const STORAGE_KEYS = {
    token: "token",
    rememberMe: "rememberMe",
    user: "userData",
    logoutSignal: "logout",
} as const;

export type SharedSessionDetails = {
    _id?: string;
    nome?: string;
    cognome?: string;
    ruolo?: string | number;
    permissions?: Array<string | number>;
    stato?: {
        ultimoAccesso?: string;
        codice?: string;
        [key: string]: unknown;
    };
    immagini?: {
        avatar?: string;
        cover?: string;
    };
    [key: string]: unknown;
};

export type SharedSessionSnapshot = {
    token: string | null;
    details?: SharedSessionDetails;
    issuedAt: number;
};

type SessionRegistry = {
    snapshot: SharedSessionSnapshot | null;
    listeners: Set<(snapshot: SharedSessionSnapshot | null) => void>;
};

declare global {
    interface Window {
        __NEX_SHARED_PLATFORM__?: SessionRegistry;
    }
}

function getRegistry(): SessionRegistry {
    if (typeof window === "undefined") {
        return { snapshot: null, listeners: new Set() };
    }

    if (!window.__NEX_SHARED_PLATFORM__) {
        window.__NEX_SHARED_PLATFORM__ = {
            snapshot: null,
            listeners: new Set(),
        };
    }

    return window.__NEX_SHARED_PLATFORM__;
}

export function readToken(): string | null {
    if (typeof window === "undefined") return null;
    return (
        window.localStorage.getItem(STORAGE_KEYS.token) ??
        window.sessionStorage.getItem(STORAGE_KEYS.token)
    );
}

export function readRememberMe(): boolean {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEYS.rememberMe) === "true";
}

/**
 * Alias pubblico più esplicito, utile per evitare mismatch nei consumer.
 */
export function readRememberMePreference(): boolean {
    return readRememberMe();
}

export function readStoredUserDetails(): SharedSessionDetails | undefined {
    if (typeof window === "undefined") return undefined;

    const raw =
        window.localStorage.getItem(STORAGE_KEYS.user) ??
        window.sessionStorage.getItem(STORAGE_KEYS.user);

    if (!raw) return undefined;

    try {
        return JSON.parse(raw) as SharedSessionDetails;
    } catch {
        return undefined;
    }
}

export function persistToken(token: string, rememberMe: boolean): void {
    if (typeof window === "undefined") return;

    const target = rememberMe ? window.localStorage : window.sessionStorage;
    const other = rememberMe ? window.sessionStorage : window.localStorage;

    other.removeItem(STORAGE_KEYS.token);
    target.setItem(STORAGE_KEYS.token, token);
    window.localStorage.setItem(STORAGE_KEYS.rememberMe, String(rememberMe));
}

export function persistUserDetails(
    details: SharedSessionDetails,
    rememberMe = readRememberMe(),
): void {
    if (typeof window === "undefined") return;

    const target = rememberMe ? window.localStorage : window.sessionStorage;
    const other = rememberMe ? window.sessionStorage : window.localStorage;

    other.removeItem(STORAGE_KEYS.user);
    target.setItem(STORAGE_KEYS.user, JSON.stringify(details));
}

export function persistCryptoSession(values: {
    aes: string;
    rsa: string;
    vi: string;
}): void {
    Cookies.set("aes", JSON.stringify(values.aes));
    Cookies.set("rsa", JSON.stringify(values.rsa));
    Cookies.set("vi", JSON.stringify(values.vi));
}

export function clearSession(): void {
    if (typeof window === "undefined") return;

    window.localStorage.removeItem(STORAGE_KEYS.token);
    window.localStorage.removeItem(STORAGE_KEYS.rememberMe);
    window.localStorage.removeItem(STORAGE_KEYS.user);
    window.sessionStorage.removeItem(STORAGE_KEYS.token);
    window.sessionStorage.removeItem(STORAGE_KEYS.user);

    Cookies.remove("aes");
    Cookies.remove("rsa");
    Cookies.remove("vi");

    publishSessionSnapshot(null);
}

export function buildSessionSnapshotFromStorage(): SharedSessionSnapshot | null {
    const token = readToken();
    if (!token) return null;

    return {
        token,
        details: readStoredUserDetails(),
        issuedAt: Date.now(),
    };
}

/**
 * Helper unico per persistere snapshot completo.
 * È l'API giusta da usare nei consumer al posto di combinare manualmente persistToken + persistUserDetails + publishSessionSnapshot.
 */
export function persistSessionSnapshot(
    snapshot: SharedSessionSnapshot | null,
    options?: { rememberMe?: boolean },
): void {
    if (!snapshot?.token) {
        clearSession();
        return;
    }

    const rememberMe = options?.rememberMe ?? readRememberMe();

    persistToken(snapshot.token, rememberMe);

    if (snapshot.details) {
        persistUserDetails(snapshot.details, rememberMe);
    }

    publishSessionSnapshot({
        token: snapshot.token,
        details: snapshot.details,
        issuedAt: snapshot.issuedAt ?? Date.now(),
    });
}

export function readSharedSessionSnapshot(): SharedSessionSnapshot | null {
    const registry = getRegistry();
    if (registry.snapshot) return registry.snapshot;

    const snapshot = buildSessionSnapshotFromStorage();
    registry.snapshot = snapshot;
    return snapshot;
}

export function publishSessionSnapshot(
    snapshot: SharedSessionSnapshot | null,
): void {
    const registry = getRegistry();
    registry.snapshot = snapshot;
    registry.listeners.forEach((listener) => listener(snapshot));

    if (typeof window !== "undefined") {
        window.dispatchEvent(
            new CustomEvent("nex:session-changed", { detail: snapshot }),
        );
    }
}

export function subscribeSessionSnapshot(
    listener: (snapshot: SharedSessionSnapshot | null) => void,
): () => void {
    const registry = getRegistry();
    registry.listeners.add(listener);

    return () => {
        registry.listeners.delete(listener);
    };
}

export function broadcastLogout(): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.logoutSignal, Date.now().toString());
}