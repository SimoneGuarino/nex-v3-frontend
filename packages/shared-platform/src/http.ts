import { invalidateSharedSession, readToken } from "./session";

export class ApiHttpError extends Error {
    readonly status: number;
    readonly statusText: string;
    readonly url: string;
    readonly body: unknown;
    readonly isAuthInvalidation: boolean;

    constructor(args: {
        status: number;
        statusText: string;
        url: string;
        body: unknown;
        message: string;
        isAuthInvalidation?: boolean;
    }) {
        super(args.message);
        this.name = "ApiHttpError";
        this.status = args.status;
        this.statusText = args.statusText;
        this.url = args.url;
        this.body = args.body;
        this.isAuthInvalidation = args.isAuthInvalidation ?? false;
    }
}

export function isAuthInvalidationStatus(status: number): boolean {
    return status === 401 || status === 419;
}

export function isApiHttpError(error: unknown): error is ApiHttpError {
    return error instanceof ApiHttpError;
}

export function isAuthInvalidationError(error: unknown): boolean {
    return isApiHttpError(error) && error.isAuthInvalidation;
}

async function readResponseBody(response: Response): Promise<unknown> {
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
        return response.json().catch(() => ({}));
    }

    return response.text().catch(() => "");
}

function bodyToMessage(body: unknown, fallback: string): string {
    if (!body) return fallback;
    if (typeof body === "string") return body || fallback;

    if (typeof body === "object") {
        const record = body as Record<string, unknown>;
        const nestedMessage = record.message;

        if (typeof record.msg === "string") return record.msg;
        if (typeof nestedMessage === "string") return nestedMessage;
        if (nestedMessage && typeof nestedMessage === "object") {
            const nested = nestedMessage as Record<string, unknown>;
            if (typeof nested.msg === "string") return nested.msg;
            if (typeof nested.message === "string") return nested.message;
        }
    }

    return fallback;
}

function resolveRequestUrl(input: RequestInfo | URL): string {
    if (typeof input === "string") return input;
    if (input instanceof URL) return input.toString();
    return input.url;
}

export async function authenticatedFetch(
    input: RequestInfo | URL,
    init: RequestInit = {},
    options?: {
        source?: string;
        invalidateOnAuthFailure?: boolean;
    },
): Promise<Response> {
    const token = readToken?.();
    const headers = new Headers(init.headers ?? {});

    if (token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(input, {
        ...init,
        headers,
    });

    if (response.ok) return response;

    const body = await readResponseBody(response);
    const url = resolveRequestUrl(input);
    const message = bodyToMessage(body, `HTTP ${response.status} ${response.statusText}`);
    const isAuthInvalidation = isAuthInvalidationStatus(response.status);

    if (isAuthInvalidation && options?.invalidateOnAuthFailure !== false) {
        invalidateSharedSession({
            reason: response.status === 419 ? "expired" : "unauthorized",
            source: options?.source ?? "authenticated-fetch",
            status: response.status,
            url,
            message,
        });
    }

    throw new ApiHttpError({
        status: response.status,
        statusText: response.statusText,
        url,
        body,
        message,
        isAuthInvalidation,
    });
}
