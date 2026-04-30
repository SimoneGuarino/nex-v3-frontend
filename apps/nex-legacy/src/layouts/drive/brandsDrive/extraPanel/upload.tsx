import React from 'react';
import {
    Backdrop, IconButton, Stack,
    Divider, Collapse,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Card,
    Checkbox
} from '@mui/material';

import { TransitionGroup } from 'react-transition-group';
import MDTypography from 'components/MDTypography';

import { icon_close, icon_file, icon_info } from '../../../../config/icons';
import { AttachmentsForm } from 'components/Upload';
import { PopupInfo } from 'components/PopupInfo';
import { MainTheme } from 'assets/settingsTheme';
import LoadingButton from '@mui/lab/LoadingButton';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import { GetDate } from 'utils/index';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { it } from 'date-fns/locale';
import { useTour } from "tour/TourProvider";
import { useNexTheme } from '@nex/theme-system';

interface UploadProps {
    panelStatus: boolean;
    ChangeUploadPanelStatus: () => void;
    folderList: any;
    typesList: any;
    loadStatus: boolean;
    folderSelected: any | null; //cartella selezionata se all'interno di una di queste
    filesTypesSelected: any | null; //cartella selezionata se all'interno di una di queste
    UploadFiles: ({ folder_, typeFile_, setFolder_, filesToUpload, settings }
        : {
            folder_: any;
            typeFile_: any,
            dataRange_: { da: Date | null, a: Date | null } | null;
            setFolder_: (prev: string) => void;
            setFilterTypes: (prev: string) => void;
            filesToUpload: any;
            settings?: { resetFolderSelected?: boolean, resetTypesSelected?: boolean }
        }) => void;
}

