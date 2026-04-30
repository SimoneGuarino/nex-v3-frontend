// src/components/Virtualized/grouped/index.tsx
import React from 'react';

import { GroupedVI } from './GroupedVirtuoso';

import { NoData } from '../../../components/NoData/index';
import { Tooltip } from 'react-tooltip';
import { Fade, Skeleton } from '@mui/material';

// stesso SetErr usato in GroupedVI
type SetErr =
    | React.Dispatch<React.SetStateAction<boolean>>
    | ((value: boolean) => void)
    | ((e: unknown) => void);

interface GroupedVirtualizedProps {
    data: any;
    setData: React.Dispatch<React.SetStateAction<any[]>> | ((v: any[]) => void);
    tableHeight?: number | string;
    Overview?: React.ComponentType<any>;
    loadState: boolean;
    paramToTakeGroup: string | ((item: any) => string);
    rowHeight?: number;
    setErr: SetErr; // aggiornato
    RenderRow: React.ComponentType<any>;
    checkAdminDev: boolean;

    results?: number;
    infiniteScroll?: {
        func: () => Promise<boolean | string>;
        offset?: React.MutableRefObject<number> | any;
    };
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

/**
 *
 * @param data array | usestate di dati.
 * @param setData set | Array dello useState di dati.
 * @param Overview component | passa il componente al quale si vuole accedere quando viene compiuita l'azione di click sull'elemento.
 * @param loadState boolean | definisce quando far vedere la tabella o lo skeleton della tabella -- per il caricamento dati.
 * @param paramToTakeGroup string | dichiara quale parametro fare affidamento per accedere alla suddivisione in data dei gruppi tabellari.
 * @param RenderRow component | è il componente che viene visualizzato e renderizzato per ogni singolo oggetto nell'array.
 * @param rowHeight number | definisce l'altezza di ogni row
 * @param setErr boolean | set dello useState di err che definsce l'errore tabellare.
 * @param checkAdminDev funzione | permette di gestire la condizione se l'utente è uno dei ruoli passati come props in modo da far vedere solo determinate cose.
 * @param infiniteScroll { func: () => promsie, offset?: any } | La funzione verrà richiamata quando lo scroll raggiungerà gli ultimi 5 elementi.
 * inoltre specificando nell'oggetto l'offset verrà incrementato ad ogni richiamo di funzione avvenuta con successo.
 * @returns
 */
export const GroupedVirtualized: React.FC<GroupedVirtualizedProps> = ({
    data,
    setData,
    Overview,
    tableHeight,
    loadState,
    paramToTakeGroup,
    RenderRow,
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
    requestPanelStatus, openRequestPanel, closeRequestPanel,
    isGroupedItems,
}) => {
    return (
        <React.Fragment>
            {!loadState ? (
                data.length > 0 ? (
                    <GroupedVI
                        setData={setData as React.Dispatch<React.SetStateAction<any[]>>}
                        data={data}
                        Overview={Overview}
                        paramToTakeGroup={paramToTakeGroup}
                        RenderRow={RenderRow}
                        rowHeight={rowHeight}
                        setErr={setErr}
                        checkAdminDev={checkAdminDev}
                        infiniteScroll={infiniteScroll}
                        results={results}
                        tableHeight={tableHeight}
                        overviewStatus={overviewStatus}
                        setOverviewStatus={setOverviewStatus}
                        commentsPanelStatus={commentsPanelStatus}
                        openCommentsPanel={openCommentsPanel}
                        closeCommentsPanel={closeCommentsPanel}
                        requestPanelStatus={requestPanelStatus}
                        openRequestPanel={openRequestPanel}
                        closeRequestPanel={closeRequestPanel}
                        isGroupedItems={isGroupedItems}
                    />
                ) : (
                    <NoData height={70} />
                )
            ) : (
                <Fade in={true} timeout={200}>
                    <Skeleton variant="rounded" sx={{ mt: 2 }} height="100%" />
                </Fade>
            )}
            <Tooltip
                id="general-groupedVirtualized-tooltip"
                place="bottom"
                style={{
                    maxWidth: '15vw',
                    minWidth: 150,
                    fontSize: '0.87rem',
                    zIndex: 9999,
                    textAlign: 'center',
                }}
            />
        </React.Fragment>
    );
};
