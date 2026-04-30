//src\components\Virtualized\table\headerVirtualized\headerFIled.tsx
import React, { memo, useState } from 'react';

import Stack from '@mui/material/Stack';
import FDIconButton from 'components/UI/buttons/FDIconButton';
import { IoArrowUpCircleOutline } from "react-icons/io5";
import { MdOutlineSort } from "react-icons/md";

import { Column, FieldToTakeItem } from './index'; // riuso dei tipi
import { HeaderSettings } from '../types/headerSettings';

const IoArrowUpCircleOutlineIcon = IoArrowUpCircleOutline as React.FC<{ size?: number; className?: string }>;
const MdOutlineSortIcon = MdOutlineSort as React.FC<{ size?: number; className?: string }>;

type SortStatusItem = { label: string; sortStatus: number };

interface HeaderFiledProps {
    style?: React.CSSProperties;
    label: string;
    column: Column;
    visibleColumns: string[];
    sortBy: (type: any, field: any, status: number, multiplay?: any) => void;
    listOfStatus: SortStatusItem[];
    sortStatus: number;
    indexSort: number;
    setSortStatus: React.Dispatch<React.SetStateAction<SortStatusItem[]>>;
    handleOpenMenu: (e: React.MouseEvent<HTMLElement>, data: FieldToTakeItem[]) => void;
    fieldsFiltersStatus: SortStatusItem[];
    cellWidth: number;
    left: number;
    ref_: React.Ref<any>;
    key_: number;
    /** icona/elemento aggiuntivo vicino all’etichetta (es. triangolino) */
    labelAddon?: React.ReactNode;
    headerSettings?: HeaderSettings;
}

function RetriveElement(props: HeaderFiledProps): JSX.Element {
    const { ref_, key_ } = props;
    const { sortBy, label, column } = props;
    const { listOfStatus, indexSort, sortStatus, setSortStatus } = props;
    const { handleOpenMenu, fieldsFiltersStatus } = props;

    const checkStatus = fieldsFiltersStatus.filter((elm) => elm.sortStatus !== 0).length;

    // setta se il box è onHover o meno
    const [isHovered, setIsHovered] = useState(false);
    const [sortMenuStatus, setSortMenuStatus] = useState(false);
    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => checkStatus === 0 && sortMenuStatus === false && setIsHovered(false);

    // definisci lo stato del sort
    const statusAvaible = ['disabled', 'up', 'down'];

    const changeSortStatus = (index: number) => {
        const newArr = [...listOfStatus];
        newArr[index].sortStatus = sortStatus >= statusAvaible.length - 1 ? 0 : sortStatus + 1;

        // reset altri
        for (let i = 0; i < newArr.length; i++) {
            if (i !== index) newArr[i].sortStatus = 0;
        }
        setSortStatus(() => newArr);

        // calcolo campo per sortBy (come originale)
        const fieldArg = Array.isArray(column.key)
            ? column.key[0]
            : column.secKey
                ? [column.key as string, column.secKey]
                : column.key;

        sortBy(column.sortType, fieldArg, sortStatus);
    };

    return (
        <Stack
            key={key_ + label}
            direction="row"
            data-tooltip-content={column?.columnOnHover}
            data-tooltip-id="general-vi-table-virtualized-tooltip"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            gap={1}
            sx={
                label !== ''
                    ? { minWidth: `${props.cellWidth === 0 ? 0 : 100}px`, alignItems: 'center', justifyContent: 'center' }
                    : { minWidth: `${props.cellWidth === 0 ? 0 : 50}px`, alignItems: 'center', justifyContent: 'center' }
            }
            /* 👇 impedisce che contenuti (es. triangolino) “sbordino” da colonne width=0 */
            style={{ ...props.style, width: props.cellWidth, left: props.left, overflow: 'hidden', whiteSpace: 'nowrap' }}
        >
            <span className='text-xs text-neutral-500' style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {label}
                {/* addon vicino all’etichetta (es. warning triangolo) */}
                {props.labelAddon ?? null}
            </span>

            {column.sort && (
                <Stack direction="row">
                    {!column.multiSort && statusAvaible[sortStatus] && (
                        <FDIconButton
                            variant='text'
                            size='small'
                            ariaLabel="sort"
                            onClick={() => changeSortStatus(indexSort)}
                            initial={false}
                            icon={
                                <IoArrowUpCircleOutlineIcon size={20} className={
                                    statusAvaible[sortStatus] !== 'disabled'
                                        ? statusAvaible[sortStatus] !== 'up'
                                            ? "text-sky-400 rotate-180"
                                            : "text-sky-400"
                                        : "text-neutral-400"
                                } />
                            }
                        />
                    )}

                    {column.multiSort !== undefined && column.multiSort !== false && (
                        <FDIconButton
                            variant='text'
                            size='small'
                            ariaLabel="sort"
                            onClick={(e: React.MouseEvent<HTMLElement>) => {
                                setSortMenuStatus(true);
                                handleOpenMenu(
                                    e,
                                    column.fieldToTake?.filter(
                                        (elm) => (elm.key || elm.label) !== label && elm.sort !== false
                                    ) || []
                                );
                            }}
                            initial={false}
                            icon={<MdOutlineSortIcon size={20} className={checkStatus !== 0 ? "text-sky-400" : ""} />}
                        />
                    )}
                </Stack>
            )}
        </Stack>
    );
}

export default memo(RetriveElement);
