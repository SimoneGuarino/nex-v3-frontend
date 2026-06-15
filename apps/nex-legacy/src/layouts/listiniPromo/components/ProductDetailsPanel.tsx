// src/layouts/listiniPromo/components/ProductDetailsPanel.tsx
import React, { MutableRefObject } from "react";
import { motion } from "framer-motion";
import { FDBox } from "@nex/fd-ui";
import FDButton from "components/UI/buttons/FDButton";
import { IoSearch } from "react-icons/io5";
import { MdFilterList, MdDownload } from "react-icons/md";
import { BsViewStacked } from "react-icons/bs";
import type { PromoDetailsResponse } from "../fetchdatas/promos/detailsData";

const BsViewStackedIcon = BsViewStacked as React.FC<{ size?: number; className?: string }>;
const IoSearchIcon = IoSearch as React.FC<{ size?: number; className?: string }>;
const MdFilterListIcon = MdFilterList as React.FC<{ size?: number; className?: string }>;
const MdDownloadIcon = MdDownload as React.FC<{ size?: number; className?: string }>;

// stesso easing usato altrove
const easeOutCurve = [0.25, 0.1, 0.25, 1] as const;


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
type Props = {
    details: PromoDetailsResponse; //dettagli promo (header + meta + conteggi)
    activeFiltersLabels: string[]; //label/chip dei filtri attivi (per tooltip + counter)
    filterBtnRef: MutableRefObject<HTMLDivElement | null>; //anchor ref menu filtri
    sortBtnRef: MutableRefObject<HTMLDivElement | null>; //anchor ref menu vista (grid/list)
    onOpenFilters: () => void; //apre il menu filtri
    onOpenSort: () => void; //apre il menu cambio vista
    onOpenAdvancedSearch: () => void; //apre la ricerca mirata prodotto
    onExportCsv: () => void; //trigger export CSV
    exportLoading?: boolean; //loading export CSV
};


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * ProductDetailsPanel:
 * pannello “header” della promo selezionata con:
 * - info promo (codice/descrizione/date/classificazione/visibilità/num prodotti)
 * - azioni: export CSV, cambio vista, filtri, ricerca mirata
 * @returns
 */
const ProductDetailsPanel: React.FC<Props> = ({
    details,
    activeFiltersLabels,
    filterBtnRef,
    sortBtnRef,
    onOpenFilters,
    onOpenSort,
    onOpenAdvancedSearch,
    onExportCsv,
    exportLoading = false,
}) => {
    const filtersTooltip =
        activeFiltersLabels.length > 0
            ? `${activeFiltersLabels.length} filtr${activeFiltersLabels.length > 1 ? "i" : "o"
            } attiv${activeFiltersLabels.length > 1 ? "i" : "o"
            } - ${activeFiltersLabels.join(", ")}`
            : undefined; //tooltip dinamico filtri (con dettaglio)

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
                duration: 0.25,
                ease: easeOutCurve,
            }}
            className="mt-2"
        >
            <FDBox pad="md" radius="lg">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    {/* info promo a sinistra */}
                    <div className="flex flex-col gap-1" data-tour="listiniPromo-details">
                        <div className="text-base flex gap-1 items-center font-semibold">
                            <span
                                data-tooltip-id="ListiniPromo-tooltip"
                                data-tooltip-content="Cosice Promo"
                            >
                                {details.promoCode}
                            </span>
                            <span>-</span>
                            <span
                                data-tooltip-id="ListiniPromo-tooltip"
                                data-tooltip-content="Descrizione Promo"
                            >
                                {details.description}
                            </span>
                        </div>

                        <div className="text-sm flex flex-wrap gap-3">
                            {details.startDate && details.endDate && (
                                <span>
                                    Dal {details.startDate} al {details.endDate}
                                </span>
                            )}
                            {details.classification && (
                                <span>Classificazione: {details.classification}</span>
                            )}
                            {details.visibility && (
                                <span>Visibilità: {details.visibility}</span>
                            )}
                            <span>Prodotti: {details.productsCount}</span>
                        </div>
                    </div>

                    {/* azioni a destra: export + vista + filtri + ricerca */}
                    <div className="flex items-center justify-end gap-2">
                        <FDButton
                            data-tour="listiniPromo-download"
                            variant="outline"
                            color="neutral"
                            size="small"
                            onClick={onExportCsv}
                            disabled={exportLoading}
                        >
                            <MdDownloadIcon className="mr-1.5" />
                            {exportLoading ? "Download..." : "Download CSV"}
                        </FDButton>

                        <div ref={sortBtnRef} className="flex items-center">
                            <FDButton
                                data-tour="listiniPromo-vista"
                                variant="outline"
                                color="neutral"
                                size="small"
                                onClick={onOpenSort}
                            >
                                <BsViewStackedIcon className="mr-1.5" /> Vista
                            </FDButton>
                        </div>

                        <div ref={filterBtnRef} className="flex items-center">
                            <FDButton
                                data-tour="listiniPromo-filters"
                                variant="outline"
                                color="neutral"
                                size="small"
                                onClick={onOpenFilters}
                                dataTooltipId="ListiniPromo-tooltip"
                                dataTooltipContent={filtersTooltip}
                            >
                                <MdFilterListIcon className="mx-auto sm:mr-1.5" />
                                <span className="hidden sm:flex">Filtri</span>
                                {activeFiltersLabels.length > 0 && (
                                    <span className="text-xs text-sky-500 ml-1 font-bold">
                                        ({activeFiltersLabels.length})
                                    </span>
                                )}
                            </FDButton>
                        </div>

                        <FDButton
                            data-tour="listiniPromo-topbar-search"
                            variant="outline"
                            color="neutral"
                            size="small"
                            onClick={onOpenAdvancedSearch}
                            disabled={exportLoading}
                        >
                            <IoSearchIcon className="mr-1.5" />
                            Ricerca mirata
                        </FDButton>
                    </div>
                </div>
            </FDBox>
        </motion.div>
    );
};

export default ProductDetailsPanel;
