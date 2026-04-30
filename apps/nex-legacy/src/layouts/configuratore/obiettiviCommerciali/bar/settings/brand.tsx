import React from 'react';
import { Autocomplete, Button, Card, Checkbox, Collapse, Divider, IconButton, Stack, TextField } from '@mui/material';

import { MainTheme } from 'assets/settingsTheme';
import { useMaterialUIController } from 'context/index';
import MDTypography from 'components/MDTypography';
import { icon_add, icon_delete, icon_edit, icon_info, icon_reset, icon_save, icon_settings } from 'config/icons';
import { NumberToEuro } from 'utils/numberToEuro';
import { BalanceQuarters } from '../../components/balanceQuarters';
import { TransitionGroup } from 'react-transition-group';
import { Tag } from 'components/Tag/Tag';
import { PopupInfo } from 'components/PopupInfo';
import { enqueueSnackbar } from 'components/MessageBox';
import { useGeneralDataContext } from 'context/GeneralDataContext';
import { UserContext } from 'context/UserContext';
import { DeleteRowAPI } from '../../fetchData/deleteItem';
import { NumericFormat } from 'react-number-format';
import MDButton from 'components/MDButton';
import { useNexTheme } from '@nex/theme-system';



const NumericFormatCustom = React.forwardRef(function NumericFormatCustom(
    props,
    ref,
) {
    const { onChange, ...other } = (props as any);

    return (
        <NumericFormat
            {...other}
            getInputRef={ref}
            onValueChange={(values) => {
                onChange({
                    target: {
                        name: (props as any).name,
                        value: values.value,
                    },
                });
            }}
            thousandSeparator="."
            decimalSeparator=","
            valueIsNumericString
            prefix="€"
        />
    );
});

interface Agents {
    commerciale: string;
    canaleVendita: string;
    annuale: 0 | 1;
    trimestri: {
        q1: number;
        q2: number;
        q3: number;
        q4: number;
    } | any;
};


