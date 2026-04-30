// modules/documents/lib/openPdf.ts
// Native PDF viewer helpers (no pdfjs-dist).
// Goal: provide a single, reliable way to build document URLs and resolve a PdfSource to a URL usable by <iframe>/<object>.
//
// NOTE on auth:
// - <iframe src="..."> cannot send custom Authorization headers.
// - If your PDF endpoint requires Bearer tokens, you must either:
//   A) fetch the PDF as Blob with headers and pass a blob: URL to the iframe (what we do by default when a token exists), or
//   B) switch backend auth to cookie/session, or
//   C) use a short-lived signed URL.

import { getAuthToken } from "utils/auth/authToken";

export type PdfSource =
    | { type: "url"; url: string; headers?: Record<string, string> }
    | { type: "blob"; blob: Blob }
    | { type: "bytes"; data: Uint8Array };

export type OpenPdfOptions = {
    /**
     * If true, fetch uses credentials: "include" (for cookie-based auth).
     * If false/undefined, uses "same-origin".
     */
    withCredentials?: boolean;

    /**
     * Extra headers to add when fetching the PDF as Blob (e.g. X-Token).
     * IMPORTANT: these do not apply to direct iframe navigation (browser controls headers).
     */
    httpHeaders?: Record<string, string>;

    /**
     * Prefer using the URL directly in the iframe when possible (better for very large PDFs and range-requests).
     * Default: true.
     *
     * The resolver will still fall back to Blob when it detects auth headers are needed.
     */
    preferDirectUrl?: boolean;
};

export function buildPdfUrl({
    fileName,
    company,
    download,
}: {
    fileName: string;
    company: "FOCELDA" | "IOT";
    download?: "1";
}) {
    const params = new URLSearchParams({ company });
    if (download) params.append("download", download);
    return `${import.meta.env.VITE_API_PDF_READER}pdf/v2/documents/${encodeURIComponent(
        fileName
    )}?${params.toString()}`;
}

/**
 * (Optional) Thumbnails endpoint kept for compatibility. If you truly do not need thumbs,
 * you can delete this export and any call sites.
 */
export function buildPdfThumbUrl({
    fileName,
    company,
    page = 1,
    w = 320,
    dpr = Math.max(1, Math.min(3, Math.round(window.devicePixelRatio || 1))),
    fmt = "webp",
}: {
    fileName: string;
    company: "FOCELDA" | "IOT";
    page?: number;
    w?: number;
    dpr?: number;
    fmt?: "webp" | "png";
}) {
    const base = `${import.meta.env.VITE_API_PDF_READER}pdf/v2/documents/thumbnail`;
    const q = new URLSearchParams({
        company,
        page: String(page),
        w: String(w),
        dpr: String(dpr),
        fmt,
    });
    return `${base}/${encodeURIComponent(fileName)}?${q.toString()}`;
}

export type ResolvedPdfSrc = {
    /** URL usable by iframe/object. Might be a blob: URL. */
    url: string;
    /** Whether the URL is a blob: URL that must be revoked. */
    isObjectUrl: boolean;
    /** Cleanup function (revokes object URL / aborts fetch). */
    cleanup: () => void;
};

/**
 * Resolve a PdfSource to an iframe-friendly URL.
 * - If src is Blob/Bytes => create object URL.
 * - If src is URL:
 *   - If it likely needs custom headers (Bearer token present OR headers provided) => fetch as Blob and create object URL.
 *   - Else => use URL directly (best for performance on large PDFs; allows range requests).
 */
export async function resolvePdfSource(
    src: PdfSource,
    opt: OpenPdfOptions = {},
    signal?: AbortSignal
): Promise<ResolvedPdfSrc> {
    const preferDirectUrl = opt.preferDirectUrl ?? true;

    // 1) Blob/Bytes => object URL
    if (src.type === "blob") {
        const url = URL.createObjectURL(src.blob);
        return {
            url,
            isObjectUrl: true,
            cleanup: () => URL.revokeObjectURL(url),
        };
    }
    if (src.type === "bytes") {
        // Converte la view in un ArrayBuffer "puro" (anche se dietro c'è SharedArrayBuffer)
        const ab = src.data.buffer.slice(
            src.data.byteOffset,
            src.data.byteOffset + src.data.byteLength
        ) as ArrayBuffer;

        const blob = new Blob([ab], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        return {
            url,
            isObjectUrl: true,
            cleanup: () => URL.revokeObjectURL(url),
        };
    }

    // 2) URL: decide direct vs fetch->blob
    const token = getAuthToken();
    const needsHeaders = Boolean(token) || Boolean(src.headers) || Boolean(opt.httpHeaders);

    // If we don't need headers and preferDirectUrl => direct navigation
    if (preferDirectUrl && !needsHeaders) {
        return {
            url: src.url,
            isObjectUrl: false,
            cleanup: () => { },
        };
    }

    // Otherwise: fetch as Blob (so we can attach headers) and create object URL.
    const headers: Record<string, string> = {
        ...(opt.httpHeaders ?? {}),
        ...(src.headers ?? {}),
    };
    if (token && !headers.Authorization) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(src.url, {
        method: "GET",
        headers,
        credentials: opt.withCredentials ? "include" : "same-origin",
        signal,
    });

    if (!res.ok) {
        const text = await safeReadText(res);
        throw new Error(
            `Impossibile caricare PDF (${res.status} ${res.statusText})${text ? `: ${text}` : ""
            }`
        );
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    return {
        url,
        isObjectUrl: true,
        cleanup: () => URL.revokeObjectURL(url),
    };
}

async function safeReadText(res: Response) {
    try {
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("text") && !ct.includes("json")) return "";
        const t = await res.text();
        return (t || "").slice(0, 300);
    } catch {
        return "";
    }
}
