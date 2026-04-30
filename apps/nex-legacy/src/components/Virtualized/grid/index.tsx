import React, { useEffect, useState, useRef, useCallback, useContext } from 'react';

import styles from './ScrollSync.css';

import { AutoSizer, Grid, ScrollSync } from 'react-virtualized';
import type { GridCellProps, ScrollSyncChildProps } from 'react-virtualized';
import clsx from 'clsx';

import scrollbarSize from 'dom-helpers/scrollbarSize';

import Footer from './footer';

import Stack from '@mui/material/Stack';
import HeaderVirtualized from './headerVirtualized';

import RetriveElement from './retriveElement';

import NoProductFound from 'assets/images/3298067.webp';
import MDTypography from 'components/MDTypography';

// tipi importati/usati anche da HeaderVirtualized
export type SortType = 'String' | 'Number' | 'Multiplay';

// schema minimo di colonna compatibile con HeaderVirtualized + RetriveElement
export type FieldEntry = {
    key?: string | { multiplay?: string[] } | unknown;
    label?: string;
    sort?: boolean;
    sortType?: SortType;
    fieldToTake?: FieldEntry[];
};

export type ColumnForHeader = {
    label: string;
    key: string | string[];
    width: number;
    sort?: boolean;
    sortType?: SortType;
    multiSort?: boolean;
    type?: 'supplier' | 'info' | 'multiple' | 'multipleKeepa' | 'commentsAllert' | 'eur' | string;
    color?: string;
    sx?: unknown;
    labelsx?: React.CSSProperties;
    fieldToTake?: FieldEntry[];
};

type HeaderState = {
    columnWidth: number;
    columnCount: number;
    height: number;
    overscanColumnCount: number;
    overscanRowCount: number;
    rowHeight: number;
};

type LastDate = { LastRetrieve?: string };

type GridVIProps<Row extends Record<string, unknown> & { onEvidance?: boolean }> = {
    data: Row[];
    setData: (updater: (prev: any) => any) => void;
    whereToFindData?: string;
    InfiniteScroll?: () => void;
    lastDateDist?: LastDate; // viene passato a HeaderVirtualized
    footer?: boolean;
    visibleColumns: string[];
    onTimeCallRef: React.MutableRefObject<boolean>;
    columns_props: ColumnForHeader[];
    abortController?: AbortController;
    loadMoreElementsStatus?: boolean;
    dataTotal?: number;
};

