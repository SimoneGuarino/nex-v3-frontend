import React from 'react';
//components
import FDButton from 'components/UI/buttons/FDButton';
import { FDBox } from '@nex/fd-ui';
import FDIconButton from 'components/UI/buttons/FDIconButton';
//icons
import { MdSearch, MdDownload, MdFilterList, MdSort, MdShare, MdClose, MdLink } from 'react-icons/md';
import { IoGridOutline } from "react-icons/io5";
import { CiStar } from "react-icons/ci";
import { HiOutlineClipboardDocument } from "react-icons/hi2";
import { HiOutlineViewGrid } from "react-icons/hi";
import { LuView } from "react-icons/lu";
import { BsViewStacked } from "react-icons/bs";
import { MdEmail } from 'react-icons/md';

//types
import type { DocumentItemMapped, GroupBy, ScopeTab, SortBy } from '../types';
import { FilterChip } from 'components/UI/search/FDSearchPanel';

const MdSearchIcon = MdSearch as React.FC<{ size?: number; className?: string }>;
const MdFilterListIcon = MdFilterList as React.FC<{ size?: number; className?: string }>;
const MdSortIcon = MdSort as React.FC<{ size?: number; className?: string }>;
const BsViewStackedIcon = BsViewStacked as React.FC<{ size?: number; className?: string }>;
const IoGridOutlineIcon = IoGridOutline as React.FC<{ size?: number; className?: string }>;
const CiStarIcon = CiStar as React.FC<{ size?: number; className?: string }>;
const HiOutlineClipboardDocumentIcon = HiOutlineClipboardDocument as React.FC<{ size?: number; className?: string }>;
const HiOutlineViewGridIcon = HiOutlineViewGrid as React.FC<{ size?: number; className?: string }>;
const MdDownloadIcon = MdDownload as React.FC<{ size?: number, className?: string }>;
const MdShareIcon = MdShare as React.FC<{ size?: number, className?: string }>;
const MdCloseIcon = MdClose as React.FC<{ size?: number, className?: string }>;
const MdViewWeekIcon = LuView as React.FC<{ size?: number; className?: string }>;
const MdEmailIcon = MdEmail as React.FC<{ size?: number; className?: string }>;
const MdLinkIcon = MdLink as React.FC<{ size?: number; className?: string }>;

type Props = {
    onSearch: () => void;
    selectionCount: number;
    selected: string[];
    setOpenView: (o: boolean) => void;

    scope: ScopeTab; setScope: (s: ScopeTab) => void;
    groupBy: GroupBy; setOpenGroup: (o: boolean) => void;
    sortBy: SortBy; setOpenSort: (o: boolean) => void;

    menuRef: React.MutableRefObject<any>;

    setOpenFiltersPanel: (o: boolean) => void;
    setOpenSearch: (o: boolean) => void;
    chips: FilterChip[];
    downloadFiles: (files: string[]) => void;
    clearSelection: () => void;
    openPdfFor: (doc: DocumentItemMapped) => void;
    items: DocumentItemMapped[];
    setShareOpen: (open: boolean) => void;
    setShareEmailOpen: (open: boolean) => void;
    showCorrelated: () => void;
};

const Tabs: { key: ScopeTab; label: string; icon?: React.ReactNode, disabled?: boolean }[] = [
    { key: 'all', label: 'Tutti', icon: <IoGridOutlineIcon size={18} /> },
    { key: 'favorites', label: 'Preferiti', icon: <CiStarIcon size={18} /> },
];

