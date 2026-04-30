// src/layouts/compare/virtualziedTable/fetchData/lastUpdates.ts
import { FetchData } from 'examples/Fetch';

interface UserContext {
    token: string;
    details?: { username: string };
}

/**
 * Restituisce una mappa { [nomeFornitore]: epochMs } per l'ultimo aggiornamento file.
 * Formati accettati:
 * 1) Mappa piatta (nuova rotta): { [name]: number | string | { $date: ... } }
 * 2) Legacy annidato:
 *    - { Distributori: { [name]: { Aggiornato: { $date: ... } | ... } } }
 *    - { [name]: { Aggiornato: ... } }
 */
export async function LastUpdatesAPI({
    userContext,
    abortController,
}: {
    userContext: UserContext;
    abortController: any;
}): Promise<Record<string, number>> {
    if (!userContext?.token) return {};

    // Usa env dedicata se presente, altrimenti fallback al SEARCH_ENDPOINT + /distributors/last-update
    const url =
        import.meta.env.VITE_API_IMPORTS_STATUS_ENDPOINT ||
        `${import.meta.env.VITE_API_SEARCH_ENDPOINT}distributors/last-update`;

    // normalizzatore robusto → sempre epoch ms o null
    const toMs = (raw: unknown): number | null => {
        if (raw == null) return null;
        if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
        if (typeof raw === 'object') {
            const maybe = raw as Record<string, unknown>;
            if ('$date' in maybe) {
                const v = maybe.$date as unknown;
                const n = typeof v === 'number' ? v : Date.parse(String(v));
                return Number.isFinite(n) ? n : null;
            }
            if ('Aggiornato' in maybe) {
                const v = (maybe as any).Aggiornato;
                return toMs(v);
            }
        }
        const n = Date.parse(String(raw));
        return Number.isFinite(n) ? n : null;
    };

    try {
        const res = await FetchData(url, 'GET', null, abortController);

        if (!res || typeof res !== 'object') return {};

        // supporta sia mappa piatta sia { Distributori: { ... } } sia { [name]: { Aggiornato: ... } }
        const source = (res as any).Distributori ?? res;
        const out: Record<string, number> = {};

        for (const [name, value] of Object.entries(source as Record<string, unknown>)) {
            const ms = toMs(value);
            if (ms != null) out[name] = ms;
        }

        return out;
    } catch (e) {
        console.warn('[LastUpdatesAPI] errore fetch:', e);
        return {};
    }
}
