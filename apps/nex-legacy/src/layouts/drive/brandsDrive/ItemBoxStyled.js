import React, { memo } from 'react';
//@MUI Components
import { Stack } from '@mui/material';

//internal Components
import MDTypography from "components/MDTypography";

import { MainTheme } from 'assets/settingsTheme';
import { icon_file, icon_folder } from 'config/icons';
import { useNexTheme } from '@nex/theme-system';


/**
 * componente funzionale di struttura del singolo box elemento.
 * @param index in input l'index della posizione del'oggetto nel 'array
 * @param elm fa riferimento all'interno oggetto selezionato.
 * @param handleOpenMenu arrow function che determina lo stato di apertura del moreMenu
 * @param selectedFile variabile di stato che definisce l'array dei file selezionati
 * @param SingleSelectionFile funzione di callback per definire che è l'unico elemento ad
 * essere in fase di clicked
 * @param addFileToSelected funzione di callback per aggiungere l'elemento all'array di 
 * clicked status
 */
function ItemBoxStyled({ index, elm, selectedFile, SingleSelectionFile, folder, setFolder,
    FindFolderFiles, addFileToSelected }) {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const detailsData = [{
        key: "File Totali",
        value: "elm.elementiTotali?.toString()",
        condition: !folder && elm.elementiTotali !== undefined,
    }, {
        key: "Inizio Validità",
        value: "new Date(elm.validita.da).toLocaleDateString('it')",
        condition: folder && elm.validita != undefined && elm.validita && elm.validita.da,
    }, {
        key: "Fine Validità",
        value: "new Date(elm.validita.a).toLocaleDateString('it')",
        condition: folder && elm.validita != undefined && elm.validita && elm.validita.a,
    }, {
        key: "Tipologia",
        value: "elm.tipoDrive?.toString() || 'Non Definita'",
        condition: folder && elm.tipoDrive !== undefined,
    }, {
        key: "Dimensione",
        value: "elm.dimensione?.toString() + ' MB'",
        condition: elm.dimensione !== undefined,
    }, {
        key: "Ultima Modifica",
        value: "folder ? new Date(elm.creato).toLocaleDateString('it-IT') : elm.ultimaModifica",
        condition: elm.dimensione !== undefined,
    }]

    const css_h1 = {
        fontSize: '0.87rem',
        lineHeight: 'normal',
    };


    const handleClick = React.useCallback((e) => {
        // se è stata già selezionata la cartella
        if (folder) {
            // Verifica se il tasto Ctrl è stato premuto durante il click
            if (e.ctrlKey) {
                // Esegui le operazioni desiderate per il click con Ctrl
                addFileToSelected(index)
            } else {
                // Esegui le operazioni desiderate per il click normale
                SingleSelectionFile(index)
            }
        } else {
            FindFolderFiles({ folderID: elm._id });
            setFolder(elm);
        }
    }, []);


    const Body = React.memo(() => (
        <Stack translate="no"
            sx={selectedFile.includes(index) ? { backgroundColor: `${darkMode ? palette.primary.dark : palette.primary.main}` }
                : {
                    backgroundColor: `${elm.evidance ?
                        '#f1ce2059'
                        : darkMode ? palette.grey[900] : palette.grey[200]}`, '&:hover': {
                            backgroundColor: `${darkMode ? palette.grey[800] : palette.grey[300]}`
                        }
                }}
            style={{
                minWidth: 300, width: '100%', borderRadius: 10,
                transition: 'background-color 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms !important',
                cursor: 'pointer'
            }}
            gap={10}
            direction='row'
            pl={2} pr={2}
            justifyContent="flex-start"
            alignItems='center'
            onClick={(e) => handleClick(e)}
        >
            <Stack gap={1} direction='row' alignItems='center' sx={{ width: '100%' }}>
                {(folder ? icon_file : icon_folder)({ width: 25, height: 25 })}
                <MDTypography component="h3" data-tooltip-id="actionBar-tooltip" data-tooltip-content={elm.nome}  
                sx={{ ...css_h1, 
                    whiteSpace: "nowrap",  
                    overflow: "hidden",       
                    textOverflow: "ellipsis",
                    width: "200px"
                }} style={{ fontWeight: 300, fontSize: '1rem' }}>
            {elm.nome}
        </MDTypography>
            </Stack >

    {
        detailsData.map((element, index) => {
            if (element.condition) {
                return <Stack key={index} alignItems='center' justifyContent='center' height='100%' minWidth={80}>
                    <MDTypography component="h3" sx={css_h1}
                        style={{ fontWeight: 600, fontSize: '0.62rem', }}>
                        {element.key}
                    </MDTypography>
                    <MDTypography component="h3" sx={css_h1}
                        style={{ fontWeight: 200, fontSize: '0.77rem', }}>
                        {eval(element.value)}
                    </MDTypography>
                </Stack>
            }
        })
    }
        </Stack >
    ), [selectedFile])


    return <Body />
}

export default memo(ItemBoxStyled);