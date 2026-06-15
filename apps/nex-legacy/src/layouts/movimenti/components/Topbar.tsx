import { useRef, useState, useEffect } from "react";

import { enqueueSnackbar } from "components/MessageBox";

import { FDBox } from "@nex/fd-ui";
import FDButton from "components/UI/buttons/FDButton";
import { ContextMenu } from "components/UI/menu/ContextMenu";

import { getListaCausali, type Causale } from "../fetchdata/listaCausali";
import { getListaMovimenti, type MovimentiResponse, type MovimentiPayload } from "../fetchdata/listaMovimenti";
import { exportMovimentiCSV, downloadCSV } from "../fetchdata/exportMovimenti";
import { FiltersMenu, type ValidationErrors, type FilterValues } from "./FiltersMenu";

//icons
import { IoSearch, IoFilterSharp } from "react-icons/io5";
import { IoMdDownload } from "react-icons/io";


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
interface SelectOption {
    label: string;
    value: string | number;
}

interface TopbarProps {
    onSearchComplete?: (data: MovimentiResponse, payload: MovimentiPayload) => void;
    onSearchStart?: () => void;
    onSearchError?: (error: any) => void;
}


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * Barra superiore con filtri, ricerca ed export
 */
export function Topbar({ onSearchComplete, onSearchStart, onSearchError }: TopbarProps) {
    const filterBtnRef = useRef<HTMLDivElement | null>(null); //ref per ancorare il filters menu
    const [openFilters, setOpenFilters] = useState(false); //stato per aprire e chiudere il filtersmenu
    const [causaliOptions, setCausaliOptions] = useState<SelectOption[]>([]); //array di causali per le select
    const [loading, setLoading] = useState(false); //loading caricamento causali
    const [filterErrors, setFilterErrors] = useState<ValidationErrors>({}); //errori di validazione filtri
    const [showFilterError, setShowFilterError] = useState(false); //mostra/nasconde errori
    const [searchLoading, setSearchLoading] = useState(false); //loading ricerca
    const [exportLoading, setExportLoading] = useState(false); //loading export
    const [resetKey, setResetKey] = useState(0); //chiave per forzare re-render FiltersMenu
    const [lastSearchPayload, setLastSearchPayload] = useState<MovimentiPayload | null>(null); //payload ultima ricerca (per export)

    // Stato dei filtri - mantiene i valori anche quando il menu viene chiuso/aperto
    const [causale1, setCausale1] = useState<string | number | undefined>();
    const [causale2, setCausale2] = useState<string | number | undefined>();
    const [dataInizio, setDataInizio] = useState<string | undefined>();
    const [dataFine, setDataFine] = useState<string | undefined>();

    // Refs per abort controller delle varie chiamate
    const causaliAbortRef = useRef<AbortController | null>(null);
    const searchAbortRef = useRef<AbortController | null>(null);
    const exportAbortRef = useRef<AbortController | null>(null);
    const fetchedRef = useRef(false); //evita doppia chiamata causali


    // ——————————————————————————————————————————————————————————
    // EFFECTS
    // ——————————————————————————————————————————————————————————
    /**
     * Carica lista causali al mount
     */
    useEffect(() => {
        if (fetchedRef.current) return;

        const fetchCausali = async () => {
            setLoading(true);
            try {
                causaliAbortRef.current = new AbortController();
                const causali = await getListaCausali(causaliAbortRef.current);

                const options = causali.map((causale: Causale) => {
                    const prefix =
                        causale.ANNULLATA && (causale.ANNULLATA === "A" || causale.ANNULLATA === "a")
                            ? "(A) "
                            : "";
                    const label = `${prefix}${causale.COD_CAUSALE} - ${causale.DESC_CAUSALE}`;
                    return {
                        label,
                        value: causale.COD_CAUSALE,
                    };
                });

                setCausaliOptions(options);
                fetchedRef.current = true;
            } catch (err) {
                console.error("Errore nel caricamento delle causali:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCausali();

        return () => {
            causaliAbortRef.current?.abort();
        };
    }, []);


    // ——————————————————————————————————————————————————————————
    // UTILS
    // ——————————————————————————————————————————————————————————
    /**
     * Converte data da formato YYYY-MM-DD a YYMMDD
     * @param dateStr 
     * @returns 
     */
    const dateToYYMMDD = (dateStr: string): number => {
        const [year, month, day] = dateStr.split("-");
        const yy = year.slice(-2);
        return parseInt(`${yy}${month}${day}`);
    };

    /**
     * Costruisce il tooltip con i filtri attivi
     * @returns 
     */
    const buildFiltersTooltip = (): string => {
        const parts: string[] = [];

        if (causale1) {
            const causale1Label = causaliOptions.find(opt => opt.value === causale1)?.label || String(causale1);
            parts.push(`Causale 1: ${causale1Label}`);
        }
        if (causale2) {
            const causale2Label = causaliOptions.find(opt => opt.value === causale2)?.label || String(causale2);
            parts.push(`Causale 2: ${causale2Label}`);
        }
        if (dataInizio) {
            const [year, month, day] = dataInizio.split("-");
            parts.push(`Da: ${day}/${month}/${year}`);
        }
        if (dataFine) {
            const [year, month, day] = dataFine.split("-");
            parts.push(`A: ${day}/${month}/${year}`);
        }

        return parts.length > 0 ? parts.join(" | ") : "Nessun filtro attivo";
    };

    // Conta i filtri attivi
    const filtersCount = [causale1, causale2, dataInizio, dataFine].filter(Boolean).length;


    // ——————————————————————————————————————————————————————————
    // HANDLERS
    // ——————————————————————————————————————————————————————————
    /**
     * Valida e avvia la ricerca
     */
    const handleSearch = () => {
        // Se non ci sono errori e i filtri sono validi, effettua la ricerca
        if (Object.keys(filterErrors).length === 0 && causale1) {
            performSearch({ causale1, causale2, dataInizio, dataFine });
        } else {
            // Mostra errore visivo
            setShowFilterError(true);
            setTimeout(() => {
                setShowFilterError(false);
            }, 2000);
            enqueueSnackbar(
                "Errore: assicurati di aver selezionato almeno la Causale 1 e che tutti i filtri siano validi.",
                { type: "error" },
            );
        };
    };

    /**
     * Esegue la chiamata API per la ricerca movimenti
     * @param filters 
     */
    const performSearch = async (filters: FilterValues) => {
        try {
            onSearchStart?.();
            setSearchLoading(true);

            // Converte i filtri nel formato atteso dall'API
            const causali = [];
            if (filters.causale1) causali.push(Number(filters.causale1));
            if (filters.causale2) causali.push(Number(filters.causale2));

            const dataInizioNum = filters.dataInizio ? dateToYYMMDD(filters.dataInizio) : 0;
            const dataFineNum = filters.dataFine ? dateToYYMMDD(filters.dataFine) : 0;

            const payload: MovimentiPayload = {
                causali,
                dataInizio: dataInizioNum,
                dataFine: dataFineNum,
            };

            searchAbortRef.current = new AbortController();
            const response = await getListaMovimenti(
                payload,
                0,
                searchAbortRef.current
            );

            setLastSearchPayload(payload);
            onSearchComplete?.(response, payload);
            setOpenFilters(false);
        } catch (err) {
            console.error("Errore nella ricerca movimenti:", err);
            onSearchError?.(err);
        } finally {
            setSearchLoading(false);
        }
    };

    /**
     * Esporta i movimenti in CSV usando i filtri dell'ultima ricerca
     */
    const handleExport = async () => {
        if (!lastSearchPayload) return;

        try {
            setExportLoading(true);
            exportAbortRef.current = new AbortController();

            const result = await exportMovimentiCSV(lastSearchPayload, exportAbortRef);
            const filename = `movimenti_${lastSearchPayload.dataInizio}_${lastSearchPayload.dataFine}.csv`;
            downloadCSV(result, filename);
        } catch (err) {
            console.error("Errore nell'export:", err);
        } finally {
            setExportLoading(false);
        }
    };

    /**
     * Resetta tutti i filtri
     */
    const handleResetFilters = () => {
        setCausale1(undefined);
        setCausale2(undefined);
        setDataInizio(undefined);
        setDataFine(undefined);
        setResetKey(prev => prev + 1);
    };


    // ——————————————————————————————————————————————————————————
    // RENDER
    // ——————————————————————————————————————————————————————————
    return (
        <>
            <FDBox variant="gradient" border={true} radius="md" pad="sm" className="flex gap-2 px-6 justify-end items-center mb-2">
                <FDButton
                    size="small"
                    radius="md"
                    variant="outline"
                    rightIcon={IoMdDownload({})}
                    onClick={handleExport}
                    disabled={!lastSearchPayload || exportLoading}
                    loading={exportLoading}
                    dataTooltipId="movimenti-tooltip"
                    dataTooltipContent={lastSearchPayload ? "Scarica i dati della ricerca attuale" : "Effettua prima una ricerca"}
                    className="mr-auto"
                >
                    Scarica
                </FDButton>

                <div ref={filterBtnRef} className="flex items-center">
                    <FDButton
                        size="small"
                        variant="outline"
                        radius="md"
                        rightIcon={IoFilterSharp({})}
                        onClick={() => setOpenFilters(true)}
                        dataTooltipId="movimenti-tooltip"
                        dataTooltipContent={buildFiltersTooltip()}
                        errors={showFilterError}
                    >
                        Filtri
                        {filtersCount > 0 && (
                            <span className="text-xs text-sky-500 ml-1 font-bold">
                                ({filtersCount})
                            </span>
                        )}
                    </FDButton>
                </div>
                
                <FDButton
                    variant="solid"
                    color="primary"
                    radius="md"
                    size="small"
                    rightIcon={IoSearch({})}
                    onClick={handleSearch}
                    disabled={searchLoading}
                >
                    {searchLoading ? "Ricerca..." : "Cerca"}
                </FDButton>
            </FDBox>
            <ContextMenu
                pos={filterBtnRef}
                openFor={openFilters}
                onClose={() => setOpenFilters(false)}
                placement="left-start"
                panel={
                    <FiltersMenu
                        key={resetKey}
                        causaliOptions={causaliOptions}
                        loading={loading}
                        causale1={causale1}
                        setCausale1={setCausale1}
                        causale2={causale2}
                        setCausale2={setCausale2}
                        dataInizio={dataInizio}
                        setDataInizio={setDataInizio}
                        dataFine={dataFine}
                        setDataFine={setDataFine}
                        onReset={handleResetFilters}
                    />
                }
            />
        </>
    );
}

export default Topbar