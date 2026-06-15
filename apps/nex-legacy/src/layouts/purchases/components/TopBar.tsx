import React, { useMemo, useRef, useState } from "react";
import { FDBox } from "@nex/fd-ui";
import FDButton from "components/UI/buttons/FDButton";
import { MdDownload, MdFilterList } from "react-icons/md";
import type { PurchasesFiltersResponse, PurchasesQuery, PurchasesSummaryResponse } from "../types";
import FiltersMenu from "./FiltersMenu";
import { NumberToEuro } from "utils";
import { FormatNumber } from "utils/number/format";

const FilterIcon = MdFilterList as React.FC<{ size?: number; className?: string }>;
const DownloadIcon = MdDownload as React.FC<{ size?: number; className?: string }>;

type TopBarProps = {
    draftQuery: PurchasesQuery;
    onPatchDraftQuery: (patch: Partial<PurchasesQuery>) => void;
    filterOptions: PurchasesFiltersResponse;
    canSelectAgent: boolean;
    customerSearchLoading: boolean;
    onCustomerSearchChange: (text: string) => void;
    onSearch: () => void;
    onReset: () => void;
    onExportCsv: () => void;
    loadingExport: boolean;
    onOpenFilters: () => void;
    summary: PurchasesSummaryResponse;
    loadingSummary: boolean;
};

/**
 * Barra superiore della pagina acquisti.
 *
 * Contiene:
 * - apertura menu filtri e azioni ricerca/reset;
 * - export CSV;
 * - KPI sintetici coerenti con i filtri applicati.
 */
export default function TopBar(props: TopBarProps) {
    const {
        draftQuery,
        onPatchDraftQuery,
        filterOptions,
        canSelectAgent,
        customerSearchLoading,
        onCustomerSearchChange,
        onSearch,
        onReset,
        onExportCsv,
        loadingExport,
        onOpenFilters,
        summary,
        loadingSummary,
    } = props;

    const [filtersOpen, setFiltersOpen] = useState(false);
    const filterBtnRef = useRef<HTMLDivElement | null>(null);

    /**
     * Conta quanti filtri sono valorizzati, per mostrare il badge sul pulsante "Filtri".
     */
    const filtersCount = useMemo(() => {
        let count = 0;
        if (draftQuery.env) count += 1;
        if (draftQuery.agentCodes.length > 0) count += 1;
        if (draftQuery.customerCodes.length > 0) count += 1;
        if (draftQuery.brandCodes.length > 0) count += 1;
        if (draftQuery.lineCodes.length > 0) count += 1;
        if (draftQuery.groupCodes.length > 0) count += 1;
        if (draftQuery.familyCodes.length > 0) count += 1;
        if (draftQuery.dateFrom.trim()) count += 1;
        if (draftQuery.dateTo.trim()) count += 1;
        return count;
    }, [draftQuery]);

    return (
        <>
            <FDBox variant="gradient-simple" border={true} radius="md" pad="sm" className="w-full flex flex-col gap-3">
                <div className="flex justify-end items-center gap-2 flex-wrap">
                    <div ref={filterBtnRef}>
                        <FDButton
                            variant="outline"
                            color="neutral"
                            size="small"
                            radius="md"
                            onClick={() => {
                                // Ricarica i lookup al momento dell'apertura per avere opzioni sempre allineate alla bozza corrente.
                                onOpenFilters();
                                setFiltersOpen(true);
                            }}
                            icon={<FilterIcon className="mr-1.5" />}
                        >
                            Filtri
                            {filtersCount > 0 ? <span className="ml-1 text-xs text-sky-500">({filtersCount})</span> : null}
                        </FDButton>
                    </div>

                    <FDButton
                        variant="outline"
                        color="neutral"
                        size="small"
                        onClick={onExportCsv}
                        loading={loadingExport}
                        icon={<DownloadIcon className="mr-1.5" />}
                    >
                        Scarica CSV
                    </FDButton>
                </div>
            </FDBox>

            <FDBox variant="gradient-simple" border={true} pad="md" radius="xl" className="w-full flex flex-col gap-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="rounded-lg border border-neutral-200 dark:border-neutral-600 px-3 py-2">
                        <div className="text-xs text-neutral-500">Righe filtrate</div>
                        <div className="text-sm font-semibold">{loadingSummary ? "..." : FormatNumber(summary.totalRows)}</div>
                    </div>
                    <div className="rounded-lg border border-neutral-200 dark:border-neutral-600 px-3 py-2">
                        <div className="text-xs text-neutral-500">Quantità totale</div>
                        <div className="text-sm font-semibold">{loadingSummary ? "..." : FormatNumber(summary.totalQty)}</div>
                    </div>
                    <div className="rounded-lg border border-neutral-200 dark:border-neutral-600 px-3 py-2">
                        <div className="text-xs text-neutral-500">Valore totale</div>
                        <div className="text-sm font-semibold">{loadingSummary ? "..." : NumberToEuro({ convert: summary.totalValue })}</div>
                    </div>
                </div>
            </FDBox>

            <FiltersMenu
                open={filtersOpen}
                anchorRef={filterBtnRef}
                onClose={() => setFiltersOpen(false)}
                query={draftQuery}
                onPatchQuery={onPatchDraftQuery}
                filterOptions={filterOptions}
                canSelectAgent={canSelectAgent}
                customerSearchLoading={customerSearchLoading}
                onCustomerSearchChange={onCustomerSearchChange}
                onSearch={() => {
                    // Applica i filtri e chiude il menu per mantenere un flusso UX lineare.
                    onSearch();
                    setFiltersOpen(false);
                }}
                onReset={() => {
                    // Ripristina default e chiude il menu per dare feedback immediato.
                    onReset();
                    setFiltersOpen(false);
                }}
            />
        </>
    );
}
