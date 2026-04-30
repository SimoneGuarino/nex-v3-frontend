import React from "react";
import { TableVirtualized } from "components/Virtualized/table";
import { InfoPanel } from "../components/InfoPanel";
import { getData as getFidoData } from "../fetchData/fido/getData";
import type { ViewComponentProps, SearchParams } from "../types/view";

import FDIconButton from "components/UI/buttons/FDIconButton";
import { IoPersonSharp } from "react-icons/io5";
import { LuChartNoAxesCombined } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { BsBoxSeam } from "react-icons/bs";


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
type FidoExtra = {
    searchType?: { tp: number; val: string | null }; //filtro extra fido (tipologia + valore filtro)
};

export const FidoFilters: React.FC<{
    value: FidoExtra | undefined; //valore filtri extra (per la view fido)
    onChange: (v: FidoExtra | undefined) => void; //callback update filtri extra
}> = ({ value }) => {
    const tp = value?.searchType?.tp ?? 0; //tipo filtro selezionato (0 = nessuno)
    return (
        <div className="grid grid-cols-1 gap-2">
            <div className="flex gap-2 items-end">
                <div>{/* selettore tp */}</div>
                {tp === 2 ? (
                    <div>{/* data scadenza */}</div>
                ) : tp === 3 ? (
                    <div>{/* percentuale */}</div>
                ) : null}
            </div>
        </div>
    );
}; //placeholder filtri extra fido (UI non implementata in questo file)


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * View Fido:
 * - renderizza una tabella virtualizzata con i fidi per cliente (e relative componenti: Cliente/Assicurato/TopLine/etc.)
 * - mostra un pannello riepilogo (InfoPanel) con totali quando ci sono righe
 * - gestisce paginazione/infinite scroll tramite getFidoData
 * - popola la lista clienti per la select condivisa in Topbar (FiltersMenu)
 * - aggiunge una colonna "Opzioni" con shortcut verso Anagrafica/Backorders/Fatturati
 * @returns
 */
