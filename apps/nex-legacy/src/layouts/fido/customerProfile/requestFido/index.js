/**
 * Istruzioni di aggiunta elementi:
   Oggetto Madre che compone le sezioni => main;
   Per aggiunta di una nuova sezione creare l'oggetto da inserire all'interno
   di main definendo:
 *    - key => deve essere progressiva, non ci posso essere elementi con chiave uguale
 *    - navBar_title => titolo che apparirà nella navBar
 *    - keyRegrupInObj => chiave che ha scopo di realizare la proprietà contenitore
            dell'oggetto finale da inviare al server, preferibilemente simile al navBar_title
            enza spazi esempio: 
                            --- navBar_title: 'Società Collegate' 
                            --- keyRegrupInObj: 'SocietaCorrelate'
 *    - questions  => è l'array contentiore degli elementi presenti all'interno 
            della section gli oggetti all'interno devono essere generati in questo modo:
 *                 -- key => chiave univoca stessa logica di composizione della 
 *                           stringa di keyRegrupInObj.
 *                 -- title => titolo della domanda
 *                 -- question => body della domanda
 *                 -- type_asw => tipologia della risposta a scelta tra:
 *                                  --- 'textfield', => risposta testuale
                                    --- 'numberfield', => risposta in numero positivo
                                    --- 'eurofield',   => risposta in euro
                                    --- 'addelements', => risposta con opzione di aggiunta elementi
                                    --- 'multi_addelements' => in aggiunta al normale testo scritto hai anche
                                        il select di piu elementi definiti all'interno di un altra proprietà
                                        chiamata: 'multi_select'.
                                        esempio: multi_select: ["ufficio", "negozio", "magazzino", "logistiche"]
                    -- required => fa riferimento al fatto che la domanda deve avere una risposta obbligatoriamente
                        di default le domande sono false quindi non è obbligatorio compilarle, se c'è la proprietà ed è true
                        allora la domanda deve avere per forza una risposta.
____________________________________________________________________________________________________________
*    esempio di creazione sezione con una domanda all'interno:
*    {
        key: 0, keyRegrupInObj: 'Sede', questions:[
            {
                key: 'SedeOperativa', title: "Dov'è la sede Operativa?", 
                question: "Dov'è la Sede Operativa del cliente per cui stai 
                          richiedendo un fido o un extrafido?", 
                type_asw: 'textfield'
            },
        ], navBar: true, navBar_title: 'Sede Operativa'
    },
____________________________________________________________________________________________________________
*/

import React, { useState, useCallback, forwardRef, useRef, useContext } from 'react';
import PropTypes from 'prop-types';
import { NumericFormat } from 'react-number-format';
import { UserContext } from "context/UserContext";

//internal Components
import MDTypography from "components/MDTypography";
import FoceldaLogo from '../../../../components/FoceldaLogo';

import { SendFidoRequestAPI } from '../fetch/actions/sendFidoRequest';

//@mui Components
import {
    Stack, Backdrop, Divider, Grid,
    Button, TextField, Fade, IconButton, Select,
    InputLabel, MenuItem, FormControl,
    Card
} from '@mui/material';
//**@mui icons */
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { Notifications } from 'utils/index';
import { MainTheme } from 'assets/settingsTheme';
import { icon_add, icon_info } from 'config/icons';
import { useNexTheme } from '@nex/theme-system';



