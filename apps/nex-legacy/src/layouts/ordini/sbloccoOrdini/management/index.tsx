import React from 'react';

import { Table } from './components/table/table';
import { FiltersBar } from './components/filters';
import { TableDataAPI } from './fetchData/tableData';
import { InfiniteScrollAPI } from './fetchData/InfiniteScrollAPI';
import { useGeneralDataContext } from 'context/GeneralDataContext';
import { format } from 'date-fns';
import { GetDate } from 'utils/index';
import { UserState } from 'types/UserContext';
import { getChatSocket } from '@nex/realtime-core';
const chatSocket = getChatSocket();

interface ArrayDataProps {
    amministrativi: Array<any>;
    commerciali: Array<any>;
    customersFromRequest: Array<any>; //customers from requests
};
interface SearchParam {
    stato: any;
    com: string | null;
    amm: string | null;
    cli: string | number | null;
    dateRange: {
        da: any;
        a: any;
    } | null;
};
interface DataClientProps {
    _id: string;
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
    unreadCount?: number;
};
interface ManagementsRequestsProps {
    userContext: UserState;
    setErr: (prev: boolean) => void;
    checkAdminDev: boolean;
    overviewStatus: boolean;
    setOverviewStatus: React.Dispatch<React.SetStateAction<boolean>>;
    commentsPanelStatus: boolean;
    openCommentsPanel: () => void;
    closeCommentsPanel: () => void;
    requestPanelStatus: boolean;
    openRequestPanel: () => void;
    closeRequestPanel: () => void;
    isGroupedItems: React.MutableRefObject<boolean>;
};
export const ManagementsRequests: React.FC<ManagementsRequestsProps> = ({ userContext, checkAdminDev, setErr,
    overviewStatus, setOverviewStatus, commentsPanelStatus, openCommentsPanel,
    closeCommentsPanel, requestPanelStatus, openRequestPanel, closeRequestPanel, isGroupedItems
}) => {
    const { globalData, setGlobalData } = useGeneralDataContext();

    const [onLoad, setOnLoad] = React.useState<boolean>(false);
    const [onLoadFilters, setOnLoadFilter] = React.useState<boolean>(false);
    const [tableData, setTableData] = React.useState<Array<DataClientProps>>([]);
    const [tableTotalData, setTableTotalData] = React.useState<number>(0);
    const [tableEuroTotal, setTableEuroTotal] = React.useState<number>(0);
    const ofs = React.useRef<number>(0);


    const [arrayData, setArrayData] = React.useState<ArrayDataProps>({ amministrativi: [], commerciali: (globalData?.agents || []), customersFromRequest: [] });
    const [stateSelected, setStateSelected] = React.useState<string | number>(0);
    const [userSelected_Amministrativi, setUserSelected_Amministrativi] = React.useState<string | number>("");
    const [userSelected_Commerciali, setUserSelected_Commerciali] = React.useState<string | number>("");
    const [userSelected_Clienti, setUserSelected_Clienti] = React.useState<string | number>("");
    const [dateRangeStatus, setDateRangeStatus] = React.useState<boolean>(false);
    const ChangeDateRangeStatus = () => setDateRangeStatus(!dateRangeStatus);
    const [dateState, setDateState] = React.useState({
        da: format(new Date('2024-01-01'), 'yyyy-MM-dd'),
        a: format(new Date(GetDate().today), 'yyyy-MM-dd'),
    });

    const abortController = React.useRef<AbortController | null>(null);
    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
        }
    };

    React.useEffect(() => {
        // if (!userContext || (userContext && !userContext?.details)) { return };
        // // carico tabella
        // TableDataAPI({ userContext, abortController, setTableData, setErr, setOnLoad, setTableTotalData, setTableEuroTotal, ofs });


        // ——————————————————————————————————————————————————————————
        // BADGE REALTIME (sblocco ordini)
        // ——————————————————————————————————————————————————————————
        /**
        * Obiettivo:
        * - Se un commerciale invia un messaggio su una chat "sbloccoOrdini", il badge deve aggiornarsi
        *   in realtime per tutti gli amministrativi già nella pagina (senza refresh / refetch).
        * - Se anche un solo amministrativo legge (viewMessage), il badge deve azzerarsi per tutti.
        * Come:
        * - Il backend emette eventi socket ("soUnread"/"soRead") su una room dedicata.
        * - App.tsx traduce quegli eventi in CustomEvent window: "sbloccoOrdini:unread" e "sbloccoOrdini:read"
        * - Qui ci iscriviamo alla room quando entriamo nella pagina e aggiorniamo SOLO la tabella in memoria.
        */

        // entra nella room per ricevere gli update realtime dei badge
        // (serve perché il backend emette soUnread/soRead SOLO verso questa room)
        chatSocket.emit("subscribeSbloccoOrdini", {}, (ack: any) => {
            // console.log("[subscribeSbloccoOrdini]", ack); // debug opzionale
        });

        // Incremento badge su una specifica riga della tabella
        const onUnread = (ev: any) => {
            const { idBlock, delta } = ev.detail || {};
            if (!idBlock) return;

            setTableData((prev: any[]) => {
                // evita setState se la riga non è presente
                const found = prev.some((r) => String(r._id) === String(idBlock));
                if (!found) return prev;

                return prev.map((row) =>
                    String(row._id) === String(idBlock)
                        ? { ...row, unreadCount: (row.unreadCount || 0) + (delta || 1) }
                        : row
                );
            });
        };

        // Azzeramento badge (qualcuno ha letto)
        const onRead = (ev: any) => {
            const { idBlock } = ev.detail || {};
            if (!idBlock) return;

            // setTableData((prev) =>
            //     prev.map((row) =>
            //         String(row._id) === String(idBlock)
            //             ? { ...row, unreadCount: 0 }
            //             : row
            //     )
            // );

            setTableData((prev: any[]) => {
                const found = prev.some((r) => String(r._id) === String(idBlock));
                if (!found) return prev;

                return prev.map((row) =>
                    String(row._id) === String(idBlock)
                        ? { ...row, unreadCount: 0 }
                        : row
                );
            });
        };

        window.addEventListener("sbloccoOrdini:unread", onUnread as any);
        window.addEventListener("sbloccoOrdini:read", onRead as any);

        return () => {
            // Uscita dalla room quando lasciamo la pagina
            chatSocket.emit("unsubscribeSbloccoOrdini", {});
            // cleanup
            window.removeEventListener("sbloccoOrdini:unread", onUnread as any);
            window.removeEventListener("sbloccoOrdini:read", onRead as any);
            cancelRequest();
        };
    }, []);

    React.useEffect(() => {
        if (!userContext?.details?._id) return;

        TableDataAPI({ userContext, abortController, setTableData, setErr, setOnLoad, setTableTotalData, setTableEuroTotal, ofs });

        return () => cancelRequest();
    }, [userContext?.details?._id]);


    const infiniteScroll = () => {
        const searchParam: SearchParam = {
            stato: ((stateSelected as number) !== undefined && stateSelected !== "") ? stateSelected : null,
            amm: (arrayData.amministrativi[(userSelected_Amministrativi as number)]?._id || null),
            com: ((globalData?.agents || arrayData.commerciali)[(userSelected_Commerciali as number)]?.username || null),
            cli: (userSelected_Clienti !== undefined || arrayData?.customersFromRequest) ? arrayData.customersFromRequest[(userSelected_Clienti as number)]?.codiceCliente?.Focelda : null,
            dateRange: dateRangeStatus ?
                { da: new Date(dateState.da), a: new Date(dateState.a).setHours(23, 59, 59, 999) }
                : null,
        };

        return InfiniteScrollAPI({
            userContext, abortController, setTableData,
            searchParam, setErr, offset: ofs.current
        })
    };

    //badge chat -> fare in modo che il badge sparisca dopo che i messaggi sono stati letti senza dover ricaricare la pagina
    const clearUnreadAfterAck = React.useCallback((idBlock: string) => {
        setTableData((prev) =>
            prev.map((r) =>
                String(r._id) === String(idBlock)
                    ? ({ ...r, unreadCount: 0 } as any)
                    : r
            )
        );
    }, []);


    return <div className='flex flex-col h-full'>
        <FiltersBar userContext={userContext} setData={setTableData} seOnLoadFilters={setOnLoadFilter}
            onLoadFilters={onLoadFilters} onLoad={onLoad} arrayData={arrayData} ofs={ofs}
            setErr={setErr} setOnLoad={setOnLoad} stateSelected={stateSelected} userSelected_Amministrativi={userSelected_Amministrativi}
            userSelected_Commerciali={userSelected_Commerciali} userSelected_Clienti={userSelected_Clienti} dateRangeStatus={dateRangeStatus}
            dateState={dateState} setUserSelected_Commerciali={setUserSelected_Commerciali} setUserSelected_Clienti={setUserSelected_Clienti}
            setDateState={setDateState} ChangeDateRangeStatus={ChangeDateRangeStatus} setStateSelected={setStateSelected}
            setArrayData={setArrayData} setTableTotalData={setTableTotalData} loadedNumberData={tableData.length} tableTotalData={tableTotalData}
            tableEuroTotal={tableEuroTotal} setTableEuroTotal={setTableEuroTotal} />


        <Table data={tableData} setData={setTableData} onLoad={onLoad} setErr={setErr}
            checkAdminDev={checkAdminDev} userContext={userContext} tableTotalData={tableTotalData}
            infiniteScroll={infiniteScroll} ofs={ofs} overviewStatus={overviewStatus}
            setOverviewStatus={setOverviewStatus} commentsPanelStatus={commentsPanelStatus}
            openCommentsPanel={openCommentsPanel}
            closeCommentsPanel={closeCommentsPanel} requestPanelStatus={requestPanelStatus} openRequestPanel={openRequestPanel} closeRequestPanel={closeRequestPanel}
            isGroupedItems={isGroupedItems} onViewedRow={clearUnreadAfterAck} />
    </div>
}