export const FidoView: React.FC<ViewComponentProps<FidoExtra>> = ({
    userContext,
    params,
    onNavigateToCustomerView,
    loadStatus, ChangeLoadStatus,
}) => {
    const [rows, setRows] = React.useState<any[]>([]); //righe tabella (arricchite con OPZIONI)
    const [total, setTotal] = React.useState<number>(0); //totale record lato BE
    const [totals, setTotals] = React.useState<{ sfrs: number; sftot: number }>({
        sfrs: 0,
        sftot: 0,
    }); //totali extra restituiti dal BE (usati in InfoPanel)
    const [loading, setLoading] = React.useState(false); //loading fetch tabella
    const offsetRef = React.useRef(0); //offset per paginazione/infinite scroll
    const abortController = React.useRef<AbortController | null>(null); //abort controller per interrompere fetch pendenti

    const navigate = useNavigate(); //router navigate (per redirect a /contabilita/fatturati)

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
                    const codice = String(row?.codiceCliente ?? "").trim() || ""; //codice cliente
                    const denominazione = String(row?.ragioneSociale ?? "").trim() || ""; //ragione sociale

                    const customerPayload = { codice, denominazione }; //payload per jump cross-view

                    return {
                        ...row,
                        OPZIONI: (
                            <div className="w-full flex gap-2 items-center">
                                {/* 1) Anagrafica (stessa pagina, cambio tab) */}
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

                                {/* 2) Backorders (stessa pagina, cambio tab) */}
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

                                {/* 3) Fatturato (pagina /contabilita/fatturati) */}
                                <FDIconButton
                                    icon={LuChartNoAxesCombined({})}
                                    dataTooltipId="customers-tooltip"
                                    dataTooltipContent="Fatturato Cliente"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!codice) return;

                                        const sysInfo = "FOCELDA"; //stesso approccio usato in Anagrafica/Backorders
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
                        ),
                    };
                });
            });
        },
        [onNavigateToCustomerView, navigate]
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
                key: "codiceCliente",
                label: "Cod. cliente",
                sort: true,
                sortType: "number",
                type: "string",
                width: 150,
                sx: { alignItems: "center" },
            },
            {
                key: "ragioneSociale",
                label: "Rag. sociale",
                sort: true,
                sortType: "string",
                width: 250,
                type: "string",
            },
            {
                key: ["tipiFido.Cliente"],
                fieldToTake: [
                    {
                        key: "valore",
                        sort: true,
                        sortType: "number",
                        type: "eur",
                        sx: { alignItems: "center" },
                    },
                    {
                        key: "scadenza",
                        sort: true,
                        sortType: "string",
                        type: "default",
                        sx: { alignItems: "center" },
                    },
                ],
                label: "Fido cliente",
                width: 200,
                sx: { alignItems: "center" },
            },
            {
                key: ["tipiFido.Assicurato"],
                fieldToTake: [
                    {
                        key: "valore",
                        sort: true,
                        sortType: "number",
                        type: "eur",
                        sx: { alignItems: "center" },
                    },
                    {
                        key: "scadenza",
                        sort: true,
                        sortType: "string",
                        type: "default",
                        sx: { alignItems: "center" },
                    },
                ],
                label: "Fido assicurato",
                width: 200,
                sx: { alignItems: "center" },
            },
            {
                key: ["tipiFido.TopLine"],
                fieldToTake: [
                    {
                        key: "valore",
                        sort: true,
                        sortType: "number",
                        type: "eur",
                        sx: { alignItems: "center" },
                    },
                    {
                        key: "scadenza",
                        sort: true,
                        sortType: "string",
                        type: "default",
                        sx: { alignItems: "center" },
                    },
                ],
                label: "Fido TopLine",
                width: 200,
                sx: { alignItems: "center" },
            },
            {
                key: ["tipiFido.Fideussione"],
                fieldToTake: [
                    {
                        key: "valore",
                        sort: true,
                        sortType: "number",
                        type: "eur",
                        sx: { alignItems: "center" },
                    },
                    {
                        key: "scadenza",
                        sort: true,
                        sortType: "string",
                        type: "default",
                        sx: { alignItems: "center" },
                    },
                ],
                label: "Fido fideussione",
                width: 200,
                sx: { alignItems: "center" },
            },
            {
                key: ["tipiFido.Factoring"],
                fieldToTake: [
                    {
                        key: "valore",
                        sort: true,
                        sortType: "number",
                        type: "eur",
                        sx: { alignItems: "center" },
                    },
                    {
                        key: "scadenza",
                        sort: true,
                        sortType: "string",
                        type: "default",
                        sx: { alignItems: "center" },
                    },
                ],
                label: "Fido Factoring",
                width: 200,
                sx: { alignItems: "center" },
            },
            {
                key: "fatturatoAnnuale",
                label: "Fatturato annuale",
                sort: true,
                sortType: "number",
                width: 150,
                type: "eur",
                sx: { alignItems: "center" },
            },
            {
                key: "fido.residuoFB",
                sort: true,
                sortType: "number",
                type: "eur",
                sx: { alignItems: "center" },
                label: "Saldo (con FB)",
                width: 200,
            },
            {
                key: "fido.residuoNFB",
                sort: true,
                sortType: "number",
                type: "eur",
                sx: { alignItems: "center" },
                label: "Saldo (senza FB)",
                width: 200,
            },
            {
                key: "fido.totale",
                sort: true,
                sortType: "number",
                type: "eur",
                sx: { alignItems: "center" },
                label: "Fido Totale",
                width: 200,
            },
        ],
        []
    ); //definizione colonne tabella fido

    /**
     * Costruisce il body per getFidoData a partire da SearchParams (common + extra fido).
     * @param p
     * @returns
     */
    const makeBody = React.useCallback((p: SearchParams<FidoExtra>) => {
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
        }

        // extra fido: searchType (tp/val)
        const st = p.extra?.searchType;
        if (st && st.tp !== 0) {
            body.tp = { val: st.tp };
            if (st.val) body.tp.flt = st.val;
        }

        return body;
    }, []);

    /**
     * Fetch prima pagina:
     * resetta offset/righe/totali e ricarica la tabella con i params applicati (searchParams).
     */
    const fetchFirstPage = React.useCallback(async () => {
        if (!userContext?.token) return;

        setLoading(true);
        offsetRef.current = 0;
        setRows([]); //reset righe (OPZIONI verrà riapplicato via setRowsWithOptions)
        setTotal(0); //reset totale
        setTotals({ sfrs: 0, sftot: 0 }); //reset totali info panel

        await getFidoData({
            userContext,
            abortController,
            body: makeBody(params),
            offset: offsetRef,
            setData: setRowsWithOptions,
            setErr: () => { },
            ChangeLoadStatus,
            setTotal,
            setTotals,
        });

        setLoading(false);
    }, [userContext?.token, params, makeBody, setRowsWithOptions, ChangeLoadStatus]);

    // reload tabella quando cambiano i params applicati
    React.useEffect(() => {
        fetchFirstPage();
    }, [fetchFirstPage]);

    /**
     * Infinite scroll:
     * carica la pagina successiva usando l’offset gestito internamente da getFidoData.
     * @returns Promise<boolean> (false = niente da caricare)
     */
    const infiniteScroll = React.useCallback(() => {
        if (!userContext?.token) return Promise.resolve(false);
        if (loading || (total && rows.length >= total)) return Promise.resolve(false);

        ChangeLoadStatus({ from: "infiniteScroll", bool: true });

        return getFidoData({
            userContext,
            abortController,
            body: makeBody(params),
            offset: offsetRef,
            setData: setRowsWithOptions,
            setErr: () => { },
            ChangeLoadStatus,
            setTotal,
            setTotals,
        }) as unknown as Promise<any>;
    }, [userContext?.token, params, makeBody, rows.length, total, loading, setRowsWithOptions]);

    return (
        <div className="flex flex-col h-full gap-2">
            {/* pannello totali (mostrato solo se ci sono righe) */}
            {!!rows.length && <InfoPanel data={rows} extraTotalprops={totals} />}

            <TableVirtualized
                key="fido"
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
        </div>
    );
};