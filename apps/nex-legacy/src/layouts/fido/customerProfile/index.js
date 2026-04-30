import React, { useState, useCallback, memo, useContext, Fragment, useMemo } from 'react';

import { UserContext } from "context/UserContext";
import Loader from "../../../Loader.js";

import './fidoCliente.css';
import { style_main, style_rounded } from './style.js';

import { CustomerData } from './fetch/data.js';
import { FatturatoData } from './fetch/fatturato_data.js';
import { RequestFido } from './requestFido';
import { general_structure_box, elements_structure_data } from './main_structure_data';

//  Layouts components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";

// @mui material components
import Grid from "@mui/material/Grid";
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";

//@mui-icons
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
//Animation e prevent undefined label
import Skeleton from '@mui/material/Skeleton';
import Fade from '@mui/material/Fade';
//  components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

//chart
import ProgressCharts from 'examples/Charts/ProgressCharts';
import { FiltersFido } from './filters/index.js';
import { StatusRequestedFidi } from './statusRequestedFidi/index.js';
import { StringAvatar } from 'utils';
import { Card } from '@mui/material';

import { MainTheme } from 'assets/settingsTheme.tsx';
import { PaymentsMethodAPI } from './fetch/paymentsMethod';
import { enqueueSnackbar } from 'components/MessageBox';
import { PopupInfo } from 'components/PopupInfo';
import { icon_info } from 'config/icons.js';

import sanitizeModule from "classes/sanitize";
import ConvertModule from "classes/convert";
import { useNexTheme } from '@nex/theme-system';

const Convert = new ConvertModule();
//Modulo per sanificare gli elementi in input
const Sanitize = new sanitizeModule();

