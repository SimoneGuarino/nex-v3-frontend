import React, { useState, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import TableSubObj from '../components/ui/TableSubObj';
import MDTypography from 'components/MDTypography';
import { Contract, DataOverviewProps, QuarterData, tabType, TabTypeProps } from '..';
import { getFileIconData } from 'config/dist_avatars';
import { icon_add, icon_delete, icon_download, icon_edit, icon_file } from 'config/icons';
import { NumberToEuro } from 'utils/numberToEuro';
import ExpirationModal from './ExpirationModal';
import { useDragZone } from 'utils/useDragZone';
import { enqueueSnackbar } from 'components/MessageBox';
import { UploadAPI } from '../fetchData/post/upload';
import { User } from 'types/user';
import FDIconButton from 'components/UI/buttons/FDIconButton';
import { DeleteContractAPI } from '../fetchData/delete/deleteContract';
import { DeleteTargetAPI } from '../fetchData/delete/deleteObjective';
import QuarterStatsChart from './QuarterStatsChart';

import * as FaIcons from "react-icons/fa";
import type { IconType } from "react-icons";

// Le chiavi dei quattro quarter
type QuarterKey = keyof DataOverviewProps['quarters']; // "q1"|"q2"|"q3"|"q4"

// Solo le sezioni che hanno davvero .contratti
type SectionKey = 'vendita' | 'acquisto';

// **Stili e animazioni**
const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};