interface ConfigItemProps {
    i: number;
    data: any;
    quartersList: any;
    DeleteItem: ({ item }: { item: any }) => void;
    ChangeQuartersAgents: ({trimestriUpdated, indexConfigToEdit, isAnnual}: { trimestriUpdated: any, indexConfigToEdit: number; isAnnual: boolean }) => void;
};
export const ConfigItem: React.FC<ConfigItemProps> = ({ i, data, quartersList, DeleteItem, ChangeQuartersAgents}) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const [editMode, setEditMode] = React.useState<Boolean>(false);
    const [editedQuarters, setEditedQuarters] = React.useState<any>(data.trimestri);
    const [isAnnual, setIsAnnual] = React.useState<boolean>(data.annuale === 0 ? false : true);
    const ChangeEditMode = () => setEditMode(!editMode);
    const resetEditedQuarters = () => {setEditedQuarters(data.trimestri); ChangeEditMode();};

    const defaultBtnStyle = {
        borderBottomLeftRadius: 0,
        borderTopLeftRadius: 0,
        borderBottomRightRadius: 0,
        padding: 0,
        backgroundColor: `${darkMode ? "#dbbe5340" : "#fbebb27a"}`,
        '&:Hover': { backgroundColor: `${darkMode ? "#fdd9537a" : "#fdd9537a"}`, }
    };



    function SaveEdits(){
        if((JSON.stringify(editedQuarters) !== JSON.stringify(data.trimestri) || data.annuale !== isAnnual)){
            ChangeQuartersAgents({trimestriUpdated: editedQuarters, indexConfigToEdit: i, isAnnual});
        };
        ChangeEditMode();
    };



    return <Stack direction='row' key={i} minWidth={250} height='100%' sx={{
        borderRadius: 4, width: 'fit-content', backgroundColor: `${darkMode ? palette.grey[900] : palette.grey[200]}`,
    }}>
        <Stack p={2} width='100%'>
            <Stack direction='row' gap={2} alignItems='center' justifyContent='space-between'>
                <MDTypography variant='body2'>Agente:</MDTypography>
                <MDTypography fontSize='0.8rem'>{data.commerciale}</MDTypography>
            </Stack>
            <Stack direction='row' gap={2} alignItems='center' justifyContent='space-between'>
                <MDTypography variant='body2'>CH. vendita:</MDTypography>
                <MDTypography fontSize='0.8rem'>{data.canaleVendita}</MDTypography>
            </Stack>
            <Stack direction='row' gap={2} alignItems='center' justifyContent='space-between'>
                <MDTypography variant='body2'>Annuale:</MDTypography>
                {editMode ? <Checkbox defaultChecked={isAnnual} value={isAnnual} onChange={(e: any) => setIsAnnual(e.target.checked)} />
                : <Tag text={data.annuale == 0 ? "Non Attivo" : "Attivo"} color={darkMode ? palette.grey[700] : palette.grey[300]}/>}
            </Stack>
            <Divider />

            {quartersList.map((quarter: string, index: number) => (
                <Stack key={index} direction='row' gap={2} alignItems='center' justifyContent='space-between'>
                    <MDTypography variant='body2' fontSize='0.9rem'>{quarter}:</MDTypography>
                    {!editMode ? <MDTypography fontSize='0.8rem'>{NumberToEuro({ convert: data.trimestri[quarter] })}</MDTypography>
                    : <TextField
                        value={editedQuarters ? editedQuarters[quarter] : 0}
                        onChange={(e) => setEditedQuarters((prev: any) => ({ ...prev, [quarter]: parseFloat(e.target.value.trim() !== "" ? e.target.value : "0") }))}
                        name="numberformat"
                        id="formatted-numberformat-input"
                        InputProps={{
                            inputComponent: (NumericFormatCustom as any),
                        }}
                        variant="standard"
                    />}
                </Stack>
            ))}
        </Stack>

        <Stack height='100%' ml={'auto'}>
            {editMode ? 
                <Stack>
                    <Button variant='text' onClick={() => SaveEdits()}
                        data-tooltip-id='general-confg-obiettivi-commerciali-tooltip'
                        data-tooltip-content="Salva i quarters modificati."
                        sx={defaultBtnStyle}>
                        {icon_save({ color: '#c7a428', height: 25, width: 25 })}
                    </Button>
                    <Button variant='text' onClick={resetEditedQuarters}
                        data-tooltip-id='general-confg-obiettivi-commerciali-tooltip'
                        data-tooltip-content="Annulla i cambiamenti fatti sui quarters."
                        sx={{...defaultBtnStyle, borderTopRightRadius: 0}}>
                        {icon_reset({ color: '#c7a428', height: 25, width: 25 })}
                    </Button>
                </Stack> 
            : 
                <Button variant='text' onClick={ChangeEditMode}
                    data-tooltip-id='general-confg-obiettivi-commerciali-tooltip'
                    data-tooltip-content="Modifica Quarters Configurazione."
                    sx={defaultBtnStyle}>
                    {icon_edit({ color: '#c7a428', height: 25, width: 25 })}
                </Button>}

            <Button variant='text'
                onClick={() => DeleteItem({ item: data })}
                data-tooltip-id='general-confg-obiettivi-commerciali-tooltip'
                data-tooltip-content="Elimina Configurazione."
                sx={{
                    mt: 'auto',
                    borderBottomLeftRadius: 0,
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    padding: 0,
                    backgroundColor: `${darkMode ? '#382221' : "#fbb7b27a"}`,
                    '&:Hover': { backgroundColor: `${darkMode ? '#542422' : "#ed8078"}`, }
                }}>
                {icon_delete({ color: '#932a2a', height: 25, width: 25 })}
            </Button>
        </Stack>

    </Stack>
};



interface ConfigurationsProps {
    dataOnInspect: any;
    brandOnInspect: any;
    marche: any;
    quartersList: Array<string>;
    ChangeQuartersAgents: ({trimestriUpdated, indexConfigToEdit, isAnnual}: { trimestriUpdated: any, indexConfigToEdit: number; isAnnual: boolean }) => void;
    RemoveAssegnazione: ({ item }: { item: any }) => void;
};
export const Configurations: React.FC<ConfigurationsProps> = ({ dataOnInspect, quartersList, brandOnInspect, marche, 
RemoveAssegnazione, ChangeQuartersAgents }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const [userContext, setUserContext] = React.useContext<any>(UserContext);
    const abortController = React.useRef(null);


    //esegui la richiesta all'API per eliminare l'assegnazione
    const DeleteItem = ({ item }: { item: any }) => {
        if (!dataOnInspect || (dataOnInspect && !dataOnInspect.linea)) { return };
        const item_ = {
            linea: dataOnInspect.linea,
            nome: brandOnInspect.nome,
            assegnazioni: [item],
        }
        RemoveAssegnazione({ item: item_ });
        DeleteRowAPI({ userContext, abortController, item: item_, tp: 2 });
    };

    return <Stack gap={2} p={2} direction='row' sx={{ borderTop: `1px solid ${darkMode ? palette.grey[800] : palette.grey[400]}` }}
        flexWrap='wrap' maxHeight={300} minHeight={100} overflow='auto'>
        {(marche && Array.isArray(marche) && marche.length > 0) ?
            marche.map((config: Agents, i: number) => (
                <ConfigItem key={i} i={i} data={config} quartersList={quartersList} DeleteItem={DeleteItem} ChangeQuartersAgents={ChangeQuartersAgents}/>
        )) : <MDTypography variant='body2'>Non è presente nessuna configurazione Agente.</MDTypography>}
    </Stack>
};