const TopBar: React.FC<Props> = ({
    onSearch, selectionCount, selected,
    setOpenView,
    scope, setScope,
    setOpenGroup,
    setOpenSort,
    setOpenFiltersPanel,
    menuRef,
    setOpenSearch,
    chips,
    downloadFiles,
    clearSelection,
    openPdfFor,
    items,
    setShareOpen,
    setShareEmailOpen,
    showCorrelated,
}) => {
    return (
        <FDBox radius='xl' className="dark:border dark:border-white/10 bg-white dark:bg-neutral-900/60 dark:shadow-xl backdrop-blur-sm">
            <div className="mx-auto max-w-[1400px] py-3 flex flex-col gap-3">
                {/* Row 1: search + view + actions */}
                <div className={`px-4 flex flex-wrap ${selectionCount > 0 ? 'justify-center md:justify-between' : 'justify-between'} items-center gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-3`}>
                    <div className='flex flex-wrap items-center gap-4'>
                        <p className='text-sm font-semibold' data-tour="docs-filters-select-file-2">
                            <HiOutlineClipboardDocumentIcon size={22} className='inline mr-1 text-neutral-500' />
                            Documenti {selectionCount > 0 && ` - ${selectionCount} selezionat${selectionCount > 1 ? "i" : "o"}`}
                        </p>
                        {selectionCount > 0 && (<div className='flex items-center gap-2'>
                            <span data-tour="docs-filters-download">
                                <FDButton variant="outline" color='neutral' dataTooltipId='general-documents-tooltip' dataTooltipContent='Scarica i file selezionati' onClick={() => downloadFiles(selected)} >
                                    <MdDownloadIcon />
                                </FDButton></span>
                            {selectionCount == 1 && <span data-tour="docs-filters-view"><FDButton variant="outline" color='neutral' dataTooltipId='general-documents-tooltip' dataTooltipContent='Visualizza il documento selezionato'
                                onClick={() => openPdfFor((items as any).find((item: DocumentItemMapped) => item.id === selected[0]))}>
                                <MdViewWeekIcon />
                            </FDButton></span>}
                            {selectionCount == 1 && (
                                <FDButton variant="outline" color='neutral' dataTooltipId='general-documents-tooltip' dataTooltipContent='Visualizza bolle↔fatture correlate' onClick={showCorrelated} >
                                    <MdLinkIcon />
                                </FDButton>
                            )}

                            <span data-tour="docs-filters-share">
                                <FDButton variant="outline" color='neutral' dataTooltipId='general-documents-tooltip' dataTooltipContent='Condividi i file selezionati' onClick={() => setShareOpen(true)} >
                                    <MdShareIcon />
                                </FDButton></span>
                            <span>
                                <FDButton variant="outline" color='neutral' dataTooltipId='general-documents-tooltip' dataTooltipContent='Condividi i file selezionati via mail' onClick={() => setShareEmailOpen(true)} >
                                    <MdEmailIcon />
                                </FDButton></span>
                            <span data-tour="docs-unselect">
                                <FDButton variant="outline" color='neutral' dataTooltipId='general-documents-tooltip' dataTooltipContent='Annulla Selezione' onClick={clearSelection}>
                                    <MdCloseIcon />
                                </FDButton></span>
                        </div>)}
                    </div>
                    <span data-tour="docs-search">
                        <FDButton variant="solid" color='primary'
                            className='!pl-3 !pr-4' size="medium" onClick={() => onSearch()} icon={<MdSearchIcon size={18} />}>
                            Cerca
                        </FDButton></span>
                </div>

                {/* Row 2: Tabs stile chips */}
                <div className="px-4 flex items-center gap-2 overflow-x-auto py-1">
                    <span data-tour="docs-scope">
                        {Tabs.map(t => (
                            <FDButton
                                variant={scope === t.key ? "outline" : "soft"}
                                color={scope === t.key ? "neutral" : "none"}
                                key={t.key}
                                onClick={() => setScope(t.key)}
                                className={`shrink-0 rounded-full !pl-2.5 !pr-2.5 !pb-1.5 !pt-1.5`}
                                icon={t.icon}
                                disabled={t.disabled || false}
                            >
                                {t.label}
                            </FDButton>
                        ))}</span>
                    <div className="flex items-center gap-2 ml-auto">
                        {/* Group by */}
                        <div className="relative" onClick={(e: any) => menuRef.current = e.currentTarget} data-tour="docs-ragg">
                            <FDButton variant="outline"
                                color='neutral'
                                size="small"
                                onClick={() => setOpenGroup(true)}>
                                <HiOutlineViewGridIcon className="mr-1.5" /> Raggruppa
                            </FDButton>
                        </div>

                        {/* Sort */}
                        <div className="relative" onClick={(e: any) => menuRef.current = e.currentTarget} data-tour="docs-ord">
                            <FDButton variant="outline" color='neutral' size="small" onClick={() => setOpenSort(true)}>
                                <BsViewStackedIcon className="mr-1.5" /> Vista
                            </FDButton>
                        </div>

                        {/* View options (placeholder per densità, compact, ecc.) */}
                        <div className="relative" onClick={(e: any) => menuRef.current = e.currentTarget} data-tour="docs-vis">
                            <FDButton variant="outline" color='neutral' size="small" onClick={() => setOpenView(true)}>
                                <MdSortIcon className="mr-1.5" /> Ordina
                            </FDButton>
                        </div>

                        {/* Filters */}
                        <div className="relative" onClick={(e: any) => menuRef.current = e.currentTarget} data-tour="docs-fil">
                            {/*<FDButton variant="outline" color='neutral' size="small" onClick={() => setOpenFiltersPanel(true)}>*/}
                            <FDButton
                                variant="outline"
                                color='neutral'
                                size="small"
                                onClick={(e) => {
                                    const btn = e.currentTarget as HTMLElement;
                                    menuRef.current = btn.parentElement as HTMLElement || btn;
                                    e.stopPropagation();
                                    setOpenSearch(false);          // chiudi la ricerca
                                    setOpenFiltersPanel(true);         // toggle Filtri
                                }}
                            >
                                <MdFilterListIcon className="mr-1.5" /> Filtri {chips.length > 0 && (
                                    <span
                                        data-tooltip-id='general-documents-tooltip'
                                        data-tooltip-content={`${chips.length} filtr${chips.length > 1 ? "i" : "o"} attiv${chips.length > 1 ? "i" : "o"} - ${chips.map(c => c.label).join(", ")}`}
                                        className="text-xs text-sky-500 ml-1 font-bold">({chips.length})</span>
                                )}
                            </FDButton>
                        </div>
                        <span data-tour="docs-ric">
                            <FDIconButton variant='text' rounded='md'
                                dataTooltipContent='Ricerca Mirata' dataTooltipId='general-documents-tooltip'
                                size='small' className='border border-neutral-200 dark:border-neutral-800'
                                //onClick={() => setOpenSearch(true)} icon={<MdSearchIcon size={18} />} />
                                onClick={() => {
                                    setOpenFiltersPanel(false);   //chiudi il pannello filtri
                                    setOpenSearch(true);          //apri la ricerca mirata
                                }}
                                icon={<MdSearchIcon size={18} />} /></span>
                    </div>
                </div>
            </div>
        </FDBox>
    );
};

export default TopBar;