// Memoized file preview with Tailwind
interface FilePreviewProps {
    contract: Contract;
    quarterIndex: number;
    downloadFile: (file: Contract, handleLoadChange: ({ from, bool }: { from: string; bool: boolean }) => void) => void;
    deleteContract: (id: string, quarterIndex: number, handleLoadChange: ({ from, bool }: { from: string; bool: boolean }) => void) => void;
};
const FilePreview: React.FC<FilePreviewProps> = memo(({ contract, quarterIndex, downloadFile, deleteContract }) => {
    // Stati per il caricamento e le azioni
    const [loading, setLoading] = useState<{ [key: string]: any }>({
        download: false,
        delete: false,
    });
    const handleLoadChange = ({ from, bool }: { from: string, bool: boolean }) => {
        setLoading((prev) => ({ ...prev, [from]: bool !== undefined ? bool : !prev[from] }))
    };

    // Ottieni i dati dell'icona in base al nome del file
    const { iconName, colorClass, label } = getFileIconData({ filename: contract.nome, type: contract.tipo });
    const iconMap = FaIcons as Record<string, IconType>;
    const RawIcon = iconMap[iconName] ?? FaIcons.FaFile;
    const sizeMB = contract.dimensione
        ? `${(contract.dimensione / (1024 * 1024)).toFixed(1)} MB`
        : "N/A";

    return (
        <motion.div
            className="
            flex flex-col sm:flex-row sm:items-center 
            justify-between flex-wrap 
            !p-3 border rounded-lg 
            bg-white dark:bg-neutral-900 
            border-neutral-200 dark:border-neutral-800 
            hover:bg-gray-50 dark:hover:bg-gray-700 
            transition-colors"
            layout
            whileHover={{ scale: 1.02 }}
        >
            {/* ICONA + DETTAGLI */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <RawIcon className={`w-5 h-5 ${colorClass}`} />
                <div className="flex flex-col text-left min-w-0">
                    <span className="font-semibold text-gray-800 dark:text-gray-300 text-sm truncate">
                        {contract.nome}
                    </span>
                    <span className="text-xs text-gray-500">
                        {sizeMB}
                        {label ? ` – ${label}` : ""}
                    </span>
                </div>
            </div>

            {/* AZIONI: su small in basso, su sm+ a destra */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 !mt-2 sm:!mt-0">
                <FDIconButton
                    loading={loading.download}
                    onClick={() => {
                        handleLoadChange({ from: 'download', bool: true });
                        downloadFile(contract, handleLoadChange)
                    }}
                    icon={icon_download()}
                />
                <FDIconButton
                    loading={loading.delete}
                    onClick={() => {
                        handleLoadChange({ from: 'delete', bool: true });
                        deleteContract(contract._id, quarterIndex, handleLoadChange);
                    }}
                    icon={icon_delete()}
                />
            </div>
        </motion.div>
    );
});

// Memoized quarter box with dynamic styling and animations
interface QuarterBoxProps {
    i: number;
    quarter: QuarterData;
    value?: number | null;
    target_value?: number | null;
    contracts: Contract[];
    CheckAdminDev: boolean;
    currentUser: boolean;
    disabledDrag: boolean;
    onFilesDropped: (files: File[], quarter: number) => void;
    downloadFile: (file: Contract, handleLoadChange: ({ from, bool }: { from: string; bool: boolean }) => void) => void;
    deleteContract: (id: string, quarterIndex: number, handleLoadChange: ({ from, bool }: { from: string; bool: boolean }) => void) => void;
    deleteTarget: (quarterIndex: number, quarter: QuarterData, handleLoadChange: ({ from, bool }: { from: string; bool: boolean }) => void) => void;
    openObjectiveDialog: (quarterIndex: number) => void;
}
const QuarterBox: React.FC<QuarterBoxProps> = memo(({
    i, quarter, value, target_value, contracts, CheckAdminDev, currentUser, disabledDrag,
    onFilesDropped, downloadFile, deleteContract, deleteTarget, openObjectiveDialog
}) => {
    const { isOver, handlers } = useDragZone(onFilesDropped, i + 1);

    // Stati per il caricamento e le azioni
    const [loading, setLoading] = useState<{ [key: string]: any }>({
        deleteQuarterTarget: false,
    });
    const handleLoadChange = ({ from, bool }: { from: string, bool: boolean }) => {
        setLoading((prev) => ({ ...prev, [from]: bool !== undefined ? bool : !prev[from] }))
    };

    return (loading.deleteQuarterTarget || loading.overview) ?
        <div className="relative flex flex-col justify-between !p-6 h-48 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse" />
        : <motion.div
            {...handlers}
            className={`
            relative flex flex-col h-full justify-between !p-6 
            bg-white dark:bg-neutral-900 border rounded-2xl 
            ${(isOver && !disabledDrag) ? 'border-2 border-dashed border-blue-500 bg-blue-50/30 dark:border-yellow-500 overflow-hidden'
                    : 'border-neutral-200 dark:border-neutral-800'}
            `}
            layout
            whileHover={{ y: -4 }}
            animate={(isOver && !disabledDrag) ? { scale: 1.02 } : {}}
        >
            {/* --- HEADER --- */}
            <header className="flex justify-between items-center !mb-4">
                <MDTypography variant="subtitle2" fontWeight="bold">Q{i + 1}</MDTypography>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs">
                        {contracts?.length || 0} {icon_file()}
                    </div>
                    {(CheckAdminDev && currentUser) && <>
                        {target_value && <FDIconButton
                            onClick={() => deleteTarget(i, quarter, handleLoadChange)}
                            icon={icon_delete()}
                            dataTooltipId='general-swot-tooltip'
                            dataTooltipContent='Cancella il Target trimestre'
                        />}
                        {!disabledDrag && <FDIconButton
                            dataTooltipId='general-swot-tooltip'
                            dataTooltipContent={`${target_value ? 'Modifica' : 'Aggiungi'} l'obiettivo al trimestre`}
                            onClick={() => openObjectiveDialog(i)} // Passa l'indice corretto del trimestre
                            icon={target_value ? icon_edit() : icon_add()}
                        />}
                    </>}


                </div>
            </header>

            {/* --- DETTAGLI --- */}
            <div className='flex flex-col items-start !mb-auto'>
                {/* --- VALORI EURO --- */}
                <div className="flex flex-wrap items-end gap-2 !mb-2">
                    <MDTypography className="whitespace-nowrap" variant="h2" data-tooltip-id='general-swot-tooltip' data-tooltip-content='Valore attuale del utente'>
                        {value ? NumberToEuro({ convert: value }) : "N/A"}
                    </MDTypography>
                    <MDTypography className="whitespace-nowrap" variant="body2" data-tooltip-id='general-swot-tooltip' data-tooltip-content='Valore obiettivo prefissato'>
                        / {target_value ? NumberToEuro({ convert: target_value }) : "N/A"}
                    </MDTypography>
                </div>
                {/* --- DATE --- */}
                {quarter.data_inizio && quarter.data_fine && (
                    <time dateTime={quarter.data_inizio} className="text-xs text-gray-500 dark:text-gray-400 block !mb-4" data-tooltip-id='general-swot-tooltip' data-tooltip-content='Date di inizio e fine del trimestre Personalizzato'>
                        {new Date(quarter.data_inizio).toLocaleDateString()} – {new Date(quarter.data_fine).toLocaleDateString()}
                    </time>
                )}
            </div>

            {/* --- LISTA CONTRATTI --- */}
            <div className="overflow-y-auto overflow-x-hidden max-h-40 !space-y-2 !pr-1 h-full">
                {contracts && Array.isArray(contracts) && contracts?.length > 0 ? (
                    contracts.map((c: any) => <FilePreview key={c.id || c.name} contract={c} downloadFile={downloadFile} deleteContract={deleteContract} quarterIndex={i + 1} />)
                ) : (
                    <p className="text-center text-gray-500 text-sm font">Nessun contratto</p>
                )}
            </div>

            {/* --- OVERLAY “Drop qui” --- */}
            {(isOver && !disabledDrag) && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none backdrop-blur-sm">
                    <span className={`!px-4 !py-2 bg-blue-600/80 dark:bg-yellow-700/30 text-white rounded`}>
                        Rilascia qui
                    </span>
                </div>
            )}
        </motion.div>
});

// Main overview component with responsive grid and animations
interface OverviewProps {
    data: DataOverviewProps | null;
    tableData: DataOverviewProps[] | null;
    tabActived: TabTypeProps;
    loadStatus: Record<string, any>;
    currentUser: User | null;
    CheckAdminDev: boolean;
    backUpTableData: DataOverviewProps[] | null;
    openObjectiveDialog: (quarterIndex: number) => void;
    setData: React.Dispatch<React.SetStateAction<DataOverviewProps | null>>;
    setTableData: React.Dispatch<React.SetStateAction<DataOverviewProps[] | null>>;
    ChangeLoadStatus: ({ from, bool }: { from: string; bool: boolean }) => void;
    CreateOverviewData: (data?: DataOverviewProps[] | null) => void;
};
/**
 * Principal component for displaying the SWOT overview.
 * @param currentUser - L'utente corrente per cui visualizzare i dati
 * @param data - I dati della overview da visualizzare
 * @param tabActived - Il tab attivo per filtrare i dati
 * @param loadStatus - Stato di caricamento per le operazioni in corso
 * @param ChangeLoadStatus - Funzione per aggiornare lo stato di caricamento
 * @param setData - Funzione per aggiornare i dati della overview
 * @param CheckAdminDev - Flag per verificare i permessi di amministratore
 * @param openObjectiveDialog - Funzione per aprire il dialogo degli obiettivi
 * @returns JSX Element - La rappresentazione della overview SWOT
 */
const Overview: React.FC<OverviewProps> = ({
    currentUser, data, tableData, tabActived, loadStatus, CheckAdminDev, backUpTableData,
    ChangeLoadStatus, setData, openObjectiveDialog, setTableData, CreateOverviewData
}) => {
    const abortController = React.useRef<AbortController | null>(null);
    const [selectedQuarter, setSelectedQuarter] = useState<number | null>(null);

    // **Memoized array dei quarter per evitare ricalcoli inutili */
    const quartersArray = useMemo(() => data ? Object.values(data.quarters) : [], [data]);

    // **Stati per DnD + modal**
    const [files, setFiles] = useState<File[]>([]);
    const [expirationDate, setExpirationDate] = useState('');
    const [notifyBefore, setNotifyBefore] = useState(false);

    // Funzione per gestire il drop dei file
    // e impostare il trimestre selezionato
    const handleFilesDropped = (files: File[], quarter: number) => {
        if (!data?.brand || !data?.linea || !data?.gruppo || !data?.famiglia) {
            return enqueueSnackbar("Seleziona prima un elemento dalla tabella per poter aggiungere un contratto.", {
                title: "Ops..",
                type: "error",
            });
        };

        setSelectedQuarter(quarter);
        setFiles(files);
    };

    // Funzione per gestire la conferma della modal
    // e inviare i file al server
    const handleModalConfirm = async () => {
        if (!files || Array.isArray(files) && files.length === 0) {
            console.warn('No files to upload');
            return enqueueSnackbar("Nessun file da caricare", {
                title: 'Ops..',
                type: 'error',
            });
        };

        if (!selectedQuarter) {
            console.warn('No quarter selected');
            return enqueueSnackbar("Nessun trimestre selezionato", {
                title: 'Ops..',
                type: 'error',
            });
        };

        // Qui fai la chiamata reale di upload, passando:
        // droppedInfo.files, droppedInfo.quarter, expirationDate, notifyBefore

        const extraData = {
            utenteId: currentUser?._id || null,
            section: tabType[tabActived.key].prop_key || null,
            quarter: selectedQuarter || null,
            brand: data?.brand || null,
            linea: data?.linea?.codice || null,
            gruppo: data?.gruppo?.codice || null,
            famiglia: data?.famiglia?.codice || null,
        }

        // Validazione dei dati extra
        if (!extraData.utenteId) {
            console.log("Utente non valido", extraData);
            return enqueueSnackbar("Utente selezionato non valido o non presente", {
                title: "Ops..",
                type: "error",
            });
        };

        if (!extraData.brand || !extraData.linea || !extraData.gruppo || !extraData.famiglia) {
            console.log("Dati utente o overview non validi", extraData);
            return enqueueSnackbar("Seleziona prima un elemento dalla tabella per poter aggiungere un contratto.", {
                title: "Ops..",
                type: "error",
            });
        };

        const formData = new FormData();
        formData.append('data', JSON.stringify(extraData));
        try {
            // Converte i file in `ArrayBuffer` prima di inviarli
            const attachments: any = await Promise.all(
                files.map((file: any) => {
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
                formData.append(`files[${index}][file]`, blob, attachment.name);

                // Aggiungi i metadati come stringa JSON
                formData.append(`files[${index}][metadata]`, JSON.stringify({
                    creationDate: attachment.creationDate,
                    dimensions: attachment.dimensions,
                }));
            });

            //operazione avvenuta con successo
            //idList => lista degli ID ricevuti dal backside da collegare con gli elementi in caricamento.
            const successOperation = (idList: Array<{ id: string; nome: string }>) => {
                //aggiorna la lista delle cartelle con i nuovi dati
                ChangeLoadStatus({ from: 'upload', bool: false });

                setData((prevData: DataOverviewProps | null) => {
                    if (!prevData) return null;
                    const copy = { ...prevData };

                    // cast sicuro a QuarterKey
                    const quarterKey = `q${selectedQuarter}` as QuarterKey;

                    // cast sicuro a SectionKey
                    const sectionKey = tabType[tabActived.key].prop_key as SectionKey;
                    // inizializza se vuoto
                    if (!copy.quarters[quarterKey][sectionKey]) {
                        copy.quarters[quarterKey][sectionKey] = {
                            valore: 0,
                            valore_target: 0,
                            contratti: []
                        };
                    };

                    idList.forEach((idObj, index) => {
                        const contract = {
                            _id: idObj.id,
                            nome: files[index].name,
                            dimensione: files[index].size,
                            tipo: files[index].type,
                            createdAt: new Date(),
                        };

                        copy.quarters[quarterKey][sectionKey]!.contratti.push(contract);
                    })

                    return copy;
                });

                // reset
                setFiles([]);
                setExpirationDate('');
                setNotifyBefore(false);
            };

            await UploadAPI({ abortController, body: formData, ChangeLoadStatus, successOperation });
        } catch (error) {
            console.error("Errore durante la lettura degli allegati:", error);
        };
    };

    // Funzione per annullare la selezione dei file
    // e chiudere la modal
    const handleModalCancel = () => {
        setFiles([]);
    };

    // Funzione per scaricare un files
    // Aggiunta di un parametro opzionale per gestire il caricamento
    const downloadFile = (file: Contract, handleLoadChange: ({ from, bool }: { from: string; bool: boolean }) => void) => {
        if (!file._id) {
            console.log(file);
            console.warn("File ID is missing for download");
            return enqueueSnackbar("Sembra che non siamo riusciti a trovare il tuo file", {
                title: 'Ops..',
                type: 'error',
            });
        };
        const ext = file.nome.split('.').pop() || '';
        const url = `${import.meta.env.VITE_API_STOCKS}swot/files/drive/${file._id}.${ext}`;
        const link = document.createElement('a');
        link.href = url;
        link.download = file.nome;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        enqueueSnackbar(`Download di ${file.nome} avviato`, {
            title: 'Successo',
            type: 'success',
        });
        if (handleLoadChange) {
            handleLoadChange({ from: 'download', bool: false });
        }
    };

    //Funzione per cancellare un contratto
    const deleteContract = async (contractId: string, quarterIndex: number, handleLoadChange: ({ from, bool }: { from: string; bool: boolean }) => void) => {
        if (!contractId) {
            return enqueueSnackbar("Dati insufficienti per l'eliminazione del contratto", {
                title: 'Ops..',
                type: 'error',
            });
        };

        ChangeLoadStatus({ from: 'delete', bool: true });
        // Funzione di successo da passare a DeleteContractAPI
        // che aggiornerà lo stato e mostrerà un messaggio di successo
        function successOperation() {
            handleLoadChange({ from: 'delete', bool: false });
            setData((prevData: DataOverviewProps | null) => {
                if (!prevData) return null;

                const copy = { ...prevData };

                // cast sicuro a QuarterKey
                const quarterKey = `q${quarterIndex}` as QuarterKey;

                // cast sicuro a SectionKey
                const sectionKey = tabType[tabActived.key].prop_key as SectionKey;

                // Rimuovi il contratto dalla lista
                copy.quarters[quarterKey][sectionKey]!.contratti =
                    copy.quarters[quarterKey][sectionKey]!.contratti.filter(c => c._id !== contractId);

                return copy;
            });

            enqueueSnackbar("Contratto eliminato con successo", {
                title: 'Successo',
                type: 'success',
            });
        };

        DeleteContractAPI({
            contractId,
            abortController,
            ChangeLoadStatus: handleLoadChange,
            successOperation
        })
    };

    //Funzione per cancellare il target di un trimestre
    const deleteTarget = async (quarterIndex: number, quarter: QuarterData, handleLoadChange: ({ from, bool }: { from: string; bool: boolean }) => void) => {
        const sectionKey = tabType[tabActived.key].prop_key as SectionKey;

        if (!quarter || !sectionKey || !quarter[sectionKey] || !quarter[sectionKey]?.id_quarter_target) {
            return enqueueSnackbar("Sembra che non sia stato trovato il Target del trimestre", {
                title: 'Ops..',
                type: 'error',
            });
        }

        ChangeLoadStatus({ from: 'delete', bool: true });

        // Funzione di successo da passare a DeleteTargetAPI
        // che aggiornerà lo stato e mostrerà un messaggio di successo
        function successOperation() {
            setData((prevData: DataOverviewProps | null) => {
                if (!prevData) return null;
                const copy = { ...prevData };

                // cast sicuro a QuarterKey
                const quarterKey = `q${quarterIndex + 1}` as QuarterKey;

                // cast sicuro a SectionKey
                const sectionKey = tabType[tabActived.key].prop_key as SectionKey;

                // Rimuovi il target dalla lista
                delete copy.quarters[quarterKey][sectionKey]!.valore_target;
                delete copy.quarters[quarterKey][sectionKey]!.id_quarter_target;

                return copy;
            });
            handleLoadChange({ from: 'deleteQuarterTarget', bool: false });

            enqueueSnackbar("Target eliminato con successo", {
                title: 'Successo',
                type: 'success',
            });
        };

        DeleteTargetAPI({
            quarterTargetId: quarter[sectionKey]?.id_quarter_target,
            abortController,
            ChangeLoadStatus: handleLoadChange,
            successOperation
        })
    };


    return (<>
        <div className="flex flex-col gap-6 w-full h-full">
            {!loadStatus.overview ? <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {quartersArray.map((quarter: QuarterData, idx: number) => {
                    const value = quarter[tabActived.prop_key]?.valore || null;
                    const target = quarter[tabActived.prop_key]?.valore_target || null;
                    return (
                        <motion.div key={idx} variants={itemVariants}>
                            <QuarterBox
                                i={idx}
                                quarter={quarter}
                                value={value}
                                target_value={target}
                                contracts={quarter[tabActived.prop_key]?.contratti || []}
                                onFilesDropped={handleFilesDropped}
                                downloadFile={downloadFile}
                                deleteContract={deleteContract}
                                CheckAdminDev={CheckAdminDev}
                                deleteTarget={deleteTarget}
                                openObjectiveDialog={openObjectiveDialog}
                                currentUser={Boolean(currentUser)}
                                disabledDrag={!data?.brand || !data?.linea || !data?.gruppo || !data?.famiglia}
                            />
                        </motion.div>
                    );
                })}
            </motion.div> : <div className="grid grid-cols-4 gap-6 w-full h-72">
                <div className="h-full w-full bg-gray-200 dark:bg-neutral-700 rounded animate-pulse" />
                <div className="h-full w-full bg-gray-200 dark:bg-neutral-700 rounded animate-pulse" />
                <div className="h-full w-full bg-gray-200 dark:bg-neutral-700 rounded animate-pulse" />
                <div className="h-full w-full bg-gray-200 dark:bg-neutral-700 rounded animate-pulse" />
            </div>}

            <div className={`flex flex-col sm:flex-col lg:flex-row gap-6 flex-1`}>
                <QuarterStatsChart dataOverview={data} tabKey={tabActived.prop_key} loadStatus={loadStatus} />
                <TableSubObj loadStatus={loadStatus}
                    data={tableData} setData={setTableData}
                    setOverviewData={setData} backUpTableData={backUpTableData}
                    CreateOverviewData={CreateOverviewData} />
            </div>
        </div>
        <ExpirationModal
            isOpen={files.length > 0}
            files={files || []}
            setFiles={setFiles}
            expirationDate={expirationDate}
            setExpirationDate={setExpirationDate}
            notifyBefore={notifyBefore}
            setNotifyBefore={setNotifyBefore}
            onConfirm={handleModalConfirm}
            onCancel={handleModalCancel}
        />
    </>
    );
};

export default Overview;