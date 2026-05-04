//src\components\Virtualized\table\headerVirtualized\index.tsx
import React, { useEffect, useState, memo, useCallback, useRef } from 'react';
// #Internal Components
import { Filters } from './filters';
import InfoMenu from '../infoPoupUpMenu';
// #External Components
import Stack from '@mui/material/Stack';
import HeaderFiled from './headerFIled';
// --@Mui icons
import { useMaterialUIController } from 'context/index';
import { Card, Tooltip as MuiTooltip } from '@mui/material';
import { ContextMenu } from 'components/UI/menu/ContextMenu';

import { IoArrowUpCircleOutline } from "react-icons/io5";
import { BsFillExclamationTriangleFill } from 'react-icons/bs';
import { HeaderSettings } from '../types/headerSettings';
import FDBox from 'components/UI/box/FDBox';

const IoArrowUpCircleOutlineIcon = IoArrowUpCircleOutline as React.FC<{ size?: number; className?: string }>;

type MultiPlayFactor = { key: string; secKey?: string };
type MultiPlayObject = { multiplay?: MultiPlayFactor[] } & Record<string, unknown>;

export type FieldToTakeItem = {
    key?: string | MultiPlayObject | unknown;
    label?: string;
    sort?: boolean;
    sortType?: string;
};

export type Column = {
    label?: string;
    key?: string | string[] | MultiPlayObject | unknown;
    secKey?: string;
    width: number;
    sort?: boolean;
    sortType?: string;
    multiSort?: boolean;
    columnOnHover?: string;
    fieldToTake?: FieldToTakeItem[];
};

type SortStatusItem = { label: string; sortStatus: number; columnKey?: string };

interface HeaderVirtualizedProps<T = any> {
    setData: React.Dispatch<React.SetStateAction<T>>;
    copyData: T;
    columns: Column[];
    visibleColumns: string[];
    /** mappa con chiavi normalizzate come sotto (rimozione accenti + lower + solo [a-z0-9]) */
    lastDateDist?: Record<string, number>;
    whereToFindData?: string | false;
    /** <<— nuovo: minimo larghezza colonna, di default 100 */
    minColWidth?: number;
    headerSettings?: HeaderSettings;
}

function parseToMs(v: number | undefined): number | null {
    if (v == null) return null;
    return Number.isFinite(v) ? v : null;
}
const THRESHOLD_MS = 23 * 60 * 60 * 1000;
const formatIt = (ms: number | null) =>
    ms == null ? 'sconosciuto' : new Date(ms).toLocaleString('it-IT', { hour12: false });

// normalizzazione “stretta”: no accenti, lowercase, solo [a-z0-9]
const normalizeKey = (s: string) =>
    (s || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '');

const normalizeSortToken = (s: unknown): string =>
    String(s ?? '').trim().toLowerCase();

