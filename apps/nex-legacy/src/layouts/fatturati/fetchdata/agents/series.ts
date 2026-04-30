import { FetchData } from 'examples/Fetch';
import { enqueueSnackbar } from 'components/MessageBox';
import { Granularity } from '../admin/series';

type GranularityExtended = Granularity | 'auto';
export type CompareMode = 'yoy' | 'custom' | 'none';

export interface AgentsSeriesFilters {
    CAPO?: string;
    CLI?: string;
    AGE?: string; // se lo passi, viene intersecato con 'agent' (lo forziamo a coincidere)
    PRF?: string;
    LIP?: string;
    GRU?: string;
    FAM?: string;
    ART?: string;
    MAG?: string;
    CNV?: string;
    BUY?: string;
    ARG?: string;
}

export interface AgentsSeriesParams {
    from: string;       // 'YYYY-MM-DD'
    to: string;         // 'YYYY-MM-DD'
    sysInfo: string;    // es. 'FOCELDA'
    /**
     * Codice agente (opzionale): se assente viene ricavato
     * da userContext.details.codici.agente oppure ulterioriAgente[0]
     */
    agent?: string;
    granularity?: GranularityExtended;   // default 'auto'
    compareMode?: CompareMode;   // 'yoy' | 'custom' | 'none' (default 'yoy')
    compareFrom?: string;        // richiesti se compareMode='custom'
    compareTo?: string;          // richiesti se compareMode='custom'
    filters?: AgentsSeriesFilters; // filtri business opzionali
}

export interface AgentsSeriesResponse {
    granularity: Granularity;
    series: Array<{ label: string; points: Array<{ x: string; y: number }> }>;
    kpi: {
        current: number;
        previous: number | null;
        deltaYoYPct: number | null;
        documents: number | null;
        avgTicket: number | null;
    };
    // per compat: la rotta ritorna un solo elemento (l'agente richiesto)
    topN: Array<{
        code: string;
        label: string;
        revenue: number;
        profit: number;
        marginPct: number;
        qta: number;
    }>;
    metadata: { generatedAt: string; partial: boolean };
}

interface DataAPIProps {
    userContext: any; // deve avere almeno { token?: string; details?: any }
    abortController: AbortController;
    params: AgentsSeriesParams;
    setData: (data: AgentsSeriesResponse | null) => void;
    setStatus?: (loading: boolean) => void;
    baseUrlOverride?: string;
}

/**
 * Fetch dei dati per /fatturati/agents/series (agente singolo).
 * Se 'agent' non è passato nei params, viene ricavato dallo userContext.
 */
export async function AgentsSeriesDataAPI({
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
        agent, // opzionale
        granularity = 'auto',
        compareMode = 'yoy',
        compareFrom,
        compareTo,
        filters = {},
    } = params;

    // ricava l'agent se non specificato nei params
    const derivedAgent = String(
        agent
        ?? userContext?.details?.codici?.agente
        ?? userContext?.details?.codici?.ulterioriAgente?.[0]
        ?? ''
    ).trim().toUpperCase();

    if (!derivedAgent) {
        enqueueSnackbar('Non trovo il codice agente associato al tuo utente.', {
            title: 'Attenzione',
            type: 'warning',
        });
        setData(null);
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
        qs.set('agent', derivedAgent);

        if (granularity) qs.set('granularity', granularity);

        // mapping compareMode → query ('yoy' | 'custom')
        if (compareMode === 'yoy') {
            qs.set('compare', 'yoy');
        } else if (compareMode === 'custom') {
            qs.set('compare', 'custom');
            if (compareFrom) qs.set('compareFrom', compareFrom);
            if (compareTo) qs.set('compareTo', compareTo);
        } else {
            // 'none' → nessun confronto → compare=custom senza date
            qs.set('compare', 'custom');
        }

        // filtri business: allinea AGE all'agent ricavato se presente/differente
        const normalizedFilters: AgentsSeriesFilters = { ...filters };
        if (normalizedFilters.AGE && normalizedFilters.AGE.trim().toUpperCase() !== derivedAgent) {
            normalizedFilters.AGE = derivedAgent;
        }

        Object.entries(normalizedFilters).forEach(([k, v]) => {
            if (v != null && String(v).trim() !== '') {
                qs.set(k, String(v));
            }
        });

        const url = `${base}/fatturati/agents/series?${qs.toString()}`;
        const res = await FetchData(url, 'GET', null, abortController);

        if (res && typeof res === 'object') {
            setData(res as AgentsSeriesResponse);
        } else {
            setData(null);
            enqueueSnackbar('Risposta inattesa dal server per agents/series.', {
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
