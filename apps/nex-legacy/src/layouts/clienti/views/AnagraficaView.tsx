import React from "react";
import { TableVirtualized } from "components/Virtualized/table";
import { getData as getAnagraficaData } from "../fetchData/anagrafica/getData";
import type { ViewComponentProps, SearchParams } from "../types/view";

import FDIconButton from "components/UI/buttons/FDIconButton";
import { BsPiggyBank, BsBoxSeam } from "react-icons/bs";
import { LuChartNoAxesCombined } from "react-icons/lu";
import { useNavigate } from "react-router-dom";


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * View Anagrafica:
 * - renderizza una tabella virtualizzata con i clienti
 * - gestisce paginazione/infinite scroll tramite getAnagraficaData
 * - popola le opzioni clienti per la select condivisa in Topbar (FiltersMenu)
 * - aggiunge una colonna "Opzioni" con shortcut verso Fido/Backorders/Fatturati
 * @returns
 */
export const AnagraficaView: React.FC<ViewComponentProps> = ({
    userContext,
    params,
    onNavigateToCustomerView,
    loadStatus, ChangeLoadStatus,
}) => {
    const [rows, setRows] = React.useState<any[]>([]); //righe tabella (già arricchite con OPZIONI + data formattata)
    const [total, setTotal] = React.useState<number>(0); //totale record lato BE
    const [loading, setLoading] = React.useState(false); //loading fetch tabella
    const offsetRef = React.useRef(0); //offset per paginazione/infinite scroll
    const abortController = React.useRef<AbortController | null>(null); //abort controller per interrompere fetch pendenti

    const navigate = useNavigate(); //router navigate (per redirect a /contabilita/fatturati)

    const columns = React.useMemo(() => [
        {
            key: "opzioni",
            label: 'Opzioni',
            type: 'custom',
            width: 180,
            render: ({ elm, index }: { elm: any, index: number }) => {
                const codice = String(elm?.CODICE_CLIENTE ?? "").trim() || ""; //codice cliente
                const denominazione =
                    String(elm?.RAGIONE_SOCIALE ?? "").trim() || ""; //ragione sociale

                const customerPayload = { codice, denominazione }; //payload per jump cross-view

                return <div key={codice + ":" + index} className="w-full flex gap-2 items-center w-full justify-center">
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

                    {/* Backorders (stessa pagina, cambio tab) */}
                    <FDIconButton
                        icon={BsBoxSeam({})}
                        dataTooltipId="customers-tooltip"
                        dataTooltipContent="Backorders Cliente"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!codice || !onNavigateToCustomerView) return;
                            onNavigateToCustomerView("backorders", customerPayload);
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

                            const sysInfo = "FOCELDA"; //stesso approccio usato in altre viste

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
                </div>
            }
        },
        {
            key: "CODICE_CLIENTE",
            label: "Cod. cliente",
            sort: true,
            sortType: "number",
            type: "string",
            width: 150,
            sx: { alignItems: "center" },
        },
        {
            key: "RAGIONE_SOCIALE",
            label: "Rag. sociale",
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
            width: 160,
            sx: { alignItems: "center" },
        },
        {
            key: "CODICE_FISCALE",
            label: "Codice fiscale",
            sort: false,
            width: 160,
            sx: { alignItems: "center" },
        },
        {
            key: "STATO_AMMINISTRATIVO",
            label: "Stato amm.",
            sort: false,
            width: 180,
            sx: { alignItems: "center" },
        },
        {
            key: "STATO_COMMERCIALE",
            label: "Stato comm.",
            sort: false,
            width: 180,
            sx: { alignItems: "center" },
        },
        {
            key: "DATA_ULTIMO_CONTATTO",
            label: "Data ultimo contatto",
            type: "date",
            dateType: "YYYYMMDD",
            sort: false,
            width: 180,
            sx: { alignItems: "center" },
        },
        {
            key: "DESCR_ULTIMO_CONTATTO",
            label: "Descr. ultimo contatto",
            sort: false,
            width: 260,
            sx: { alignItems: "center" },
        },
    ],
        []
    ); //definizione colonne tabella

    /**
     * Costruisce il body per getAnagraficaData a partire da SearchParams (common filters).
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

        // filtro “lista clienti”
        if (c.clientFilterCodes?.length) {
            body.cst = 1;
            body.ccli = c.clientFilterCodes.map((c) => ({ codice: c.codiceCliente }));
        };

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
        setRows([]); //reset righe (arricchimento verrà riapplicato via setRowsWithOptions)

        await getAnagraficaData({
            userContext,
            abortController,
            body: makeBody(params),
            offset: offsetRef,
            setData: setRows,
            setErr: () => { },
            ChangeLoadStatus,
            setTotal,
        });

        setLoading(false);
    }, [userContext?.token, params, makeBody, ChangeLoadStatus]);

    // reload tabella quando cambiano i params applicati
    React.useEffect(() => {
        fetchFirstPage();
    }, [fetchFirstPage]);

    /**
     * Infinite scroll:
     * carica la pagina successiva usando l’offset gestito internamente da getAnagraficaData.
     * @returns Promise<boolean> (false = niente da caricare)
     */
    const infiniteScroll = React.useCallback(() => {
        if (!userContext?.token) return Promise.resolve(false);
        if (loading || (total && rows.length >= total)) return Promise.resolve(false);

        ChangeLoadStatus({ from: "infiniteScroll", bool: true });

        return getAnagraficaData({
            userContext,
            abortController,
            body: makeBody(params),
            offset: offsetRef,
            setData: setRows,
            setErr: () => { },
            ChangeLoadStatus,
            setTotal,
        }) as unknown as Promise<any>;
    }, [userContext?.token, params, makeBody, rows.length, total, loading]);

    return (
        <TableVirtualized
            key="anagrafica"
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
    );
};