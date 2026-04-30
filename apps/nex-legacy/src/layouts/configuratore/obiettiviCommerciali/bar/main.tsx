import React from 'react';
import { UserContext } from "context/UserContext";

import { Autocomplete, Card, Collapse, Divider, Stack, TextField } from '@mui/material';
import { icon_dateInvitation, icon_info, icon_search } from 'config/icons';
import MDButton from 'components/MDButton';
import { PopupInfo } from 'components/PopupInfo';
import { NumericFormat } from 'react-number-format';
import MDTypography from 'components/MDTypography';
import { TransitionGroup } from 'react-transition-group';
import { MainTheme } from 'assets/settingsTheme';
import { useMaterialUIController } from 'context/index';
import { SearchAPI } from '../fetchData/search';
import { enqueueSnackbar } from 'components/MessageBox';
import { InsertConfigAPI } from '../fetchData/insertConfig';
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


interface SearchProps { 
    mainData: Array<{linea: string}>;
    lineToSearch: { descrizione?: string; linea: string } | null;
    loadStatusSearch: boolean;
    setLineToSearch: (prev: any) => void;
    SearchData: ({line}: {line: { linea: string } | null}) => void;
}
export const Search: React.FC<SearchProps> = ({ mainData, lineToSearch, loadStatusSearch, setLineToSearch, SearchData }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;


    return <Stack sx={{ borderLeft: `1px solid ${darkMode ? palette.grey[800] : palette.grey[400]}` }} width='50%' padding={2} gap={1}>
        <Stack direction='row' gap={2}>
            <Stack direction='row' width='80%' alignItems='center'>
                {icon_search({ width: 45, height: 45, color: `${darkMode ? palette.grey[800] : palette.grey[300]}` })}
                <Autocomplete
                    value={lineToSearch}
                    onChange={(_, e: any) => setLineToSearch(e)}
                    options={(mainData || [])}
                    getOptionLabel={(option: any) => option.descrizione}
                    renderInput={(params) => (
                        <TextField {...params} sx={{
                            '&.MuiFormControl-root div .MuiInputBase-input': { fontSize: '1.2rem' },
                            '&.MuiFormControl-root div .MuiOutlinedInput-notchedOutline': { border: 'none' }
                        }}
                            placeholder="Linee/Categorie" />
                    )}
                    sx={{ width: '100%' }}
                />
            </Stack>
            <Stack direction='row' alignItems='center' gap={0.5}>
                <MDButton variant='contained' color='secondary' sx={{ 
                    color: '#fff', 
                    "&:Disabled": {    color: `${darkMode ? palette.grey[600] : palette.grey[300]}`, backgroundColor: `${darkMode ? palette.grey[800] : palette.grey[600]}`    } 
                }} 
                disabled={loadStatusSearch}
                onClick={() => SearchData({line: lineToSearch})}
                data-tooltip-id='general-confg-obiettivi-commerciali-tooltip'
                data-tooltip-content='Inserisci i valori per ogni singolo Quarters in modo da continuare nel inserimento della configurazione.'>
                    Modifica
                </MDButton>
            </Stack>
        </Stack>

        <PopupInfo title='Info' close={false} icon={icon_info()}
            body="All'interno di questa lista troverai tutte le configurazioni già fatte, selezionado una Linea avrai l'opportunita di modificare la configurazione." />
    </Stack>
};



interface InsertProps { 
    linee: {
        descrizione: string
    } | null;
    lineList: null | Array<{descrizione: string}>;
    setLinee: (prev: any) => void;
    setInsertQuartersState: (prev: boolean) => void;
};
export const Insert: React.FC<InsertProps> = ({ linee, lineList,
setLinee, setInsertQuartersState }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;


    React.useEffect(() => {
        if(linee){ setInsertQuartersState(true) }else{ setInsertQuartersState(false) };
    },[linee]);


    return <Stack width='50%' padding={2} gap={1}>
        <Stack direction='row' gap={2} alignItems='center'>
            {icon_dateInvitation({ width: 45, height: 45, color: `${darkMode ? palette.grey[800] : palette.grey[300]}` })}
            <Autocomplete
                value={linee}
                onChange={(_, e: any) => setLinee(e)}
                id="multiple-limit-tags"
                options={(lineList || [])}
                getOptionLabel={(option: any) => option?.descrizione}
                renderInput={(params) => (
                    <TextField {...params} sx={{
                        '&.MuiFormControl-root div .MuiInputBase-input': { fontSize: '1.2rem' },
                        '&.MuiFormControl-root div .MuiOutlinedInput-notchedOutline': { border: 'none' }
                    }}
                        placeholder="Linee/Categorie" />
                )}
                sx={{ width: '100%' }}
            />
        </Stack>
        <PopupInfo title='Inserimento' close={false} icon={icon_info()}
            body="Inserisci una nuova configurazione all'interno della struttura." />
    </Stack>
};



