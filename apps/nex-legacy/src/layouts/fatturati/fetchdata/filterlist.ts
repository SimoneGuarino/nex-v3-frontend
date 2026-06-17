import { FetchData } from 'examples/Fetch';
import { enqueueSnackbar } from 'components/MessageBox';
import { type FDSelectOption } from '@nex/fd-ui';

// === Tipi ===

export type FilterKey =
    | 'CAPO' | 'CLI' | 'AGE' | 'PRF' | 'LIP' | 'GRU' | 'FAM' | 'ART' | 'MAG' | 'CNV' | 'BUY' | 'ARG' | 'CCA';

export interface FilterListBusinessFilters {
    CAPO?: string; //pannello principale (cash & carry)
    CLI?: string; //pannello principale (cliente)
    AGE?: string; // da valutare
    PRF?: string; //pannello brand (marca)
    LIP?: string; //pannello brand (linea)
    GRU?: string; //pannello brand (gruppo)
    FAM?: string; //pannello brand (famiglia)
    ART?: string; //ricerca mirata
    MAG?: string; //pannello principale (magazzino)
    CNV?: string; //pannello principale (canale di vendita)
    BUY?: string; //da valutare
    ARG?: string; //pannello principale (area geografica)
    CCA?: string; //pannello principale (causale di vendita)
}

export interface FilterListParams {
    filter: FilterKey;           // segmento path :filter
    sysInfo: string;             // obbligatorio
    agent?: string;              // opzionale; ignorato lato BE se filter === 'AGE'
    q?: string;                  // filtro testuale
    page?: number | string;      // default 1
    pageSize?: number | string;  // default 50 (max 200)
    business?: FilterListBusinessFilters; // altri filtri business
}

export interface FilterListItem {
    key: string | number;
    descrizione: string;
}

export interface FilterListResponse {
    items: FilterListItem[];
    page: number;
    pageSize: number;
    total: number | null;
    metadata: { generatedAt: string; partial: boolean };
}

// === API ===

interface DataAPIProps {
    userContext: any;                // deve contenere almeno token
    abortController: AbortController;
    params: FilterListParams;
    setData?: (data: FilterListResponse | null) => void; // opzionale: se non passato, ritorna la response
    setStatus?: (loading: boolean) => void;
    baseUrlOverride?: string;        // opzionale
}

/**
 * fetch per GET /fatturati/filterlist/:filter
 * - restituisce la lista paginata { key, descrizione }
 * - applica sysInfo, agent (se ammesso), q, paginazione e filtri business
 */
export async function FilterListAPI({
    userContext,
    abortController,
    params,
    setData,
    setStatus,
    baseUrlOverride,
}: DataAPIProps): Promise<FilterListResponse | null> {
    if (!userContext?.token) {
        enqueueSnackbar('Sembra che tu non sia loggato, perfavore effettua il login.', {
            title: 'Ops..',
            type: 'error',
        });
        return null;
    }

    const {
        filter,
        sysInfo,
        agent,
        q,
        page = 1,
        pageSize = 50,
        business = {},
    } = params;

    if (!filter || !sysInfo) {
        enqueueSnackbar('Parametro mancante: filter o sysInfo.', { title: 'Errore', type: 'error' });
        return null;
    }

    setStatus?.(true);

    try {
        const baseEnv = baseUrlOverride ?? import.meta.env.VITE_API_STOCKS;
        if (!baseEnv) {
            enqueueSnackbar("L'endpoint dell'API non è configurato.", { title: 'Errore', type: 'error' });
            return null;
        }
        const base = baseEnv.endsWith('/') ? baseEnv.slice(0, -1) : baseEnv;

        const qs = new URLSearchParams();
        qs.set('sysInfo', sysInfo);

        if (agent && String(agent).trim() !== '') {
            // lato BE verrà ignorato se filter === 'AGE'
            qs.set('agent', String(agent).trim().toUpperCase());
        }

        if (q && q.trim() !== '') qs.set('q', q.trim());
        if (page != null) qs.set('page', String(page));
        if (pageSize != null) qs.set('pageSize', String(pageSize));

        // filtri business opzionali (il BE esclude quello corrispondente a :filter)
        Object.entries(business).forEach(([k, v]) => {
            if (v != null && String(v).trim() !== '') qs.set(k, String(v));
        });

        const url = `${base}/fatturati/filterlist/${filter}?${qs.toString()}`;
        const res = await FetchData(url, 'GET', null, abortController);

        // validazione minima
        const ok = res && typeof res === 'object' && Array.isArray(res.items);
        if (!ok) {
            enqueueSnackbar('Risposta inattesa dal server per filterlist.', {
                title: 'Attenzione',
                type: 'warning',
            });
            setData?.(null);
            return null;
        }

        // normalizza output (key/descrizione resilienti a maiuscole/alias)
        const items: FilterListItem[] = (res.items as any[]).map((r: any) => ({
            key: r?.key ?? r?.KEY ?? r?.Key,
            descrizione: r?.descrizione ?? r?.DESCRIZIONE ?? r?.Descrizione ?? '',
        }));

        const payload: FilterListResponse = {
            items,
            page: Number(res.page ?? 1),
            pageSize: Number(res.pageSize ?? items.length ?? 0),
            total: res.total ?? null,
            metadata: res.metadata ?? { generatedAt: new Date().toISOString(), partial: false },
        };

        setData?.(payload);
        return payload;
    } catch (errorState: any) {
        if (errorState?.name !== 'AbortError') {
            console.error(errorState);
            let message = '';
            const errMsg: string | { msg?: string } | undefined = errorState?.message;
            if (typeof errMsg === 'string') message = errMsg;
            else if (errMsg && typeof errMsg === 'object' && errMsg.msg) message = errMsg.msg;
            if (!message || message.trim() === '') {
                message = 'Si è verificato un problema nel recupero della lista filtri.';
            }
            if (errorState?.status !== 404) {
                enqueueSnackbar(message, { title: 'Ops..', type: 'error' });
            }
            setData?.(null);
        }
        return null;
    } finally {
        setStatus?.(false);
    }
}

/**
 * Helper: restituisce direttamente una lista di FDSelectOption
 * - label = `${key} - ${descrizione}` (se descrizione presente), altrimenti `key`
 * - value = `key` come string
 */
export async function FilterListAsOptionsAPI(args: Omit<DataAPIProps, 'setData'>): Promise<FDSelectOption<string>[]> {
    const res = await FilterListAPI({ ...args, setData: undefined });
    if (!res) return [];
    const options: FDSelectOption<string>[] = res.items
        .filter(it => it.key != null && String(it.key).trim() !== '')
        .map(it => {
            const keyStr = String(it.key).trim();
            const desc = String(it.descrizione || '').trim();
            const label = desc ? `${keyStr} - ${desc}` : keyStr;
            return { value: keyStr, label };
        });
    // ordinamento al volo per label
    options.sort((a, b) => a.label.toUpperCase().localeCompare(b.label.toUpperCase(), 'it', { sensitivity: 'base' }));
    return options;
}
