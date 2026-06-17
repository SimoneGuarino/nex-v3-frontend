import { icon_filter } from '../../../config/icons';
import React, { useRef, useState } from 'react';
import { FDIconButton, ContextMenu } from "@nex/fd-ui";
import { TagP } from './tagPanel';

interface TagProps {
    ChangeStatusTagP: () => void;
    warehouses_selected: string;            // '' => tutti
    theme: any;
    warehouses_list: string[];
    noDataWEBP: any;
    loadingTable: boolean;
    setWarehouse: (prev: any) => void;      // number | null
    WarehouseChange: (name: number | null) => void;
}

interface TagBoxProps {
    children: React.ReactNode;
}

const TagBox: React.FC<TagBoxProps> = ({ children }) => {
    return (
        <span className='px-[5px] py-[1px] text-sm rounded-full bg-neutral-400 text-black'>
            {children}
        </span>
    )
}

export const Tag: React.FC<TagProps> = ({
    warehouses_selected,
    warehouses_list,
    noDataWEBP,
    loadingTable,
    setWarehouse,
    WarehouseChange,
}) => {
    const triggerRef = useRef<HTMLSpanElement | null>(null);
    const [open, setOpen] = useState(false);

    return (
        <div className='flex items-center gap-2'>
            <span ref={triggerRef}>
                <FDIconButton
                    icon={icon_filter({ width: 20, height: 20 })}
                    dataTooltipId='general-compare-tooltip'
                    dataTooltipContent='Filtro Magazzini'
                    onClick={() => setOpen(o => !o)}
                />
            </span>
            {warehouses_selected
                ? <TagBox>{warehouses_selected}</TagBox>
                : <TagBox>Tutti i Magazzini</TagBox>}

            <ContextMenu
                openFor={open}
                pos={triggerRef}
                onClose={() => setOpen(false)}
                placement="bottom-end"
                offset={8}
                viewportPadding={8}
                className="min-w-[260px] max-w-[420px]"
                style={{ overflow: 'visible' }}
                panel={
                    <TagP
                        status={open}
                        ChangeStatusTagP={() => setOpen(false)}
                        warehouses_selected={[warehouses_selected].filter(Boolean)}
                        setWarehouse={setWarehouse}
                        warehouses_list={warehouses_list ?? []}
                        noDataWEBP={noDataWEBP}
                        WarehouseChange={WarehouseChange}
                        loadingTable={loadingTable ?? false}
                    />
                }
            />
        </div>
    )
};
