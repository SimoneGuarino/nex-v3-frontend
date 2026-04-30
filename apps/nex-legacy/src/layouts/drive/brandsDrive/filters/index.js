import React from 'react';
import {
    Button,
    Card, Checkbox, Collapse, Divider, Fade, FormControl, IconButton, InputLabel, MenuItem, Select, Skeleton, Stack
} from '@mui/material';

import { icon_filter, icon_info, icon_search, icon_travelExplore, icon_upload } from 'config/icons';
import { MainTheme } from 'assets/settingsTheme';
import SearchHere from 'components/FDSearch/searchHere';
import HintBox from '../search/hintBox';
import { enqueueSnackbar } from 'components/MessageBox';
import { TransitionGroup } from 'react-transition-group';
import MDTypography from 'components/MDTypography';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import { GetDate } from 'utils/index';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { it } from 'date-fns/locale';
import { PopupInfo } from 'components/PopupInfo';
import { useTour } from "tour/TourProvider";
import { useNexTheme } from '@nex/theme-system';


export function FiltersDocumentsPDF({ folderList, typesList,
    loadStatus, CheckAdminDev,
    setFolderSelected, FindFolderFiles, ChangeUploadPanelStatus,
    setFilesTypesSelected, setFileView, folderSelected, tour, extraFilters,
    setExtraFilters, filtersToggleLocked,
}) {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const isTourOpen = !!tour?.isOpen;

    const handleUploadClick = () => {
        if (!isTourOpen) {
            ChangeUploadPanelStatus();
        }
    };

    //variabile per il pannello dei filtri extra
    //const [extraFilters, setExtraFilters] = React.useState(false);
    const filtersLocked = !!tour?.isOpen;
    //variabile per il pannello dei suggerimenti nel campo di ricerca
    const [hintsBoxActive, setHintBoxActive] = React.useState(false);
    //dedicato all'animazione di loading del'infinite scroll
    const [infinteScrollAnim, setInfiniteScrollAnim] = React.useState(false);

    const [filterTypes, setFilterTypes] = React.useState(''); //index della cartella selezionata nel filtro
    const handleChangeTypes = (event) => {
        setFilterTypes(event.target.value);
    };

    const [filterFolder, setFilterFolder] = React.useState(''); //index della tipologia selezionata nel filtro
    const handleChangeFolder = (event) => {
        setFilterFolder(event.target.value);
    };

    //variabile per la gestione del filtro data
    const [dateState, setDateState] = React.useState({
        da: format(new Date(GetDate().today), 'yyyy-MM-dd'),
        a: format(new Date(GetDate().today), 'yyyy-MM-dd'),
    });
    const [dateRangeStatus, setDateRangeStatus] = React.useState({
        da: false,
        a: false,
    });
    const ChangeDateRangeStatus = (to) => setDateRangeStatus(prev => ({ ...prev, [to]: !prev[to] }));
    const handleFilterChange = React.useCallback((from, date) => {
        if (date instanceof Date && !isNaN(date.getTime())) {
            const formattedDate = format(date, 'yyyy-MM-dd');
            setDateState(prev => ({ ...prev, [from]: formattedDate }));
        } else {
            // Se l'utente cancella la data, impostiamo un valore di default o la rimuoviamo
            setDateState(prev => ({ ...prev, [from]: "" }));
        }
    }, []);



    const FindFiles = () => {
        if (folderSelected || (folderList[filterFolder] && folderList[filterFolder]._id !== undefined)
            || (typesList[filterTypes] && typesList[filterTypes]._id !== undefined)) {
            setFileView(true);

            //setFolderSelected(folderList[filterFolder]);

            setFilesTypesSelected(typesList[filterFolder]);
            return FindFolderFiles({
                folderID: (folderList[filterFolder]?._id || folderSelected?._id || null),
                typesID: (typesList[filterTypes]?._id || null),
                dateState: (dateRangeStatus.da || dateRangeStatus.a) ?
                    {
                        da: dateRangeStatus.da ? new Date(dateState.da) : null,
                        a: dateRangeStatus.a ? new Date(dateState.a).setHours(23, 59, 59, 999) : null
                    }
                    : null
            });
        } else {
            return enqueueSnackbar("Per favore seleziona almeno un campo tra i filtri per eseguire la ricerca.", {
                title: "Seleziona un filtro",
                type: "warning",
            });
        };
    };

    const clickOnHintItem = ({ data, setSearchText }) => {
        setFileView(true);
        setHintBoxActive(false);

        const folderIndex = folderList.findIndex(e => e._id === data.idCartella);
        if (folderIndex === -1) {
            return console.error('Non sono state trovate informazioni sul fornitore nei dati ricevuti dal server.');
        };
        const folderData = folderList[folderIndex];
        //const typesData = typesList[folderIndex];

        setFilterFolder(folderIndex);
        setFolderSelected(folderData);
        FindFolderFiles({ folderID: folderData._id, dataToAdd: data });
    };

    const { isOpen, index: tourIndex } = useTour();
    const lockInteractions = isOpen && (tourIndex === 1 || tourIndex === 3);

    return <Fade in={true}>
        <Card>
            <Stack direction='row' sx={{
                p: 1, alignItems: 'center', height: '100%',
                borderRadius: 5
            }}><Stack direction='row' data-tour="drive-filters" sx={{
                alignItems: 'center', height: '100%',
                borderRadius: 5
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
                    {icon_travelExplore({ color: '#9f9f9f', width: 30, height: 30 })}


                    <FormControl sx={{ width: 300, height: '100%', p: 0.5 }}>
                        <InputLabel id="demo-simple-select-label" >Cartella</InputLabel>
                        <Select
                            labelId="demo-simple-select-label"
                            sx={{ height: 40, '&.MuiInputBase-root': { height: '100%' } }}
                            id="demo-simple-select"
                            value={filterFolder}
                            label="Cartella"
                            onChange={handleChangeFolder}
                            MenuProps={{
                                disablePortal: true,
                                PaperProps: { 'data-tour-allow': true },
                            }}
                        >
                            <MenuItem value={""}>Nessuno</MenuItem>
                            {folderList.map(((e, index) => (
                                <MenuItem key={index} value={index}>{e.nome}</MenuItem>
                            )))}
                        </Select>
                    </FormControl>

                    <Divider
                        orientation="vertical"
                        sx={{ height: 28, backgroundColor: `${darkMode ? palette.grey[300] : palette.grey[800]}` }} />

                    {(folderList && folderList.length > 0) ?
                        <SearchHere hintsBoxActive={hintsBoxActive} setHintBoxActive={setHintBoxActive}
                            setInfiniteScrollAnim={setInfiniteScrollAnim} infinteScrollAnim={infinteScrollAnim}
                            HintBoxElement={HintBox}
                            placeholder='Cerca File..'
                            clickOnHintItem={clickOnHintItem}
                            fetchSettings={{
                                url: `${import.meta.env.VITE_API_PDF_READER}brd/src-bd-fls`
                            }} /> :
                        <Skeleton sx={{ width: 300, height: 45, bgcolor: `${darkMode ? '#1c1c1c' : ''}` }} />
                    }

                    <FormControl sx={{ width: 150, height: '100%', p: 0.5 }}>
                        <InputLabel id="demo-simple-select-label">Tipologia Files</InputLabel>
                        <Select
                            labelId="demo-simple-select-label"
                            sx={{ height: 40, '&.MuiInputBase-root': { height: '100%' } }}
                            id="demo-simple-select"
                            value={filterTypes}
                            label="Tipologia Files"
                            onChange={handleChangeTypes}
                            MenuProps={{
                                disablePortal: true,
                                PaperProps: { 'data-tour-allow': true },
                            }}
                        >
                            <MenuItem value={""}>Nessuno</MenuItem>
                            {typesList.map(((e, index) => (
                                <MenuItem key={index} value={index}>{e.descrizione}</MenuItem>
                            )))}
                        </Select>
                    </FormControl></Stack>


                <Stack direction='row' alignItems='center' sx={{ ml: 'auto' }}>
                    <IconButton data-tour="drive-filters-extra" onClick={() => {
                        if (filtersLocked) return;
                        setExtraFilters(prev => !prev);
                    }} sx={{
                        background: extraFilters ? palette.primary.main : "",
                        "&:hover": { background: extraFilters ? palette.primary.light : "" }
                    }}
                        data-tooltip-id='general-situazione-fidi-tooltip' data-tooltip-content='Seleziona Altri filtri'>
                        {icon_filter({
                            width: 30, height: 30, color: darkMode ?
                                extraFilters ?
                                    palette.grey[300]
                                    : "#7b809a"
                                : ""
                        })}
                    </IconButton>

                    <IconButton data-tour="drive-search" disabled={loadStatus.search} onClick={FindFiles}>
                        {icon_search({
                            width: 30, height: 30,
                            color:
                                `${loadStatus.data ?
                                    !darkMode ? palette.grey[300] : palette.grey[800] :
                                    !darkMode ? palette.grey[600] : palette.grey[500]
                                }`
                        })}
                    </IconButton>

                    <Divider
                        orientation="vertical"
                        sx={{ height: 28, backgroundColor: `${darkMode ? palette.grey[300] : palette.grey[800]}` }} />
                    {CheckAdminDev && <Button data-tour="drive-upload"
                        disabled={loadStatus.upload}
                        color='secondary'
                        onClick={handleUploadClick}
                        sx={{ p: 0, pl: 1.5, pr: 1.5, ml: 1 }}
                        variant='outlined'
                        endIcon={icon_upload({ width: 20, height: 20 })}>
                        Carica File
                    </Button>}
                </Stack>
            </Stack>

            <TransitionGroup>
                {extraFilters && <Collapse>
                    <Stack p={2} gap={1} data-tour="drive-filters-2">
                        {lockInteractions && (
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
                        <Divider
                            sx={{ backgroundColor: `${darkMode ? palette.grey[300] : palette.grey[800]}`, mt: 0 }} />
                        <MDTypography variant='h5'>Filtri Extra</MDTypography>
                        <Stack gap={1} width='fit-content'>
                            <PopupInfo body='Seleziona la data di inizio e fine validità dei files' close={false} icon={icon_info()} />
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
                        </Stack>
                    </Stack>
                </Collapse>}
            </TransitionGroup>
        </Card>
    </Fade>
}