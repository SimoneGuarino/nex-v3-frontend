import React, { useContext, useEffect, useMemo, useRef, useState } from "react";

import FDBox from "components/UI/box/FDBox";
import FDButton from "components/UI/buttons/FDButton";
import { IoSearch, IoPersonSharp } from "react-icons/io5";
import { MdFilterList, MdDownload } from "react-icons/md";

import { useGeneralDataContext } from "context/GeneralDataContext";
import { UserContext } from "context/UserContext";

import { getFilters, FidoFiltersOptions } from "../fetchData/getFilters";
import FiltersMenu from "./FiltersMenu";

import type { ViewId, CommonFilters, CustomerOption } from "../types/view";
import { ContextMenu } from "components/UI/menu/ContextMenu";
import FDSelect from "components/UI/input/FDSelect";
import { ChangeLoadStatusArgs, LoadStatus } from "../types/load";
import { useTour } from "tour/TourProvider";
import { useNexTheme } from "@nex/theme-system";

const IoSearchIcon = IoSearch as React.FC<{ size?: number; className?: string }>;
const MdFilterListIcon = MdFilterList as React.FC<{ size?: number; className?: string }>;
const MdDownloadIcon = MdDownload as React.FC<{ size?: number; className?: string }>;
const IoPersonIcon = IoPersonSharp as React.FC<{ size?: number; className?: string }>;


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
type TabItem = { id: ViewId; label: string }; //tab disponibile nella topbar (id view + label UI)
type SearchTypeState = { tp: number; val: string | null }; //tipo ricerca Fido (UI): tp=codice filtro, val=valore eventuale

interface TopbarProps {
    // tabs e routing
    tabs: TabItem[]; //lista tab disponibili (arriva dal registry nel layout)
    view: ViewId; //tab corrente
    onChangeView: (v: ViewId) => void; //cambio view (index aggiorna view + params)

    // filtri condivisi gestiti da index
    common: CommonFilters; //filtri comuni condivisi fra tutte le view
    onChangeCommon: (next: CommonFilters) => void; //setter filtri comuni

    // stato dei filtri specifici fido (restano nel FiltersMenu)
    fidoTypes: SearchTypeState; //filtro specifico fido (tipo/valore)
    setFidoTypes: React.Dispatch<React.SetStateAction<SearchTypeState>>; //setter filtro fido

    // azione cerca (index aggiorna i params e le views fetchano)
    onSearch: () => void; //applica i filtri correnti (common + extra) e triggera fetch in view

    // azione export CSV (usa gli stessi filtri UI di "Cerca")
    onExport: () => void; //export CSV con filtri correnti UI

    // contesto/permessi
    isAdmin: boolean; //true se utente ha permessi avanzati (es. filtro agente)
    userContext?: any; //userContext passato dal layout (fallback su contesto globale)

    // lista clienti + stato loading (arrivano dalle view, via index)
    customerOptions: CustomerOption[]; //opzioni clienti (popolate dalla view)
    setCustomerOptions: React.Dispatch<React.SetStateAction<CustomerOption[]>>; //setter opzioni clienti (popolate dalla view)

    loadStatus: LoadStatus; //stato di caricamento per azioni come export
    ChangeLoadStatus: ({ from, bool }: ChangeLoadStatusArgs) => void; //funzione per cambiare lo stato di caricamento

    //stati utili per l'apertura e la chiusura dei menu durante il tour
    reportOpen: boolean;
    setReportOpen: React.Dispatch<React.SetStateAction<boolean>>;
    filtersOpen: boolean;
    setFiltersOpen: React.Dispatch<React.SetStateAction<boolean>>;
}


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * Topbar Customer Situation:
 * - mostra le tab principali (Anagrafica/Fido/Backorders) e un menu per i report di profilazione
 * - gestisce selezione company, apertura menu filtri, e azioni "Cerca" / "Scarica CSV"
 * - carica le opzioni dei filtri (getFilters) e le passa al FiltersMenu
 * - calcola badge + tooltip dei filtri attivi a partire da CommonFilters
 * @returns
 */
