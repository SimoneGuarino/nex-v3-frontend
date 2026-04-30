import React, { useRef, useState } from "react";
import FDBox from "components/UI/box/FDBox";
import FDButton from "components/UI/buttons/FDButton";
import FDIconButton from "components/UI/buttons/FDIconButton";
import { FDSelect, type FDSelectOption } from "components/UI/input/FDSelect";
import { ContextMenu } from "components/UI/menu/ContextMenu";
import CalendarMenu from "./CalendarMenu";
import FiltersMenu from "./FiltersMenu";
import { IoCalendarNumberOutline, IoReloadOutline, IoSearch } from "react-icons/io5";
import { MdDownload, MdFilterList } from "react-icons/md";
import type { CompareMode, Dimension } from "../fetchdata/admin/series";
import type { BrandFiltersOut } from "./BrandsPanel";
import { useTour } from "tour/TourProvider";
import { LoadStatus } from "../types/load";
import { CustomerOption } from "types/customers";

const FilterIcon = MdFilterList as React.FC<{ size?: number; className?: string }>;
const DownloadIcon = MdDownload as React.FC<{ size?: number; className?: string }>;
const CalendarIcon = IoCalendarNumberOutline as React.FC<{ size?: number; className?: string }>;
const SearchIcon = IoSearch as React.FC<{ size?: number; className?: string }>;

// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
type TopBarProps = {
    dimension: Dimension;
    onChangeDimension: (next: Dimension) => void;

    canImpersonate: boolean;

    loading: boolean;
    loadStatus: LoadStatus;
    canLoad: boolean;
    onSearch: () => void;

    canExport: boolean;
    onExport: () => void;

    from: string;
    to: string;
    compareMode: CompareMode;
    compareFrom: string;
    compareTo: string;
    setRange: (v: { from?: string; to?: string }) => void;
    setCompareMode: (m: CompareMode) => void;
    setCompareRange: (v: { from?: string; to?: string }) => void;
    compareOptions: FDSelectOption[];
    onResetDates: () => void;

    sysInfo: string;
    setSysInfo: (s: string) => void;
    capo: string[];
    setCapo: (v: string[]) => void;

    cli: CustomerOption[];
    setCli: (v: CustomerOption[]) => void;

    mag: string[];
    setMag: (v: string[]) => void;
    cnv: string[];
    setCnv: (v: string[]) => void;
    arg: string[];
    setArg: (v: string[]) => void;
    cca: string[];
    setCca: (v: string[]) => void;
    age?: string[];
    setAge: (v: string[]) => void;
    buy: string[];
    setBuy: (v: string[]) => void;

    brandFilters: BrandFiltersOut;
    setBrandFilters: (v: BrandFiltersOut) => void;

    sysInfoOptions: FDSelectOption[];

    onResetFilters: () => void;
    onResetAllAndReload: () => void;

    hiddenDimensions?: Dimension[];

    filtersCount: number;
    filtersTooltip: string;
    calendarMenuOpen: boolean;
    setCalendarMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
    filtersOpen: boolean;
    setFiltersOpen: React.Dispatch<React.SetStateAction<boolean>>;

};

// ——————————————————————————————————————————————————————————
// UTILS
// ——————————————————————————————————————————————————————————
const TABS: ReadonlyArray<{ key: Dimension; label: string }> = [
    { key: "AGENT", label: "Agenti" },
    { key: "CLIENT", label: "Clienti" },
    { key: "CAPO", label: "Cash & Carry" },
    { key: "CNV", label: "Canali" },
    { key: "BUY", label: "Buyers" },
    { key: "PRF", label: "Brand" },
    { key: "LIP", label: "Linea" },
    { key: "GRU", label: "Gruppo" },
    { key: "FAM", label: "Famiglia" },
    { key: "ARG", label: "Area geografica" },
];

// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
/**
 * Barra superiore: gestione tab/dimensione, calendario, filtri, export e ricerca
 * @param props
 * @returns
 */
