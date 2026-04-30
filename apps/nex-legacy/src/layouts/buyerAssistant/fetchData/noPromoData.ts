import { FetchData } from 'examples/Fetch';
import { enqueueSnackbar } from 'components/MessageBox';
import { RefObject } from 'react';
import { BuyerAssistantFiltersProps } from '../types/types';


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
interface NoPromoAPIProps {
    abortController: any;
    offset: RefObject<number>;
    setData: (data: any[]) => void;
    setErr: (error: boolean) => void;
    setTotalData: (total: number) => void;
    setHeaders?: (headers: Record<string, string>) => void;
    ChangeLoadStatus: ({ from, bool }: { from: string; bool: boolean }) => void;
    filters?: BuyerAssistantFiltersProps;
};


// ——————————————————————————————————————————————————————————
// API FUNCTION
// ——————————————————————————————————————————————————————————
/**
 * recupera la lista paginata (attualmente intera) della lista noPromo
 * @param abortController - controller to cancel requests
 * @param offset - RefObject<number> current offset (updated by caller)
 * @param setData - setter that receives fetched rows
 * @param setErr - setter called on error
 * @param setTotalData - setter for total count
 * @param setHeaders - optional setter to receive column headers mapping
 * @param ChangeLoadStatus - callback to toggle loading states
 * @param filters - optional filters applied to the query
 */
export async function NoPromoDataAPI({
    abortController,
    offset,
    setData,
    setErr,
    setTotalData,
    setHeaders,
    ChangeLoadStatus,
    filters = {},
}: NoPromoAPIProps) {
    try {
        ChangeLoadStatus({ from: 'noPromo', bool: true });

        const baseUrl = `${import.meta.env.VITE_API_SEARCH_ENDPOINT}noPromo/lista`;

        // 1. FETCH DATI PAGINATI
        const paginatedRes = await FetchData(
            `${baseUrl}?ofs=${offset.current}`,
            'POST',
            filters,
            abortController
        );

        if (paginatedRes && paginatedRes.success && Array.isArray(paginatedRes.data)) {
            setData(paginatedRes.data);

            if (setHeaders && Array.isArray(paginatedRes.columns)) {
                const headers = paginatedRes.columns.reduce((acc: Record<string, string>, c: any) => {
                    const key = typeof c?.name === 'string' ? c.name : '';
                    if (!key) return acc;
                    const label = (typeof c?.comment === 'string' && c.comment.trim() !== '') ? c.comment.trim() : key;
                    acc[key] = label;
                    return acc;
                }, {});
                setHeaders(headers);
            }
        } else {
            enqueueSnackbar("Nessun dato ricevuto dalla API no-promo.", {
                title: 'Attenzione',
                type: 'warning',
            });
        };

        // 2. FETCH CONTEGGIO TOTALE (una sola volta se vuoi ottimizzare)
        const countRes = await FetchData(
            `${baseUrl}?countOnly=true`,
            'POST',
            filters,
            abortController
        );

        if (countRes && countRes.success && typeof countRes.total === 'number') {
            setTotalData(countRes.total);
        };

    } catch (error: any) {
        console.error("❌ Errore completo:", JSON.stringify(error, null, 2));
        if (error.name !== 'AbortError') {
            enqueueSnackbar(error.message || "Errore durante il recupero dei dati no-promo.", {
                title: 'Errore',
                type: 'error',
            });
        }
        setErr(true);
    } finally {
        ChangeLoadStatus({ from: 'noPromo', bool: false });
    };
};