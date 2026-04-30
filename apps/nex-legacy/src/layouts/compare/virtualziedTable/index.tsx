import React, { useEffect, useState, useMemo, useCallback, useContext, useRef } from 'react';

import { UserContext } from "context/UserContext";
import { ReintegrateItem } from './fetchData/actions/reintegrateItem';
import { ExcludeItem } from './fetchData/actions/excludeItem';

import { LuMessagesSquare } from "react-icons/lu";
import { IoMdClose } from "react-icons/io";
import { GoGraph } from "react-icons/go";

import { TableVirtualized } from 'components/Virtualized/table';
import { DistsListAPI } from './fetchData/distList';
import { LastUpdatesAPI } from './fetchData/lastUpdates';
import { DistVariations, Variation } from './distVariations';
import { Product } from 'config/interfaces';
import { Badge, Fade, Skeleton } from '@mui/material';
import { enqueueSnackbar } from 'components/MessageBox';
import { useTour } from "tour/TourProvider";
import { ContextMenu } from 'components/UI/menu/ContextMenu';
import CommentsPanel from './comments/CommentsPanel';
import FDIconButton from 'components/UI/buttons/FDIconButton';


// ——————————————————————————————————————————————————————————
// CONSTANTS
// ——————————————————————————————————————————————————————————
const LuMessagesSquareIcon = LuMessagesSquare  as React.FC<{ size?: number }>;
const IoIosCloseIcon = IoMdClose as React.FC<{ size?: number }>;
const GoGraphIcon = GoGraph as React.FC<{ size?: number }>;
let localPanelMode = 0;


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACE
// ——————————————————————————————————————————————————————————
interface ColumnFieldToTake {
    key: string | object | Array<string | object>;
    type?: string;
    title?: string;
    ariaLabel?: string;
    icon?: React.ReactNode;
    funcAction?: (...args: any[]) => void;
    onHoverColor?: string;
    label?: string;
    sort?: boolean;
    sortType?: string | number;
    nameToShow?: string;
    parentPropriety?: string;
    parentKey?: string;
    multiplay?: any;
    hideInRow?: boolean;
    formatedData?: string;
    conditionToHide?: any[];
    condition?: any[];
    sx?: React.CSSProperties | { [key: string]: any };
    icons?: string;
    elmToTake?: string[];
    color?: any;
    onHover?: boolean;
    sxText?: React.CSSProperties;
    info?: any;
    dataTour?: any;
};

interface Column {
    key: string | string[] | object;
    fieldToTake?: ColumnFieldToTake[];
    label: string;
    type: string;
    excludeLogic?: boolean;
    sx?: React.CSSProperties | { [key: string]: any };
    sort?: boolean;
    sortType?: string;
    multiSort?: boolean | string;
    width?: number;
    maxWidth?: number;
    secKey?: string;
    parentPropriety?: string;
};

