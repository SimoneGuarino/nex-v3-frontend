import React, { useEffect } from 'react';

import { Box, Fade, Skeleton, Stack, Grid } from '@mui/material';

import { Search } from './components/search';
import { Fatturati } from './components/blocks/fatturati';
import { ClientDetails } from './components/blocks/client';
import { Table } from './components/table';
import { Fido } from './components/blocks/fido';
import { Note } from '../extraPanel/note';
import { CartBar } from './components/blocks/cartBar';
import { SendRequestAPI } from './fetchData/sendRequest';
import { ChronoMyRequests } from './components/chrono/chronoMyRequests';
import { Success } from 'components/Success';
import { Comments } from '../extraPanel/comments';
import { TipiFido } from './components/blocks/tipiFido';
import { enqueueSnackbar } from 'components/MessageBox';
import { CustomersOrdersTable } from './customersOrdersTable';
import { useGeneralDataContext } from 'context/GeneralDataContext';
import { FDBox } from '@nex/fd-ui';
import { UserState } from 'types/UserContext';
import { useTour } from "tour/TourProvider";
import FDIconButton from 'components/UI/buttons/FDIconButton';
import { IoReturnDownBack, IoCloseOutline } from "react-icons/io5";
import { useNexTheme } from '@nex/theme-system';


// ——————————————————————————————————————————————————————————
// TYPES & INTERFACES
// ——————————————————————————————————————————————————————————
interface DataClientFromManagementProps {
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
            fatturati: object; //new
            totale: number;
            residuo: number;
        }
        iot: {
            fatturati: object; //new
            totale: number;
            residuo: number;
        }
    };
};

interface DataClientProps {
    _id: string;
    stato: 0 | 1 | 2;
    creata: {
        data: any;
        nota: string;
        da: {
            username: string;
        };
    };
    dettagli: {
        numeroOrdine: string;
        cliente: {
            nome: string;
            codice: string;
            codiceIot: string
            email: string;
        };
    };
    dati: Array<any>;
    fido: {
        focelda: {
            fatturati: object;
            totale: number;
            tipi: object;
            residuo: number;
        }
        iot: {
            fatturati: object;
            totale: number;
            tipi: object;
            residuo: number;
        }
    };
    esito?: {
        data: any;
        nota: string,
        da: {
            username: string;
        }
    };
};

interface UsersRequestsProps {
    userContext: UserState;
    setErr: (prev: boolean) => void;

    checkAdminDev: boolean;
    elementToView?: DataClientProps | null;
    groupToView?: DataClientProps | null;
    indexFromManagement?: number;
    setDataFromManagement?: (prev: any) => void;

    commentsPanelStatus?: boolean;
    openCommentsPanel?: () => void;
    closeCommentsPanel?: () => void;
    requestPanelStatus?: boolean;
    openRequestPanel?: () => void;
    closeRequestPanel?: () => void;
    tourRegister?: (api: {
        saveLastDetail: (data: { groupData?: CustomersOrders | null; singleData?: DataClientProps | null }) => void;
        restoreLastDetail: ({ single, group, both }: { single?: boolean; group?: boolean; both?: boolean }) => void;
    }) => void;
    onFbSearchErrorDuringTour?: () => void;

    dataFromManagement?: any; // elementi provenienti dalla gestione degli sblocchi
    closeManagementOverview?: () => void; //funzione di chiusura overview da gestione sblocchi per l'amministrazione.

    isGroupedItems: React.MutableRefObject<boolean>; //indica se gli elementi provengono da una richiesta di gruppo
    /** definsce se in visualizzazione c'è il singola ricerca ordine FB */
    searchForSingleItem?: React.MutableRefObject<boolean>;
};

