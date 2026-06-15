import React from "react";
import { TableVirtualized } from "components/Virtualized/table";
import { LuFileText } from "react-icons/lu";
import type {
    PurchaseRow,
    PurchasesHeaderSortPayload,
    PurchasesSortDirection,
    PurchasesSortField,
} from "../types";
import { FDIconButton } from "components/UI/buttons/FDIconButton";

const PdfIcon = LuFileText as React.FC<{ size?: number; className?: string }>;

type PurchasesTableProps = {
    items: PurchaseRow[];
    setItems: React.Dispatch<React.SetStateAction<PurchaseRow[]>>;
    total: number;
    loading: boolean;
    loadingMore: boolean;
    onLoadMore: () => Promise<boolean>;
    sortState: PurchasesHeaderSortPayload;
    onSortChange: (payload: PurchasesHeaderSortPayload) => void;
    onOpenInvoice: (row: PurchaseRow) => void;
    onOpenDeliveryNote: (row: PurchaseRow) => void;
};

/**
 * Traduce lo stato sort backend nel formato richiesto dalla tabella virtualizzata.
 */
function formatSort(field: PurchasesSortField, direction: PurchasesSortDirection): PurchasesHeaderSortPayload {
    const columnKey = field === "dataDocumento" ? "documentDate" : field;
    return { columnKey, sortDirection: direction === "asc" ? 1 : -1 };
}

/**
 * Ordinamento iniziale mostrato in tabella (data documento decrescente).
 */
export const DEFAULT_PURCHASES_SORT = formatSort("dataDocumento", "desc");

/**
 * Tabella virtualizzata della vista acquisti.
 *
 * In questo componente resta solo il rendering e la configurazione colonne;
 * fetch, paginazione e stato query sono orchestrati dal layout/hook superiori.
 */
export default function PurchasesTable(props: PurchasesTableProps) {
    const {
        items,
        setItems,
        total,
        loading,
        loadingMore,
        onLoadMore,
        sortState,
        onSortChange,
        onOpenInvoice,
        onOpenDeliveryNote,
    } = props;

    /**
     * Definizione colonne con azioni PDF in testa.
     * `useMemo` evita di ricreare la struttura a ogni render quando i callback non cambiano.
     */
    const columns = React.useMemo(
        () => [
            {
                key: "invoiceAction",
                label: "Fattura",
                type: "custom",
                width: 90,
                render: ({ row }: { row: PurchaseRow }) =>
                    row?.invoice?.available ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <FDIconButton
                                icon={<PdfIcon />}
                                size="small"
                                onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    onOpenInvoice(row);
                                }}
                                data-tooltip-id="purchases-tooltip"
                                data-tooltip-content="Apri PDF fattura"
                            />
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500">-</div>
                    ),
            },
            {
                key: "deliveryAction",
                label: "Bolla",
                type: "custom",
                width: 80,
                render: ({ row }: { row: PurchaseRow }) =>
                    row?.deliveryNote?.available ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <FDIconButton
                                icon={<PdfIcon />}
                                size="small"
                                onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    onOpenDeliveryNote(row);
                                }}
                                data-tooltip-id="purchases-tooltip"
                                data-tooltip-content="Apri PDF bolla"
                            />
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500">-</div>
                    ),
            },
            { key: "environment", label: "Ambiente", sort: true, sortType: "string", width: 110, sx: { alignItems: "center" } },
            { key: "warehouse", label: "Magazzino", sort: true, sortType: "string", width: 120, sx: { alignItems: "center" } },
            { key: "documentNumber", label: "Documento", sort: true, sortType: "string", width: 130, sx: { alignItems: "center" } },
            { key: "documentDate", label: "Data doc.", sort: true, sortType: "number", type: "date", dateType: "YYYYMMDD", width: 140, sx: { alignItems: "center" } },
            { key: "customerCode", label: "Cod. cliente", sort: false, sortType: "string", width: 130, sx: { alignItems: "center" } },
            { key: "customerName", label: "Rag. sociale", sort: true, sortType: "string", width: 220, onHover: true },
            { key: "agentCode", label: "Agente", sort: false, sortType: "string", width: 120, sx: { alignItems: "center" } },
            { key: "articleCode", label: "Cod. articolo", sort: true, sortType: "string", width: 140, sx: { alignItems: "center" } },
            { key: "description", label: "Descrizione", sort: true, sortType: "string", width: 250, onHover: true },
            { key: "quantity", label: "Quantita", sort: true, sortType: "number", width: 110, sx: { alignItems: "center" } },
            { key: "unitPrice", label: "Prezzo", sort: true, sortType: "number", type: "eur", width: 110, sx: { alignItems: "center" } },
            { key: "rowValue", label: "Valore", sort: true, sortType: "number", type: "eur", width: 120, sx: { alignItems: "center" } },
            { key: "brand", label: "Brand", sort: true, sortType: "string", width: 130, sx: { alignItems: "center" } },
        ],
        [onOpenDeliveryNote, onOpenInvoice]
    );

    return (
        <div className="h-full min-h-[600px] rounded-xl w-full">
            <TableVirtualized
                key="purchases-list"
                data={items}
                textCenter
                setData={setItems}
                columns={columns}
                setColumns={() => { }}
                results={total}
                loadStatus={loading}
                whereToFindData={false}
                footer
                headerSettings={{
                    onSortChange,
                    sortState,
                }}
                infiniteScroll={{
                    func: onLoadMore,
                    loadStatus: loadingMore,
                }}
                className="h-full w-full"
            />
        </div>
    );
}
