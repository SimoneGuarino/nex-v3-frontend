import { useContext, useEffect, useState, useRef, useCallback, memo } from "react";
import { useFiltersContext } from "context/filtersContext";

import { UserContext } from "../../../context/UserContext";

// @mui material components
import { Grid, Card } from "@mui/material";

//  components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import Loader from "../../../Loader";
import MinLoader from "../../../minLoader";
import Filters from './filter';

//  Layouts components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";

// Componente utilizzato per la gestione dei filtri
import EmojiError from "emojiError";

//Sistema logico per il fetch dei relativi dati
import { DataRetrive } from './fetchData/data';
//import { FBSendEmail } from './fetchData/actions/fbSendEmail';
import { Tooltip } from "react-tooltip";
import { TableVirtualized } from "components/Virtualized/table";
import { enqueueSnackbar } from "components/MessageBox";


function OrdiniFBCNR() {
    const [userContext, setUserContext] = useContext(UserContext);
    const {
        panelMode,
    } = useFiltersContext();
    //___________________Dati relativi al compare/search
    const [dataContext, setDataContext] = useState([]);
    //Copia del dataset iniziale
    const [copyDataContext, setCopyDataContext] = useState(dataContext);

    const [mainLoad, setMainLoad] = useState(true);

    //codiceCommerciale tiene conto del codiceAgente del soggetto selezionato per poi inviarlo come filtro
    const [codiceCommerciale, setCodiceCommerciale] = useState(null);
    //channelsCode tiene traccia del soggetto selezionato per poi inviarlo come filtro
    const [channelsCode, setChannelsCode] = useState();
    //stato del bottone invio filtri per mostrare il caricamento
    const [loadingSendFilter, setLoadingSendFilter] = useState(false);
    // Abort il panding del fetch all server
    const abortController = useRef(null);
    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
            abortController.current = null; // Reset after abort
        }
    };
    //Errore Fetch iniziale (Emoji Error)
    const [err, setErr] = useState(false);
    
    //controlla lo stato della chiamata infiniteScroll per evitare una seconda chiamata
    const onTimeCallRef = useRef(false);
    //tiene conto dello stato attuale dello stateHook
    //il valore di questa variabile viene modificato in tempo reale in modo tale possa essere utilizzata
    //nel if del infinite scroll, se viene utilizzato dataContext direttamente il valore sarà Undefined
    const dataLengthRef = useRef(dataContext.dataLength);
    
    /*const sendEmailFunc = useCallback((num_fb, emailCliente) => {
        const fbNumSANIT = Sanitize.number(num_fb)
        if(!fbNumSANIT.Success){
            return enqueueSnackbar('Sembra che il numero fb non sia valido, perfavore riprova tra un pò.', {
                title: 'Ops..',
                type: 'error',
            });
        }

        const emailCliSANIT = Sanitize.email(emailCliente)
        if(!emailCliSANIT.Success){
            return enqueueSnackbar('Sembra che l'email del cliente non sia valida, perfavore riprova tra un pò.', {
                title: 'Ops..',
                type: 'error',
            });
        };

        FBSendEmail(userContext, abortController, 0, copyDataContext, null, emailCliSANIT.Data)
    },[userContext, abortController, copyDataContext]);*/
    
    const [columns, setColumns] = useState([
        { key: 'Num Ord', label: 'Num Ord', sort: true, sortType:'Number', type: 'default'},

		{ key: 'Tipo Ord', sort:true, sortType: 'String', label: 'Tipo Ord', type: 'default', info: {text: "Tipo dell'ordine"}, sx: {fontWeigth: '600'}},
        { key: 'Cod art', sort:true, sortType: 'String', label: 'Cod.Art', type:'default', width: 150, sx:{ textAlign:'left' }},
		{ key: 'Descrizione', sort:true, sortType: 'String', label: 'Descrizione', width: 300, type:'default', sx:{textAlign:'left'}},

        { key: ['Cod Cli', 'Ragione Sociale', 'Mail Cliente'], label: 'Dettagli Cliente', fieldToTake: [
            { key: 'Cod Cli', label: 'Cod.Cli', type: 'default', sort: true, sortType:'String', info: {text: "Codice cliente"}, sx: {fontWeight: '300'}},
            { key: 'Ragione Sociale', label: 'Ragione Sociale', sort: true, sortType:'String', type: 'default', 
                info: {text: "Ragione Sociale:", var: 'Ragione Sociale'}, 
                sx: {fontWeigth: '600', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%', whiteSpace: 'nowrap', textAlign: 'left'}},
            { key: 'Mail Cliente', label: 'Tipo Ord', type: 'default', sort: true, sortType:'String', info: {text: 'E-mail del cliente:', var: 'Mail Cliente'}, 
                sx: {fontWeigth: '600', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%', whiteSpace: 'nowrap', textAlign: 'left'}},
        ], type: 'multiple', width: 200, sort: false, sortType: "String", multiSort: true, sx: { alignItems: 'flex-start'}},

        { key: 'Data Ord', label: 'Data Ord', type:'default', width: 150, sx: { alignItems: 'center' } },
        { key: 'Data Con', label: 'Data Con.', type:'default', width: 150, sx: { alignItems: 'center' } },
		{ key: 'Giorni Ord', label: 'Giorni Ord', type:'default', sort: true, sortType: 'Number'},

        { key: ['Prezzo', 'Quantita'], label: 'Prezzo', fieldToTake: [
            { key: 'Prezzo', label: 'Prezzo', sort:true, sortType: 'Number', type: 'eur' },
            { key: 'Quantita', label: 'Quantita', sort:true, sortType: 'Number', type: 'pz' },
            { key: {multiplay: [{ key: 'Prezzo' }, { key: 'Quantita' }]}, label: 'PrezzoTot', hideInRow:true, sort:true, sortType:'Multiplay', type: 'eur'},
        ], type: 'multiple', sort: true, sortType:'Number', multiSort: 'true'},
        { key: 'CodCommerciale', label: 'Commerciale', sort: true, sortType:'String', type: 'default', info: {text: "Codice commerciale"}, sx: { alignItems: 'center' }},
        { key: 'Canale', label: 'Canale',sort: true, sortType:'String',type: 'default', info: {text: "Canale"}, sx: { textAlign: 'center', alignItems: 'center' }},

        //{ key: 'Canale', label: 'Canale', type:'default', sx: {textAlign: 'left',width:'100%'}},
        { key: 'Magazzino', sort: true, sortType:'String', label: 'Magazzino', width: 200, type:'default', sx: {textAlign: 'left', width:'100%'}},
    ]);



    useEffect(() => {
        if(userContext.details === undefined){return;}

        UpdateTablePrice();
        
        return () => {
            cancelRequest();
        }
    }, [userContext.details]);


    const UpdateTablePrice = useCallback(() => {
        if(loadingSendFilter) { return enqueueSnackbar('Perfavore aspetta che la comunicazione precedente con il server, venga ultimata.', {
            title: 'Richiesta già effetuata',
            type: 'warning',
        })};
        setLoadingSendFilter(true);
        setMainLoad(true);
        //fa riferimento al codiceAgente/Codice Commerciale, se è admin dai la possibilità all'utente di inviare 
        //diversi codici agente se invece l'utente è un commerciale invia solo il codice collegato all'account.
        const selectUserCod = userContext.details.ruolo === 'Commerciale' ? userContext.details?.codici?.agente 
            : codiceCommerciale?.codici?.agente;

        return DataRetrive(setDataContext, abortController, setMainLoad, selectUserCod, 
            copyDataContext, setCopyDataContext, channelsCode, setLoadingSendFilter, setErr)
    },[userContext.details, abortController.current, setDataContext, setMainLoad,
        dataContext, codiceCommerciale, channelsCode, loadingSendFilter])


    useEffect(()=>{
        dataLengthRef.current = dataContext.dataLength;
    },[dataContext.dataLength])
    

    return userContext.details === null ? (
        "Error Loading User details"
    ) : !userContext.details ? (
        <div>
            <Loader />
        </div>
    ) : (
        <DashboardLayout>
            <MDBox className='height100' pt={6} pb={3} translate="no">
                <Grid className='height100' container spacing={6}>
                    <Grid className='height100' item xs={12}>
                        <MDBox mt={-3} py={3} px={2} display="flex" alignItems="center" flexWrap="wrap">
                            <MDBox display="flex" paddingBottom="10px" borderBottom="1px solid #ccc" width="100%">
                                <MDTypography variant="h3" className="flexBasis">
                                    FB con consegna non rispettata
                                </MDTypography>
                                <Filters copyDataContext={copyDataContext} 
                                    dataContext={dataContext} 
                                    codiceCommerciale={codiceCommerciale} 
                                    setCodiceCommerciale={setCodiceCommerciale} 
                                    UpdateTablePrice={UpdateTablePrice}
                                    channelsCode={channelsCode}
                                    setChannelsCode={setChannelsCode}
                                    loadingSendFilter={loadingSendFilter}
                                />
                            </MDBox>
                            {!err ?
                                mainLoad ? <MinLoader /> : null
                            :
                                <EmojiError />}
                        </MDBox>
                        {!err &&
                            <Card className='height100' sx={{ marginTop: 1 }}>
                                <TableVirtualized
                                    data={(dataContext.dati || [])}
                                    setData={setDataContext}
                                    loadStatus={mainLoad}
                                    panelMode={panelMode}
                                    results={(dataContext.dataLength || 0)}
                                    totWarehouse={parseFloat(parseFloat(dataContext.warehouseToT).toFixed(2)).toLocaleString("it-IT") + "€"}
                                    onTimeCallRef={onTimeCallRef}
                                    abortController={abortController}
                                    columns={columns}
                                    setColumns={setColumns}
                                    cookieName={'stored_settings_fbCNR'}
                                />
                            </Card>
                        }
                    </Grid>
                </Grid>
            </MDBox>
            <Tooltip id="general-fb-cnr-tooltip" place="bottom" style={{
                maxWidth: "15vw", minWidth: 150, fontSize: '0.87rem', zIndex: 9999,
                textAlign: 'center'
            }} />
        </DashboardLayout>
    );
}

export default memo(OrdiniFBCNR);