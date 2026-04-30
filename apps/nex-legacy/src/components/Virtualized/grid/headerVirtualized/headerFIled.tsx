import React, { memo, useState } from 'react';
import type { CSSProperties } from 'react';

import Stack from '@mui/material/Stack';
import MDTypography from 'components/MDTypography';
import IconButton from '@mui/material/IconButton';

import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import SortIcon from '@mui/icons-material/Sort';

import Tooltip from '@mui/material/Tooltip';

import type { ColumnForHeader, StatusItem } from './index';

type LastDate = { LastRetrieve?: string };

type Props = {
    style?: CSSProperties;
    cellWidth: number;
    left: number;
    label: string;
    column: ColumnForHeader;
    visibleColumns: string[];
    sortBy: (type: 'String' | 'Number' | 'Multiplay' | undefined, field: string, status: number, multiplay?: string[]) => void;
    listOfStatus: StatusItem[];
    sortStatus: number;
    indexSort: number;
    setSortStatus: React.Dispatch<React.SetStateAction<StatusItem[]>>;
    handleOpenMenu: (e: React.MouseEvent<HTMLElement>, data: any[]) => void;
    fieldsFiltersStatus: StatusItem[];
    LastDateData?: LastDate;
};

function RetriveElement(props: Props) {
    const { sortBy, label, column } = props;
    const { listOfStatus, indexSort, sortStatus, setSortStatus } = props;
    const { handleOpenMenu, fieldsFiltersStatus, LastDateData } = props;

    const checkStatus = fieldsFiltersStatus.filter((elm) => elm.sortStatus !== 0).length;

    const [isHovered, setIsHovered] = useState(false);
    const [sortMenuStatus, setSortMenuStatus] = useState(false);

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => (checkStatus === 0) && (sortMenuStatus === false) && setIsHovered(false);

    const statusAvaible = ['disabled', 'up', 'down'] as const;

    const changeSortStatus = (index: number) => {
        const newArr = [...listOfStatus];
        const current = sortStatus ?? 0;

        newArr[index].sortStatus = current >= statusAvaible.length - 1 ? 0 : current + 1;

        for (let i = 0; i < newArr.length; i++) {
            if (i !== index) newArr[i].sortStatus = 0;
        }
        setSortStatus(() => newArr);

        // NB: se key è array prendi il primo
        const field = Array.isArray(column.key) ? column.key[0] : column.key;
        sortBy(column.sortType, String(field), current);
    };

    function CompareDateLastRetrieve(dateLastRetrieve?: string | Date | null): string | null {
        if (!dateLastRetrieve) return null;
        const today = new Date();
        const dateToCompare = new Date(dateLastRetrieve);

        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const dateToCompareDate = new Date(
            dateToCompare.getFullYear(),
            dateToCompare.getMonth(),
            dateToCompare.getDate()
        );

        if (todayDate.getTime() === dateToCompareDate.getTime()) {
            return null;
        } else {
            const year = dateToCompare.getFullYear();
            const month = String(dateToCompare.getMonth() + 1).padStart(2, '0');
            const day = String(dateToCompare.getDate()).padStart(2, '0');
            return `${day}-${month}-${year}`;
        }
    }

    return (
        <Stack
            direction="row"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            key={label}
            gap={1}
            sx={label !== '' ? { minWidth: 100, alignItems: 'center', justifyContent: 'center' } : { minWidth: 50, alignItems: 'center', justifyContent: 'center' }}
            style={{ ...props.style, width: props.cellWidth, left: props.left }}
        >
            <Stack>
                <MDTypography variant="body2" sx={{ fontSize: '0.76rem', fontWeight: 600 }}>
                    {label}
                </MDTypography>
                {column.type === 'supplier' && LastDateData !== undefined && (
                    <Tooltip title="ATTENZIONE: L'ultimo aggiornamento di questi dati sembra essere datato." placement="top">
                        <MDTypography variant="body2" sx={{ color: '#d30000', fontSize: '0.8rem' }}>
                            {CompareDateLastRetrieve(LastDateData?.LastRetrieve)}
                        </MDTypography>
                    </Tooltip>
                )}
            </Stack>

            {column.sort && isHovered && (
                <Stack direction="row">
                    <IconButton
                        onClick={() => changeSortStatus(indexSort)}
                        aria-label="sort"
                        size="small"
                        sx={{ maxHeight: 30, '&:hover': { backgroundColor: '#f0f0f0 !important' } }}
                    >
                        <ArrowUpwardRoundedIcon
                            style={{ transition: 'rotate 100ms ease-in' }}
                            sx={
                                statusAvaible[sortStatus] !== 'disabled'
                                    ? statusAvaible[sortStatus] !== 'up'
                                        ? { color: '#7f55da', rotate: '180deg' }
                                        : { color: '#7f55da' }
                                    : { color: '#ccc' }
                            }
                        />
                    </IconButton>

                    {column.multiSort !== undefined && column.multiSort !== false && (
                        <IconButton
                            onMouseLeave={() => setSortMenuStatus(false)}
                            onClick={(e: any) => {
                                setSortMenuStatus(true);
                                const data =
                                    column.multiSort !== undefined &&
                                    column.multiSort !== false &&
                                    (column.fieldToTake ?? []).filter((elm: any) => (elm.key || elm.label) !== label && elm.sort !== false);
                                handleOpenMenu(e, data as any[]);
                            }}
                            aria-label="sort"
                            size="small"
                            sx={{ '&:hover': { backgroundColor: '#f0f0f0 !important' } }}
                        >
                            <SortIcon style={{ transition: 'color 100ms ease-in' }} sx={checkStatus !== 0 ? { color: '#7f55da' } : undefined} />
                        </IconButton>
                    )}
                </Stack>
            )}
        </Stack>
    );
}

export default memo(RetriveElement);
