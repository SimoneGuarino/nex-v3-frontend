import { useState, useRef, useCallback } from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import { TableVirtualized } from "components/Virtualized/table";
import Topbar from "./components/Topbar";
import type { MovimentiResponse, Movimento, MovimentiPayload } from "./fetchdata/listaMovimenti";
import { getListaMovimenti } from "./fetchdata/listaMovimenti";
import { Tooltip } from "react-tooltip";


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
// Tipo esteso con data formattata come stringa e valore numerico per sort
interface MovimentoFormatted extends Omit<Movimento, 'DATA_MOVIMENTO'> {
    DATA_MOVIMENTO: string;
    DATA_MOVIMENTO_NUM: number;
};


// ——————————————————————————————————————————————————————————
// UTILS
// ——————————————————————————————————————————————————————————
/**
 * formatta la data
 * @param yymmdd 
 * @returns 
 */
const yymmddToString = (yymmdd: number): string => {
    const str = yymmdd.toString().padStart(6, '0');
    const yy = str.substring(0, 2);
    const mm = str.substring(2, 4);
    const dd = str.substring(4, 6);
    return `${dd}/${mm}/${yy}`;
};


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * pagina movimenti
 * @returns 
 */
export function Movimenti() {
    const [movimenti, setMovimenti] = useState<MovimentoFormatted[]>([]); //state con array di movimenti da passare alla tabella
    const [totalMovimenti, setTotalMovimenti] = useState(0); // state per totale movimenti
    const [loadingResults, setLoadingResults] = useState(false); //state di loading
    const [hasSearched, setHasSearched] = useState(false); //state per determinare se si ha già effettuato una ricerca (usata per esportare i valori effettivamente cercati)
    const [loadMoreLoading, setLoadMoreLoading] = useState(false); //ulteriore stato di loading per infinite scroll

    // Offset e payload corrente per infinite scroll
    const offsetRef = useRef(0); //gestisce offset in infinite scroll
    const currentPayloadRef = useRef<MovimentiPayload | null>(null); //mantiene lo stesso payload per le chiamate successive alla prima durante infinitescroll
    const loadMoreAbortRef = useRef<AbortController | null>(null); //loading in infinite scroll

    /**
     * handler della ricerca, aggiorna i 2 stati
     */
    const handleSearchStart = () => {
        setLoadingResults(true);
        setHasSearched(true);
    };

    /**
     * carica i risultati per la tabella
     * @param data 
     * @param payload 
     */
    const handleSearchComplete = (data: MovimentiResponse, payload: MovimentiPayload) => {
        // Reset offset per nuova ricerca
        offsetRef.current = data.pageSize;
        currentPayloadRef.current = payload;

        // Trasforma DATA_MOVIMENTO da YYMMDD a stringa formattata + mantieni valore numerico per sort
        const formattedData = data.data.map(movimento => ({
            ...movimento,
            DATA_MOVIMENTO: yymmddToString(movimento.DATA_MOVIMENTO),
            DATA_MOVIMENTO_NUM: movimento.DATA_MOVIMENTO
        }));
        setMovimenti(formattedData);
        setTotalMovimenti(data.total);
        setLoadingResults(false);
    };

    // Funzione per caricare più risultati (infinite scroll)
    const handleLoadMore = useCallback(async (): Promise<boolean | string> => {
        if (!currentPayloadRef.current || loadMoreLoading) return false;
        if (movimenti.length >= totalMovimenti) return false;

        try {
            setLoadMoreLoading(true);
            loadMoreAbortRef.current = new AbortController();

            const response = await getListaMovimenti(
                currentPayloadRef.current,
                offsetRef.current,
                loadMoreAbortRef.current
            );

            // Trasforma e appendi i nuovi dati
            const formattedData = response.data.map(movimento => ({
                ...movimento,
                DATA_MOVIMENTO: yymmddToString(movimento.DATA_MOVIMENTO),
                DATA_MOVIMENTO_NUM: movimento.DATA_MOVIMENTO
            }));

            setMovimenti(prev => [...prev, ...formattedData]);
            offsetRef.current += response.pageSize;

            return true;
        } catch (err) {
            console.error("Errore caricamento ulteriori movimenti:", err);
            return false;
        } finally {
            setLoadMoreLoading(false);
        }
    }, [movimenti.length, totalMovimenti, loadMoreLoading]);

    /**
     * gestisce gli errori in fase di ricerca
     * @param error 
     */
    const handleSearchError = (error: any) => {
        console.error("Errore ricerca:", error);
        setLoadingResults(false);
        setMovimenti([]);
        setTotalMovimenti(0);
    };

    // Colonne della tabella
    const columns = [
        { label: "CODICE ARTICOLO", key: "COD_ARTICOLO", sort: true, sortType: "string", type: "string", width: 180, sx: { alignItems: "center" } },
        { label: "DESCRIZIONE", key: "DESCRIZIONE", width: 250, onHover: true, sx: { alignItems: "center" } },
        { label: "LINEA", key: "LINEA", sort: true, sortType: "string", type: "string", width: 120, sx: { alignItems: "center" } },
        { label: "GRUPPO", key: "GRUPPO", sort: true, sortType: "string", type: "string", width: 120, sx: { alignItems: "center" } },
        { label: "FAMIGLIA", key: "FAMIGLIA", sort: true, sortType: "string", type: "string", width: 120, sx: { alignItems: "center" } },
        { label: "QUANTITA", key: "QUANTITA", sort: true, sortType: "number", type: "number", width: 100, sx: { alignItems: "center" } },
        { label: "PREZZO", key: "PREZZO", type: "eur", sort: true, sortType: "number", width: 120, sx: { alignItems: "center" } },
        { label: "DATA MOVIMENTO", key: "DATA_MOVIMENTO", sort: true, sortType: "string", width: 150, sx: { alignItems: "center" } },
        { label: "CAUSALE", key: "CAUSALE", sort: true, sortType: "number", width: 100, sx: { alignItems: "center" } },
        { label: "NUMERO DOCUMENTO", key: "NUM_DOCUMENTO", sort: true, sortType: "string", width: 180, sx: { alignItems: "center" } },
        { label: "CODICE CLIENTE", key: "COD_CLIENTE", sort: true, sortType: "string", width: 150, sx: { alignItems: "center" } },
        { label: "RAGIONE SOCIALE", key: "RAG_SOCIALE", width: 200, onHover: true, sx: { alignItems: "center" } },
        { label: "MAGAZZINO", key: "MAGAZZINO", sort: true, sortType: "string", width: 120, sx: { alignItems: "center" } },
        { label: "CODICE AGENTE", key: "COD_AGENTE", sort: true, sortType: "string", width: 130, sx: { alignItems: "center" } },
    ];


    // ——————————————————————————————————————————————————————————
    // RENDER
    // ——————————————————————————————————————————————————————————
    return (
        <DashboardLayout>
            <div className="w-full h-full flex flex-col gap-2">
                <Topbar
                    onSearchStart={handleSearchStart}
                    onSearchComplete={handleSearchComplete}
                    onSearchError={handleSearchError}
                />

                {!hasSearched ? (
                    // Stato iniziale: nessuna ricerca effettuata
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-6xl mb-4 opacity-50">📋</div>
                            <p className="text-lg text-neutral-600 dark:text-neutral-400">
                                Applica i filtri e premi <span className="font-semibold">"Cerca"</span> per visualizzare i movimenti
                            </p>
                        </div>
                    </div>
                ) : (
                    // Tabella con risultati
                    <TableVirtualized
                        data={movimenti}
                        setData={setMovimenti}
                        columns={columns}
                        setColumns={() => { }}
                        results={totalMovimenti}
                        loadStatus={loadingResults}
                        className="h-full w-full"
                        infiniteScroll={{
                            func: handleLoadMore,
                            loadStatus: loadMoreLoading,
                            numberToFetch: 50
                        }}
                    />
                )}
            </div>
            <Tooltip
                id="movimenti-tooltip"
                place="bottom"
                style={{
                    maxWidth: "15vw",
                    minWidth: 150,
                    fontSize: "0.87rem",
                    textAlign: "center",
                    zIndex: 999999,
                }}
            />
        </DashboardLayout>
    );
}

export default Movimenti;