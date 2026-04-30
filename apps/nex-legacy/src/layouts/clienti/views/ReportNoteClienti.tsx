import React from "react";
import { TableVirtualized } from "components/Virtualized/table";
import {
    getData as getNoteClientiData,
} from "../fetchData/reportProfilazione/noteClienti/getData";
import {
    searchCustomers as searchCustomersNoteClienti,
} from "../fetchData/reportProfilazione/noteClienti/searchCustomers";
import type { ViewComponentProps, SearchParams } from "../types/view";
import { ConvertToItalianDate } from "utils";

import FDIconButton from "components/UI/buttons/FDIconButton";
import { IoPersonSharp } from "react-icons/io5";
import { BsPiggyBank, BsBoxSeam } from "react-icons/bs";
import { LuChartNoAxesCombined } from "react-icons/lu";
import { useNavigate } from "react-router-dom";


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
type CustomerOption = {
    label: string; //label per select clienti (UI)
    value: string; //value per select clienti (UI)
    raw: { codice: string; denominazione: string }; //payload cliente (codice + denominazione)
};

interface ReportNoteClientiProps extends ViewComponentProps {
    setCustomerOptions?: React.Dispatch<React.SetStateAction<CustomerOption[]>>; //setter opzioni clienti condivise (Topbar)
    setLoadingCustomers?: React.Dispatch<React.SetStateAction<boolean>>; //setter loading opzioni clienti (Topbar)
}


// ——————————————————————————————————————————————————————————
// UTILS
// ——————————————————————————————————————————————————————————
/**
 * Normalizza una data in formato "YYYYMMDD" (es. "20251203") in "DD/MM/YYYY".
 * Se la stringa contiene già "/", viene restituita invariata.
 * @param value
 * @returns
 */
const formatDateFromYYYYMMDD = (value?: string | null): string => {
    if (!value) return "";
    const str = String(value).trim();

    // se è già in formato gg/mm/aaaa o contiene slash, lascio così
    if (str.includes("/")) return str;

    // formato atteso "YYYYMMDD"
    if (/^\d{8}$/.test(str)) {
        const year = str.slice(0, 4);
        const month = str.slice(4, 6);
        const day = str.slice(6, 8);
        return `${day}/${month}/${year}`;
    }

    // fallback: restituisco la stringa originale
    return str;
};


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * View Report Note Clienti:
 * - visualizza le note associate ai clienti
 * - formatta DATA_NOTA (YYYYMMDD -> DD/MM/YYYY) e ULTIMA_MODIFICA (util ConvertToItalianDate)
 * - popola la select clienti condivisa in Topbar (FiltersMenu)
 * - gestisce paginazione/infinite scroll tramite getNoteClientiData
 * - aggiunge colonna "Opzioni" con shortcut verso Anagrafica/Fido/Backorders/Fatturati
 * @returns
 */
