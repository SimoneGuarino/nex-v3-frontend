import React from 'react';
import { Fade, Stack } from '@mui/material';
import { GroupedVirtualized } from 'components/Virtualized/grouped';
import { RenderRow } from './renderRow';
import { Overview } from '../overview';
import { UserState } from 'types/UserContext';


interface DataClientProps {
    stato: 0 | 1 | 2,
    codiceFb: number | string,
    cliente: {
        nome: string;
        codice: string;
        codiceIot: string
        email: string;
    };
    creata: {
        data: any;
        nota: string;
        da: {
            _id: string;
            username: string;
        };
    },
    prodotti: {
        ordineTotale: number;
        dati: Array<any>;
    }
    fido: {
        focelda: {
            fatturati: object;
            totale: number;
            residuo: number;
        }
        iot: {
            fatturati: object;
            totale: number;
            residuo: number;
        }
    };
};
interface TableProps {
    data: Array<DataClientProps>;
    onLoad: boolean;
    checkAdminDev: boolean;
    userContext: UserState;
    infiniteScroll: any;
    ofs: any;
    tableTotalData: number;

    setData: (prev: any) => void;
    setErr: (prev: boolean) => void;
    overviewStatus: boolean;
    setOverviewStatus: React.Dispatch<React.SetStateAction<boolean>>;
    commentsPanelStatus?: boolean;
    openCommentsPanel?: () => void;
    closeCommentsPanel?: () => void;
    requestPanelStatus?: boolean;
    openRequestPanel?: () => void;
    closeRequestPanel?: () => void;
    isGroupedItems: React.MutableRefObject<boolean>;
    onViewedRow: (idBlock: string) => void;
}
export const Table: React.FC<TableProps> = ({ data, setData, onLoad, setErr, checkAdminDev, ofs, infiniteScroll, tableTotalData, overviewStatus, setOverviewStatus, commentsPanelStatus,
    openCommentsPanel, closeCommentsPanel, requestPanelStatus, openRequestPanel, closeRequestPanel, isGroupedItems, onViewedRow }) => {
    return <Fade in={true} timeout={1000}><Stack height='100%'>
        <GroupedVirtualized
            data={data}
            setData={setData}
            loadState={onLoad}
            paramToTakeGroup='e.creata.data'
            // RenderRow={RenderRow}
            RenderRow={(props: any) => (
                <RenderRow
                    {...props}
                    onViewedRow={onViewedRow}
                />
            )}
            rowHeight={100}
            results={tableTotalData}
            Overview={Overview}
            setErr={setErr}
            checkAdminDev={checkAdminDev}
            infiniteScroll={{
                func: infiniteScroll,
                offset: ofs
            }}
            tableHeight='100%'
            overviewStatus={overviewStatus}
            setOverviewStatus={setOverviewStatus}
            commentsPanelStatus={commentsPanelStatus}
            openCommentsPanel={openCommentsPanel}
            closeCommentsPanel={closeCommentsPanel}
            requestPanelStatus={requestPanelStatus}
            openRequestPanel={openRequestPanel}
            closeRequestPanel={closeRequestPanel}
            isGroupedItems={isGroupedItems}
        /></Stack>
    </Fade>
}