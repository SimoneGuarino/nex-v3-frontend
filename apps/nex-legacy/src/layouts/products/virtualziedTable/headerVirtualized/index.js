//src\layouts\products\virtualziedTable\headerVirtualized\index.js
import { useEffect, useState, memo, useCallback, Fragment } from 'react';
import { Filters } from './filters';
import InfoMenu from '../infoPoupUpMenu';
import MDTypography from "components/MDTypography";

import Stack from '@mui/material/Stack';
import HeaderFiled from './headerFIled';
import MenuItem from '@mui/material/MenuItem';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import { Card, Tooltip as MuiTooltip } from '@mui/material';
import { BsFillExclamationTriangleFill } from 'react-icons/bs';

const THRESHOLD_MS = 23 * 60 * 60 * 1000;
const formatIt = (ms) => (ms == null ? 'sconosciuto' : new Date(ms).toLocaleString('it-IT', { hour12: false }));
const normalizeKey = (s) =>
    (s || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '');

const toMs = (v) => {
    if (v == null) return null;
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    if (v instanceof Date) {
        const t = v.getTime();
        return Number.isFinite(t) ? t : null;
    }
    const p = Date.parse(String(v));
    return Number.isFinite(p) ? p : null;
};

function HeaderVirtualized({ setData, copyData, columns, visibleColumns, lastDateDist, whereToFindData }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const [sortMenuData, setSortMenuData] = useState([]);
    const handleOpenMenu = (event, data) => { setAnchorEl(event.currentTarget); setSortMenuData(data) };
    const handleCloseMenu = () => setAnchorEl(false);

    // IMPORTANT: includi copyData/setData/whereToFindData nelle deps per evitare stale closure
    const sortBy = useCallback((type, field, status, multiplay) => {
        Filters(type, field, status, multiplay, setData, copyData, whereToFindData)
    }, [setData, copyData, whereToFindData]);

    const [test, setTest] = useState([]);

    const changeSortStatus = (index, sortType, label, listofRowElements) => {
        const newArr = [...test]
        const statusAvaible = ['disabled', 'up', 'down'];
        const sortStatus = newArr.find(el => el.label === label)?.sortStatus ?? 0;
        newArr[index].sortStatus = sortStatus >= (statusAvaible.length - 1) ? 0 : sortStatus + 1;
        const multiplay = listofRowElements.find(elm => elm.label === label)?.key?.multiplay
        for (let i = 0; i < newArr.length; i++) if (i !== index) newArr[i].sortStatus = 0;
        setTest(() => newArr)
        sortBy(sortType, label, newArr[index].sortStatus, multiplay)
    };

    // NON legare questa callback a "columns" nelle deps: prende arr come parametro
    const trovaOggettiConSortTrue = useCallback((arr) => {
        const risultato = [];
        function esaminaElemento(elemento) {
            if (elemento.sort === true && elemento.fieldToTake === undefined) {
                risultato.push({ label: elemento.label || elemento.key, sortStatus: 0 });
            }
            if (elemento.fieldToTake && Array.isArray(elemento.fieldToTake)) {
                elemento.fieldToTake.forEach(esaminaElemento);
            }
        }
        arr.forEach(esaminaElemento);
        return risultato;
    }, []);

    useEffect(() => {
        setTest(() => trovaOggettiConSortTrue(columns));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const resolveTimestampForSupplier = (col) => {
        if (!lastDateDist || typeof lastDateDist !== 'object' || Array.isArray(lastDateDist)) return null;

        const candidatesRaw = [col?.distributor, col?.label].filter(Boolean).map(String);
        const candidates = candidatesRaw.map(normalizeKey);

        const entries = Object.entries(lastDateDist);
        const normMap = entries.map(([k, v]) => ({ rawKey: k, normKey: normalizeKey(k), value: v }));

        for (const c of candidates) {
            const hit = normMap.find(x => x.normKey === c);
            if (hit) return toMs(hit.value);
        }
        for (const c of candidates) {
            const hit = normMap.find(x => x.normKey.includes(c) || c.includes(x.normKey));
            if (hit) return toMs(hit.value);
        }
        return null;
    };

    const _renderLeftHeaderCell = ({ columnIndex, style }) => {
        const col = columns[columnIndex];
        const label = visibleColumns.find(elm => elm === col.label) || '';

        const sortStatus = test.find(el => el.label === label)?.sortStatus ?? 0;
        const indexSort = test.findIndex(el => el.label === label);
        const fieldsFiltersStatus = test.filter(item1 => (col.fieldToTake !== undefined ?
            col.fieldToTake.some(item2 => (typeof item2.key !== 'object' ? item2.key : item2.label) === item1.label)
            : (col.label || col.key) === item1.label));

        const isVisible = visibleColumns.includes(col.label);
        const cellWidth = isVisible ? (col.width < 100 ? 100 : col.width) : 0;

        let left = 0;
        for (let i = 0; i < columnIndex; i++) {
            if (visibleColumns.includes(columns[i].label)) {
                left += columns[i].width < 100 ? 100 : columns[i].width;
            }
        }
        if (!isVisible) left += cellWidth;

        let labelAddon = null;
        if (isVisible && col?.type === 'supplier' && !col?.avoidCellColors) {
            const ms = resolveTimestampForSupplier(col);
            const stale = ms != null && (Date.now() - ms) > THRESHOLD_MS;

            if (stale) {
                labelAddon = (
                    <MuiTooltip title={`ultimo aggiornamento: ${formatIt(ms)}`} arrow>
                        <span style={{ lineHeight: 0, display: 'inline-flex' }}>
                            <BsFillExclamationTriangleFill size={14} style={{ color: '#eab308' }} />
                        </span>
                    </MuiTooltip>
                );
            }
        }

        return <Fragment key={columnIndex}>
            {<HeaderFiled
                style={style}
                label={label}
                column={col}
                visibleColumns={visibleColumns}
                sortBy={sortBy}
                listOfStatus={test}
                sortStatus={sortStatus}
                indexSort={indexSort}
                setSortStatus={setTest}
                handleOpenMenu={handleOpenMenu}
                fieldsFiltersStatus={fieldsFiltersStatus}
                cellWidth={cellWidth}
                left={left}
                labelAddon={labelAddon}
            />}
            <InfoMenu
                anchorEl={anchorEl}
                handleCloseMenu={handleCloseMenu}
                contain={
                    Array.isArray(sortMenuData) && sortMenuData?.map((data, index) => {
                        const idx = test.findIndex(el => el.label === (data.label || data.key));
                        const e = test[idx]?.sortStatus || 0;
                        return <MenuItem onClick={() => changeSortStatus(idx, data.sortType, (data.label || data.key), sortMenuData)} key={index}>
                            <Stack direction='row' gap={2} alignItems='center'>
                                <ArrowUpwardRoundedIcon
                                    style={{ transition: 'rotate 100ms ease-in' }}
                                    sx={e !== 0 ? (e !== 1 ? { color: '#7f55da', rotate: '180deg' } : { color: '#7f55da' }) : { color: '#ccc' }} />
                                <MDTypography style={{ color: "#344767", alignSelf: "center" }} variant="p" fontSize="0.76em" textTransform="uppercase" textAlign="right" width="100%" className="flexBasis">
                                    {typeof data.key !== 'object' ? data.key : data.label}
                                </MDTypography>
                            </Stack>
                        </MenuItem>
                    })
                }
            />
        </Fragment>
    };

    return (
        <>
            <Card sx={{ height: '100%' }}>
                <Stack direction='row' width='fit-content' height='100%'>
                    {columns.map((e, index) => <_renderLeftHeaderCell columnIndex={index} key={index} />)}
                </Stack>
            </Card>
        </>
    );
}

export default memo(HeaderVirtualized);