export const ReportNoteClientiView: React.FC<ReportNoteClientiProps> = ({
    userContext,
    params,
    setCustomerOptions,
    setLoadingCustomers,
    onNavigateToCustomerView, loadStatus,
    ChangeLoadStatus, }) => {
    const [rows, setRows] = React.useState<any[]>([]); //righe tabella (arricchite con OPZIONI + date formattate)
    const [total, setTotal] = React.useState<number>(0); //totale record lato BE
    const [loading, setLoading] = React.useState(false); //loading fetch tabella
    const offsetRef = React.useRef(0); //offset per paginazione/infinite scroll
    const abortController = React.useRef<AbortController | null>(null); //abort controller per interrompere fetch pendenti

    const navigate = useNavigate(); //router navigate (per redirect a /contabilita/fatturati)

    /**
     * Wrapper setRows:
     * - mantiene la firma di setState
     * - formatta DATA_NOTA e ULTIMA_MODIFICA
     * - aggiunge la colonna OPZIONI con azioni rapide per il cliente
     */
    const setRowsWithOptions = React.useCallback(
        (updater: React.SetStateAction<any[]>) => {
            setRows((prev) => {
                const next =
                    typeof updater === "function" ? (updater as any)(prev) : updater;
                if (!Array.isArray(next)) return next;

                return next.map((row) => {
                    const codice = String(row?.CLIENTE ?? "").trim() || ""; //codice cliente (campo specifico view NOTE)
                    const denominazione =
                        String(row?.RAGIONE_SOCIALE ?? "").trim() || ""; //ragione sociale
                    const customerPayload = { codice, denominazione }; //payload per jump cross-view

                    return {
                        ...row,
                        DATA_NOTA: formatDateFromYYYYMMDD(row?.DATA_NOTA), //YYYYMMDD -> DD/MM/YYYY
                        ULTIMA_MODIFICA: ConvertToItalianDate(row?.ULTIMA_MODIFICA, null), //data/ora in formato IT (util)
                        OPZIONI: (
                            <div className="w-full flex gap-2 items-center">
                                {/* 1) Anagrafica */}
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

                                {/* 2) Fido */}
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

                                {/* 3) Backorders */}
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

                                {/* 4) Fatturato */}
                                <FDIconButton
                                    icon={LuChartNoAxesCombined({})}
                                    dataTooltipId="customers-tooltip"
                                    dataTooltipContent="Fatturato Cliente"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!codice) return;

                                        const sysInfo = "FOCELDA"; //sistema di riferimento per i fatturati
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
        [navigate, onNavigateToCustomerView]
    );

    const columns = React.useMemo(
        () => [
            {
                key: "OPZIONI",
                label: "Opzioni",
                sort: false,
                width: 220,
                sx: { alignItems: "center" },
            },
            {
                key: "CLIENTE",
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
                key: "PARTITA_IVA",
                label: "Partita IVA",
                sort: true,
                sortType: "number",
                type: "string",
                width: 200,
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
                key: "AGENTE",
                label: "Agente",
                sort: true,
                sortType: "string",
                type: "string",
                width: 220,
                sx: { alignItems: "center" },
            },
            {
                key: "MICROSETTORE",
                label: "Microsettore",
                sortType: "string",
                type: "string",
                sort: true,
                width: 260,
                sx: { alignItems: "center" },
            },
            {
                key: "CANALE_VENDITA",
                label: "Canale di Vendita",
                sort: true,
                type: "string",
                sortType: "number",
                width: 200,
                sx: { alignItems: "center" },
            },
            {
                key: "PROGRESSIONE_NOTA",
                label: "Progressione Nota",
                sort: true,
                type: "string",
                sortType: "number",
                width: 200,
                sx: { alignItems: "center" },
            },
            {
                key: "NOTA",
                label: "Nota",
                sort: false,
                type: "string",
                width: 200,
                sx: { alignItems: "center" },
            },
            {
                key: "DATA_NOTA",
                label: "Data Nota",
                sort: false,
                type: "string",
                width: 200,
                sx: { alignItems: "center" },
            },
            {
                key: "TIPO_NOTA",
                label: "Tipo Nota",
                sort: false,
                type: "string",
                width: 200,
                sx: { alignItems: "center" },
            },
            {
                key: "UTENTE",
                label: "Utente",
                sort: true,
                sortType: "string",
                type: "string",
                width: 200,
                sx: { alignItems: "center" },
            },
            {
                key: "ULTIMA_MODIFICA",
                label: "Ultima Modifica",
                sort: false,
                type: "string",
                width: 200,
                sx: { alignItems: "center" },
            },
        ],
        []
    ); //definizione colonne tabella report

    /**
     * Costruisce il body comune per la fetch (parseCommonFilters lato BE).
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
            body.ccli = c.clientFilterCodes.map((codice) => ({ codice }));
        }

        return body;
    }, []);

    /**
     * Fetch lista clienti per la select condivisa (Topbar).
     * Nota: usa filtri minimi (cmp + eventuali agentCode/piva/ragsoc) per suggerire clienti coerenti.
     */
    const fetchCustomers = React.useCallback(() => {
        if (!userContext?.token) return;
        if (!setCustomerOptions || !setLoadingCustomers) return;

        setLoadingCustomers(true);

        const c = params.common;
        const body: any = { cmp: c.companySelected };
        if (c.agentCode) body.ccom = c.agentCode;
        if (c.piva?.trim()) body.piva = c.piva.trim();
        if (c.ragSoc?.trim()) body.ragsoc = c.ragSoc.trim();

        searchCustomersNoteClienti({
            userContext,
            abortController,
            body,
            setOptions: (opts) => {
                // rimappo aggiungendo raw.denominazione (parsata dalla label)
                const mapped = (opts || []).map((o: any) => {
                    const parts = String(o.label ?? "").split(" - ");
                    const denominazione = parts.slice(1).join(" - ");
                    return {
                        ...o,
                        raw: { codice: o.value, denominazione },
                    };
                });

                setCustomerOptions(mapped);
                setLoadingCustomers(false);
            },
            ChangeLoadStatus: () => { },
        });
    }, [
        userContext?.token,
        params.common.companySelected,
        params.common.agentCode,
        params.common.piva,
        params.common.ragSoc,
        setCustomerOptions,
        setLoadingCustomers,
    ]);

    /**
     * Fetch prima pagina:
     * resetta offset/righe e ricarica la tabella con i params applicati (searchParams).
     */
    const fetchFirstPage = React.useCallback(async () => {
        if (!userContext?.token) return;

        setLoading(true);
        offsetRef.current = 0;
        setRows([]); //reset righe (OPZIONI + formattazione verranno riapplicati via setRowsWithOptions)

        await getNoteClientiData({
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

    // aggiorno le opzioni clienti quando cambiano i filtri di base (company/agent/piva/ragsoc)
    React.useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    /**
     * Infinite scroll:
     * carica la pagina successiva usando l’offset gestito internamente dalla fetch.
     * @returns Promise<boolean> (false = niente da caricare)
     */
    const infiniteScroll = React.useCallback(() => {
        if (!userContext?.token) return Promise.resolve(false);
        if (loading || (total && rows.length >= total)) return Promise.resolve(false);

        return getNoteClientiData({
            userContext,
            abortController,
            body: makeBody(params),
            offset: offsetRef,
            setData: setRowsWithOptions,
            setErr: () => { },
            ChangeLoadStatus: () => { },
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
        <TableVirtualized
            key="reportNoteClienti"
            data={rows}
            setData={setRowsWithOptions}
            columns={columns}
            setColumns={() => { }}
            results={total}
            loadStatus={loading}
            whereToFindData={false}
            footer
            infiniteScroll={{ func: infiniteScroll }}
            className="h-full"
        />
    );
};
