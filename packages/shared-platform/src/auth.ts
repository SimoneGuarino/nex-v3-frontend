import Cookies from "js-cookie";
import {
    clearSession,
    persistCryptoSession,
    persistSessionSnapshot,
    persistToken,
    persistUserDetails,
    publishSessionSnapshot,
    type SharedSessionDetails,
    readSharedSessionSnapshot,
    readRememberMePreference,
    type SharedSessionSnapshot,
} from "./session";

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

async function fetchUserDetailsByToken(args: {
    apiEndpoint: string;
    token: string;
    aes: string;
    vi: string;
}): Promise<SharedSessionDetails> {
    const userPayload = await fetchJson<any>(
        `${args.apiEndpoint}842980hdjabfsy72/812has`,
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

export async function loginWithCredentials(args: {
    apiEndpoint: string;
    username: string;
    password: string;
    rememberMe: boolean;
}): Promise<{ token: string; details: SharedSessionDetails }> {
    const username = args.username.toLowerCase();
    const tempKey = await fetchJson<{ pbk: string }>(
        `${args.apiEndpoint}hNzsua12vkie421O/8d21as`,
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
        `${args.apiEndpoint}hNz5S3AxgzodGuzD/hdaa1A`,
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

    const details = await fetchUserDetailsByToken({
        apiEndpoint: args.apiEndpoint,
        token,
        aes,
        vi,
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
}): Promise<SharedSessionSnapshot | null> {
    const snapshot = readSharedSessionSnapshot();
    if (!snapshot?.token) return null;
    if (snapshot.details && !args.force) return snapshot;

    const aes = Cookies.get("aes");
    const vi = Cookies.get("vi");

    if (!aes || !vi) {
        clearSession();
        return null;
    }

    try {
        const parsedAes = JSON.parse(aes) as string;
        const parsedVi = JSON.parse(vi) as string;
        const details = await fetchUserDetailsByToken({
            apiEndpoint: args.apiEndpoint,
            token: snapshot.token,
            aes: parsedAes,
            vi: parsedVi,
        });

        const nextSnapshot: SharedSessionSnapshot = {
            token: snapshot.token,
            details,
            issuedAt: Date.now(),
        };

        persistUserDetails(details, readRememberMePreference());
        publishSessionSnapshot(nextSnapshot);
        return nextSnapshot;
    } catch (error) {
        console.error("[shared-platform] ensureHydratedSharedSession failed", error);
        clearSession();
        return null;
    }
}

export function logoutSharedSession() {
    clearSession();
}
