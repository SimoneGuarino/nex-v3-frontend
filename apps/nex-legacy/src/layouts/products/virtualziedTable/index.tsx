// src/layouts/products/virtualziedTable/index.tsx
import React, { useEffect, useState, useCallback, useMemo, useContext, useRef } from 'react';

import './ScrollSync.css';

import Stack from '@mui/material/Stack';
import HeaderVirtualized from './headerVirtualized';
import FooterTable from './footerTable';
import RetriveElement from './retriveElement';
import NoProductFound from "assets/images/3298067.webp";

import { CookiesStoredSettings, CookiesSaveSettings } from '../../../classes/cookie';
import { icon_cart, icon_note } from 'config/icons';
import { TableVirtuoso } from 'react-virtuoso';
import { Typography } from '@mui/material';
import { PickLowest } from 'utils/index.js';
import { MainTheme } from 'assets/settingsTheme';
import { LastUpdatesAPI } from './fetchData/lastUpdates';
import { useTheme } from '@mui/material/styles';
import theme from 'assets/theme';
import { UserContext } from 'context/UserContext';

const cookieName = "product_table_settings";

interface ProductProps {
    productCode: string;
    title: string;
    avatar: any;
    codBuyer: string;
    category: string;
    brand: string;
    price: number;
    order: { quantity: number; total: number; }
}

interface ProductFromTable {
    CodiceProduttore: string;
    Descrizione: { Corta: string };
    Immagini: { Piccola: string | null };
    AssegnatoBuyer: string;
    DescrizioneFamiglia: string;
    Marca: string;
    Fornitori: any;
    distributori: any;
    Prezzo: number;
    PrezzoListino: number;
}

interface RenderLeftSideCellMemoProps {
    visibleColumns: string[];
    columns: any;
    data: any;
    rowIndex: number;
    addZeroes: (num1: number, num2: number, num3?: number) => any;
    formatData: any;
}

const RenderLeftSideCellMemo: React.FC<RenderLeftSideCellMemoProps> = ({
    visibleColumns, columns, data, rowIndex, addZeroes, formatData
}) => {
    const elm = data[rowIndex];
    const muiTheme = useTheme();

    return (
        <Stack key={rowIndex} direction='row'>
            {columns.map((col: any, index: number) => {
                const column = col;
                let style: any = elm.onEvidance ? { backgroundColor: '#f6da383d' } : {};
                let addingValue: any = {};
                let cellTextColor: string | null = null;
                let hidePrice = false;
                const notConfigColor = '#ff56561f';

                if (elm && elm.distributori !== undefined && col.type === "supplier" && !col.avoidCellColors) {
                    if (elm.distributori.length > 0) {
                        const distSetting = elm.distributori[0].Fornitori;
                        if (distSetting.length >= 1) {
                            const findDist = distSetting.findIndex((e: any) => e.name === column.label);
                            if (findDist == -1) {
                                style = {
                                    filter: "grayscale(1)",
                                    opacity: "0.3",
                                    backgroundColor: notConfigColor,
                                }
                                return (
                                    <span className='w-full min-w-[100px] p-2.5 text-end text-sm text-gray-400 place-content-center grayscale opacity-50 bg-gray-300 dark:bg-gray-800'>
                                        /
                                    </span>
                                );
                            } else {
                                hidePrice = distSetting[findDist].hidePrice;
                                if (distSetting[findDist].disabled) {
                                    style = { backgroundColor: notConfigColor }
                                }
                                if (Object.keys(distSetting[findDist]).findIndex((e: any) => e === 'idIndexOfValue') !== -1) {
                                    addingValue = {
                                        toIncrease: distSetting[findDist].toIncrese,
                                        toDecrease: distSetting[findDist].toDecrease,
                                        idIndexOfValue: distSetting[findDist].idIndexOfValue,
                                        disabled: (distSetting[findDist]?.disabled || false),
                                        hidePrice: (distSetting[findDist]?.hidePrice || false)
                                    }
                                }
                            }
                        }
                    } else {
                        style = { backgroundColor: notConfigColor }
                        cellTextColor = 'black';
                    }
                } else if (elm.distributori && Array.isArray(elm.distributori) && elm.distributori.length === 0) {
                    style = { backgroundColor: notConfigColor }
                    cellTextColor = theme.palette.mode === "dark" ? '#b4b4b4' : "#000";
                }

                const checkifInvisibleColumns = (visibleColumns.find((e: any) => e === column.label));
                const cellWidth = checkifInvisibleColumns ? (column.width < 100 ? 100 : column.width) : 0;

                let left = 0;
                for (let i = 0; i < visibleColumns.length; i++) {
                    if (visibleColumns.includes(columns[i]?.label)) {
                        left += columns[i].width < 100 ? 100 : columns[i].width;
                    }
                }
                if (!checkifInvisibleColumns) left += cellWidth;

                const modeTextColor = muiTheme.palette.mode === 'dark' ? '#b4b4b4' : 'inherit';

                return checkifInvisibleColumns && (
                    <Stack key={index} sx={{ width: cellWidth, ...style }}>
                        <RetriveElement
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
                            addingValue={addingValue}
                            textColor={cellTextColor ?? modeTextColor}
                            hidePrice={hidePrice}
                        />
                    </Stack>
                );
            })}
        </Stack>
    );
};

