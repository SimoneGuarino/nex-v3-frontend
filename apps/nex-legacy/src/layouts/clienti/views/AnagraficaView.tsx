import React from "react";
import { TableVirtualized } from "components/Virtualized/table";
import { getData as getAnagraficaData } from "../fetchData/anagrafica/getData";
import type { ViewComponentProps, SearchParams } from "../types/view";
import { useCustomerOptionsMenu } from "../components/useCustomerOptionsMenu";

type HeaderSortPayload = {
    columnKey: string;
    sortDirection: number;
};

type AnagraficaSortField = "ragioneSociale" | "partitaIva" | "codiceCliente";
type AnagraficaSortDirection = "asc" | "desc";

const SORT_FIELD_BY_COLUMN_KEY: Record<string, AnagraficaSortField> = {
    CODICE_CLIENTE: "codiceCliente",
    RAGIONE_SOCIALE: "ragioneSociale",
    PARTITA_IVA: "partitaIva",
};

function normalizeAnagraficaSort(sort: HeaderSortPayload): {
    sortField?: AnagraficaSortField;
    sortDirection?: AnagraficaSortDirection;
} {
    const field = SORT_FIELD_BY_COLUMN_KEY[String(sort.columnKey || "").trim()];
    if (!field) return {};

    if (sort.sortDirection === 1) {
        return { sortField: field, sortDirection: "asc" };
    }

    if (sort.sortDirection === 2) {
        return { sortField: field, sortDirection: "desc" };
    }

    return {};
}

export const AnagraficaView: React.FC<ViewComponentProps> = ({
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

    React.useEffect(() => {
        return () => {
            abortController.current?.abort();
            abortController.current = null;
        };
    }, []);

    const { renderOptionsTrigger, optionsOverlays } = useCustomerOptionsMenu({
        currentView: "anagrafica",
        userContext,
        companySelected: params.common.companySelected,
        agentCode: params.common.agentCode || null,
        onNavigateToCustomerView,
    });

    const columns = React.useMemo(
        () => [
            {
                key: "opzioni",
                label: "Opzioni",
                type: "custom",
                width: 180,
                render: ({ row, index }: { row: any; index: number }) => {
                    const codice = String(row?.CODICE_CLIENTE ?? "").trim() || "";
                    const denominazione = String(row?.RAGIONE_SOCIALE ?? "").trim() || "";

                    return renderOptionsTrigger({
                        codice,
                        denominazione,
                        rowKey: `${codice}:${index}`,
                    });
                },
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
        [renderOptionsTrigger]
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

            if (c.clientFilterCodes?.length) {
                body.cst = 1;
                body.ccli = c.clientFilterCodes.map((customer) => ({
                    codice: customer.codiceCliente,
                }));
            }

            const normalizedSort = normalizeAnagraficaSort(serverSort);
            if (normalizedSort.sortField && normalizedSort.sortDirection) {
                body.sortField = normalizedSort.sortField;
                body.sortDirection = normalizedSort.sortDirection;
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

        await getAnagraficaData({
            userContext,
            abortController,
            body: makeBody(params),
            offset: offsetRef,
            setData: setRows,
            setErr: () => {},
            ChangeLoadStatus,
            setTotal,
        });

        setLoading(false);
    }, [userContext?.token, params, makeBody, ChangeLoadStatus]);

    React.useEffect(() => {
        fetchFirstPage().catch(() => { });
    }, [fetchFirstPage]);

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
            setErr: () => {},
            ChangeLoadStatus,
            setTotal,
        }) as unknown as Promise<any>;
    }, [userContext?.token, params, makeBody, rows.length, total, loading]);

    return (
        <>
            <TableVirtualized
                key="anagrafica"
                data={rows}
                setData={setRows}
                columns={columns}
                setColumns={() => {}}
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
