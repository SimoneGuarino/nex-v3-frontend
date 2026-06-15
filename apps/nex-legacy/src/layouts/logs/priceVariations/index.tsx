/**
 * filtro sul buyer. //by è il parametro da inviare
 * range di date. //yy: {...} obbligatorio, default 1 settimana.
 * cod articolo. //cd è il parametro da inviare
 * of => numero progressivo +1 
 */

import React from 'react';
import { UserContext } from "context/UserContext";

import { Stack } from '@mui/material';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import { PopupInfo } from 'components/PopupInfo';
import { GeneralError } from 'components/NoData/generalError';
import { Tooltip } from 'react-tooltip';

import ErrorIMG from 'assets/images/5203299_trasparent.webp';
import { FiltersPanel } from './bar/filter';
import { TableVirtualized } from 'components/Virtualized/table';
import { DataAPI } from './fetchData/dataAPI';
import { InfiniteScrollAPI } from './fetchData/InfiniteScrollAPI';
import { TotalDataAPI } from './fetchData/totalDataAPI';
import { format } from 'date-fns';
import { GetDate } from 'utils/index';


interface ParamProps{
    by: string | number;
    cd: string; //codice articolo
    ls: string; //codice listino
    yy: {
        da: any;
        a: any
    };
}

interface ProductsLogsProps {
}

export const ProductsLogs: React.FC<ProductsLogsProps> = () => {
    const [userContext, setUserContext] = React.useContext<any>(UserContext);

    //Errore Fetch iniziale (Emoji Error)
    const [err, setErr] = React.useState(false);
    const [tableData, setTableData] = React.useState<Array<Object>>([]);
    const [total, setTotal] = React.useState<number>(0);
    //statehook per i dati inseriti dall'utente.
    const [params, setParams] = React.useState<ParamProps>({
        by: "",
        cd: "", // numero dell'ordine
        ls: "",
        yy : {
            da: format(new Date(GetDate().oneWeekAgo), 'yyyy-MM-dd'),
            a: format(new Date(GetDate().today), 'yyyy-MM-dd'),
        }
    });
    //colonne della tabella dati.
    const [columns, setColumns] = React.useState([
        { key: 'tipo', label: 'Tipo', sort: true, sortType: 'String', width: 150, type: 'default', sx: { alignItems: 'center' } },
        { key: 'codice', label: 'Codice', sort: true, sortType: 'String', width: 150, type: 'default', sx: { alignItems: 'center' } },
        { key: 'buyer', label: 'Buyer', sort: true,sortType: 'String',  width: 150, type: 'default', sx: { alignItems: 'center' } },
        { key: 'listino', label: 'Listino', sort: true, sortType: 'Number', width: 150, type: 'default', sx: { alignItems: 'center' } },
        { key: 'prezzo', label: 'Prezzo', sort: true, sortType: 'Number', width: 150, type: 'eur', sx: { alignItems: 'center' } },
        { key: 'sconto1', label: 'Sconto1', sort: true, sortType: 'Number', width: 150, type: 'eur', sx: { alignItems: 'center' } },
        { key: 'sconto2', label: 'Sconto2', sort: true, sortType: 'Number', width: 150, type: 'eur', sx: { alignItems: 'center' } },
        { key: 'ultimaModifica', label: 'Ultima Modifica', width: 200, sort: true, sortType: 'String', type: 'date', sx: { alignItems: 'center' }},
    ]);
    const [loadStatus, setLoadStatus] = React.useState<boolean>(true);
    // Abort il panding del fetch all server
    const abortController = React.useRef<any>(null);
    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
        }
    };



    //operazioni iniziali.
    React.useEffect(() => {
        if (userContext.details === undefined) { return; }
        SendRequestAPI(true);

        return () => {
            cancelRequest();
        }
    }, [userContext.details]);


    /**
     * funzione che elimina o inserisce il fornitore in base al openedBy.
     * @param checkbox Boolean | indica se il fornitore è attivo o meno
     * @param dist Object | oggetto che deve togliere o inserire in base al valore boolean di checkbox
     */
    const SendRequestAPI = (firstCall: boolean) => {
        if(!loadStatus || firstCall){
            cancelRequest(); //evita lo spam di richieste cancellando la richiesta fetch precedente in pending.
            setLoadStatus(true);
            TotalDataAPI({ userContext, abortController, setTotal, 
                params: params, setErr});
            DataAPI({ userContext, abortController, setData: setTableData, 
                params: params, setLoadStatus, setErr});
            offset.current = 0;
        };
    };

    const offset = React.useRef(0);
    const infiniteScroll = () => {
        return InfiniteScrollAPI({ userContext, abortController, setData: setTableData, 
            params: params, setErr, offset: offset.current })
    };



    return <DashboardLayout>
        {!err ? <Stack gap={2} height='100%'>
            <FiltersPanel params={params} setParams={setParams} SendRequestAPI={SendRequestAPI}/>
            <PopupInfo title='Info' close={false}
                body="Attraverso questo pannello avrai l'opportunità di vedere i 
                logs generati per gli OC e OF, con azioni e date annesse ad ogni singolo evento." />
            <TableVirtualized
                tableType='bottom-line'
                data={tableData}
                setData={setTableData}
                columns={columns}
                setColumns={setColumns}
                results={total}
                loadStatus={loadStatus}
                whereToFindData={false}
                infiniteScroll={{
                    func: infiniteScroll,
                    offset: offset
                }}
            />
        </Stack> : <GeneralError img={ErrorIMG} />}
        <Tooltip id="general-confg-suppliers-tooltip" place="bottom" style={{
            maxWidth: "15vw", minWidth: 150, fontSize: '0.87rem', zIndex: 9999,
            textAlign: 'center'
        }} />
    </DashboardLayout>
}