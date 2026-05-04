import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';

import './ScrollSync.css';

import Stack from '@mui/material/Stack';
import HeaderVirtualized from './headerVirtualized';

import FooterTable from './footerTable';
import RetrieveElement from './retriveElement';

import NoProductFound from "assets/images/3298067.webp";

import { TableVirtuoso } from 'react-virtuoso';
import { Card, Fade, Skeleton } from '@mui/material';
import { RetriveCookie, SaveCookie } from 'utils/index.js';
import MinLoader from '../../../minLoader';
import { Tooltip } from 'react-tooltip';
import MDTypography from 'components/MDTypography';
import { MainTheme } from 'assets/settingsTheme';
import { RetriveColumnsAPI, RetriveColumnConfig } from './fetchData/retriveColumns';
import { HeaderSettings } from './types/headerSettings';
import { BodySettings, variantBody } from './types/bodySettings';
import { clsx } from 'components/UI/box/FDBox';
import { useNexTheme } from '@nex/theme-system';

function parseStyleObject(value: unknown): Record<string, any> | undefined {
    if (!value) return undefined;
    if (typeof value === 'object' && !Array.isArray(value)) return value as Record<string, any>;
    if (typeof value !== 'string') return undefined;

    try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed as Record<string, any>;
        }
    } catch {
        return undefined;
    }

    return undefined;
}

function normalizeColumnType(type: unknown): string {
    if (typeof type !== 'string' || !type.trim()) return 'default';
    const normalized = type.trim().toLowerCase();

    if (normalized === 'string') return 'default';
    if (['int', 'integer', 'float', 'double', 'decimal'].includes(normalized)) return 'number';

    return type;
}

function normalizeConfigColumn(column: RetriveColumnConfig, minColWidth: number) {
    const label = (column.label as string | undefined) ?? column.nome ?? (typeof column.key === 'string' ? column.key : '');
    const key = column.key ?? label;
    const width = typeof column.width === 'number' && column.width > 0 ? column.width : minColWidth;
    const description = typeof column.descrizione === 'string' ? column.descrizione : undefined;
    const sx = parseStyleObject(column.sx);
    const sxText = parseStyleObject(column.sxText);

    return {
        ...column,
        key,
        label,
        width,
        columnOnHover: description,
        sort: typeof column.sort === 'boolean' ? column.sort : false,
        sortType: (column.sortType as string | undefined) ?? 'String',
        type: normalizeColumnType(column.type),
        ...(sx ? { sx } : {}),
        ...(sxText ? { sxText } : {}),
    };
}

function variantClasses(variant: variantBody, rowIndex: number, isSelected?: boolean) {
    switch (variant) {
        case "striped":
            return clsx(
                isSelected ? "bg-blue-500/10 dark:bg-blue-400/10" : "bg-striped",
                "transition-all text-neutral-900 dark:text-gray-200"
            );

        case "default":
            return clsx(
                rowIndex % 2 === 0 ? 'bg-gray-100 dark:bg-neutral-800/30' : '',
                "text-neutral-900 dark:text-neutral-100"
            );
    }
}

