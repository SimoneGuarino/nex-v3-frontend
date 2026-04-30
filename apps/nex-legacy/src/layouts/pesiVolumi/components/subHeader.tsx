import React from 'react';
import FDButton from 'components/UI/buttons/FDButton';
import { MdFileDownload, MdFilterList } from "react-icons/md";
import FDSelect from 'components/UI/input/FDSelect';
import { FilterChip } from 'components/UI/search/FDSearchPanel';

const DownloadIcon = MdFileDownload as React.FC<{ size?: number, className?: string }>;
const MdFilterListIcon = MdFilterList as React.FC<{ size?: number; className?: string }>;

interface TagProps {
    chips: FilterChip[];
    theme: any;
    loadingTable: boolean;
    tabList: string[];
    tabActived: number;
    contextMenuRef: React.MutableRefObject<any>; setOpenDownloadMenu: (open: boolean) => void;
    setOpenFiltersPanel: (open: boolean) => void;
    changeTab: (tab: number) => void;
}

export const SubHeader: React.FC<TagProps> = ({
    chips,
    loadingTable,
    tabList, tabActived, changeTab,
    contextMenuRef, setOpenDownloadMenu,
    setOpenFiltersPanel,
}) => (
    <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1'>
        <div className="w-full sm:w-[200px]" data-tour="pesi-car-man-var">
            <FDSelect
                options={tabList.map((label, i) => ({ value: i + 1, label }))}
                value={tabActived}
                onChange={(v) => {
                    const next = (v as number | undefined) ?? tabActived;
                    if (next !== tabActived) changeTab(next);
                }}
                size="sm"
                variant="outline"
                radius="md"
                fullWidth
                clearable={false}
            />
        </div>
        <div className='flex items-center gap-2 justify-end'>
            <div className='flex items-center gap-2'>
                {/* Filters */}
                <div className="relative" onClick={(e: any) => contextMenuRef.current = e.currentTarget} data-tour="pesi-filter-mag">
                    <FDButton variant="outline" color='neutral' size="small" onClick={() => setOpenFiltersPanel(true)}>
                        <MdFilterListIcon className="mr-1.5" /> Filtri {chips.length > 0 && (
                            <span
                                data-tooltip-id='general-documents-tooltip'
                                data-tooltip-content={`${chips.length} filtr${chips.length > 1 ? "i" : "o"} attiv${chips.length > 1 ? "i" : "o"} - ${chips.map(c => c.label).join(", ")}`}
                                className="text-xs text-sky-500 ml-1 font-bold">({chips.length})</span>
                        )}
                    </FDButton>
                </div>
            </div>

            <div onClick={(e: any) => contextMenuRef.current = e.currentTarget} data-tour="pesi-download">
                <FDButton
                    size='small'
                    radius='md'
                    variant='outline'
                    color='neutral'
                    onClick={() => setOpenDownloadMenu(true)}
                    disabled={loadingTable}
                    data-tour="pesi-download"
                >
                    <DownloadIcon className='mr-1.5' />
                    Download CSV
                </FDButton>
            </div>
        </div>
    </div>
);
