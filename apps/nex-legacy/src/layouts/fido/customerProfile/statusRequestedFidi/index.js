import React from 'react';
import { Backdrop, Card, Fade, Paper, Stack } from '@mui/material';

import IconButton from '@mui/material/IconButton';

import { icon_close } from 'config/icons';
import { FidiRequestedAPI } from '../fetch/fidiRequested';
import VirtuosoGridVI from './VirtuosoGridVI';
import MDTypography from 'components/MDTypography';
import { useGeneralDataContext } from 'context/GeneralDataContext';
import { enqueueSnackbar } from 'components/MessageBox';



export function StatusRequestedFidi({ userContext, fidoStatusPanel, setFidoStatusPanel, contentDisabled = false, closeDisabled = false, tourOpen = false, }) {
    const { createChatBlock } = useGeneralDataContext();

    const [fidiRequested, setFidiRequested] = React.useState([]);
    //tour
    const contentLocked = !!tourOpen && !!contentDisabled;
    const closeLocked = !!tourOpen && !!closeDisabled;
    // Abort il panding del fetch all server
    const abortController = React.useRef(null);
    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
        }
    };


    React.useEffect(() => {
        if (userContext.details === undefined) { return; }
        AskData();

        return () => {
            cancelRequest();
        }
    }, [userContext.details])

    const AskData = () => {
        FidiRequestedAPI(userContext, abortController, setFidiRequested);
    };

    /*const CreateChat = (fidoSelected) => {
        if (fidoSelected) {
            setMessagesData((prevMessages) => {
                const data__ = {
                    idBlock: fidoSelected._id,
                    titleBlock: `Richiesta Fido ${fidoSelected.Dettagli.Azienda.Nome}`,
                    userID: userContext.details._id,
                    nome: userContext.details.nome,
                    cognome: userContext.details.cognome,
                    path: "fido",
                    disabilitato: false
                };

                const {messages} = CreateNewChatBlock({
                    data: data__,
                    settings: { loadFromRemote: true, createRemoteBlock: true, loadState: true },
                    messagesData_: prevMessages, // Passa l'ultima versione di messagesData
                });
                return messages;
            });

            //invia l'emit del viewed solo se ci sono effettivamente dei messaggi da parte dell'altro utente
            ViewdMessages({ idBlock: fidoSelected._id, path: 'fido', settings: { emit: true } });

            setFidoStatusPanel(false);
            setOpenChat(true);
        } else {
            enqueueSnackbar("Sembra che ci sia stato un problema nella creazione della chat, perfavore contatta l'assistenza.", {
                title: 'Ops..',
                type: 'error',
            });
        }
    };*/
    const CreateChat = async (fidoSelected) => {
        if (!fidoSelected) {
            enqueueSnackbar("Sembra che ci sia stato un problema nella creazione della chat, perfavore contatta l'assistenza.", {
                title: "Ops..",
                type: "error",
            });
            return;
        }
        await createChatBlock({
            data: {
                idBlock: fidoSelected._id,
                titleBlock: `Richiesta Fido ${fidoSelected.Dettagli?.Azienda?.Nome ?? ""}`,
                userID: userContext.details._id,
                nome: userContext.details.nome,
                cognome: userContext.details.cognome,
                path: "fido",
                disabilitato: false,
            },
            settings: { loadFromRemote: true, createRemoteBlock: true, loadState: true },
            openAfter: true,
        });
        setFidoStatusPanel(false);
    };

    return <Fade in={fidoStatusPanel}><Backdrop open={true} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }} onClick={(e) => {
        if (e.target !== e.currentTarget) return;
        if (closeLocked) return;
        setFidoStatusPanel(false);
    }}>
        <Card data-tour="fido-status-panel" sx={{
            position: 'absolute', display: 'flex', flexDirection: 'column',
            right: 0, height: '100%', width: '30%', maxWidth: 450, minWidth: 400, padding: 2, overflow: 'auto'
        }}>
            <Stack direction='row' alignItems='center'>
                <MDTypography sx={{ ml: 1 }}>Richieste Fido</MDTypography>
                <IconButton data-tour="fido-status-panel-close" sx={{ marginLeft: 'auto' }} onClick={() => setFidoStatusPanel(false)} disabled={closeLocked}  >
                    {icon_close()}
                </IconButton>
            </Stack>
            <Stack sx={{
                flex: 1,
                minHeight: 0,
                pointerEvents: contentLocked ? 'none' : 'auto',
                opacity: contentLocked ? 0.6 : 1
            }}>
                <VirtuosoGridVI data={fidiRequested} CreateChat={CreateChat} style={{ height: '100%' }} />
            </Stack>
        </Card>
    </Backdrop></Fade>
}