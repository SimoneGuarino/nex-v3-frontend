//src\layouts\products\virtualziedTable\headerVirtualized\headerFIled.js
import React, { memo, useState } from 'react';
import Stack from '@mui/material/Stack';
import MDTypography from "components/MDTypography";
import IconButton from '@mui/material/IconButton';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import SortIcon from '@mui/icons-material/Sort';

function RetriveElement(props) {
    const { sortBy, label, column } = props;
    const { listOfStatus, indexSort, sortStatus, setSortStatus } = props;
    const { handleOpenMenu, fieldsFiltersStatus, labelAddon } = props;

    const checkStatus = fieldsFiltersStatus.filter(elm => elm.sortStatus !== 0).length;
    const [isHovered, setIsHovered] = useState(false);
    const [sortMenuStatus, setSortMenuStatus] = useState(false);
    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => { return (checkStatus === 0) && (sortMenuStatus === false && setIsHovered(false)); };

    const statusAvaible = ['disabled', 'up', 'down'];
    const displayStatus = Number.isInteger(sortStatus) ? sortStatus : 0;

    const changeSortStatus = (index) => {
        const newArr = [...listOfStatus]
        const next = (sortStatus >= (statusAvaible.length - 1) ? 0 : sortStatus + 1);
        newArr[index].sortStatus = next;
        for (let i = 0; i < newArr.length; i++) if (i !== index) newArr[i].sortStatus = 0;
        setSortStatus(() => newArr)

        const field =
            Array.isArray(column.key) ? column.key[0] :
                (column.secKey ? [column.key, column.secKey] : column.key);
        sortBy(column.sortType, field, next)
    }

    return (
        <Stack
            direction='row'
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave} key={label} gap={1}
            sx={label !== '' ? { minWidth: `${props.cellWidth === 0 ? 0 : 100}`, alignItems: 'center', justifyContent: 'center' }
                : { minWidth: `${props.cellWidth === 0 ? 0 : 50}`, alignItems: 'center', justifyContent: 'center' }}
            style={{ ...props.style, width: props.cellWidth, left: props.left, overflow: 'hidden', whiteSpace: 'nowrap' }}
        >
            <Stack>
                <MDTypography variant="p" sx={{ fontSize: '0.76rem', fontWeight: 600 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {label}
                        {labelAddon ?? null}
                    </span>
                </MDTypography>
            </Stack>

            {(column.sort || (column.multiSort !== undefined && column.multiSort !== false)) && (
                <Stack direction='row'>
                    {/* freccia principale nascosta se column.hideSortIcon === true */}
                    {column.sort && !column.hideSortIcon && statusAvaible[displayStatus] && (
                        <IconButton onClick={() => changeSortStatus(indexSort)} aria-label="sort" size="small" sx={{ maxHeight: 30, '&:hover': { backgroundColor: '#f0f0f0 !important' } }}>
                            <ArrowUpwardRoundedIcon
                                style={{ transition: 'rotate 100ms ease-in' }}
                                sx={
                                    statusAvaible[displayStatus] !== 'disabled'
                                        ? (statusAvaible[displayStatus] !== 'up'
                                            ? { color: '#7f55da', rotate: '180deg' }
                                            : { color: '#7f55da' })
                                        : { color: '#ccc' }
                                } />
                        </IconButton>
                    )}

                    {(column.multiSort !== undefined && column.multiSort !== false) && (
                        <IconButton
                            onMouseLeave={() => setSortMenuStatus(false)}
                            onClick={e => {
                                setSortMenuStatus(true);
                                handleOpenMenu(
                                    e,
                                    (column.multiSort !== undefined && column.multiSort !== false) &&
                                    column.fieldToTake.filter(elm => (elm.key || elm.label) !== label && elm.sort !== false)
                                );
                            }}
                            aria-label="sort" size="small" sx={{ '&:hover': { backgroundColor: '#f0f0f0 !important' } }}>
                            <SortIcon style={{ transition: 'color 100ms ease-in' }} sx={checkStatus !== 0 && { color: '#7f55da' }} />
                        </IconButton>
                    )}
                </Stack>
            )}
        </Stack>
    );
}

export default memo(RetriveElement);
