// FetchFilePDF.ts
// Download PDF via fetch->blob (niente navigazione), single e batch con concorrenza limitata.
// Non richiede helper esterni. Puoi passare headers personalizzati via options.

import { enqueueSnackbar } from "components/MessageBox";
import { getAuthToken } from "utils/auth/authToken";

export type Company = "FOCELDA" | "IOT";

/** --- helpers interni, zero dipendenze --- */
const getOrigin = () =>
    (typeof window !== "undefined" && window.location?.origin) || "http://localhost";

const filenameFromContentDisposition = (h: string | null, fallback: string) => {
    if (!h) return fallback;
    const mStar = h.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
    if (mStar) return decodeURIComponent(mStar[1]);
    const m = h.match(/filename\s*=\s*"?([^";]+)"?/i);
    return m ? m[1] : fallback;
};

async function isPdfBlob(blob: Blob): Promise<boolean> {
    const first = await blob.slice(0, 5).arrayBuffer();
    const bytes = new Uint8Array(first);
    const sig = String.fromCharCode(...bytes);
    return sig === "%PDF-";
}

function saveBlob(blob: Blob, filename: string) {
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        URL.revokeObjectURL(href);
        a.remove();
    }, 0);
}

function smallChunk<T>(arr: T[], size: number): T[][] {
    if (size <= 0) return [arr];
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

type FetchPdfOpts = {
    signal?: AbortSignal;
    // Request credentials: "include" per cookie-session; "same-origin" default; "omit" se gestisci solo bearer.
    credentials?: RequestCredentials;
    // headers extra: es. Authorization: Bearer ...
    headers?: Record<string, string>;
};

async function fetchPdfAsBlob(url: string, opts?: FetchPdfOpts): Promise<{ blob: Blob; filename: string }> {
    const token = getAuthToken();
    if (token) {
        opts = { ...(opts ?? {}), headers: { ...(opts?.headers ?? {}), Authorization: `Bearer ${token}` } };
    }

    const res = await fetch(url, {
        method: "GET",
        credentials: opts?.credentials ?? "include",
        headers: opts?.headers,
        signal: opts?.signal,
    });

    if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Download failed ${res.status}: ${txt || res.statusText}`);
    }

    const blob = await res.blob();
    const ct = (res.headers.get("Content-Type") || "").toLowerCase();
    const looksPdf = ct.includes("application/pdf") || (await isPdfBlob(blob));
    if (!looksPdf) {
        let msg = "Il contenuto scaricato non è un PDF valido.";
        try {
            const copy = blob.slice(0, Math.min(blob.size, 2048));
            const txt = await copy.text();
            if (txt) msg += ` Dettagli: ${txt.substring(0, 400)}`;
        } catch { }
        throw new Error(msg);
    }

    const cd = res.headers.get("Content-Disposition");
    const urlObj = new URL(url, getOrigin());
    const lastSeg = decodeURIComponent(urlObj.pathname.split("/").pop() || "document.pdf");
    const baseNoQuery = lastSeg.replace(/\?.*$/, "");
    const defName = baseNoQuery.endsWith(".pdf") ? baseNoQuery : `${baseNoQuery}.pdf`;
    const filename = filenameFromContentDisposition(cd, defName);

    return { blob, filename };
}

/** ---- API pubblica ---- **/

export type DownloadSingleOpts = {
    asAttachment?: boolean;          // default: true (il BE imposta Content-Disposition=attachment)
    signal?: AbortSignal;
    credentials?: RequestCredentials; // default: "include"
    headers?: Record<string, string>; // es. { Authorization: `Bearer ${token}` }
    basePath?: string;                // default: "/api"
};

export async function downloadPdfSingle(
    url: string,
    opts?: DownloadSingleOpts
) {
    try {
        const { blob, filename } = await fetchPdfAsBlob(url, {
            signal: opts?.signal,
            credentials: opts?.credentials,
            headers: opts?.headers,
        });
        saveBlob(blob, filename);
    } catch (error) {
        console.error("[downloadPdfSingle] error:", error);
        enqueueSnackbar("Sembra che ci sia stato un errore nel download del PDF.", {
            type: "error",
            title: "Errore nel download del PDF",
        });
    };
};

export type DownloadBatchOpts = {
    concurrent?: number;              // default: 3
    //asAttachment?: boolean;         // default: true
    retry?: number;                   // default: 1
    onProgress?: (done: number, total: number, current?: string) => void;
    signal?: AbortSignal;
    credentials?: RequestCredentials; // default: "include"
    headers?: Record<string, string>;
    basePath?: string;                // default: "/api"
};

export async function downloadPdfBatch(
    files: {
        fileName: string;
        url: string;
    }[],
    opts?: DownloadBatchOpts
) {
    const total = files.length;
    if (total === 0) return { total: 0, ok: 0, fail: 0 };

    const concurrent = Math.max(1, Math.min(6, opts?.concurrent ?? 3));
    //const asAttachment = opts?.asAttachment ?? true;
    const retryMax = Math.max(0, opts?.retry ?? 1);

    // partiziono in N blocchi per concorrenza controllata
    const chunkSize = Math.ceil(total / concurrent);
    const groups = smallChunk(files, chunkSize);

    let done = 0, ok = 0, fail = 0;

    await Promise.all(
        groups.map(async (group) => {
            for (const fn of group) {
                let attempts = 0;
                while (attempts <= retryMax) {
                    try {
                        const { blob, filename } = await fetchPdfAsBlob(fn.url, {
                            signal: opts?.signal,
                            credentials: opts?.credentials,
                            headers: opts?.headers,
                        });
                        saveBlob(blob, filename);
                        ok++;
                        break;
                    } catch (err) {
                        attempts++;
                        if (attempts > retryMax) {
                            fail++;
                            // log locale; integra pure con il tuo logger
                            // eslint-disable-next-line no-console
                            console.error("[downloadPdfBatch] failed:", fn, err);
                        } else {
                            await new Promise(r => setTimeout(r, 250 * attempts));
                        }
                    }
                }
                done++;
                opts?.onProgress?.(done, total, fn.fileName);
                await new Promise(r => setTimeout(r, 0)); // yielding
            }
        })
    );

    return { total, ok, fail };
}
