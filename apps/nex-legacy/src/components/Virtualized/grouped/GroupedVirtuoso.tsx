// GroupedVI.tsx
import React from 'react';
// @Internal Packages
import './style.css';
import { UserContext } from 'context/UserContext';
// @External Packages
import { GroupedVirtuoso } from 'react-virtuoso';
import styled from '@emotion/styled';
import { Stack } from '@mui/material';

import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { MainTheme } from 'assets/settingsTheme';
import { useNexTheme } from '@nex/theme-system';

/** tipi di supporto **/

// Componente riga: lo passi come componente React che riceve questi props
export type RenderRowComponent<T> = React.ComponentType<{
    index: number;
    elm: T;
    setRowSelected: React.Dispatch<React.SetStateAction<number | null>>;
    rowSelected: number | null;
    setOverviewStatus: React.Dispatch<React.SetStateAction<boolean>>;
}>;

// setErr compatibile: accetta sia un setter React, sia un setter boolean "semplice", sia una funzione custom
type SetErr =
    | React.Dispatch<React.SetStateAction<boolean>>
    | ((value: boolean) => void)
    | ((e: unknown) => void);

// Componente Overview opzionale
export type OverviewComponent<T> = React.ComponentType<{
    element: T;
    data: T[];
    setData: React.Dispatch<React.SetStateAction<T[]>>;
    indexRowSelected: number;
    overviewStatus: boolean;
    CloseOverview: () => void;
    setErr?: SetErr;            // aggiornato
    userContext: unknown;       // se hai un tipo del tuo UserContext, sostituiscilo qui
    checkAdminDev?: boolean;
    commentsPanelStatus?: boolean;
    openCommentsPanel?: () => void;
    closeCommentsPanel?: () => void;
    requestPanelStatus?: boolean;
    openRequestPanel?: () => void;
    closeRequestPanel?: () => void;
    isGroupedItems?: React.MutableRefObject<boolean>;
}>;

// Infinite scroll helper
export interface InfiniteScrollHelper {
    func: () => Promise<unknown>;
    offset?: React.MutableRefObject<number>;
}

// props del componente principale (generiche su T = shape degli elementi di `data`)
export interface GroupedVIProps<T> {
    setData: React.Dispatch<React.SetStateAction<T[]>>;
    RenderRow: RenderRowComponent<T>;
    tableHeight?: number | string;
    data: T[];
    Overview?: OverviewComponent<T>;
    /**
     * Può essere:
     *  - una funzione che, dato l’elemento, restituisce una stringa data/ISO per il raggruppamento
     *  - una stringa “espressione” compatibile con l’uso di `eval` (backward-compat)
     *
     * N.B. l’uso di eval è sconsigliato, ma lo mantengo per fedeltà al comportamento originale.
     */
    paramToTakeGroup: string | ((item: T) => string);
    rowHeight?: number;
    setErr?: SetErr;            // aggiornato
    checkAdminDev?: boolean;
    infiniteScroll?: InfiniteScrollHelper;
    results?: number;
    overviewStatus?: boolean;
    setOverviewStatus?: React.Dispatch<React.SetStateAction<boolean>>;
    commentsPanelStatus?: boolean;
    openCommentsPanel?: () => void;
    closeCommentsPanel?: () => void;
    requestPanelStatus?: boolean;
    openRequestPanel?: () => void;
    closeRequestPanel?: () => void;
    isGroupedItems?: React.MutableRefObject<boolean>;
}

/** styled components (immutati nel comportamento) **/

const ItemContainer = (height?: number) => styled.div`
  padding: 0.5rem;
  width: 100%;
  height: ${height ? height + 'px' : 'max(calc(3vw + 3vh), 130px)'};

  display: flex;
  flex: none;
  align-content: stretch;
  box-sizing: border-box;

  @media (max-width: 1024px) {
    height: ${height ? height + 'px' : '200'};
  }
`;

const ListContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

/** componente **/