interface VirtualizedTableProps {
    data: any[];
    setData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
    dataTotal: number;
    totWarehouse?: any;
    panelMode: number;
    lastDateDist?: Record<string, string | number | Date>; // ← può arrivare dal parent
    distList: string[];
    setDistList: React.Dispatch<React.SetStateAction<string[]>>;
    infiniteScroll: () => Promise<any>;
    offset: React.MutableRefObject<number>;
    abortController?: React.MutableRefObject<AbortController>;
    UpdateTablePrice?: any; AssaignURLParametsToState: () => string;
    impTableStatus?: any;
    setImpTableStatus?: React.Dispatch<React.SetStateAction<any>>;
    variationPanel: boolean;
    setVariationPanel: React.Dispatch<React.SetStateAction<boolean>>;
    loading?: boolean;
    onBottomReached?: () => void;
    rowHeight?: number;
    height?: number;
    loadStatus: { [key: string]: boolean };
    ChangeLoadStatus: (params: { from: string; bool: boolean }) => void;
    registerCommentsClose?: (fn: () => void) => void;
    variationData: Variation[];
    setVariationData: (prev: Variation[]) => void;
};


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
export function VirtualizedTable(props: VirtualizedTableProps) {
    const { variationData, setVariationData, data, setData, dataTotal, totWarehouse, panelMode, lastDateDist: lastDateDistProp } = props;
    const { distList, setDistList } = props;
    const { offset, infiniteScroll } = props;
    const { loadStatus, ChangeLoadStatus, abortController } = props;
    const { UpdateTablePrice, AssaignURLParametsToState } = props;
    const { variationPanel, setVariationPanel, impTableStatus, setImpTableStatus } = props;
    const { registerCommentsClose } = props;

    const [lastUpdatesFetched, setLastUpdatesFetched] = useState<Record<string, number>>({});

    const [userContext] = useContext<any>(UserContext);
    const [itemInspect, setItemInspect] = useState<Product | null>(null);
    const { isOpen: tourIsOpen, index: tourIndex } = useTour();
    const lockExclude = tourIsOpen && tourIndex === 20;

    useEffect(() => {
        localPanelMode = panelMode;
    }, [panelMode]);

    const ChooseItemStatus = useCallback((itemId: any, alldata: any) => {
        if (localPanelMode !== 0) {
            ReintegrateItem(alldata, setData, userContext, abortController, itemId);
        } else {
            ExcludeItem(alldata, setData, userContext, abortController, itemId);
        }
    }, [panelMode, data, setData, userContext, abortController]);

    const IteamInspectVariation = useCallback((itemIndex: any, alldata: any) => {
        setItemInspect(alldata[itemIndex]);
        setVariationPanel(true);
    }, [panelMode, data, setVariationPanel]);

    // Nuovo sistema: ContextMenu per commenti (placeholder panel)
    const commentsPosRef = useRef<HTMLElement | null>(null);
    const [commentsOpen, setCommentsOpen] = useState(false);
    const [commentRow, setCommentRow] = useState<any | null>(null);

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, row: any) => {
        event.stopPropagation();
        commentsPosRef.current = event.currentTarget;
        setCommentRow(row);
        setCommentsOpen(true);
    };

    const handleCloseMenu = () => {
        setCommentsOpen(false);
        setCommentRow(null);
        commentsPosRef.current = null;
    };

    if (typeof registerCommentsClose === "function") {
        registerCommentsClose(handleCloseMenu);
    };

    // ————————————————————————————————————————————————————————————————
    // helper: calcolo totale costo medio (usato nella preparazione dati)
    const calcCostoMedioTot = (row: any) => {
        const base = row?.dati ?? row;
        const cm = Number(base?.CostoMedioGestionale);
        const q = Number(base?.Disponibilita?.Totali);
        if (!Number.isFinite(cm) || !Number.isFinite(q)) return 0;
        return cm * q;
    };

    // prepara i dati per la tabella senza toccare lo state
    const dataPrepared = useMemo(() => {
        if (!Array.isArray(data)) return data as any;

        const mapped = data.map((row: any) => {
            const base = row?.dati ?? row;
            const totale = calcCostoMedioTot(row);

            // inietto il campo dove la tabella va a leggere (dentro 'dati' se c’è)
            if (row?.dati) {
                return { ...row, dati: { ...base, CostoMedioTotaleCalc: totale } };
            }
            return { ...row, CostoMedioTotaleCalc: totale };
        });

        return mapped;
    }, [data]);
    // ————————————————————————————————————————————————————————————————

    const [columns, setColumns] = useState<Column[]>(() => {
        return [
            {
                key: [],
                fieldToTake: [
                    { key: 'Exclude', type: 'button', title: 'Rimanda il record', ariaLabel: 'escludi', icon: <IoIosCloseIcon />, funcAction: ChooseItemStatus, dataTour: "comp-record" },
                    { 
                        key: 'Comments', 
                        type: 'custom',
                        render: ({elm, index} : {elm: any, index: number}) => (
                            <FDIconButton
                                key={index}
                                icon={<Badge badgeContent={elm.Comments?.length || 0} color="warning" max={999}>
                                    <LuMessagesSquareIcon /></Badge>}
                                aria-label="commenta"
                                onClick={(e) => handleOpenMenu(e, elm)}
                                data-tour="comp-comment"
                            />
                        )
                    }
                ],
                label: 'Opzioni',
                type: 'info',
                excludeLogic: true,
                sx: { gap: 0.5 },
                width: 150
            },
            {
                key: [],
                fieldToTake: [
                    { key: 'Variance', type: 'button', title: 'Variazioni Prezzo & Stock Fornitori', ariaLabel: 'escludi', icon: <GoGraphIcon />, funcAction: IteamInspectVariation, onHoverColor: '#9797976b', dataTour: "comp-variaz" },
                ],
                label: 'Variazioni',
                type: 'info',
                excludeLogic: true,
                width: 150
            },
            {
                key: ['CodiceProduttore', 'Marca', 'CodiciGTIN'],
                label: 'Dettagli',
                fieldToTake: [
                    { key: 'CodiceProduttore', sort: true, sortType: 'String', type: 'default' },
                    { key: 'Marca', sort: true, sortType: 'String', type: 'default' },
                    {
                        key: 'CodiciGTIN', sort: true, sortType: 'Number', type: 'default', onHover: true, sxText: {
                            display: "-webkit-box",
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            height: 'auto !important',
                            textOverflow: "ellipsis",
                            WebkitLineClamp: "2"
                        }
                    },
                ],
                type: 'multiple',
                sort: true,
                multiSort: 'true',
                width: 180,
            },
            {
                secKey: 'Corta',
                key: 'Descrizione',
                label: 'Descrizione',
                type: 'default',
                sort: true,
                sortType: 'String',
                onHover: true,
                sxText: {
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    height: 'auto !important',
                    textOverflow: "ellipsis",
                    WebkitLineClamp: "2"
                },
                width: 300
            },
            {
                key: ['Prezzo', 'Disponibili'],
                fieldToTake: [
                    {
                        key: 'Prezzo', sort: true, sortType: 'Number', type: 'eur', onHover: true,
                        info: [
                            { text: 'Sisvel: ', key: "Sisvel" },
                            { text: 'Vat: ', key: "Vat" },
                            { text: 'Prezzo Totale: ', multiplay: ['Prezzo', { key: 'Totali', parentPropriety: 'Disponibilita' }] }
                        ],
                        sx: { fontSize: '14px !important' }
                    },
                    { key: { multiplay: [{ key: 'Prezzo' }, { key: 'Disponibilita', secKey: 'Totali' }] }, label: 'PrezzoTot', hideInRow: true, sort: true, sortType: 'multiplay', type: 'eur' },
                    { key: 'Disponibilita', secKey: 'Totali', nameToShow: 'Disponibilità', sort: true, sortType: 'Number', type: 'pz' },
                    { key: 'Promo', sort: false, type: 'promo', formatedData: 'split-reverse', conditionToHide: [null, undefined, false, 'N'], sx: { fontWeight: '600', fontSize: '11px !important' } }
                ],
                label: 'Prezzo',
                type: 'multiple',
                sort: true,
                sortType: 'Number',
                multiSort: true,
                width: 140,
                color: { prop: ['Prezzo', 'PrezzoListino'], type: 'lowest', cond: '>=', exclude: [0, null, undefined], true: '#ff62621f', false: '#9bc3ff29' },
                sx: { alignItems: 'flex-end' }
            },
            // c.m. gestionale — solo sort su CostoMedioGestionale (no multisort, no campo nascosto)
            {
                key: ['CostoMedioGestionale'],
                fieldToTake: [
                    {
                        key: 'CostoMedioGestionale',
                        nameToShow: "Costo Medio Gestionale",
                        sort: true,
                        sortType: 'Number',
                        type: 'eur',
                        onHover: true,
                        info: [{ text: 'Totale Costo Medio: ', key: 'CostoMedioTotaleCalc' }],
                        sx: { fontSize: '14px !important' }
                    }
                ],
                label: 'C.m. gestionale',
                type: 'multiple',
                sort: true,
                sortType: 'Number',
                multiSort: true,
                sx: { alignItems: 'flex-end' }
            },
        ];
    });

    const columnsWithLock = useMemo(() => {
        if (!lockExclude) return columns;

        return columns.map(col => {
            if (!Array.isArray(col.fieldToTake)) return col;

            const fieldToTake = col.fieldToTake.map(f => {
                if (f.key === 'Exclude') return { ...f, loadState: true };
                return f;
            });

            return { ...col, fieldToTake };
        });
    }, [columns, lockExclude]);

    async function getDistColumns(): Promise<Column[] | void> {
        ChangeLoadStatus({ from: 'distList', bool: true });
        return DistsListAPI({ userContext, abortController, columns, ChangeLoadStatus, setDistList, setLastUpdates: setLastUpdatesFetched });
    }

    useEffect(() => {
        getDistColumns()
            .then((col_updated: Column[] | void) => {
                setColumns((col_updated || columns));
            })
            .finally(() => {
                ChangeLoadStatus({ from: 'distList', bool: false });
            })
            .catch((errorState: any) => {
                if (errorState.name !== 'AbortError') {
                    let error_ = "";
                    const error: string | { [key: string]: string } | undefined = errorState?.message;
                    if (error) {
                        if (typeof error === 'string') {
                            error_ = (error as any).message;
                        } else if (error !== undefined && (error as any)?.msg) {
                            error_ = (error as any).msg;
                        }
                    }
                    if (!error_ || error_.trim() === "") {
                        error_ = "Sembra che ci sia stato un problema nel retrive dei dati nella tabella, perfavore contatta un tecnico.";
                    }
                    enqueueSnackbar(error_, { title: 'Ops..', type: 'error' });
                }
            });

        return () => {
            setData([]);
            setColumns([]);
            setDistList([]);
            setVariationPanel(false);
            setItemInspect(null);

            // ✅ chiusura ContextMenu commenti
            setCommentsOpen(false);
            setCommentRow(null);
            commentsPosRef.current = null;

            ChangeLoadStatus({ from: 'table', bool: false });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // fallback: se la prima fetch non porta date, prova con LastUpdatesAPI
    useEffect(() => {
        if (Object.keys(lastUpdatesFetched).length === 0 && distList && distList.length > 0) {
            (async () => {
                try {
                    const m = await LastUpdatesAPI({ userContext, abortController });
                    if (m && Object.keys(m).length > 0) setLastUpdatesFetched(m);
                } catch (e) {
                    // noop
                }
            })();
        }
    }, [distList, lastUpdatesFetched, userContext, abortController]);

    const normalizeKey = (s: string) =>
        (s || '')
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '');

    const normalizeMap = (src?: Record<string, string | number | Date>) => {
        const out: Record<string, number> = {};
        if (!src) return out;
        Object.entries(src).forEach(([k, v]) => {
            const key = normalizeKey(k);
            let ms: number | null = null;
            if (typeof v === 'number') ms = Number.isFinite(v) ? v : null;
            else if (v instanceof Date) ms = isNaN(v.getTime()) ? null : v.getTime();
            else {
                const p = Date.parse(String(v));
                ms = Number.isFinite(p) ? p : null;
            }
            if (ms != null && key) out[key] = ms;
        });
        return out;
    };

    const normalizedProp = useMemo(() => normalizeMap(lastDateDistProp), [lastDateDistProp]);
    const normalizedFetched = useMemo(() => normalizeMap(lastUpdatesFetched), [lastUpdatesFetched]);
    const mergedLastDateDist = useMemo(() => ({ ...normalizedProp, ...normalizedFetched }), [normalizedProp, normalizedFetched]);

    return (
        !loadStatus.distList ? (
            <>
                <TableVirtualized
                    tableType='bottom-line'
                    data={dataPrepared}
                    whereToFindData="dati"
                    setData={setData}
                    columns={columnsWithLock}
                    minColWidth={150}
                    setColumns={setColumns}
                    results={dataTotal}
                    loadStatus={loadStatus.table}
                    cookie='stored_settings'
                    lastDateDist={mergedLastDateDist}
                    infiniteScroll={{
                        func: infiniteScroll,
                        offset: offset,
                    }}
                    footerSettings={{
                        showColSettings: true,
                        callbackColSettings: () => UpdateTablePrice(AssaignURLParametsToState()),
                        totWarehouse: totWarehouse,
                        colSettingsLoader: {
                            get: impTableStatus,
                            set: setImpTableStatus
                        }
                    }}
                />

                {variationPanel && (
                    <DistVariations
                        data={variationData}
                        setData={setVariationData}
                        status={variationPanel}
                        onClose={() => setVariationPanel(false)}
                        distList={distList}
                        product={itemInspect}
                        loading={loadStatus.variance}
                        ChangeLoadStatus={ChangeLoadStatus}
                    />
                )}

                <ContextMenu
                    openFor={commentsOpen}
                    pos={commentsPosRef as React.RefObject<HTMLElement | null>}
                    onClose={() => handleCloseMenu()}
                    placement="bottom-start"
                    panel={
                        <CommentsPanel
                            row={commentRow}
                            abortController={abortController}
                        />
                    }
                />
            </>
        ) : (
            <Fade in={true} timeout={200}>
                <Skeleton variant="rounded" height='100%' />
            </Fade>
        )
    );
};