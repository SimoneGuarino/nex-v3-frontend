import React, { useCallback, useState } from "react";
import { format } from "date-fns";
import { GetDate } from "utils/index";

import { ContextMenu } from "components/UI/menu/ContextMenu";
import FDInput from "components/UI/input/FDInput";
import FDDate from "components/UI/input/FDDate";

import type { FidoFiltersOptions } from "../fetchData/getFilters";

import { MdOutlinePercent } from "react-icons/md";
import FDButton from "components/UI/buttons/FDButton";
import FDSelect from "components/UI/input/FDSelect";
import { SearchCustomersAPI } from "../fetchData/V2/serchCustomers";
import { enqueueSnackbar } from "components/MessageBox";
import { CustomerOption } from "../types/view";
import { useTour } from "tour/TourProvider";

const MdPercentIcon = MdOutlinePercent as React.FC<{
    size?: number;
    className?: string;
}>;


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
type SearchTypeState = { tp: number; val: string | null }; //stato filtro Fido: tp=tipo, val=valore (data o percentuale)

interface FiltersMenuProps {
    open: boolean; //apertura menu
    anchorRef: React.RefObject<HTMLDivElement>; //anchor per il ContextMenu
    onClose: () => void; //chiusura menu

    // tipo fido
    searchTypeOptions: { label: string; value: number }[]; //opzioni select tipo fido
    types: SearchTypeState; //stato attuale filtro fido
    setSearchType: React.Dispatch<React.SetStateAction<SearchTypeState>>; //setter stato filtro fido

    // business filters
    pivaFilter: string; //P.IVA
    setPivaFilter: (value: string) => void;
    ragSocFilter: string; //ragione sociale
    setRagSocFilter: (value: string) => void;

    statoCliente: string[]; //stato amministrativo
    setStatoCliente: (values: string[]) => void;
    statoCommerciale: string[]; //stato commerciale
    setStatoCommerciale: (values: string[]) => void;
    microSettore: string[];
    setMicroSettore: (values: string[]) => void;
    macroSettore: string[];
    setMacroSettore: (values: string[]) => void;
    canaleVendita: string[];
    setCanaleVendita: (values: string[]) => void;
    areaGeografica: string[];
    setAreaGeografica: (values: string[]) => void;
    categoriaSconto: string[];
    setCategoriaSconto: (values: string[]) => void;
    province: string[];
    setProvince: (values: string[]) => void;

    // clienti
    //customerOptions: { label: string; value: string }[]; //opzioni clienti (popolate dalla view)
    customerOptions: CustomerOption[]; //opzioni clienti (popolate dalla view)
    setCustomerOptions: React.Dispatch<React.SetStateAction<CustomerOption[]>>; //setter opzioni clienti (popolate dalla view)

    clientFilterCodes: CustomerOption[]; //codici clienti selezionati (multi)
    setClientFilterCodes: (values: CustomerOption[]) => void;

    // brand filters
    brand: string[];
    setBrand: (values: string[]) => void;
    partnership: string[];
    setPartnership: (values: string[]) => void;
    linee: string[];
    setLinee: (values: string[]) => void;
    gruppi: string[];
    setGruppi: (values: string[]) => void;
    microSettoreAgg: string[];
    setMicroSettoreAgg: (values: string[]) => void;
    clientelaRif: string[];
    setClientelaRif: (values: string[]) => void;

    filtersOptions: FidoFiltersOptions; //cataloghi opzioni select (getFilters)

    // admin / commerciali
    checkAdmin: boolean; //abilita sezione admin
    agentOptions: { value: string; label: string }[]; //lista agenti (value=codice agente)
    agentCode?: string; //codice agente selezionato
    onAgentChange: (selected: unknown) => void; //setter agente (si aspetta il codice reale o null)
    loadingFilters: boolean; //loading getFilters
    darkMode: boolean; //tema (per skeleton)

    // extra
    showFidoFilters: boolean; //mostra filtro fido solo in view "fido"

    // reset globale, gestito dal parent (Topbar)
    onResetFilters: () => void; //reset di tutti i filtri (common + fido)
}


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * Menu filtri (ContextMenu) per Customer Situation.
 * - gestisce filtri comuni (business + brand) sempre visibili
 * - gestisce filtri Fido solo quando showFidoFilters=true
 * - gestisce filtro Admin (commerciale) quando checkAdmin=true
 * @returns
 */