interface InsertQuartersProps {
    quarters: any;
    setQuarters: (prev: any) => void;
    loadStatusInsertAgents: boolean;
    AddConfigBridge: (prev: any) => void;
}
export const InsertQuarters: React.FC<InsertQuartersProps> = ({ setQuarters, quarters, loadStatusInsertAgents, AddConfigBridge }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;
    const quartersList = ['q1', 'q2', 'q3', 'q4'];

    const ResetQuarters = () => { setQuarters({ q1: 0, q2: 0, q3: 0, q4: 0 }); };


    return <Stack p={3} direction='row' height={'100%'} sx={{ flexWrap: 'wrap' }}>
        <Stack direction='row' gap={1} height={'100%'}>
            {quartersList.map((quarter: string, index: number) => (
                <React.Fragment key={index}>
                    <Stack height='100%'>
                        <MDTypography>{quarter?.toUpperCase()}</MDTypography>
                        <TextField
                            key={index}
                            value={quarters ? quarters ? quarters[quarter] : 0 : 0}
                            onChange={(e) => setQuarters((prev: any) => {
                                return { ...prev, [quarter]: (parseFloat(e.target.value) || 0) }
                            })}
                            name="numberformat"
                            id="formatted-numberformat-input"
                            InputProps={{
                                inputComponent: (NumericFormatCustom as any),
                            }}
                            variant="standard"
                        />
                    </Stack>
                    {((quartersList.length - 1) > index) && <Divider orientation='vertical' sx={{ backgroundColor: '#ccc' }} />}
                </React.Fragment>
            ))}
        </Stack>
        <Stack direction='row' alignItems='center' gap={0.5} ml='auto'>
            <MDButton variant='text' color='secondary' onClick={() => ResetQuarters()}>
                Azzera tutto
            </MDButton>
            <MDButton variant='contained' color='info' disabled={loadStatusInsertAgents}
                onClick={AddConfigBridge}
                data-tooltip-id='general-confg-obiettivi-commerciali-tooltip'
                data-tooltip-content="Aggiungi l'agente e il canele di vendita attualmente selezionate."
                sx={{ color: '#000', "&:Disabled": { color: `${darkMode ? palette.grey[600] : palette.grey[300]}`, backgroundColor: `${darkMode ? palette.grey[800] : palette.grey[600]}` } }}>
                Inserisci
            </MDButton>
        </Stack>
    </Stack>
};



