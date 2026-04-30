import React, { memo, useCallback } from 'react';
import { MdStarBorder, MdStar } from 'react-icons/md';
import type { DocumentItemMapped } from '../types';
import FDBox from 'components/UI/box/FDBox';
import FDIconButton from 'components/UI/buttons/FDIconButton';
import { DocPreview } from './document/DocPreview';
import { IoEllipsisVertical } from "react-icons/io5";

const MdStarBorderIcon = MdStarBorder as React.FC<{ size?: number; className?: string }>;
const MdStarIcon = MdStar as React.FC<{ size?: number; className?: string }>;
const IoEllipsisVerticalIcon = IoEllipsisVertical as React.FC<{ size?: number; className?: string }>;

type Props = {
    item: DocumentItemMapped;
    selected: boolean;
    onSelect: (multi: boolean) => void;
    onToggleFavorite: () => void;
    // Azioni del menu (i 3 pallini). Le teniamo fuori dalla card per non accoppiare la UI alla logica.
    handleOpenMenu: (e: React.MouseEvent<HTMLElement>) => void;
};

const DocumentCard: React.FC<Props> = ({ item, selected, onSelect, onToggleFavorite, handleOpenMenu }) => {
    const handleClick = useCallback((e: React.MouseEvent) => onSelect(e.ctrlKey || e.metaKey), [onSelect]);

    const dateLabel = item?.date ? new Date(item.date as any).toLocaleDateString('it-IT') : 'N/A';

    return (
        <FDBox
            data-tour="docs-filters-select-file"
            variant="ghost"
            radius="2xl"
            shadow={selected ? 'lg' : 'sm'}
            pad="md"
            className={`w-full h-full flex flex-col gap-3 transition cursor-pointer dark:border dark:border-white/10 bg-white dark:bg-neutral-900/60 dark:shadow-xl backdrop-blur-sm
                ${selected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
            onClick={handleClick}
            role="option"
            aria-selected={selected}
        >
            <div className="flex-1">
                <DocPreview name={item.name} company={item.company} w={320} className='w-full h-full' />
            </div>

            <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-400">
                <span>{dateLabel}</span>

                <span
                    className="ml-2 truncate"
                    data-tooltip-id='general-documents-tooltip'
                    data-tooltip-content={`${item.type ?? ''} - ${item.ragione_sociale ?? ''} – ${item.numdoc ?? ''}`}
                >
                    {item.type} - {item.ragione_sociale} – {item.numdoc}
                </span>

                <div className="ml-auto flex gap-1">
                    {(item.sharedWith ?? []).slice(0, 3).map(u => (
                        <span key={u.id} className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 text-[10px]">
                            {u.initials}
                        </span>
                    ))}
                </div>

                <div className="ml-auto inline-flex gap-1" data-tour="docs-filters-select-file-star">
                    <FDIconButton
                        ariaLabel="favorite"
                        variant="general"
                        size="small"
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
                        icon={item.favorite ? <MdStarIcon className="w-4 h-4 text-amber-500" /> : <MdStarBorderIcon className="w-4 h-4" />}
                    />
                    <div className="relative" onClick={handleOpenMenu}>
                        <FDIconButton
                        ariaLabel="menu"
                        variant="general"
                        size="small"
                        icon={<IoEllipsisVerticalIcon />}
                    />
                    </div>
                </div>
            </div>

        </FDBox>
    );
};

export default memo(DocumentCard);