const Topbar: React.FC<TopbarProps> = ({
    tabs,
    view,
    onChangeView,
    common,
    onChangeCommon,
    fidoTypes,
    setFidoTypes,
    onSearch,
    onExport,
    isAdmin,
    userContext,
    reportOpen,
    setReportOpen,
    filtersOpen,
    setFiltersOpen,
    customerOptions, setCustomerOptions,
    loadStatus, ChangeLoadStatus
}) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";

    const { globalData } = useGeneralDataContext() as {
        globalData: { agents: { codici: { agente: string }; nome: string; cognome: string }[] };
    }; //dati globali (es. lista agenti)
    const [appUser] = useContext(UserContext) as any; //fallback se userContext non arriva da props
    const auth = userContext ?? appUser; //contesto auth usato per le chiamate (token)

    // *** SPLIT TABS: prime 3 in topbar, report nel menu ***
    const primaryTabsIds: ViewId[] = ["anagrafica", "fido", "backorders"]; //tab "principali" sempre visibili

    const primaryTabs = useMemo(
        () => tabs.filter((t) => primaryTabsIds.includes(t.id)),
        [tabs]
    ); //tabs principali renderizzati come bottoni

    const reportTabs = useMemo(
        () => tabs.filter((t) => t.id.startsWith("report")),
        [tabs]
    ); //tabs report renderizzati in un ContextMenu
    // ********************************************************

    // opzioni statiche company
    const companyOptions = useMemo(
        () => [
            { label: "Focelda", value: 0 },
            { label: "IOT", value: 1 },
        ],
        []
    ); //lista aziende selezionabili

    // pannello filtri + pannello report
    // const [filtersOpen, setFiltersOpen] = useState(false); //apertura menu filtri
    const filterBtnRef = useRef<HTMLDivElement | null>(null); //anchor menu filtri
    // const [reportOpen, setReportOpen] = useState(false); // apertura menu report
    const reportBtnRef = useRef<HTMLDivElement | null>(null); //anchor menu report

    // opzioni menu filtri (arrivano da getFilters)
    const [filtersOptions, setFiltersOptions] = useState<FidoFiltersOptions>({
        statoCliente: [],
        statoCommerciale: [],
        microSettore: [],
        macroSettore: [],
        canaleVendita: [],
        areaGeografica: [],
        categoriaSconto: [],
        brand: [],
        partnership: [],
        linee: [],
        gruppi: [],
        province: [],
        microSettoreAgg: [],
        clientelaRif: [],
    }); //cataloghi di opzioni per le select nel FiltersMenu

    const [loadingFilters, setLoadingFilters] = useState(false); //loading getFilters

    const abortController = useRef<AbortController | null>(null); //abort per chiamate filtri/opzioni (getFilters)

    // options commerciali (admin)
    const agentOptions = useMemo(
        () =>
            (globalData?.agents ?? []).map((a) => ({
                value: a.codici.agente,
                label: `${a.codici.agente} - ${a.nome} ${a.cognome}`,
            })),
        [globalData?.agents]
    ); //opzioni agenti per filtro admin

    /**
     * Helper: patch parziale dei filtri comuni.
     * @param patch
     */
    const patchCommon = (patch: Partial<CommonFilters>) =>
        onChangeCommon({ ...common, ...patch });

    // load opzioni filtri (una volta disponibile il token)
    useEffect(() => {
        if (!auth?.token) return;

        setLoadingFilters(true);

        getFilters({
            userContext: auth,
            abortController,
            setData: (opts) => {
                setFiltersOptions(opts);
                setLoadingFilters(false);
            },
            setErr: () => setLoadingFilters(false),
            ChangeLoadStatus: () => { },
        });
    }, [auth?.token]);

    // badge filtri attivi + tooltip riepilogo
    const { filtersCount, filtersTooltip } = useMemo(() => {
        let count = 0;
        const labels: string[] = [];

        const add = (c: boolean, l: string) => {
            if (c) {
                count += 1;
                labels.push(l);
            }
        };

        add(!!common.piva?.trim(), "Partita IVA");
        add(!!common.ragSoc?.trim(), "Ragione sociale");
        add(!!common.statoCliente?.length, `Stato amm. (${common.statoCliente?.length ?? 0})`);
        add(
            !!common.statoCommerciale?.length,
            `Stato comm. (${common.statoCommerciale?.length ?? 0})`
        );
        add(
            !!common.clientFilterCodes?.length,
            `Clienti (${common.clientFilterCodes?.length ?? 0})`
        );
        add(
            !!common.microSettore?.length,
            `Microsettore (${common.microSettore?.length ?? 0})`
        );
        add(
            !!common.macroSettore?.length,
            `Macrosettore (${common.macroSettore?.length ?? 0})`
        );
        add(
            !!common.canaleVendita?.length,
            `Canale vendita (${common.canaleVendita?.length ?? 0})`
        );
        add(
            !!common.areaGeografica?.length,
            `Area geo. (${common.areaGeografica?.length ?? 0})`
        );
        add(
            !!common.categoriaSconto?.length,
            `Cat. sconto (${common.categoriaSconto?.length ?? 0})`
        );
        add(!!common.province?.length, `Province (${common.province?.length ?? 0})`);
        add(!!common.brand?.length, `Brand (${common.brand?.length ?? 0})`);
        add(!!common.partnership?.length, `Partnership (${common.partnership?.length ?? 0})`);
        add(!!common.linee?.length, `Linee (${common.linee?.length ?? 0})`);
        add(!!common.gruppi?.length, `Gruppi (${common.gruppi?.length ?? 0})`);
        add(
            !!common.microSettoreAgg?.length,
            `Microsettore agg. (${common.microSettoreAgg?.length ?? 0})`
        );
        add(
            !!common.clientelaRif?.length,
            `Clientela rif. (${common.clientelaRif?.length ?? 0})`
        );

        if (isAdmin && common.agentCode) add(true, `Commerciale ${common.agentCode}`);

        return {
            filtersCount: count,
            filtersTooltip: count
                ? `Filtri attivi: ${labels.join(" · ")}`
                : "Nessun filtro aggiuntivo attivo",
        };
    }, [common, isAdmin]);

    // handlers
    const handleCompanySelectChange = (selected: any) => {
        const raw =
            typeof selected === "number" ? selected : selected?.value ?? selected?.id ?? 0;
        patchCommon({ companySelected: Number(raw) });
    }; //cambio company (cmp) via select

    const handleAgentChange = (selected: unknown) => {
        const value =
            typeof selected === "string"
                ? selected
                : (selected as any)?.value ?? (selected as any) ?? "";
        patchCommon({ agentCode: value ? String(value) : null });
    }; //cambio agente (solo admin)

    /**
     * Reset globale filtri:
     * - resetta il tipo fido
     * - resetta tutti i filtri common lasciando invariata la company selezionata
     */
    const handleResetFilters = React.useCallback(() => {
        setFidoTypes({ tp: 0, val: null }); //reset filtro fido

        onChangeCommon({
            ...common,
            piva: "",
            ragSoc: "",
            statoCliente: [],
            statoCommerciale: [],
            microSettore: [],
            macroSettore: [],
            canaleVendita: [],
            areaGeografica: [],
            categoriaSconto: [],
            province: [],
            brand: [],
            partnership: [],
            linee: [],
            gruppi: [],
            microSettoreAgg: [],
            clientelaRif: [],
            clientFilterCodes: [],
            agentCode: null,
            customerSelected: null,
        });
    }, [common, onChangeCommon, setFidoTypes]);

    const searchTypeOptions = [
        { label: "Tutti", value: 0 },
        { label: "Fuori fido", value: 1 },
        { label: "Scadenze fido", value: 2 },
        { label: "Fido parzialmente utilizzato", value: 3 },
    ]; //opzioni tipo ricerca fido


    /* TOUR SYSTEM */
    //const per blocco interazioni durante gli step del tour
    const { isOpen, index: tourIndex } = useTour();
    const lockInteractions = isOpen && (tourIndex === 6 || tourIndex === 7);

    //funzione per ignorare la chiusura dei menu contestuali durante il tour    
    type CloseReason = "clickAway" | "escapeKeyDown" | "backdropClick" | "itemClick";
    const shouldIgnoreClose = (reason?: CloseReason) => {
        if (!isOpen) return false;
        // se chiudo da codice (no reason) → NON bloccare
        if (!reason) return false;
        // durante il tour: ignora solo click fuori ed ESC
        return (
            reason === "backdropClick" ||
            reason === "clickAway" ||
            reason === "escapeKeyDown" ||
            reason === "itemClick"
        );
    };

    return (
        <FDBox pad="md" radius="lg" className="flex flex-col gap-3">
            {/* tabs + company + filtri + cerca + export */}
            <div className="flex flex-col md:flex-row md:justify-between w-full items-center gap-2 md:gap-0">
                {/* tabs principali + bottone report */}
                <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 w-full md:w-[50%] items-center">
                    {primaryTabs.map((t) => (
                        <FDButton
                            data-tour={`clienti-topbar-${t.id}`}
                            key={t.id}
                            variant={view === t.id ? "solid" : "outline"}
                            color={view === t.id ? "primary" : "neutral"}
                            size="small"
                            radius="md"
                            onClick={() => onChangeView(t.id)}
                        >
                            {t.label}
                        </FDButton>
                    ))}

                    {/* apertura menu report */}
                    <div ref={reportBtnRef} className="flex items-center w-full sm:w-auto">
                        <FDButton
                            data-tour="clienti-topbar-report"
                            variant="outline"
                            color="neutral"
                            size="small"
                            radius="md"
                            fullWidth
                            onClick={() => setReportOpen(true)}
                        >
                            <IoPersonIcon className="mr-1.5" />
                            Report Profilazione
                        </FDButton>
                    </div>
                </div>

                {/* actions (company + filtri + export + cerca) */}
                <div className="grid grid-cols-2 sm:flex gap-2 items-center w-full md:w-auto justify-end">
                    {/* company */}
                    <div className="min-w-[80px] text-base/7 flex items-center h-full" data-tour="clienti-topbar-company">
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
                        <FDSelect
                            options={companyOptions as any}
                            size="xs"
                            fullWidth
                            radius="md"
                            clearable={false}
                            value={(common.companySelected ?? 0) as any}
                            onChange={handleCompanySelectChange}
                        />
                    </div>

                    {/* filtri */}
                    <div ref={filterBtnRef} className="flex items-center w-full sm:w-auto">
                        <FDButton
                            data-tour="clienti-topbar-filtri"
                            variant="outline"
                            color="neutral"
                            size="small"
                            radius="md"
                            fullWidth
                            onClick={() => setFiltersOpen(true)}
                            dataTooltipId="customers-tooltip"
                            dataTooltipContent={filtersTooltip}
                        >
                            <MdFilterListIcon className="mr-1.5" />
                            Filtri
                            {filtersCount > 0 && (
                                <span className="text-xs text-sky-500 ml-1 font-bold">
                                    ({filtersCount})
                                </span>
                            )}
                        </FDButton>
                    </div>

                    {/* export csv (usa filtri UI correnti) */}
                    <FDButton
                        data-tour="clienti-topbar-scaricaCSV"
                        size="small"
                        radius="md"
                        variant="outline"
                        color="neutral"
                        onClick={onExport}
                        loading={loadStatus.export_data}
                    >
                        <MdDownloadIcon className="mr-1.5" />
                        Scarica CSV
                    </FDButton>

                    {/* cerca (applica filtri) */}
                    <FDButton
                        data-tour="clienti-topbar-cerca"
                        variant="solid"
                        color="primary"
                        radius="md"
                        size="small"
                        onClick={onSearch}
                        loading={loadStatus.search}
                    >
                        <IoSearchIcon className="mr-1.5" />
                        Cerca
                    </FDButton>
                </div>
            </div>

            {/* CONTEXT MENU: tabs report */}
            <ContextMenu
                data-tour="clienti-topbar-report-2"
                openFor={reportOpen}
                pos={reportBtnRef}
                // onClose={() => setReportOpen(false)}
                onClose={(_e?: any, reason?: CloseReason) => {
                    if (shouldIgnoreClose(reason)) return;
                    setReportOpen(false);
                }}
                placement="bottom-start"
                panel={
                    <div className="w-[260px] p-1 flex flex-col gap-2">
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
                        {reportTabs.map((t) => (
                            <FDButton
                                key={t.id}
                                variant={view === t.id ? "solid" : "outline"}
                                color={view === t.id ? "primary" : "dark"}
                                size="small"
                                radius="md"
                                onClick={() => {
                                    onChangeView(t.id);
                                    setReportOpen(false);
                                }}
                            >
                                {t.label}
                            </FDButton>
                        ))}
                    </div>
                }
            />

            {/* MENU FILTRI:
                - filtri Fido visibili solo se view === "fido"
                - filtri comuni condivisi da tutte le view */}
            <FiltersMenu
                open={filtersOpen}
                anchorRef={filterBtnRef}
                //onClose={() => setFiltersOpen(false)}
                onClose={(_e?: any, reason?: CloseReason) => {
                    if (shouldIgnoreClose(reason)) return;
                    setFiltersOpen(false);
                }}
                searchTypeOptions={searchTypeOptions}
                types={fidoTypes}
                setSearchType={setFidoTypes}
                showFidoFilters={view === "fido"}
                // business
                pivaFilter={common.piva ?? ""}
                setPivaFilter={(v: string) => patchCommon({ piva: v })}
                ragSocFilter={common.ragSoc ?? ""}
                setRagSocFilter={(v: string) => patchCommon({ ragSoc: v })}
                statoCliente={common.statoCliente ?? []}
                setStatoCliente={(v: string[]) => patchCommon({ statoCliente: v })}
                statoCommerciale={common.statoCommerciale ?? []}
                setStatoCommerciale={(v: string[]) => patchCommon({ statoCommerciale: v })}
                microSettore={common.microSettore ?? []}
                setMicroSettore={(v: string[]) => patchCommon({ microSettore: v })}
                macroSettore={common.macroSettore ?? []}
                setMacroSettore={(v: string[]) => patchCommon({ macroSettore: v })}
                canaleVendita={common.canaleVendita ?? []}
                setCanaleVendita={(v: string[]) => patchCommon({ canaleVendita: v })}
                areaGeografica={common.areaGeografica ?? []}
                setAreaGeografica={(v: string[]) => patchCommon({ areaGeografica: v })}
                categoriaSconto={common.categoriaSconto ?? []}
                setCategoriaSconto={(v: string[]) => patchCommon({ categoriaSconto: v })}
                province={common.province ?? []}
                setProvince={(v: string[]) => patchCommon({ province: v })}
                brand={common.brand ?? []}
                setBrand={(v: string[]) => patchCommon({ brand: v })}
                partnership={common.partnership ?? []}
                setPartnership={(v: string[]) => patchCommon({ partnership: v })}
                linee={common.linee ?? []}
                setLinee={(v: string[]) => patchCommon({ linee: v })}
                gruppi={common.gruppi ?? []}
                setGruppi={(v: string[]) => patchCommon({ gruppi: v })}
                microSettoreAgg={common.microSettoreAgg ?? []}
                setMicroSettoreAgg={(v: string[]) => patchCommon({ microSettoreAgg: v })}
                clientelaRif={common.clientelaRif ?? []}
                setClientelaRif={(v: string[]) => patchCommon({ clientelaRif: v })}
                // clienti multipli
                customerOptions={customerOptions} setCustomerOptions={setCustomerOptions}

                clientFilterCodes={common.clientFilterCodes ?? []}
                setClientFilterCodes={(v: CustomerOption[]) => patchCommon({ clientFilterCodes: v })}

                // admin
                filtersOptions={filtersOptions}
                checkAdmin={isAdmin}
                agentOptions={agentOptions}
                agentCode={common.agentCode ?? undefined}
                onAgentChange={handleAgentChange}
                loadingFilters={loadingFilters}
                darkMode={darkMode}
                // reset globale
                onResetFilters={handleResetFilters}
            />
        </FDBox>
    );
};

export default Topbar;
