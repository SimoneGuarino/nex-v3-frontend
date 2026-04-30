import React from 'react';

import { TableVirtualized } from 'components/Virtualized/table';
import { Fade, Stack } from '@mui/material';
import { icon_view } from 'config/icons';
import { ExitinigOrderAPI, FindOrderAPI } from './fetchData/findOrder';
import { MainTheme } from 'assets/settingsTheme';
import { useNexTheme } from '@nex/theme-system';


interface TableProps {
    userContext: any
    data: any;
    onLoad: boolean;
    checkAdminDev: boolean;
    abortController: any;

    setData: (prev: any) => void;
    setGeneralData: (prev: any) => void;
    setOnLoad: (prev: boolean) => void;
    setErr: (prev: boolean) => void;
    setTableData: (prev: any) => void;
    setFBAlreadyInRequest: (prev: boolean) => void;
    setGeneralCheck: (prev: any) => void;
    /** Salva lo stato degli ordini se è in tour */
    saveLastDetailForTour: (data: { singleData: any }) => void;
}
export const CustomersOrdersTable: React.FC<TableProps> = ({
    userContext, onLoad, checkAdminDev, data, abortController, setGeneralCheck,
    setGeneralData, setTableData, setOnLoad, setErr, setFBAlreadyInRequest, setData, saveLastDetailForTour
}) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const HandleCheckChange = ({ index, bool }: { index: number, bool: boolean }) => {
        setData((prev: any) => {
            const copy = { ...prev };
            copy.dati[index].checkbox = bool;
            if (copy.dati[index].codice) {
                setGeneralCheck((prev: any) => {
                    const updatedState = { ...prev };

                    if (!bool) {
                        // Rimuove il campo se bool è false
                        delete updatedState[copy.dati[index].codice];
                    } else {
                        // Aggiorna o aggiunge il campo se bool è true
                        updatedState[copy.dati[index].codice] = bool;
                    }

                    return updatedState;
                });

            }
            return copy;
        });
    };

    /** Cerca i dettagli del ordine FB quando la richiesta proviene da un gruppo */
    const Search = (index: number, allData: Array<{ codice: string }>) => {
        if (allData.length > 0 && index !== undefined) {
            setOnLoad(true);
            const elment = allData[index];
            ExitinigOrderAPI({
                userContext, abortController, setFBAlreadyInRequest,
                setErr, nord: elment.codice.toString()
            });

            FindOrderAPI({
                userContext, 
                abortController, 
                setGeneralData: setGeneralData, 
                setTableData: setTableData,
                setErr, setOnLoad, nord: elment.codice.toString(), only_tb_dt: true,
                handleComplete: ({ singleData }) => saveLastDetailForTour({ singleData }),
            });
        };
    };

    const [columns, setColumns] = React.useState([
        { key: '', label: 'check', width: 100, type: 'checkbox', onChange: HandleCheckChange, sx: { textAlign: 'center' } },
        {
            key: [], fieldToTake: [
                {
                    key: 'Exclude', type: 'button', title: 'Ispeziona FB', ariaLabel: 'escludi', dataTour: "sblocco-table", icon: icon_view({
                        color: onLoad ?
                            '#ccc'
                            : darkMode ?
                                palette.grey[600]
                                : false
                    }),
                    loadState: onLoad,
                    funcAction: Search, onHoverColor: '#f038426b'
                },
            ], label: 'Opzioni', type: 'info', excludeLogic: true, sx: { alignItems: 'flex-start' }
        },
        { key: 'codice', label: 'Codice FB', sort: true, width: 150, sortType: 'Number', type: 'default', sx: { textAlign: 'center' } },
        { key: 'data', label: 'Data di creazione', sort: true, width: 150, sortType: 'Number', type: 'date', dateType: 'ibmi', sx: { textAlign: 'center' } },
        { key: 'totale', label: 'Totale', sort: true, width: 150, sortType: 'Number', type: 'eur', sx: { textAlign: 'center' } },
    ]);

    React.useEffect(() => {
        if (checkAdminDev) {
            setColumns((prev: Array<any>) =>
                // Filtra l'array e rimuove l'elemento con label: 'check' e type: 'checkbox'
                prev.filter((col) => !(col.label === 'check' && col.type === 'checkbox'))
            );
        };
    }, [checkAdminDev]);


    return <Fade in={true} timeout={1000}>
        <Stack height='100%'>
            <TableVirtualized
                columns={columns}
                setColumns={setColumns}
                data={data.dati || []}
                setData={(updater: any) => {
                    setData((prev: any) => {
                        const prevRows = prev?.dati ?? [];

                        const nextRows =
                            typeof updater === "function"
                                ? updater(prevRows)   // i filtri della tabella lavorano sull'ARRAY
                                : updater;            // oppure passi direttamente un array
                        return {
                            ...prev,
                            dati: nextRows,          // rimetti l'array filtrato dentro prev.dati
                        };
                    });
                }}
                results={data.dati.length}
                footerSettings={{ showColSettings: false }}
            />
        </Stack>
    </Fade>
}