interface VirtualizedTableProps {
    data: any;
    setData: (prev: any) => void;
    results: number;
    totWarehouse: number | string;
    lastDateDist: any;
    UpdateTablePrice: () => void;
    impTableStatus: boolean;
    setImpTableStatus: (prev: any) => void;
    cartData: Array<ProductProps>;
    setCartData: (prev: any) => void;
    infiniteScroll?: {
        func: () => Promise<boolean | string>,
        offset?: any
    };
    abortController?: React.MutableRefObject<AbortController>;
}

export const VirtualizedTable: React.FC<VirtualizedTableProps> = ({
    data, setData, results, totWarehouse,
    lastDateDist, UpdateTablePrice, impTableStatus, setImpTableStatus, setCartData, infiniteScroll, abortController
}) => {
    const [copyData, setCopyData] = useState(data);
    const palette = MainTheme().palette;
    const [userContext] = useContext<any>(UserContext);

    const fallbackAbortRef = useRef<AbortController>(new AbortController());
    const abortRef = (abortController && (abortController as any).current)
        ? abortController
        : (fallbackAbortRef as unknown as React.MutableRefObject<AbortController>);

    const [lastUpdatesFetchedRaw, setLastUpdatesFetchedRaw] = useState<Record<string, any>>({});

    useEffect(() => {
        (async () => {
            try {
                const m = await LastUpdatesAPI({ userContext, abortController: abortRef });
                if (m && Object.keys(m).length > 0) setLastUpdatesFetchedRaw(m);
            } catch (e: any) {
                if (e?.name !== 'AbortError') { /* silent */ }
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userContext]);

    const normalizeKey = (s: string) =>
        (s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');

    const toMs = (v: any): number | null => {
        if (typeof v === 'number') return Number.isFinite(v) ? v : null;
        if (v instanceof Date) return isNaN(v.getTime()) ? null : v.getTime();
        const p = Date.parse(String(v));
        return Number.isFinite(p) ? p : null;
    };

    const isPlainObject = (v: any) => v && typeof v === 'object' && !Array.isArray(v);

    const normalizeMap = (src?: Record<string, any> | any[]) => {
        const out: Record<string, number> = {};
        if (!src) return out;

        try {
            if (Array.isArray(src)) {
                src.forEach((row) => {
                    if (!row || typeof row !== 'object') return;

                    const possibleName =
                        row.Name ?? row.name ?? row.label ?? row.distributor ?? row.Distributor ?? row.fornitore ?? null;

                    const possibleDate =
                        row.LastRetrieve ?? row.lastRetrieve ?? row.updatedAt ?? row.updateAt ?? row.date ?? row.timestamp ?? null;

                    const key = possibleName ? normalizeKey(String(possibleName)) : '';
                    const ms = toMs(possibleDate);
                    if (key && ms != null) out[key] = ms;
                });
                return out;
            }

            if (isPlainObject(src)) {
                Object.entries(src).forEach(([k, v]) => {
                    const key = normalizeKey(k);
                    const ms = toMs(v);
                    if (key && ms != null) out[key] = ms;
                });
                return out;
            }
        } catch { /* silent */ }
        return out;
    };

    const propRaw = useMemo(() => (lastDateDist !== undefined ? (lastDateDist as any) : undefined), [lastDateDist]);
    const normalizedProp = useMemo(() => normalizeMap(propRaw), [propRaw]);
    const normalizedFetched = useMemo(() => normalizeMap(lastUpdatesFetchedRaw), [lastUpdatesFetchedRaw]);
    const mergedNormalized = useMemo(() => ({ ...normalizedProp, ...normalizedFetched }), [normalizedProp, normalizedFetched]);

    // **FIX**: mantieni la baseline aggiornata quando varia la lunghezza dei dati
    useEffect(() => {
        setCopyData(data);
    }, [data.length]); // NON su `data` intero, così il reset non prende una versione già ordinata

    /*const AddToCart = (index: number, dataList: Array<Object>) => {
        if (index >= 0 && index < dataList.length) {
            const product: ProductFromTable = (dataList[index] as ProductFromTable);
            setCartData((prev: Array<ProductProps>) => {
                const check = prev.findIndex((e: ProductProps) => e.productCode === product.CodiceProduttore);
                if (check === -1) {
                    const object__: ProductProps = {
                        productCode: product.CodiceProduttore,
                        title: product.Descrizione.Corta,
                        avatar: (Object.keys((product?.Immagini || {})).includes('Piccola') ? product.Immagini.Piccola : null),
                        codBuyer: product.AssegnatoBuyer,
                        category: product.DescrizioneFamiglia,
                        brand: product.Marca,
                        price: PickLowest(product.Prezzo, product.PrezzoListino),
                        order: { quantity: 1, total: PickLowest(product.Prezzo, product.PrezzoListino) }
                    };
                    return [...prev, object__];
                } else {
                    const copy = [...prev];
                    copy[check] = {
                        ...copy[check],
                        order: {
                            quantity: copy[check].order.quantity + 1,
                            total: copy[check].order.total + PickLowest(product.Prezzo, product.PrezzoListino),
                        }
                    };
                    return copy;
                }
            })
        } else {
            return;
        }
    };*/

    const [columns, setColumns] = useState([
        { key: 'Da', label: 'Provenienza', type: 'dist_icons', sortType: 'String', sx: { width: '100%', alignItems: 'center' } },
        //{ key: [], fieldToTake: [{ key: 'Buy', type: 'icons', title: 'Aggiungi al Carrello', ariaLabel: 'buyit', icon: icon_cart(), funcAction: AddToCart, onHoverColor: "#efb530a3" }], label: 'Opzioni', type: 'info', excludeLogic: true, sx: { alignItems: 'center', width: '100%' } },
        { key: 'AssegnatoBuyer', label: 'Buyer', type: 'default', sort: true, sortType: 'String', sx: { width: '100%', alignItems: 'center' } },
        {
            key: ['CodiceProduttore'], fieldToTake: [
                { key: 'CodiceProduttore', sort: true, sortType: 'String', type: 'default' },
                { key: 'Marca', sort: true, sortType: 'String', type: 'default' },
                { key: 'CodiciGTIN', sort: true, sortType: 'String', type: 'default' },
                { key: 'note', sort: false, type: 'default', hideOnNotAvaible: true, onHover: true, leftIcon: icon_note({ mr: 0.5, width: '1rem', height: '1rem', color: palette.warning.main }), sx: { "-webkit-line-camlp": "2" } },
            ], label: 'Dettagli', type: 'default', sort: true, width: 200, sortType: 'String', multiSort: true, hideSortIcon: true,
        },
        { key: 'Descrizione', secKey: 'Corta', label: 'Descrizione', type: 'default', sort: true, sortType: 'String', width: 300 },
        {
            key: ['Prezzo', 'Disponibili'], fieldToTake: [
                { key: 'Prezzo', sort: true, sortType: 'Number', type: 'eur', info: { text: 'Prezzo Totale: ', multiplay: ['Prezzo',
                    { key: 'Totali', parent: 'Disponibilita'}
                ], sx: { color: '#ab8c3c'} }, sx: { fontSize: '14px !important' } },
                { key: { multiplay: ['Prezzo', 'Disponibili'] }, label: 'PrezzoTot', hideInRow: true, sort: true, sortType: 'Multiplay', type: 'eur' },
                { key: 'Totali', parentPropriety: 'Disponibilita', sort: true, sortType: 'Number', type: 'pz' },
                {
                    key: 'Promo',
                    sort: false,
                    type: 'promo',
                    formatedData: 'split-reverse',
                    conditionToHide: [null, undefined, false, 'N'],
                    sx: {
                        fontWeight: '600',
                        fontSize: '11px !important',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }
                },
            ], label: 'Prezzo Focelda', type: 'multiple', sort: true, sortType: 'Number', multiSort: true, width: 160,
            color: { prop: ['Prezzo', 'PrezzoListino'], type: 'lowest', cond: '>=', exclude: [0, null, undefined], }, sx: { alignItems: 'flex-end' }
        },

        // ---- fornitori
        /*{{
            key: ['Fornitori'],
            distributor: 'Esprinet',
            fieldToTake: [
                { key: 'Prezzo', type: 'eur', conditionToHide: [null, '', 0, undefined] },
                { key: '', type: 'tax', elmToTake: ['Siae', 'Raee'], conditionToHide: [null, undefined, 0], sx: { fontSize: 'calc(0.40vw + 0.40vh) !important' } },
                {
                    key: 'Promo',
                    type: 'promo',
                    condition: [null, false, undefined],
                    formatedData: 'split-reverse',
                    sx: {
                        fontWeight: '600',
                        fontSize: '11px !important',
                        color: '#e1a12c',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }
                }
            ],
            label: 'Prezzo Suggerito',
            type: 'supplier',
            sx: { alignItems: 'flex-end' },
            avoidCellColors: true
        }},*/
        { key: '', label: 'Prezzo Suggerito', type: 'suggested_price', sort: true, sortType: 'String', width: 150, sx: { alignItems: 'flex-end' }},

        {
            key: ['Fornitori'],
            distributor: 'Esprinet',
            fieldToTake: [
                { key: [{ key: 'Prezzo' }, { key: 'PrezzoListino' }], type: 'eur', conditionToHide: [null, '', 0, undefined] },
                { key: 'Disponibili', type: 'pz', conditionToHide: [null, '', 0, undefined] },
                { key: '', type: 'tax', elmToTake: ['Siae', 'Raee'], conditionToHide: [null, undefined, 0], sx: { fontSize: 'calc(0.40vw + 0.40vh) !important' } },
                {
                    key: 'Promo',
                    type: 'promo',
                    condition: [null, false, undefined],
                    formatedData: 'split-reverse',
                    sx: {
                        fontWeight: '600',
                        fontSize: '11px !important',
                        color: '#e1a12c',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }
                }
            ],
            label: 'Esprinet',
            type: 'supplier',
            sx: { alignItems: 'flex-end' }
        },
        {
            key: ['Fornitori'],
            distributor: 'Techdata',
            fieldToTake: [
                { key: [{ key: 'Prezzo' }, { key: 'PrezzoListino' }], type: 'eur', conditionToHide: [null, '', 0, undefined] },
                { key: 'Disponibili', type: 'pz', conditionToHide: [null, '', 0, undefined] },
                { key: '', type: 'tax', elmToTake: ['Siae', 'Raee'], conditionToHide: [null, undefined, 0], sx: { fontSize: 'calc(0.40vw + 0.40vh) !important' } },
                {
                    key: 'Promo',
                    type: 'promo',
                    condition: [null, false, undefined],
                    formatedData: 'split-reverse',
                    sx: {
                        fontWeight: '600',
                        fontSize: '11px !important',
                        color: '#e1a12c',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }
                }
            ],
            label: 'Techdata',
            type: 'supplier',
            sx: { alignItems: 'flex-end' }
        },
        {
            key: ['Fornitori'],
            distributor: 'ComputerGross',
            fieldToTake: [
                { key: [{ key: 'Prezzo' }, { key: 'PrezzoListino' }], type: 'eur', conditionToHide: [null, '', 0, undefined] },
                { key: 'Disponibili', type: 'pz', conditionToHide: [null, '', 0, undefined] },
                { key: '', type: 'tax', elmToTake: ['Siae', 'Raee'], conditionToHide: [null, undefined, 0], sx: { fontSize: 'calc(0.40vw + 0.40vh) !important' } },
                {
                    key: 'Promo',
                    type: 'promo',
                    condition: [null, false, undefined],
                    formatedData: 'split-reverse',
                    sx: {
                        fontWeight: '600',
                        fontSize: '11px !important',
                        color: '#e1a12c',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }
                }
            ],
            label: 'ComputerGross',
            type: 'supplier',
            sx: { alignItems: 'flex-end' }
        },
        {
            key: ['Fornitori'],
            distributor: 'Brevi',
            fieldToTake: [
                { key: [{ key: 'Prezzo' }, { key: 'PrezzoListino' }], type: 'eur', conditionToHide: [null, '', 0, undefined] },
                { key: 'Disponibili', type: 'pz', conditionToHide: [null, '', 0, undefined] },
                { key: '', type: 'tax', elmToTake: ['Siae', 'Raee'], conditionToHide: [null, undefined, 0], sx: { fontSize: 'calc(0.40vw + 0.40vh) !important' } },
                {
                    key: 'Promo',
                    type: 'promo',
                    condition: [null, false, undefined],
                    formatedData: 'split-reverse',
                    sx: {
                        fontWeight: '600',
                        fontSize: '11px !important',
                        color: '#e1a12c',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }
                }
            ],
            label: 'Brevi',
            type: 'supplier',
            sx: { alignItems: 'flex-end' }
        },
        {
            key: ['Fornitori'],
            distributor: 'Runner',
            fieldToTake: [
                { key: [{ key: 'Prezzo' }, { key: 'PrezzoListino' }], type: 'eur', conditionToHide: [null, '', 0, undefined] },
                { key: 'Disponibili', type: 'pz', conditionToHide: [null, '', 0, undefined] },
                { key: '', type: 'tax', elmToTake: ['Siae', 'Raee'], conditionToHide: [null, undefined, 0], sx: { fontSize: 'calc(0.40vw + 0.40vh) !important' } },
                {
                    key: 'Promo',
                    type: 'promo',
                    condition: [null, false, undefined],
                    formatedData: 'split-reverse',
                    sx: {
                        fontWeight: '600',
                        fontSize: '11px !important',
                        color: '#e1a12c',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }
                }
            ],
            label: 'Runner',
            type: 'supplier',
            sx: { alignItems: 'flex-end' }
        },
        {
            key: ['Fornitori'],
            distributor: 'Cometa',
            fieldToTake: [
                { key: [{ key: 'Prezzo' }, { key: 'PrezzoListino' }], type: 'eur', conditionToHide: [null, '', 0, undefined] },
                { key: 'Disponibili', type: 'pz', conditionToHide: [null, '', 0, undefined] },
                { key: '', type: 'tax', elmToTake: ['Siae', 'Raee'], conditionToHide: [null, undefined, 0], sx: { fontSize: 'calc(0.40vw + 0.40vh) !important' } },
                {
                    key: 'Promo',
                    type: 'promo',
                    condition: [null, false, undefined],
                    formatedData: 'split-reverse',
                    sx: {
                        fontWeight: '600',
                        fontSize: '11px !important',
                        color: '#e1a12c',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }
                }
            ],
            label: 'Cometa',
            type: 'supplier',
            sx: { alignItems: 'flex-end' }
        },
        {
            key: ['Fornitori'],
            distributor: 'Xpres',
            fieldToTake: [
                { key: [{ key: 'Prezzo' }, { key: 'PrezzoListino' }], type: 'eur', conditionToHide: [null, '', 0, undefined] },
                { key: 'Disponibili', type: 'pz', conditionToHide: [null, '', 0, undefined] },
                { key: '', type: 'tax', elmToTake: ['Siae', 'Raee'], conditionToHide: [null, undefined, 0], sx: { fontSize: 'calc(0.40vw + 0.40vh) !important' } },
                {
                    key: 'Promo',
                    type: 'promo',
                    condition: [null, false, undefined],
                    formatedData: 'split-reverse',
                    sx: {
                        fontWeight: '600',
                        fontSize: '11px !important',
                        color: '#e1a12c',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }
                }
            ],
            label: 'Xpres',
            type: 'supplier',
            sx: { alignItems: 'flex-end' }
        },
    ]);

    function setCookie() {
        if (!CookiesStoredSettings(cookieName)) {
            const ColumnsMap = columns.map((column) => column.label);
            CookiesSaveSettings(cookieName, ColumnsMap);
            return ColumnsMap
        } else {
            return CookiesStoredSettings(cookieName)
        }
    }

    const [visibleColumns, setVisibleColumns] = useState(setCookie()
        || columns.map((column) => column.label));
    const [defaultColumnOrder] = useState(columns.map((column) => column.label));

    useEffect(() => {
        setCookie();
        const updatedColumns = columns.map((column) => {
            const { key } = column;
            const width = column.width ? column.width : null
            let maxWidth = 0;
            const setMaxWidth = 350;

            if (Array.isArray(key)) {
                key.forEach((subKey) => {
                    maxWidth = data.reduce((max: any, item: any) => {
                        let valueWidth;
                        const cellContent = item[subKey] ? item[subKey].toString() : '';
                        const cellWidth = cellContent.length * 10;
                        valueWidth = cellWidth > setMaxWidth ? setMaxWidth : cellWidth;
                        return Math.max(max, valueWidth);
                    }, maxWidth);
                });
            } else {
                maxWidth = data.reduce((max: any, item: any) => {
                    let valueWidth;
                    let cellContent;
                    if (column.secKey) {
                        cellContent = item[key][column.secKey] ? item[key][column.secKey].toString() : '';
                    } else {
                        cellContent = item[key]?.toString?.() || '';
                    }
                    const cellWidth = cellContent.length * 10;
                    valueWidth = cellWidth > setMaxWidth ? setMaxWidth : cellWidth;
                    return Math.max(max, valueWidth);
                }, (typeof key === 'string' ? key.length : 0) * 8);
            }
            return { ...column, width: width ? width : maxWidth, maxWidth: 250 };
        });
        setColumns((updatedColumns as any));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const addZeroes = useCallback((num1: number, num2: number, num3?: number) => {
        const sum = num2 !== undefined ? (num3 !== undefined ? num1 + num2 + num3 : num1 + num2) : num1;
        const formattedPriceString = (sum || 0).toLocaleString("it-IT", {
            style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2,
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
        CookiesSaveSettings(cookieName, newVisibleColumns);
        UpdateTablePrice();
    };

    const [state] = useState({
        columnWidth: 75,
        columnCount: columns.length,
        height: '100%',
        overscanColumnCount: 0,
        overscanRowCount: 5,
        rowHeight: 80,
    });

    const memoRender = React.useCallback(() => {
        return (
            <TableVirtuoso
                style={{ height: state.height }}
                data={data}
                itemContent={index => (
                    <RenderLeftSideCellMemo
                        key={index}
                        rowIndex={index}
                        visibleColumns={visibleColumns}
                        columns={columns}
                        data={data}
                        formatData={formatData}
                        addZeroes={addZeroes}
                    />
                )}
                fixedHeaderContent={() => (
                    <div style={{ height: state.rowHeight - 10, overflow: 'auto', borderRadius: '8px' }}>
                        <HeaderVirtualized
                            whereToFindData="dati"
                            columns={columns}
                            visibleColumns={visibleColumns}
                            lastDateDist={mergedNormalized}
                            setData={setData}
                            copyData={copyData}
                        />
                    </div>
                )}
                rangeChanged={handleRangeChanged}
            />
        );
    }, [data, columns, state.height, visibleColumns, copyData, formatData, addZeroes, setData, mergedNormalized]);

    const loadOneTime = React.useRef(false);
    const handleRangeChanged = (range: any) => {
        if (infiniteScroll) {
            const buffer = 5;
            const { endIndex } = range;
            if (endIndex >= data.length - buffer) {
                if (results ? data.length < results : true) {
                    if (!loadOneTime.current) {
                        loadOneTime.current = true;
                        return infiniteScroll.func().then(() => {
                            if (infiniteScroll.offset) infiniteScroll.offset.current += 1;
                            loadOneTime.current = false;
                        }).catch(() => { /* silent */ });
                    }
                }
            }
        }
    };

    const setAllColumnsVisibility = useCallback(
        (mode: 'show' | 'hide' | 'toggle') => {
            const allLabels = columns.map((c: any) => c.label);
            const allVisible = visibleColumns.length === allLabels.length;
            let nextVisible: string[];
            if (mode === 'show') nextVisible = allLabels;
            else if (mode === 'hide') nextVisible = [];
            else nextVisible = allVisible ? [] : allLabels;
            setVisibleColumns(nextVisible);
        },
        [columns, visibleColumns.length]
    );

    return (
        <React.Fragment>
            {data.length > 0 ? memoRender()
                :
                <Stack sx={{ padding: "0 0 40px", alignItems: "center", filter: 'grayscale(1)', opacity: 0.65, }}>
                    <img src={NoProductFound} style={{ width: "100%", maxWidth: 500 }} alt="No product Found" />
                    <Typography component="h3" style={{ fontWeight: "normal", textAlign: "center", fontSize: "0.6em", maxWidth: "50%" }}>
                        Sembra che per il momento non ci siano prodotti da visualizzare, ripassa piu tardi!
                    </Typography>
                </Stack>
            }
            <FooterTable
                columns={columns}
                visibleColumns={visibleColumns}
                resultsMax={results}
                currentResultsLoad={data.length}
                totWarehouse={totWarehouse}
                toggleColumnVisibility={toggleColumnVisibility}
                impTableStatus={impTableStatus}
                setImpTableStatus={setImpTableStatus}
                data={data}
                setAllColumnsVisibility={setAllColumnsVisibility}
            />
        </React.Fragment>
    );
};

