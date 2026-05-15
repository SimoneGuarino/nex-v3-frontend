import { FetchData } from 'examples/Fetch';
import { BuyerAssistantFiltersProps } from '../types/types';


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
interface InfiniteScrollAPIProps {
    abortController: AbortController;
    setData: React.Dispatch<React.SetStateAction<any[]>>;
    offset: number;
    filters?: BuyerAssistantFiltersProps;
};

/**
 * fetch per infinite scroll (noPromo)
 * @param abortController - controller to cancel the request
 * @param setData - state setter that receives the appended rows
 * @param offset - current offset to request
 * @param filters - optional filters to apply
 * @returns Promise that resolves on success or rejects with error
 */
export function InfiniteScrollAPI({
    abortController,
    setData,
    offset,
    filters = {}
}: InfiniteScrollAPIProps): Promise<any> {
    return new Promise((resolve, reject) => {
        FetchData(
            `${import.meta.env.VITE_API_PRODUCTS}noPromo/lista?ofs=${offset}`,
            'POST',
            filters,
            abortController
        )
            .then(async (res) => {
                if (!Array.isArray(res.data)) {
                    console.error("⚠️ La risposta non è un array:", res.data);
                    return reject("Dati non validi");
                }

                setData((prev: any[]) => [...prev, ...res.data]);
                resolve(true);
            })
            .catch((error: any) => {
                reject(error.message?.msg || error.message || "Errore sconosciuto");
            });
    });
}
