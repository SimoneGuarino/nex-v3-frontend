import React from 'react';
import { Autocomplete, Button, Card, Collapse, IconButton, Stack, TextField } from '@mui/material';

import { MainTheme } from 'assets/settingsTheme';
import MDTypography from 'components/MDTypography';
import { icon_add, icon_delete, icon_info, icon_settings, icon_view } from 'config/icons';
import { NumberToEuro } from 'utils/numberToEuro';
import { BalanceQuarters } from '../../components/balanceQuarters';
import { TransitionGroup } from 'react-transition-group';
import { Tag } from 'components/Tag/Tag';
import { PopupInfo } from 'components/PopupInfo';
import { enqueueSnackbar } from 'components/MessageBox';
import { DeleteRowAPI } from '../../fetchData/deleteItem';
import { UserContext } from 'context/UserContext';
import { useNexTheme } from '@nex/theme-system';


interface Brands {
    nome: string;
    trimestri: {
        q1: number,
        q2: number,
        q3: number,
        q4: number
    },
};



interface AltroDetailsProps { dataOnInspect: any; quartersList: string[]; quartersDiff: any };
export const AltroDetails: React.FC<AltroDetailsProps> = ({ dataOnInspect, quartersList, quartersDiff }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;


    return <Stack p={2} minWidth={200} height='100%' gap={0.5}
        sx={{ borderLeft: `1px solid ${darkMode ? palette.grey[800] : palette.grey[400]}`, pl: 2 }}>
        <Stack direction='row' alignItems='center' gap={1}>
            {icon_info({ width: 30, height: 30 })}
            <MDTypography variant='h4'>
                Altro
            </MDTypography>
        </Stack>
        {(dataOnInspect && dataOnInspect.trimestri) && quartersList.map((quarter: string, index: number) => (
            <Stack key={index} direction='row' alignItems='center' justifyContent='space-between'>
                <MDTypography variant='body2'>{quarter?.toUpperCase()}</MDTypography>
                {quartersDiff && <MDTypography fontSize='0.8rem' sx={{ fontWeight: 600 }}>
                    {NumberToEuro({ convert: quartersDiff[quarter]})}
                </MDTypography>}
            </Stack>
        ))}
    </Stack>
};


interface ConfigurationsProps {
    dataOnInspect: { linea: string };
    marche: Array<Brands>;
    brandIndexOnInspect: null | number;
    setBrandIndexOnInspect: (prev: any) => void;
    RemoveBrand: ({ item } : { item: any }) => void;
};
export const Configurations: React.FC<ConfigurationsProps> = ({ dataOnInspect, marche, brandIndexOnInspect, setBrandIndexOnInspect, RemoveBrand }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const [userContext, setUserContext] = React.useContext<any>(UserContext);
    const abortController = React.useRef(null);

    const DeleteItem = ({ item } : { item: any}) => {
        if(!dataOnInspect || (dataOnInspect && !dataOnInspect.linea)) { return };
        const item_ = {
            linea: dataOnInspect.linea,
            nome: item.nome,
            assegnazioni: item.assegnazioni
        }
        RemoveBrand({ item: item_ });
        DeleteRowAPI({ userContext, abortController, item: item_ , tp: 1})
    }


    return <Stack gap={1} p={2} direction='row' flexWrap='wrap' maxHeight={300} minHeight={50} height='100%' overflow='auto'
        sx={{ borderTop: `1px solid ${darkMode ? palette.grey[800] : palette.grey[400]}` }}>
        {(marche && Array.isArray(marche) && marche.length > 0)
            ? marche.map((config: Brands, index: number) => {
                const checkActive = Boolean(brandIndexOnInspect != null && marche[brandIndexOnInspect]?.nome == config.nome);
                return <Stack key={index} direction='row' alignItems='center' height='fit-content' sx={{
                    borderRadius: 2,
                }}>
                    <Button variant='text' sx={{ 
                    borderBottomRightRadius: 0,
                    borderTopRightRadius: 0,
                    width: 'fit-content', color: '#fff',                     
                    backgroundColor: `${darkMode ?
                            checkActive ?
                                palette.primary.main
                                : palette.grey[800]
                            : checkActive ?
                                palette.secondary.main
                        : palette.grey[400]}`,
                    '&:Hover': {
                        color: '#fff',
                        backgroundColor: `${darkMode ?
                        checkActive ?
                            '#6180b5'
                            : palette.grey[800]
                        : checkActive ?
                            '#395991'
                            : palette.grey[500]}`
                    },
                    "&:Focus":{color: '#fff !important'}, height: 'fit-content'}} 
                    startIcon={checkActive ? icon_view({color: '#fff', alignSelf: 'center'}) : null} 
                    onClick={() => setBrandIndexOnInspect(index)}>
                        {config.nome}
                    </Button>
                    <Button variant='text' color='secondary'
                    onClick={() => DeleteItem({ item: config })}
                    sx={{
                        borderBottomLeftRadius: 0,
                        borderTopLeftRadius: 0,
                        backgroundColor: `${darkMode ? '#382221' : "#fbb7b27a"}`, 
                        '&:Hover':{backgroundColor: `${darkMode ? '#542422' : "#ed8078"}`, }
                    }}>
                        {icon_delete({color: '#932a2a'})}
                    </Button>
                </Stack>
                })
            : <MDTypography variant='body2' sx={{ alignSelf: 'center' }}>Non è presente nessuna configurazione brand per questa linea.</MDTypography>}
    </Stack>
};


