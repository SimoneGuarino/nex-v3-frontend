import React from "react";
import { TableVirtualized } from "components/Virtualized/table";
import { getData as getBackordersData } from "../fetchData/backorders/getData";
import type { ViewComponentProps, SearchParams } from "../types/view";
import { BackordersDetailsPanel } from "../components/BackordersDetailsPanel";
import FDIconButton from "components/UI/buttons/FDIconButton";
import { IoInformation, IoPersonSharp } from "react-icons/io5";
import { LuChartNoAxesCombined } from "react-icons/lu";
import { BsPiggyBank } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { useTour } from "tour/TourProvider";


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * View Backorders:
 * - renderizza una tabella virtualizzata con la situazione backorders per cliente
 * - gestisce paginazione/infinite scroll tramite getBackordersData
 * - popola la lista clienti per la select condivisa in Topbar (FiltersMenu)
 * - aggiunge una colonna "Opzioni" con shortcut verso Anagrafica/Fido/Fatturati + pannello dettagli backorders
 * @returns
 */
export const BackordersView: React.FC<ViewComponentProps> = ({
    userContext,
    params,
    onNavigateToCustomerView,
    loadStatus, ChangeLoadStatus,
}) => {
    const [rows, setRows] = React.useState<any[]>([]); //righe tabella (arricchite con OPZIONI)
    const [total, setTotal] = React.useState<number>(0); //totale record lato BE
    const [loading, setLoading] = React.useState(false); //loading fetch tabella
    const offsetRef = React.useRef(0); //offset per paginazione/infinite scroll
    const abortController = React.useRef<AbortController | null>(null); //abort controller per interrompere fetch pendenti

    const navigate = useNavigate(); //router navigate (per redirect a /contabilita/fatturati)

    /* TOUR SYSTEM */
    //const per blocco interazioni durante gli step del tour
    const { isOpen, index: tourIndex } = useTour();
    const lockInteractions = isOpen && (tourIndex === 4);

    // stato per modale dettaglio backorders
    const [detailsOpen, setDetailsOpen] = React.useState(false); //apertura/chiusura pannello dettagli
    const [selectedCustomer, setSelectedCustomer] = React.useState<{
        codice: string | null;
        denominazione: string | null;
    }>({ codice: null, denominazione: null }); //cliente selezionato per pannello dettagli

    /**
     * Apre il pannello dettaglio backorders per il cliente della riga cliccata.
     * @param row
     */
    const handleOpenDetails = React.useCallback((row: any) => {
        const codice = String(row?.CODICE_CLIENTE ?? "").trim() || null;
        const denominazione =
            String(row?.RAGIONE_SOCIALE ?? row?.RAGIONE_SOCIALE_2 ?? "").trim() || null;

        if (!codice) return;

        setSelectedCustomer({
            codice,
            denominazione,
        });
        setDetailsOpen(true);
    }, []);

    /**
     * Chiude il pannello dettaglio backorders.
     */
    const handleCloseDetails = React.useCallback(() => {
        setDetailsOpen(false);
    }, []);

    /**
     * Wrapper setRows:
     * - mantiene la firma di setState
     * - arricchisce ogni riga con la colonna OPZIONI (bottoni)
     */
    const setRowsWithOptions = React.useCallback(
        (updater: React.SetStateAction<any[]>) => {
            setRows((prev) => {
                const next =
                    typeof updater === "function" ? (updater as any)(prev) : updater;

                if (!Array.isArray(next)) return next;

                return next.map((row) => {
                    const codice = String(row?.CODICE_CLIENTE ?? "").trim() || ""; //codice cliente
                    const denominazione =
                        String(row?.RAGIONE_SOCIALE ?? row?.RAGIONE_SOCIALE_2 ?? "").trim() || ""; //ragione sociale

                    const customerPayload = { codice, denominazione }; //payload per jump cross-view


                    return {
                        ...row,
                        OPZIONI: (
                            <div className="w-full flex gap-2 items-center" data-tour="clienti-topbar-backorders-short-cut">
                                {/* Anagrafica (stessa pagina, cambio tab) */}
                                <FDIconButton
                                    icon={IoPersonSharp({})}
                                    dataTooltipId="customers-tooltip"
                                    dataTooltipContent="Anagrafica Cliente"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!codice || !onNavigateToCustomerView) return;
                                        onNavigateToCustomerView("anagrafica", customerPayload);
                                    }}
                                />

                                {/* Fido (stessa pagina, cambio tab) */}
                                <FDIconButton
                                    icon={BsPiggyBank({})}
                                    dataTooltipId="customers-tooltip"
                                    dataTooltipContent="Fido Residuo Cliente"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!codice || !onNavigateToCustomerView) return;
                                        onNavigateToCustomerView("fido", customerPayload);
                                    }}
                                />

                                {/* Fatturato (pagina /contabilita/fatturati) */}
                                <FDIconButton
                                    icon={LuChartNoAxesCombined({})}
                                    dataTooltipId="customers-tooltip"
                                    dataTooltipContent="Fatturato Cliente"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!codice) return;

                                        // sysInfo in base alla company selezionata (attualmente fisso)
                                        const sysInfo = "FOCELDA";

                                        const searchParams = new URLSearchParams({
                                            CLI: codice,
                                            dimension: "CLIENT",
                                            sysInfo,
                                        });

                                        navigate(
                                            `/contabilita/fatturati?${searchParams.toString()}`
                                        );
                                    }}
                                />

                                {/* Info (pannello dettaglio backorders) */}
                                <FDIconButton
                                    icon={IoInformation({})}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenDetails({
                                            ...row,
                                            CODICE_CLIENTE: codice,
                                            RAGIONE_SOCIALE: denominazione,
                                        });
                                    }}
                                    dataTooltipId="customers-tooltip"
                                    dataTooltipContent="Info"
                                />
                            </div>
                        ),
                    };
                });
            });
        },
        [handleOpenDetails, onNavigateToCustomerView, navigate, params.common.companySelected]
    );

    const columns = React.useMemo(
        () => [
            {
                key: "OPZIONI",
                label: "Opzioni",
                sort: false,
                width: 180,
                sx: { alignItems: "center" },
            },
            {
                key: "CODICE_AGENTE",
                label: "Codice Agente",
                sort: true,
                sortType: "string",
                type: "string",
                width: 200,
                sx: { alignItems: "center" },
            },
            {
                key: "CODICE_CLIENTE",
                label: "Codice Cliente",
                sort: true,
                sortType: "number",
                type: "string",
                width: 200,
                sx: { alignItems: "center" },
            },
            {
                key: "RAGIONE_SOCIALE",
                label: "Ragione Sociale",
                sort: true,
                sortType: "string",
                type: "string",
                width: 250,
                sx: { alignItems: "center" },
            },
            {
                key: "RAGIONE_SOCIALE_2",
                label: "Ragione Sociale 2",
                sort: true,
                sortType: "string",
                type: "string",
                width: 250,
                sx: { alignItems: "center" },
            },
            {
                key: "PARTITA_IVA",
                label: "Partita IVA",
                sort: true,
                sortType: "number",
                type: "string",
                width: 220,
                sx: { alignItems: "center" },
            },
            {
                key: "RESIDUO",
                label: "Residuo",
                sort: false,
                type: "string",
                width: 200,
                sx: { alignItems: "center" },
            },
            {
                key: "CONSEGNA",
                label: "In Consegna",
                sort: false,
                type: "string",
                width: 200,
                sx: { alignItems: "center" },
            },
            {
                key: "TOTALE",
                label: "Totale",
                type: "eur",
                sort: false,
                width: 260,
                sx: { alignItems: "center" },
            },
        ],
        []
    ); //definizione colonne tabella

    /**
     * Costruisce il body per getBackordersData a partire da SearchParams (common filters).
     * @param p
     * @returns
     */
    const makeBody = React.useCallback((p: SearchParams<any>) => {
        const c = p.common;
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

        // cliente selezionato
        if (c.customerSelected?.codice) body.ccli = c.customerSelected.codice;

        // filtro “lista clienti”
        if (c.clientFilterCodes?.length) {
            body.cst = 1;
            body.ccli = c.clientFilterCodes.map((c) => ({ codice: c.codiceCliente }));
        }

        return body;
    }, []);

    /**
     * Fetch prima pagina:
     * resetta offset/righe e ricarica la tabella con i params applicati (searchParams).
     */
    const fetchFirstPage = React.useCallback(async () => {
        if (!userContext?.token) return;

        setLoading(true);
        offsetRef.current = 0;
        setRows([]); //reset righe (OPZIONI verrà riapplicato via setRowsWithOptions)

        await getBackordersData({
            userContext,
            abortController,
            body: makeBody(params),
            offset: offsetRef,
            setData: setRowsWithOptions,
            setErr: () => { },
            ChangeLoadStatus,
            setTotal,
        });

        setLoading(false);
    }, [userContext?.token, params, makeBody, setRowsWithOptions, ChangeLoadStatus]);

    // reload tabella quando cambiano i params applicati
    React.useEffect(() => {
        fetchFirstPage();
    }, [fetchFirstPage]);

    /**
     * Infinite scroll:
     * carica la pagina successiva usando l’offset gestito internamente da getBackordersData.
     * @returns Promise<boolean> (false = niente da caricare)
     */
    const infiniteScroll = React.useCallback(() => {
        if (!userContext?.token) return Promise.resolve(false);
        if (loading || (total && rows.length >= total)) return Promise.resolve(false);

        ChangeLoadStatus({ from: "infiniteScroll", bool: true });

        return getBackordersData({
            userContext,
            abortController,
            body: makeBody(params),
            offset: offsetRef,
            setData: setRowsWithOptions,
            setErr: () => { },
            ChangeLoadStatus,
            setTotal,
        }) as unknown as Promise<any>;
    }, [
        userContext?.token,
        params,
        makeBody,
        rows.length,
        total,
        loading,
        setRowsWithOptions,
    ]);

    return (
        <>{lockInteractions && (
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
            <TableVirtualized
                key="backordersList"
                data={rows}
                setData={setRows}
                columns={columns}
                setColumns={() => { }}
                results={total}
                loadStatus={loading}
                whereToFindData={false}
                footer
                infiniteScroll={{
                    func: infiniteScroll,
                    loadStatus: loadStatus.infiniteScroll
                }}
                className="h-full"
            />

            <BackordersDetailsPanel
                open={detailsOpen}
                onClose={handleCloseDetails}
                userContext={userContext}
                companySelected={params.common.companySelected}
                agentCode={params.common.agentCode || null}
                customerCode={selectedCustomer.codice}
                customerLabel={selectedCustomer.denominazione}
            />
        </>
    );
};