interface FooterProps {
    loadStatus: {
        insertAgents: boolean
    };
    sellerCHList: any;
    quartersDiff: any;
    assegnazioni: any;
    AddConfig: ({ agent, sellerCh, quarters, isAnnual }: { agent: string; sellerCh: string; quarters: any; isAnnual: boolean }) => void;
};
export const Footer: React.FC<FooterProps> = ({ loadStatus, sellerCHList, quartersDiff, assegnazioni, AddConfig }) => {
    const { globalData } = useGeneralDataContext();
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const [agent, setAgent] = React.useState<null | {nome: string; cognome: string; codici: {agente: string}}>(null);
    const [sellerCh, setSellerCh] = React.useState<null | {codice: string; descrizione: string}>(null);
    const [isAnnual, setIsAnnual] = React.useState<boolean>(false);
    const [quarters, setQuarters] = React.useState<{ q1: number, q2: number; q3: number, q4: number; }>({
        q1: 0,
        q2: 0,
        q3: 0,
        q4: 0
    });

    const listAlreadyAssigned = new Set(
        assegnazioni.map((y: any) => `${y.commerciale}-${y.canaleVendita}`)
    );

    
    const AddConfigBridge = () => {
        if (agent && sellerCh && quarters && quartersDiff != null) {
            let checkAllPositiveDifference = true;
            Object.keys(quarters).forEach((q_: string) => {
                const minus = quartersDiff[q_] - (quarters as any)[q_];
                if(minus < 0){
                    checkAllPositiveDifference = false;
                    return enqueueSnackbar(`Purtroppo stai per superare il valore disponibile per il ${q_}, aumenta il ${q_} della linea genereale. `, {
                        title: 'Valore non disponibile',
                        type: 'warning',
                    });
                }
            });

            if(checkAllPositiveDifference){
                AddConfig({ agent: agent.codici.agente, sellerCh: sellerCh.codice, quarters, isAnnual }); //svuota la selezione nello stato.
                setAgent(null); //aggiungi gli elementi all'interno dello stato generale.
                setSellerCh(null);
                setQuarters({ q1: 0, q2: 0, q3: 0, q4: 0 });
            };

        } else {
            enqueueSnackbar(`Perfavore seleziona almeno un codice Commerciale e un canale di vendita.`, {
                title: 'Compila i campi',
                type: 'warning',
            });
        };
    };



    return <React.Fragment>
        <Stack direction='row' gap={2}>
            <Stack p={2} gap={1}>
                <Autocomplete
                    id="tags"
                    options={globalData.agents.filter((e: any) => {
                        const codiceAgente = e?.codici?.agente ?? null;
                        if (codiceAgente == null) return false;

                        if (sellerCh && sellerCh.codice) {
                            // Verifica se il codice e l'agente non esistono già nel set
                            const searchKey = `${codiceAgente}-${sellerCh.codice}`;
                            return !listAlreadyAssigned.has(searchKey);
                        }
                        return true;
                    })}
                    value={agent}
                    onChange={(_: any, value: any) => setAgent(value)}
                    getOptionLabel={(option: any) => option?.codici?.agente + " - " + option?.nome + " " + option?.cognome}
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
                            placeholder="Commerciali" />
                    )}
                    sx={{ width: '100%', backgroundColor: `${darkMode ? palette.dark.light : palette.grey[200]}`, borderRadius: 5 }}
                />
                <PopupInfo title='Inserimento' close={false} icon={icon_info()}
                    body="Inserisci una nuova Marca all'interno della configurazione per la linea selezionata." />
            </Stack>

            <Stack p={2} gap={1}>
                <Autocomplete
                    id="tags"
                    options={(sellerCHList.filter((x: {codice: string}) => {
                        if (agent) {
                            // Verifica se il codice e l'agente non esistono già nel set
                            const searchKey = `${agent.codici.agente}-${x.codice}`;
                            if (!listAlreadyAssigned.has(searchKey)) {
                                return true; // Mantieni x solo se non è stato trovato
                            }
                        } else {
                            return true; // Se agent non è definito, mantieni x
                        }
                        return false; // Rimuovi x se è già assegnato
                    }) || [])}
                    value={sellerCh}
                    onChange={(_: any, value: any) => setSellerCh(value)}
                    getOptionLabel={(option: any) => option?.descrizione}
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
                            placeholder="Canali di vendita" />
                    )}
                    sx={{ width: '100%', backgroundColor: `${darkMode ? palette.dark.light : palette.grey[200]}`, borderRadius: 5 }}
                />
                <PopupInfo title='Inserimento' close={false} icon={icon_info()}
                    body="Inserisci i canali di vendita all'interno della categoria." />
            </Stack>

            <Stack mt={2} direction='row' sx={{ height: 'fit-content', alignItems: 'center', gap: 2 }}>
                <MDTypography variant='body2'>
                    L' obiettivo sarà annuale?
                </MDTypography>
                <Checkbox value={isAnnual} onChange={(e: any) => setIsAnnual(e.target.checked)} />
            </Stack>
        </Stack>
        <TransitionGroup>
            {Boolean(agent && sellerCh) && <Collapse>
                <InsertQuarters AddConfigBridge={AddConfigBridge} quarters={quarters} setQuarters={setQuarters}
                    loadStatusInsertAgents={loadStatus.insertAgents}/>
            </Collapse>}
        </TransitionGroup>
    </React.Fragment>
};