function FidoCliente() {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const [userContext, setUserContext] = useContext(UserContext);
    const [customersSelected, setCustomersSelected] = React.useState(null);

    const [statusPanelContentDisabled, setStatusPanelContentDisabled] = useState(false);
    const [statusPanelCloseDisabled, setStatusPanelCloseDisabled] = useState(false);
    const [requestPanelContentDisabled, setRequestPanelContentDisabled] = useState(false);
    const [requestPanelCloseDisabled, setRequestPanelCloseDisabled] = useState(false);
    const [tourOpen, setTourOpen] = useState(false);

    //stato del backdrop apertura/chiusura per la richiesta fido/extrafido.
    const [openReqFido, setOpenReqFido] = useState(false);
    const handleClose = () => { setOpenReqFido(false); }
    const handleOpen = () => {
        console.log('[FidoCliente] handleOpen CLICK', {
            hasData: !!data,
            canOpenRequest,
            statoUltimoFido: data?.statoUltimoFido,
        });

        if (!data) {
            setOpenReqFido(true);
            return;
        }

        // se NON è apribile, avvisa e NON aprire
        if (!canOpenRequest) {
            enqueueSnackbar(
                "Attualmente sembra che il fido per questo cliente sia stato già richiesto ed è in fase di attesa o elaborazione.",
                { title: "Ops..", type: "warning" }
            );
            return;
        }

        // qui è apribile → apri davvero
        setOpenReqFido(true);
    };

    const [laodStatus, setLoadStatus] = useState(true);

    const [listOfCustomers, setListOfCustomers] = useState([]);

    const [FidoActived, setFidoActived] = useState(1);
    const [data, setData] = useState(null);
    const canOpenRequest = React.useMemo(() => {
        const s = data?.statoUltimoFido;
        if (!data) return false;
        if (!('statoUltimoFido' in data)) return true;
        const pending = s === 0 || s === 1 || data.richiestaFidoInCorso === true;
        return !pending;
    }, [data]);
    const hasPendingFido = !!(data && ("statoUltimoFido" in data) && [0, 1].includes(data.statoUltimoFido));
    const [generalStructureBox, setGeneralStructureBox] = useState(general_structure_box(FidoActived));

    //definisce lo stato del pannello fidiStatus
    const [fidoStatusPanel, setFidoStatusPanel] = useState(false);

    // Abort il panding del fetch all server
    const abortController = React.useRef(null);
    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
            abortController.current = null; // Reset after abort
        }
    };

    //Richiesta dati cliente
    const [reqCustomersDataStatus, setReqCustomersDataStatus] = useState(true);

    const [paymentsMethodList, setPaymentsMethodList] = useState([]);

    const CustomerDataAPI = useCallback((cselected) => {
        setLoadStatus(true);
        if (cselected === undefined) { return; };

        //sanificazione del dato e successivo check del processo.
        const codClienteSANITIZED = Sanitize.string(cselected.CodiceCliente);
        if (!codClienteSANITIZED.Success) { return; }

        CustomerData(userContext, abortController, setData, FatturatoDataAPI, codClienteSANITIZED.Data,
            setLoadStatus, setReqCustomersDataStatus)
    }, [userContext.details, abortController.current, laodStatus, listOfCustomers, reqCustomersDataStatus]);

    const FatturatoDataAPI = useCallback((cselected, customerData) => {
        if (cselected === undefined) { return; };
        FatturatoData(userContext, abortController, setData, customerData, cselected)
    }, [userContext.details, abortController.current, listOfCustomers]);

    const Payments = useCallback(() => {
        PaymentsMethodAPI({ userContext, abortController, setData: setPaymentsMethodList })
    }, [userContext.details, abortController.current, listOfCustomers]);

    const setFidoStatusPanelSafe = React.useCallback((next) => {
        setFidoStatusPanel(prev => {
            const value = typeof next === 'function' ? next(prev) : next;
            if (value === false) {
                setStatusPanelContentDisabled(false);
                setStatusPanelCloseDisabled(false);
            }
            return value;
        });
    }, []);

    const dynamicBox = useCallback((BoxElement, index) => {
        //Aggiunge le parti in maniera dinamica se è presenta la prorpietà autoAdd = true
        if (!laodStatus && data != null && BoxElement.autoAdd) {
            //controlla il numero di oggetti presenti all'interno dei dati in quella specifica proprietà e poi fai la comprazione
            //con la lunghezza delle parti definitai di default in general_structure_box. se è piu bassa allora genera la parte se no non la generare.
            const numberOfObjects = Object.keys(data[BoxElement.from]).filter(key => typeof data[BoxElement.from][key] === 'object' && data[BoxElement.from][key] != null).length;
            const defaultPartsNumber = general_structure_box(FidoActived).find(elm => elm.from === BoxElement.from).part.length

            if (BoxElement.part.length < (Number(numberOfObjects) + defaultPartsNumber)) {
                for (const key in data[BoxElement.from]) {
                    const k = data[BoxElement.from][key]
                    if (typeof k == 'object') {
                        BoxElement.part.push({ key: (BoxElement.part.length), from: key, sx: { alignItems: 'center', height: '100%' } },)
                    }
                }
            } else {
                //se non è presente nemmeno 1 oggetto, fai generare al sistema l'oggetto dedicato all'opzione di autoAdd se è true
                const findSystemBox = BoxElement.part.findIndex(e => e.system === true);
                if (findSystemBox == -1) {
                    BoxElement.part.push({
                        key: (BoxElement.part.length), system: true,
                        sx: { width: '100%', height: '100%', padding: 1.5, borderRadius: 4, gap: 2 }
                    });
                }
            }

        };
        return <Grid key={index} item xs={BoxElement.xs} md={BoxElement.md} lg={BoxElement.lg} sx={laodStatus ? { height: '100%' } : {}}>
            <MDBox sx={{ backgroundColor: BoxElement.bgColor, borderRadius: '10px', minheight: 300, height: 'auto', height: '100%' }} {...(BoxElement.dataTour ? { 'data-tour': BoxElement.dataTour } : {})}>
                {!laodStatus ?
                    data != null &&
                    <Fade in={true}>
                        <Stack sx={BoxElement.sx} direction={BoxElement.directionPart} className='container' gap={BoxElement.gap} height='100%' >
                            {BoxElement.switch &&
                                chooseComponent('switch', BoxElement, index, BoxElement)
                            }
                            {BoxElement.type !== "dynamic_part" ?
                                BoxElement.type !== 'half_dynamic' ?
                                    BoxElement?.part?.map((BoxPart, i) => (
                                        <Fragment key={i}>
                                            <Grid container item
                                                xs={BoxElement.directionPart ? (12 / BoxElement?.part?.length) : 12}
                                                md={BoxElement.directionPart ? (12 / BoxElement?.part?.length) : 12}
                                                lg={BoxElement.directionPart ? (12 / BoxElement?.part?.length) : 12}
                                                justifyContent='center' gap={2} sx={{ backgroundColor: `${darkMode ? '#151515' : palette.white.main}`, borderRadius: 2 }}>
                                                {dynamicElmCompose(BoxElement.key, BoxPart, BoxElement, BoxElement.autoAdd)}
                                            </Grid>
                                            {BoxElement.divider && ((BoxElement?.part?.length - 1) != i && <Divider orientation={BoxElement.directionPart && "vertical"} sx={{ backgroundColor: '#ccc' }} style={BoxElement.directionPart ? { height: '100%' } : { width: '100%', height: 1 }} />)}
                                        </Fragment>
                                    ))
                                    :
                                    <>
                                        {BoxElement?.part?.map((BoxPart, i) => (
                                            <Fragment key={i}>
                                                <Grid container item
                                                    xs={BoxElement.directionPart ? (12 / BoxElement?.part?.length) : 12}
                                                    md={BoxElement.directionPart ? (12 / BoxElement?.part?.length) : 12}
                                                    lg={BoxElement.directionPart ? (12 / BoxElement?.part?.length) : 12}
                                                    justifyContent='center' gap={2} sx={{ backgroundColor: `${darkMode ? '#151515' : palette.white.main}`, borderRadius: 2 }}>
                                                    {dynamicElmCompose(BoxElement.key, BoxPart, BoxElement)}
                                                </Grid>
                                                {BoxElement.divider && ((BoxElement?.part?.length - 1) != i && <Divider orientation={BoxElement.directionPart && "vertical"} sx={{ backgroundColor: '#ccc' }} style={BoxElement.directionPart ? { height: '100%' } : { width: '100%', height: 1 }} />)}
                                            </Fragment>
                                        ))}
                                        {generatePart(BoxElement)}
                                    </>
                                :
                                generatePart(BoxElement)

                            }
                        </Stack>
                    </Fade>
                    : generateSkeleton(1)}
            </MDBox>
        </Grid>
    }, [generalStructureBox, data, laodStatus, FidoActived, darkMode]);

    /**
     * L'elemento viene generato attraverso questa funzione se il type del BoxElement è dynamic_part
     */
    const dynamicElmCompose = useCallback((block, BoxPart, BoxElement, autoAdd) => {
        let return__;
        if (autoAdd && BoxPart.system) {
            const arr = [];
            const blockSystemIndex = BoxElement.part.findIndex(e => e.system === true);
            for (const key in data[BoxElement.from]) {
                if (data[BoxElement.from][key]) {
                    arr.push(chooseComponent(`label-key`,
                        {
                            block: BoxElement.key, part: blockSystemIndex, key: key, from: BoxElement.from,
                            typeof: "string", sx: { width: '100%', },
                            keysx: { fontSize: '0.8rem' }
                        }, key, BoxElement));
                }
            }
            return__ = <Stack sx={{ ...BoxPart.sx }}>{arr}</Stack>;
        } else {
            if (BoxPart.from) {
                return__ = generateBlock(data[BoxElement.from][BoxPart.from], 'autoAdd')
            } else {
                return__ = <Stack sx={BoxPart.sx}>
                    {elements_structure_data(data, FidoActived).filter(elm => elm.block === block && elm.part === BoxPart.key).map((e, index) => (
                        chooseComponent(e.type, e, index, BoxElement)
                    ))}
                </Stack>
            }
        }

        return return__;
    }, [generalStructureBox, data, elements_structure_data(), darkMode]);

    /**
     * Genera in maniera dinamica le parti del blocco in input
     * @param BoxElement in input l'elemento che si trova nella struttura generale dei blocchi
     */
    const generatePart = useCallback((BoxElement) => {
        //Condizione dedicata al capire se l'elemento ha una direzione definita oppure deve prendere gli elementi dentro all'elemeneto from
        const object = BoxElement.to ?
            data[BoxElement.from][Object.keys(data[BoxElement.from])[FidoActived]][BoxElement.to]
            :
            data[BoxElement.from][Object.keys(data[BoxElement.from])[FidoActived]];

        return <Grid key={JSON.stringify(BoxElement)} container item
            xs={BoxElement.directionPart ?
                (12 / BoxElement?.part?.length) : 12}
            md={BoxElement.directionPart ?
                (12 / BoxElement?.part?.length) : 12}
            lg={BoxElement.directionPart ?
                (12 / BoxElement?.part?.length) : 12}
            justifyContent='center' gap={0.2} >
            {generateBlock(object, null, BoxElement)}
        </Grid>

    }, [data, FidoActived, darkMode]);

    /**
     * genera il blocco <Stack> del elemento in questione
     * @param BoxPart in input la parte del blocco a cui stai facendo riferimento
     */
    const generateBlock = useCallback((BoxPart, type, BoxElement) => {
        //array che contiene gli effettivi elementi.
        const elmArray = [];

        for (const key in BoxPart) {
            const Box = BoxPart[key];
            //controlla se tutti gli elementi presentano almeno uno di questi stati
            //se tutti gli elementi rispettano queste condizioni ridammi true
            if (!Box && Box !== 0) { continue; }
            const valori = Object.values(Box);
            const tuttiUguali = valori.every(valore => valore === 0 || valore === null || valore === '');

            switch (type) {
                case 'autoAdd':
                    elmArray.push(<Stack
                        key={key} sx={{ width: '100%', maxWidth: '100%', borderRadius: 3, justifyContent: 'center' }}
                    >
                        <MDTypography component="h3" style={{ color: '#363636', fontWeight: 300, fontSize: '0.67em' }}>
                            {key.split(/(?=[A-Z])/).join(' ')}
                        </MDTypography>
                        <MDTypography component="h3" sx={{ fontWeight: 400, fontSize: '0.89rem' }}>
                            {typeof Box === 'number'
                                ? (Convert.euro(Box).Data || "")
                                : (typeof Box === 'string' ? Box : "")
                            }
                        </MDTypography>
                    </Stack>)
                    break;
                default:
                    if (!BoxElement.ignore || !BoxElement?.ignore.includes(key)) {
                        if (Object.keys(BoxPart[key]).length > 0) {
                            const style = key === 'Dettagli' ?
                                { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', flexWrap: 'wrap', gap: 2 } : {}

                            elmArray.push(<Card sx={{ p: 1, width: '100%', maxWidth: '100%' }}>
                                <Stack key={key} width='100%' gap={0.2} sx={{ width: '100%', maxWidth: '100%' }}>
                                    {chooseComponent('title', { label: "Fido " + key, from: 'default' })}
                                    <Stack
                                        key={key} width='100%' gap={0.2}
                                        sx={{ ...style }}
                                        style={tuttiUguali ? { opacity: 0.3 } : {}}
                                    >
                                        {generateBlockElm(Box, key)}
                                    </Stack>
                                </Stack>
                            </Card>)
                        }

                    }
                    break;
            }
        }

        return (elmArray);
    }, [data, FidoActived, darkMode]);

    /**
     * Genera gli elementi singoli facendo distinzione tra i numeri e le  
     * stringhe in modo tale da formatarli
     * @param Box in input l'oggetto in elaborazione che ha bisogno di printare 
     * gli elementi al suo interno
     * @param BoxKey in input il nome della proprietà madre degli elementi 
     * bassati in Box
     */
    const generateBlockElm = useCallback((Box, BoxKey) => {
        const BlockArray = [];

        if (BoxKey === 'Dettagli') {
            const det = Box || {};
            const ORDER = ['SaldoCliente', 'Rischio', 'Esposizione', 'Scaduto', 'Insoluti'];
            const LABELS = {
                SaldoCliente: 'Saldo cliente',
                Rischio: 'Rischio',
                Esposizione: 'Esposizione',
                Scaduto: 'Scaduto',
                Insoluti: 'Insoluti',
            };

            for (const k of ORDER) {
                const v = det?.[k];
                const styleH3 = { ml: 'auto', fontWeight: 300, fontSize: '1rem' };
                const styleH4 = { ml: 'auto', fontWeight: 600, fontSize: '1.245rem' };

                BlockArray.push(
                    <Stack key={k} sx={{ alignItems: 'center' }}>
                        <MDTypography component="h3" style={{ ...styleH3 }}>
                            {LABELS[k]}
                        </MDTypography>
                        <MDTypography component="h4" sx={{ ...styleH4 }}>
                            {typeof v === 'number'
                                ? (Convert.euro(v).Data || "")
                                : (typeof v === 'string' ? (v || "") : "")
                            }
                        </MDTypography>
                    </Stack>
                );
            }

            return BlockArray;
        }

        for (const y in Box) {
            const element = Box[y];
            const styleBox = BoxKey !== 'Dettagli' ? { flexDirection: 'row' } : {}
            const styleH3 = BoxKey === 'Dettagli' ? { ml: 'auto', fontWeight: 300, fontSize: '1rem' } : { fontWeight: 300, fontSize: '0.67em' }
            const styleH4 = BoxKey === 'Dettagli' ? { ml: 'auto', fontWeight: 600, fontSize: '1.245rem' } : { ml: 'auto', fontWeight: 400, fontSize: '0.89rem' }

            BlockArray.push(<Stack key={y} sx={{ ...styleBox, alignItems: 'center' }}>
                <MDTypography component="h3" style={{ ...styleH3 }}>
                    {Object.keys(Box).find(elm => elm == y).split(/(?=[A-Z])/).join(' ')}
                </MDTypography>
                <MDTypography component="h4" sx={{ ...styleH4 }}>
                    {typeof element == 'number' ?
                        (Convert.euro(element).Data || "")
                        :
                        typeof element == 'string' &&
                        (element || "")
                    }
                </MDTypography>
            </Stack>)
        }

        return BlockArray;
    }, [data, FidoActived, darkMode]);

    /**
     * Generatore di Elementi dinamici in base a diversi parametri
     * @param type in input la tipologia del elemento che deve essere generato
     * @param e in input l'oggetto in questione che si trova nella struttura 
     * dei singoli componenti
     * @param index il valore indice che viene generato dal .map che sta 
     * creando l'oggetto
     * @param BoxElement in input l'elemento madre che costruisce il Box 
     * stesso
     */
    const chooseComponent = useCallback((type, e, index, BoxElement) => {
        let component = null;
        //prendi la proprietà madre definita nel BoxElement oppure se è definita li dai la precedenza a from del elemento row singolo.
        const selectFrom = e ? e.from ? e.from : BoxElement.from : null;

        switch (type) {
            case 'Avatar':
                component = <Avatar key={index} {...StringAvatar({ firstName: data[selectFrom][e.key] })} style={e.sx} />
                break;
            case 'key-label':
                component = <Stack key={index} direction={e?.direction} gap={e?.gap} sx={e?.sx}>
                    <MDTypography component="h3" sx={{ ...e.keysx, fontSize: '0.7rem' }}>
                        {e.typeof !== 'euro' ? data[selectFrom][e.key] : Convert.euro(data[selectFrom][e.key]).Data}
                    </MDTypography>
                    <MDTypography component="h3" sx={e.labelsx ? { ...e.labelsx } : { ...e.keysx, fontSize: '0.7rem' }}
                        style={{ color: '#929292', fontWeight: 300 }}>
                        {e.label}
                    </MDTypography>
                    {e.desc && <MDTypography component="span" sx={e.descsx ? e.descsx : { ...e.keysx, fontSize: '0.7rem' }}
                        style={{ color: '#929292', fontWeight: 300 }}>
                        {e.desc}
                    </MDTypography>}
                </Stack>
                break;
            case 'label-key':
                component = <Stack key={index} direction={e?.direction} gap={e?.gap} sx={e?.sx}>
                    <MDTypography component="h3" sx={e.labelsx ? e.labelsx : e.keysx} style={{ color: '#929292', fontWeight: 300 }}>
                        {e?.label ?
                            e.label
                            : data[selectFrom] ? Object.keys(data[selectFrom]).find(elm => elm === e.key) &&
                                Object.keys(data[selectFrom]).find(elm => elm === e.key).split(/(?=[A-Z])/).join(' ')
                                : "Non Disponibile"
                        }
                    </MDTypography>
                    <MDTypography component="h3" sx={e.keysx} style={e.keyDiff ?
                        (selectFrom && data[selectFrom] && e.key && data[selectFrom][e.key]) ?
                            (e.keyDiff - Number(data[selectFrom][e.key])) < 3 ?
                                { color: '#3aac3a', backgroundColor: '#4bbf4b54' }
                                : { color: '#be4949', backgroundColor: '#efb8b8' }
                            : {}
                        : {}}>
                        {e?.typeof !== 'euro' ?
                            e.typeof !== 'date' ?
                                (data[selectFrom][e.key] || "")
                                :
                                (selectFrom && data[selectFrom][e.key]) ? Convert.date(data[selectFrom][e.key]).Data : 'Non Disponibile'
                            :
                            (selectFrom && data[selectFrom][e.key] != null) ? data[selectFrom][e.key] ? Convert.euro(data[selectFrom][e.key]).Data : 'Non Disponibile'
                                : 'Non Disponibile'
                        }
                    </MDTypography>
                    {e.desc && <MDTypography component="span" sx={e.descsx ? e.descsx : e.keysx} style={{ color: '#929292', fontWeight: 300 }}>
                        {e.desc}
                    </MDTypography>}
                </Stack>
                break;
            case 'key-label-multi':
                e.keyToTake.find(elm => elm !== e.key) && e.keyToTake.unshift(e.key);
                component = <Stack key={index} direction={e.direction} gap={e.gap} sx={e.sx}>
                    <MDTypography component="h3" sx={e.labelsx} style={{ color: '#929292', fontWeight: 300 }}>
                        {e.label ? e.label : Object.keys(data[selectFrom]).find(elm => elm === e.key).split(/(?=[A-Z])/).join(' ')}
                    </MDTypography>
                    <Stack direction='row' gap={1}>
                        {e.keyToTake.map((elm, i) => (
                            <MDTypography key={i} component="h3" sx={e.keysx}>
                                {data[selectFrom][elm]}
                            </MDTypography>
                        ))}
                    </Stack>
                </Stack>
                break;
            case 'icon':
                component = <Stack key={index} sx={e.sx}>
                    {e.icon}
                </Stack>;
                break;
            case 'title':
                component = <MDTypography component="span" key={index} sx={{
                    alignSelf: 'flex-end',
                    fontWeight: 300,
                    fontSize: '0.76em',
                    marginRight: 'auto',
                    backgroundColor: '#cccccc3b',
                    padding: 0.7,
                    borderRadius: 2,
                    mb: 1.5
                }}>
                    {e.label}
                </MDTypography>;
                break;
            case 'GraphRating':
                component = <Stack key={index} sx={e.sx}>
                    <MDTypography component="span" sx={e.labelsx}>
                        {e.label || ""}
                    </MDTypography>
                    <Stack>
                        <Stack sx={style_main((data?.Generale?.Rating || "0"), data)} style={{ justifyContent: 'flex-end', alignItems: 'center' }}>
                            <MDTypography component="span" style={{
                                fontSize: '4em',
                                fontFamily: "Helvetica, Arial, sans-serif",
                                fontWeight: '600',
                            }}>
                                {data?.Generale?.RatingInternazionale ? data?.Generale?.RatingInternazionale : '-'}
                            </MDTypography>
                            <MDTypography component="span">
                                {data?.Generale?.Rating != null ? e.desc : 'Valutazione Non Disponibile'}
                            </MDTypography>
                        </Stack>
                        <MDBox sx={style_rounded((data?.Generale?.Rating || "0"), data)}></MDBox>
                    </Stack>
                </Stack>
                break;
            case 'ProgressCharts':
                //e.varSwitch fa riferimento alla variabile data in input scritta nel elemento
                const selectPositionData = data[selectFrom][Object.keys(data[selectFrom])[e.varSwitch]];
                component = <Stack key={index} gap={2} alignItems={'center'} sx={e.sx}>
                    <MDTypography component="h3" sx={e.labelsx}>
                        {"Fido Residuo " + Object.keys(data[selectFrom])[e.varSwitch]}
                    </MDTypography>
                    <Stack direction='row' gap={e.gap} sx={{ height: '100%' }}>
                        <ProgressCharts percent={((selectPositionData[e.values[0]] / selectPositionData[e.values[1]]) * 100)} icon={<AttachMoneyIcon />} />
                        <MDTypography component="h3" sx={e.keysx} style={selectPositionData[e.values[0]] < 0 ? { color: '#bb3535' } : {}}>
                            {Convert.euro(selectPositionData[e.values[0]]).Data}
                        </MDTypography>
                        <Tooltip>
                            <MDTypography component="span" sx={{ alignSelf: 'center', fontWeight: 300, marginTop: '3em' }}>
                                <span style={{ fontSize: '0.84rem' }}>di </span>
                                <span>{Convert.euro(selectPositionData[e.values[1]]).Data}</span>
                            </MDTypography>
                        </Tooltip>
                    </Stack>
                    {e.desc && <MDTypography component="span" sx={e.descsx ? e.descsx : e.keysx} style={{ color: '#929292', fontWeight: 300 }}>
                        {e.desc}
                    </MDTypography>}
                </Stack>
                break;
            case 'ChangeStatus':
                component = <MDTypography key={index} component="h3" sx={e.sx} style={e.condition.includes(data[selectFrom][e.key]) ?
                    { backgroundColor: "#4bbf4b54", color: "#3aac3a" } : { backgroundColor: "#efb8b8", color: "#be4949" }}>
                    {e.from ? data[e.from][e.key] : data[BoxElement.from][e.key]}
                </MDTypography>
                break;
            case 'GraphFatturato':
                //array degli anni dal 2021 ad oggi
                const years = [];
                const currentYear = new Date().getFullYear();
                for (let year = 2021; year <= currentYear; year++) {
                    years.push(year.toString());
                };

                component = data[BoxElement.from] ? <Fade key={index} in={true}>
                    <Stack className='GraphFatturato' direction='row' gap={0.5}
                        sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
                        {years.map((key, x) => {
                            //index del elemento all'interno dei dati ricevuti in modo tale da vedere anche l'elemento precedente
                            const indexKey = years.findIndex(target => target.key == key);
                            const DataPropriety = data[selectFrom][Object.keys(data[selectFrom])[FidoActived]];
                            /*
                            * Calcolo differenza di fatturato dall'anno corrente (elm) a quello precedente
                            * se l'anno precendete ha come valore diverso da 0
                            */

                            let difFatturato = null;
                            const fatturatoList = Object.keys(DataPropriety).length - 1;
                            if (fatturatoList > 0 && indexKey != 0 && DataPropriety[key] != null) {
                                if (indexKey !== fatturatoList) {
                                    difFatturato = (DataPropriety[years[(indexKey - 1)]] != 0 &&
                                        (((DataPropriety[key] - DataPropriety[years[(indexKey - 1)]])
                                            / DataPropriety[years[(indexKey - 1)]]) * 100).toFixed(0))
                                } else {
                                    difFatturato = (DataPropriety[years[(indexKey - 1)]] != 0 &&
                                        (((DataPropriety[key] - DataPropriety?.Corrente)
                                            / DataPropriety?.Corrente) * 100).toFixed(0));
                                }
                            };

                            return (DataPropriety[key] != null) &&
                                <Stack sx={{
                                    gap: 1, padding: '5px 15px 0px 15px', borderRadius: 3, width: '100%', alignItems: 'flex-start', padding: 2
                                }} key={x} style={{
                                    background: `linear-gradient(17deg, ${darkMode ? palette.dark.main : palette.white.main} 33%,
                                    ${indexKey != 0 ? difFatturato < 0 ? '#ca673929' : '#c4eac47d' : '#fff'} 110%)`
                                }} p={2}>
                                    <Stack direction='row' width='100%'>
                                        <MDTypography component="span" sx={{
                                            alignSelf: 'flex-end', 
                                            color: '#aeaeae', 
                                            fontWeight: 300, 
                                            fontSize: '0.76em', 
                                            marginRight: 'auto', 
                                            backgroundColor: '#cccccc3b', 
                                            padding: 0.7, 
                                            borderRadius: 2
                                        }} style={{ marginRight: 'auto' }}>
                                            Fatturato {key}
                                        </MDTypography>
                                        {

                                            (difFatturato && difFatturato !== "NaN") &&
                                            <Tooltip title={`Fatturato ${difFatturato < 0 ? 'diminuito' : 'aumentato'} del ${difFatturato}%`}>
                                                <span style={{
                                                    backgroundColor: difFatturato > 0 ? "#4bbf4b54" : "#efb8b8",
                                                    marginLeft: '15px',
                                                    padding: "0 10px",
                                                    borderRadius: "12px",
                                                    fontSize: "1.1rem",
                                                    alignSelf: 'center',
                                                    color: difFatturato > 0 ? "#3aac3a" : '#be4962',
                                                }}>{
                                                        difFatturato > 0 ?
                                                            <>{difFatturato}% <TrendingUpIcon /></> : <>{difFatturato}%<TrendingDownIcon /></>
                                                    }</span>
                                            </Tooltip>
                                        }
                                    </Stack>
                                    <MDTypography component="h3" sx={{
                                        fontSize: '2rem', fontWeight: '600', padding: '0 15px'
                                    }}>
                                        {Convert.euro(DataPropriety[key]).Data}
                                    </MDTypography>
                                    <Stack mt='auto' width='100%'>
                                        <Stack direction='row' justifyContent='space-between' width='100%'>
                                            <MDTypography component="span"
                                                sx={{ textTransform: 'uppercase', fontWeight: '500', fontSize: '0.76rem' }}>
                                                Insoluti
                                            </MDTypography>
                                            <MDTypography component="span" sx={{
                                                fontSize: '0.74rem', color: '#9e9e9e'
                                            }}>
                                                {DataPropriety[key + "Insoluti"] || DataPropriety[key + "Insoluti"] == 0
                                                    ? DataPropriety[key + "Insoluti"] : "Valore non presente"}
                                            </MDTypography>
                                        </Stack>
                                        <Divider />
                                        <MDTypography component="span"
                                            sx={{ textTransform: 'uppercase', fontWeight: '500', fontSize: '0.96rem' }}>
                                            {FidoActived != 0 ? 'Focelda' : 'IOT'}
                                        </MDTypography>
                                        <MDTypography component="span" sx={{
                                            fontSize: '0.74rem', color: '#9e9e9e'
                                        }}>
                                            Fatturato del {key} del cliente ${FidoActived != 0 ? 'Focelda' : 'IOT'}.
                                        </MDTypography>
                                    </Stack>

                                </Stack>
                        })}
                    </Stack>
                </Fade>
                    : generateSkeleton(3, index)

                break;
            case 'switch':
                component = <Stack direction='row' sx={{
                    mb: '-2px', zIndex: 1,
                    width: 'fit-content', borderTopLeftRadius: '10px', borderTopRightRadius: '10px'
                }}>
                    <MDTypography onClick={() => setFidoActived(1)} component="h3"
                        style={{ fontWeight: 500, cursor: 'pointer', fontSize: "0.86rem", padding: 10, minWidth: '6rem', textAlign: 'center', transition: 'color 300ms ease-in, background-color 150ms ease-in' }}
                        sx={FidoActived == 1 ? {
                            color: '#fff', backgroundColor: `${darkMode ? palette.primary.main : palette.primary.dark}`,
                            borderRadius: "8px 8px 0 0"
                        } : { color: '#fff', backgroundColor: `${darkMode ? palette.grey[800] : palette.grey[400]}`, borderRadius: "8px 8px 0 0" }}
                    >
                        Focelda
                    </MDTypography>
                    <MDTypography onClick={() => setFidoActived(0)} component="h3"
                        style={{ fontWeight: 500, cursor: 'pointer', fontSize: "0.86rem", padding: 10, minWidth: '6rem', textAlign: 'center', transition: 'color 300ms ease-in, background-color 150ms ease-in' }}
                        sx={FidoActived == 0 ? { color: '#fff', backgroundColor: `${darkMode ? palette.primary.main : palette.primary.dark}`, borderRadius: "8px 8px 0 0" } :
                            { color: '#fff', backgroundColor: `${darkMode ? palette.grey[800] : palette.grey[400]}`, borderRadius: "8px 8px 0 0" }}
                    >
                        IOT
                    </MDTypography>
                </Stack>
                break;
            default:
                component = <MDTypography key={index} component="h3" sx={e.sx}>
                    {e.typeof !== 'date' ? data[selectFrom][e.key]
                        :
                        Convert.date(data[selectFrom][e.key]).Data
                    }
                </MDTypography>
                break;
        };

        return component;
    }, [data, FidoActived, darkMode]);

    const generateSkeleton = (number, index) => {
        const array = [];
        for (let i = 0; i < number; i++) {
            array.push(<Skeleton key={i} variant="rounded" sx={{ width: '100%', height: '100%' }} />)
        };
        return <Stack key={index} sx={{ width: '100%', height: '100%' }} className='GraphFatturato' direction='row' gap={0.5}>
            {array}
        </Stack>
    };

    const generateRender = useMemo(() => {
        return generalStructureBox.map((e, index) => (
            dynamicBox(e, index)
        ))
    }, [data, generalStructureBox, FidoActived, laodStatus, darkMode]);

    return userContext.details === null ? (
        "Error Loading User details"
    ) : !userContext.details ? (
        <div><Loader /></div>
    ) : (
        <DashboardLayout>
            <FiltersFido data={listOfCustomers}
                setCustomerData={setData} cancelMainRequest={cancelRequest}
                CustomerDataAPI={CustomerDataAPI}
                reqCustomersDataStatus={reqCustomersDataStatus}
                setReqCustomersDataStatus={setReqCustomersDataStatus}
                setListOfCustomers={setListOfCustomers}
                abortController={abortController}
                customersSelected={customersSelected}
                setCustomersSelected={setCustomersSelected}
                handleOpenReqFido={handleOpen}
                handleCloseReqFido={handleClose}
                setFidoStatusPanel={setFidoStatusPanelSafe}
                Payments={Payments}
                setStatusPanelContentDisabled={setStatusPanelContentDisabled}
                setStatusPanelCloseDisabled={setStatusPanelCloseDisabled}
                setRequestPanelContentDisabled={setRequestPanelContentDisabled}
                setRequestPanelCloseDisabled={setRequestPanelCloseDisabled}
                hasPendingFido={hasPendingFido}
                canOpenRequest={canOpenRequest}
                setTourOpen={setTourOpen}
            />
            {!reqCustomersDataStatus && (data && "statoUltimoFido" in data && [0, 1].includes(data.statoUltimoFido)) &&
                <Fade in={true} timeout={1000}><Stack className='css-width-100'><PopupInfo body='Questo fido è gia stato richiesto ed è in fase di Elaborazione o Attesa.' title='Stato del Fido Richiesto'
                    icon={icon_info({ color: '#cd8e00' })} sx={{ mt: 2 }}
                    close={false} theme='info' /></Stack></Fade>}

            {customersSelected && <Fragment>
                {(openReqFido && data && (!('statoUltimoFido' in data) || ![0, 1].includes(data.statoUltimoFido))) && (
                    <RequestFido
                        open={openReqFido}
                        handleClose={handleClose}
                        data={data}
                        paymentsMethodList={paymentsMethodList}
                        contentDisabled={requestPanelContentDisabled}
                        closeDisabled={requestPanelCloseDisabled}
                        tourOpen={tourOpen}
                    />
                )}
                <MDBox py={3} translate="no">
                    <Grid container spacing={3} sx={laodStatus ? { height: '18em' } : {}}>
                        {generateRender}
                    </Grid>
                </MDBox>
            </Fragment>}

            <StatusRequestedFidi userContext={userContext} fidoStatusPanel={fidoStatusPanel}
                setFidoStatusPanel={setFidoStatusPanelSafe} contentDisabled={statusPanelContentDisabled} closeDisabled={statusPanelCloseDisabled} tourOpen={tourOpen} />
            <Tooltip id="general-actionBar-tooltip" place="bottom" style={{
                maxWidth: "15vw", minWidth: 150, fontSize: '0.87rem',
                textAlign: 'center', zIndex: 9999,
            }} />
        </DashboardLayout>
    );
};

export default memo(FidoCliente);
