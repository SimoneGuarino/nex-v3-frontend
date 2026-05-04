import React, { useMemo, useRef, useState } from "react";
import FDBox from "components/UI/box/FDBox";
import FDButton from "components/UI/buttons/FDButton";
import { MdDownload, MdFilterList } from "react-icons/md";
import FiltersMenu from "./FiltersMenu";

const FilterIcon = MdFilterList as React.FC<{ size?: number; className?: string }>;
const DownloadIcon = MdDownload as React.FC<{ size?: number; className?: string }>;

type TopBarProps = {
    canSelectAgent: boolean;
    env: string;
    onChangeEnv: (value: string) => void;
    agentCodes: string[];
    onChangeAgentCodes: (value: string[]) => void;
    agentOptions: Array<{ label: string; value: string }>;
    onChangeAgentSearch: (value: string) => void;
    customerCode: string;
    onChangeCustomerCode: (value: string) => void;
    customerOptions: Array<{ label: string; value: string }>;
    onChangeCustomerSearch: (value: string) => void;
    year: string;
    onChangeYear: (value: string) => void;
    warehouse: string;
    onChangeWarehouse: (value: string) => void;
    quoteNumber: string;
    onChangeQuoteNumber: (value: string) => void;
    onSearchQuotes: () => void;
    onResetQuotesFilters: () => void;
    onExportCsv: () => void;
    loadingExport: boolean;
};

/**
 * TopBar:
 * - Select ambiente
 * - Pulsante Filtri con menu contenente i filtri BE
 * - Pulsante Scarica CSV
 * - Pulsante Applica filtri che applica i filtri compilati
 */
export default function TopBar(props: TopBarProps) {
    const {
        canSelectAgent,
        env,
        onChangeEnv,
        agentCodes,
        onChangeAgentCodes,
        agentOptions,
        onChangeAgentSearch,
        customerCode,
        onChangeCustomerCode,
        customerOptions,
        onChangeCustomerSearch,
        year,
        onChangeYear,
        warehouse,
        onChangeWarehouse,
        quoteNumber,
        onChangeQuoteNumber,
        onSearchQuotes,
        onResetQuotesFilters,
        onExportCsv,
        loadingExport,
    } = props;

    const [filtersOpen, setFiltersOpen] = useState(false);
    const filterBtnRef = useRef<HTMLDivElement | null>(null);

    const filtersCount = useMemo(() => {
        let count = 0;
        /**
         * se l'utente non puo scegliere l'agente, la select è nascosta
         * e non deve contribuire al badge dei filtri attivi.
         */
        if (canSelectAgent && agentCodes.length > 0) count += 1;
        if (customerCode.trim()) count += 1;
        if (year.trim()) count += 1;
        if (warehouse.trim()) count += 1;
        if (quoteNumber.trim()) count += 1;
        return count;
    }, [canSelectAgent, agentCodes, customerCode, year, warehouse, quoteNumber]);

    return (
        <FDBox variant="gradient-simple" border={true} radius="md" pad="sm" className="w-full flex flex-col gap-3">
            <div className="flex justify-end items-center gap-2">
                <div ref={filterBtnRef}>
                    <FDButton
                        variant="outline"
                        color="neutral"
                        size="small"
                        radius="md"
                        onClick={() => setFiltersOpen(true)}
                        icon={<FilterIcon className="mr-1.5" />}
                    >
                        Filtri
                        {filtersCount > 0 ? (
                            <span className="ml-1 text-xs text-sky-500">({filtersCount})</span>
                        ) : null}
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

            <FiltersMenu
                open={filtersOpen}
                anchorRef={filterBtnRef}
                onClose={() => setFiltersOpen(false)}
                canSelectAgent={canSelectAgent}
                env={env}
                onChangeEnv={onChangeEnv}
                agentCodes={agentCodes}
                onChangeAgentCodes={onChangeAgentCodes}
                agentOptions={agentOptions}
                onChangeAgentSearch={onChangeAgentSearch}
                customerCode={customerCode}
                onChangeCustomerCode={onChangeCustomerCode}
                customerOptions={customerOptions}
                onChangeCustomerSearch={onChangeCustomerSearch}
                year={year}
                onChangeYear={onChangeYear}
                warehouse={warehouse}
                onChangeWarehouse={onChangeWarehouse}
                quoteNumber={quoteNumber}
                onChangeQuoteNumber={onChangeQuoteNumber}
                onSearchQuotes={onSearchQuotes}
                onResetQuotesFilters={onResetQuotesFilters}
            />
        </FDBox>
    );
}