export const UploadPanel: React.FC<UploadProps> = ({ panelStatus, folderSelected, filesTypesSelected, ChangeUploadPanelStatus,
    folderList, typesList, UploadFiles, loadStatus }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;
    const { isOpen, index: tourIndex } = useTour();
    const lockInteractions = isOpen && tourIndex === 6;

    const [filterTypes, setFilterTypes] = React.useState<string | number>(''); //index della cartella selezionata nel filtro
    const handleChangeTypes = (event: any) => {
        setFilterTypes(event.target.value);
    };

    const [filterFolder, setFilterFolder] = React.useState<string | number>(''); //index della cartella selezionata nel filtro
    const handleChange = (event: any) => {
        setFilterFolder(event.target.value);
    };
    const [selectedFile, setSelectedFile] = React.useState<any>([]);

    const [dateState, setDateState] = React.useState({
        da: format(new Date(GetDate().today), 'yyyy-MM-dd'),
        a: format(new Date(GetDate().today), 'yyyy-MM-dd'),
    });
    const [dateRangeStatus, setDateRangeStatus] = React.useState({
        da: false,
        a: false,
    });
    const ChangeDateRangeStatus = (to: 'da' | 'a') => setDateRangeStatus(prev => ({ ...prev, [to]: !prev[to] }));
    const handleFilterChange = React.useCallback((from: 'da' | 'a', date: Date | null) => {
        if (date instanceof Date && !isNaN(date.getTime())) {
            const formattedDate = format(date, 'yyyy-MM-dd');
            setDateState(prev => ({ ...prev, [from]: formattedDate }));
        } else {
            // Se l'utente cancella la data, impostiamo un valore di default o la rimuoviamo
            setDateState(prev => ({ ...prev, [from]: "" }));
        }
    }, []);


    const Reset = () => {
        setDateRangeStatus({ da: false, a: false });
        setDateState({
            da: format(new Date(GetDate().today), 'yyyy-MM-dd'),
            a: format(new Date(GetDate().today), 'yyyy-MM-dd'),
        });
        setSelectedFile([]);
        setFilterFolder('');
        setFilterTypes('');
    }


    /**
    * Permette il delete del elemento selezionato
    * @param index number | index del elemento all'interno dell'array
    */
    const deleteAttached = (index: number) => {
        setSelectedFile((prev: any) => {
            const newSelectedFile = [...prev]; // Create a copy of the array
            newSelectedFile.splice(index, 1); // Remove the element at the specified index
            return newSelectedFile; // Return the updated array
        });
    };



    return <Backdrop open={panelStatus} sx={{ color: '#fff', zIndex: (theme: any) => theme.zIndex.drawer + 1 }}>
        <Card data-tour="drive-upload-modal" sx={{
            overflow: 'auto',
            backgroundColor: darkMode ? palette.dark.main : '',
            width: '40%', maxHeight: '60%', borderRadius: 5, transition: 'all 200ms ease-in', p: 2, gap: 2, pt: 0
        }}>{lockInteractions && (
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 10,
                    pointerEvents: 'auto',
                }}
                onClickCapture={(e) => e.stopPropagation()}
            />
        )}
            <Stack direction='row' gap={1} alignItems='center' sx={{ mb: 2, position: 'sticky', top: 0, backdropFilter: 'blur(1px)', zIndex: 2, pt: 2 }}>
                <PopupInfo icon={icon_info()} close={false}
                    body={folderSelected ?
                        "Seleziona piu file per poterli caricare nella cartella di destinazione (quella selezionata)."
                        : 'Seleziona una cartella e seleziona piu file per poterli caricare nella cartella di destinazione (quella selezionata).'} />
                <IconButton data-tour="drive-upload-modal-close"
                    disabled={lockInteractions || loadStatus}
                    sx={{
                        height: 'fit-content',
                        ml: 'auto',
                        backgroundColor: `${loadStatus ? palette.grey[400] : palette.error.light}!important`, "&:hover": { backgroundColor: palette.error.dark }
                    }} onClick={ChangeUploadPanelStatus}>
                    {icon_close({ color: palette.white.main })}
                </IconButton>
            </Stack>

            {!folderSelected && <FormControl fullWidth sx={{ height: 50, minHeight: 50 }}>
                <InputLabel id="demo-simple-select-label">Cartella</InputLabel>
                <Select
                    disabled={loadStatus}
                    labelId="demo-simple-select-label"
                    sx={{ height: 50, '&.MuiInputBase-root': { height: '100%' } }}
                    id="demo-simple-select"
                    value={filterFolder}
                    label="Cartella"
                    onChange={handleChange}
                >
                    <MenuItem value={""}>Nessuno</MenuItem>
                    {folderList.map(((e: any, index: number) => (
                        <MenuItem key={index} value={index}>{e.nome}</MenuItem>
                    )))}
                </Select>
            </FormControl>}

            <FormControl fullWidth sx={{ height: 50, minHeight: 50 }}>
                <InputLabel id="demo-simple-select-label">Tipologia File</InputLabel>
                <Select
                    disabled={loadStatus}
                    labelId="demo-simple-select-label"
                    sx={{ height: 50, '&.MuiInputBase-root': { height: '100%' } }}
                    id="demo-simple-select"
                    value={filterTypes}
                    label="Tipologia File"
                    onChange={handleChangeTypes}
                >
                    <MenuItem value={""}>Nessuno</MenuItem>
                    {typesList.map(((e: any, index: number) => (
                        <MenuItem key={index} value={index}>{e.descrizione}</MenuItem>
                    )))}
                </Select>
            </FormControl>

            <PopupInfo
                theme='info'
                icon={icon_info()}
                body="OPZIONALE, inserisci una data di validità, selezionando, il range, inzio o anche solo la fine della data impostando la validità del documento"
                close={false}
            />
            <Stack direction='row' gap={1} alignItems='center'>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
                    <Stack alignItems='center'>
                        <MDTypography variant='body2' sx={{ fontWeight: 500 }}>inizio validità </MDTypography>
                        <Stack direction='row' gap={1} alignItems='center'>
                            <Checkbox className='checkbox-suppliers'
                                checked={dateRangeStatus.da}
                                onChange={() => ChangeDateRangeStatus("da")} color="secondary"
                            />
                            <DatePicker
                                className='transition-all-css-100'
                                sx={!dateRangeStatus.da ? {
                                    backgroundColor: `${darkMode ? palette.grey[800] : palette.grey[300]}`,
                                    borderRadius: 2, cursor: 'no-drop', width: 150,
                                } : { cursor: 'no-drop', backgroundColor: palette.background.card, width: 150 }}
                                disabled={!dateRangeStatus.da}
                                defaultValue={new Date(dateState.da)}
                                onChange={e => handleFilterChange('da', e)}
                                minDate={new Date(GetDate().today)} />
                        </Stack>
                    </Stack>

                    <Stack alignItems='center'>
                        <MDTypography variant='body2' sx={{ fontWeight: 500 }}>fine validità </MDTypography>
                        <Stack direction='row' gap={1} alignItems='center'>
                            <Checkbox className='checkbox-suppliers'
                                checked={dateRangeStatus.a}
                                onChange={() => ChangeDateRangeStatus("a")} color="secondary"
                            />
                            <DatePicker
                                disabled={!dateRangeStatus.a}
                                className='transition-all-css-100'
                                sx={!dateRangeStatus.a ? {
                                    backgroundColor: `${darkMode ? palette.grey[800] : palette.grey[300]}`,
                                    borderRadius: 2, cursor: 'no-drop', width: 150,
                                } : { cursor: 'no-drop', backgroundColor: palette.background.card, width: 150 }}
                                defaultValue={new Date(dateState.a)}
                                onChange={e => handleFilterChange('a', e)}
                            />
                        </Stack>
                    </Stack>

                </LocalizationProvider>
            </Stack>

            <Divider sx={{ backgroundColor: `${darkMode ? palette.grey[500] : palette.black.main}` }} />


            {selectedFile.length > 0 && <Collapse in={true}>
                <Stack>
                    <MDTypography sx={{ pl: 2, pt: 1, pb: 1 }}>Allegati</MDTypography>
                    <TransitionGroup style={{ maxHeight: 250, overflow: 'auto' }}>
                        {selectedFile.map((item: any, index: number) => (
                            <Collapse key={index}><Stack direction='row' width='100%' gap={1} alignItems='center' p='5px 10px'>
                                {icon_file({ width: 20, height: 20 })}
                                <MDTypography variant='body2' fontSize="0.8rem">
                                    {item.name}
                                </MDTypography>
                                <Stack direction='row' ml='auto' alignItems='center'>
                                    <MDTypography variant='body2' fontSize="0.8rem">
                                        {parseFloat((item.size / (1024 * 1024))?.toFixed(2))} MB
                                    </MDTypography>
                                    <Divider orientation='vertical' sx={{ backgroundColor: '#000', height: 20 }} />
                                    <IconButton
                                        disabled={loadStatus}
                                        onClick={() => deleteAttached(index)}
                                        sx={{ padding: "3px" }} aria-label="delete" size="small">
                                        {icon_close({ color: loadStatus ? palette.grey[500] : palette.error.main })}
                                    </IconButton>
                                </Stack>

                            </Stack></Collapse>
                        ))
                        }
                    </TransitionGroup>
                    <Divider sx={{ backgroundColor: '#000' }} />
                </Stack>
            </Collapse>}

            <Stack direction='row'>
                <AttachmentsForm selectedFile={selectedFile} setSelectedFile={setSelectedFile} buttonType='button' loading={loadStatus} maxFileSize={50} />
                {(selectedFile && Array.isArray(selectedFile) && selectedFile.length > 0) && <LoadingButton
                    loading={loadStatus}
                    onClick={() => {
                        UploadFiles({
                            folder_: (folderSelected || folderList[filterFolder]),
                            typeFile_: (filesTypesSelected || typesList[filterTypes]),
                            dataRange_: (dateRangeStatus.da || dateRangeStatus.a) ?
                                {
                                    da: dateRangeStatus.da ? new Date(dateState.da) : null,
                                    a: dateRangeStatus.a ? new Date(dateState.a) : null
                                }
                                : null,
                            setFolder_: setFilterFolder,
                            setFilterTypes: setFilterTypes,
                            filesToUpload: selectedFile,
                            settings: { resetFolderSelected: true }
                        });
                        Reset();
                    }}
                    variant='contained'
                    sx={{ width: 200, color: '#fff' }}>
                    Carica il file
                </LoadingButton>}
            </Stack>
        </Card>
    </Backdrop>
}