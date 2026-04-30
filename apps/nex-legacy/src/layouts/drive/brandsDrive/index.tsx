import React from 'react';
import { UserContext } from "context/UserContext";

import { Stack, Card, IconButton, } from '@mui/material';

import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import { FiltersDocumentsPDF } from './filters';
import { VirtuosoGridVI } from './VirtuosoGridVI';
import { ActionsBar } from './actionsBar';
import { Tooltip } from 'react-tooltip';

import { Success } from 'components/Success';
import MDTypography from 'components/MDTypography';
import { icon_back, icon_folder } from 'config/icons';
import { getData } from './fetchData/getData';
import { getFilesData } from './fetchData/getFilesData';
import { UploadPanel } from './extraPanel/upload';
import { DwdFileFromLink } from 'utils/dwdFile';
import { DeleteAPI } from './fetchData/delete';
import { CheckAdminPermissions } from 'utils/checkAdminPermissions';
import { enqueueSnackbar } from 'components/MessageBox';
import { UploadAPI } from './fetchData/upload';
import { MainTheme } from 'assets/settingsTheme';
import { SendEmail } from 'components/SendEmail';
import { SendMailAPI } from './fetchData/sendMail';
import { useSectionTour } from 'tour/useSectionTour';
import { Role } from 'tour/types';
import { useNexTheme } from '@nex/theme-system';


interface FolderProps {
    _id: string;
    nome: string,
    dimensione: number,
    elementiTotali: number,
    ultimaModifica: string
}

interface FileTypesProps {
    _id: string;
    descrizione: string,
}

interface FileFolderProps {
    _id: string;
    nome: string,
    tipo: string,
    creato: Date,
    dimensione: number
}

