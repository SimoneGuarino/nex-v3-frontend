import React, { useEffect } from 'react';
import { UserContext } from "context/UserContext";

import { Stack } from '@mui/material';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import { PopupInfo } from 'components/PopupInfo';
import { GeneralError } from 'components/NoData/generalError';
import { Tooltip } from 'react-tooltip';

import ErrorIMG from 'assets/images/errors/5203299_trasparent_error_500.png';
import { FiltersPanel } from './bar/filter';
import { TableVirtualized } from 'components/Virtualized/table';
import { DataAPI } from './fetchData/dataAPI';


interface ParamProps {
    tp: number; // se è di tipo OC = true || OF = false
    ord: string; // numero dell'ordine
    car: string; //codice articolo
    ops: number; // 1 => update | 2 => insert | 3 = delete, parametro di ricerca 
}

interface ConfiguratoreFornitoriProps {
}

export const OCFLogs: React.FC<ConfiguratoreFornitoriProps> = () => {
    const [userContext, setUserContext] = React.useContext<any>(UserContext);
    //Errore Fetch iniziale (Emoji Error)
    const [err, setErr] = React.useState(false);

    const [tableData, setTableData] = React.useState<Array<Object>>([]);
    //statehook per i dati inseriti dall'utente.
    const [params, setParams] = React.useState<ParamProps>({
        tp: 0, // se è di tipo OC = 0 || OF = 1
        ord: "", // numero dell'ordine
        car: "", //codice articolo
        ops: 4 // 0 => update | 1 => insert | 2 = delete | 3 => blank | 4 => tutti, parametro di ricerca 
    });
    //colonne della tabella dati.
    const [columns, setColumns] = React.useState([
        { key: 'Tipo operazione', label: 'Tipo Operaz.', sort: false, type: 'default', sx: { alignItems: 'center' } },
        { key: 'Numero ordine', label: 'Num.Ordine', sort: false, type: 'default', sx: { alignItems: 'center' } },
        { key: 'Data ordine', label: 'Data ordine', sort: false, type: 'default', dateType: 'ibm', sx: { alignItems: 'center' } },
        { key: 'Codice articolo', label: 'Cod.Articolo', sort: false, type: 'default', sx: { alignItems: 'center' } },
        { key: 'Codice IVA', label: 'Cod.IVA', sort: false, type: 'default', sx: { alignItems: 'center' } },
        { key: 'Prefisso fornitore', label: 'Prefisso fornitore', sort: false, type: 'default', sx: { alignItems: 'center' } },
        { key: 'Descrizione articolo', label: 'Descrizione', sort: false, type: 'default', },
        { key: 'Quantita', label: 'Quantita Cons.', sort: false, type: 'default', sx: { alignItems: 'center' } },
        { key: 'Prezzo vendita', label: 'Prezzo vendita', sort: false, type: 'default', sx: { alignItems: 'center' } },
        { key: 'Riga Saldata', label: 'Riga Saldata', sort: false, type: 'default', sx: { alignItems: 'center' } },
        { key: 'Codice magazzino', label: 'Cod.Magazzino', sort: false, type: 'default', sx: { alignItems: 'center' } },
        { key: 'Causale movimento', label: 'Causale mov.', sort: false, type: 'default', sx: { alignItems: 'center' } },
        { key: 'Codice cliente', label: 'Cod.Cliente', sort: false, type: 'default', sx: { alignItems: 'center' } },
        { key: 'Programma ultima manutenzione', label: 'Programma ultima manutenzione', sort: false, type: 'default', sx: { alignItems: 'center' } },
        { key: 'Data ultima manutenzione', label: 'Data ultima manutenzione', sort: false, type: 'default', sx: { alignItems: 'center' } },
        { key: 'Utente ultima manutenzione', label: 'Utente ultima manutenzione', sort: false, type: 'default', sx: { alignItems: 'center' } },
    ]);

    const [loadStatus, setLoadStatus] = React.useState<boolean>(false);
    // Abort il panding del fetch all server
    const abortController = React.useRef<any>(null);
    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
        }
    };

    //operazioni iniziali.
    /*React.useEffect(() => {
        if (userContext.details === undefined) { return; }
        SendRequestAPI(true);

        return () => {
            cancelRequest();
        }
    }, [userContext.details]);*/



    /**
     * funzione che elimina o inserisce il fornitore in base al openedBy.
     * @param checkbox Boolean | indica se il fornitore è attivo o meno
     * @param dist Object | oggetto che deve togliere o inserire in base al valore boolean di checkbox
     */
    const SendRequestAPI = (firstCall: boolean) => {
        if (!loadStatus || firstCall) {
            cancelRequest(); //evita lo spam di richieste cancellando la richiesta fetch precedente in pending.
            setLoadStatus(true);

            DataAPI({
                userContext, abortController, setData: setTableData,
                firstCall: firstCall, params: params, setLoadStatus, setErr
            });
        }
    };



    return <DashboardLayout>
        {!err ? <Stack gap={2} height='100%'>
            <FiltersPanel params={params} setParams={setParams} SendRequestAPI={SendRequestAPI} />
            <PopupInfo title='Info' close={false}
                body="Attraverso questo pannello avrai l'opportunità di vedere i 
                logs generati per gli OC e OF, con azioni e date annesse ad ogni singolo evento." />
            <TableVirtualized
                tableType='bottom-line'
                data={tableData}
                setData={setTableData}
                columns={columns}
                setColumns={setColumns}
                results={tableData.length}
                loadStatus={loadStatus}
                blockCondition={{
                    bg: '#ffdbdb',
                    condition: "elm?.Differenze?.includes(columns[columnIndex].key)"
                }}
            />
        </Stack> : <GeneralError img={ErrorIMG} />}
        <Tooltip id="general-confg-suppliers-tooltip" place="bottom" style={{
            maxWidth: "15vw", minWidth: 150, fontSize: '0.87rem', zIndex: 9999,
            textAlign: 'center'
        }} />
    </DashboardLayout>
}