import React from "react";
import { TableVirtualized } from "components/Virtualized/table";
import type { QuoteHeader } from "../types";
import FDIconButton from "components/FDIconButton";
import { FiEye } from "react-icons/fi";

const FiEyeIcon = FiEye as React.FC<{ size?: number; className?: string }>;

type HeaderSortPayload = {
    columnKey: string;
    sortDirection: number;
};

type QuotesTableProps = {
    items: QuoteHeader[];
    setItems: React.Dispatch<React.SetStateAction<QuoteHeader[]>>;
    total: number;
    onOpenDetails: (quote: QuoteHeader) => void;
    loading: boolean;
    loadingMore: boolean;
    onLoadMore: () => Promise<boolean>;
    sortState: HeaderSortPayload;
    onSortChange: (payload: HeaderSortPayload) => void;
};

/**
 * Lista preventivi principale.
 *
 * Qui lasciamo alla tabella solo rendering e interazioni base: ordinamento e
 * paginazione restano server-side e vengono orchestrati dal layout padre.
 */
export default function QuotesTable(props: QuotesTableProps) {
    const {
        items,
        setItems,
        total,
        onOpenDetails,
        loading,
        loadingMore,
        onLoadMore,
        sortState,
        onSortChange,
    } = props;

    const columns = React.useMemo(
        () => [
            {
                key: "ACTION",
                label: "Dettaglio",
                type: "custom",
                width: 100,
                render: ({ row }: { row: QuoteHeader }) => (
                    <div className="w-full h-full flex items-center justify-center">
                        <FDIconButton
                            size="small"
                            iconOnly
                            onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                if (!row) return;
                                onOpenDetails(row);
                            }}
                            data-tooltip-id="preventivi-tooltip"
                            data-tooltip-content="Apri dettaglio preventivo"
                        >
                            <FiEyeIcon />
                        </FDIconButton>
                    </div>
                ),
            },
            { key: "AMBIENTE", label: "Ambiente", sort: true, sortType: "string", width: 120, sx: { alignItems: "center" } },
            { key: "TNRPR", label: "N. preventivo", sort: true, sortType: "number", width: 150, sx: { alignItems: "center" } },
            { key: "TCDCL", label: "Cod. cliente", sort: true, sortType: "number", width: 130, sx: { alignItems: "center" } },
            { key: "WRAGS", label: "Rag. sociale", sort: true, sortType: "string", width: 200, onHover: true, },
            { key: "TDTPR", label: "Data preventivo", sort: true, sortType: "number", type: "date", dateType: "YYYYMMDD", width: 150, sx: { alignItems: "center" } },
            { key: "TANNO", label: "Anno", sort: true, sortType: "number", width: 100, sx: { alignItems: "center" } },
            { key: "TCDMA", label: "Magazzino", sort: true, sortType: "string", width: 120, sx: { alignItems: "center" } },
            { key: "TCDAG", label: "Cod. Agente", sort: false, sortType: "string", width: 150, sx: { alignItems: "center" } },
            { key: "TSTAT", label: "Stato", sort: true, sortType: "string", width: 150, sx: { alignItems: "center" } },
        ],
        [onOpenDetails]
    );

    return (
        <div className="h-full min-h-[420px] rounded-xl w-full">
            <TableVirtualized
                key="preventivi-list"
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