interface FooterProps {
    correlations: any;
    selectedLine: string;
    brandsInsereted: Array<string>;
    AddConfig: (brands: any) => void;
};
export const Footer: React.FC<FooterProps> = ({ correlations, brandsInsereted, selectedLine, AddConfig }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const [brands, setBrands] = React.useState<any>([]);

    const AddConfigBridge = () => {
        setBrands([]); //svuota la selezione nello stato.
        AddConfig(brands); //aggiungi gli elementi all'interno dello stato generale.
    };


    return <Stack direction='row' gap={2}>
        <Stack p={2} gap={1}>
            <Autocomplete
                key={brands.join()}
                multiple
                value={brands}
                onChange={(_: any, value: any) => setBrands(value)}
                limitTags={2}
                id="multiple-limit-tags"
                options={correlations.marche.filter((marca: string) => !brandsInsereted.includes(marca)   )}
                getOptionLabel={(option) => option}
                renderInput={(params) => (
                    <TextField {...params} sx={{
                        '&.MuiFormControl-root div .MuiButtonBase-root ': {
                            fontSize: '1.1rem',
                            color: `${darkMode ? palette.grey[500] : palette.black.main}`,
                            backgroundColor: `${darkMode ? palette.grey[800] : palette.grey[400]}`
                        },
                        '&.MuiFormControl-root div .MuiInputBase-input': { fontSize: '0.8rem' },
                        '&.MuiFormControl-root div .MuiOutlinedInput-notchedOutline': { border: 'none' }
                    }}
                        placeholder="Marche" />
                )}
                sx={{ width: '100%', backgroundColor: `${darkMode ? palette.dark.light : palette.grey[200]}`, borderRadius: 5 }}
            />
            <PopupInfo title='Inserimento' close={false} icon={icon_info()}
                body="Inserisci una nuova Marca all'interno della configurazione per la linea selezionata." />
        </Stack>

        <Stack sx={{ ml: 'auto', minWidth: 100, borderLeft: `1px solid ${darkMode ? palette.grey[800] : palette.grey[400]}` }}
            justifyContent='center' alignItems='center'>
            <IconButton onClick={AddConfigBridge}
                sx={{ width: 'fit-content', backgroundColor: `${darkMode ? palette.grey[800] : palette.grey[200]}` }}
                data-tooltip-id='general-confg-obiettivi-commerciali-tooltip'
                data-tooltip-content='Aggiungi le marche attualmente selezionate.'>
                {icon_add({ width: 30, height: 30 })}
            </IconButton>
        </Stack>

    </Stack>
};




