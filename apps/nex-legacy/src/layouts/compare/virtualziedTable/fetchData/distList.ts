// src\layouts\compare\virtualziedTable\fetchData\distList.ts
import { FetchData } from 'examples/Fetch';
import { enqueueSnackbar } from 'components/MessageBox';

interface UserContext {
    details?: { username: string };
    token: string;
}

interface DataAPIProps {
    userContext: UserContext;
    abortController: any;
    columns: object[]; // setColumns
    ChangeLoadStatus: ({ from, bool }: { from: 'table' | 'search' | 'distList'; bool: boolean }) => void;
    setDistList: (list: string[]) => void;
    // ⭐ nuovo: callback opzionale per impostare la mappa ultimo aggiornamento
    setLastUpdates?: (map: Record<string, number>) => void;
}

interface Column {
    key: string | string[] | object;
    label: string;
    type: string;
    excludeLogic?: boolean;
    sx?: React.CSSProperties | { [key: string]: any };
    sort?: boolean;
    sortType?: string;
    multiSort?: boolean | string;
    width?: number;
    maxWidth?: number;
    secKey?: string;
    parentPropriety?: string;
    fieldToTake?: any[]; // tieni largo per i tipi già esistenti nel progetto
    distributor?: string; // proprietà custom già usata nel tuo array colonne
}

function parseLastUpdate(raw: unknown): number | null {
    if (raw == null) return null;
    if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
    if (typeof raw === 'object' && (raw as any)['$date']) {
        const v = (raw as any)['$date'];
        const n = typeof v === 'number' ? v : Date.parse(String(v));
        return Number.isFinite(n) ? n : null;
    }
    const n = Date.parse(String(raw));
    return Number.isFinite(n) ? n : null;
}

export async function DistsListAPI({
    userContext,
    abortController,
    columns,
    ChangeLoadStatus,
    setDistList,
    setLastUpdates, // ⭐ nuovo
}: DataAPIProps): Promise<Column[] | void> {
    if (userContext.details === undefined) {
        return;
    }

    return new Promise(async (resolve, reject) => {
        if (!userContext.token) {
            console.error('User token is missing');
            return enqueueSnackbar('Sembra che tu non sia loggato, perfavore effettua il login.', {
                title: 'Ops..',
                type: 'error',
            });
        }

        try {
            const res: any = await FetchData(
                `${import.meta.env.VITE_API_PRODUCTS}distributors/list`,
                'GET',
                null,
                abortController
            );

            if (!res || Object.keys(res).length === 0) {
                ChangeLoadStatus({ from: 'table', bool: false });
                return resolve(undefined);
            }

            // può essere:
            // - array di nomi ["Bestit", ...]
            // - oggetto con Distributori: { Bestit: { Aggiornato: ... }, ... }
            // - oggetto piatto { Bestit: { Aggiornato: ... }, ... }
            let distNames: string[] = [];
            let lastMap: Record<string, number> = {};

            if (Array.isArray(res)) {
                distNames = res;
            } else if (res && typeof res === 'object') {
                const src: Record<string, any> = (res.Distributori ?? res);
                distNames = Object.keys(src);

                // estrai "Aggiornato" per ogni fornitore se presente
                for (const [name, obj] of Object.entries(src)) {
                    const raw = obj && obj['Aggiornato'] ? obj['Aggiornato'] : null;
                    const ms = parseLastUpdate(raw);
                    if (ms != null) lastMap[name] = ms;
                }
            }

            // imposta dist list
            setDistList(distNames);

            // imposta la mappa 'ultimo aggiornamento' se presente e se richiesto
            if (setLastUpdates && Object.keys(lastMap).length > 0) {
                setLastUpdates(lastMap);
            }

            // costruzione colonne (manteniamo la tua logica)
            let finalCopy: any[] = [...(columns as any[])];

            for (let i = 0; i < distNames.length; i++) {
                const dist = distNames[i];
                if ((finalCopy as any[]).find((item: any) => item.distributor === dist)) {
                    continue;
                }

                finalCopy.push({
                    key: ['Fornitori'],
                    distributor: dist,
                    fieldToTake: [
                        { key: [{ key: 'Prezzo' }, { key: 'PrezzoListino' }], type: 'eur', conditionToHide: [null, '', 0, undefined] },
                        { key: 'Disponibili', type: 'pz', conditionToHide: [null, '', 0, undefined] },
                        { key: '', type: 'tax', elmToTake: ['Siae', 'Raee'], conditionToHide: [null, undefined, 0], sx: { fontSize: 'calc(0.40vw + 0.40vh) !important' } },
                        { key: 'Promo', type: 'promo', condition: [null, false, undefined], sx: { fontWeight: '600', fontSize: '11px !important', color: '#e1a12c' } },
                    ],
                    label: dist,
                    type: 'supplier',
                    sx: { alignItems: 'flex-end' },
                    width: 150,
                });
            }

            // aggiungi colonna Keepa una sola volta
            const hasKeepa = finalCopy.some(c => c?.label === 'Keepa');
            if (!hasKeepa) {
                finalCopy.push({
                    key: ['Keepa'],
                    fieldToTake: [
                        {
                            key: 'Keepa',
                            secKey: 'Amazon',
                            type: 'eur',
                            icons: 'fa-brands fa-amazon',
                            nameToShow: 'Amazon',
                            title: 'Prezzo Keepa Amazon',
                            ariaLabel: 'Prezzo Keepa Amazon',
                            onHover: true
                        },
                        {
                            key: 'Keepa',
                            secKey: 'Ebay',
                            type: 'eur',
                            icons: 'fa-brands fa-ebay',
                            nameToShow: 'eBay',
                            title: 'Prezzo Keepa eBay',
                            ariaLabel: 'Prezzo Keepa eBay',
                            onHover: true
                        },
                        // opzionale:
                        // { key: 'Keepa', secKey: 'Aggiornato', type: 'date', title: 'Ultimo aggiornamento', ariaLabel: 'Ultimo aggiornamento', onHover: true }
                    ],
                    label: 'Keepa',
                    type: 'multiple',
                    sx: { alignItems: 'flex-end' },
                    width: 150
                });
            }

            return resolve(finalCopy);
        } catch (errorState: any) {
            if (errorState?.name === 'AbortError') return;
            let error_ = '';
            const error: string | { [key: string]: string } | undefined = errorState?.message;
            console.error(errorState);

            if (error) {
                if (typeof error === 'string') {
                    error_ = (error as any).message;
                } else if (error !== undefined && (error as any)?.msg) {
                    error_ = (error as any).msg;
                }
            }

            if (!error_ || error_.trim() === '') {
                error_ = 'Sembra che ci sia stato un problema nel retrive dei dati nella tabella, perfavore contatta un tecnico.';
            }

            enqueueSnackbar(error_, { title: 'Ops..', type: 'error' });
            return reject(error_);
        }
    });
}