interface RenderLeftSideCellMemoProps {
    visibleColumns: string[];
    columns: any;
    data: any;
    rowIndex: number;
    addZeroes: (num1: number, num2: number, num3?: number) => any;
    formatData: any;
    tableType?: string;
    blockCondition?: { bg: string; condition: string };
    /** larghezza minima colonna (coerente con header) */
    minColWidth?: number;
    bodySettings?: BodySettings;
    textCenter?: boolean;
};
const RenderLeftSideCellMemo: React.FC<RenderLeftSideCellMemoProps> = ({
    visibleColumns,
    columns,
    data,
    rowIndex,
    addZeroes,
    formatData,
    tableType,
    blockCondition,
    minColWidth = 100,
    bodySettings = { variant: 'default' },
    textCenter = false,
}) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const elm = data[rowIndex];
    const MIN = minColWidth ?? 100;
    const isSelected = bodySettings?.isSelected ? bodySettings.isSelected(elm) : false;
    const onSelect = bodySettings?.onSelect ? bodySettings.onSelect : () => { };

    const handleClick = useCallback((e: React.MouseEvent) => onSelect(elm, e.ctrlKey || e.metaKey), [onSelect]);

    return <div key={rowIndex} onClick={handleClick} className={clsx(
        bodySettings?.className?.main_container,
        bodySettings?.onSelect ? 'cursor-pointer select-none' : '',
        variantClasses(bodySettings?.variant || 'default', rowIndex, isSelected),
        'flex'
    )}>
        {columns.map((col: any, index: number) => {
            const column = col;
            let style: { [key: string]: string | number } = elm.onEvidance ? { backgroundColor: '#f6da383d' } : {};

            if (tableType) {
                if (tableType === 'bottom-line') {
                    style = { ...style, borderBottom: `1px solid ${darkMode ? palette.grey[800] : palette.grey[300]}`, minHeight: 75 }
                } else if (tableType === 'grid') {
                    style = { ...style, borderBottom: `1px solid ${darkMode ? palette.grey[800] : palette.grey[300]}`, borderRight: `1px solid ${darkMode ? palette.grey[800] : palette.grey[300]}`, minHeight: 75 }
                }
            };

            const checkifInvisibleColumns = (visibleColumns.find((e: any) => e === column.label));
            const cellWidth = checkifInvisibleColumns ? (column.width < MIN ? MIN : column.width) : 0;

            // Calcola la posizione orizzontale in base alle colonne visibili
            let left = 0;
            for (let i = 0; i < visibleColumns.length; i++) {
                if (visibleColumns.includes(columns[i]?.label)) {
                    left += columns[i].width < MIN ? MIN : columns[i].width;
                }
            };

            // Regola il posizionamento delle colonne in base alla larghezza nascosta
            if (!checkifInvisibleColumns) {
                left += cellWidth; // Aggiungi larghezza della colonna nascosta
            };

            return checkifInvisibleColumns && <Stack key={index} sx={{ width: cellWidth, ...style }}>
                <RetrieveElement
                    visibleColumns={visibleColumns}
                    elm={elm}
                    index={rowIndex}
                    addZeroes={addZeroes}
                    formatData={formatData}
                    columns={columns}
                    data={data}
                    handleOpenMenu={() => { }}
                    columnKey={column}
                    columnIndex={index}
                    blockCondition={blockCondition}
                    textCenter={textCenter}
                /></Stack>
        })}
    </div>
};

interface VirtualizedTableProps {
    data: any;
    setData: (prev: any) => void;
    columns?: any[];
    setColumns?: React.Dispatch<React.SetStateAction<any[]>>;
    /** allineato a HeaderVirtualized: solo epoch ms */
    lastDateDist?: Record<string, number>;
    cookie?: string;
    results?: number;
    tableType?: string;
    height?: number | string;
    /**Stato di caricamento della tabella */
    loadStatus?: boolean;
    blockCondition?: { bg: string; condition: string };
    footer?: boolean;
    whereToFindData?: boolean | string;
    /**
     * Infinite scroll settings
     */
    infiniteScroll?: {
        loadStatus?: boolean;
        func: () => Promise<boolean | string>,
        offset?: any
        /** Indica il numero di elementi che deve essere recuperato in ogni chiamata */
        numberToFetch?: number;
    };
    footerSettings?: {
        showColSettings?: boolean;
        callbackColSettings?: () => void;
        colSettingsLoader?: {
            get?: boolean;
            set?: (prev: boolean) => void;
        };

        showResults?: boolean;
        showWherehouse?: boolean;
        totWarehouse?: number | null;

        /** Controllo stato di apertura e chiusura delle impostazioni tabellari (colonne) */
        colSettingsOpen?: boolean;
        setColSettingsOpen?: (open: boolean) => void;
    }
    className?: string;
    /** Nome tabella per autoload configurazione colonne da BE */
    tableName?: string;
    textCenter?: boolean;

    /** 👇 nuovo: larghezza minima colonna per header+body (default 100) */
    minColWidth?: number;

    /**
     * Impostazioni header tabella.
     * onSortChange consente sort lato server con payload: { columnKey, sortDirection }.
     * sortState riallinea lo stato icone sort dopo remount.
     */
    headerSettings?: HeaderSettings;
    bodySettings?: BodySettings;
};

/**
 * @returns
 */
