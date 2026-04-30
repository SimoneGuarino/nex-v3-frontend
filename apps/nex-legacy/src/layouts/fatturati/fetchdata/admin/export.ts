import { enqueueSnackbar } from 'components/MessageBox';
import type { Dimension, AdminSeriesFilters as AdminExportFiltersBase } from './series';

export type AdminExportFilters = AdminExportFiltersBase;

export interface AdminExportParams {
    from: string;       // 'YYYY-MM-DD'
    to: string;         // 'YYYY-MM-DD'
    sysInfo: string;    // es. 'FOCELDA'
    dimension?: Dimension;        // come /admin/breakdown (default lato BE 'AGENT')
    sort?: string;                // es. '-revenue', 'qta', '-marginPct'
    filters?: AdminExportFilters; // stessa shape dei breakdown: { CLI?: string | string[]; ... }

    // colonne opzionali (default lato BE: ['code','label','qta','revenue','profit','marginPct'])
    columns?: string[];
};

interface ExportAPIProps {
    userContext: any;                // deve avere almeno { token?: string }
    abortController: AbortController;
    params: AdminExportParams;
    setStatus?: (loading: boolean) => void;
    baseUrlOverride?: string;
};

/**
 * POST /fatturati/admin/export
 * - allineato a /fatturati/admin/breakdown per dimension/filtri
 * - nessuna paginazione → scarica tutte le righe aggregate
 * - si occupa direttamente di scaricare il CSV
 * - il filtro sugli agenti passa tramite filters.AGE (es. AGE="SBR,WPI")
 */
export async function AdminExportDataAPI({
    userContext,
    abortController,
    params,
    setStatus,
    baseUrlOverride,
}: ExportAPIProps) {
    if (!userContext) return;

    if (!userContext?.token) {
        console.error('User token is missing');
        enqueueSnackbar('Sembra che tu non sia loggato, perfavore effettua il login.', {
            title: 'Ops..',
            type: 'error',
        });
        return;
    };

    const {
        from,
        to,
        sysInfo,
        dimension = 'AGENT',
        sort = '-revenue',
        filters = {},
        columns,
    } = params;

    setStatus?.(true);

    try {
        const baseEnv = baseUrlOverride ?? import.meta.env.VITE_API_STOCKS;
        if (!baseEnv) {
            enqueueSnackbar("L'endpoint dell'API non è configurato.", { title: 'Errore', type: 'error' });
            return;
        };
        const base = baseEnv.endsWith('/') ? baseEnv.slice(0, -1) : baseEnv;

        const payload: Record<string, any> = {
            from,
            to,
            sysInfo,
            dimension: String(dimension).trim().toUpperCase(),
            sort: String(sort).trim(),
        };

        // colonne opzionali
        if (Array.isArray(columns) && columns.length > 0) {
            payload.columns = columns;
        };

        // filtri business: stessa shape dei breakdown (string | string[])
        Object.entries(filters).forEach(([k, v]) => {
            if (v == null) return;
            payload[k] = v;
        });

        const url = `${base}/fatturati/admin/export`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (userContext.token) {
            headers.Authorization = `Bearer ${userContext.token}`;
        };

        const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            signal: abortController.signal,
        });

        if (!res.ok) {
            let msg = 'Esportazione non riuscita.';
            try {
                const text = await res.text();
                if (text) msg = text;
            } catch {
                // ignore
            };
            enqueueSnackbar(msg, { title: 'Errore export', type: 'error' });
            return;
        };

        const blob = await res.blob();

        // filename da Content-Disposition, se presente
        const cd = res.headers.get('Content-Disposition') || res.headers.get('content-disposition');
        let filename = 'export_fatturati_admin.csv';
        if (cd) {
            const match = cd.match(/filename="?([^"]+)"?/i);
            if (match && match[1]) filename = match[1];
        };

        // download “forzato”
        const urlBlob = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = urlBlob;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(urlBlob);
    } catch (errorState: any) {
        if (errorState?.name === 'AbortError') {
            return;
        }
        console.error(errorState);
        let message = '';
        const errMsg: string | { msg?: string } | undefined = errorState?.message;
        if (typeof errMsg === 'string') message = errMsg;
        else if (errMsg && typeof errMsg === 'object' && errMsg.msg) message = errMsg.msg;
        if (!message || message.trim() === '') {
            message = 'Sembra che ci sia stato un problema durante l’export, contatta un tecnico.';
        }
        enqueueSnackbar(message, {
            title: 'Ops..',
            type: 'error',
        });
    } finally {
        setStatus?.(false);
    }
}
