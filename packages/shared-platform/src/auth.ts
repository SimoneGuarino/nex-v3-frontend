import Cookies from "js-cookie";
import {
    invalidateSharedSession,
    persistCryptoSession,
    persistSessionSnapshot,
    persistToken,
    publishSessionSnapshot,
    type SharedSessionDetails,
    readSharedSessionSnapshot,
    readRememberMePreference,
    type SharedSessionSnapshot,
} from "./session";

const DEFAULT_TENANT = "Focelda";
const DEFAULT_APP_ID = "legacy";

type RuntimeEntitlementsResponse = {
    tenant?: string;
    appId?: string;
    actorTeamKey?: string | null;
    activeGroupKey?: string | null;
    activeGroupId?: string | null;
    defaultGroupContextId?: string | null;
    groupContexts?: unknown[];
    version?: string | null;
    directGroupIds?: string[];
    groupIds?: string[];
    groups?: unknown[];
    grants?: unknown[];
    caps?: string[];
    panels?: unknown[];
    resources?: unknown[];
    denied?: unknown[];
    meta?: Record<string, unknown>;
};

function normalizeBaseUrl(value: string): string {
    if (!value) return "";
    return value.endsWith("/") ? value : `${value}/`;
}

function joinUrl(base: string, path: string): string {
    const normalizedBase = normalizeBaseUrl(base);
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return `${normalizedBase}${cleanPath}`;
}

function toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];

    const seen = new Set<string>();
    const out: string[] = [];

    for (const item of value) {
        if (typeof item !== "string") continue;
        const next = item.trim();
        if (!next || seen.has(next)) continue;
        seen.add(next);
        out.push(next);
    }

    return out;
}

function asNonEmptyString(value: unknown, fallback: string): string {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function readAuthzTenant(details: SharedSessionDetails): string {
    const authz = details.authz as Record<string, unknown> | undefined;
    return asNonEmptyString(authz?.tenant ?? details.tenant, DEFAULT_TENANT);
}

function hexStringToArrayBuffer(hexString: string): ArrayBuffer {
    const byteArray = new Uint8Array(
        hexString.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || [],
    );
    return byteArray.buffer;
}

async function decryptAES(
    encryptedData: string,
    secretKeyHex: string,
    ivHex: string,
): Promise<string> {
    const secretKey = hexStringToArrayBuffer(secretKeyHex);
    const iv = hexStringToArrayBuffer(ivHex);
    const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        secretKey,
        { name: "AES-CBC" },
        false,
        ["decrypt"],
    );
    const encryptedArrayBuffer = hexStringToArrayBuffer(encryptedData);
    const decryptedData = await window.crypto.subtle.decrypt(
        { name: "AES-CBC", iv },
        cryptoKey,
        encryptedArrayBuffer,
    );
    return new TextDecoder().decode(decryptedData);
}

async function encryptRSA(pem: string, dataToEncrypt: string): Promise<string> {
    const header = "-----BEGIN PUBLIC KEY-----";
    const footer = "-----END PUBLIC KEY-----";
    const pemContents = pem
        .replace(header, "")
        .replace(footer, "")
        .replace(/\s+/g, "");
    const binaryDerString = window.atob(pemContents);
    const binaryDer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i += 1)
        binaryDer[i] = binaryDerString.charCodeAt(i);
    const publicKey = await window.crypto.subtle.importKey(
        "spki",
        binaryDer.buffer,
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["encrypt"],
    );
    const encryptedData = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        publicKey,
        new TextEncoder().encode(dataToEncrypt),
    );
    return btoa(String.fromCharCode(...new Uint8Array(encryptedData)));
}

async function fetchJson<T>(url: string, init: RequestInit): Promise<T> {
    const res = await fetch(url, init);
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
        throw data?.message?.msg || data?.msg || "Richiesta non riuscita";
    return data as T;
}

function normalizeSharedUserDetails(details: SharedSessionDetails): SharedSessionDetails {
    const nextDetails = { ...details };
    const authz = nextDetails.authz as { caps?: unknown } | undefined;
    if (authz && !Array.isArray(authz.caps)) {
        nextDetails.authz = {
            ...authz,
            caps: [],
        };
    }
    return nextDetails;
}

function mergeDetailsWithEntitlements(
    details: SharedSessionDetails,
    entitlements: RuntimeEntitlementsResponse,
): SharedSessionDetails {
    const previousAuthz = details.authz && typeof details.authz === "object"
        ? details.authz as Record<string, unknown>
        : {};

    return {
        ...details,
        authz: {
            ...previousAuthz,
            tenant: asNonEmptyString(entitlements.tenant, readAuthzTenant(details)),
            appId: asNonEmptyString(entitlements.appId, DEFAULT_APP_ID),
            actorTeamKey: entitlements.actorTeamKey ?? null,
            activeGroupKey: entitlements.activeGroupKey ?? entitlements.actorTeamKey ?? null,
            activeGroupId: entitlements.activeGroupId ?? null,
            defaultGroupContextId: entitlements.defaultGroupContextId ?? null,
            groupContexts: Array.isArray(entitlements.groupContexts) ? entitlements.groupContexts : [],
            version: entitlements.version ?? null,
            directGroupIds: toStringArray(entitlements.directGroupIds),
            groupIds: toStringArray(entitlements.groupIds),
            groups: Array.isArray(entitlements.groups) ? entitlements.groups : [],
            grants: Array.isArray(entitlements.grants) ? entitlements.grants : [],
            caps: toStringArray(entitlements.caps),
            panels: Array.isArray(entitlements.panels) ? entitlements.panels : (Array.isArray(previousAuthz.panels) ? previousAuthz.panels : []),
            resources: Array.isArray(entitlements.resources) ? entitlements.resources : [],
            denied: Array.isArray(entitlements.denied) ? entitlements.denied : [],
            meta: entitlements.meta && typeof entitlements.meta === "object" ? entitlements.meta : undefined,
        },
    };
}

