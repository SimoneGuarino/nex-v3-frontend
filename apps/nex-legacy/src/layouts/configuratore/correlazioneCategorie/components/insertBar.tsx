import React from "react";
import { Autocomplete, Card, Stack, TextField } from "@mui/material";
import MDTypography from "components/MDTypography";
import VirtualizedList from "./virtualizedCategoryFilter.js";
import FDButton from "components/UI/buttons/FDButton";
//icons
import { GoPlus } from "react-icons/go";

const GoPlusIcon = GoPlus as React.FC<{ size?: number, className?: string }>;

interface InsertElementsProps {
    linea: { valore: string, descrizione: string }
    gruppo: { valore: string, descrizione: string }
    famiglia: { valore: string, descrizione: string },
    raggruppamento: { valore: string | number, descrizione: string }
}

interface InsertBarProps {
    distributorStructure: {
        focelda: {
            categorie: Array<{
                linea: string,
                descrizione: string,
                gruppi: Array<{
                    gruppo: string,
                    descrizione: string,
                    famiglie: Array<{
                        famiglia: string,
                        descrizione: string,
                        buyer: string[]
                    }>
                }>
            }>;
            gruppi: Array<{
                gruppo: string,
                descrizione: string,
                famiglie: Array<{
                    famiglia: string,
                    descrizione: string,
                    buyer: string[]
                }>
            }>;
            famiglie: Array<{
                famiglia: string,
                descrizione: string,
                buyer: string[]
            }>;
            raggruppamenti: Array<{ valore: string, descrizione: string }>;
        },
        fornitore: {
            linee: Array<{ valore: string, descrizione: string }>;
            gruppi: Array<{ valore: string, descrizione: string }>;
            famiglie: Array<{ valore: string, descrizione: string }>;
        }
    };
    insertConfigInTable: ({ focData, distData }: { focData: InsertElementsProps, distData: InsertElementsProps }) => void;
}
export const InsertBar: React.FC<InsertBarProps> = ({ distributorStructure, insertConfigInTable }) => {
    //  Stato che contiene i dati inseriti dall'utente per focelda.
    const [foceldaData, setFoceldaData] = React.useState<any>({
        linee: null,
        gruppi: null,
        famiglie: null,
        raggruppamenti: null,
    });
    const HandleFoceldaData = ({ from, data }: { from: string, data: any }) => setFoceldaData((prev: any) => ({ ...prev, [from]: data }));
    //  Stato che contiene i dati inseriti dall'utente per distributori.
    const [DistaData, setDistaData] = React.useState<any>({
        linee: null,
        gruppi: null,
        famiglie: null,
    });
    const HandleDistaData = ({ from, data }: { from: string, data: any }) => setDistaData((prev: any) => ({ ...prev, [from]: data }));

    const ResetHandleData = () => {
        setFoceldaData({
            linee: null,
            gruppi: null,
            famiglie: null,
            raggruppamenti: null,
        });
        setDistaData({
            linee: null,
            gruppi: null,
            famiglie: null
        });
    };


    const data = [
        {
            label: "Linee",
            ref: "linea",
            secRef: 'descrizione',
            stateRef: foceldaData.linee,
            noneOnClick: () => {
                HandleFoceldaData({ from: "linee", data: null });
            },
            menuItemOnClick: (item: any, id: any) => {
                HandleFoceldaData({ from: "linee", data: item });
            },
            dataArray: distributorStructure.focelda.categorie
        },
        {
            label: "Gruppi",
            ref: "gruppo",
            secRef: 'descrizione',
            stateRef: foceldaData.gruppi,
            noneOnClick: () => {
                HandleFoceldaData({ from: "gruppi", data: null });
            },
            menuItemOnClick: (item: any, id: any) => {
                HandleFoceldaData({ from: "gruppi", data: item });
            },
            dataArray: (foceldaData.linee?.gruppi || distributorStructure.focelda.gruppi)
        },
        {
            label: "Famiglie",
            ref: "famiglia",
            secRef: 'descrizione',
            stateRef: foceldaData.famiglie,
            noneOnClick: () => {
                HandleFoceldaData({ from: "famiglie", data: null });
            },
            menuItemOnClick: (item: any, id: any) => {
                HandleFoceldaData({ from: "famiglie", data: item });
            },
            dataArray: (foceldaData.gruppi?.famiglie || distributorStructure.focelda.famiglie)
        },
        {
            label: "Raggruppamenti",
            ref: "descrizione",
            stateRef: foceldaData.raggruppamenti,
            noneOnClick: () => {
                HandleFoceldaData({ from: "raggruppamenti", data: null });
            },
            menuItemOnClick: (item: any, id: any) => {
                HandleFoceldaData({ from: "raggruppamenti", data: item });
            },
            dataArray: distributorStructure.focelda.raggruppamenti
        }
    ];

    const convertFoceldaData = () => {
        let foceldaDataConverted = {
            linea: {
                valore: foceldaData.linee?.linea || null,
                descrizione: foceldaData.linee?.descrizione
            },
            gruppo: {
                valore: foceldaData.gruppi?.gruppo || null,
                descrizione: foceldaData.gruppi?.descrizione
            },
            famiglia: {
                valore: foceldaData.famiglie?.famiglia || null,
                descrizione: foceldaData.famiglie?.descrizione
            },
            raggruppamento: foceldaData.raggruppamenti
        };
        return foceldaDataConverted
    }


    const filterRender = () => (
        <Stack direction="row" gap={1} sx={{
            alignItems: "center",
            flexWrap: "wrap",
        }}>
            {data.map((element, index) => {
                return <VirtualizedList key={index} data={element} />
            })}
        </Stack>
    );


    return <Card sx={{ padding: 2, display: "flex", alignItems: "center", flexDirection: "row", justifyContent: 'space-between' }}>
        <Stack height='100%' width='100%' gap={2}>
            <Stack width='100%'>
                <MDTypography variant="h6">
                    Categorie Focelda
                </MDTypography>
                {filterRender()}
            </Stack>
            <Stack>
                <MDTypography variant="h6">
                    Categorie Brand Selezionato
                </MDTypography>
                <Stack gap={1} direction='row' height='100%'>
                    {
                        ['linee', 'gruppi', 'famiglie'].map((categoria: string, i: number) => (
                            <Autocomplete
                                key={i}
                                options={(distributorStructure as any).fornitore[categoria]}
                                value={DistaData[categoria]}
                                onChange={(_: any, data_: any) => HandleDistaData({ from: categoria, data: data_ })}
                                getOptionLabel={(option) => option?.valore + `${option?.descrizione ? ' - ' + option?.descrizione : ''}`}
                                renderInput={(params) => (
                                    <TextField {...params} sx={{
                                        '&.MuiFormControl-root div .MuiButtonBase-root ': {
                                            fontSize: '1.1rem',
                                        },
                                        '&.MuiFormControl-root div .MuiInputBase-input': { fontSize: '0.8rem' },
                                    }}
                                        placeholder={`Seleziona ${categoria}`} />
                                )}
                                sx={{ width: 200 }}
                            />
                        ))
                    }
                </Stack>
            </Stack>
        </Stack>
        
        <FDButton icon={<GoPlusIcon size={20}/>} className='mt-auto' color="primary" onClick={() => {
            insertConfigInTable({ focData: convertFoceldaData(), distData: DistaData });
            ResetHandleData();
        }}>
            Crea
        </FDButton>
    </Card>
}