interface InsertQuartersProps {
    InsertData: (quarters: { quarters: {[key: string | number]: string }}) => void;
    loadStatusCreate: boolean;
}
export const InsertQuarters: React.FC<InsertQuartersProps> = ({ InsertData, loadStatusCreate}) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const [quarters, setQuarters] = React.useState<any>({q1: 0, q2: 0, q3: 0, q4: 0}); //stato dei trimestri che stanno per essere inseriti.
    const quartersList = ['q1', 'q2', 'q3', 'q4'];

    const BrdigeInsertData = () => {
        InsertData({quarters});
        ResetQuarters();
    };

    const ResetQuarters = () => { setQuarters({q1: 0, q2: 0, q3: 0, q4: 0}); };


    return <Stack p={3} direction='row' height={'100%'}>
        <Stack direction='row' gap={1} height={'100%'}>
            {quartersList.map((quarter: string, index: number) => (
                <React.Fragment key={index}>
                    <Stack height='100%'>
                        <MDTypography>{quarter?.toUpperCase()}</MDTypography>
                        <TextField
                            key={index}
                            value={quarters ? quarters ? quarters[quarter] : 0 : 0}
                            onChange={(e) => setQuarters((prev: any) => {
                                return { ...prev, [quarter]: (parseFloat(e.target.value) || 0)  }
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
            <MDButton variant='contained' color='info' disabled={loadStatusCreate}
            onClick={() => BrdigeInsertData()}
            sx={{ color: '#000', "&:Disabled": {    color: `${darkMode ? palette.grey[600] : palette.grey[300]}`, backgroundColor: `${darkMode ? palette.grey[800] : palette.grey[600]}`    } }}>
                Inserisci
            </MDButton>
        </Stack>
    </Stack>
};



interface MainBarProps { 
    data: any;
    lineList: null | Array<{descrizione: string}>;
    correlations: any;
    lineToSearch: any;
    loadStatus: {
        create: boolean;
        search: boolean;
    };
    QuartersDifference: ({ data } : { data: any }) => void;
    ChangeLoadStatus: ({from, bool} : {from: "create" | "dataOnInspect" | "correlations" | "search"; bool?: boolean}) => void;
    setLineToSearch: (prev: any) => void;
    setLineList: (prev: any) => void;
    setLoadStatus: (prev: any) => void;
    setData: (prev: any) => void;
    setDataOnInspect: (prev: any) => void;
    setBrandIndexOnInspect: (prev: any) => void;
}
export const MainBar: React.FC<MainBarProps> = ({ data, lineList, correlations, lineToSearch, QuartersDifference, 
loadStatus, ChangeLoadStatus, setLineToSearch, setLineList, setLoadStatus, setData, setDataOnInspect, setBrandIndexOnInspect}) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const [userContext, setUserContext] = React.useContext<any>(UserContext);
    const abortController = React.useRef(null);

    //Stato che fa riferimento alla linea selezionata nella mainBar nel box di ricerca.
    const [linee, setLinee] = React.useState<{
        linea: string
        descrizione: string
    } | null>(null); //stato che tiene traccia della nuova linee che sta per essere inserita.
    const containerRef = React.useRef<any>(null);

    const [insertQuartersState, setInsertQuartersState] = React.useState<boolean>(false);



    function SuccessInsert () {
        if(!linee) { return };

        setLineList((prev: any) => {
            const copy = [...prev];
            const findIndex = copy.findIndex((x: {linea: string}) => x.linea === linee.linea);
            if(findIndex !== -1){
                copy.splice(findIndex, 1);
            };
            setLinee(null);
            return copy;
        });
        
        setData((prev: any) => {
            const findCorrelationsIndex = correlations.findIndex((x: {linea: string}) => x.linea === linee.linea);
            const brand = correlations[findCorrelationsIndex];
            setLineToSearch(brand);
            SearchData({ line: brand})
            return [...prev, brand];
        });

        ChangeLoadStatus({ from: 'create', bool: false });
    };

    function InsertData ({quarters} : { quarters: {[key: string | number]: string }}) {
        if(loadStatus.create){
            return enqueueSnackbar("Una richiesta di creazione è ancora in fase di elaborazione, perfavore aspetta che finisca.", {
                title: 'Richiesta già effettuata',
                type: 'warning',
            });
        };
        ChangeLoadStatus({ from: 'create' });
        if((!linee || (linee && linee.linea.trim() === ""))){
            return enqueueSnackbar("Perfavore seleziona una linea prima di inserire la configurazione.", {
                title: 'Prima di inserire...',
                type: 'warning',
            });
        };

        const sendObj: any = {
            ...linee,
            trimestri: quarters
        };

        InsertConfigAPI({ userContext, abortController, sendObj, SuccessInsert})
    };

    const SearchData = ({ line } : { line: { linea: string } | null }) => {
        if(loadStatus.search){
            return enqueueSnackbar("Una richiesta di ricerca è ancora in fase di elaborazione, perfavore aspetta che finisca.", {
                title: 'Richiesta già effettuata',
                type: 'warning',
            });
        };
        ChangeLoadStatus({ from: 'search' });
        if(!line || (line && line.linea.trim() === "")){
            return enqueueSnackbar("Perfavore seleziona una linea prima di inserire la configurazione.", {
                title: 'Prima di inserire...',
                type: 'warning',
            });
        };

        setBrandIndexOnInspect(null);
        setLoadStatus((prev: { dataOnInspect: boolean; }) => {
            return {...prev, dataOnInspect: true}
        });
        SearchAPI({userContext, abortController, line: line.linea, setDataOnInspect, setLoadStatus, ChangeLoadStatus, QuartersDifference});
    };



    return <Card>
        <Stack ref={containerRef} direction='row' justifyContent='space-around' sx={{ borderBottom: `${insertQuartersState ? "1" : "0"}px solid ${darkMode ? palette.grey[800] : palette.grey[400]}` }} >
            <Insert setInsertQuartersState={setInsertQuartersState}
            linee={linee} setLinee={setLinee} lineList={lineList}/>
            <Search mainData={data} SearchData={SearchData} loadStatusSearch={loadStatus.search}
            lineToSearch={lineToSearch} setLineToSearch={setLineToSearch}/>
        </Stack>
        <TransitionGroup>
            {insertQuartersState && <Collapse>
                <InsertQuarters InsertData={InsertData} loadStatusCreate={loadStatus.create}/>
            </Collapse>}
        </TransitionGroup>
    </Card>
};