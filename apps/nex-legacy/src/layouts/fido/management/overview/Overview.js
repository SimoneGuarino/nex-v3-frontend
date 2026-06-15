import React, { Fragment, useEffect } from "react";
//@Internal Components
import MDTypography from 'components/MDTypography';
import { SplitCammelCase } from "utils";
//@External Compoennts
import {
    Stack, Avatar, Zoom, Divider, Slide,
    FormControl, InputLabel, OutlinedInput, InputAdornment,
} from "@mui/material";
//@Mui Icons
import InfoIcon from '@mui/icons-material/Info';
import PaidIcon from '@mui/icons-material/Paid';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import {
    icon_edit, icon_save, icon_reset, icon_close,
    icon_people, icon_megaphone, icon_time, icon_expandMore,
    icon_employee, icon_forum
} from "config/icons";

import { ChangeFieldValue } from "../fetch/changeFieldValue";
import { ConvertToItalianDate } from "utils";

// themes
import { MainTheme } from "assets/settingsTheme";
import { useGeneralDataContext } from "context/GeneralDataContext";
import { DivideName } from "utils/divideName";
import { enqueueSnackbar } from "components/MessageBox";
import { StringAvatar } from "utils/stringToColor";
import FDBox from "components/UI/box/FDBox";
import FDButton from "components/UI/buttons/FDButton";
import FDIconButton from "components/UI/buttons/FDIconButton";

import ConvertModule from "classes/convert.js";
import "../style.css";
import { useNexTheme } from "@nex/theme-system";

const Convert = new ConvertModule();



//stile del icona all'interno di chooseTag 
const styleIcon = {
    padding: 0.5,
    width: '1.5em', height: '1.5em', borderRadius: 2, mt: 0.5,
}

const styleMainBox = {
    overflow: 'auto',
    position: 'relative',
    maxWidth: 500,
    marginLeft: 'auto',
    borderRadius: 5,
    transition: 'width 525ms cubic-bezier(0, 0, 0.2, 1) 0ms,transform 325ms cubic-bezier(0, 0, 0.2, 1) 0ms!important',
    boxShadow: "0px 0rem 1rem 0px rgba(0, 0, 0, 0.1)",
}


