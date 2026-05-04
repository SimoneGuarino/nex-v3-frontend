import React from "react";
import { TableVirtualized } from "components/Virtualized/table";
import {
    getData as getDiffEconomicaData,
} from "../fetchData/reportProfilazione/diffEconomica/getData";
import type { ViewComponentProps, SearchParams } from "../types/view";
import { ConvertToItalianDate } from "utils";
import { useCustomerOptionsMenu } from "../components/useCustomerOptionsMenu";

type HeaderSortPayload = {
    columnKey: string;
    sortDirection: number;
};

type ProfilazioneSortDirection = "asc" | "desc";
type ProfilazioneSortField =
    | "CODICE_CLIENTE"
    | "RAGIONE_SOCIALE"
    | "PARTITA_IVA"
    | "CODICE_AGENTE"
    | "AGENTE"
    | "CLIENTE_RISCHIOSO"
    | "DATA_ULTIMO_AGG";

const PROFILAZIONE_SORT_FIELD_BY_COLUMN_KEY: Record<string, ProfilazioneSortField> = {
    CODICE_CLIENTE: "CODICE_CLIENTE",
    RAGIONE_SOCIALE: "RAGIONE_SOCIALE",
    PARTITA_IVA: "PARTITA_IVA",
    CODICE_AGENTE: "CODICE_AGENTE",
    AGENTE: "AGENTE",
    CLIENTE_RISCHIOSO: "CLIENTE_RISCHIOSO",
    DATA_ULTIMO_AGG: "DATA_ULTIMO_AGG",
};

function normalizeProfilazioneSort(sort: HeaderSortPayload): {
    profilazioneSortField?: ProfilazioneSortField;
    profilazioneSortDirection?: ProfilazioneSortDirection;
} {
    const field = PROFILAZIONE_SORT_FIELD_BY_COLUMN_KEY[String(sort.columnKey || "").trim()];
    if (!field) return {};

    if (sort.sortDirection === 1) {
        return { profilazioneSortField: field, profilazioneSortDirection: "asc" };
    }

    if (sort.sortDirection === 2) {
        return { profilazioneSortField: field, profilazioneSortDirection: "desc" };
    }

    return {};
}


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * View Report Difficoltà Economica:
 * - visualizza la lista clienti “a rischio”/con difficoltà economiche
 * - formatta la data "DATA_ULTIMO_AGG" in formato italiano
 * - gestisce paginazione/infinite scroll tramite getDiffEconomicaData
 * - aggiunge la colonna "Opzioni" con shortcut verso Anagrafica/Fido/Backorders/Fatturati
 * @returns
 */
export const ReportDiffEconomicaView: React.FC<ViewComponentProps> = ({
    userContext,
    params,
    onNavigateToCustomerView,
    loadStatus,
    ChangeLoadStatus,
}) => {
    const [rows, setRows] = React.useState<any[]>([]); //righe tabella (arricchite con OPZIONI + data formattata)
    const [total, setTotal] = React.useState<number>(0); //totale record lato BE
    const [loading, setLoading] = React.useState(false); //loading fetch tabella
    const [serverSort, setServerSort] = React.useState<HeaderSortPayload>({
        columnKey: "",
        sortDirection: 0,
    });
    const offsetRef = React.useRef(0); //offset per paginazione/infinite scroll
    const abortController = React.useRef<AbortController | null>(null); //abort controller per interrompere fetch pendenti

    React.useEffect(() => {
        return () => {
            abortController.current?.abort();
            abortController.current = null;
        };
    }, []);

    const { renderOptionsTrigger, optionsOverlays } = useCustomerOptionsMenu({
        currentView: "reportDiffEconomica",
        userContext,
        companySelected: params.common.companySelected,
        agentCode: params.common.agentCode || null,
        onNavigateToCustomerView,
    });

    /**
     * Wrapper setRows:
     * - mantiene la firma di setState
     * - formatta DATA_ULTIMO_AGG
     * - aggiunge la colonna OPZIONI con azioni rapide per il cliente
     */
    const setRowsWithOptions = React.useCallback(
        (updater: React.SetStateAction<any[]>) => {
            setRows((prev) => {
                const next =
                    typeof updater === "function" ? (updater as any)(prev) : updater;
                if (!Array.isArray(next)) return next;

                return next.map((row, index) => {
                    const codice = String(row?.CODICE_CLIENTE ?? "").trim() || ""; //codice cliente
                    const denominazione =
                        String(row?.RAGIONE_SOCIALE ?? "").trim() || ""; //ragione sociale

                    return {
                        ...row,
                        DATA_ULTIMO_AGG: ConvertToItalianDate(row?.DATA_ULTIMO_AGG, null), //formattazione data ultimo aggiornamento
                        OPZIONI: renderOptionsTrigger({
                            codice,
                            denominazione,
                            rowKey: `${codice}:${index}`,
                        }),
                    };
                });
            });
        },
        [renderOptionsTrigger]
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
                key: "CLIENTE_RISCHIOSO",
                label: "Cliente Rischioso",
                sort: true,
                sortType: "string",
                width: 260,
                sx: { alignItems: "center" },
            },
            {
                key: "DATA_ULTIMO_AGG",
                label: "Ultimo Aggiornamento",
                sort: true,
                sortType: "string",
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
            body.ccli = c.clientFilterCodes.map((customer) => ({
                codice: customer.codiceCliente,
            }));
        }

        const normalizedSort = normalizeProfilazioneSort(serverSort);
        if (normalizedSort.profilazioneSortField && normalizedSort.profilazioneSortDirection) {
            body.profilazioneSortField = normalizedSort.profilazioneSortField;
            body.profilazioneSortDirection = normalizedSort.profilazioneSortDirection;
        }

        return body;
    }, [serverSort]);

    const handleServerSortChange = React.useCallback(
        ({ columnKey, sortDirection }: HeaderSortPayload) => {
            setServerSort((prev) => {
                if (prev.columnKey === columnKey && prev.sortDirection === sortDirection) {
                    return prev;
                }
                return { columnKey, sortDirection };
            });
        },
        []
    );

    /**
     * Fetch prima pagina:
     * resetta offset/righe e ricarica la tabella con i params applicati (searchParams).
     */
    const fetchFirstPage = React.useCallback(async () => {
        if (!userContext?.token) return;

        setLoading(true);
        offsetRef.current = 0;
        setRows([]); //reset righe (OPZIONI + formattazione verranno riapplicati via setRowsWithOptions)

        await getDiffEconomicaData({
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
        fetchFirstPage().catch(() => { });
    }, [fetchFirstPage]);

    /**
     * Infinite scroll:
     * carica la pagina successiva usando l’offset gestito internamente dalla fetch.
     * @returns Promise<boolean> (false = niente da caricare)
     */
    const infiniteScroll = React.useCallback(() => {
        if (!userContext?.token) return Promise.resolve(false);
        if (loading || (total && rows.length >= total)) return Promise.resolve(false);

        return getDiffEconomicaData({
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
        <>
            <TableVirtualized
                key="reportDiffEconomica"
                data={rows}
                setData={setRowsWithOptions}
                columns={columns}
                setColumns={() => { }}
                results={total}
                loadStatus={loading}
                whereToFindData={false}
                footer
                infiniteScroll={{ func: infiniteScroll }}
                headerSettings={{
                    onSortChange: handleServerSortChange,
                    sortState: serverSort,
                }}
                className="h-full"
            />

            {optionsOverlays}
        </>
    );
};
