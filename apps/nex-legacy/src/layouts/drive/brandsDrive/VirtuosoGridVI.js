import React, { Fragment, useMemo } from 'react';

//@Internal Packages
import { Success } from 'components/Success';
import noDataWEBP from 'assets/images/9170826-no-data-pdf-documenti.webp'
import MDTypography from 'components/MDTypography';
import ItemBoxStyled from './ItemBoxStyled';

//@External Packages
import { VirtuosoGrid } from 'react-virtuoso';
import styled from '@emotion/styled'

import { Fade, Stack, Card } from '@mui/material';
import Skeleton from '@mui/material/Skeleton';
import { LoadScreen } from 'components/Load';
import { useNexTheme } from '@nex/theme-system';




const ListContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
`


export const VirtuosoGridVI = ({ data, setFolderSelected, loadStatus,
    UploadFiles, selectedFile, SingleSelectionFile, addFileToSelected, FindFolderFiles, filesView }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";

    const [success, setSuccess] = React.useState(false); //Success Opereation

    const ItemContainer = styled.div`
        padding: 0.5rem;
        min-width: 320px;
        max-width: '100%';
        width: 100%;
        flex: 33%;
        height: 70px;
        display: flex;
        flex: none;
        align-content: stretch;
        box-sizing: border-box;
        transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms !important;
    `
    const [visibleRange, setVisibleRange] = React.useState({
        startIndex: 0,
        endIndex: 0,
    })


    const InnerItem = React.memo(({ index, elm }) => {
        return <ItemBoxStyled
            key={index}
            index={index}
            elm={elm}
            folder={filesView}
            setFolder={setFolderSelected}
            SingleSelectionFile={SingleSelectionFile}
            selectedFile={selectedFile}
            addFileToSelected={addFileToSelected}
            FindFolderFiles={FindFolderFiles} />
    }, (prevProps, nextProps) => {
        // Controlla le proprietà specifiche di elm per determinare l'uguaglianza
        return (
            prevProps.index === nextProps.index &&
            prevProps.elm.id === nextProps.elm.id // Ad esempio, controlla l'ID dell'elemento
        );
    }, [selectedFile, filesView]);

    const renderRow = React.useCallback((index, elm) => {
        return <InnerItem index={index} elm={elm} />;
    }, [visibleRange, data, selectedFile, filesView])


    // Drag and Drop Files
    /*const [isDragging, setIsDragging] = React.useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true); // Attiva lo stato di dragging
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false); // Disattiva lo stato di dragging
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false); // Disattiva lo stato di dragging

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFiles = Array.from(e.dataTransfer.files);

            // Filtra i file in base alle estensioni permesse
            const filteredFiles = droppedFiles.filter((file) => {
                const fileExtension = file.name.split('.').pop()?.toLowerCase();
                return fileExtension && allowedExtensions.includes(fileExtension);
            });

            if (filteredFiles.length === 0) {
                return enqueueSnackbar("Impossibile importare i file, sembra che alcuni dei file selezionati siano di una tipologia non supportata. Scegli un formato valido.", {
                    title: 'Ops.. File non Supportati',
                    type: 'error',
                });
            };

            UploadFiles({ filesToUpload: droppedFiles })
            e.dataTransfer.clearData();
        };
    };*/



    const memoRender = useMemo(() => (
        <Stack height={'100%'}
            //onDragOver={filesView && handleDragOver}
            //onDragLeave={filesView && handleDragLeave}
            //onDrop={filesView && handleDrop}
            translate="no"
            sx={{ transition: 'all 150ms ease-in' }}
        >
            {/*<Fade in={Boolean(isDragging && filesView)} timeout={450}><Stack justifyContent='center' alignItems='center'
                sx={{
                    position: 'absolute', top: 0, width: '100%', height: '100%', borderRadius: 2,
                    zIndex: 1, backdropFilter: 'blur(1px)', backgroundColor: "#ffffffd6",
                }}>
                <Stack justifyContent='center' alignItems='center'
                    sx={{ outlineStyle: 'dashed', width: "90%", height: "95%" }} gap={1}>
                    {icon_file({ width: 60, height: 60 })}
                    <MDTypography variant="h4">
                        Rilascia i tuoi file qui
                    </MDTypography>
                </Stack>
            </Stack></Fade>*/}

            {!loadStatus ?
                data.length > 0 ?
                    <VirtuosoGrid
                        style={{ height: '100%', width: '100%' }}
                        overscan={10}
                        totalCount={data.length}
                        components={{
                            Item: ItemContainer,
                            List: ListContainer,
                            ScrollSeekPlaceholder: ({ height, width, index }) => (
                                <Fade in={true}>
                                    <ItemContainer>
                                        <Skeleton sx={{ width: '100%', height: 85, bgcolor: `${darkMode ? '#1c1c1c' : ''}` }} />
                                    </ItemContainer>
                                </Fade>
                            ),
                        }}
                        rangeChanged={setVisibleRange}
                        itemContent={index => renderRow(index, data[index])}
                        scrollSeekConfiguration={{
                            enter: velocity => Math.abs(velocity) > 325,
                            exit: velocity => Math.abs(velocity) < 30,
                        }} />
                    :
                    <Stack sx={{ alignItems: "center", filter: 'grayscale(1)' }}>
                        <img src={noDataWEBP} className='avoid-drag' loading='lazy' style={{ width: "100%", maxWidth: 500, opacity: 0.7 }} alt="No product Found" />
                        <MDTypography component="h3" style={{ fontWeight: "normal", textAlign: "center", fontSize: "0.6em", maxWidth: "50%" }}>
                            Sembra che per il momento non ci siano elementi da visualizzare!, prova a modificare i parametri di ricerca</MDTypography>
                    </Stack>
                : <LoadScreen />}
        </Stack>
    ), [data, selectedFile, filesView, loadStatus, darkMode]);

    return (
        <Fragment>
            <Success success={success} setSuccess={setSuccess} />
            <Card sx={{ marginTop: 2 }} elevation={0} style={{ height: '100%' }} data-tour="drive-select-folder">
                {memoRender}
            </Card>
        </Fragment>
    );
};