// // src/layouts/fatturati/fetchdata/buyers/series.ts
// import { FetchData } from 'examples/Fetch';
// import { enqueueSnackbar } from 'components/MessageBox';

// type Granularity = 'auto' | 'day' | 'month';
// export type CompareMode = 'yoy' | 'custom' | 'none';

// export interface BuyersSeriesFilters {
//     CAPO?: string;
//     CLI?: string;
//     AGE?: string;
//     PRF?: string;
//     LIP?: string;
//     GRU?: string;
//     FAM?: string;
//     ART?: string;
//     MAG?: string;
//     CNV?: string;
//     BUY?: string;
//     ARG?: string;
// }

// export interface BuyersSeriesParams {
//     from: string;        // 'YYYY-MM-DD'
//     to: string;          // 'YYYY-MM-DD'
//     WBMOV00F: string;    // es. 'FOCWEB'
//     sysInfo: string;     // es. 'FOCELDA'
//     granularity?: Granularity;     // default 'auto'
//     compareMode?: CompareMode;     // 'yoy' | 'custom' | 'none'
//     compareFrom?: string;          // se compareMode='custom'
//     compareTo?: string;            // se compareMode='custom'
//     topN?: number | string;        // default 10
//     filters?: BuyersSeriesFilters; // filtri business
// }

// export interface BuyersSeriesResponse {
//     granularity: 'day' | 'month';
//     series: Array<{ label: string; points: Array<{ x: string; y: number }> }>;
//     kpi: {
//         current: number;
//         previous: number | null;
//         deltaYoYPct: number | null;
//         documents: number | null;
//         avgTicket: number | null;
//     };
//     topN: any[];
//     metadata: { generatedAt: string; partial: boolean };
// }

// interface DataAPIProps {
//     userContext: any; // deve avere almeno { token?: string; details?: any }
//     abortController: AbortController;
//     params: BuyersSeriesParams;
//     setData: (data: BuyersSeriesResponse | null) => void;
//     setStatus?: (loading: boolean) => void;
//     baseUrlOverride?: string;
// }

// /**
//  * Fetch dei dati per /fatturati/buyers/series
//  */
// export async function BuyersSeriesDataAPI({
//     userContext,
//     abortController,
//     params,
//     setData,
//     setStatus,
//     baseUrlOverride,
// }: DataAPIProps) {
//     if (!userContext) return;

//     if (!userContext?.token) {
//         console.error('User token is missing');
//         enqueueSnackbar('Sembra che tu non sia loggato, perfavore effettua il login.', {
//             title: 'Ops..',
//             type: 'error',
//         });
//         return;
//     }

//     setStatus?.(true);

//     try {
//         const baseEnv = import.meta.env.VITE_API_STOCKS;
//         if (!baseEnv) {
//             enqueueSnackbar('L\'endpoint dell\'API non è configurato.', { title: 'Errore', type: 'error' });
//             return;
//         }

//         const base = baseEnv.endsWith('/') ? baseEnv.slice(0, -1) : baseEnv;

//         const {
//             from,
//             to,
//             WBMOV00F,
//             sysInfo,
//             granularity = 'auto',
//             compareMode = 'yoy',
//             compareFrom,
//             compareTo,
//             topN = 10,
//             filters = {},
//         } = params;

//         const qs = new URLSearchParams();
//         qs.set('from', from);
//         qs.set('to', to);
//         qs.set('WBMOV00F', WBMOV00F);
//         qs.set('sysInfo', sysInfo);

//         if (granularity) qs.set('granularity', granularity);

//         // mapping compareMode → query
//         if (compareMode === 'yoy') {
//             qs.set('compare', 'yoy');
//         } else if (compareMode === 'custom') {
//             qs.set('compare', 'custom');
//             if (compareFrom) qs.set('compareFrom', compareFrom);
//             if (compareTo) qs.set('compareTo', compareTo);
//         } else {
//             // 'none' → niente confronto → compare=custom senza date
//             qs.set('compare', 'custom');
//         }

//         if (topN != null) qs.set('topN', String(topN));

//         // filtri business
//         Object.entries(filters).forEach(([k, v]) => {
//             if (v != null && String(v).trim() !== '') qs.set(k, String(v));
//         });

//         const url = `${base}/fatturati/buyers/series?${qs.toString()}`;

//         const res = await FetchData(url, 'GET', null, abortController);

//         if (res && typeof res === 'object') {
//             setData(res as BuyersSeriesResponse);
//         } else {
//             setData(null);
//             enqueueSnackbar('Risposta inattesa dal server per buyers/series.', {
//                 title: 'Attenzione',
//                 type: 'warning',
//             });
//         }
//     } catch (errorState: any) {
//         if (errorState?.name !== 'AbortError') {
//             console.error(errorState);
//             let message = '';
//             const errMsg: string | { msg?: string } | undefined = errorState?.message;
//             if (typeof errMsg === 'string') {
//                 message = errMsg;
//             } else if (errMsg && typeof errMsg === 'object' && errMsg.msg) {
//                 message = errMsg.msg;
//             }
//             if (!message || message.trim() === '') {
//                 message = 'Sembra che ci sia stato un problema nel recupero dei dati, perfavore contatta un tecnico.';
//             }
//             if (errorState?.status !== 404) {
//                 enqueueSnackbar(message, {
//                     title: 'Ops..',
//                     type: 'error',
//                 });
//             }
//             setData(null);
//         }
//     } finally {
//         setStatus?.(false);
//     }
// }
