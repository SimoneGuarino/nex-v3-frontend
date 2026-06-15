// src/layouts/compare/virtualziedTable/fetchData/confrontatore-v2.ts
import { enqueueSnackbar } from "components/MessageBox";
import { FetchFileData } from "examples/Fetch/FetchFileDataV2";

type FormatFE = "csv" | "xlsx";
type JobStatus = "pending" | "running" | "done" | "error";
type DaysWindow = 7 | 14 | 30;

export interface ConfrontatoreExportV2Props {
    suppliers: string[];
    format: FormatFE;
    rangeDays?: DaysWindow;
    onStatus?: (s: {
        jobId: string;
        status: JobStatus;
        writtenRows: number;
        phase?: string | null;
        error?: string | null;
    }) => void;
    pollIntervalMs?: number;
    // NEW
    signal?: AbortSignal;
}

type CreateJobResponse = {
    jobId: string;
    status: JobStatus;
    phase?: string;
    ext?: FormatFE;
    suppliers?: string[];
    brands?: string[];
    days?: DaysWindow;
    error?: string;
};

type StatusResponse = {
    jobId: string;
    status: JobStatus;
    phase?: string | null;
    ext?: FormatFE;
    suppliers?: string[];
    brands?: string[];
    days?: DaysWindow;
    writtenRows?: number;
    error?: string | null;
    createdAt?: number;
    startedAt?: number | null;
    finishedAt?: number | null;
};

const delay = (ms: number, signal?: AbortSignal) =>
    new Promise<void>((res, rej) => {
        if (signal?.aborted) return rej(new DOMException("Aborted", "AbortError"));
        const t = setTimeout(() => res(), ms);
        signal?.addEventListener(
            "abort",
            () => {
                clearTimeout(t);
                rej(new DOMException("Aborted", "AbortError"));
            },
            { once: true }
        );
    });

function normalizeDaysWindow(d?: number): DaysWindow {
    return d === 14 || d === 30 ? d : 7;
}

function buildBaseUrl(): string {
    const base = import.meta.env.VITE_API_PRODUCTS;
    if (!base) throw new Error("VITE_API_SEARCH_ENDPOINT non valorizzata");
    return base.endsWith("/") ? base : `${base}/`;
}

function triggerBlobDownload(blob: Blob, fileName: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}

function buildFallbackName(format: FormatFE) {
    const now = new Date();
    const stamp =
        now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, "0") +
        String(now.getDate()).padStart(2, "0") +
        "_" +
        String(now.getHours()).padStart(2, "0") +
        String(now.getMinutes()).padStart(2, "0") +
        String(now.getSeconds()).padStart(2, "0");

    return `confrontatore_${stamp}.${format}`;
}

function computeNextIntervalMs(args: {
    baseIntervalMs: number;
    phase?: string | null;
    status: JobStatus;
    grew: boolean;
}): number {
    const { baseIntervalMs, phase, status, grew } = args;

    if (status === "done" || status === "error") return 0;

    // default "parsimonioso"
    const cap = Math.max(3000, baseIntervalMs); // evita spam
    const floor = 800;

    // pending: non cambia spesso
    if (status === "pending") return Math.min(cap, 5000);

    // running:
    if (phase === "export") {
        // se cresce, stringi per UX; se fermo, allarga
        return grew ? Math.max(floor, Math.min(2000, cap)) : Math.min(cap, 4000);
    }

    if (phase === "as400") return Math.min(cap, 5000);
    if (phase === "mongo_cursor") return Math.min(cap, 4000);
    if (phase === "finalize") return Math.min(cap, 2500);

    return Math.min(cap, 4000);
}

async function cancelJob(baseUrl: string, jobId: string) {
    try {
        await FetchFileData(`${baseUrl}confrontatore-v2/export/jobs/${jobId}`, {
            method: "DELETE",
            responseType: "json",
            headers: { Accept: "application/json" },
        });
    } catch {
        // best effort
    }
}

async function pollJobStatusV2(params: {
    baseUrl: string;
    jobId: string;
    days: DaysWindow;
    onStatus?: ConfrontatoreExportV2Props["onStatus"];
    baseIntervalMs: number;
    signal?: AbortSignal;
}): Promise<StatusResponse> {
    const { baseUrl, jobId, days, onStatus, baseIntervalMs, signal } = params;
    const statusUrl = `${baseUrl}confrontatore-v2/export/jobs/${jobId}`;

    let last: StatusResponse = { jobId, status: "pending", writtenRows: 0 };
    let lastRows = 0;

    while (true) {
        if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

        const res = await FetchFileData<StatusResponse>(statusUrl, {
            method: "GET",
            responseType: "json",
            headers: {
                Accept: "application/json",
                "x-range-days": String(days),
                "x-days-window": String(days),
            },
        });

        if (res.kind !== "json") {
            throw new Error("Risposta inattesa: atteso JSON sullo status");
        }

        const json = res.json || ({} as any);
        const status = (json.status || "pending") as JobStatus;
        const writtenRows = Number(json.writtenRows ?? 0) || 0;

        last = {
            ...json,
            jobId: json.jobId || jobId,
            status,
            writtenRows,
        };

        onStatus?.({
            jobId: last.jobId,
            status: last.status,
            writtenRows: last.writtenRows ?? 0,
            phase: last.phase ?? null,
            error: last.error ?? null,
        });

        if (status === "done" || status === "error") return last;

        const grew = writtenRows > lastRows;
        lastRows = writtenRows;

        const wait = computeNextIntervalMs({
            baseIntervalMs,
            phase: last.phase ?? null,
            status,
            grew,
        });

        await delay(wait, signal);
    }
}

