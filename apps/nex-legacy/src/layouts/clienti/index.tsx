import React, { useState } from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import { useUserContext } from "context/UserContext";
import { CheckAdminPermissions } from "utils/checkAdminPermissions";
import { GeneralError } from "components/NoData/generalError";
import ErrorIMG from "assets/images/5203299_trasparent.webp";

import Topbar from "./components/TopBar";
import { viewsRegistry } from "./views/registry";
import type { ViewId, CommonFilters, SearchParams, ViewDefinition, CustomerOption } from "./types/view";
import { Tooltip } from "react-tooltip";

import { exportAnagraficaCSV } from "./fetchData/anagrafica/exportCSV";
import { exportBackordersCSV } from "./fetchData/backorders/exportCSV";
import { exportFidoCSV } from "./fetchData/fido/exportCSV";
import { exportReportAltriProblemiCSV } from "./fetchData/reportProfilazione/altriProblemi/exportCSV";
import { exportReportDiffEconomicaCSV } from "./fetchData/reportProfilazione/diffEconomica/exportCSV";
import { exportReportNoteClientiCSV } from "./fetchData/reportProfilazione/noteClienti/exportCSV";
import { exportReportRichCambioAgenteCSV } from "./fetchData/reportProfilazione/richCambioAgente/exportCSV";
import { ChangeLoadStatusArgs, LoadStatus } from "./types/load";
import { useSectionTour } from "tour/useSectionTour";
import { useTour } from "tour/TourProvider";
import { Role } from "tour/types";


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
type ViewHostProps = {
    def: ViewDefinition<any>; //definizione view corrente (component + filtri extra)
    userContext: any; //contesto utente (ruoli/permessi + info sessione)
    params: SearchParams<any>; //params applicati (common + extra) usati dalla view per fetch
    setCustomerOptions: React.Dispatch<React.SetStateAction<CustomerOption[]>>; //setter lista clienti condivisa (popolata dalle view)
    onNavigateToCustomerView?: ( //callback per navigazione cross-view su cliente specifico
        targetView: ViewId,
        customer: { codice: string; denominazione?: string }
    ) => void;
    loadStatus: LoadStatus; ChangeLoadStatus: ({ from, bool }: ChangeLoadStatusArgs) => void;
};


// ——————————————————————————————————————————————————————————
// UTILS
// ——————————————————————————————————————————————————————————
/**
 * Helper: build payload “common” per le rotte che usano parseCommonFilters lato BE.
 * Converte CommonFilters (UI) nel body atteso dalle fetch/export.
 * @param c
 * @returns body compatibile con parseCommonFilters
 */
const buildCommonBodyFromFilters = (c: CommonFilters) => {
    const body: any = {
        cmp: c.companySelected,
        piva: c.piva,
        ragsoc: c.ragSoc,
        statoCliente: c.statoCliente,
        statoCommerciale: c.statoCommerciale,
        microSettore: c.microSettore,
        macroSettore: c.macroSettore,
        canaleVendita: c.canaleVendita,
        areaGeografica: c.areaGeografica,
        categoriaSconto: c.categoriaSconto,
        brand: c.brand,
        partnership: c.partnership,
        linee: c.linee,
        gruppi: c.gruppi,
        province: c.province,
        microSettoreAgg: c.microSettoreAgg,
        clientelaRif: c.clientelaRif,
    };

    if (c.agentCode) body.ccom = c.agentCode;

    // cliente singolo selezionato
    //if (c.customerSelected?.codice) body.ccli = c.customerSelected.codice;

    // filtro “lista clienti” (cst=1 + array ccli)
    if (c.clientFilterCodes?.length) {
        body.cst = 1;
        body.ccli = c.clientFilterCodes.map((codice) => ({ codice }));
    }

    return body;
};


// ——————————————————————————————————————————————————————————
// SUB COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * ViewHost:
 * wrapper memoized che istanzia il Component della view corrente,
 * passandogli i params applicati + helper per popolare la lista clienti condivisa.
 * @returns
 */
