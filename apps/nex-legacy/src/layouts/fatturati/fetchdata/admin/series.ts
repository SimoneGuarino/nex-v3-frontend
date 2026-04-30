//src\layouts\fatturati\fetchdata\admin\series.ts
import { FetchData } from 'examples/Fetch';
import { enqueueSnackbar } from 'components/MessageBox';

export type Granularity = 'day' | 'week' | 'month';
export type CompareMode = 'yoy' | 'custom' | 'none';
export type Dimension =
    | 'AGENT'
    | 'CLIENT'
    | 'CAPO'
    | 'CNV'
    | 'BUY'
    | 'PRF'
    | 'LIP'
    | 'GRU'
    | 'FAM'
    | 'ARG';

// ogni filtro può essere singolo valore o array (per avere lo stesso filtro più volte)
export interface AdminSeriesFilters {
    CAPO?: string | string[];
    CLI?: string | string[];
    AGE?: string | string[];
    PRF?: string | string[]; // brand
    LIP?: string | string[]; // linea
    GRU?: string | string[]; // gruppo
    FAM?: string | string[]; // famiglia
    ART?: string | string[];
    MAG?: string | string[];
    CNV?: string | string[];
    BUY?: string | string[];
    ARG?: string | string[];
    CCA?: string | string[];
}

export interface AdminSeriesParams {
    from: string;       // 'YYYY-MM-DD'
    to: string;         // 'YYYY-MM-DD'
    sysInfo: string;    // es. 'FOCELDA'
    granularity?: Granularity;    // 'day' | 'month' (il BE accetta anche 'auto')
    compareMode?: CompareMode;    // 'yoy' | 'custom' | 'none'
    compareFrom?: string;         // richiesti se compareMode='custom'
    compareTo?: string;           // richiesti se compareMode='custom'
    topN?: number | string;       // default 10
    dimension?: Dimension;        // default 'AGENT'
    filters?: AdminSeriesFilters; // CAPO, CLI, AGE, PRF, ...
};

export interface AdminSeriesResponse {
    granularity: Granularity;
    series: Array<{ label: string; points: Array<{ x: string; y: number }> }>;
    kpi: {
        current: number;
        previous: number | null;
        deltaYoYPct: number | null;
        documents: number | null;
        avgTicket: number | null;
    };
    topN: Array<{
        code: string;
        label: string;
        revenue: number;
        profit: number;
        marginPct: number;
        qta: number;
    }>;
    metadata: { generatedAt: string; partial: boolean };
};

interface DataAPIProps {
    userContext: any; // deve avere almeno { token?: string }
    abortController: AbortController;
    params: AdminSeriesParams;
    setData: (data: AdminSeriesResponse | null) => void;
    setStatus?: (loading: boolean) => void;
    baseUrlOverride?: string;
};

/**
 * fetch per /fatturati/admin/series
 * - la classifica topN è determinata da params.dimension (default 'AGENT')
 * - i filtri business possono essere singolo valore o array → ?CLI=0001&CLI=0002
 *   (incluso AGE per filtrare uno o più agenti)
 */
export async function AdminSeriesDataAPI({
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
        granularity = 'month',
        compareMode = 'yoy',
        compareFrom,
        compareTo,
        topN = 200,
        dimension = 'AGENT',
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

        // granularità
        if (granularity) qs.set('granularity', granularity);

        // dimensione topN
        if (dimension) {
            qs.set('dimension', String(dimension).trim().toUpperCase());
        }

        // mapping compareMode → query ('yoy' | 'custom')
        if (compareMode === 'yoy') {
            qs.set('compare', 'yoy');
        } else if (compareMode === 'custom') {
            qs.set('compare', 'custom');
            if (compareFrom) qs.set('compareFrom', compareFrom);
            if (compareTo) qs.set('compareTo', compareTo);
        } else {
            // 'none' → nessun confronto → compare=custom senza date (il BE non calcolerà previous)
            qs.set('compare', 'custom');
        }

        if (topN != null) qs.set('topN', String(topN));

        // filtri business opzionali: singolo valore o array
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

        const url = `${base}/fatturati/admin/series?${qs.toString()}`;
        const res = await FetchData(url, 'GET', null, abortController);

        if (res && typeof res === 'object') {
            setData(res as AdminSeriesResponse);
        } else {
            setData(null);
            enqueueSnackbar('Risposta inattesa dal server per admin/series.', {
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