export function Overview({ data, setData, abortController, rowSelected, setRowSelected,
    statusBox, setStatusBox, genColorForRequestStatus, listOfRequestStatus, chronoPanelStatus,
    userContext, CheckLUGotTheST, TaskAssignment, ChangeStatus, onClose, lockChat, isActive = true, }) {
    const { openChat, createChatBlock } = useGeneralDataContext();

    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const { primary } = palette;

    //const CloseOverview = () => { setStatusBox(!statusBox); setRowSelected(null) };


    const [expandHeader, setExpandHeader] = React.useState(true);
    const ChangeExpandStatus = () => setExpandHeader(!expandHeader);

    const [scrollOverviewAnimStatus, setScrollOverviewAnimStatus] = React.useState(false);
    const scrollableDivRef = React.useRef(null);

    const [editMode, setEditMode] = React.useState(null);
    const [editChanges, setEditChanges] = React.useState({});
    const [statusBlockDetails, setStatusBlockDetails] = React.useState({});
    const ChangeStatusBlockDetails = (key) => {
        setStatusBlockDetails(prev => {
            return { ...prev, [key]: prev[key] == null ? false : !prev[key] }
        })
    };


    React.useEffect(() => {
        setEditMode(null);
        setEditChanges({});
    }, [rowSelected]);

    const textColor = darkMode ? '#fff' : '#000';
    const headerBgColor = darkMode ? palette.primary.dark : 'moccasin';
    const reasumeBgColor = darkMode ? palette.grey[900] : '#d7edfb';;
    const highlightsTextColor = '#edb062';
    const iconsColor = darkMode ? '#fff' : '';



    const HandleChangeFido = (num, field) => {
        const isValidInput = /^-?\d*\,?\d*$/.test(num) || num === 0;
        setEditChanges(prev => {
            return { ...prev, [field]: isValidInput ? num : prev[field] }
        });
    };
    const DoActions = (actions, field, e) => {
        switch (actions) {
            case 'edit':
                setEditMode(field)
                break;
            case "save":
                setEditMode(null)
                if (editChanges[field] && editChanges[field] != e) {
                    ChangeFieldValue(userContext, abortController, data[rowSelected], editChanges);
                    setData(prev => {
                        const copy = [...prev];
                        copy[rowSelected]['Dettagli'][field] = parseFloat(editChanges[field]);
                        return copy
                    });
                }
                break;
            case "reset":
                setEditChanges(prev => {
                    return { ...prev, [field]: e.toString() }
                });
                setEditMode(null)
                break;
            case "close":
                setEditMode(null)
                setEditChanges(prev => {
                    const copy = { ...prev };
                    delete copy[field];
                    return copy;
                });
                break;
        }
    };



    const DynGeneration = (data, rowSelected, StringAvatar) => {
        const stack = [];
        const dataRow = data[rowSelected].Dettagli;
        for (const key in dataRow) {
            const e = dataRow[key]

            if (typeof e == 'object') {
                const stackNested = [];
                let calcHeigth_anim = e !== null ?
                    Math.max(Object.keys(e).length, 1) * (key !== 'Indicatori' ? 30 : 40)
                    : 30;
                if (key == 'Azienda' && e.TipologieSedi) {
                    calcHeigth_anim = calcHeigth_anim + (Object.keys(e.TipologieSedi).length * 60);
                }

                if (e !== null && Object.keys(e).length > 0) {
                    for (const keyX in e) {
                        const x = e[keyX];

                        if (!Array.isArray(x) && (typeof x == 'string' || typeof x == 'number')) {
                            const tagComposed = ChooseTagForGrouped(key, keyX, x);
                            stackNested.push(tagComposed);
                        } else {
                            //l'elemento è un array
                            const GrupOfByArray = []

                            if (x !== null && Object.values(x).length > 0) {
                                for (let j = 0; j < x.length; j++) {
                                    //forma il gruppo stack per mantere i tag generati uniti graficamente
                                    //che fanno parte dello stesso oggetto.
                                    const StackObjectofArrayGroup = []
                                    const m = x[j];

                                    //Elabora ogni proprietà dell'oggetto per creare nuovi tag ed elementi
                                    //all'interno del scrollableOverview
                                    for (const proprietyOfM in m) {
                                        const mPropriety = m[proprietyOfM]
                                        if (proprietyOfM != '_id') {
                                            const tagComposed = ChooseTagForGrouped(key, proprietyOfM, mPropriety);
                                            StackObjectofArrayGroup.push(tagComposed);
                                        }
                                    }

                                    GrupOfByArray.push(<Stack key={key + j} direction='row' gap={1} mb={1}>
                                        <MDTypography key={key} component="h3" sx={{ color: highlightsTextColor, fontSize: '0.7em', fontWeight: 600, }}>
                                            {`${j + 1})`}
                                        </MDTypography>
                                        <Stack>
                                            {StackObjectofArrayGroup}
                                        </Stack>
                                    </Stack>);
                                }

                                //pusha l'elemento finale composto all'interno di stackNested che permettera il visualizzarsi
                                //degli elementi stessi.
                                stackNested.push(<Stack key={key + x} gap={1} mt={2}>
                                    <MDTypography key={key} component="h3" sx={{ color: highlightsTextColor, fontSize: '0.7em', fontWeight: 600, }}>
                                        {SplitCammelCase({ string: keyX })}
                                    </MDTypography>
                                    {GrupOfByArray}
                                </Stack>);
                            } else {
                                stackNested.push(ChooseTagForGrouped(key, keyX, 'Non Presente'))
                            }
                        }
                    }
                } else {
                    stackNested.push(<MDTypography key={key + 1} component="h3" sx={{ color: textColor, fontSize: '0.7em', fontWeight: 400, }}>
                        No
                    </MDTypography>);
                }


                stack.push(<Fragment key={key + 1}>
                    <Stack direction='row' gap={1} mt={2} mb={2}>
                        <FDIconButton className="h-fit"
                            icon={icon_expandMore((statusBlockDetails[key] || statusBlockDetails[key] == undefined) ? { transform: "rotate(180deg)", transition: 'all 200ms ease-in' }
                                : { transform: "rotate(0deg)", transition: 'all 200ms ease-in' })} onClick={() => ChangeStatusBlockDetails(key)} />

                        <InfoIcon sx={styleIcon} className="text-gray-300 dark:text-gray-500" />
                        <Stack gap={1} width='100%' justifyContent='center'>
                            <MDTypography component="h3" sx={{ color: textColor, fontSize: '0.8em', fontWeight: 600, width: '100%' }}>
                                {SplitCammelCase({ string: key })}
                            </MDTypography>
                            <Stack className='transition-all-css' gap={0.5} sx={(statusBlockDetails[key] || statusBlockDetails[key] == undefined) ?
                                { overflow: 'auto', height: 0, opacity: 0 } : { height: calcHeigth_anim, opacity: 1 }}>
                                {stackNested}
                            </Stack>
                        </Stack>
                    </Stack>
                </Fragment>)
            } else {
                const tagComposed = ChooseTag(key, e, StringAvatar);
                stack.push(tagComposed)
            }
        }
        return stack;
    };

    const ChooseTagForGrouped = (mainKey, key, e) => {
        let component = null;
        switch (mainKey) {
            case "Indicatori":
                component = <Stack key={key} direction='row' gap={1} marginRight={2} width='100%' justifyContent='space-between'>
                    <MDTypography component="h3" sx={{ color: '#939393', fontSize: '0.6em', fontWeight: 300, alignSelf: 'center' }}>
                        {SplitCammelCase({ string: key })}
                    </MDTypography>
                    <MDTypography component="h3" sx={{
                        color: textColor, fontSize: '0.7em',
                        fontWeight: 400, backgroundColor: '#d3d3d370', p: 0.78, borderRadius: 2
                    }}>
                        {e !== 'Non Presente' ? (key == 'IncassoCrediti' ? Convert.euro(e).Data : e) : e}
                    </MDTypography>
                </Stack>
                break;
            default:
                component = <Stack key={key} direction='row' gap={1} marginRight={2}>
                    <MDTypography component="h3" sx={{ color: '#939393', fontSize: '0.6em', fontWeight: 300, alignSelf: 'center' }}>
                        {SplitCammelCase({ string: key })}
                    </MDTypography>
                    <MDTypography component="h3" sx={{ color: textColor, fontSize: '0.7em', fontWeight: 400, }}>
                        {key == 'Eta' ? e + ' anni' : e}
                    </MDTypography>
                </Stack>
                break;
        }
        return component;
    };

    const ChooseTag = (key, e, StringAvatar) => {
        let component = null;
        switch (key) {
            case 'inCarico':
                component = <Stack key={key} padding='15px' margin={0} backgroundColor='#c4bd88'>
                    {e ? <Stack direction='row' gap={2}>
                        <Avatar {...StringAvatar({ firstName: e })} style={{ borderRadius: '10px !important' }} />
                        <Stack sx={{ alignSelf: 'center' }}>
                            <MDTypography component="p" sx={{ color: '#767676', fontSize: '0.56em', fontWeight: 400 }}>
                                presa in carico da
                            </MDTypography>
                            <MDTypography component="h3" sx={{ color: textColor, fontSize: '0.7em', fontWeight: 500 }}>
                                {e}
                            </MDTypography>
                        </Stack>
                    </Stack>
                        :
                        <Stack sx={{ alignSelf: 'center' }}>
                            <MDTypography component="p" sx={{ color: '#767676', fontSize: '0.56em', fontWeight: 400 }}>
                                presa in carico da
                            </MDTypography>
                            <MDTypography component="h3" sx={{ color: textColor, fontSize: '0.7em', fontWeight: 500 }}>
                                Nessun utente ha in carico questa richiesta
                            </MDTypography>
                        </Stack>}
                </Stack>
                break;
            case 'Commerciale':
                component = <Stack key={key} padding='15px' margin={0} backgroundColor='#cfc99c'>
                    <Stack direction='row' gap={2}>
                        <Avatar {...StringAvatar({ firstName: e })} style={{ borderRadius: '10px !important' }} />
                        <Stack sx={{ alignSelf: 'center' }}>
                            <MDTypography component="p" sx={{ color: '#767676', fontSize: '0.56em', fontWeight: 400 }}>
                                Richiesta Fido Fatta da
                            </MDTypography>
                            <MDTypography component="h3" sx={{ color: textColor, fontSize: '0.7em', fontWeight: 500 }}>
                                {e}
                            </MDTypography>
                        </Stack>
                    </Stack>
                </Stack>
                break;
            case 'FidoRichiesto':
                component = <Stack key={key} direction='row' mt={2} mb={2} gap={1}>
                    <FDIconButton className="h-fit"
                        icon={icon_expandMore((statusBlockDetails[key] || statusBlockDetails[key] == undefined) ? { transform: "rotate(180deg)", transition: 'all 200ms ease-in' }
                            : { transform: "rotate(0deg)", transition: 'all 200ms ease-in' })} onClick={() => ChangeStatusBlockDetails(key)} />

                    <PaidIcon sx={styleIcon} className="text-gray-300 dark:text-gray-500" />
                    <Stack>
                        <MDTypography component="h3" sx={{ color: textColor, fontSize: '0.8em', fontWeight: 600 }}>
                            {SplitCammelCase({ string: key })}
                        </MDTypography>
                        <Stack className='transition-all-css' gap={0.5} sx={(statusBlockDetails[key] || statusBlockDetails[key] == undefined) ?
                            { overflow: 'auto', height: 0, opacity: 0 } : { height: 40, opacity: 1 }}>
                            {
                                editMode != key ?
                                    <MDTypography component="h3" sx={{ color: highlightsTextColor, fontSize: '1.2em', fontWeight: 600, }}>
                                        {typeof e != 'number' ? e :
                                            editChanges[key] ? Convert.euro(editChanges[key].replace(',', '.')).Data : Convert.euro(e).Data}
                                    </MDTypography>
                                    :
                                    <FormControl fullWidth sx={{ m: 1, color: '#fff' }}>
                                        <InputLabel htmlFor="outlined-adornment-amount">Ammontare</InputLabel>
                                        <OutlinedInput
                                            type="text"
                                            value={editChanges[key] ? editChanges[key] : ""}
                                            placeholder={e}
                                            onChange={(e) => HandleChangeFido(e.target.value, key)}
                                            className="outlined-adornment-amount"
                                            startAdornment={<InputAdornment className="inputAdornment" position="start">€</InputAdornment>}
                                            label="Ammontare"
                                        />
                                    </FormControl>
                            }
                        </Stack>
                    </Stack>
                    {
                        (!statusBlockDetails[key] && CheckLUGotTheST(data[rowSelected], userContext)) && <Stack sx={{ marginLeft: 'auto' }}>
                            <FDIconButton className="h-fit"
                                dataTooltipId="general-webapp-tooltip"
                                dataTooltipContent='Modifica il valore'
                                onClick={() => DoActions(editMode != key ? "edit" : 'save', key, e)}
                                icon={editMode != key ? icon_edit({ color: iconsColor }) : icon_save({ color: iconsColor })} />

                            {editMode == key && <FDIconButton className="h-fit"
                                dataTooltipId="general-webapp-tooltip"
                                dataTooltipContent='Chiudi la possibilità di modifica'
                                onClick={() => DoActions(editChanges[key] ? 'reset' : 'close', key, e)}
                                icon={editChanges[key] ? icon_reset({ color: iconsColor }) : icon_close({ color: iconsColor })} />}
                        </Stack>
                    }

                </Stack>
                break;
            default:
                component = <Stack key={key} direction='row' mt={2} mb={2} gap={1}>
                    <FDIconButton className="h-fit"
                        onClick={() => ChangeStatusBlockDetails(key)}
                        icon={icon_expandMore((statusBlockDetails[key] || statusBlockDetails[key] == undefined) ? { transform: "rotate(180deg)", transition: 'all 200ms ease-in' }
                            : { transform: "rotate(0deg)", transition: 'all 200ms ease-in' })} />

                    {key == 'DataRichiesta' ?
                        <ScheduleRoundedIcon sx={styleIcon} className="text-gray-300 dark:text-gray-500" /> : <InfoIcon sx={styleIcon} className="text-gray-300 dark:text-gray-500" />}
                    <Stack>
                        <MDTypography component="h3" sx={{ color: textColor, fontSize: '0.8em', fontWeight: 600 }}>
                            {SplitCammelCase({ string: key })}
                        </MDTypography>
                        <Stack className='transition-all-css' gap={0.5} sx={(statusBlockDetails[key] || statusBlockDetails[key] == undefined) ?
                            { overflow: 'auto', height: 0, opacity: 0 } : { height: 40, opacity: 1 }}>
                            <MDTypography component="h3" sx={{ color: textColor, fontSize: '0.7em', fontWeight: 400, }}>
                                {typeof e != 'number' ?
                                    (e == '' || e == null) ? 'Nessuna' :
                                        (key == 'DataRichiesta' ? new Date(e).toLocaleString('it-IT') : e)
                                    : Convert.euro(e).Data}
                            </MDTypography>
                        </Stack>
                    </Stack>
                </Stack>
                break;
        }
        return component;
    };


    //al trigger del evento scroll richiama questa funzione per controllare lo stato dell barra (scroll)
    //in modo ta mostrare o nascondere lo style e l'animazione quando raggiunge un certo punto.
    const checkScrollBarPosition = (nextPos) => {
        const scrollableDiv = scrollableDivRef.current;
        const scrollTop = nextPos ? nextPos : scrollableDiv.scrollTop

        if (scrollableDiv) {
            const scrollDifference =
                scrollableDiv.scrollHeight - (scrollTop + scrollableDiv.clientHeight);

            if (scrollDifference <= 1) {
                //La barra di scorrimento è nella parte più bassa!
                setScrollOverviewAnimStatus(true);
            } else {
                setScrollOverviewAnimStatus(false);
            }
        }
    };
    //al cambiamento di rowSelected resetta i valori dedicati all'animazione, allo style
    //e al posizionamento dello scroll stesso, per resettarlo verso l'alto.
    useEffect(() => {
        if (scrollableDivRef.current == null &&
            scrollableDivRef.current == undefined &&
            rowSelected == null) { return; }
        scrollableDivRef.current.scrollTop = 0;
        checkScrollBarPosition(0);

    }, [rowSelected]);

    const CreateChat = async () => {
        const row = data?.[rowSelected];
        if (!row) {
            enqueueSnackbar(
                "Sembra che ci sia stato un problema nella creazione della chat, perfavore contatta l'assistenza.",
                { title: "Ops..", type: "error" }
            );
            return;
        }

        const [nome, cognome] = DivideName(row.DettagliCommerciale?.NomeCompleto ?? "");

        // crea/recupera il blocco "fido", merge dei messaggi remoti e apertura chat
        await createChatBlock({
            data: {
                idBlock: row._id,
                titleBlock: `Richiesta Fido ${row.Dettagli?.Azienda?.Nome ?? ""}`,
                userID: row.DettagliCommerciale?.ID,
                nome,
                cognome,
                path: "fido",
                disabilitato: false,
            },
            settings: { loadFromRemote: true, createRemoteBlock: true, loadState: true },
            openAfter: true,          // apre la chat come facevi prima
            markViewedIfOther: true,  // marca come letti se ci sono messaggi dell’altro utente
        });

        // chiudi l’overview dopo l’apertura
        //CloseOverview();
        if (typeof onClose === 'function') onClose();
        // in alternativa di fallback:
        else { setStatusBox(false); setRowSelected(null); }
    };


    /*const CreateChat = () => {
        if (data[rowSelected]) {
            setMessagesData((prevMessages) => {
                const data__ = {
                    idBlock: data[rowSelected]._id,
                    titleBlock: `Richiesta Fido ${data[rowSelected].Dettagli.Azienda.Nome}`,
                    userID: data[rowSelected].DettagliCommerciale.ID,
                    nome: DivideName(data[rowSelected].DettagliCommerciale.NomeCompleto)[0],
                    cognome: DivideName(data[rowSelected].DettagliCommerciale.NomeCompleto)[1],
                    path: "fido",
                    disabilitato: false
                };

                const {messages} = CreateNewChatBlock({
                    data: data__,
                    settings: { loadFromRemote: true, createRemoteBlock: true, loadState: true },
                    messagesData_: prevMessages, // Passa l'ultima versione di messagesData
                });
                return messages;
            });

            //invia l'emit del viewed solo se ci sono effettivamente dei messaggi da parte dell'altro utente
            ViewdMessages({ idBlock: data[rowSelected]._id, path: 'fido', settings: { emit: true } });

            CloseOverview();
            setOpenChat(true);
        } else {
            enqueueSnackbar("Sembra che ci sia stato un problema nella creazione della chat, perfavore contatta l'assistenza.", {
                title: 'Ops..',
                type: 'error',
            });
        }
    };*/


    function genActionButton() {
        let component = null;
        switch (data[rowSelected]?.Stato) {
            case 0:
                component = <FDButton variant="solid" color="primary" onClick={TaskAssignment}>
                    Prendi in carico
                </FDButton>
                break;
            case 1:
                if (!CheckLUGotTheST(data[rowSelected], userContext)) { return }
                component = <>
                    <FDButton variant="outline" color="warning" onClick={() => ChangeStatus(0)}>
                        Re-imposta in attesa
                    </FDButton>
                    <FDButton variant="soft" color="primary" onClick={() => ChangeStatus(2)} className="!ml-auto">
                        Accetta
                    </FDButton>
                    <FDButton variant="outline" color="error" onClick={() => ChangeStatus(3)}>
                        Rifiuta
                    </FDButton>
                </>
                break;
        }
        return component;
    };

    const ActionOnRequest = () => (
        <FDBox className="flex transition-all p-4 space-x-2 w-full"
            style={!scrollOverviewAnimStatus ?
                { boxShadow: "rgba(0, 0, 0, 0.14) 0rem -2rem 2rem 0rem" } :
                { boxShadow: "rgba(0, 0, 0, 0) 0rem -2rem 2rem 0rem" }}
        >
            {genActionButton()}
        </FDBox>
    );




    return (
        <Slide direction="left" in={Boolean(!chronoPanelStatus && !openChat && statusBox && rowSelected !== null)} data-tour="dettagli-richiesta">
            <Stack onKeyDown={(e) => { if (!isActive) { e.preventDefault(); e.stopPropagation(); } }} sx={!statusBox ? { ...styleMainBox, width: '0%', minWidth: 0, padding: 0 }
                : {
                    ...styleMainBox, width: '50%', minWidth: 350, position: 'absolute',
                    right: 10, height: '95%', zIndex: 1, backgroundColor: `${darkMode ? palette.grey[800] : '#fff'}`
                }
            }>{!isActive && (
                <div
                    aria-hidden="true"
                    style={{
                        position: 'absolute', inset: 0, zIndex: 2,
                        background: 'rgba(0,0,0,0.06)',  // leggero “lock” visivo (puoi anche rimuoverlo)
                        pointerEvents: 'auto',
                    }}
                />
            )}
                <div
                    aria-disabled={!isActive}
                    style={isActive ? undefined : { pointerEvents: 'none', userSelect: 'none', opacity: 0.6 }}
                >
                    {rowSelected !== null && <Fragment>
                        <FDBox className="flex p-3 space-x-2">
                            <h3 className="text-xl font-bold">Dettagli della Richiesta</h3>
                            <div className="ml-auto flex items-center gap-1">
                                <span data-tour="dettagli-header-chat"><FDIconButton icon={icon_forum()} onClick={lockChat ? undefined : CreateChat}
                                    disabled={lockChat} dataTooltipId="general-fido-tooltip" dataTooltipContent="Chatta con il richiedente della richiesta" /></span>
                                <FDIconButton icon={icon_expandMore(expandHeader ? { color: iconsColor, transform: "rotate(180deg)", transition: 'all 200ms ease-in' }
                                    : { color: iconsColor, transform: "rotate(0deg)", transition: 'all 200ms ease-in' })} onClick={ChangeExpandStatus} />
                                <span data-tour="dettagli-close"><FDIconButton icon={icon_close()} onClick={onClose} /></span>
                            </div>
                        </FDBox>

                        <Stack overflow='auto' position='relative' height='100%'>
                            <Stack className='transition-all-css' sx={{
                                backgroundColor: reasumeBgColor, padding: `${expandHeader ? '16px' : '0px'}`,
                                height: `${expandHeader ? '150px' : '0px'}`, opacity: `${expandHeader ? '1' : '0'}`
                            }} gap={0.5} justifyContent='center' data-tour="dettagli-header">
                                <Stack direction='row' alignItems='center' gap={2.5}>
                                    <Stack direction='row' alignItems='center' gap={0.5}>
                                        {icon_megaphone({ width: 25, height: 25, color: iconsColor })}
                                        <MDTypography component="p" sx={{ fontSize: '0.70em', fontWeight: 600 }}>
                                            Status
                                        </MDTypography>
                                    </Stack>
                                    <MDTypography component="h3" sx={{
                                        backgroundColor: genColorForRequestStatus(listOfRequestStatus[data[rowSelected].Stato]),
                                        color: genColorForRequestStatus(listOfRequestStatus[data[rowSelected].Stato]), fontSize: '0.75rem',
                                        padding: 0.5, pl: 1, pr: 1, fontWeight: 600, alignSelf: 'center', borderRadius: 5, textAlign: 'center'
                                    }}>
                                        {listOfRequestStatus[data[rowSelected].Stato]}
                                    </MDTypography>
                                </Stack>

                                <Stack direction='row' alignItems='center' gap={2.5}>
                                    <Stack direction='row' alignItems='center' gap={0.5}>
                                        {icon_time({ width: 20, height: 20, color: iconsColor })}
                                        <MDTypography component="p" sx={{ fontSize: '0.70em', fontWeight: 600 }}>
                                            Data
                                        </MDTypography>
                                    </Stack>
                                    <MDTypography component="p" sx={{ fontSize: '0.60em', fontWeight: 600 }}>
                                        {ConvertToItalianDate(data[rowSelected].Dettagli.DataRichiesta, { time: true })}
                                    </MDTypography>
                                </Stack>

                                <Stack direction='row' alignItems='center' justifyContent='space-between'>
                                    <Stack direction='row' alignItems='center' gap={2.5}>
                                        <Stack direction='row' alignItems='center' gap={0.5}>
                                            {icon_people({ width: 20, height: 20, color: iconsColor })}
                                            <MDTypography data-tooltip-id="general-fido-tooltip" data-tooltip-content='Amministrativo che ha preso in carico il fido'
                                                component="p" sx={{ fontSize: '0.70em', fontWeight: 600 }}>
                                                Assegnato
                                            </MDTypography>
                                        </Stack>
                                        <Avatar
                                            data-tooltip-id="general-fido-tooltip"
                                            data-tooltip-content={data[rowSelected].DettagliUtenteTaskInCarico.NomeCompleto}
                                            {...StringAvatar({ fullname: data[rowSelected].DettagliUtenteTaskInCarico.NomeCompleto })}
                                            style={{ width: 30, height: 30, fontSize: '80%' }} />
                                    </Stack>
                                    <Divider orientation="vertical" sx={{ backgroundColor: iconsColor }} />
                                    <Stack direction='row' alignItems='center' gap={2.5}>
                                        <Stack direction='row' alignItems='center' gap={0.5}>
                                            {icon_employee({ width: 20, height: 20, color: iconsColor })}
                                            <MDTypography data-tooltip-id="general-fido-tooltip" data-tooltip-content='Commerciale che richiesto il fido'
                                                component="p" sx={{ fontSize: '0.70em', fontWeight: 600 }}>
                                                Richiesto
                                            </MDTypography>
                                        </Stack>
                                        <Avatar
                                            data-tooltip-id="general-fido-tooltip"
                                            data-tooltip-content={data[rowSelected].DettagliCommerciale.NomeCompleto}
                                            {...StringAvatar({ fullname: data[rowSelected].DettagliCommerciale.NomeCompleto })}
                                            style={{ width: 30, height: 30, fontSize: '80%' }} />
                                    </Stack>
                                </Stack>
                            </Stack>


                            <Zoom in={true}>
                                <Stack padding='0 24px' overflow='auto' ref={scrollableDivRef} onScroll={checkScrollBarPosition} data-tour="dettagli-sections">
                                    {DynGeneration(data, rowSelected, StringAvatar)}
                                </Stack>
                            </Zoom>
                            <MDTypography component='span' className="arrow-box transitionOpacity"
                                style={!scrollOverviewAnimStatus ? { opacity: 1, left: '47%' } : { opacity: 0, left: '47%' }}>
                                <KeyboardArrowDownRoundedIcon className="arrow arrowTop" />
                                <KeyboardArrowDownRoundedIcon className="arrow arrowMiddle" />
                                <KeyboardArrowDownRoundedIcon className="arrow arrowDown" />
                            </MDTypography>
                        </Stack>

                        {ActionOnRequest()}
                    </Fragment>
                    }</div>
            </Stack>
        </Slide>
    );
};