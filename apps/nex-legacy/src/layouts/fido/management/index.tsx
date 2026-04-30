import React, { useEffect } from 'react';

//@internal components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import MDSnackbar from "../../../components/MDSnackbar";

import { VirtuosoGridVI } from './VirtuosoGridVI.js';

import { UserContext } from "../../../context/UserContext";
import { DataAPI } from './fetch/data.js';
import { TakeRequestAPI } from './fetch/takeRequest.js';
import { ChangeStatusAPI } from './fetch/changeStatus.js';

import { NoData } from '../../../components/NoData/index';
import { listOfRequestStatus } from '../status.js';
import { Tooltip } from 'react-tooltip';
import { FiltersBar } from './filters';
import { Fade, Skeleton } from '@mui/material';
import { ChronoPanel } from './extraPanel/chrono';
import { Note } from './extraPanel/note';
import { DivideName, Notifications } from 'utils/index.js';
import { useGeneralDataContext } from 'context/GeneralDataContext';
import { enqueueSnackbar } from "components/MessageBox";
import { useSectionTour } from 'tour/useSectionTour';
import { Role } from 'tour/types';


type VotoRaiting = "A" | "B" | "C" | "D" | "E";
type StatusRichiesta = 0 | 1 | 2 | 3;

type DataItem = {
    Stato: StatusRichiesta;
    DettagliUtenteTaskInCarico: {
        ID: string | null;
        NomeCompleto: string | null;
    };
    DettagliCommerciale: {
        ID: string | null;
        NomeCompleto: string | null;
    };
    VotoRaiting: VotoRaiting;
    Dettagli: Object;
};

interface ChronoElementProps {
    stato: number;
    statoPrecedente: number;
    data: Date;
    amministrativo: {
        username: string;
    };
    fido?: {
        valore: number;
        variazione: number;
    };
    commento?: string;
};