export async function DownloadConfrontatoreFileV2({
    suppliers,
    format,
    rangeDays,
    onStatus,
    pollIntervalMs = 6000,
    signal,
}: ConfrontatoreExportV2Props): Promise<void> {
    const deduped = Array.isArray(suppliers)
        ? [...new Set(suppliers.map(String).map((s) => s.trim()).filter(Boolean))]
        : [];

    const days = normalizeDaysWindow(rangeDays);
    const ext = format;

    // baseIntervalMs: massimo risparmio, ma polling adattivo può scendere quando serve
    const baseIntervalMs = Math.max(3000, Number(pollIntervalMs || 0));

    if (!deduped.length) {
        enqueueSnackbar("Seleziona almeno un fornitore per procedere con l’export.", {
            title: "Attenzione",
            type: "warning",
        });
        return;
    }

    const baseUrl = buildBaseUrl();
    let jobId: string | null = null;

    try {
        if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

        // 1) CREATE JOB
        const createUrl = `${baseUrl}confrontatore-v2/export/${ext}`;

        const createRes = await FetchFileData<CreateJobResponse>(createUrl, {
            method: "POST",
            responseType: "json",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "x-range-days": String(days),
                "x-days-window": String(days),
            },
            body: JSON.stringify({ suppliers: deduped }),
        });

        if (createRes.kind !== "json") {
            throw new Error("Risposta inattesa dal server (atteso JSON in creazione job).");
        }

        const createPayload = createRes.json || ({} as any);
        jobId = (createPayload.jobId as string | undefined) ?? null;

        if (!jobId) {
            enqueueSnackbar("Risposta inattesa dal server (jobId mancante).", {
                title: "Errore",
                type: "error",
            });
            return;
        }


        onStatus?.({
            jobId,
            status: (createPayload.status || "pending") as JobStatus,
            writtenRows: 0,
            phase: createPayload.phase ?? null,
            error: createPayload.error ?? null,
        });

        // 2) POLL STATUS fino a done/error (adattivo)
        const finalStatus = await pollJobStatusV2({
            baseUrl,
            jobId,
            days,
            onStatus,
            baseIntervalMs,
            signal,
        });

        if (finalStatus.status === "error") {
            enqueueSnackbar(finalStatus.error || "Errore durante la generazione del file.", {
                title: "Errore",
                type: "error",
            });
            return;
        }

        if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

        // 3) DOWNLOAD
        const downloadUrl = `${baseUrl}confrontatore-v2/export/jobs/${jobId}?download=1`;

        // Race safe: riprova qualche volta se torna 202 JSON
        for (let attempts = 0; attempts < 10; attempts++) {
            if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

            const dlRes = await FetchFileData<StatusResponse>(downloadUrl, {
                method: "GET",
                responseType: "auto",
                headers: {
                    Accept:
                        ext === "csv"
                            ? "text/csv,application/json,application/octet-stream"
                            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/json,application/octet-stream",
                    "x-range-days": String(days),
                    "x-days-window": String(days),
                },
            });

            if (dlRes.kind === "blob") {
                const fileName = dlRes.filename || buildFallbackName(ext);
                triggerBlobDownload(dlRes.blob, fileName);
                onStatus?.({
                    jobId,
                    status: "done",
                    writtenRows: finalStatus.writtenRows ?? 0,
                    phase: "finalize",
                    error: null,
                });
                return;
            }

            // JSON 202 -> ancora non pronto
            const st = dlRes.json as any;
            const status = (st?.status || "running") as JobStatus;
            const writtenRows = Number(st?.writtenRows ?? finalStatus.writtenRows ?? 0);

            onStatus?.({
                jobId,
                status,
                writtenRows,
                phase: st?.phase ?? null,
                error: st?.error ?? null,
            });

            if (status === "error") {
                enqueueSnackbar(st?.error || "Errore durante il download del file.", {
                    title: "Errore",
                    type: "error",
                });
                return;
            }

            await delay(400, signal);
        }

        enqueueSnackbar("Il file non è ancora pronto per il download. Riprova tra qualche secondo.", {
            title: "Attenzione",
            type: "warning",
        });
    } catch (err: any) {
        // Se abort, prova a cancellare job lato server
        if (err?.name === "AbortError" && jobId) {
            await cancelJob(baseUrl, jobId);
            return;
        }

        console.error("Errore export confrontatore V2:", err);
        enqueueSnackbar(err?.message || "Errore imprevisto durante l’export. Contatta un tecnico.", {
            title: "Errore",
            type: "error",
        });
    }
}