const ViewHost: React.FC<ViewHostProps> = React.memo(
    ({
        def,
        userContext,
        params,
        setCustomerOptions,
        onNavigateToCustomerView,
        loadStatus, ChangeLoadStatus,
    }) => {
        const { Component } = def as any;

        return (
            <Component
                userContext={userContext}
                params={params}
                onNavigateToCustomerView={onNavigateToCustomerView}
                setCustomerOptions={setCustomerOptions}
                loadStatus={loadStatus} ChangeLoadStatus={ChangeLoadStatus}
            />
        );
    }
);


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * CustomersSituation:
 * layout “Situazione Clienti” a tab (viewsRegistry) con:
 * - filtri condivisi (CommonFilters) + filtri extra per singola view
 * - stato “applicato” (searchParams) usato dalle view per fetch
 * - export CSV per la view corrente
 * - navigazione cross-view su cliente (es. da Backorders → Anagrafica/Fido)
 * @returns
 */
const CustomersSituation: React.FC = () => {
    const [userContext] = useUserContext(); //contesto utente loggato

    // tab corrente
    const [view, setView] = React.useState<ViewId>("anagrafica"); //view attiva (id)

    /** filtri condivisi (UI) */
    const [common, setCommon] = React.useState<CommonFilters>({
        companySelected: 0,
        clientFilterCodes: [],
    }); //filtri comuni tra tutte le view
    // per-view extra filters payload (UI/grezzo)
    const [extraByView, setExtraByView] = React.useState<Record<ViewId, any>>(
        () => ({} as Record<ViewId, any>)
    ); //salva lo stato dei filtri extra per ogni tab
    // tipi fido (UI, sta qui ma viene copiato negli extra solo su "Cerca")
    const [fidoTypes, setFidoTypes] = React.useState<{ tp: number; val: string | null }>({
        tp: 0,
        val: null,
    }); //filtro speciale per la view Fido (tp/val)

    // params usati dalle view per fare fetch (stato "applicato")
    const [searchParams, setSearchParams] = React.useState<SearchParams>({
        view,
        common,
        extra: extraByView[view],
    }); //stato congelato (applicato) per le fetch delle view
    // ref per leggere sempre l’ultimo stato dentro callback “stabili” (export/jump)
    const commonRef = React.useRef<CommonFilters>(common); //ref ultimi filtri comuni
    const extraByViewRef = React.useRef<Record<ViewId, any>>(extraByView); //ref ultimi extra per view
    const fidoTypesRef = React.useRef<{ tp: number; val: string | null }>(fidoTypes); //ref ultimo filtro fido

    React.useEffect(() => {
        commonRef.current = common;
    }, [common]); //sincronizza ref common

    React.useEffect(() => {
        extraByViewRef.current = extraByView;
    }, [extraByView]); //sincronizza ref extraByView

    React.useEffect(() => {
        fidoTypesRef.current = fidoTypes;
    }, [fidoTypes]); //sincronizza ref fidoTypes

    // lista clienti condivisa + loading (usata da Topbar → FiltersMenu)
    const [customerOptions, setCustomerOptions] = React.useState<CustomerOption[]>([]); //opzioni clienti (popolate dalle view)

    /** load status (export + altre azioni che richiedono feedback) */
    const [loadStatus, setLoadStatus] = React.useState<LoadStatus>({
        search: false, // ricerca tabella
        search_customers: false, // ricerca clienti per select
        export_data: false, // export CSV
        infiniteScroll: false, // caricamento infinite scroll
    });
    /** Funzione per cambiare lo stato di caricamento */
    const ChangeLoadStatus = React.useCallback(({ from, bool }: ChangeLoadStatusArgs) => {
        setLoadStatus((prev: LoadStatus) => ({ ...prev, [from]: bool !== undefined ? bool : !prev[from] }));
    }, []);

    // ref per l'AbortController dell'export file
    const exportAbortRef = React.useRef<AbortController | null>(null); //abort export CSV

    // report menu e filter menu state (controllati dal parent per il tour)
    const [reportOpen, setReportOpen] = React.useState<boolean>(false);
    const [filtersOpen, setFiltersOpen] = useState(false); //apertura menu filtri
    const { isOpen, activeKeys } = useTour();
    const isClientiTourOpen = isOpen && !!activeKeys?.includes("clienti");

    // permessi (calcolati sempre, poi decidi cosa mostrare)
    const isAdmin = Boolean(
        userContext?.details &&
        CheckAdminPermissions({
            userRole: userContext.details.ruolo,
            permissions: userContext.details.permissions,
            panelToCheck: "situazione_fidi",
            where: 0,
            rolesToCheck: [0, 1],
        })
    ); //true se l’utente può vedere/operare su funzioni admin

    const currentDef = viewsRegistry.find((v) => v.id === view)! as ViewDefinition<any>; //definizione view corrente (registry)

    /**
     * Cambio tab:
     * - aggiorna view
     * - aggiorna searchParams (applicato) con gli extra già salvati per la view di destinazione
     * @param nextView
     */
    const handleChangeView = React.useCallback(
        (nextView: ViewId) => {
            if (isClientiTourOpen && nextView === view) return; //durante il toursystem clienti evita il remount della view quando si clicca la tab già attiva, per impedire remount e perdere focus/selector dello step.
            setView(nextView);

            const extraForView = extraByView[nextView];
            setSearchParams({
                view: nextView,
                common,
                extra: extraForView,
            });
        },
        [isClientiTourOpen, view, common, extraByView]
    );

    /**
     * Click su "Cerca":
     * congela i filtri correnti (common + extraByView[view]) in searchParams.
     * Per la view Fido inietta anche fidoTypes (searchType).
     */
    const handleSearch = React.useCallback(() => {
        ChangeLoadStatus({ from: "search", bool: true });
        let nextExtra: any = extraByView[view];

        if (view === "fido") {
            nextExtra = { ...(nextExtra || {}), searchType: fidoTypes };
        } else {
            nextExtra = nextExtra ?? undefined;
        }

        // salvo gli extra "grezzi" per la view (UI)
        setExtraByView((prev) => ({
            ...prev,
            [view]: nextExtra,
        }));

        // aggiorno i params usati dalle view per la fetch (APPLICATI)
        setSearchParams({
            view,
            common,
            extra: nextExtra,
        });
    }, [view, common, extraByView, fidoTypes]);

    /**
     * Click su "Scarica CSV":
     * usa filtri UI correnti (common + extra) e chiama la fetch di export corretta per view.
     */
    const handleExport = React.useCallback(() => {
        if (!userContext) return;
        ChangeLoadStatus({ from: "export_data", bool: true });

        const c = commonRef.current;
        const extraAll = extraByViewRef.current;
        const fidoSearch = fidoTypesRef.current;

        const commonBody = buildCommonBodyFromFilters(c); //payload base parseCommonFilters

        switch (view) {
            case "anagrafica":
                exportAnagraficaCSV({
                    userContext,
                    abortController: exportAbortRef,
                    body: commonBody,
                    ChangeLoadStatus,
                    setErr: () => { },
                });
                break;

            case "backorders":
                exportBackordersCSV({
                    userContext,
                    abortController: exportAbortRef,
                    body: commonBody,
                    ChangeLoadStatus,
                    setErr: () => { },
                });
                break;

            case "fido":
                // Fido: parseFidoFilters → CommonFilters + extra (searchType) + tp/val
                const body: any = {
                    ...commonBody,
                };

                if (typeof fidoSearch?.tp === "number") body.tp = fidoSearch.tp;
                if (fidoSearch?.val != null && fidoSearch.val !== "") body.val = fidoSearch.val;

                const extraFido = extraAll["fido"];
                if (extraFido && typeof extraFido === "object") {
                    Object.assign(body, extraFido);
                }

                exportFidoCSV({
                    userContext,
                    abortController: exportAbortRef,
                    body,
                    ChangeLoadStatus,
                    setErr: () => { },
                });
                break;

            // Report Profilazione – tutti parseCommonFilters
            case "reportAltriProblemi":
                exportReportAltriProblemiCSV({
                    userContext,
                    abortController: exportAbortRef,
                    body: commonBody,
                    ChangeLoadStatus,
                    setErr: () => { },
                });
                break;

            case "reportDiffEconomica":
                exportReportDiffEconomicaCSV({
                    userContext,
                    abortController: exportAbortRef,
                    body: commonBody,
                    ChangeLoadStatus,
                    setErr: () => { },
                });
                break;

            case "reportNoteClienti":
                exportReportNoteClientiCSV({
                    userContext,
                    abortController: exportAbortRef,
                    body: commonBody,
                    ChangeLoadStatus,
                    setErr: () => { },
                });
                break;

            case "reportCambioAgente":
                exportReportRichCambioAgenteCSV({
                    userContext,
                    abortController: exportAbortRef,
                    body: commonBody,
                    ChangeLoadStatus,
                    setErr: () => { },
                });
                break;

            default:
                console.warn(`Export CSV non ancora implementato per la view "${view}"`);
                break;
        }
    }, [view, userContext]);

    /**
     * Navigazione cross-view su cliente:
     * es. da Backorders → Anagrafica/Fido con customer già filtrato.
     * ⚠️ niente deps → identità stabile; usa i ref per gli stati più aggiornati.
     */
    const jumpToViewForCustomer = React.useCallback(
        (targetView: ViewId, customer: { codice: string; denominazione?: string }) => {
            const prevCommon = commonRef.current;
            const prevExtraByView = extraByViewRef.current;
            const currentFidoTypes = fidoTypesRef.current;

            // common aggiornato con filtro cliente
            const nextCommon: CommonFilters = {
                ...prevCommon,
                clientFilterCodes: [{
                    codiceCliente: customer.codice,
                    ragioneSociale: customer.denominazione || ""
                }],
                /*customerSelected: {
                    codice: customer.codice,
                    denominazione: customer.denominazione ?? "",
                },*/
            };

            console.log("codiceCliente aggiunto al filtro common:", nextCommon.clientFilterCodes);

            // aggiorna la lista clienti condivisa (se non c’è già)
            setCustomerOptions((prev) => {
                // condizione di esistenza
                const exists = prev.find((c) => c.codiceCliente === customer.codice);
                if (exists) return prev;
                return [
                    ...prev,
                    {
                        codiceCliente: customer.codice,
                        ragioneSociale: customer.denominazione || "",
                    },
                ];
            });

            // extra per la view di destinazione
            let nextExtra: any = prevExtraByView[targetView];
            if (targetView === "fido") {
                nextExtra = { ...(nextExtra || {}), searchType: currentFidoTypes };
            } else {
                nextExtra = nextExtra ?? undefined;
            };

            // aggiorno stati UI
            setCommon(nextCommon);
            setView(targetView);
            setExtraByView((prev) => ({
                ...prev,
                [targetView]: nextExtra,
            }));

            // params applicati per la view di destinazione
            setSearchParams({
                view: targetView,
                common: nextCommon,
                extra: nextExtra,
            });
        }, []
    );


    const content = !userContext?.details ? (
        <GeneralError img={ErrorIMG} />
    ) : (
        <div className="h-full flex flex-col gap-2">
            <Topbar
                reportOpen={reportOpen}
                setReportOpen={setReportOpen}
                filtersOpen={filtersOpen}
                setFiltersOpen={setFiltersOpen}
                tabs={viewsRegistry.map((v) => ({ id: v.id, label: v.label }))}
                view={view}
                onChangeView={handleChangeView}
                common={common}
                onChangeCommon={setCommon}
                fidoTypes={fidoTypes}
                setFidoTypes={setFidoTypes}
                onSearch={handleSearch}
                onExport={handleExport}
                isAdmin={isAdmin}
                userContext={userContext}
                customerOptions={customerOptions} setCustomerOptions={setCustomerOptions}
                loadStatus={loadStatus} ChangeLoadStatus={ChangeLoadStatus}
            />

            <ViewHost
                def={currentDef}
                userContext={userContext}
                params={searchParams}
                setCustomerOptions={setCustomerOptions}
                onNavigateToCustomerView={jumpToViewForCustomer}
                loadStatus={loadStatus} ChangeLoadStatus={ChangeLoadStatus}
            />
        </div>
    );

    //tour-system
    const role = (userContext?.details?.ruolo as Role) ?? "Tester";
    const isAuthorized = role === "Admin" || role === "Dev";
    const resetFiltersStep = isAuthorized ? 12 : 11;
    const closeFiltersStep = isAuthorized ? 13 : 12;


    const tour = useSectionTour({
        id: 'nex_v2_clienti',
        version: '2.0.0',
        user: {
            id: userContext?.details?._id ?? '',
            role: (userContext?.details?.ruolo as Role) ?? 'Tester',
        },
        keys: 'clienti',
        actions: {
            5: () => setReportOpen(false),
            6: () => setReportOpen(true),
            7: () => setReportOpen(false),
            8: () => { setFiltersOpen(false) },
            9: () => { setFiltersOpen(true) },
            10: () => { setFiltersOpen(true) },
            [resetFiltersStep]: () => setFiltersOpen(true),
            [closeFiltersStep]: () => setFiltersOpen(false),
        }
    });
    return (
        <DashboardLayout>
            {content}
            <Tooltip
                id="customers-tooltip"
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
};

export default CustomersSituation;