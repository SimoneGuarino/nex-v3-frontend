//src\layouts\fatturati\fetchdata\agents\export.ts

import { enqueueSnackbar } from 'components/MessageBox';
import type {
    Dimension,
    AdminSeriesFilters as AgentsExportFiltersBase,
} from '../admin/series';

export type AgentsExportFilters = AgentsExportFiltersBase;

export interface AgentsExportParams {
    from: string;       // 'YYYY-MM-DD'
    to: string;         // 'YYYY-MM-DD'
    sysInfo: string;    // es. 'FOCELDA'
    agent: string;      // agente obbligatorio (es. 'SBR')

    // dimensione come /agents/breakdown (default lato BE 'CLIENT')
    dimension?: Dimension;

    sort?: string;                  // es. '-revenue', 'qta', '-marginPct'
    filters?: AgentsExportFilters;  // stessa shape dei breakdown
    columns?: string[];             // opzionale, come admin/export
}

interface ExportAPIProps {
    userContext: any;
    abortController: AbortController;
    params: AgentsExportParams;
    setStatus?: (loading: boolean) => void;
    baseUrlOverride?: string;
}

/**
 * POST /fatturati/agents/export
 * - allineato a /fatturati/agents/breakdown per dimension/filtri
 * - SEMPRE limitato all'agente passato (params.agent)
 * - nessuna paginazione → scarica tutte le righe aggregate
 * - si occupa direttamente di scaricare il CSV
 */
export async function AgentsExportDataAPI({
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
    }

    const {
        from,
        to,
        sysInfo,
        agent,
        dimension = 'CLIENT',
        sort = '-revenue',
        filters = {},
        columns,
    } = params;

    const agentCode = String(agent ?? '').trim().toUpperCase();
    if (!agentCode) {
        console.error('AgentsExportDataAPI: agent code is missing');
        enqueueSnackbar('Non è stato possibile determinare il codice agente per l’export.', {
            title: 'Errore',
            type: 'error',
        });
        return;
    }

    setStatus?.(true);

    try {
        const baseEnv = baseUrlOverride ?? import.meta.env.VITE_API_STOCKS;
        if (!baseEnv) {
            enqueueSnackbar("L'endpoint dell'API non è configurato.", { title: 'Errore', type: 'error' });
            return;
        }
        const base = baseEnv.endsWith('/') ? baseEnv.slice(0, -1) : baseEnv;

        const payload: Record<string, any> = {
            from,
            to,
            sysInfo,
            agent: agentCode,
            dimension: String(dimension).trim().toUpperCase(),
            sort: String(sort).trim(),
        };

        if (Array.isArray(columns) && columns.length > 0) {
            payload.columns = columns;
        }

        // filtri business come breakdown: string | string[]
        Object.entries(filters).forEach(([k, v]) => {
            if (v == null) return;
            payload[k] = v;
        });

        const url = `${base}/fatturati/agents/export`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (userContext.token) {
            headers.Authorization = `Bearer ${userContext.token}`;
        }

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
            }
            enqueueSnackbar(msg, { title: 'Errore export', type: 'error' });
            return;
        }

        const blob = await res.blob();

        const cd = res.headers.get('Content-Disposition') || res.headers.get('content-disposition');
        let filename = `agent_${agentCode}_${from}_${to}.csv`;
        if (cd) {
            const match = cd.match(/filename="?([^"]+)"?/i);
            if (match && match[1]) filename = match[1];
        }

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
