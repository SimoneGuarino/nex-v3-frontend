import { useCallback, useEffect, useRef, useState } from "react";
import { BuyerAssistantFiltersProps } from "../types/types";
import { NoPromoDataAPI } from "../fetchData/noPromoData";
import { FormatDateString } from "utils/date/getDate";
import { useUserContext } from "context/UserContext";


// ——————————————————————————————————————————————————————————
// CONSTANTS
// ——————————————————————————————————————————————————————————
/** Colonne data da formattare in YYYY-MM-DD */
const DATE_STRING_COLS = new Set(["ult_car", "ult_ven"]);
const PAGE_SIZE = 50;


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACES
// ——————————————————————————————————————————————————————————


// ——————————————————————————————————————————————————————————
// UTILS
// ——————————————————————————————————————————————————————————
/** Normalizza colonne speciali (ult_car, ult_ven) come stringa YYYY-MM-DD */
function normalizeSpecialColumns(rows: any[]): any[] {
    return rows.map((row) => {
        const r: any = { ...row };
        for (const k of DATE_STRING_COLS) {
            if (k in r && r[k] != null) {
                const formatted = FormatDateString({
                    date: r[k],
                    actualFromat: "iso",
                    desiredFormat: "yyyy-mm-dd",
                });
                r[k] = formatted ?? r[k];
            }
        }
        return r;
    });
};


export function useBuyerAssistant() {
    const [userContext] = useUserContext();// User context

    const [tableData, setTableData] = useState<any[]>([]); //state per i dati da mostrare in pagina
    const [tableTotalData, setTableTotalData] = useState<number>(0); //state per i dati da mostrare in pagina
    const [header, setHeaders] = useState<Record<string, string>>({}); //state per gli headers della tabella (nomi delle colonne)

    const [filters, setFilters] = useState<BuyerAssistantFiltersProps>({}); //state per i filtri attivi

    const [err, setErr] = useState(false); //state per errori
    const [loading, setLoading] = useState<{ [key: string]: boolean }>({
        filters_data: false,
        table_of_products: false,
    }); // stato di caricamento della ricerca

    const offset = useRef<number>(0); //ref per tenere traccia dell'offset per la paginazione
    const tableAbortRef = useRef(new AbortController());
    // ——————————————————————————————————————————————————————————
    // HANDLERS
    // ——————————————————————————————————————————————————————————
    /**
     * Funzione per resettare i dati della tabella e l'offset (usata quando cambiano i filtri)
     */
    const handleResetSearch = () => {
        setTableData([]);
        setTableTotalData(0);
        setErr(false);
        offset.current = 0;
    };

    /**
     * Funzione per gestire il cambio dei filtri, aggiorna lo stato dei filtri attivi
     * @param key chiave del filtro (es. "brand", "linea", ecc.)
     * @param value valore del filtro (es. ["brand1", "brand2"], "linea1", ecc.)
     */
    const handleChangeFilters = ({key, value, deleteProps}: {key: keyof BuyerAssistantFiltersProps; value: any; deleteProps?: (keyof BuyerAssistantFiltersProps)[]}) => {
        return setFilters((prevFilters) => {
            const newFilters = { ...prevFilters, [key]: value };
            if (deleteProps) {
                for (const prop of deleteProps) {
                    delete newFilters[prop];
                }
            }
            return newFilters;
        });
    };


    // ——————————————————————————————————————————————————————————
    // FETCHES
    // ——————————————————————————————————————————————————————————
    /**
     * Funzione per eseguire la ricerca dei prodotti presenti sul database
     * @param query La query di ricerca
     * @param signal Il segnale di abort
     * @param fromScroll Indica se la ricerca è stata chiamata dallo scroll (per paginazione)
     * @returns SearchResponse
     */
    const runSearch = useCallback(async () => {
        handleResetSearch();
        await NoPromoDataAPI({
            abortController: tableAbortRef.current,
            offset,
            setHeaders,
            setData: (fetchedData) => {
                const normalized = normalizeSpecialColumns(fetchedData);
                setTableData(normalized);
                offset.current += PAGE_SIZE;
            },
            setErr,
            setTotalData: setTableTotalData,
            ChangeLoadStatus: ({ from, bool }) => {
                if (from === "noPromo") {
                    setLoading((prev) => ({ ...prev, table_of_products: bool }));
                }
            },
            filters,
        });
    }, [filters]);


    // ——————————————————————————————————————————————————————————
    // USE EFFECTS
    // ——————————————————————————————————————————————————————————
    useEffect(() => {
        handleResetSearch();
        runSearch();

        return () => {
            tableAbortRef.current.abort();
            tableAbortRef.current = new AbortController();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userContext]);


    // ——————————————————————————————————————————————————————————
    // RETURN HOOK
    // ——————————————————————————————————————————————————————————
    return {
        userContext,

        tableData, setTableData,
        tableTotalData,
        header,

        filters, setFilters,
        handleChangeFilters,

        err, setErr,
        loading,
        runSearch,
    };
};