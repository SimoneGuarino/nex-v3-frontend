import React, { memo, useCallback } from 'react';
import type { DocumentItemMapped } from '../types';
import { MdPictureAsPdf, MdStarBorder, MdStar } from 'react-icons/md';
import { FDIconButton } from "@nex/fd-ui";

const MdPictureAsPdfIcon = MdPictureAsPdf as React.FC<{ size?: number; className?: string }>;
const MdStarBorderIcon = MdStarBorder as React.FC<{ size?: number; className?: string }>;
const MdStarIcon = MdStar as React.FC<{ size?: number; className?: string }>;

type Props = {
    item: DocumentItemMapped;
    selected: boolean;
    onSelect: (multi: boolean) => void;
    onToggleFavorite: () => void;
};

const DocumentRow: React.FC<Props> = ({ item, selected, onSelect, onToggleFavorite }) => {
    const handleClick = useCallback((e: React.MouseEvent) => onSelect(e.ctrlKey || e.metaKey), [onSelect]);

    const dateLabel = item?.date ? new Date(item.date as any).toLocaleDateString('it-IT') : 'N/A';

    return (
        <div
            className={`min-h-[64px] w-full px-3 py-2 rounded-xl flex items-center gap-3 cursor-pointer
        dark:border dark:border-white/10 bg-white dark:bg-neutral-900/60 dark:shadow-xl backdrop-blur-sm
        ${selected ? 'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
            onClick={handleClick}
            role="row"
        >
            <div className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center shrink-0">
                <MdPictureAsPdfIcon className="w-5 h-5 text-neutral-600" />
            </div>

            <div className="flex-1 min-w-0">
                <div
                    className="text-sm font-medium truncate"
                    data-tooltip-id='general-documents-tooltip'
                    data-tooltip-content={`${item.type ?? ''} - ${item.ragione_sociale ?? ''} – ${item.numdoc ?? ''}`}
                >
                    {item.type} - {item.ragione_sociale} – {item.numdoc}
                </div>

                <div className="text-xs text-neutral-500 truncate">
                    {item.company} • CC {item.codice_cliente}
                </div>
            </div>

            <div className="flex items-center gap-2">
                {(item.sharedWith ?? []).slice(0, 3).map(u => (
                    <span key={u.id} className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 text-[10px]">
                        {u.initials}
                    </span>
                ))}

                <FDIconButton
                    ariaLabel="favorite"
                    variant="general"
                    size="small"
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
                    icon={item.favorite ? <MdStarIcon className="w-4 h-4 text-amber-500" /> : <MdStarBorderIcon className="w-4 h-4" />}
                />

                <div className="text-xs text-neutral-500 w-24 text-right">{dateLabel}</div>
            </div>
        </div>
    );
};

export default memo(DocumentRow);