async function fetchUserDetailsByToken(args: {
    apiEndpoint: string;
    token: string;
    aes: string;
    vi: string;
}): Promise<SharedSessionDetails> {
    const userPayload = await fetchJson<any>(
        joinUrl(args.apiEndpoint, "842980hdjabfsy72/812has"),
        {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${args.token}`,
            },
            body: JSON.stringify({ tk: args.token }),
        },
    );

    const details = JSON.parse(
        await decryptAES(userPayload.dt, args.aes, args.vi),
    ) as SharedSessionDetails;

    return normalizeSharedUserDetails(details);
}

async function fetchSessionEntitlements(args: {
    apiEndpoint: string;
    token: string;
    tenant: string;
    appId?: string;
    includeActions?: boolean;
}): Promise<RuntimeEntitlementsResponse> {
    const query = new URLSearchParams({
        tenant: args.tenant,
        appId: args.appId || DEFAULT_APP_ID,
    });

    if (args.includeActions !== false) {
        query.set("includeActions", "true");
    }

    return fetchJson<RuntimeEntitlementsResponse>(
        joinUrl(args.apiEndpoint, `entitlements/navigation?${query.toString()}`),
        {
            method: "GET",
            credentials: "include",
            headers: {
                Authorization: `Bearer ${args.token}`,
            },
        },
    );
}

async function fetchHydratedSessionDetails(args: {
    apiEndpoint: string;
    token: string;
    aes: string;
    vi: string;
    tenant?: string;
    appId?: string;
    includeActions?: boolean;
}): Promise<SharedSessionDetails> {
    const details = await fetchUserDetailsByToken({
        apiEndpoint: args.apiEndpoint,
        token: args.token,
        aes: args.aes,
        vi: args.vi,
    });

    const entitlements = await fetchSessionEntitlements({
        apiEndpoint: args.apiEndpoint,
        token: args.token,
        tenant: args.tenant || readAuthzTenant(details),
        appId: args.appId || DEFAULT_APP_ID,
        includeActions: args.includeActions,
    });

    return mergeDetailsWithEntitlements(details, entitlements);
}

export async function loginWithCredentials(args: {
    apiEndpoint: string;
    username: string;
    password: string;
    rememberMe: boolean;
    tenant?: string;
    appId?: string;
}): Promise<{ token: string; details: SharedSessionDetails }> {
    const username = args.username.toLowerCase();
    const tempKey = await fetchJson<{ pbk: string }>(
        joinUrl(args.apiEndpoint, "hNzsua12vkie421O/8d21as"),
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usr: username }),
        },
    );

    const encryptedPassword = await encryptRSA(
        tempKey.pbk,
        JSON.stringify({ psw: args.password }),
    );

    const loginResponse = await fetchJson<any>(
        joinUrl(args.apiEndpoint, "hNz5S3AxgzodGuzD/hdaa1A"),
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usr: username, pdd: encryptedPassword }),
        },
    );

    const aes = loginResponse.sct.ae;
    const vi = loginResponse.sct.ve;
    const rsa = await decryptAES(loginResponse.sct.ra, aes, vi);
    const token = await decryptAES(loginResponse.sct.tk, aes, vi);

    persistToken(token, args.rememberMe);
    persistCryptoSession({ aes, rsa, vi });

    const details = await fetchHydratedSessionDetails({
        apiEndpoint: args.apiEndpoint,
        token,
        aes,
        vi,
        tenant: args.tenant,
        appId: args.appId,
        includeActions: true,
    });

    persistSessionSnapshot(
        { token, details, issuedAt: Date.now() },
        { rememberMe: args.rememberMe },
    );

    return { token, details };
}

export function hydrateSharedSession(): SharedSessionSnapshot | null {
    return readSharedSessionSnapshot();
}

export async function ensureHydratedSharedSession(args: {
    apiEndpoint: string;
    force?: boolean;
    tenant?: string;
    appId?: string;
}): Promise<SharedSessionSnapshot | null> {
    const snapshot = readSharedSessionSnapshot();
    if (!snapshot?.token) return null;
    if (snapshot.details && !args.force) return snapshot;

    const aes = Cookies.get("aes");
    const vi = Cookies.get("vi");

    if (!aes || !vi) {
        invalidateSharedSession({
            reason: "missing-token",
            source: "ensure-hydrated-shared-session",
            message: "Sessione crittografica non disponibile.",
        });
        return null;
    }

    try {
        const parsedAes = JSON.parse(aes) as string;
        const parsedVi = JSON.parse(vi) as string;
        const details = await fetchHydratedSessionDetails({
            apiEndpoint: args.apiEndpoint,
            token: snapshot.token,
            aes: parsedAes,
            vi: parsedVi,
            tenant: args.tenant,
            appId: args.appId,
            includeActions: true,
        });

        const nextSnapshot: SharedSessionSnapshot = {
            token: snapshot.token,
            details,
            issuedAt: Date.now(),
        };

        persistSessionSnapshot(nextSnapshot, {
            rememberMe: readRememberMePreference(),
        });
        return nextSnapshot;
    } catch (error) {
        console.error("[shared-platform] ensureHydratedSharedSession failed", error);
        invalidateSharedSession({
            reason: "session-hydration-failed",
            source: "ensure-hydrated-shared-session",
            message: String((error as Error)?.message ?? error),
        });
        return null;
    }
}

export function logoutSharedSession() {
    invalidateSharedSession({
        reason: "logout",
        source: "logout-shared-session",
    });
}
