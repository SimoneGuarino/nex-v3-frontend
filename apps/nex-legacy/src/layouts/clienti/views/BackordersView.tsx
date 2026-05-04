import React from "react";
import { TableVirtualized } from "components/Virtualized/table";
import { getData as getBackordersData } from "../fetchData/backorders/getData";
import type { ViewComponentProps, SearchParams } from "../types/view";
import { useCustomerOptionsMenu } from "../components/useCustomerOptionsMenu";
import { useTour } from "tour/TourProvider";

type HeaderSortPayload = {
    columnKey: string;
    sortDirection: number;
};

type BackordersSortField =
    | "codiceAgente"
    | "codiceCliente"
    | "ragioneSociale"
    | "ragioneSociale2"
    | "partitaIva"
    | "totale"
    | "residuo"
    | "consegna";

type BackordersSortDirection = "asc" | "desc";

const BACKORDERS_SORT_FIELD_BY_COLUMN_KEY: Record<string, BackordersSortField> = {
    CODICE_AGENTE: "codiceAgente",
    CODICE_CLIENTE: "codiceCliente",
    RAGIONE_SOCIALE: "ragioneSociale",
    RAGIONE_SOCIALE_2: "ragioneSociale2",
    PARTITA_IVA: "partitaIva",
    RESIDUO: "residuo",
    CONSEGNA: "consegna",
    TOTALE: "totale",
};

function normalizeBackordersSort(sort: HeaderSortPayload): {
    backordersSortField?: BackordersSortField;
    backordersSortDirection?: BackordersSortDirection;
} {
    const field = BACKORDERS_SORT_FIELD_BY_COLUMN_KEY[String(sort.columnKey || "").trim()];
    if (!field) return {};

    if (sort.sortDirection === 1) {
        return { backordersSortField: field, backordersSortDirection: "asc" };
    }

    if (sort.sortDirection === 2) {
        return { backordersSortField: field, backordersSortDirection: "desc" };
    }

    return {};
}


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
    loadStatus,
    ChangeLoadStatus,
}) => {
    const [rows, setRows] = React.useState<any[]>([]);
    const [total, setTotal] = React.useState<number>(0);
    const [loading, setLoading] = React.useState(false);
    const [serverSort, setServerSort] = React.useState<HeaderSortPayload>({
        columnKey: "",
        sortDirection: 0,
    });

    const offsetRef = React.useRef(0);
    const abortController = React.useRef<AbortController | null>(null);

    const { isOpen, index: tourIndex } = useTour();
    const lockInteractions = isOpen && tourIndex === 4;

    React.useEffect(() => {
        return () => {
            abortController.current?.abort();
            abortController.current = null;
        };
    }, []);

    const { renderOptionsTrigger, optionsOverlays } = useCustomerOptionsMenu({
        currentView: "backorders",
        userContext,
        companySelected: params.common.companySelected,
        agentCode: params.common.agentCode || null,
        onNavigateToCustomerView,
    });

    const setRowsWithOptions = React.useCallback(
        (updater: React.SetStateAction<any[]>) => {
            setRows((prev) => {
                const next = typeof updater === "function" ? (updater as any)(prev) : updater;
                if (!Array.isArray(next)) return next;

                return next.map((row, index) => {
                    const codice = String(row?.CODICE_CLIENTE ?? "").trim() || "";
                    const denominazione =
                        String(row?.RAGIONE_SOCIALE ?? row?.RAGIONE_SOCIALE_2 ?? "").trim() || "";

                    return {
                        ...row,
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
                sort: true,
                sortType: "number",
                type: "string",
                width: 200,
                sx: { alignItems: "center" },
            },
            {
                key: "CONSEGNA",
                label: "In Consegna",
                sort: true,
                sortType: "number",
                type: "string",
                width: 200,
                sx: { alignItems: "center" },
            },
            {
                key: "TOTALE",
                label: "Totale",
                type: "eur",
                sort: true,
                sortType: "number",
                width: 260,
                sx: { alignItems: "center" },
            },
        ],
        []
    );

    const makeBody = React.useCallback(
        (p: SearchParams<any>) => {
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

            if (c.customerSelected?.codice) body.ccli = c.customerSelected.codice;

            if (c.clientFilterCodes?.length) {
                body.cst = 1;
                body.ccli = c.clientFilterCodes.map((customer) => ({
                    codice: customer.codiceCliente,
                }));
            }

            const normalizedSort = normalizeBackordersSort(serverSort);
            if (normalizedSort.backordersSortField && normalizedSort.backordersSortDirection) {
                body.backordersSortField = normalizedSort.backordersSortField;
                body.backordersSortDirection = normalizedSort.backordersSortDirection;
            }

            return body;
        },
        [serverSort]
    );

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

    const fetchFirstPage = React.useCallback(async () => {
        if (!userContext?.token) return;

        setLoading(true);
        offsetRef.current = 0;
        setRows([]);
        setTotal(0);

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
    }, [userContext, params, makeBody, setRowsWithOptions, ChangeLoadStatus]);

    React.useEffect(() => {
        fetchFirstPage().catch(() => { });
    }, [fetchFirstPage]);

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
        userContext,
        params,
        makeBody,
        rows.length,
        total,
        loading,
        setRowsWithOptions,
        ChangeLoadStatus,
    ]);

    return (
        <>
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
                    loadStatus: loadStatus.infiniteScroll,
                }}
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