interface BrandSettingsProps {
    brandIndex: any;
    brandOnInspect: any;
    dataOnInspect: any;
    loadStatus: {
        insertAgents: boolean
    };
    sellerCHList: null | Array<object>;
    quartersDiff: any;
    setQuartersDiff: (prev: any) => void;
    QuartersDifference: ({ data } : { data: any }) => void;
    setDataOnInspect: (prev: any) => void;
    SaveData: ({ dt }: { dt: any }) => void;
};
export const BrandSettings: React.FC<BrandSettingsProps> = ({ brandIndex, brandOnInspect, dataOnInspect, loadStatus, sellerCHList, 
quartersDiff, setQuartersDiff, QuartersDifference, setDataOnInspect, SaveData }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const quartersList = ['q1', 'q2', 'q3', 'q4'];


    /**
    * Funzione per l'aggiunta delle marche all'interno dello stato dateOnIspect.
    * @param brands Array di stringhe che contengono i tag (brand) attualmente selezionati nel autocomplete
    */
    const AddConfig = ({ agent, sellerCh, quarters, isAnnual }: { agent: string; sellerCh: string; quarters: any; isAnnual: boolean }) => {
        if (agent && sellerCh) {
            setDataOnInspect((prev: any) => {
                const copy: any = { ...prev };
                const checkIfAlreadyIn = (copy.marche[brandIndex] && copy.marche[brandIndex]?.assegnazioni) ?
                    copy.marche[brandIndex]?.assegnazioni.findIndex((config: { commerciale: string; canaleVendita: string }) =>
                        config.commerciale === agent && config.canaleVendita === sellerCh) : false;

                if (checkIfAlreadyIn == -1) {
                    copy.marche[brandIndex]?.assegnazioni.push({
                        commerciale: agent,
                        canaleVendita: sellerCh,
                        annuale: isAnnual ? 1 : 0, // false
                        trimestri: {
                            q1: quarters.q1,
                            q2: quarters.q2,
                            q3: quarters.q3,
                            q4: quarters.q4
                        }
                    });
                    QuartersDifference({ data: copy })
                    SaveData({ dt: copy });
                }else{
                    enqueueSnackbar("Attualmente l'elemento che stai cercando di inserire nelle assegnazioni è già presente, modificalo o eliminalo per poter ri-inserirlo nuovamente.", {
                        title: 'Elemento già presente',
                        type: 'error',
                    });
                };
                return copy
            });
        } else {
            enqueueSnackbar("Perfavore, seleziona almeno un brand, se vuoi inserire delle marche all'interno di questa linea", {
                title: 'Brands Mancanti',
                type: 'warning',
            });
        };
    };


    const ChangeQuartersAgents = React.useCallback(({ trimestriUpdated, indexConfigToEdit, isAnnual }: { trimestriUpdated: any, indexConfigToEdit: number; isAnnual: boolean }) => {
        if (trimestriUpdated) {
            setDataOnInspect((prev: any) => {
                const copy: any = { ...prev };
                copy.marche[brandIndex].assegnazioni[indexConfigToEdit].annuale = isAnnual ? 1 : 0;
                copy.marche[brandIndex].assegnazioni[indexConfigToEdit].trimestri = trimestriUpdated;
                SaveData({ dt: copy });
                return copy
            });
        };
    }, [dataOnInspect]);


    /**
     * funzione che elimina l'elemento dallo stato in ispezione.
     * @param item assegnazione commerciale che deve essere eliminato
     */
    const RemoveAssegnazione = ({ item }: { item: { assegnazioni: [{ commerciale: string; canaleVendita: string }] } }) => {
        setDataOnInspect((prev: any) => {
            const copy: any = { ...prev };
            const assegnazioni = copy.marche[brandIndex].assegnazioni;
            const item_ = item.assegnazioni[0];
            const indexAssegnazione = assegnazioni.findIndex((x: { commerciale: string; canaleVendita: string }) =>
                x.commerciale === item_.commerciale && x.canaleVendita === item_.canaleVendita);
            if (indexAssegnazione !== -1) {
                assegnazioni.splice(indexAssegnazione, 1);
            };
            QuartersDifference({data: copy});
            return copy
        });
    };


    return <Card sx={{ mt: '1rem' }}>
        <Stack direction='row' sx={{ borderBottom: `1px solid ${darkMode ? palette.grey[800] : palette.grey[400]}` }} >
            <Stack width='100%'>
                <Stack direction='row' alignItems='center' gap={2} p={2}>
                    <Stack direction='row' alignItems='center'>
                        {[dataOnInspect?.linea, brandOnInspect?.nome].map((url: string, i: number) => (
                            <React.Fragment key={i}>
                                <MDTypography variant='body2' fontSize='1.5rem' sx={{ mr: 0.5, ml: 0.5 }}>
                                    /
                                </MDTypography>
                                <MDTypography variant='body2'>
                                    {url}
                                </MDTypography>
                            </React.Fragment>
                        ))}

                    </Stack>
                </Stack>
                <Configurations marche={brandOnInspect.assegnazioni} dataOnInspect={dataOnInspect} brandOnInspect={brandOnInspect}
                    RemoveAssegnazione={RemoveAssegnazione} quartersList={quartersList} ChangeQuartersAgents={ChangeQuartersAgents}/>
            </Stack>
        </Stack>
        <Footer AddConfig={AddConfig} loadStatus={loadStatus} sellerCHList={sellerCHList} quartersDiff={quartersDiff}
        assegnazioni={brandOnInspect.assegnazioni} />
    </Card>
};