export function GroupedVI<T>({
    setData,
    RenderRow,
    tableHeight,
    data,
    Overview,
    paramToTakeGroup,
    rowHeight,
    setErr,
    checkAdminDev,
    infiniteScroll,
    results,
    overviewStatus,
    setOverviewStatus,
    commentsPanelStatus,
    openCommentsPanel,
    closeCommentsPanel,
    requestPanelStatus,
    openRequestPanel,
    closeRequestPanel,
    isGroupedItems,
}: GroupedVIProps<T>): JSX.Element {
    // tipizziamo vagamente il controller per non rompere dipendenze interne del tuo progetto
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;
    void darkMode;
    void palette;

    const [userContext] = React.useContext(UserContext) as unknown as [
        unknown,
        React.Dispatch<React.SetStateAction<unknown>>
    ];

    // stato overview
    const [internalOverview, setInternalOverview] = React.useState(false);
    const isControlled =
        typeof overviewStatus === 'boolean' && typeof setOverviewStatus === 'function';


    const open = isControlled ? (overviewStatus as boolean) : internalOverview;
    const setOpen: React.Dispatch<React.SetStateAction<boolean>> =
        isControlled
            ? (setOverviewStatus as React.Dispatch<React.SetStateAction<boolean>>)
            : setInternalOverview;
    const [rowSelected, setRowSelected] = React.useState<number | null>(null);

    // accessor per il “group key”: funzione o (compat) eval
    const getGroupKey = React.useCallback(
        (item: T): string => {
            if (typeof paramToTakeGroup === 'function') {
                return String(paramToTakeGroup(item));
            }
            // Backward-compat con il codice originale che usa eval sull'espressione
            // eslint-disable-next-line no-eval
            try {
                const e = item as unknown as Record<string, unknown>;
                return String(eval(paramToTakeGroup));
            } catch {
                return '';
            }
        },
        [paramToTakeGroup]
    );

    // calcolo gruppi fedele al tuo algoritmo
    const CalculateGroups = React.useCallback((): {
        groups: string[];
        groupCounts: number[];
    } => {
        const stack: Record<string, number> = {};
        const groups: string[] = [];
        const groupCounts: number[] = [];

        for (let i = 0; i < data.length; i++) {
            const e = data[i];
            const dateTime = getGroupKey(e);
            if (stack[dateTime]) {
                stack[dateTime]++;
            } else {
                stack[dateTime] = 1;
            }
        }

        for (const key in stack) {
            const count = stack[key];

            // differenza giorni fra oggi e la data in key
            const oggi = new Date();
            oggi.setHours(0, 0, 0, 0);
            const dateToValutate = new Date(key);
            dateToValutate.setHours(0, 0, 0, 0);

            const msInDay = 24 * 60 * 60 * 1000;
            const differenzaGiorni = Math.floor(
                (oggi.getTime() - dateToValutate.getTime()) / msInDay
            );

            let dataNameToInsert: string;
            switch (differenzaGiorni) {
                case -1:
                case 0:
                    dataNameToInsert = 'Oggi';
                    break;
                case 1:
                    dataNameToInsert = 'Ieri';
                    break;
                case 2:
                    dataNameToInsert = "L'altro ieri";
                    break;
                default:
                    dataNameToInsert = format(parseISO(key), 'dd/MM/yyyy', { locale: it });
                    break;
            }

            const checkIfDateAlreadyExist = groups.findIndex(
                (g) => g === dataNameToInsert
            );
            if (checkIfDateAlreadyExist === -1) {
                groups.push(dataNameToInsert);
                groupCounts.push(count);
            } else {
                groupCounts[checkIfDateAlreadyExist]++;
            }
        }

        return { groups, groupCounts };
    }, [data, getGroupKey]);

    const CloseOverview = React.useCallback(() => {
        setRowSelected(null);
        //setOverviewStatus(false);
        setOpen(false);
    }, [setOpen]);

    const loadOneTime = React.useRef<boolean>(false);

    const handleScroll = React.useCallback(
        (e: React.UIEvent<any>): void => {
            if (!infiniteScroll) return;

            const target = e.target as HTMLElement;
            const { scrollTop, scrollHeight, clientHeight } = target;

            if (scrollTop + clientHeight >= scrollHeight * 0.9) {
                if (results && data.length < results) {
                    if (!loadOneTime.current) {
                        loadOneTime.current = true;
                        infiniteScroll
                            .func()
                            .then(() => {
                                if (infiniteScroll.offset) {
                                    infiniteScroll.offset.current += 1;
                                }
                            })
                            .catch((err) => {
                                // eslint-disable-next-line no-console
                                console.log(
                                    "Sembra che ci sia un problema con l'infinite scroll.",
                                    err
                                );
                            })
                            .finally(() => {
                                loadOneTime.current = false;
                            });
                    }
                }
            }
        },
        [results, data.length, infiniteScroll]
    );

    // per evitare di ricalcolare ad ogni render di Virtuoso
    const { groups, groupCounts } = React.useMemo(() => CalculateGroups(), [CalculateGroups]);

    return (
        <React.Fragment>
            <Stack
                direction="row"
                height={`${tableHeight ? tableHeight : 'calc(100vh - 150px)'}`}
                width="100%"
                translate="no"
            >
                <GroupedVirtuoso
                    style={{ width: 'inherit' }}
                    components={{
                        Item: ItemContainer(rowHeight) as React.ComponentType<any>,
                        List: ListContainer as React.ComponentType<any>,
                    }}
                    // ------------------------------------------------------------------
                    // FIX: chiave stabile per ogni riga.
                    // Se la chiave è l'index, Virtuoso può riusare la stessa row e non
                    // aggiornare subito contenuti tipo unreadCount finché non avviene un
                    // evento che forza un refresh (scroll/click/lente).
                    // ------------------------------------------------------------------
                    computeItemKey={(index, item: any) => String(item?._id ?? index)}
                    itemContent={(index) => (
                        <RenderRow
                            index={index}
                            elm={data[index]}
                            setRowSelected={setRowSelected}
                            rowSelected={rowSelected}
                            //setOverviewStatus={setOverviewStatus}
                            setOverviewStatus={setOpen}
                        />
                    )}
                    groupCounts={groupCounts}
                    groupContent={(index) => (
                        <h3
                            className="
                            w-full
                            text-[1.5em] font-semibold
                            px-2 pt-2 pb-0
                            rounded-br-2xl
                            backdrop-blur-sm
                            text-slate-700
                            dark:text-neutral-100
                            "
                        >
                            {groups[index]}
                        </h3>
                    )}
                    onScroll={handleScroll}
                />
            </Stack>

            {Overview && data[rowSelected as number] ? (
                <Overview
                    element={data[rowSelected as number]}
                    data={data}
                    setData={setData}
                    indexRowSelected={rowSelected as number}
                    overviewStatus={open}
                    CloseOverview={CloseOverview}
                    setErr={setErr}
                    userContext={userContext}
                    checkAdminDev={checkAdminDev}
                    commentsPanelStatus={commentsPanelStatus}
                    openCommentsPanel={openCommentsPanel}
                    closeCommentsPanel={closeCommentsPanel}
                    requestPanelStatus={requestPanelStatus}
                    openRequestPanel={openRequestPanel}
                    closeRequestPanel={closeRequestPanel}
                    isGroupedItems={isGroupedItems}
                />
            ) : null}
        </React.Fragment>
    );
}