const FiltersMenu: React.FC<FiltersMenuProps> = ({
    open,
    anchorRef,
    onClose,
    searchTypeOptions,
    types,
    setSearchType,
    pivaFilter,
    setPivaFilter,
    ragSocFilter,
    setRagSocFilter,
    statoCliente,
    setStatoCliente,
    statoCommerciale,
    setStatoCommerciale,
    microSettore,
    setMicroSettore,
    macroSettore,
    setMacroSettore,
    canaleVendita,
    setCanaleVendita,
    areaGeografica,
    setAreaGeografica,
    categoriaSconto,
    setCategoriaSconto,
    province,
    setProvince,
    brand,
    setBrand,
    partnership,
    setPartnership,
    linee,
    setLinee,
    gruppi,
    setGruppi,
    microSettoreAgg,
    setMicroSettoreAgg,
    clientelaRif,
    setClientelaRif,
    filtersOptions,
    checkAdmin,
    agentOptions,
    agentCode,
    onAgentChange,
    loadingFilters,
    darkMode,

    customerOptions, setCustomerOptions,

    clientFilterCodes,
    setClientFilterCodes,

    showFidoFilters,
    onResetFilters,
}) => {
    // stato ricerca clienti
    const [customerSearch, setCustomerSearch] = useState("");
    const [customerLoading, setCustomerLoading] = useState(false);


    // normalizzazione commerciale con indice (per evitare duplicati di value)
    const agentOptionsIndexed = React.useMemo(
        () =>
            agentOptions.map((opt, index) => ({
                value: index, //indice usato da FDSelect (evita collisioni su codici ripetuti)
                label: opt.label,
                code: opt.value, //codice agente reale usato nel payload dei filtri
            })),
        [agentOptions]
    );

    const selectedAgentIndex = React.useMemo(() => {
        if (!agentCode) return null;
        const found = agentOptionsIndexed.find((o) => o.code === agentCode);
        return found?.value ?? null;
    }, [agentCode, agentOptionsIndexed]); //indice attuale selezionato (derivato dal codice agente)

    /**
     * Cambio tipologia di ricerca Fido.
     * - tp=2 → inizializza val con oggi (yyyy-MM-dd) per filtro scadenza
     * - tp=3 → inizializza val con "0" per percentuale
     * - default → reset val
     */
    const handleSearchTypeChange = (selected: any) => {
        if (selected === null || selected === undefined) {
            setSearchType({ tp: 0, val: null });
            return;
        }

        const raw =
            typeof selected === "number" ? selected : selected?.value ?? selected?.id ?? 0;

        const val = Number(raw);
        const today = format(new Date(GetDate().today), "yyyy-MM-dd");

        setSearchType({
            tp: val,
            val: val === 2 ? today : val === 3 ? "0" : null,
        });
    };

    /**
     * Aggiorna solo il valore del filtro fido (data/percentuale).
     * @param val
     */
    const handleFilterTypeChange = useCallback(
        (val?: string) =>
            setSearchType((prev: SearchTypeState) => ({
                ...prev,
                val: val ?? null,
            })),
        [setSearchType]
    );

    /**
     * Render del campo extra in base al tipo:
     * - tp=2 → date picker (scadenza prima del)
     * - tp=3 → input percentuale
     */
    const renderFilter = () => {
        if (types.tp === 2) {
            const today = format(new Date(GetDate().today), "yyyy-MM-dd");
            const value = types.val ?? today;

            return (
                <div className="flex flex-col w-full">
                    <span className="text-xs pl-2">Scadenza prima del</span>
                    <FDDate
                        fromLabel=""
                        toLabel=""
                        fullWidth
                        size="sm"
                        color="dark"
                        clearable
                        value={value || undefined}
                        min={today}
                        onChange={handleFilterTypeChange}
                        radius="md"
                    />
                </div>
            );
        }

        if (types.tp === 3) {
            return (
                <div className="flex flex-col w-full">
                    <span className="text-xs pl-2">Percentuale di fido libero</span>
                    <FDInput
                        type="number"
                        size="sm"
                        value={types.val ?? ""}
                        placeholder="Cifra"
                        onChange={(e) => handleFilterTypeChange(e.target.value)}
                        leftIcon={MdPercentIcon({ size: 18 })}
                        variant="outline"
                        color="dark"
                        radius="md"
                    />
                </div>
            );
        }

        return null;
    };

    /**
    * Effettua la ricerca clienti in base alla stringa di ricerca
    */
    React.useEffect(() => {
        const q = customerSearch.trim();

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                setCustomerLoading(true);
                const params = new URLSearchParams({
                    query: q,
                    context: "quotations",
                    limit: "20",
                });

                const items = await SearchCustomersAPI({
                    abortController: controller,
                    params: params.toString(),
                    ChangeLoadStatus: () => { },
                });
                if (!items) { enqueueSnackbar("Errore nel recupero dei clienti.", { title: 'Ops..', type: 'error' }); return; }

                //aggiorna lo stato delle opzioni clienti con i risultati evitando duplicati
                setCustomerOptions(prev => {
                    const newItems = items.filter(item => !prev.some(prevItem => prevItem.codiceCliente === item.codiceCliente));
                    return [...prev, ...newItems];
                });
            } catch (err: any) {
                if (err.name !== "AbortError") {
                    console.error("quick-details fetch error", err);
                }
            } finally {
                setCustomerLoading(false);
            }
        }, 300); // debounce 300ms

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [customerSearch, clientFilterCodes]);


    /* TOUR SYSTEM */
    //const per blocco interazioni durante gli step del tour
    const { isOpen, index: tourIndex } = useTour();
    const lockInteractions = isOpen && tourIndex >= 5 && tourIndex <= 12;

    return (
        <ContextMenu
            data-tour="clienti-topbar-filtri"
            openFor={open}
            pos={anchorRef}
            onClose={onClose}
            placement="left-start"
            panel={
                <div className="p-1 pr-3 gap-3 flex flex-col w-[420px]  h-[70vh] max-h-[600px] min-h-[350px] overflow-y-auto">
                    {lockInteractions && (
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                inset: 0,
                                zIndex: 10,
                                pointerEvents: "auto",
                            }}
                            onClickCapture={(e) => e.stopPropagation()}
                        />
                    )}
                    {/* Header */}
                    <div className="text-sm font-medium">Filtri</div>

                    {/* Filtro Fido (solo se vista Fido) */}
                    {showFidoFilters && (
                        <>
                            <div className="flex w-full items-center justify-between">
                                <span className="text-lg">Filtro Fido</span>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-xs pl-2">Tipologia di fido ricercato</span>
                                <FDSelect
                                    options={searchTypeOptions as any}
                                    size="sm"
                                    radius="md"
                                    value={types.tp as any}
                                    onChange={handleSearchTypeChange}
                                    variant="outline"
                                    color="dark"
                                    fullWidth
                                />
                            </div>

                            <div className="w-full">{renderFilter()}</div>
                        </>
                    )}

                    {/* Filtri Business */}
                    <div data-tour="clienti-topbar-filter-business">
                        <span className="text-lg mt-3">Business</span>

                        <div className="grid grid-cols-1 gap-2">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs pl-2">Clienti</span>
                                <FDSelect
                                    options={customerOptions.map(c => ({
                                        id: c.id,
                                        value: c,
                                        label: `${c.ragioneSociale} (${c.codiceCliente})`,
                                    }))}
                                    value={clientFilterCodes}
                                    onChange={(v: any) => {
                                        //gestione multi select
                                        setClientFilterCodes(v);
                                        //posiziona in cima le opzioni selezionate
                                        setCustomerOptions(prev => {
                                            const selected = prev.filter(c => v.some((x: CustomerOption) => x.codiceCliente === c.codiceCliente));
                                            const unselected = prev.filter(c => !v.some((x: CustomerOption) => x.codiceCliente === c.codiceCliente));
                                            return [...selected, ...unselected];
                                        });
                                    }}
                                    placeholder="Cerca per ragione sociale, P.IVA, CF o codice…"
                                    size="sm"
                                    variant="outline"
                                    color="dark"
                                    radius="md"
                                    fullWidth
                                    multiple
                                    clearable
                                    searchable
                                    loading={customerLoading}
                                    onSearchChange={(text: string) => setCustomerSearch(text)}
                                    menuMaxHeight={320}
                                    virtualized={false} // disabilita rowH fisso + windowing
                                    renderOption={(opt: any, selected: boolean) => {
                                        const c = opt.value as CustomerOption;
                                        return (
                                            <div className="flex flex-col gap-1 leading-tight cursor-pointer">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-sm">
                                                        {c.ragioneSociale}
                                                    </span>
                                                    <div>
                                                        <span className={`inline-block mr-2 w-2 h-2 rounded-full ${selected ? "bg-yellow-500/80" : ""}`} />
                                                        <span className="text-[10px] px-2 py-[2px] rounded-full bg-blue-500/20 text-blue-200">
                                                            {c.codiceCliente}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 dark:text-gray-400">
                                                    {c.partitaIVA && <span>P.IVA {c.partitaIVA}</span>}
                                                    {c.codiceFiscale && <span>CF {c.codiceFiscale}</span>}
                                                    {c.fido && (
                                                        <span className="ml-auto font-medium text-xs">
                                                            Fido: {c.fido.saldoCliente.toLocaleString("it-IT")} / {c.fido.fidoTotale.toLocaleString("it-IT")}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs pl-2">Partita IVA</span>
                                <FDInput
                                    size="sm"
                                    value={pivaFilter}
                                    placeholder="Inserisci P. IVA"
                                    onChange={(e) => setPivaFilter(e.target.value)}
                                    variant="outline"
                                    color="dark"
                                    radius="md"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-xs pl-2">Ragione sociale</span>
                                <FDInput
                                    size="sm"
                                    value={ragSocFilter}
                                    placeholder="Testo da cercare…"
                                    onChange={(e) => setRagSocFilter(e.target.value)}
                                    variant="outline"
                                    color="dark"
                                    radius="md"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs pl-2">Stato amministrativo</span>
                                <FDSelect
                                    options={filtersOptions.statoCliente as any}
                                    size="sm"
                                    radius="md"
                                    multiple
                                    clearable
                                    value={statoCliente as any}
                                    onChange={(val: any) =>
                                        setStatoCliente(Array.isArray(val) ? val : [val])
                                    }
                                    variant="outline"
                                    color="dark"
                                    fullWidth
                                    searchable
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-xs pl-2">Stato commerciale</span>
                                <FDSelect
                                    options={filtersOptions.statoCommerciale as any}
                                    size="sm"
                                    radius="md"
                                    multiple
                                    clearable
                                    value={statoCommerciale as any}
                                    onChange={(val: any) =>
                                        setStatoCommerciale(Array.isArray(val) ? val : [val])
                                    }
                                    variant="outline"
                                    color="dark"
                                    fullWidth
                                    searchable
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-xs pl-2">Microsettore</span>
                                <FDSelect
                                    options={filtersOptions.microSettore as any}
                                    size="sm"
                                    radius="md"
                                    multiple
                                    clearable
                                    value={microSettore as any}
                                    onChange={(val: any) =>
                                        setMicroSettore(Array.isArray(val) ? val : [val])
                                    }
                                    variant="outline"
                                    color="dark"
                                    fullWidth
                                    searchable
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-xs pl-2">Macrosettore</span>
                                <FDSelect
                                    options={filtersOptions.macroSettore as any}
                                    size="sm"
                                    radius="md"
                                    multiple
                                    clearable
                                    value={macroSettore as any}
                                    onChange={(val: any) =>
                                        setMacroSettore(Array.isArray(val) ? val : [val])
                                    }
                                    variant="outline"
                                    color="dark"
                                    fullWidth
                                    searchable
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-xs pl-2">Area geografica</span>
                                <FDSelect
                                    options={filtersOptions.areaGeografica as any}
                                    size="sm"
                                    radius="md"
                                    multiple
                                    clearable
                                    value={areaGeografica as any}
                                    onChange={(val: any) =>
                                        setAreaGeografica(Array.isArray(val) ? val : [val])
                                    }
                                    variant="outline"
                                    color="dark"
                                    fullWidth
                                    searchable
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-xs pl-2">Provincia</span>
                                <FDSelect
                                    options={filtersOptions.province as any}
                                    size="sm"
                                    radius="md"
                                    multiple
                                    clearable
                                    value={province as any}
                                    onChange={(val: any) =>
                                        setProvince(Array.isArray(val) ? val : [val])
                                    }
                                    variant="outline"
                                    color="dark"
                                    fullWidth
                                    searchable
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-xs pl-2">Canale di vendita</span>
                                <FDSelect
                                    options={filtersOptions.canaleVendita as any}
                                    size="sm"
                                    radius="md"
                                    multiple
                                    clearable
                                    value={canaleVendita as any}
                                    onChange={(val: any) =>
                                        setCanaleVendita(Array.isArray(val) ? val : [val])
                                    }
                                    variant="outline"
                                    color="dark"
                                    fullWidth
                                    searchable
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-xs pl-2">Categoria sconto</span>
                                <FDSelect
                                    options={filtersOptions.categoriaSconto as any}
                                    size="sm"
                                    radius="md"
                                    multiple
                                    clearable
                                    value={categoriaSconto as any}
                                    onChange={(val: any) =>
                                        setCategoriaSconto(Array.isArray(val) ? val : [val])
                                    }
                                    variant="outline"
                                    color="dark"
                                    fullWidth
                                    searchable
                                />
                            </div>
                        </div>
                    </div>

                    {/* Filtri Brand */}
                    <div data-tour="clienti-topbar-filter-brand">
                        <span className="text-lg mt-4">Brand</span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" >
                            <div className="flex flex-col gap-1">
                                <span className="text-xs pl-2">Brand</span>
                                <FDSelect
                                    options={filtersOptions.brand as any}
                                    size="sm"
                                    radius="md"
                                    multiple
                                    clearable
                                    value={brand as any}
                                    onChange={(val: any) => setBrand(Array.isArray(val) ? val : [val])}
                                    variant="outline"
                                    color="dark"
                                    fullWidth
                                    searchable
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-xs pl-2">Partnership</span>
                                <FDSelect
                                    options={filtersOptions.partnership as any}
                                    size="sm"
                                    radius="md"
                                    multiple
                                    clearable
                                    value={partnership as any}
                                    onChange={(val: any) =>
                                        setPartnership(Array.isArray(val) ? val : [val])
                                    }
                                    variant="outline"
                                    color="dark"
                                    fullWidth
                                    searchable
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-xs pl-2">Linee</span>
                                <FDSelect
                                    options={filtersOptions.linee as any}
                                    size="sm"
                                    radius="md"
                                    multiple
                                    clearable
                                    value={linee as any}
                                    onChange={(val: any) => setLinee(Array.isArray(val) ? val : [val])}
                                    variant="outline"
                                    color="dark"
                                    fullWidth
                                    searchable
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-xs pl-2">Gruppi</span>
                                <FDSelect
                                    options={filtersOptions.gruppi as any}
                                    size="sm"
                                    radius="md"
                                    multiple
                                    clearable
                                    value={gruppi as any}
                                    onChange={(val: any) =>
                                        setGruppi(Array.isArray(val) ? val : [val])
                                    }
                                    variant="outline"
                                    color="dark"
                                    fullWidth
                                    searchable
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-xs pl-2">Microsettore aggiuntivo</span>
                                <FDSelect
                                    options={filtersOptions.microSettoreAgg as any}
                                    size="sm"
                                    radius="md"
                                    multiple
                                    clearable
                                    value={microSettoreAgg as any}
                                    onChange={(val: any) =>
                                        setMicroSettoreAgg(Array.isArray(val) ? val : [val])
                                    }
                                    variant="outline"
                                    color="dark"
                                    fullWidth
                                    searchable
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-xs pl-2">Clientela di riferimento</span>
                                <FDSelect
                                    options={filtersOptions.clientelaRif as any}
                                    size="sm"
                                    radius="md"
                                    multiple
                                    clearable
                                    value={clientelaRif as any}
                                    onChange={(val: any) =>
                                        setClientelaRif(Array.isArray(val) ? val : [val])
                                    }
                                    variant="outline"
                                    color="dark"
                                    fullWidth
                                    searchable
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sezione Admin (filtro commerciale) */}
                    {checkAdmin && (
                        <>
                            {!loadingFilters ? (
                                <>
                                    <hr className="border-neutral-800 w-[95%] mx-auto mt-3" />
                                    <div data-tour="fatturati-topbar-filter-admin">
                                        <span className="text-lg">Admin</span>

                                        <div className="flex flex-col w-full">
                                            <span className="text-xs pl-2">Commerciale</span>
                                            <FDSelect
                                                options={agentOptionsIndexed as any}
                                                size="sm"
                                                radius="md"
                                                variant="outline"
                                                color="dark"
                                                fullWidth
                                                clearable
                                                placeholder="Tutti i commerciali"
                                                value={selectedAgentIndex as any}
                                                onChange={(v: any) => {
                                                    if (v === null || v === undefined) {
                                                        onAgentChange(null);
                                                        return;
                                                    }

                                                    const idx =
                                                        typeof v === "number"
                                                            ? v
                                                            : typeof v === "string"
                                                                ? Number(v)
                                                                : v?.value ?? v?.id;

                                                    const selected =
                                                        agentOptionsIndexed.find((o) => o.value === idx) ??
                                                        null;

                                                    onAgentChange(selected ? selected.code : null);
                                                }}
                                                searchable
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div
                                    className={`w-72 h-11 rounded-md ${darkMode ? "bg-neutral-900" : "bg-gray-200"
                                        } animate-pulse`}
                                />
                            )}
                        </>
                    )}

                    <div className="flex w-full justify-end items-center mt-3">
                        <FDButton
                            data-tour="clienti-topbar-filters-reset"
                            variant="outline"
                            color="dark"
                            size="small"
                            onClick={onResetFilters}
                        >
                            Reset
                        </FDButton>
                    </div>
                </div>
            }
        />
    );
};

export default FiltersMenu;