const TopBar: React.FC<TopBarProps> = ({
    dimension,
    onChangeDimension,
    canImpersonate,
    loading, loadStatus,
    canLoad,
    onSearch,
    canExport,
    onExport,
    from,
    to,
    compareMode,
    compareFrom,
    compareTo,
    setRange,
    setCompareMode,
    setCompareRange,
    compareOptions,
    onResetDates,
    sysInfo, setSysInfo,
    capo, setCapo,

    cli, setCli,

    mag, setMag,
    cnv, setCnv,
    arg, setArg,
    cca, setCca,
    age, setAge,
    buy, setBuy,
    sysInfoOptions,
    onResetFilters,
    onResetAllAndReload,
    hiddenDimensions = [],
    brandFilters,
    setBrandFilters,
    filtersCount,
    filtersTooltip,
    calendarMenuOpen,
    setCalendarMenuOpen,
    filtersOpen,
    setFiltersOpen,
}) => {
    //const [calendarMenuOpen, setCalendarMenuOpen] = useState(false); // stato apertura menu calendario
    //const [filtersOpen, setFiltersOpen] = useState(false); // stato apertura menu filtri

    const [customerOptions, setCustomerOptions] = React.useState<CustomerOption[]>([]); //opzioni clienti (popolate dalle view)

    // Un solo ref per azione (mai duplicato su elementi hidden)
    const calendarBtnRef = useRef<HTMLDivElement | null>(null); // ref per ancorare il context menu calendario
    const filterBtnRef = useRef<HTMLDivElement | null>(null); // ref per ancorare il context menu filtri

    const visibleTabs = TABS.filter((t) => !hiddenDimensions.includes(t.key));

    const mobileTabOptions: FDSelectOption<Dimension>[] = visibleTabs.map((t) => ({
        value: t.key,
        label: t.label,
    }));

    const handleSelectTab = (next: Dimension) => {
        if (next === dimension) return;
        onChangeDimension(next);
    };


    /* TOUR SYSTEM */
    //const per blocco interazioni durante gli step del tour
    const { isOpen, index: tourIndex } = useTour();
    const lockInteractions = isOpen && (tourIndex === 1);

    //funzione per ignorare la chiusura dei menu contestuali durante il tour    
    type CloseReason = "clickAway" | "escapeKeyDown" | "backdropClick" | "itemClick";
    const shouldIgnoreClose = (reason?: CloseReason) => {
        if (!isOpen) return false;
        // se chiudo da codice (no reason) → NON bloccare
        if (!reason) return false;
        // durante il tour: ignora solo click fuori ed ESC
        return (
            reason === "backdropClick" ||
            reason === "clickAway" ||
            reason === "escapeKeyDown" ||
            reason === "itemClick"
        );
    };

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

            <FDBox
                pad="md"
                radius="xl"
                className="sm:block md:flex gap-3 w-full items-center justify-between"
                data-tour="fatturati-topbar"
            >
                <FDSelect
                    dataTour="fatturati-topbar-dimension"
                    options={mobileTabOptions}
                    value={dimension}
                    onChange={(v) => handleSelectTab(v as Dimension)}
                    className="min-w-[200px]"
                    size="sm"
                    radius="md"
                    clearable={false}
                />

                {/* ACTIONS: un solo container, i pulsanti switchano internamente (sm:hidden / hidden sm:inline-flex) */}
                <div className="flex gap-2 items-center justify-end mt-2 md:mt-0">
                    {/* RESET (stesso su mobile/desktop) */}
                    <FDIconButton
                        dataTour="fatturati-topbar-reset-filters"
                        icon={IoReloadOutline({ size: 18 })}
                        dataTooltipId="fatturati-tooltip"
                        dataTooltipContent="Reset di tutti i filtri"
                        disabled={loading || !canLoad}
                        onClick={onResetAllAndReload}
                    />

                    {/* INTERVALLO (mobile icon / desktop button) */}
                    <div
                        ref={calendarBtnRef}
                        className="flex items-center"
                        data-tour="fatturati-topbar-intervallo"
                    >
                        <div className="sm:hidden">
                            <FDIconButton
                                icon={IoCalendarNumberOutline({ size: 18 })}
                                dataTooltipId="fatturati-tooltip"
                                dataTooltipContent="Intervallo"
                                onClick={() => setCalendarMenuOpen(true)}
                            />
                        </div>

                        <div className="hidden sm:inline-flex">
                            <FDButton
                                variant="outline"
                                color="neutral"
                                size="small"
                                onClick={() => setCalendarMenuOpen(true)}
                            >
                                <CalendarIcon className="mr-1.5" />
                                Intervallo
                            </FDButton>
                        </div>
                    </div>

                    {/* FILTRI (mobile icon / desktop button) */}
                    <div ref={filterBtnRef} className="flex items-center" data-tour="fatturati-topbar-filtri">
                        <div className="sm:hidden">
                            <FDIconButton
                                icon={MdFilterList({ size: 18 })}
                                dataTooltipId="fatturati-tooltip"
                                dataTooltipContent="Filtri"
                                onClick={() => setFiltersOpen(true)}
                            />
                        </div>

                        <div className="hidden sm:inline-flex">
                            <FDButton
                                variant="outline"
                                color="neutral"
                                size="small"
                                onClick={() => setFiltersOpen(true)}
                                dataTooltipId="fatturati-tooltip"
                                dataTooltipContent={filtersTooltip}
                            >
                                <FilterIcon className="mr-1.5" />
                                Filtri
                                {filtersCount > 0 && (
                                    <span className="text-xs text-sky-500 ml-1 font-bold">
                                        ({filtersCount})
                                    </span>
                                )}
                            </FDButton>
                        </div>
                    </div>

                    {/* EXPORT (mobile icon / desktop button) */}
                    <div className="flex items-center">
                        <div className="sm:hidden">
                            <FDIconButton
                                icon={MdDownload({ size: 18 })}
                                dataTooltipId={canExport ? "fatturati-tooltip" : undefined}
                                dataTooltipContent={canExport ? "Download CSV" : undefined}
                                disabled={!canExport}
                                onClick={canExport ? onExport : undefined}
                            />
                        </div>

                        <div className="hidden sm:inline-flex" data-tour="fatturati-topbar-scaricaCSV">
                            <FDButton
                                variant="outline"
                                color="neutral"
                                size="small"
                                onClick={canExport ? onExport : undefined}
                                disabled={!canExport}
                                dataTooltipId="fatturati-tooltip"
                                dataTooltipContent="Prima cercare e poi scaricare"
                                icon={<DownloadIcon className="mr-1.5" />}
                                loading={loadStatus.export_data}
                            >
                                Scarica CSV
                            </FDButton>
                        </div>
                    </div>

                    {/* SEARCH (mobile icon / desktop button) */}
                    <div className="flex items-center">
                        <div className="sm:hidden">
                            <FDIconButton
                                icon={<SearchIcon size={18} />}
                                disabled={loading || !canLoad || loadStatus.export_data}
                                onClick={onSearch}
                                dataTooltipId={!loading && canLoad ? "fatturati-tooltip" : undefined}
                                dataTooltipContent="Cerca"
                                loading={loading}
                            />
                        </div>

                        <div className="hidden sm:inline-flex" data-tour="fatturati-topbar-cerca">
                            <FDButton
                                variant="solid"
                                color="primary"
                                size="small"
                                onClick={onSearch}
                                disabled={!canLoad || loadStatus.export_data}
                                loading={loading}
                                icon={<SearchIcon />}
                            >
                                Cerca
                            </FDButton>
                        </div>
                    </div>
                </div>
            </FDBox>

            <ContextMenu
                openFor={calendarMenuOpen}
                pos={calendarBtnRef}
                //onClose={() => setCalendarMenuOpen(false)}
                onClose={(_e?: any, reason?: CloseReason) => {
                    if (shouldIgnoreClose(reason)) return;
                    setCalendarMenuOpen(false);
                }}
                placement="auto"
                panel={
                    <CalendarMenu
                        from={from}
                        to={to}
                        setRange={setRange}
                        compareMode={compareMode}
                        setCompareMode={setCompareMode}
                        compareFrom={compareFrom}
                        compareTo={compareTo}
                        setCompareRange={setCompareRange}
                        compareOptions={compareOptions}
                        onResetAll={onResetDates}
                    />
                }
            />

            <ContextMenu
                openFor={filtersOpen}
                pos={filterBtnRef}
                //onClose={() => setFiltersOpen(false)}
                onClose={(_e?: any, reason?: CloseReason) => {
                    if (shouldIgnoreClose(reason)) return;
                    setFiltersOpen(false);
                }}
                placement="auto"
                panel={
                    <FiltersMenu
                        sysInfo={sysInfo} setSysInfo={setSysInfo}
                        capo={capo} setCapo={setCapo}

                        cli={cli} setCli={setCli}
                        customerOptions={customerOptions} setCustomerOptions={setCustomerOptions}

                        mag={mag} setMag={setMag}
                        cnv={cnv} setCnv={setCnv}
                        arg={arg} setArg={setArg}
                        cca={cca} setCca={setCca}
                        age={age} setAge={setAge}
                        buy={buy} setBuy={setBuy}
                        sysInfoOptions={sysInfoOptions}
                        onReset={onResetFilters}
                        canImpersonate={canImpersonate}
                        brandFilters={brandFilters}
                        setBrandFilters={setBrandFilters}
                    />
                }
            />
        </>
    );
};

export default TopBar;