//TP == 0 => delete
//TP == 1 => create
//TP == 2 => edit
const Cloud: React.FC<{}> = () => {
    const [userContext, setUserContext] = React.useContext<any>(UserContext);
    const CheckAdminDev = CheckAdminPermissions({
        userRole: userContext.details.ruolo,
        permissions: userContext.details.permissions, panelToCheck: 'drive', where: 0,
        rolesToCheck: [0, 1, 6, 2],
    });

    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    //tour
    // stato del drive da ripristinare quando si torna dallo step 11 allo step 10
    const tourDrivePrevStateRef = React.useRef<{
        folderSelected: FolderProps | null;
        filesView: boolean;
        selectedFile: any[];
        filesList: FileFolderProps[];
    } | null>(null);

    // flag che indica se lo stato salvato va ripristinato al prossimo ingresso nello step 10
    const tourDriveShouldRestoreRef = React.useRef(false);

    const [extraFilters, setExtraFilters] = React.useState(false);
    const [filtersToggleLocked, setFiltersToggleLocked] = React.useState(false);

    //tour
    const restoreDriveState = () => {
        if (!tourDriveShouldRestoreRef.current) return;
        const prev = tourDrivePrevStateRef.current;
        if (!prev) return;
        tourDriveShouldRestoreRef.current = false;
        setFolderSelected(prev.folderSelected);
        setFileView(prev.filesView);
        setSelectedFile([...prev.selectedFile]);
        setFilesList([...prev.filesList]);
    };

    const FOLDER_BACK_STEP = CheckAdminDev ? 10 : 7;

    const tour = useSectionTour({
        id: 'nex_v2_drive',
        version: '2.0.0',
        user: {
            id: userContext?.details?._id ?? '',
            role: (userContext?.details?.ruolo as Role) ?? 'Tester',
        },
        keys: 'drive',
        actions: {
            2: () => { setExtraFilters(false); setFiltersToggleLocked(false); },
            3: () => { setExtraFilters(true); setFiltersToggleLocked(true); },
            4: () => { setExtraFilters(false); setFiltersToggleLocked(false); },
            5: () => { setUploadPanel(false) },
            6: () => { CheckAdminDev && setUploadPanel(true) },
            7: () => { CheckAdminDev && setUploadPanel(true); },
            [FOLDER_BACK_STEP]: () => { restoreDriveState(); },
        }
    });
    //

    //lista delle cartelle
    const [folderList, setFolderList] = React.useState<FolderProps[]>([]);
    //lista delle cartelle
    const [typesList, setTypesList] = React.useState<FileTypesProps[]>([]);
    //lista dei file della cartella selezionata
    const [filesList, setFilesList] = React.useState<FileFolderProps[]>([]);

    const [filesView, setFileView] = React.useState<boolean>(false);

    //stato della tipologia di file selezionata
    const [filesTypesSelected, setFilesTypesSelected] = React.useState<FileTypesProps | null>(null);
    //stato della cartella selezionata
    const [folderSelected, setFolderSelected] = React.useState<FolderProps | null>(null);
    const MakeEmptyFolderSelection = () => {
        setFileView(false);
        setFolderSelected(null);
        setSelectedFile([]);
        setFilesList([]);
        setFilesTypesSelected(null);
    };

    const [uploadPanel, setUploadPanel] = React.useState<boolean>(false);
    //const ChangeUploadPanelStatus = () => setUploadPanel(!uploadPanel);
    const ChangeUploadPanelStatus = React.useCallback(() => {
        setUploadPanel(prev => !prev);
    }, []);
    //file selezionati per le operazioni esempio, download multipli
    const [selectedFile, setSelectedFile] = React.useState<any>([]);
    const addFileToSelected = (index: any) => setSelectedFile((prev: any) => {
        //condizione che determina se aggiungere alla selezione l'elemento cliccato
        //oppure deselezzionare l'elemento cliccato.
        if (!prev.includes(index)) {
            return [...prev, index];
        } else {
            const copy = [...prev];
            const filtredCopy = copy.filter(e => e != index);
            return filtredCopy;
        }
    });
    const SingleSelectionFile = (index: any) => setSelectedFile([index]);
    const MakeEmptySelection = () => setSelectedFile([]);

    //stato che definisce la presenza dell'infobar
    const [success, setSuccess] = React.useState(false); //stato per il success di un operazione
    const [err, setErr] = React.useState(false);
    //stato che definisce lo status di download dei file
    const [loadStatus, setLoadStatus] = React.useState<{ [key: string]: any }>({
        data: true,
        download: false,
        search: false,
        upload: false,
        delete: false,
        email: false,
    });
    const ChangeLoadStatus = ({ from, bool }: { from: string, bool: boolean }) => {
        setLoadStatus((prev) => ({ ...prev, [from]: bool !== undefined ? bool : !prev[from] }))
    };

    // Abort il panding del fetch all server
    const abortController = React.useRef<any>(null);
    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
        }
    };


    //load del componente per il caricamento delle cartelle
    React.useEffect(() => {
        if (!userContext || (userContext && (!userContext.details || !userContext.token))) { return; };
        getData({ userContext, abortController, setFolderList, setTypesList, setErr, ChangeLoadStatus })
        return () => cancelRequest();
    }, [userContext]);

    //funzione per il caricamento dei file all'interno della cartella selezionata
    const FindFolderFiles = ({ folderID, typesID, dateState, dataToAdd }: {
        folderID: string,
        typesID: string | null,
        dateState: { da: string, a: string } | null,
        dataToAdd?: any
    }) => {
        setFileView(true);
        function funcAfterFindFiles(prevFiles: any) {
            setFilesList(_ => {
                const fileIndex = prevFiles.findIndex((file: any) => file._id === dataToAdd._id);
                if (fileIndex !== -1) {
                    const updatedFiles = [...prevFiles];
                    const [file] = updatedFiles.splice(fileIndex, 1);
                    updatedFiles.unshift({ ...file, evidance: true });
                    return updatedFiles;
                } else {
                    return [{ _id: dataToAdd.id, ...dataToAdd, evidance: true }, ...prevFiles];
                }
            });
        };

        let body = {};
        if (folderID) {
            body = { ...body, fid: folderID };
        };
        if (!dataToAdd && typesID) {
            body = { ...body, tpd: typesID };
        };
        if (!dataToAdd && dateState) {
            body = { ...body, dtr: dateState };
        };

        ChangeLoadStatus({ from: 'data', bool: true });
        getFilesData({
            userContext,
            abortController,
            setData: setFilesList,
            ChangeLoadStatus,
            body: body,
            funcAfterFindFiles: dataToAdd ? funcAfterFindFiles : undefined
        });
    };

    function ElabElements() {
        const elmToDownloads = [];

        for (let i = 0; i < selectedFile.length; i++) {
            const e = selectedFile[i];
            const elmObject = filesList[e];
            elmToDownloads.push({ fileName: elmObject.nome, _id: elmObject._id });
        }

        return elmToDownloads;
    };
    /**
     * Converte l'array di selectedFile (che contine solo indici) in un array che contiene 
     * gli effettivi oggetti interessati, da inviare al back per poi essere elaborati.
     * @returns String
     */
    function getExtention(name: string) {
        const splitName = name.split(".");
        let extention = null;
        if (splitName && Array.isArray(splitName) && splitName.length > 0) {
            extention = splitName[splitName.length - 1];
        };
        return extention;
    };

    //funzione per il download dei file selezionati
    const downloadFile = React.useCallback(() => {
        if (!folderSelected || loadStatus.download) { return };

        const folder = folderSelected.nome;
        ChangeLoadStatus({ from: 'download', bool: true });

        //funzione che determina se l'operazione di download è completata dopo aver scaricato tutti i file selezionati.
        function Completed({ index }: { index: number }) {
            if (index == selectedFile.length - 1) {
                return ChangeLoadStatus({ from: 'download', bool: false });
            };
        };

        //funzione che determina se l'operazione di download è fallita.
        function Error() {
            return ChangeLoadStatus({ from: 'download', bool: false });
        }

        //scarica i file selezionati
        for (let i = 0; i < selectedFile.length; i++) {
            const e = selectedFile[i];
            const fileToDownload = filesList[e];
            const extention = getExtention(fileToDownload.nome);

            if (extention) {
                DwdFileFromLink({
                    path: `uploads/${folder}/${fileToDownload._id}.${extention}`,
                    fileName: fileToDownload.nome,
                    serverUrl: import.meta.env.VITE_API_PDF_READER,
                    completed: () => Completed({ index: i }),
                    error_func: () => Error(),
                });
            };
        };
    }, [folderSelected, selectedFile, filesList, loadStatus]);

    //funzione per il delete dei file selezionati
    const DeleteFile = React.useCallback(() => {
        if (loadStatus.delete || !selectedFile || selectedFile.length == 0) { return; };
        // Operazione conclusa con successo nel delete i file.
        const successDeleteOperation = () => {
            setFilesList((prev: any) => {
                const copy = [...prev];
                const elmsFiltred = copy.filter((_: any, index: number) => !selectedFile.includes(index));

                if (folderSelected) {
                    setFolderList((prev: any) => {
                        const copy = [...prev];
                        const indexCopyMap = new Map(copy.map((value, index) => [value._id, index]));
                        const itemID = folderSelected._id;

                        if (indexCopyMap && folderList && indexCopyMap.get(itemID) !== -1) {
                            const element = copy[(indexCopyMap as any).get(itemID)];
                            const dimensioneCalc = parseFloat(
                                elmsFiltred.reduce((acc: number, item: any) => {
                                    if (typeof item.dimensione === 'number' && !isNaN(item.dimensione)) {
                                        return acc + item.dimensione;
                                    }
                                    return (acc as any);
                                }, 0)
                            )?.toFixed(2);

                            element.elementiTotali = elmsFiltred.length;
                            element.dimensione = parseFloat(dimensioneCalc) < 0 ? 0 : parseFloat(dimensioneCalc);
                            element.creato = new Date();
                            element.ultimaModifica = new Date().toLocaleString('it');
                        };

                        return copy;
                    });
                }
                return elmsFiltred;
            });

            setSelectedFile([]);
        };
        /**
        * Converte l'array di selectedFile (che contine solo indici) in un array che contiene 
        * gli effettivi oggetti interessati, da inviare al back per poi essere elaborati.
        * @returns L'array con le proprietà oggetto degli effettivi file selezionati.
        */
        function ElemsID() {
            const elmToDownloads = [];

            for (let i = 0; i < selectedFile.length; i++) {
                const e = selectedFile[i];
                const elmObject = filesList[e];
                elmToDownloads.push(elmObject._id);
            }

            return elmToDownloads;
        };

        ChangeLoadStatus({ from: 'delete', bool: true });
        const body = {
            tk: userContext.token,
            tp: 0,
            files: ElemsID()
        };

        DeleteAPI({ userContext, abortController, body, setErr, ChangeLoadStatus, successOperation: successDeleteOperation })
    }, [filesList, selectedFile])

    //funzione per il caricamento dei file selezionati
    const UploadFiles = async ({
        folder_ = folderSelected,
        typeFile_ = filesTypesSelected,
        dataRange_ = null,
        setFolder_ = setFolderSelected,
        setFilterTypes = setFilesTypesSelected,
        filesToUpload,
        settings,
    }: {
        folder_: any;
        typeFile_: any;
        dataRange_: { da: Date | null, a: Date | null } | null;
        setFolder_: (prev: any) => void;
        setFilterTypes: (prev: any) => void;
        filesToUpload?: any;
        settings?: { resetFolderSelected?: boolean, resetTypesSelected?: boolean }
    }) => {
        //lista dei file che devono essere caricati.
        const filesToLoad = await filesToUpload ? filesToUpload : selectedFile;

        if (!folder_ || folder_ !== "" && typeof folder_ == "string") {
            return enqueueSnackbar("Prima di caricare un file devi obbligatoriamente selezionare una cartella.", {
                title: 'Seleziona una Cartella',
                type: 'warning',
            });
        };

        if (!typeFile_ || typeFile_ !== "" && typeof typeFile_ == "string") {
            return enqueueSnackbar("Seleziona una tipologia di file che stia per caricare.", {
                title: 'Seleziona una tipologia',
                type: 'warning',
            });
        };

        if (!filesToLoad || filesToLoad && Array.isArray(filesToLoad) && filesToLoad.length == 0) {
            return enqueueSnackbar("Seleziona almeno un file per poterlo caricare nella cartella.", {
                title: 'Seleziona un File',
                type: 'warning',
            });
        };

        if (!folder_ || !folder_._id) {
            return enqueueSnackbar("Errore durante la selezione della cartella, riprova.", {
                title: 'Errore Cartella',
                type: 'error',
            });
        };

        ChangeLoadStatus({ from: 'upload', bool: true });

        // Crea un oggetto `FormData` per inviare i file e i metadati
        const formData = new FormData();
        formData.append('fid', folder_._id); //id cartella
        formData.append('tpd', typeFile_._id); //id tipolgia file
        if (dataRange_) {
            formData.append('dtr', JSON.stringify(dataRange_));
        }
        formData.append('tp', "1");
        formData.append('tk', userContext.token);

        try {
            // Converte i file in `ArrayBuffer` prima di inviarli
            const attachments: any = await Promise.all(
                filesToLoad.map((file: any) => {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            resolve({
                                name: file.name,
                                type: file.type,
                                data: reader.result, // `ArrayBuffer` o `Base64`
                                creationDate: new Date(),
                                dimensions: file.size
                            });
                        };
                        reader.onerror = () => reject(reader.error);
                        reader.readAsArrayBuffer(file); // Puoi usare `readAsDataURL` per `Base64`
                    });
                })
            );

            // Aggiungi i file con i metadati
            await attachments.forEach((attachment: any, index: number) => {
                // Converti il `data` in Blob
                const blob = new Blob([attachment.data], { type: attachment.type });
                formData.append(`attachments[${index}][file]`, blob, attachment.name);

                // Aggiungi i metadati come stringa JSON
                formData.append(`attachments[${index}][metadata]`, JSON.stringify({
                    creationDate: attachment.creationDate,
                    dimensions: attachment.dimensions,
                }));
            });

            //operazione avvenuta con successo
            //idList => lista degli ID ricevuti dal backside da collegare con gli elementi in caricamento.
            const successOperation = (idList: Array<{ id: string; nome: string }>) => {
                setUploadPanel(false);
                setSuccess(true);
                //aggiorna la lista delle cartelle con i nuovi dati
                setFolderList((prev: any) => {
                    const copy = [...prev];
                    const indexCopyMap = new Map(copy.map((value, index) => [value._id, index]));
                    const itemID = folder_._id;


                    if (indexCopyMap && folderList && indexCopyMap.get(itemID) !== -1) {
                        const element = copy[(indexCopyMap as any).get(itemID)];
                        element.elementiTotali++;
                        element.dimensione = parseFloat(filesToLoad.reduce((acc: number, item: any) => (acc + (item.size / (1024 * 1024))), element.dimensione))?.toFixed(2);
                        element.creato = new Date();
                        element.ultimaModifica = new Date().toLocaleString('it');
                    };
                    return copy;
                });

                if (folderSelected && Array.isArray(filesList)) {
                    const mergedFilesToLoad = filesToLoad.map((file: any, index: number) => ({
                        idCartella: folderSelected._id,
                        nome: file.name,
                        tipo: file.type,
                        dimensione: (file.size / (1024 * 1024)).toFixed(2),
                        creato: new Date(),
                        tipoDrive: typeFile_.descrizione,
                        validita: dataRange_,
                        _id: idList[index]?.id, // Aggiungi l'id dall'idList in base all'index
                    }));

                    setFilesList((prev: any) => [...mergedFilesToLoad, ...prev])
                }

                if (settings && settings.resetFolderSelected) {
                    setFolder_(null);
                };

                if (settings && settings.resetTypesSelected) {
                    setFilterTypes(null);
                };

                ChangeLoadStatus({ from: 'upload', bool: false });
            };

            UploadAPI({ userContext, abortController, body: formData, setErr, ChangeLoadStatus, successOperation });
        } catch (error) {
            console.error("Errore durante la lettura degli allegati:", error);
        };
    };


    // parametri/stati per mostrare il pannello del invio email e le sue variabili da inviare 
    // successivamente al server.
    const [emailPanelStatus, setEmailPanelStatus] = React.useState(false);
    const [sendToEmail, setSendToEmail] = React.useState('');
    const [bodyEmail, setBodyEmail] = React.useState('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const openMailPanel = () => setEmailPanelStatus(true);
    const closeMailPanel = () => setEmailPanelStatus(false);

    //funzione di validazione del bodyEmail
    const validateBodyEmail = (bodyEmail: string) => bodyEmail && bodyEmail !== '' && bodyEmail.length > 0;

    //funzione di invio della mails al'utente inserito
    const sendMail__ = React.useCallback(() => {
        //em => Email del destinatario.
        //br => Nome della cartella.
        //bd => Body della mail.
        //files => string[]. Array di stringhe _id + estensione del file da inviare.

        if (!folderSelected || !selectedFile || selectedFile.length == 0) {
            return enqueueSnackbar("Seleziona una cartella e dei file per inviare un email con gli allegati selezionati.", {
                title: 'Seleziona un File',
                type: 'warning',
            });
        };

        if (!emailRegex.test(sendToEmail)) {
            enqueueSnackbar("Perfavore inserisci un'email valida prima di inviare la mail.", {
                title: 'Email non valida',
                type: 'warning',
            });
            return;
        };

        if (!validateBodyEmail(bodyEmail)) {
            return enqueueSnackbar("Perfavore inserisci un testo valido prima di inviare la mail.", {
                title: 'Testo Email vuoto',
                type: 'warning',
            });
        }

        const generateFileIdWithExtension = () => {
            return selectedFile.map((index: any) => {
                const file = filesList[index];
                const extension = getExtention(file.nome);
                return `${file._id}.${extension}`;
            });
        };

        ChangeLoadStatus({ from: 'email', bool: true });
        const attachments = generateFileIdWithExtension();

        // Invia la mail con gli allegati selezionati
        SendMailAPI({
            userContext,
            abortController,
            body: {
                tk: userContext.token,
                em: sendToEmail,
                bd: bodyEmail,
                br: folderSelected.nome,
                files: attachments
            },
            setErr,
            ChangeLoadStatus,
            setEmailPanelStatus,
            setSuccess
        });

        setBodyEmail("");
    }, [userContext, abortController, sendToEmail, bodyEmail]);





    return <DashboardLayout>
        <Stack height='100%'>
            <Stack gap={1}>
                <FiltersDocumentsPDF folderList={folderList} typesList={typesList}
                    CheckAdminDev={CheckAdminDev} tour={tour}
                    FindFolderFiles={FindFolderFiles} loadStatus={loadStatus}
                    setFolderSelected={setFolderSelected} ChangeUploadPanelStatus={ChangeUploadPanelStatus}
                    setFilesTypesSelected={setFilesTypesSelected} setFileView={setFileView}
                    folderSelected={folderSelected} extraFilters={extraFilters} setExtraFilters={setExtraFilters}
                    filtersToggleLocked={filtersToggleLocked}
                />
                <ActionsBar selectedFile={selectedFile} downloadFile={downloadFile} loadStatus={loadStatus}
                    DeleteFile={DeleteFile} CheckAdminDev={CheckAdminDev} openMailPanel={openMailPanel}
                    MakeEmptySelection={MakeEmptySelection} numFileSelected={selectedFile.length} />
                {filesView && <Card sx={{ p: 1, pl: 2, pr: 2, flexDirection: 'row' }}>
                    <Stack direction='row' alignItems='center' gap={1}>
                        {icon_folder({ width: 25, height: 25 })}
                        <MDTypography variant='body2'>
                            {folderSelected ? "/" + folderSelected.nome : "visione totale"}</MDTypography>
                    </Stack>
                    <IconButton data-tour="drive-folder-back"
                        disabled={loadStatus.upload}
                        onClick={() => {
                            // se il tour è aperto, salvo lo stato ATTUALE e chiedo un ripristino quando tornerò allo step 10
                            if (tour.isOpen) {
                                tourDrivePrevStateRef.current = {
                                    folderSelected,
                                    filesView,
                                    selectedFile: [...selectedFile],
                                    filesList: [...filesList],
                                };
                                tourDriveShouldRestoreRef.current = true;
                            }

                            // comportamento normale: reset della vista
                            MakeEmptyFolderSelection();
                        }} sx={{ ml: 'auto' }}>
                        {icon_back({
                            color: loadStatus.upload
                                ? darkMode
                                    ? palette.grey[800]
                                    : palette.grey[300]
                                : palette.grey[600]
                        })}
                    </IconButton>
                </Card>}
            </Stack>
            <VirtuosoGridVI
                data={filesView ? filesList : folderList}
                SingleSelectionFile={SingleSelectionFile}
                addFileToSelected={addFileToSelected}
                selectedFile={selectedFile}
                filesView={filesView}
                setFolderSelected={setFolderSelected}
                FindFolderFiles={FindFolderFiles}
                UploadFiles={UploadFiles}
                loadStatus={(loadStatus.upload || loadStatus.data)}
            />
        </Stack>
        <UploadPanel panelStatus={uploadPanel} folderList={folderList} typesList={typesList} loadStatus={loadStatus.upload}
            ChangeUploadPanelStatus={ChangeUploadPanelStatus} UploadFiles={UploadFiles} folderSelected={folderSelected}
            filesTypesSelected={filesTypesSelected} />
        <Tooltip id="actionBar-tooltip" place="bottom" style={{
            minWidth: 150, fontSize: '0.87rem',
            textAlign: 'center'
        }} />
        {emailPanelStatus && <SendEmail attachments={selectedFile} closeMailPanel={closeMailPanel}
            dataAttachments={ElabElements()} toEmail={sendToEmail} setToEmail={setSendToEmail}
            bodyEmail={bodyEmail} setBodyEmail={setBodyEmail} sendMail__={sendMail__}
            sendingEmailStatus={loadStatus.email} settings={{ smallIcon: true }} />}
        <Success success={success} setSuccess={setSuccess} />
    </DashboardLayout>
}

export default Cloud;