const FidoManagement: React.FC<{}> = () => {
    const { createChatBlock, DeleteBlock, ActionOnBlock, CloseBlock, setOpenChat, setOverviewMessage } = useGeneralDataContext();

    const [userContext, setUserContext] = React.useContext<any>(UserContext);
    const socketNTIF = React.useRef(null);

    //const listOfRequestStatus: Array<string> = listOfRequestStatus;
    const [data, setData] = React.useState<Array<DataItem>>([]);
    //indica qual'è box è stato selezionato inserendo nello stato l'index del elemento nell'array madre.
    const [rowSelected, setRowSelected] = React.useState<number | null>(null);
    const [itemInIspection, setItemInIspection] = React.useState<{ e: object, statusID: number } | null>(null);

    //Notifica Generale di Error/Info/Success
    //--- Messaggio di Errore
    const [error, setError] = React.useState<String>("");
    //--- Stato del Messaggio se aperto o meno
    const [errorSB, setErrorSB] = React.useState<Boolean>(false);
    const closeErrorSB = () => setErrorSB(false);
    const openErrorSB = (icon: string, message: string) => { setErrorSB(true); setDymIcon(icon); setError(message) };
    // --- Richiamando e settando uno di questi valori definisce il colore e l'icona in utilizzo dal pop-up
    const [dymIcon, setDymIcon] = React.useState<string>("warning");
    const renderErrorSB = (
        <MDSnackbar
            color={dymIcon}
            icon={dymIcon}
            title="Focelda Dashboard"
            content={error}
            dateTime="1 sec fa"
            open={errorSB}
            onClose={closeErrorSB}
            close={closeErrorSB}
            bgWhite
        />
    );

    const [loadState, setLoadState] = React.useState<boolean>(true);
    const [loadActionState, setLoadActionState] = React.useState<boolean>(false);

    const [chronoPanelStatus, setChronoPanelStatus] = React.useState<boolean>(false);
    const [statusBox, setStatusBox] = React.useState(false);
    const ChangeChronoVisibility = () => setChronoPanelStatus(!chronoPanelStatus);

    const [commentsPanelStatus, setCommentsPanelStatus] = React.useState<boolean>(false);
    const ChangeCommentsVisibility = () => setCommentsPanelStatus(!chronoPanelStatus);
    const CommentsVisibilityOff = () => {
        setCommentsPanelStatus(false);
        setHandleComments(""); //resetta lo stato quando il pannello viene chiuso.
    };
    const [handleComments, setHandleComments] = React.useState<string>("");
    const ChangeComments = (e: any) => setHandleComments(e);


    const [itemChronoToView, setItemChronoToView] = React.useState<{ chrono: Array<ChronoElementProps> | null, date: string } | null>(null);
    const ChangeItemChrono = (item: any) => {
        if (item && item.Dettagli.DataRichiesta) {
            setItemChronoToView({ chrono: item.cronologia, date: item.Dettagli.DataRichiesta });
        };
        ChangeChronoVisibility();
    };


    const CreateChat = async ({ item }: { item: any }) => {
        if (!item) {
            enqueueSnackbar(
                "Sembra che ci sia stato un problema nella creazione della chat, perfavore contatta l'assistenza.",
                { title: "Ops..", type: "error" }
            );
            return;
        }


        const [nome, cognome] = DivideName(item.DettagliCommerciale.NomeCompleto);

        await createChatBlock({
            data: {
                idBlock: item._id,
                titleBlock: `Richiesta Fido ${item.Dettagli?.Azienda?.Nome ?? ""}`,
                userID: item.DettagliCommerciale.ID,
                nome,
                cognome,
                disabilitato: true,
                path: "fido",
            },
            settings: { loadFromRemote: true, createRemoteBlock: true, loadState: true },
            openAfter: true,          // apre la chat come facevi prima
            markViewedIfOther: true,  // opzionale: marca letti se ci sono messaggi dell’altro
        });
    };

    /*const CreateChat = ({ item }: { item: any }) => {
        if (item) {
            setMessagesData((prevMessages: any) => {
                const data__ = {
                    idBlock: item._id,
                    titleBlock: `Richiesta Fido ${item.Dettagli.Azienda.Nome}`,
                    userID: item.DettagliCommerciale.ID,
                    nome: DivideName(item.DettagliCommerciale.NomeCompleto)[0],
                    cognome: DivideName(item.DettagliCommerciale.NomeCompleto)[1],
                    disabilitato: true,
                    path: "fido",
                };
                const {messages} = CreateNewChatBlock({
                    data: data__,
                    settings: { loadFromRemote: true, createRemoteBlock: true, loadState: true },
                    messagesData_: prevMessages, // Passa l'ultima versione di messagesData
                });

                return messages?.length > 0 ? messages : prevMessages;
            });

            setOpenChat(true);
        } else {
            enqueueSnackbar("Sembra che ci sia stato un problema nella creazione della chat, perfavore contatta l'assistenza.", {
                title: 'Ops..',
                type: 'error',
            });
        };
    };*/

    const [overviewActive, setOverviewActive] = React.useState(true);
    const tour = useSectionTour({
        id: 'nex_v2_gestioneRichiesteFido',
        version: '2.0.0',
        user: {
            id: userContext?.details?._id ?? '',
            role: (userContext?.details?.ruolo as Role) ?? 'Tester',
        },
        keys: 'gestioneRichiesteFido',
        actions: {
            4: () => { setStatusBox(false); setRowSelected(null) },
            5: () => { setChronoPanelStatus(false); setStatusBox(false); setRowSelected(null) },
            6: () => { setChronoPanelStatus(true); setStatusBox(false); setRowSelected(null) },
            7: () => { setChronoPanelStatus(false); if (data.length === 0) return; setRowSelected(prev => (prev === null ? 0 : prev)); setStatusBox(true); setOverviewActive(false); },
            8: () => { setStatusBox(true); setStatusBox(true); if (data.length === 0) return; setRowSelected(prev => (prev === null ? 0 : prev)); setOpenChat(false); setOverviewActive(true) },
            9: () => {
                if (data.length === 0) return; const index = rowSelected ?? 0; const item = data[index]; setStatusBox(false); setRowSelected(null); void CreateChat({ item });
            },
            10: () => { setOpenChat(false); setStatusBox(true); setRowSelected(prev => (prev === null ? 0 : prev)) },
            11: () => { setStatusBox(true); setRowSelected(prev => (prev === null ? 0 : prev)) },
            12: () => { setStatusBox(true); setRowSelected(prev => (prev === null ? 0 : prev)) },
            13: () => { setStatusBox(false); setRowSelected(null) }
        }
    });

    const lockCrono = tour.isOpen && tour.index === 4;
    const lockChatCard = tour.isOpen && tour.index === 9;
    const lockOverviewOpen = tour.isOpen && tour.index !== 7;
    const lockChronoPanel = tour.isOpen && tour.index === 6;

    // step in cui vuoi la modale aperta
    const OPEN_STEP = 7;

    // 2) helper: si può aprire solo allo step 7 quando il tour è aperto;
    //    se il tour non è aperto, si può aprire sempre
    const canOpenOverview = React.useCallback(() => {
        if (!tour?.isOpen) return true;
        return tour.index === OPEN_STEP;
    }, [tour?.isOpen, tour?.index]);

    // 3) apertura solo su azione utente (click sulla row / tasto apposito)
    const openOverview = React.useCallback((idx?: number) => {
        if (!canOpenOverview()) return;
        if (typeof idx === 'number') setRowSelected(idx);
        if (!statusBox) setStatusBox(true);
    }, [canOpenOverview, statusBox]);

    const CLOSE_STEP = 10;

    const closeOverviewGuarded = () => {
        if (tour?.isOpen && tour.index < CLOSE_STEP) return; // blocca fino allo step 10
        setStatusBox(false);
        setRowSelected(null);
    };


    //

    // Abort il panding del fetch all server
    const abortController = React.useRef<AbortController | null>(null);
    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
        }
    };

    useEffect(() => {
        if (userContext.details === undefined) { return; }
        DataAPI(userContext, abortController, setData, setLoadState, openErrorSB);
        // Pulisci l'abortController quando il componente si smonta
        return () => {
            cancelRequest();
        };
    }, []);

    const TakeRequest = React.useCallback((e: { [key: string]: string }) => {
        ActionOnBlock({ data: { idb: e._id }, tp: 1 })
        TakeRequestAPI({
            userContext: userContext, abortController: abortController,
            elementSelected: e, openErrorSB: openErrorSB, reloadData: DataAPI, setData: setData
        });
    }, [data]);

    const ChangeStatusDB = (e: Object, statusID: number) => {
        setItemInIspection(_ => {
            return { e: e, statusID: statusID }
        });
        ChangeCommentsVisibility();
    };


    const ChangeStatusRequest = () => {
        if (itemInIspection) {
            //se stai per disimpegnare la richiesta modifica il blocco della chat
            if (itemInIspection.statusID == 0) {
                ActionOnBlock({ data: { idb: (itemInIspection.e as any)._id }, tp: 2 })
                DeleteBlock({ idBlock: (itemInIspection.e as any)._id });
            } else if ([2, 3].includes(itemInIspection.statusID)) {
                //comunica la chiusa del blocco in tempo reale.
                CloseBlock({ idBlock: (itemInIspection.e as any)._id, settings: { emit: true } });
            };

            setLoadActionState(true);
            ChangeStatusAPI({
                userContext: userContext, abortController: abortController,
                elementSelected: itemInIspection.e, csts: itemInIspection.statusID, commento: handleComments,
                setData, rowSelected, statusID: itemInIspection.statusID, setLoadActionState, CommentsVisibilityOff
            });

            if (itemInIspection.statusID == 2 || itemInIspection.statusID == 3) {
                const fullName = (itemInIspection.e as any).DettagliCommerciale.NomeCompleto;
                const emailDomain = "focelda.it";
                // Dividi il nome completo in nome e cognome
                const [firstName, lastName] = fullName.split(" ");
                const email_target = `${firstName[0].toLowerCase()}${lastName.toLowerCase()}@${emailDomain}`;

                const body_: any = {
                    desc: `<p>Gentile utente, riguardo alla sua richiesta di <em>fido</em> per il cliente: 
                    <strong>${(itemInIspection.e as any).Dettagli.Azienda.Nome}</strong>,
                    la informiamo che il fido da Lei richiesto è stato <strong><em>${itemInIspection.statusID == 2
                            ? 'Approvato' : 'Rifiutato'
                        }.</strong></em></p><p>${handleComments?.trim() !== "" ? "Per il seguente motivo: " : ""}</p>${handleComments}`,
                    modality: "Singola",
                    timerMode: false,
                    type: "Info",
                    user_from: userContext.details.username,
                    user_from_details: { nome: 'Sistema', fullName: 'Sistema', system: true },
                    user_target: [email_target],
                    usersTargetStatus: "Tutti",
                }

                Notifications({ _id: userContext.details._id, body: body_, userToken: userContext.token });
            }
        };
    };


    const euroTotal = React.useMemo(() => {
        if (data && data.length > 0) {
            return data.reduce(
                (currentValue: number, item: { Dettagli?: { FidoRichiesto?: number } }) => {
                    const fido = item.Dettagli?.FidoRichiesto || 0; // Usa 0 se FidoRichiesto non esiste o è undefined
                    return currentValue + fido;
                },
                0
            );
        }
        return 0; // Valore predefinito se `data` è vuoto o nullo
    }, [data]);



    return (
        <DashboardLayout>
            <FiltersBar userContext={userContext} setData={setData} setLoadState={setLoadState}
                openErrorSB={openErrorSB} totalNumber={data.length} euroTotal={euroTotal} />
            {!loadState ?
                data.length > 0 ? <VirtuosoGridVI
                    setData={setData}
                    abortController={abortController}
                    data={data}
                    ChangeItemChrono={ChangeItemChrono}
                    listOfRequestStatus={listOfRequestStatus}
                    TakeRequest={TakeRequest}
                    ChangeStatusDB={ChangeStatusDB}
                    openErrorSB={openErrorSB}
                    rowSelected={rowSelected}
                    setRowSelected={setRowSelected}
                    CreateChat={CreateChat}
                    chronoPanelStatus={chronoPanelStatus}
                    statusBox={statusBox}
                    setStatusBox={setStatusBox}
                    openOverview={openOverview}
                    closeOverview={closeOverviewGuarded}
                    lockCrono={lockCrono}
                    lockChatCard={lockChatCard}
                    lockOverviewOpen={lockOverviewOpen}
                    isActive={!tour.isOpen || overviewActive}
                /> :
                    <NoData height={70} />
                : <Fade in={true} timeout={200}>
                    <Skeleton variant="rounded" sx={{ mt: 2 }} height='100%' />
                </Fade>}
            <Note status={commentsPanelStatus} ChangePanelStatus={CommentsVisibilityOff} ChangeComments={ChangeComments}
                handleComments={handleComments} Send={ChangeStatusRequest} onSendLoad={loadActionState} />
            {itemChronoToView && <ChronoPanel status={chronoPanelStatus} ChangeVisibility={ChangeChronoVisibility} creationDate={itemChronoToView?.date}
                dataList={itemChronoToView?.chrono} statusNumberToString={listOfRequestStatus} isActive={!lockChronoPanel} />}
            <Tooltip id="general-fido-tooltip" place="bottom" style={{
                maxWidth: "15vw", minWidth: 150, fontSize: '0.87rem', zIndex: 9999,
                textAlign: 'center'
            }} />
            {renderErrorSB}
        </DashboardLayout>
    )
};

export default FidoManagement;