const NumericFormatCustom = forwardRef(function NumericFormatCustom(
    props,
    ref,
) {
    const { onChange, ...other } = props;

    return (
        <NumericFormat
            {...other}
            getInputRef={ref}
            onValueChange={(values) => {
                onChange({
                    target: {
                        name: props.name,
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

NumericFormatCustom.propTypes = {
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
};

function RequestFido({ open, handleClose, data, paymentsMethodList, contentDisabled = false, closeDisabled = false, tourOpen = false, }) {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    //chiave del pannello attualmente attivo.
    const [activeKey, setActiveKey] = useState(0);
    const changeKey = (key) => setActiveKey(key);
    const [userContext, setUserContext] = useContext(UserContext);
    // Abort il panding del fetch all server
    const abortController = useRef(null);
    const socketNTIF = React.useRef(null);
    const isOpen = Boolean(open && data);


    /**
     * Stato che mantiene il testo da aggiungere successivamente all'array target
     * (logica di AUIE).
     */
    const [handleAddElementsText, setHandleAddElementsText] = useState("");
    //tiene traccia dei cambiamenti e delle selezioni da parte dell'utente.
    const [userASW, setUserASW] = useState({
        DettagliCommerciale: {
            ID: userContext.details._id,
            NomeCompleto: userContext.details.nome + " " + userContext.details.cognome
        },
        Dettagli: {
            Indicatori: data.SituazioneEconomica.Indicatori,
            Azienda: {
                Nome: data.Anagrafica.RagioneSociale,
                codiceCliente: data.Anagrafica.CodiceCliente,
                coidceClienteIOT: data.Anagrafica.CodiceClienteIOT,
            },
            Amministratore: {},
            SocietaCorrelate: [],
            Fatturato: {},
        }
    });


    //Array madre che permette la generazione dinamica degli elementi e delle sezioni.
    const main = [
        {
            key: 0, keyRegrupInObj: 'Azienda', questions: [
                {
                    key: 'Sede', title: "Dov'è la sede Operativa?", question: "Dov'è la Sede Operativa del cliente per cui stai richiedendo un fido o un extrafido?",
                    type_asw: 'textfield',
                },
                {
                    key: 'TipologieSedi', title: 'Tipologia di Sede', question: "Specifica l'età (numerico) del Amministratore dell'azienda per cui richiedi il fido",
                    type_asw: 'multi_addelements', multi_select: ["ufficio", "negozio", "magazzino", "logistiche"],
                    desclaimer: "Esempio: Ufficio || Via del Corso, 00186, Roma",
                },
                {
                    key: 'Sito', title: 'Sito', question: "Specifica il sito web principale del cliente, in modo tale che possa esserci una valutazione complete del cliente.",
                    type_asw: 'textfield',
                },

            ], navBar: true, navBar_title: 'Sede Operativa'
        },

        {
            key: 1, keyRegrupInObj: 'Amministratore', questions: [
                {
                    key: 'NomeAmministratore', title: 'Nome Amministratore', question: "Specifica il nome e cognome del Amministratore dell'azienda per cui richiedi il fido?",
                    type_asw: 'textfield',
                },
                {
                    key: 'Eta', title: 'Età', question: "Specifica l'età (numerico) del Amministratore dell'azienda per cui richiedi il fido",
                    type_asw: 'numberfield',
                },
                {
                    key: 'DataNomina', title: 'Data di Nomina', question: "Specifica la data di nomina del Amministratore dell'azienda per cui richiedi il fido",
                    type_asw: 'textfield',
                },
            ], navBar: true, navBar_title: 'Dettagli Amministratore'
        },

        {
            key: 2, keyRegrupInObj: 'SocietaCorrelate', questions: [
                {
                    key: 'SocietaCorrelate', title: 'Ci sono altre Società Collegate al cliente?',
                    question: "Specifica le altre società collegate al cliente in questione, se ce ne sono, specificando il nome dell'azienda.",
                    type_asw: 'addelements',
                    desclaimer: "Esempio: Pincopallino SPA",
                }
            ], navBar: true, navBar_title: 'Società Collegate'
        },

        {
            key: 3, keyRegrupInObj: 'Fatturato', questions: [
                {
                    key: 'FatturatoPrevisto', title: "Qual è il fatturato previsto con il cliente?",
                    inputLabel: 'Fatturato Previsto',
                    question: "Specifica una cifra prevista che riguardi il fatturato previsto con il cliente",
                    type_asw: 'eurofield', required: true
                }, //Fatturato Previsto
                {
                    key: 'NotaAggiuntiva', title: 'Descrizione Aggiuntiva',
                    question: "Definisci commenti sul fatturato, includendo previsioni future e la presenza di ordini da acquisire.",
                    type_asw: 'textfield_exposed'
                },
                {
                    key: 'FidoRichiesto', title: "Quant'è il Fido richiesto?",
                    inputLabel: 'Fido Richiesto',
                    question: "Specifica una cifra di fido prevista che vuoi richiedere.",
                    type_asw: 'eurofield_exposed', required: true
                }, //Fido Richiesto
                {
                    key: 'MetodoPagamento', title: 'Metodo di Pagamento',
                    question: "Specifica come il cliente intende affrontare i vari pagamenti.",
                    type_asw: 'multi_select', required: true, multi_select: paymentsMethodList
                },
            ], navBar: true, navBar_title: 'Importo Richiesto'
        },
    ];


    /**
     * funzione che definisce se la tab ha tutte le proprietà required all'interno dell'oggetto risposta utente.
     * @param {*} tabKey in input la chiave della sezione genitore.
     * @param {*} keyRegrupInObj in input la chiave con cui scrive le proprietà all'interno dell'oggetto userASW.
     * @returns 
     */
    const checkTabComplete = (tabKey, keyRegrupInObj) => {
        //ciclo for per indivudiare gli elementi se sono presenti all'interno dell'oggetto userASW
        //restituendo false se non sono all'interno se non incontra nessuna interuzzione nel ciclo restituisce true.
        for (let i = 0; i < main[tabKey].questions.length; i++) {
            const e = main[tabKey].questions[i];
            if (e.required) {
                if (e.type_asw.includes('_exposed')) {
                    if (!userASW.Dettagli[e.key]) { return false } else { continue };
                } else {
                    if (!userASW.Dettagli[keyRegrupInObj][e.key]) { return false } else { continue };
                }
            }
        }
        return true;
    }

    /**
     * funzione che individua se gli elementi required sono stati compilati correttamente.
     * @returns 
     */
    const checkAllQsCompleted = () => {
        //doppio ciclo per individuare alla fine se tutti gli elementi required sono stati inseriti
        //in modo tale da abilitare il button invia modulo di richista.
        //* i true e false seguono la logica del disabled */
        for (let i = 0; i < main.length; i++) {
            const e = main[i].questions;
            const keyRegrupInObj = main[i].keyRegrupInObj;

            for (let y = 0; y < e.length; y++) {
                const x = e[y];
                if (x.required) {
                    if (x.type_asw.includes('_exposed')) {
                        if (!userASW.Dettagli[x.key]) { return true } else { continue };
                    } else {
                        if (userASW.Dettagli[keyRegrupInObj]) {
                            if (!userASW.Dettagli[keyRegrupInObj][x.key]) { return true } else { continue };
                        } else {
                            return true;
                        };
                    }
                }
            }
        }
        return false;
    }


    /**
     * percepisce il cambiamento dei vari elementi textfield e compone l'oggetto 
     * da inviare al server.
     * @param e è l'evento in cui è presente il testo digitato dal'utente.
     * @param key la chiave della proprietà oggetto in questione.
     * @param keyMother la chiave dell'oggetto principale in Obj.
     */
    const handleUserChange = (e, key, keyMother, type) => {
        setUserASW(prev => {
            const convertValue = e.target.name === 'numberformat' ?
                parseFloat(e.target.value) : e.target.value;
            if (type?.includes('_exposed')) {
                if (e.target.value === '') {
                    // Copia dell'oggetto utente senza la proprietà da eliminare
                    const { [key]: deletedProp, ...newMother } = prev.Dettagli;
                    const newObject = { ...prev, Dettagli: newMother };
                    return newObject;
                } else {
                    // Aggiornamento dell'oggetto utente con la nuova proprietà
                    const newObject = { ...prev, Dettagli: { ...prev.Dettagli, [key]: convertValue } };
                    return newObject;
                }
            } else {
                if (e.target.value === '') {
                    // Copia dell'oggetto utente senza la proprietà da eliminare
                    const { [key]: deletedProp, ...newMother } = prev.Dettagli[keyMother];
                    const newObject = { ...prev, Dettagli: { ...prev.Dettagli, [keyMother]: newMother } };
                    return newObject;
                } else {
                    // Aggiornamento dell'oggetto utente con la nuova proprietà
                    const newObject = {
                        ...prev, Dettagli: {
                            ...prev.Dettagli,
                            [keyMother]: { ...prev.Dettagli[keyMother], [key]: convertValue }
                        }
                    };

                    return newObject;
                }
            }
        });
    };


    const SendFidoRequest = useCallback(() => {
        const body_ = {
            desc: `<p>E' stata fatta una richiesta fido da parte del commerciale <em>${userContext.details.nome + " " + userContext.details.cognome
                }</em> per il cliente: 
            <strong>${userASW.Dettagli.Azienda.Nome}</strong>`,
            modality: "Ruolo",
            timerMode: false,
            type: "Info",
            user_from: userContext.details.username,
            user_from_details: { nome: 'Sistema', fullName: 'Sistema', system: true },
            user_target: ['abuccina@focelda.it', 'aferretti@focelda.it'],
            targetRole: 'Amministrativo',
            usersTargetStatus: "Tutti",
        }

        Notifications({ socketRefSend: socketNTIF, _id: userContext.details._id, body: body_, userToken: userContext.token });

        SendFidoRequestAPI(userContext, abortController, userASW, handleClose);
    }, [userASW])


    /**
     * filtra il numberfiled in modo tale da avere sempre e solo numeri positivi.
     * @param e è l'evento in cui è presente il testo digitato dal'utente.
     * @param key la chiave della proprietà oggetto in questione.
     * @param keyMother la chiave dell'oggetto principale in Obj.
     */
    const filterNumberPositive = (e, key, keyMother) => {
        const newValue = e.target.value;
        if (newValue === '' || (Number(newValue) >= 0 && !isNaN(newValue))) {
            handleUserChange(e, key, keyMother);
        }
    }


    /**
     * Stato che manitene gli eventuali stati degli elementi multiselect
     */
    const [multiSelectData, setMultiSelectData] = useState([]);
    const handleAddSelectData = (propriety, value) => {
        setMultiSelectData(prev => {
            return { ...prev, [propriety]: value };
        })
    };

    /**
     * Automatic Insert Element gestisce le azioni sul componente Logico 
     * di inserimento elementi.
     * @param key la chiave della proprietà oggetto in questione.
     * @param keyMother la chiave dell'oggetto principale in Obj.
     * @param tp in input la tipologia del'azione se aggiungere 
     * l'elemento o cancellarlo
     * @param from in input da dove proviene il dato, da un select?, da un fieldbox ?.
     * @param text_element_target in input il testo (elemento nel .map) che ha
     * lo scopo di trovare l'index per poterlo cancellare dall'array.
     */

    const AUIE_Actions = (key, keyMother, tp, from, text_element_target) => {
        switch (tp) {
            case 'add':
                if (handleAddElementsText == '') { return; }
                switch (from) {
                    case 'multi_addelements':
                        if (multiSelectData[key] == '' || multiSelectData[key] == undefined) { return; }
                        setUserASW(prev => {
                            // Aggiornamento dell'oggetto utente con la nuova proprietà
                            const newObject = {
                                ...prev, Dettagli: {
                                    ...prev.Dettagli,
                                    [keyMother]: {
                                        ...prev.Dettagli[keyMother],
                                        [key]: [...(prev.Dettagli[keyMother][key] || []), { Tipo: multiSelectData[key], Indirizzo: handleAddElementsText }]
                                    }
                                }
                            };
                            return newObject;
                        });
                        setHandleAddElementsText("");
                        setMultiSelectData(prev => {
                            const { [key]: deletedProp, ...newMother } = prev;
                            const newObject = { ...newMother };
                            return newObject;
                        })
                        break;
                    case 'addelements':
                        setUserASW(prev => {
                            // Aggiornamento dell'oggetto utente con la nuova proprietà
                            const newObject = {
                                ...prev, Dettagli: {
                                    ...prev.Dettagli,
                                    [key]: [...(prev.Dettagli[keyMother][key] || []), handleAddElementsText]
                                }
                            };
                            return newObject;
                        });
                        setHandleAddElementsText("");
                        break;
                }
                break;
            case 'remove':
                setUserASW(prev => {
                    // fai una copia dell'array della proprietà in questione
                    // Elabora e trova l'index del elemento in questione per
                    // poi eliminarlo dall'array
                    const copyOfArr = [...prev.Dettagli[key]];
                    const indexTarget = copyOfArr.findIndex(e => e === text_element_target);
                    copyOfArr.splice(indexTarget, 1);

                    // Aggiornamento dell'oggetto utente con il nuovo array
                    const newObject = { ...prev, Dettagli: { ...prev.Dettagli, [key]: copyOfArr } };
                    return newObject;
                });
                break;
        }
    }

    /**
     * Funzione di callback che genera gli elementi di input utente
     * @param type in input la tipologia del'elemento che deve essere generato.
     * @param key in input la chiave che genera la proprietà oggetto da inviare
     * successivamente al server.
     * @param keyMother in input la chiave del oggetto madre da cui si sta
     * facendo riferimento per renderizzare i componenti figlio in questions.
     * @param dataChoose in input l'elemento in riferimento all'oggetto
     * all'interno di main in fase di elaborazione.
     * @param dataElm fa riferimento al dato (domanda) per intero, accedendo ai dati corrispettivi in main
     */
    const dynamicType = (type, key, keyMother, dataChoose, dataElm) => {
        let component = null;
        switch (type) {
            case 'textfield':
                component = <TextField key={key + type} value={userASW.Dettagli[keyMother][key]}
                    onChange={(e) => handleUserChange(e, key, keyMother, type)}
                    fullWidth label="Risposta" id="fullWidth" />
                break;
            case 'textfield_exposed':
                component = <TextField key={key + type} value={userASW.Dettagli[key] || ""}
                    onChange={(e) => handleUserChange(e, key, keyMother, type)}
                    fullWidth label="Risposta" id="fullWidth" />
                break;
            case 'numberfield':
                component = <TextField key={key + type} value={userASW.Dettagli[keyMother][key] || ""}
                    onChange={(e) => filterNumberPositive(e, key, keyMother)}
                    fullWidth label="Risposta Numerica" id="fullWidth"
                    type='number'
                />
                break;
            case 'eurofield_exposed':
            case "eurofield":
                const checkType = type?.includes('_exposed');

                component = <TextField
                    key={key + type}
                    label={dataElm.inputLabel}
                    value={(!checkType ? userASW.Dettagli[keyMother][key] : userASW.Dettagli[key]) || ""}
                    onChange={(e) => handleUserChange(e, key, keyMother, type)}
                    name="numberformat"
                    id="formatted-numberformat-input"
                    InputProps={{
                        inputComponent: NumericFormatCustom,
                    }}
                    variant="standard"
                />
                break;
            case 'addelements':
                component = <Stack key={key + type}>
                    <Stack direction='row' alignItems='center' mb={2}>
                        <TextField value={handleAddElementsText}
                            onChange={(e) => setHandleAddElementsText(e.target.value)}
                            fullWidth label="Aggiungi Elementi" id="fullWidth"
                        />
                        <IconButton aria-label="add" size="large" onClick={(() => AUIE_Actions(key, keyMother, 'add', 'addelements'))}>
                            {icon_add()}
                        </IconButton>
                    </Stack>
                    <Stack sx={{ maxHeight: 250, overflow: 'auto' }}>
                        {(userASW.Dettagli[key] || []).map((e, y) => (
                            <Stack direction='row' alignItems='center' mb={1} p={1} sx={{ backgroundColor: "#f8f8f8", borderRadius: "5px" }}>
                                <MDTypography key={y} component="p" width={'100%'}
                                    sx={{ fontWeight: "300", fontSize: "1rem" }}
                                >{e}</MDTypography>
                                <IconButton aria-label="delete" size="small" sx={{ color: '#d63838' }} onClick={(() => AUIE_Actions(key, keyMother, 'remove', e))}>
                                    <CloseRoundedIcon />
                                </IconButton>
                            </Stack>
                        ))}
                    </Stack>
                </Stack>
                break;
            case "multi_addelements":
                let indexMultiSelect = dataChoose.multi_select.findIndex(el => el == multiSelectData[key]);
                component = <Stack key={key + type}>
                    <Stack direction='row' alignItems='center' mb={2}>
                        <FormControl fullWidth sx={{ height: '100%', padding: 0.5, minWidth: 120 }}>
                            <InputLabel id="multi_select">Tipo</InputLabel>
                            <Select
                                labelId="multi_select"
                                value={indexMultiSelect !== -1 ? indexMultiSelect : ""}
                                label="Age"
                                sx={{ height: '100%' }}
                                onChange={e => handleAddSelectData(key, dataChoose.multi_select[e.target.value])}
                            >
                                {dataChoose?.multi_select.map((e, index) => (
                                    <MenuItem key={index} value={index}>{e}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField value={handleAddElementsText}
                            onChange={(e) => setHandleAddElementsText(e.target.value)}
                            fullWidth label="Aggiungi Elementi" id="fullWidth"
                        />
                        <IconButton aria-label="add" size="large" onClick={(() => AUIE_Actions(key, keyMother, 'add', 'multi_addelements'))}>
                            {icon_add()}
                        </IconButton>
                    </Stack>
                    <Stack sx={{ maxHeight: 250, overflow: 'auto' }}>
                        {(userASW.Dettagli[keyMother][key] || []).map((e, y) => (
                            <Stack key={y} direction='row' alignItems='center' mb={1} p={1} sx={{ backgroundColor: "#f8f8f8", borderRadius: "5px" }}>
                                <MDTypography component="p" width={'100%'}
                                    sx={{ fontWeight: "300", fontSize: "1rem" }}
                                >{e.Tipo}</MDTypography>
                                <MDTypography component="p" width={'100%'}
                                    sx={{ fontWeight: "300", fontSize: "1rem" }}
                                >{e.Indirizzo}</MDTypography>
                                <IconButton aria-label="delete" size="small" sx={{ color: '#d63838' }} onClick={(() => AUIE_Actions(key, keyMother, 'remove', e))}>
                                    <CloseRoundedIcon />
                                </IconButton>
                            </Stack>
                        ))}
                    </Stack>
                </Stack>
                break;
            case "multi_select":
                let indexMultiSelects = dataChoose.multi_select.findIndex(el => el == userASW.Dettagli[keyMother][key]);
                component = <Stack key={key + type} direction='row' alignItems='center' mb={2}>
                    <FormControl fullWidth sx={{ height: '100%', minHeight: 50, padding: 0.5, minWidth: 120 }}>
                        <InputLabel id="multi_select">Tipo</InputLabel>
                        <Select
                            labelId="multi_select"
                            value={indexMultiSelects !== -1 ? indexMultiSelects : ""}
                            label="Age"
                            sx={{ height: '100%' }}
                            onChange={e => handleUserChange({ target: { name: "string", value: dataChoose.multi_select[e.target.value] } }, key, keyMother, type)}
                        >
                            {dataChoose?.multi_select.map((e, index) => (
                                <MenuItem key={index} value={index}>{e}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Stack>
                break;
        }
        return component;
    };

    /**
     * Generazione del footer Go Back e Go next
     */
    const NextPrevBTN = () => (
        <Stack direction='row' width='100%' height='100%' pb={3} alignItems='flex-end' flexBasis='10%' sx={{ boxShadow: '0rem -1rem 3rem 0rem rgb(0 0 0 / 10%)', borderTop: '1px solid #ccc' }} p={'10px 2em 10px'}>
            <Button size="large" variant="outlined"
                onClick={() => activeKey > 0 &&
                    setActiveKey(prev => prev - 1)}
                sx={{
                    color: `${darkMode ? palette.white.main : palette.black.main}`, borderColor: '#ccc',
                    maxHeight: 40, '&:hover': { borderColor: '#2a76bd', }
                }}
            >
                go Back
            </Button>
            <Button size="large"
                disabled={activeKey == (main.length - 1) ? checkAllQsCompleted() : false}
                variant='contained'
                color='secondary'
                onClick={() => activeKey < (main.length - 1) ?
                    setActiveKey(prev => prev + 1)
                    : SendFidoRequest()}
                sx={{
                    color: '#fff',
                    marginLeft: 'auto',
                }}
                style={activeKey == (main.length - 1) ? { alignSelf: 'flex-end' } : {}}
            >
                {activeKey == (main.length - 1) ? 'invia modulo' : 'go Next'}
            </Button>
        </Stack>
    );

    /**
     * Generazione del body che compone la sezione selezionata
     * @param dataElm in input l'elemento domanda attualmente in generazione.
     * @param index è l'index dell'elemento attualmente in elaborazione.
     */
    const section = useCallback((dataElm, index) => {
        const dataChoose = dataElm ? dataElm : main[activeKey];
        return <Grid key={index} container item xs={8} md={8} lg={8} justifyContent='center' gap={2} sx={{ flex: '100% !important' }}>
            <Stack p={'0 10%'} gap={5} width='100%'>
                <Stack>
                    <MDTypography component="h3"
                        sx={{ fontWeight: "bold", fontSize: "1.5em", lineHeight: "40px", marginBottom: 2 }}
                    >{`${dataChoose.required ? '* ' : ''}` + dataChoose.title}</MDTypography>
                    <MDTypography component="p"
                        style={{ fontWeight: "400", color: '#737373', fontSize: "0.865rem" }}
                    >{dataChoose.question}</MDTypography>

                </Stack>

                <Stack height={'100%'} gap={0.5}>
                    {dataChoose?.desclaimer && <MDTypography component="p"
                        style={{ fontWeight: "500", color: '#e7b974', fontSize: "0.80rem", textTransform: 'uppercase' }}
                    ><InfoOutlinedIcon sx={{ marginRight: 1 }} />{dataChoose.desclaimer}</MDTypography>}

                    {dynamicType(dataChoose.type_asw, dataChoose.key, main[activeKey].keyRegrupInObj, dataChoose, dataElm)}
                </Stack>
                <Divider />
            </Stack>
        </Grid>
    }, [main]);

    /**
     * Genera il corpo dove vengono swtichate le varie sezioni insieme al
     * footer dei buttons.
     */
    const GenBody = () => (
        main[activeKey].questions ?
            <Stack width={'100%'} height={'100%'}>
                <Stack overflow='auto' width={'100%'} height={'100%'} p={'2em 30px 0 30px'} alignItems='center'>

                    {main[activeKey].questions.map((dataElm, index) => (
                        section(dataElm, index)
                    ))}
                </Stack>
                {NextPrevBTN()}
            </Stack>
            :
            <Stack overflow='auto' width={'100%'} height={'100%'} alignItems='center' p={'2em 30px 0 30px'}>
                {section()}
                {NextPrevBTN()}
            </Stack>
    );


    /**
     * MEMO che genera la Barra di navigazione laterale che permette lo switch
     * delle sezioni.
     */
    const GenNavBar = () => (
        <Grid container item overflow='auto' xs={4} md={4} lg={4} justifyContent='center'
            sx={{ backgroundColor: `${darkMode ? palette.dark.main : '#f9f9f9'}`, borderRadius: 5, zIndex: 1 }} gap={2}>
            <Stack width={'100%'} p={2}>
                <Stack gap={1}>
                    <FoceldaLogo color='#fff' type='avatar' background='#635bff' />
                    <MDTypography component="p"
                        style={{ textAlign: 'left', marginTop: "0.3em", padding: '0 10px', alignSelf: 'center', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}
                    >Modulo Richiesta Fido</MDTypography>
                </Stack>
                <Divider />
                <Stack gap={2}>
                    {main.filter(e => e.navBar !== false).map((data, index) => (
                        <Stack key={index} height={'100%'}>
                            <Stack key={index} direction='row' alignItems='center' gap={1}>
                                <Button size="large"
                                    key={index}
                                    onClick={() => changeKey(data.key)}
                                    sx={checkTabComplete(data.key, data.keyRegrupInObj) ?
                                        {
                                            border: '1px solid #b6d69d', backgroundColor: '#7cff0d14', color: '#7eb056',
                                            '&:hover': { color: '#669e29', backgroundColor: '#396f0b5c', }
                                        } :
                                        {
                                            border: `1px solid ${darkMode ? palette.grey[700] : palette.grey[400]}`, color: `${darkMode ? palette.grey[700] : palette.grey[400]}`,
                                            '&:hover': { color: `${darkMode ? '#d8d7de' : '#504c63'}`, backgroundColor: `${darkMode ? '#33333380' : ''}` }
                                        }
                                    }
                                    style={activeKey == index ?
                                        { marginTop: "0.3em", justifyContent: 'center', width: '100%', backgroundColor: '#ffc50029', color: '#d9b478' }
                                        : { marginTop: "0.3em", justifyContent: 'center', width: '100%' }}
                                >
                                    {userASW.Dettagli[data.key] !== undefined ?
                                        <Fade in={true}>
                                            {<CheckBoxOutlinedIcon sx={{ color: '#18872d', marginRight: 'auto' }} />}
                                        </Fade>
                                        : null}
                                    {data.navBar_title}</Button>
                            </Stack>
                            {(main.filter(e => e.navBar !== false).length - 1) != index &&
                                <Divider orientation='vertical' sx={{ margin: 0, maxHeight: 20, width: 3, backgroundColor: '#9d9d9d', alignSelf: 'center' }} />}
                        </Stack>
                    ))}
                </Stack>
                <Divider />
                <Stack p={2} direction='row' sx={{
                    background: `${darkMode ? palette.grey[900] : '#f5fdff'}`,
                    border: `1px solid ${darkMode ? palette.black.main : '#d2f6ff'}`, borderRadius: 2, marginTop: 'auto'
                }}>
                    {icon_info()}
                    <MDTypography component="p" style={{
                        width: '100%', textAlign: 'left',
                        padding: '0 10px',
                        alignSelf: 'flex-end', fontSize: '0.7rem',
                        fontWeight: 600, textTransform: 'uppercase'
                    }}>Prima di procedere con la richiesta di fido,
                        verifica la congruenza dei prezzi cliente.</MDTypography>
                </Stack>
                {(data && "statoUltimoFido" in data && data.statoUltimoFido == 3) &&
                    <Stack p={2} direction='row' sx={{
                        background: `${darkMode ? '#2e2515' : '#ffe8ca'}`,
                        border: `1px solid ${darkMode ? palette.warning.main : palette.warning.main}`, borderRadius: 2, mt: 1
                    }}>
                        {icon_info()}
                        <MDTypography component="p" style={{
                            width: '100%', textAlign: 'left',
                            padding: '0 10px',
                            alignSelf: 'flex-end', fontSize: '0.7rem',
                            fontWeight: 600, textTransform: 'uppercase'
                        }}>Questo fido è già stato Rifiutato una o piu volte.
                            {data.dataUltimaModifica && `In data: ${new Date(data.dataUltimaModifica).toLocaleString('it')}`}</MDTypography>
                    </Stack>}
            </Stack>
        </Grid>
    );

    return (
        <Backdrop
            sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={isOpen} onClick={(e) => { if (e.target !== e.currentTarget) return; if (closeDisabled) return; handleClose(); }}
        >
            {isOpen && (
                <Card elevation={0} sx={{ padding: 2, borderRadius: 7, height: '80%', width: '80%', maxWidth: 1400 }} data-tour="fido-request-panel">
                    <Stack direction='row' height={'100%'} sx={{ position: 'relative' }}>
                        <Stack direction='row' sx={{
                            pointerEvents: contentDisabled ? 'none' : 'auto',
                            opacity: contentDisabled ? 0.6 : 1,
                            width: '100%', height: '100%'
                        }}>
                            {GenNavBar()}
                            {GenBody()}
                        </Stack>
                        <IconButton data-tour="fido-request-panel-close" aria-label="add" size="medium" sx={{ position: 'absolute', zIndex: 1, color: '#c74a4a' }} disabled={closeDisabled} onClick={() => handleClose()} >
                            <CloseRoundedIcon />
                        </IconButton>
                    </Stack>
                </Card>)}
        </Backdrop>
    )
}

export { RequestFido };