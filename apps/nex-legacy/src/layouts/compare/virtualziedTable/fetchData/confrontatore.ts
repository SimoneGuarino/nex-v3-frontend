import { enqueueSnackbar } from 'components/MessageBox';

type FormatFE = 'csv' | 'xlsx';
type JobStatus = 'pending' | 'running' | 'done' | 'error';
type DaysWindow = 7 | 14 | 30;

interface ConfrontatoreExportProps {
    suppliers: string[];
    format: FormatFE;
    userContext: { token: string };
    /** finestra temporale (giorni) per il calcolo: 7 | 14 | 30; default 7 */
    rangeDays?: DaysWindow;
    /** callback opzionale per notificare avanzamento */
    onStatus?: (s: { jobId: string; status: JobStatus; writtenRows: number }) => void;
    /** ms tra un poll e l’altro (default 1000) */
    pollIntervalMs?: number;
}

/** utility: sleep */
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/** estrae il filename da Content-Disposition (gestisce filename e filename*) */
function getFileNameFromDisposition(disposition: string | null, fallback: string): string {
    if (!disposition) return fallback;
    const star = /filename\*\s*=\s*UTF-8''([^;]+)$/i.exec(disposition);
    if (star?.[1]) {
        try { return decodeURIComponent(star[1]); } catch { return star[1]; }
    }
    const quoted = /filename\s*=\s*"([^"]+)"/i.exec(disposition);
    if (quoted?.[1]) return quoted[1];
    const bare = /filename\s*=\s*([^;]+)/i.exec(disposition);
    if (bare?.[1]) return bare[1].trim();
    return fallback;
}

/** scarica un blob come file */
function triggerBlobDownload(blob: Blob, fileName: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}

/** normalizza range giorni ai soli valori ammessi (7/14/30) */
function normalizeDaysWindow(d?: number): DaysWindow {
    return d === 14 || d === 30 ? d : 7;
}

/** polling dello stato; termina su done/error oppure quando stop() viene chiamato */
async function pollJobStatus(
    baseUrl: string,
    jobId: string,
    token: string,
    onStatus?: (s: { jobId: string; status: JobStatus; writtenRows: number }) => void,
    intervalMs = 1000,
    shouldStop?: () => boolean
): Promise<void> {
    const statusUrl = `${baseUrl}confrontatore/export/jobs/${jobId}/status`;
    while (true) {
        if (shouldStop?.()) return;
        try {
            const res = await fetch(statusUrl, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            });
            const json = await res.json().catch(() => null as any);
            const status: JobStatus = json?.status || 'pending';
            const written = Number(json?.writtenRows ?? 0);
            onStatus?.({ jobId, status, writtenRows: written });

            if (status === 'done' || status === 'error') return;
        } catch {
            // ignoro temporanei errori di rete e riprovo
        }
        await delay(intervalMs);
    }
}

export async function DownloadConfrontatoreFileAPI({
    suppliers,
    format,
    userContext,
    rangeDays,
    onStatus,
    pollIntervalMs = 1000,
}: ConfrontatoreExportProps): Promise<void> {
    if (!userContext?.token) {
        enqueueSnackbar('Sembra che tu non sia loggato. Perfavore effettua il login.', {
            title: 'Ops...',
            type: 'error',
        });
        return;
    }

    if (!Array.isArray(suppliers) || suppliers.length === 0) {
        enqueueSnackbar('Seleziona almeno un fornitore per procedere con l’export.', {
            title: 'Attenzione',
            type: 'warning',
        });
        return;
    }

    const deduped = [...new Set(suppliers)];
    const ext = format; // 'csv' | 'xlsx'
    const days = normalizeDaysWindow(rangeDays);

    try {
        const base = import.meta.env.VITE_API_PRODUCTS!;
        const createJobUrl = `${base}confrontatore/export/${ext}`;

        // 1) crea job -> 202 { jobId }  (includo comunque gli header della finestra: tollerati dal backend)
        const createRes = await fetch(createJobUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${userContext.token}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'x-range-days': String(days),
                'x-days-window': String(days),
            },
            body: JSON.stringify({ suppliers: deduped }),
        });

        const createPayload = await createRes.json().catch(() => null as any);

        if (!createRes.ok) {
            const msg = createPayload?.error || createPayload?.message || 'Errore durante la creazione del job.';
            enqueueSnackbar(msg, { title: 'Errore', type: 'error' });
            return;
        }

        const jobId = createPayload?.jobId as string | undefined;
        if (createRes.status !== 202 || !jobId) {
            enqueueSnackbar('Risposta inattesa dal server (atteso 202 con jobId).', {
                title: 'Errore',
                type: 'error',
            });
            return;
        }

        // prima notifica: pending (0 righe)
        onStatus?.({ jobId, status: 'pending', writtenRows: 0 });

        // 2) prepara polling dello stato
        let downloadFinished = false;
        const pollPromise = pollJobStatus(
            base,
            jobId,
            userContext.token,
            onStatus,
            pollIntervalMs,
            () => downloadFinished
        );

        // 3) avvia download (questo fa passare lo stato a "running")
        const downloadUrl = `${base}confrontatore/export/jobs/${jobId}/download.${ext}`;
        const dlRes = await fetch(downloadUrl, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${userContext.token}`,
                // header finestra temporale usati dal backend per calcolare la serie
                'x-range-days': String(days),
                'x-days-window': String(days),
                Accept:
                    ext === 'csv'
                        ? 'text/csv,application/octet-stream'
                        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream',
            },
        }).catch((e) => {
            throw e;
        });

        if (!dlRes.ok) {
            let msg = 'Errore durante il download del file.';
            try {
                const maybeJson = await dlRes.clone().json();
                msg = maybeJson?.error || maybeJson?.message || msg;
            } catch {
                try {
                    const txt = await dlRes.text();
                    if (txt) msg = txt;
                } catch { }
            }
            onStatus?.({ jobId, status: 'error', writtenRows: 0 });
            enqueueSnackbar(msg, { title: 'Errore', type: 'error' });
            downloadFinished = true; // interrompo il polling
            await pollPromise.catch(() => { });
            return;
        }

        const blob = await dlRes.blob();
        const disposition = dlRes.headers.get('Content-Disposition');

        const now = new Date();
        const stamp =
            now.getFullYear().toString() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') +
            '_' +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0') +
            String(now.getSeconds()).padStart(2, '0');

        const fallbackName = `confrontatore_${stamp}.${format}`;
        const fileName = getFileNameFromDisposition(disposition, fallbackName);

        triggerBlobDownload(blob, fileName);

        // 4) chiudo il polling (se non è già terminato su done)
        downloadFinished = true;
        await pollPromise.catch(() => { });
        onStatus?.({ jobId, status: 'done', writtenRows: 0 }); // safe: lo status reale sarà già passato a done
    } catch (err: any) {
        console.error('Errore imprevisto durante l’export confrontatore:', err);
        enqueueSnackbar('Errore imprevisto durante l’export. Contatta un tecnico.', {
            title: 'Errore',
            type: 'error',
        });
    }
}
