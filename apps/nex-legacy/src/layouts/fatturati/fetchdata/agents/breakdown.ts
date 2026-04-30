import { FetchData } from 'examples/Fetch';
import { enqueueSnackbar } from 'components/MessageBox';

// riuso Dimension e la shape dei filtri della series admin
import type {
    Dimension,
    AdminSeriesFilters as AgentsBreakdownFiltersBase,
} from '../admin/series';

// riuso il tipo di item dal breakdown admin
import type { AdminBreakdownItem } from '../admin/breakdown';

// stessa shape filtri (string | string[])
export type AgentsBreakdownFilters = AgentsBreakdownFiltersBase;

export interface AgentsBreakdownParams {
    from: string;       // 'YYYY-MM-DD'
    to: string;         // 'YYYY-MM-DD'
    sysInfo: string;    // es. 'FOCELDA'
    agent: string;      // agente obbligatorio (es. 'SBR')
    dimension?: Dimension; // 'AGENT' | 'CLIENT' | 'CAPO' | ... (default lato BE 'AGENT')
    sort?: string;      // es. '-revenue', 'qta', '-marginPct' (validato lato BE da sortToSql)
    filters?: AgentsBreakdownFilters;
}

export interface AgentsBreakdownResponse {
    items: AdminBreakdownItem[];
    totals: {
        qta: number;
        revenue: number;
        profit: number;
        marginPct: number;
    };
    total: number | null; // 👈 ora disponibile anche lato agent
    metadata: { generatedAt: string; partial: boolean };
}

interface DataAPIProps {
    userContext: any; // deve avere almeno { token?: string }
    abortController: AbortController;
    params: AgentsBreakdownParams;
    setData: (data: AgentsBreakdownResponse | null) => void;
    setStatus?: (loading: boolean) => void;
    baseUrlOverride?: string;
}

/**
 * fetch per /fatturati/agents/breakdown
 * - SEMPRE limitato all'agente chiamante (params.agent obbligatorio)
 * - supporta dimension (AGENT/CLIENT/...)
 * - supporta filtri business multipli: es. CLI=['0001','0002'] → ?CLI=0001&CLI=0002
 * - nessuna paginazione lato BE (total = numero di righe aggregate)
 */
export async function AgentsBreakdownDataAPI({
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
        agent,
        dimension = 'AGENT',
        sort,
        filters = {},
    } = params;

    // lato BE agent è obbligatorio, faccio un piccolo check lato FE
    const agentCode = String(agent ?? '').trim();
    if (!agentCode) {
        console.error('AgentsBreakdownDataAPI: agent code is missing');
        enqueueSnackbar('Non è stato possibile determinare il codice agente.', {
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

        const qs = new URLSearchParams();
        qs.set('from', from);
        qs.set('to', to);
        qs.set('sysInfo', sysInfo);

        // agente obbligatorio
        qs.set('agent', agentCode.toUpperCase());

        // dimensione breakdown (AGENT / CLIENT / CAPO / ...)
        if (dimension) {
            qs.set('dimension', String(dimension).trim().toUpperCase());
        }

        // ordinamento opzionale (se non passato, la rotta userà il default)
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

        const url = `${base}/fatturati/agents/breakdown?${qs.toString()}`;
        const res = await FetchData(url, 'GET', null, abortController);

        if (res && typeof res === 'object') {
            setData(res as AgentsBreakdownResponse);
        } else {
            setData(null);
            enqueueSnackbar('Risposta inattesa dal server per agents/breakdown.', {
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