export const TableVirtualized: React.FC<VirtualizedTableProps> = ({
    data,
    setData,
    results,
    columns: propColumns,
    className,
    setColumns: propSetColumns,
    tableName,
    cookie,
    tableType,
    height,
    loadStatus,
    blockCondition,
    footer,
    whereToFindData = false,
    infiniteScroll,
    footerSettings,
    headerSettings,
    bodySettings,
    lastDateDist,
    minColWidth = 100,
    textCenter = false,
}) => {
    const palette = MainTheme().palette;
    const [internalColumns, setInternalColumns] = useState<any[]>(
        Array.isArray(propColumns) ? propColumns : []
    );
    const columns = propSetColumns
        ? (Array.isArray(propColumns) ? propColumns : [])
        : internalColumns;
    const setColumns = useCallback(
        (next: any[] | ((prev: any[]) => any[])) => {
            if (propSetColumns) {
                propSetColumns(next as React.SetStateAction<any[]>);
                return;
            }

            setInternalColumns((prev) =>
                typeof next === "function"
                    ? (next as (prev: any[]) => any[])(prev)
                    : next
            );
        },
        [propSetColumns]
    );
    const setColumnsRef = useRef(setColumns);

    useEffect(() => {
        setColumnsRef.current = setColumns;
    }, [setColumns]);

    const [impTableStatus, setImpTableStatus] = useState<boolean>(false);
    const [copyData, setCopyData] = useState(data);
    const prevLabelsSignature = useRef<string>('');

    function setCookie() {
        if (cookie) {
            if (!RetriveCookie({ name: cookie })) {
                const ColumnsMap = columns.map((column: any) => column.label);
                SaveCookie({ name: cookie, data: ColumnsMap });
                return ColumnsMap
            } else {
                return RetriveCookie({ name: cookie })
            }
        } else { return null };
    };

    useEffect(() => {
        if ((copyData && copyData.length === 0) || !copyData) { setCopyData(data); };
    }, [data]) // eslint-disable-line

    useEffect(() => {
        if (propSetColumns) return;
        if (!Array.isArray(propColumns)) return;
        setInternalColumns(propColumns);
    }, [propColumns, propSetColumns]);

    const [visibleColumns, setVisibleColumns] = useState(setCookie()
        || columns.map((column: any) => column.label));
    const defaultColumnOrder = useMemo(() => columns.map((column: any) => column.label), [columns]);

    useEffect(() => {
        const normalizedTableName = `${tableName ?? ''}`.trim();
        if (!normalizedTableName) return;

        const abortController = new AbortController();
        let active = true;

        RetriveColumnsAPI({ tabella: normalizedTableName }, abortController)
            .then((rows) => {
                if (!active) return;
                const normalizedColumns = rows
                    .filter((row) => !row.hide)
                    .map((row) => normalizeConfigColumn(row, minColWidth));
                setColumnsRef.current(normalizedColumns as any);
            })
            .catch((err: any) => {
                if (err?.name === 'AbortError') return;
                console.error('Errore recupero colonne configurate', err);
            });

        return () => {
            active = false;
            abortController.abort();
        };
    }, [tableName, minColWidth]);

    useEffect(() => {
        const allLabels = columns
            .map((column: any) => column?.label)
            .filter((label: unknown): label is string => typeof label === 'string' && label.length > 0);

        const signature = allLabels.join('|');
        if (!signature || prevLabelsSignature.current === signature) return;
        prevLabelsSignature.current = signature;

        const savedColumns = cookie ? RetriveCookie({ name: cookie }) : null;
        if (Array.isArray(savedColumns) && savedColumns.length > 0) {
            const filteredSaved = savedColumns.filter((label: string) => allLabels.includes(label));
            const missingLabels = allLabels.filter((label: string) => !filteredSaved.includes(label));
            setVisibleColumns([...filteredSaved, ...missingLabels]);
            return;
        }

        setVisibleColumns(allLabels);

        if (cookie) {
            SaveCookie({ name: cookie, data: allLabels });
        }
    }, [columns, cookie]);

    useEffect(() => {
        setCookie();
        const updatedColumns = columns.map((column: any) => {
            const { key } = column;
            const width = column.width ? column.width : null
            let maxWidth = 0;
            const setMaxWidth = 350;

            if ((data && Array.isArray(data) && data.length > 0)) {
                if (Array.isArray(key)) {
                    key.forEach((subKey) => {
                        maxWidth = data.reduce((max: any, item: any) => {
                            let valueWidth;

                            const cellContent = item[subKey] ? item[subKey].toString() : '';
                            const cellWidth = cellContent.length * 10;
                            if (cellWidth > setMaxWidth) {
                                valueWidth = setMaxWidth
                            } else { valueWidth = cellWidth }

                            return Math.max(max, valueWidth);
                        }, maxWidth);
                    });
                } else if (typeof key === "string") {
                    maxWidth = data.reduce((max: any, item: any) => {
                        let valueWidth;
                        let cellContent = '';

                        if (item[key]) {
                            if (column.secKey) {
                                cellContent = item[key][column.secKey] ?
                                    item[key][column.secKey].toString() : '';
                            } else {
                                cellContent = item[key];
                            }
                        }

                        const cellWidth = cellContent.length * 10;

                        if (cellWidth > setMaxWidth) {
                            valueWidth = setMaxWidth
                        } else { valueWidth = cellWidth }

                        return Math.max(max, valueWidth);
                    }, key.length * 8);
                }
            }

            return { ...column, width: width ? width : maxWidth, maxWidth: 250 };
        });

        setColumns((updatedColumns as any));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const addZeroes = useCallback((num1: number, num2: number, num3?: number) => {
        const sum = num2 !== undefined ? (num3 !== undefined ? num1 + num2 + num3 : num1 + num2) : num1;
        const formattedPriceString = (sum || 0).toLocaleString("it-IT", {
            style: "currency",
            currency: "EUR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return formattedPriceString;
    }, [data]);

    const formatData = useCallback((text: string) => {
        let formatedText = text;
        if (formatedText != null) {
            formatedText = new Date(formatedText).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
        return formatedText;
    }, [data]);

    const toggleColumnVisibility = (columnLabel: string) => {
        const newVisibleColumns = visibleColumns.includes(columnLabel)
            ? visibleColumns.filter((key: string) => key !== columnLabel)
            : [...visibleColumns, columnLabel];

        newVisibleColumns.sort((a: string, b: string) => {
            const indexA = defaultColumnOrder.indexOf(a);
            const indexB = defaultColumnOrder.indexOf(b);
            return indexA - indexB;
        });

        setVisibleColumns(newVisibleColumns);

        if (cookie) {
            SaveCookie({ name: cookie, data: newVisibleColumns });
        }

        if (footerSettings && footerSettings.callbackColSettings) {
            footerSettings.callbackColSettings();
        };
    };

    const setAllColumnsVisibility = React.useCallback(
        (mode: 'show' | 'hide' | 'toggle') => {
            const allLabels = columns.map((c: any) => c.label);
            const allVisible = visibleColumns.length === allLabels.length;

            let nextVisible: string[];
            if (mode === 'show') nextVisible = allLabels;
            else if (mode === 'hide') nextVisible = [];
            else nextVisible = allVisible ? [] : allLabels;

            setVisibleColumns(nextVisible);

            if (cookie) {
                SaveCookie({ name: cookie, data: nextVisible });
            }
            if (footerSettings && footerSettings.callbackColSettings) {
                footerSettings.callbackColSettings();
            }
        },
        [columns, visibleColumns.length, cookie, footerSettings]
    );

    const [state] = useState({
        columnWidth: 75,
        columnCount: columns.length,
        height: 530,
        overscanColumnCount: 0,
        overscanRowCount: 5,
        rowHeight: 80,
    });

    const loadOneTime = React.useRef(false);
    const handleRangeChanged = (range: any) => {
        if (infiniteScroll) {
            const buffer = 5;
            const { endIndex } = range;
            const numberToFetch = infiniteScroll.numberToFetch || 50;

            if (numberToFetch <= data.length && endIndex >= data.length - buffer) {
                if (results ? data.length < results : true) {
                    if (!loadOneTime.current) {
                        loadOneTime.current = true;
                        return infiniteScroll.func().then(() => {
                            if (infiniteScroll.offset) {
                                infiniteScroll.offset.current += 1;
                            }
                            loadOneTime.current = false;
                        }).catch((err: unknown) => {
                            console.log("Sembra che ci sia un problema con l'infinite scroll.", err)
                        });
                    };
                };
            };
        };
    };

    const memoRender = React.useCallback(() => {
        return <TableVirtuoso
            style={{
                height: '100%',
                minHeight: `${height ? (typeof height === 'number' ? (height + "px") : height) : (state.height + "px")}`
            }}
            data={data}
            itemContent={index => <RenderLeftSideCellMemo key={index} rowIndex={index}
                visibleColumns={visibleColumns} columns={columns} data={data} formatData={formatData}
                addZeroes={addZeroes} tableType={tableType} blockCondition={blockCondition} minColWidth={minColWidth} bodySettings={bodySettings} textCenter={textCenter} />}
            fixedHeaderContent={() => (
                <div className={`rounded-tl-lg ${headerSettings?.className?.main_container}`} style={{
                    height: state.rowHeight - 10,
                    overflow: 'auto',
                }}>
                    <HeaderVirtualized
                        whereToFindData={
                            whereToFindData === undefined
                                ? 'dati'
                                : (typeof whereToFindData === 'string'
                                    ? (whereToFindData || false)
                                    : false)
                        }
                        columns={columns}
                        visibleColumns={visibleColumns}
                        lastDateDist={lastDateDist}
                        setData={setData}
                        copyData={copyData}
                        minColWidth={minColWidth}
                        headerSettings={headerSettings}
                    />
                </div>
            )}
            rangeChanged={handleRangeChanged}
        />
    }, [data, columns, height, state.height, visibleColumns, copyData, formatData, addZeroes, tableType, blockCondition, whereToFindData, setData, lastDateDist, minColWidth, bodySettings, textCenter]); // deps complete

    return (<Card sx={{ height: '100%' }} className={className}>
        {!loadStatus ?
            ((data && Array.isArray(data) && data.length > 0) ? memoRender()
                : <Stack justifyContent='center'
                    sx={{ padding: "0 0 40px", alignItems: "center", filter: 'grayscale(1)', opacity: 0.65, height: '100%' }}>
                    <img src={NoProductFound} style={{
                        minHeight: 250,
                        maxHeight: 500,
                        height: `${height ? (typeof height === 'number' ? (height + "px") : height) : (state.height + "px")}`, maxWidth: 500
                    }} alt="No product Found" />
                    <MDTypography component="h3" sx={{
                        fontWeight: "normal", textAlign: "center",
                        fontSize: "0.6em", maxWidth: "50%"
                    }}>
                        Sembra che per il momento non ci siano prodotti da visualizzare, ripassa piu tardi!</MDTypography>
                </Stack>)
            : <Fade in={true}><Stack sx={{
                height: `${height ? (typeof height === 'number' ? (height + "px") : height) : '100%'}`
            }} alignItems='center' justifyContent='center'>
                <Skeleton height={`${height ? (typeof height === 'number' ? (height + "px") : height) : '100%'}`} sx={{
                    borderRadius: 3, width: '100%',
                    backgroundColor: palette.coloredSkeleton.background
                }} variant="rounded" />
                <MinLoader sx={{ width: 25, height: 25, position: 'absolute' }} />
            </Stack></Fade>
        }
        {(footer || footer === undefined) && <FooterTable
            columns={columns}
            visibleColumns={visibleColumns}
            resultsMax={results}
            loadStatus={loadStatus}
            currentResultsLoad={data?.length || 0}
            toggleColumnVisibility={toggleColumnVisibility}
            setAllColumnsVisibility={setAllColumnsVisibility}
            impTableStatus={footerSettings && footerSettings.colSettingsLoader && footerSettings.colSettingsLoader.get ?
                footerSettings.colSettingsLoader.get : impTableStatus}
            setImpTableStatus={footerSettings && footerSettings.colSettingsLoader && footerSettings.colSettingsLoader.set ?
                footerSettings.colSettingsLoader.set : setImpTableStatus}
            data={data}
            footerSettings={footerSettings}
            infiniteScroll={infiniteScroll}
        />}

        <Tooltip key={loadStatus ? 'loading' : 'loaded'} id="general-vi-table-virtualized-tooltip" place="bottom" className='!absolute' style={{
            maxWidth: "15vw", minWidth: 150, fontSize: '0.87rem',
            textAlign: 'center', zIndex: 9999
        }} />
    </Card>);
};