interface CustomersOrders {
    _id: string;
    stato: 0 | 1 | 2,
    creata: {
        data: any;
        da: {
            username: string;
        };
        nota: string;
    };
    dettagli: {
        numeroOrdine: string;
        codiciFb?: Array<string>;
        cliente: {
            nome: string;
            codice: string;
            codiceIot: string
            email: string;
        };
    };
    dati: Array<any>;
    fido: {
        focelda: {
            fatturati: object;
            totale: number;
            tipi: object;
            residuo: number;
        }
        iot: {
            fatturati: object;
            totale: number;
            tipi: object;
            residuo: number;
        }
    };
    esito?: {
        data: any;
        nota: string,
        da: {
            username: string;
        }
    };
};

interface ArrayDataProps {
    customersFromRequest: Array<any>;
    customers: Array<any>;
};


// ——————————————————————————————————————————————————————————
// CONSTANTS
// ——————————————————————————————————————————————————————————
const companyList = ['focelda', 'iot'];
const IoReturnDownBackIcon = IoReturnDownBack as React.FC<{ size?: number; className?: string }>;
const IoCloseOutlineIcon = IoCloseOutline as React.FC<{ size?: number; className?: string }>;


// ——————————————————————————————————————————————————————————
// COMPONENTS
// ——————————————————————————————————————————————————————————
const SkeletonLoad: React.FC<{}> = () => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";

    return <Fade in={true} timeout={400}><Stack gap={2}>
        <Stack direction='row' gap={1}>
            <Skeleton sx={{ borderRadius: 3, width: '100%', height: 250, bgcolor: `${darkMode ? '#1c1c1c' : ''}` }} variant="rounded" />
            <Skeleton sx={{ borderRadius: 3, width: '100%', height: 250, bgcolor: `${darkMode ? '#1c1c1c' : ''}` }} variant="rounded" />
        </Stack>
        <Skeleton sx={{ borderRadius: 3, width: '100%', height: 400, bgcolor: `${darkMode ? '#1c1c1c' : ''}` }} variant="rounded" />
        <Skeleton sx={{ borderRadius: 3, width: '100%', height: '100%', minHeight: 400, bgcolor: `${darkMode ? '#1c1c1c' : ''}` }} variant="rounded" />
        <Skeleton sx={{ borderRadius: 3, width: '100%', height: 100, bgcolor: `${darkMode ? '#1c1c1c' : ''}` }} variant="rounded" />
    </Stack></Fade>
};