interface LineaSettingsProps {
    dataOnInspect: any;
    brandIndexOnInspect: null | number;
    correlations: any;
    quartersDiff: any;
    QuartersDifference: ({ data } : { data: any }) => void;
    setDataOnInspect: (prev: any) => void;
    setBrandIndexOnInspect: (prev: any) => void;
    SaveData: ({dt} : {dt: any}) => void;
    RemoveFullConfig: () => void;
};
export const LineaSettings: React.FC<LineaSettingsProps> = ({ dataOnInspect, brandIndexOnInspect, correlations, quartersDiff,
QuartersDifference, setDataOnInspect, setBrandIndexOnInspect, SaveData, RemoveFullConfig }) => {
    //TODO: RICORDATI DI AGGIUNGE LA FUNZIONE CHE ELIMINA I BRAND INSERITI DALL'ARRAY DELLA LISTA PER L'AUTOCOMPLETE.
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const quartersList = ['q1', 'q2', 'q3', 'q4'];

    const [quartersSettingsState, setQuartersSettingsState] = React.useState<Boolean>(false);
    const ChangeInsertQuartersSettingsState = () => setQuartersSettingsState(!quartersSettingsState);


    /**
     * Funzione per l'aggiunta delle marche all'interno dello stato dateOnIspect.
     * @param brands Array di stringhe che contengono i tag (brand) attualmente selezionati nel autocomplete
     */
    const AddConfig = (brands: any) => {
        if (brands && brands.length > 0) {
            setDataOnInspect((prev: any) => {
                const copy: any = { ...prev };
                const BrandErr_: string[] = [];

                for (let i = 0; i < brands.length; i++) {
                    const brand: string = brands[i];
                    const checkIfAlreadyIn = copy.marche.findIndex((config: { nome: string }) => config.nome === brand);
                    if (checkIfAlreadyIn == -1) {
                        copy.marche.push({
                            nome: brand,
                            assegnazioni: [],
                        });
                    } else { BrandErr_.push(brand); };
                };
                if (BrandErr_ && BrandErr_.length > 0) {
                    enqueueSnackbar(`Sembra che tu stia cercando di inserire delle marche (${BrandErr_.join(", ")}) già presenti all'interno del configuratore di questa linea.`, {
                        title: 'Brands Esistente/i',
                        type: 'error',
                    });
                };

                SaveData({dt: copy});
                return copy
            });
        } else {
            enqueueSnackbar("Perfavore, seleziona almeno una Marca, se vuoi inserire delle configurazioni all'interno di questa linea", {
                title: 'Marche Mancanti',
                type: 'warning',
            });
        };
    };


    const changeBalances = React.useCallback(({ trimestriUpdated }: { trimestriUpdated: any }) => {
        if (trimestriUpdated) {
            setDataOnInspect((prev: any) => {
                const change =  { ...prev, trimestri: trimestriUpdated };
                SaveData({ dt: change });
                return change
            });
        };
    }, [dataOnInspect]);


    /**
     * funzione che elimina l'elemento dallo stato in ispezione.
     * @param item marca che deve essere eliminata
     */
    const RemoveBrand = ({ item } : { item: { nome: string }}) => {
        setDataOnInspect((prev: any) => {
            const copy: any = { ...prev };
            const marcheIndex = copy.marche.findIndex((x: { nome: string }) => 
                x.nome === item.nome);
            if(marcheIndex !== -1){
                copy.marche.splice(marcheIndex, 1);
            };
            if(brandIndexOnInspect === marcheIndex){
                setBrandIndexOnInspect(null);
            };
            QuartersDifference({data: copy});
            return copy
        });
    };


    return <Card sx={{ height: '100%' }}>
        <Stack direction='row' sx={{ borderBottom: `1px solid ${darkMode ? palette.grey[800] : palette.grey[400]}` }} height='100%'>
            <Stack width='100%'>
                <Stack direction='row' alignItems='center' gap={2} p={2}>
                    <IconButton sx={{
                        backgroundColor: `${darkMode ? '#c9a057' : palette.info.main}`,
                        "&:hover": { backgroundColor: `${darkMode ? palette.info.light : '#ffdda0'}` },
                    }}
                        onClick={() => ChangeInsertQuartersSettingsState()}
                        data-tooltip-id='general-confg-obiettivi-commerciali-tooltip'
                        data-tooltip-content='Modifica i valori generali dei trimestri per la linea.'>
                        {icon_settings({ color: `${darkMode ? palette.grey[800] : ''}` })}
                    </IconButton>

                    <Stack direction='row' alignItems='center'>
                        <MDTypography variant='body2' fontSize='1.5rem' sx={{ mr: 0.5, ml: 0.5 }}>
                            /
                        </MDTypography>
                        <MDTypography variant='body2'>
                            {dataOnInspect.linea}
                        </MDTypography>
                    </Stack>

                    <Stack direction='row' gap={0.5}>
                        {quartersList.map((quarter: string, index: number) => (
                            <Tag key={index} text={`${quarter.toUpperCase()} - ${NumberToEuro({ convert: dataOnInspect.trimestri[quarter] })}`} />
                        ))}
                    </Stack>

                    <IconButton sx={{ml: 'auto', backgroundColor: '#d9404026'}}
                    data-tooltip-id='general-confg-obiettivi-commerciali-tooltip'
                    data-tooltip-content='Cancella tutta la configurazione della linea.'
                    onClick={RemoveFullConfig}>
                        {icon_delete({ color: '#c96868' })}
                    </IconButton>
                </Stack>

                <TransitionGroup>
                    {quartersSettingsState && <Collapse>
                        <BalanceQuarters subjectBalance='Linea' trimestri={dataOnInspect.trimestri} subject={dataOnInspect.descrizioneLinea}
                            Save={changeBalances} slide={false} quartersList={quartersList}/>
                    </Collapse>}
                </TransitionGroup>

                <Configurations marche={dataOnInspect.marche} dataOnInspect={dataOnInspect} RemoveBrand={RemoveBrand}
                    brandIndexOnInspect={brandIndexOnInspect} setBrandIndexOnInspect={setBrandIndexOnInspect} />
            </Stack>
            <AltroDetails dataOnInspect={dataOnInspect} quartersList={quartersList} quartersDiff={quartersDiff}/>
        </Stack>
        <Footer AddConfig={AddConfig} correlations={correlations} selectedLine={dataOnInspect?.linea}
        brandsInsereted={dataOnInspect.marche.map((x: {nome : string}) => x.nome)} />
    </Card>
};