import { FetchData } from 'examples/Fetch';
import { enqueueSnackbar } from 'components/MessageBox';
import type { Dimension, AdminSeriesFilters as AdminBreakdownFiltersBase } from './series';

// riuso la stessa shape dei filtri della series (string | string[])
export type AdminBreakdownFilters = AdminBreakdownFiltersBase;

export interface AdminBreakdownParams {
    from: string;       // 'YYYY-MM-DD'
    to: string;         // 'YYYY-MM-DD'
    sysInfo: string;    // es. 'FOCELDA'
    dimension?: Dimension; // 'AGENT' | 'CLIENT' | 'CAPO' | ... (default lato BE 'AGENT')
    page?: number;      // default 1
    pageSize?: number;  // default 50
    sort?: string;      // es. '-revenue', 'qta', '-marginPct' (validato lato BE da sortToSql)
    filters?: AdminBreakdownFilters; // filtri business: CAPO, CLI, AGE, PRF, ...
}

export interface AdminBreakdownItem {
    code: string;
    label: string;
    qta: number;
    revenue: number;
    profit: number;
    marginPct: number;
}

export interface AdminBreakdownResponse {
    items: AdminBreakdownItem[];
    totals: {
        qta: number;
        revenue: number;
        profit: number;
        marginPct: number;
    };
    page: number;
    pageSize: number;
    total: number | null;
    metadata: { generatedAt: string; partial: boolean };
}

interface DataAPIProps {
    userContext: any; // deve avere almeno { token?: string }
    abortController: AbortController;
    params: AdminBreakdownParams;
    setData: (data: AdminBreakdownResponse | null) => void;
    setStatus?: (loading: boolean) => void;
    baseUrlOverride?: string;
}

/**
 * fetch per /fatturati/admin/breakdown
 * - supporta dimension (AGENT/CLIENT/...)
 * - supporta filtri business multipli: es. CLI=['0001','0002'] → ?CLI=0001&CLI=0002
 *   (inclusi AGE, BUY, ecc. per filtrare agenti/buyer)
 */
export async function AdminBreakdownDataAPI({
    userContext,
    abortController,
    params,
    setData,
    setStatus,
    baseUrlOverride,
}: DataAPIProps) {
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
        dimension = 'AGENT',
        page = 1,
        pageSize = 50,
        sort,
        filters = {},
    } = params;

    setStatus?.(true);

    try {
        const baseEnv = baseUrlOverride ?? import.meta.env.VITE_API_STOCKS;
        if (!baseEnv) {
            enqueueSnackbar("L'endpoint dell'API non è configurato.", { title: 'Errore', type: 'error' });
            return;
        }
        const base = baseEnv.endsWith('/') ? baseEnv.slice(0, -1) : baseEnv;

        const qs = new URLSearchParams();
        qs.set('from', from);
        qs.set('to', to);
        qs.set('sysInfo', sysInfo);

        // dimensione breakdown (AGENT / CLIENT / CAPO / ...)
        if (dimension) {
            qs.set('dimension', String(dimension).trim().toUpperCase());
        }

        // paginazione
        if (page != null) qs.set('page', String(page));
        if (pageSize != null) qs.set('pageSize', String(pageSize));

        // ordinamento tabellare opzionale (se non passato, default lato BE)
        if (sort && String(sort).trim() !== '') {
            qs.set('sort', String(sort).trim());
        }

        // filtri business opzionali: singolo valore o array → ?CLI=0001&CLI=0002
        Object.entries(filters).forEach(([k, v]) => {
            if (Array.isArray(v)) {
                v.forEach((val) => {
                    const s = val == null ? '' : String(val).trim();
                    if (s !== '') qs.append(k, s);
                });
            } else if (v != null) {
                const s = String(v).trim();
                if (s !== '') qs.set(k, s);
            }
        });

        const url = `${base}/fatturati/admin/breakdown?${qs.toString()}`;
        const res = await FetchData(url, 'GET', null, abortController);

        if (res && typeof res === 'object') {
            setData(res as AdminBreakdownResponse);
        } else {
            setData(null);
            enqueueSnackbar('Risposta inattesa dal server per admin/breakdown.', {
                title: 'Attenzione',
                type: 'warning',
            });
        }
    } catch (errorState: any) {
        if (errorState?.name !== 'AbortError') {
            console.error(errorState);
            let message = '';
            const errMsg: string | { msg?: string } | undefined = errorState?.message;
            if (typeof errMsg === 'string') message = errMsg;
            else if (errMsg && typeof errMsg === 'object' && errMsg.msg) message = errMsg.msg;
            if (!message || message.trim() === '') {
                message = 'Sembra che ci sia stato un problema nel recupero dei dati, contatta un tecnico.';
            }
            if (errorState?.status !== 404) {
                enqueueSnackbar(message, {
                    title: 'Ops..',
                    type: 'error',
                });
            }
            setData(null);
        }
    } finally {
        setStatus?.(false);
    }
}