// ——————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————
export const UsersRequests: React.FC<UsersRequestsProps> = ({ userContext, setErr, elementToView, groupToView,
    indexFromManagement, setDataFromManagement, dataFromManagement, checkAdminDev, commentsPanelStatus = false,
    openCommentsPanel = () => { }, closeCommentsPanel = () => { },
    isGroupedItems, searchForSingleItem,
    requestPanelStatus, openRequestPanel, closeRequestPanel, tourRegister, onFbSearchErrorDuringTour, closeManagementOverview
}) => {
    const { DeleteBlock, CloseBlock } = useGeneralDataContext();

    const socketNTIF = React.useRef(null);
    const abortController = React.useRef<AbortController | null>(null);
    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
        };
    };

    const [success, setSuccess] = React.useState(false); //Success Opereation
    const [onSendLoad, setOnSendLoad] = React.useState<boolean>(false);
    const [onLoad, setOnLoad] = React.useState<boolean>(false); //stato di load del elemento FB singolo

    //lista adei clienti provenienti sia dalla richieste che in base al codice Agente.
    const [customersList, setCustomersList] = React.useState<ArrayDataProps>({ customersFromRequest: [], customers: [] });

    //elementi selezionati nella richiesta in gruppo degli elementi
    const [generalCheck, setGeneralCheck] = React.useState<{ [key: string]: boolean } | null>(null);

    //stato che mantiene la lista dei orders di quel determinato cliente
    const [generalDataOrders, setGeneralDataOrders] = React.useState<CustomersOrders | null>(groupToView || null); //se è valorizzato significa che sto visualizzando un gruppo di ordini
    const [generalData, setGeneralData] = React.useState<DataClientProps | null>(elementToView || null); //se è valorizzato significa che sto visualizzando un singolo ordine

    const [tableData, setTableData] = React.useState<Array<any>>(elementToView?.dati || []);

    /** Memoria Locale quando si è in modalità tour per poter andare indietro/avanti in determinati step, ripristinando i dati */
    const lastDetailRef = React.useRef<{
        generalData: DataClientProps | null;
        generalDataOrders: CustomersOrders | null;
        tableData: any[];
    } | null>(null);

    /** Salva i dati in base alla provenienza del dato nelle varie proprietà di lastDetail
     * @param groupData Dati del gruppo di ordini
     * @param singleData Dati del singolo ordine
     */
    const saveLastDetailForTour = React.useCallback(({ groupData, singleData }: { groupData?: CustomersOrders | null; singleData?: DataClientProps | null }) => {
        if (!!groupData) {
            isGroupedItems.current = true;
        };

        lastDetailRef.current = {
            generalData: singleData ?? generalData, // dettaglio del singolo ordine
            generalDataOrders: groupData ?? generalDataOrders, // dettaglio del gruppo di ordini
            tableData: singleData ? singleData.dati : groupData ? groupData.dati : tableData,
        };
    }, [generalData, generalDataOrders, tableData]);

    /** Ripristina i dati salvati in lastDetail */
    const restoreLastDetailForTour = React.useCallback(({ single, group, both }: { single?: boolean; group?: boolean; both?: boolean }) => {
        const last = lastDetailRef.current;
        if (!last) return;

        if (both) {
            setGeneralData(last.generalData);
            setGeneralDataOrders(last.generalDataOrders);
            setTableData(last.tableData);
        };
        if (single) {
            setGeneralData(last.generalData);
            setTableData(last.generalData ? last.generalData.dati : []);
        };
        if (group) {
            setGeneralDataOrders(last.generalDataOrders);
            setGeneralData(null);
            setTableData(last.generalDataOrders ? last.generalDataOrders.dati : []);
        };

        setOnLoad(false);
    }, [setGeneralData, setGeneralDataOrders, setTableData, setOnLoad]);

    // registra l’API verso il padre (solo ref, nessun setState)
    if (tourRegister) {
        tourRegister({
            saveLastDetail: saveLastDetailForTour,
            restoreLastDetail: restoreLastDetailForTour,
        });
    };


    const [companyActived, setCompanyActived] = React.useState(0);
    //per button
    const isDetailView = Boolean(generalDataOrders && Object.keys(generalDataOrders).length > 0) || Boolean(generalData && Object.keys(generalData).length > 0);
    const HandleCompanyChange = (e: any) => setCompanyActived(e.target.value);

    //Stato del pannello per l'invio della richiesta dello sblocco
    const ChangeSendPanelStatus = React.useCallback(() => {
        if (requestPanelStatus) {
            closeRequestPanel?.();
        } else {
            openRequestPanel?.();
        }
    }, [requestPanelStatus, openRequestPanel, closeRequestPanel]);
    //Stato del pannello per l'invio della richiesta dello sblocco ora gestiti dal padre
    const { isOpen: tourOpen, index: tourIndex } = useTour();
    const forceShowComments = tourOpen && (tourIndex === 8 || tourIndex === 9);
    const lockInteractions = (tourOpen && tourIndex === 5);

    const [handleNote, setHandleNote] = React.useState<string>("");
    const ChangeNote = (e: any) => setHandleNote(e);

    const [FBAlreadyInRequest, setFBAlreadyInRequest] = React.useState<boolean>(false);

    // ——————————————————————————————————————————————————————————
    // USE EFFECT
    // ——————————————————————————————————————————————————————————
    React.useEffect(() => {
        return () => cancelRequest(); // Cleanup eseguito quando il componente viene smontato
    }, []);

    //Aggiorna gli stati in base ad elementToView
    React.useEffect(() => {
        if (elementToView) {
            setTableData(elementToView?.dati || []);
            setGeneralData(elementToView);
        } else if (groupToView) {
            setGeneralDataOrders(groupToView);
        }

    }, [elementToView, groupToView]);

    // ——————————————————————————————————————————————————————————
    // FUNCTIONS
    // ——————————————————————————————————————————————————————————
    /**
     * Callback di invio dati al server con parametri annessi.
     * @param tp 0 | 1 => Definsce se la funzione è di creazione o edit del esito
     * @param esito 1 | 2 => Definsce se è stato accettato o rifiutato l'elemento.
     */
    const Send = ({ tp, esito }: { tp?: 0 | 1 | 2, esito?: 1 | 2 }) => {
        if (!userContext || !userContext.details) {
            return enqueueSnackbar("Sembra che ci sia stato un errore interno, perfavore ricarica la pagina.", {
                title: 'Ops..',
                type: 'error',
            });
        };
        setOnSendLoad(true);

        let prepareObj: any;
        //creazione
        if (tp === 0 || !tp && generalData) {
            const ordineTotale = generalData?.dati.reduce((acc: any, obj: any) => (obj.prezzo * obj.quantita) + acc, 0);
            //controllo sul totale dell'ordine in modo da evitare ordini con importo 0€
            if (ordineTotale == 0) {
                return enqueueSnackbar("Non è possibile richiedere uno sblocco se il totale ordine è uguale a zero.", {
                    title: 'Richiesta bloccata',
                    type: 'warning',
                });
            };

            prepareObj = {
                stato: 0,
                codiceFb: generalData?.dettagli?.numeroOrdine,
                cliente: generalData?.dettagli.cliente,
                creata: {
                    data: new Date(),
                    nota: handleNote,
                    da: {
                        _id: userContext.details?._id,
                        username: userContext.details?.username
                    }
                },
                prodotti: {
                    ordineTotale: generalData?.dati.reduce((acc: any, obj: any) => (obj.prezzo * obj.quantita) + acc, 0),
                    dati: JSON.stringify(generalData?.dati)
                },
                fido: {
                    focelda: {
                        fatturati: generalData?.fido.focelda.fatturati,
                        residuo: generalData?.fido.focelda.residuo,
                        tipi: generalData?.fido.focelda.tipi,
                        totale: generalData?.fido.focelda.totale
                    },
                    iot: {
                        fatturati: generalData?.fido.iot.fatturati,
                        residuo: generalData?.fido.iot.residuo,
                        tipi: generalData?.fido.iot.tipi,
                        totale: generalData?.fido.iot.totale
                    }
                }
            };
        } else if (tp === 2) { //invia richiesta gruppo
            const fbOrderList = generalCheck ? Object.keys(generalCheck) : [];
            if (generalCheck && fbOrderList.length > 0) {
                const ordineTotale = generalDataOrders?.dati
                    .filter((x: { codice: string, data: string, totale: number }) => (generalCheck ? Object.keys(generalCheck) : []).includes(x.codice.toString()))
                    .reduce((acc: any, obj: any) => obj.totale + acc, 0);

                //controllo sul totale dell'ordine in modo da evitare ordini con importo 0€
                if (ordineTotale == 0) {
                    setOnSendLoad(false);
                    return enqueueSnackbar("Non è possibile richiedere uno sblocco se il totale ordine è uguale a zero.", {
                        title: 'Richiesta bloccata',
                        type: 'warning',
                    });
                };

                prepareObj = {
                    stato: 0,
                    cliente: generalDataOrders?.dettagli.cliente,
                    creata: {
                        data: new Date(),
                        nota: handleNote,
                        da: {
                            _id: userContext.details?._id,
                            username: userContext.details?.username
                        }
                    },
                    codiciFb: fbOrderList,
                    ordiniFb: JSON.stringify(
                        generalDataOrders?.dati
                            .filter((x: { codice: string, data: string, totale: number }) => fbOrderList.includes(x.codice.toString()))
                            .map((x) => ({ codice: x.codice, data: x.data, totale: x.totale }))
                    ),
                    fido: {
                        focelda: {
                            fatturati: generalDataOrders?.fido.focelda.fatturati,
                            residuo: generalDataOrders?.fido.focelda.residuo,
                            tipi: generalDataOrders?.fido.focelda.tipi,
                            totale: generalDataOrders?.fido.focelda.totale
                        },
                        iot: {
                            fatturati: generalDataOrders?.fido.iot.fatturati,
                            residuo: generalDataOrders?.fido.iot.residuo,
                            tipi: generalDataOrders?.fido.iot.tipi,
                            totale: generalDataOrders?.fido.iot.totale
                        }
                    },
                    prodotti: {
                        ordineTotale: ordineTotale
                    }
                };

                setGeneralDataOrders((prev: any) => {
                    return {
                        ...prev,
                        dati: prev.dati.filter((x: { codice: string, checkbox: boolean }) => !x.checkbox)
                    };
                });

                setGeneralCheck(null);
            } else {
                //sembra che non ci siano elementi selezionati.
                setOnSendLoad(false);
                return enqueueSnackbar("Prima di inviare la richiesta, perfavore seleziona uno o piu FB.", {
                    title: 'Nessun FB selezionato',
                    type: 'warning',
                });
            };
        } else if (setDataFromManagement !== undefined && esito && indexFromManagement !== undefined && generalDataOrders) {//modifica l'esito del gruppo
            prepareObj = {
                stato: esito,
                codiciFb: generalDataOrders.dettagli.codiciFb,
                cliente: generalDataOrders.dettagli.cliente,
                esito: {
                    data: new Date(),
                    nota: handleNote,
                    da: {
                        _id: userContext.details._id,
                        username: userContext.details.username
                    }
                },
                creata: {
                    data: generalDataOrders.creata.data,
                    nota: generalDataOrders.creata.nota,
                    da: generalDataOrders.creata.da
                }
            };
            setDataFromManagement((prev: DataClientFromManagementProps) => {
                const copy = [...(prev as any)];
                copy[indexFromManagement].stato = esito;
                copy[indexFromManagement].esito = prepareObj.esito;
                return copy;
            });

            CloseBlock({ idBlock: generalDataOrders._id, settings: { emit: true } });
            DeleteBlock({ idBlock: generalDataOrders._id });
        } else if (setDataFromManagement !== undefined && esito && indexFromManagement !== undefined && generalData) {
            prepareObj = {
                stato: esito,
                codiceFb: generalData?.dettagli?.numeroOrdine,
                cliente: generalData?.dettagli?.cliente,
                esito: {
                    data: new Date(),
                    nota: handleNote,
                    da: {
                        _id: userContext.details?._id,
                        username: userContext.details?.username
                    }
                },
                creata: {
                    data: generalData.creata.data,
                    nota: generalData.creata.nota,
                    da: generalData.creata.da
                }
            };
            setDataFromManagement((prev: DataClientFromManagementProps) => {
                const copy = [...(prev as any)];
                copy[indexFromManagement].stato = esito;
                copy[indexFromManagement].esito = prepareObj.esito;
                return copy;
            });

            CloseBlock({ idBlock: generalData._id, settings: { emit: true } });
            DeleteBlock({ idBlock: generalData._id });
        };

        //Azione nel Send
        return SendRequestAPI({
            userContext, abortController, setErr, socketNTIF, generalDataCreataDa: (generalData || generalDataOrders)?.creata?.da?.username,
            setOnLoad: setOnSendLoad, ChangeSendPanelStatus,
            tp: (tp || 0), objToSend: prepareObj, setHandleNote, setFBAlreadyInRequest, setSuccess
        });
    };

    const FbDetails = ({ tableComponent, data_, tp }: { tableComponent: any, data_: any, tp: number }) => {
        return data_ &&
            <React.Fragment>
                <Box component="div" translate="no" sx={{ mt: 4 }}>
                    <Grid container spacing={1} data-tour="sblocco-info-modal">
                        <ClientDetails data-tour="sblocco-info-cliente" data={generalDataOrders ? generalDataOrders : data_} companyActived={companyActived}
                            HandleCompanyChange={HandleCompanyChange} companyList={companyList}
                            ChangeSendPanelStatus={ChangeSendPanelStatus} checkAdminDev={checkAdminDev}
                            FBAlreadyInRequest={FBAlreadyInRequest} ChangeCommentsPanelStatus={openCommentsPanel} />

                        <Fido totale={(generalDataOrders ? generalDataOrders.fido : data_.fido as any)[companyList[companyActived]].totale}
                            residuo={(generalDataOrders ? generalDataOrders.fido : data_.fido as any)[companyList[companyActived]].residuo}
                            companyActived={companyActived} companyList={companyList} />

                        {(generalDataOrders ? generalDataOrders.fido : data_.fido as any)[companyList[companyActived]].tipi &&
                            <TipiFido data={(generalDataOrders ? generalDataOrders.fido : data_.fido as any)[companyList[companyActived]].tipi}
                                companyActived={companyActived} companyList={companyList} />}

                        <Fatturati data={(generalDataOrders ? generalDataOrders.fido : data_.fido as any)[companyList[companyActived]].fatturati}
                            companyActived={companyActived} companyList={companyList} />

                    </Grid>
                </Box>
                {tableComponent}
                {<Box component="div" translate="no" mb={3}>
                    <Grid container spacing={1}>
                        <CartBar companyActived={companyActived} companyList={companyList}
                            stato={data_.stato}
                            residuo={(generalDataOrders ? generalDataOrders.fido : data_.fido as any)[companyList[companyActived]].residuo}
                            totaleOrdine={
                                (!tableData || tableData && tableData.length == 0) ?
                                    !checkAdminDev ?
                                        generalDataOrders?.dati
                                            .filter((x: { codice: string, data: string, totale: number }) => (generalCheck ? Object.keys(generalCheck) : []).includes(x.codice.toString()))
                                            .reduce((acc: any, obj: any) => obj.totale + acc, 0)
                                        : generalDataOrders?.dati.reduce((acc: any, obj: any) => obj.totale + acc, 0)
                                    : data_.dati.reduce((acc: any, obj: any) => (obj.prezzo * obj.quantita) + acc, 0)
                            }
                            ChangeSendPanelStatus={ChangeSendPanelStatus}
                            ifFromGroup={Boolean(generalDataOrders && generalData)}
                            checkAdminDev={checkAdminDev} FBAlreadyInRequest={FBAlreadyInRequest}
                            elementSelected={generalCheck ? Object.keys(generalCheck).length : 0} />
                    </Grid>
                </Box>}
            </React.Fragment>
    };

    /**
     * Funzione di ritorno alla schermata precedente.
     */
    function GoBack() {
        const isValidGroup = generalDataOrders && Object.keys(generalDataOrders).length > 0;
        const isValidElement = generalData && Object.keys(generalData).length > 0;

        // torna indietro allo stato "dettaglio gruppo"
        if (isValidGroup && isValidElement) {
            setGeneralData(null);
        };

        // torno allo stato "lista iniziale"
        if ((isValidGroup && !isValidElement && !dataFromManagement)
            || (isValidElement && !isValidGroup && !dataFromManagement)) {
            console.log("torno alla lista iniziale", isValidGroup, isValidElement, !dataFromManagement);
            setGeneralData(null);
            setGeneralDataOrders(null);
        };

        setTableData([]);
        setOnLoad(false);
    };


    return <FDBox
        className={`w-full h-full flex flex-col space-y-4`}
        variant="ghost"
        color="light"
        asMotion={true}
        style={{ position: 'relative' }}
    >
        {(!elementToView && !groupToView) && <Search setGeneralData={setGeneralData} onLoad={onLoad}
            setOnLoad={setOnLoad} userContext={userContext} setTableData={setTableData}
            setErr={setErr} setFBAlreadyInRequest={setFBAlreadyInRequest}
            setGeneralDataOrders={setGeneralDataOrders} customersList={customersList} abortController={abortController}
            GoBack={GoBack} showGoBack={isDetailView} onFbSearchErrorDuringTour={onFbSearchErrorDuringTour}
            saveLastDetailForTour={saveLastDetailForTour} searchForSingleItem={searchForSingleItem} />
        }

        {(isDetailView && dataFromManagement) && <div className='sticky top-0 flex z-10 justify-end space-x-2 bg-white/30 backdrop-blur-sm p-2 dark:bg-black/30 rounded-lg'>
            {(generalDataOrders && Object.keys(generalDataOrders).length > 0
                && generalData && Object.keys(generalData).length > 0)
                && <FDIconButton variant='text' rounded='md'
                    dataTooltipContent='Torna indietro' dataTooltipId='general-documents-tooltip'
                    className='border border-neutral-400 dark:border-neutral-800'
                    onClick={GoBack} icon={<IoReturnDownBackIcon size={18} />} />}
            <FDIconButton rounded='md' variant='danger' dataTour="sblocco-modal-close"
                dataTooltipContent='Chiudi' dataTooltipId='general-documents-tooltip'
                onClick={(e) => {
                    if (checkAdminDev && tourOpen) {
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                    }
                    closeManagementOverview && closeManagementOverview();
                }} icon={<IoCloseOutlineIcon size={18} />} />
        </div>}

        {(generalDataOrders && generalDataOrders.dati.length > 0 && !onLoad) ?
            (generalData && Object.keys(generalData).length > 0) ?
                FbDetails({
                    data_: generalData,
                    tp: 0,
                    tableComponent: <Table data={tableData} setData={setTableData} />
                })
                : !onLoad ?
                    FbDetails({
                        data_: generalDataOrders,
                        tp: 1,
                        tableComponent: <CustomersOrdersTable data={generalDataOrders} setData={setGeneralDataOrders} setGeneralData={setGeneralData}
                            setOnLoad={setOnLoad} userContext={userContext} setErr={setErr} checkAdminDev={checkAdminDev}
                            setFBAlreadyInRequest={setFBAlreadyInRequest}
                            setTableData={setTableData} onLoad={onLoad}
                            abortController={abortController} setGeneralCheck={setGeneralCheck}
                            saveLastDetailForTour={saveLastDetailForTour} />
                    })
                    : <SkeletonLoad />
            : onLoad ?
                <SkeletonLoad />
                : (generalData && Object.keys(generalData).length > 0 && !onLoad) ?
                    FbDetails({
                        data_: generalData,
                        tp: 0,
                        tableComponent: <Table data={tableData} setData={setTableData} />
                    })
                    : <ChronoMyRequests
                        userContext={userContext}
                        setErr={setErr} checkAdminDev={checkAdminDev}
                        customersList={customersList} setCustomersList={setCustomersList} commentsPanelStatus={commentsPanelStatus}
                        openCommentsPanel={openCommentsPanel} closeCommentsPanel={closeCommentsPanel} />
        }
        {/* sendPanelStatus={sendPanelStatus} */}
        <Note sendPanelStatus={!!requestPanelStatus} ChangeSendPanelStatus={ChangeSendPanelStatus} generalDataExist={Boolean(generalData)}
            Send={Send} ChangeNote={ChangeNote} handleNote={handleNote} onSendLoad={onSendLoad}
            checkAdminDev={checkAdminDev} />

        {(checkAdminDev &&
            ((generalData && generalData.creata) || (generalDataOrders && generalDataOrders?.creata))) && (
                <Comments
                    panelStatus={forceShowComments || commentsPanelStatus}
                    ChangePanelStatus={closeCommentsPanel}
                    creata={generalData?.creata ?? generalDataOrders?.creata ?? { data: null, nota: '', da: { username: '' } }}
                    esito={generalData?.esito ?? generalDataOrders?.esito ?? { data: null, nota: '', da: { username: '' } }}
                />
            )}
        <Success success={success} setSuccess={setSuccess} />
    </FDBox>
}