function HeaderVirtualized<T>({
    setData,
    copyData,
    columns,
    visibleColumns,
    lastDateDist,
    whereToFindData,
    minColWidth = 100, // default
    headerSettings = {
        className: {
            main_container: 'border-b border-gray-200 dark:border-neutral-800'
        }
    },
}: HeaderVirtualizedProps<T>): JSX.Element {
    const [controller] = useMaterialUIController() as unknown as [
        { darkMode?: boolean },
        unknown
    ];
    const { darkMode } = controller ?? {};
    void darkMode;

    const [openContextMenu, setOpenContextMenu] = useState(false);
    const anchorEl = useRef<HTMLDivElement | null>(null);
    const [sortMenuData, setSortMenuData] = useState<FieldToTakeItem[]>([]);

    const handleOpenMenu = useCallback(
        (event: React.MouseEvent<HTMLElement>, data: FieldToTakeItem[]) => {
            (anchorEl as any).current = event.currentTarget as HTMLElement;
            setSortMenuData(data);
            setOpenContextMenu(true);
        },
        []
    );

    const resolveColumnKey = useCallback((field: unknown): string => {
        if (Array.isArray(field)) {
            return field.map((item) => String(item ?? '')).join('.');
        }
        if (field && typeof field === 'object') {
            return String((field as any).key ?? (field as any).label ?? '');
        }
        return String(field ?? '');
    }, []);

    const sortBy = useCallback(
        (type: string | number | unknown[], field: any, status: number, multiplay?: any) => {
            if (headerSettings?.onSortChange) {
                const nextSortDirection = status >= 2 ? 0 : status + 1;
                headerSettings.onSortChange({
                    columnKey: resolveColumnKey(field),
                    sortDirection: nextSortDirection,
                });
                return;
            }

            Filters(type as any, field, status, multiplay, setData as any, copyData as any, whereToFindData);
        },
        [copyData, headerSettings, resolveColumnKey, setData, whereToFindData]
    );

    const onSortChange = headerSettings?.onSortChange;
    const externalSortColumnKey = headerSettings?.sortState?.columnKey ?? '';
    const externalSortDirection = Number(headerSettings?.sortState?.sortDirection ?? 0);

    const [test, setTest] = useState<SortStatusItem[]>([]);

    const changeSortStatus = (
        index: number,
        sortType: any,
        label: string,
        listofRowElements: FieldToTakeItem[]
    ) => {
        const newArr = [...test];
        const statusAvaible = ['disabled', 'up', 'down'];
        const indexByLabel = newArr.findIndex((el) => el.label === label);

        let resolvedIndex = index >= 0 && newArr[index] ? index : indexByLabel;

        if (resolvedIndex < 0) {
            if (!label) return;
            newArr.push({ label, sortStatus: 0 });
            resolvedIndex = newArr.length - 1;
        }

        const sortStatus = newArr[resolvedIndex]?.sortStatus ?? 0;
        const nextSortStatus = sortStatus >= statusAvaible.length - 1 ? 0 : sortStatus + 1;
        newArr[resolvedIndex].sortStatus = nextSortStatus;

        const multiplay = (listofRowElements.find((elm) => elm.label === label)?.key as MultiPlayObject | undefined)?.multiplay;

        for (let i = 0; i < newArr.length; i++) {
            if (i !== resolvedIndex) newArr[i].sortStatus = 0;
        }
        setTest(() => newArr);

        sortBy(sortType, label, sortStatus, multiplay);
    };

    const trovaOggettiConSortTrue = useCallback(
        (arr: Column[], sortState?: HeaderSettings['sortState']): SortStatusItem[] => {
            const risultato: SortStatusItem[] = [];
            const currentSortKey = normalizeSortToken(sortState?.columnKey);
            const currentSortDirection = Number(sortState?.sortDirection ?? 0);
            const hasCurrentSort = (currentSortDirection === 1 || currentSortDirection === 2) && currentSortKey.length > 0;

            function esaminaElemento(elemento: Column | FieldToTakeItem) {
                if ((elemento as any).sort === true && !(elemento as any).fieldToTake) {
                    const lbl = (elemento as any).label ?? (elemento as any).key;
                    const field = (elemento as any).key ?? (elemento as any).label;
                    const columnKey = resolveColumnKey(field);
                    const isCurrentSort =
                        hasCurrentSort &&
                        (normalizeSortToken(columnKey) === currentSortKey || normalizeSortToken(lbl) === currentSortKey);

                    risultato.push({
                        label: String(lbl),
                        columnKey,
                        sortStatus: isCurrentSort ? currentSortDirection : 0,
                    });
                }
                const ft = (elemento as any).fieldToTake;
                if (Array.isArray(ft)) {
                    ft.forEach(esaminaElemento as any);
                }
            }

            arr.forEach(esaminaElemento as any);
            return risultato;
        },
        [resolveColumnKey]
    );

    useEffect(() => {
        setTest((prev) => {
            const next = trovaOggettiConSortTrue(columns, {
                columnKey: externalSortColumnKey,
                sortDirection: externalSortDirection,
            });

            // In modalità server-side la source of truth è lo stato esterno.
            if (onSortChange) {
                return next;
            }

            if (prev.length === 0) return next;

            const prevByLabel = new Map(prev.map((item) => [item.label, item.sortStatus]));
            return next.map((item) => ({
                ...item,
                sortStatus: prevByLabel.get(item.label) ?? 0,
            }));
        });
    }, [columns, externalSortColumnKey, externalSortDirection, onSortChange, trovaOggettiConSortTrue]);

    const RenderLeftHeaderCell = ({
        columnIndex,
        style,
    }: {
        columnIndex: number;
        style?: React.CSSProperties;
    }) => {
        const col = columns[columnIndex];
        if (!col) return null;

        const label = visibleColumns.find((elm) => elm === col.label) ?? '';

        const sortStatus = test.find((el) => el.label === label)?.sortStatus ?? 0;
        const indexSort = test.findIndex((el) => el.label === label);

        const fieldsFiltersStatus = test.filter((item1) =>
            col.fieldToTake !== undefined
                ? col.fieldToTake.some(
                    (item2) =>
                        (typeof (item2.key as any) !== 'object' ? (item2.key as any) : item2.label) === item1.label
                )
                : (col.label || (col.key as any)) === item1.label
        );

        // visibilità della colonna
        const isVisible = visibleColumns.includes(col.label as string);
        const cellWidth = isVisible ? (col.width < minColWidth ? minColWidth : col.width) : 0;

        // calcolo left
        let left = 0;
        for (let i = 0; i < columnIndex; i++) {
            if (visibleColumns.includes(columns[i].label as string)) {
                left += columns[i].width < minColWidth ? minColWidth : columns[i].width;
            }
        }
        if (!isVisible) {
            left += cellWidth; // cellWidth è 0 quando non visibile
        }

        // addon icona alert SOLO per colonne fornitore visibili
        let labelAddon: React.ReactNode = null;
        if (isVisible && (col as any)?.type === 'supplier') {
            const rawName = (col.label ?? '') as string;
            const key = normalizeKey(rawName);
            const tsMs = parseToMs(lastDateDist?.[key]);
            const stale = tsMs != null && (Date.now() - tsMs) > THRESHOLD_MS;

            if (stale) {
                const triangleEl = React.createElement(BsFillExclamationTriangleFill as any, {
                    size: 14,
                    style: { color: '#eab308', verticalAlign: 'middle' }
                });
                labelAddon = (
                    <MuiTooltip title={`ultimo aggiornamento: ${formatIt(tsMs)}`} arrow>
                        <span style={{ lineHeight: 0, display: 'inline-flex' }}>
                            {triangleEl}
                        </span>
                    </MuiTooltip>
                );
            }
        }

        return (
            <HeaderFiled
                style={style}
                label={label}
                key_={columnIndex}
                ref_={anchorEl}
                column={col as any}
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
                headerSettings={headerSettings}
            />
        );
    };

    return (
        <>
            <FDBox className='h-full flex'>
                {columns.map((_, index) => {
                    return <RenderLeftHeaderCell columnIndex={index} key={index} />;
                })}
            </FDBox>

            <ContextMenu
                openFor={openContextMenu}
                pos={anchorEl}
                onClose={() => setOpenContextMenu(false)}
                menuButtons={(Array.isArray(sortMenuData) &&
                    sortMenuData?.map((data) => {
                        const indexSort = test.findIndex((el) => el.label === (data.label || (data.key as any)));
                        const e = test[indexSort]?.sortStatus ?? 0;

                        return {
                            title: typeof data.key !== 'object' ? (data.key as any) : data.label,
                            icon: (<IoArrowUpCircleOutlineIcon size={20} className={
                                e !== 0
                                    ? e !== 1
                                        ? "text-sky-400 rotate-180"
                                        : "text-sky-400"
                                    : "text-neutral-400"
                            } />),
                            onClick: () => changeSortStatus(indexSort, data.sortType, String(data.label || (data.key as any)), sortMenuData),
                        }
                    })) || []
                }
            />
        </>
    );
}

export default memo(HeaderVirtualized);