function GridVI<Row extends Record<string, unknown> & { onEvidance?: boolean }>(props: GridVIProps<Row>) {
    const {
        data,
        setData,
        whereToFindData,
        InfiniteScroll,
        lastDateDist,
        footer,
        visibleColumns,
        onTimeCallRef,
        columns_props,
        // abortController, // non usato qui
        loadMoreElementsStatus,
        dataTotal,
    } = props;

    const bodyRef = useRef<any>(null);
    const parentRef = useRef<HTMLDivElement | null>(null);

    // copia per reset
    const [copyData, setCopyData] = useState<typeof data>(data);

    // pannello commenti
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [tempCommentsElm, setTempCommentsElm] = useState<any[]>([]);

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, c: any[]) => {
        setAnchorEl(event.currentTarget);
        setTempCommentsElm(c);
    };
    const handleCloseMenu = () => setAnchorEl(null);

    // colonne (con calcolo larghezza)
    const [columns, setColumns] = useState<ColumnForHeader[]>(columns_props);

    useEffect(() => {
        const updatedColumns = columns.map((column) => {
            const { key } = column;
            let maxWidth = 0;

            if (!column.width) {
                if (Array.isArray(key)) {
                    key.forEach((subKey) => {
                        maxWidth = data.reduce((max, item) => {
                            const cellContent = item[subKey] ? String(item[subKey]) : '';
                            const cellWidth = cellContent.length * 10;
                            return Math.max(max, cellWidth);
                        }, maxWidth);
                    });
                } else {
                    maxWidth = data.reduce((max, item) => {
                        const cellContent = item[key] ? String(item[key]) : '';
                        const cellWidth = cellContent.length * 10;
                        return Math.max(max, cellWidth);
                    }, key.length * 8);
                }
            } else {
                maxWidth = column.width;
            }

            return { ...column, width: maxWidth };
        });

        setColumns(updatedColumns);
    }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

    // somma + formattazione EUR
    const addZeroes = useCallback(
        (num1?: any, num2?: any, num3?: any) => {
            const num_1_c = parseFloat(num1);
            const num_2_c = parseFloat(num2);
            const num_3_c = parseFloat(num3);

            const sum =
                num2 !== undefined ? (num3 !== undefined ? num_1_c + num_2_c + num_3_c : num_1_c + num_2_c) : num_1_c;

            return (sum || 0).toLocaleString('it-IT', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
        },
        [data]
    );

    // formattazione date
    const formatData = useCallback((type: 'split-reverse' | string, text: any) => {
        let formatedText = text;

        switch (type) {
            case 'split-reverse':
                formatedText = formatedText !== null ? formatedText.toLocaleString('it-IT') : formatedText;
                break;
        }

        return formatedText;
    }, []);

    const [state, setState] = useState<HeaderState>({
        columnWidth: 75,
        columnCount: columns.length,
        height: 540,
        overscanColumnCount: 0,
        overscanRowCount: 5,
        rowHeight: 80,
    });

    const _renderBodyCell = ({ columnIndex, key, rowIndex, style }: GridCellProps) => {
        return _renderLeftSideCell({ columnIndex, key, rowIndex, style });
    };

    const _renderLeftSideCell = (
        { columnIndex, key, rowIndex, style }: Pick<GridCellProps, 'columnIndex' | 'key' | 'rowIndex' | 'style'>
    ) => {
        const elm = data[rowIndex] as Row;
        const column = columns[columnIndex];

        const rowClass =
            rowIndex % 2 === 0
                ? columnIndex % 2 === 0
                    ? (styles as any).evenRow
                    : (styles as any).oddRow
                : columnIndex % 2 !== 0
                    ? (styles as any).evenRow
                    : (styles as any).oddRow;

        const classNames = clsx(rowClass, (styles as any).cell);

        const checkifInvisibleColumns = visibleColumns.find((v) => v === column.label);
        const cellWidth = checkifInvisibleColumns ? (column.width < 100 ? 100 : column.width) : 0;

        // left in base alle visibili
        let left = 0;
        for (let i = 0; i < columnIndex; i++) {
            if (visibleColumns.includes(columns[i].label)) {
                left += columns[i].width < 100 ? 100 : columns[i].width;
            }
        }

        if (!checkifInvisibleColumns) {
            left += cellWidth;
        }

        return (
            checkifInvisibleColumns && (
                <Stack
                    className={classNames}
                    key={key}
                    style={{ ...style, width: cellWidth, left }}
                    sx={
                        elm.onEvidance
                            ? { backgroundColor: '#f6da383d' }
                            : rowIndex % 2 === 0
                                ? { backgroundColor: '#ededed', borderBottom: '1px solid #ccc' }
                                : { borderBottom: '1px solid #ccc' }
                    }
                >
                    <RetriveElement
                        // visibleColumns={visibleColumns}
                        elm={elm as any}
                        index={rowIndex}
                        addZeroes={addZeroes}
                        formatData={formatData}
                        columns={columns as any}
                        data={data as any}
                        handleOpenMenu={handleOpenMenu as any}
                        columnIndex={columnIndex}
                    />
                </Stack>
            )
        );
    };

    return (
        <>
            {data.length > 0 ? (
                <>
                    <ScrollSync>
                        {({ clientHeight, onScroll, scrollHeight, scrollLeft, scrollTop }: ScrollSyncChildProps) => {
                            // near bottom
                            const threshold = 5;
                            const isNearBottom = scrollTop > scrollHeight - clientHeight - threshold;

                            if (InfiniteScroll) {
                                if (isNearBottom) {
                                    if (onTimeCallRef.current === false && scrollTop !== 0) {
                                        onTimeCallRef.current = true;
                                        InfiniteScroll();
                                    }
                                }
                            }

                            const middleColor = '#ffffff';

                            return (
                                <AutoSizer disableHeight>
                                    {({ width }) => (
                                        <div>
                                            <div
                                                style={{
                                                    color: '#fff',
                                                    height: state.rowHeight - 10,
                                                    width: width - scrollbarSize(),
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                <HeaderVirtualized
                                                    styles={{ ...(styles as any), overflow: 'visible' }}
                                                    columns={columns}
                                                    state={state}
                                                    width={width}
                                                    scrollbarSize={scrollbarSize}
                                                    scrollLeft={scrollLeft}
                                                    visibleColumns={visibleColumns}
                                                    lastDateDist={lastDateDist}
                                                    setData={setData}
                                                    copyData={copyData}
                                                    whereToFindData={whereToFindData}
                                                />
                                            </div>

                                            <div
                                                ref={parentRef}
                                                style={{
                                                    color: middleColor,
                                                    height: state.height,
                                                    width,
                                                }}
                                            >
                                                <Grid
                                                    ref={bodyRef}
                                                    key={JSON.stringify(visibleColumns) + JSON.stringify(data)}
                                                    className={(styles as any).BodyGrid}
                                                    columnWidth={(params) => {
                                                        const column = columns[params.index];
                                                        return visibleColumns.includes(column.label)
                                                            ? column.width < 100
                                                                ? 100
                                                                : column.width
                                                            : 0;
                                                    }}
                                                    columnCount={state.columnCount}
                                                    height={state.height}
                                                    onScroll={onScroll}
                                                    overscanColumnCount={state.overscanColumnCount}
                                                    overscanRowCount={state.overscanRowCount}
                                                    cellRenderer={_renderBodyCell}
                                                    rowHeight={state.rowHeight}
                                                    rowCount={data.length}
                                                    width={width}
                                                    scrollTop={scrollTop}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </AutoSizer>
                            );
                        }}
                    </ScrollSync>

                    {footer && (
                        <Footer
                            resultsMax={dataTotal || data.length}
                            currentResultsLoad={data.length}
                            loadMoreElementsStatus={loadMoreElementsStatus}
                        />
                    )}
                </>
            ) : (
                <Stack sx={{ padding: '0 0 40px', alignItems: 'center' }}>
                    <img src={NoProductFound} style={{ width: '100%', maxWidth: 500 }} alt="No product Found" />
                    <MDTypography
                        component="h3"
                        style={{ fontWeight: 'normal', textAlign: 'center', fontSize: '0.6em', maxWidth: '50%' }}
                    >
                        Sembra che per il momento non ci siano prodotti da visualizzare, ripassa piu tardi!
                    </MDTypography>
                </Stack>
            )}
        </>
    );
}

export default GridVI;
