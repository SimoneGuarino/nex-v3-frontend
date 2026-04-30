import React from 'react';
import { Stack } from '@mui/material';
import VirtuosoGridVI from './VirtuosoGridVI';
import { ActionsBar } from './actionsBar';
import { ParamBar } from './paramBar';

import { CookiesStoredSettings, CookiesSaveSettings } from '../../../classes/cookie';
import { CalcPercent } from 'utils';
import { DwdBOIMP } from './extraPanel/dwdBOIMP';
import { Filters } from '../filters';
import { SendFilters } from './fetchData/sendFilters';
import MinLoader from 'minLoader';
import { ExtraBar } from './extraBar/index.tsx';
import { WarehousesPanel } from './extraPanel/warehousesPanel';

import noDataWEBP from 'assets/images/noCategoryAssignedBg.webp';
import missingDataWEBP from 'assets/images/9170826-no-data-pdf-documenti.webp';
import { NoData } from 'components/NoData';
import { FiltersToSend } from '../filtersToSend';
import { DetailsDist } from './extraPanel/detailsDist';
import { PickLowest } from 'utils';
import { ContributionP } from './extraPanel/contributionP';
import { CheckAdminPermissions } from 'utils/checkAdminPermissions';
import { enqueueSnackbar } from 'components/MessageBox';



const cookieNameColumns = "contribuzione_settings";
//Crea o Accedi al Cookie prestabilito
function setCookie(AssignAllDist) {
    if (!CookiesStoredSettings(cookieNameColumns)) {
        CookiesSaveSettings(cookieNameColumns, AssignAllDist());
        return AssignAllDist();
    } else {
        return CookiesStoredSettings(cookieNameColumns)
    }
};

let warehouses_list = []; //variabile dei magazzini.
//Filtra i magazzini in modo tale da avere un array di mag. univoci
//tenendo conto che il magazino per essere inserito deve avere almeno 1 disponibilità
const UniqueWarehouses = (data) => {
    const arr_ = [];
    for (let i = 0; i < data.length; i++) {
        const e = data[i].Disponibilita;
        const werehouses = e.Magazzini;
        if (werehouses) {
            for (let i = 0; i < werehouses.length; i++) {
                const werehouse_ = werehouses[i];
                const alreadyExist = arr_.findIndex(element => element.Codice === werehouse_.Codice);
                if (alreadyExist == -1 && werehouse_.Quantita > 0) {
                    arr_.push(werehouse_);
                }
            }
        }
    }
    return arr_;
}

/**
 * Calcola la disponibilità del prodotto in base ai magazzini selezionati.
 * @param {*} element Object | Singolo elemento data, contenete tutte le proprietà tra cui magazzini.
 * @param {*} warehouses_selected Array | Magazzini selezionati dall'utente come filtraggio.
 * @returns Somma delle disponibilità in base ai magazzini selezionati oppure le disponibilità totali.
 */
function CalcDisp(element, warehouses_selected) {
    if (element.Disponibilita) {
        if (warehouses_selected.length > 0 && element.Disponibilita.Magazzini) {
            const logic = element.Disponibilita.Magazzini.reduce((accumulator, magazzino) => {
                if (warehouses_selected.includes(magazzino.Nome)) {
                    return accumulator + magazzino.Quantita;
                };
                return accumulator;
            }, 0)
            return logic;
        }
    }

    return element.Disponibilita.Totali;
}

export function Contribuzione({ userContext, abortController, extraData, dataOrigin_, setDataOrigin_,
    FetchBOIMP, cookieNameColumns, onDownload, setOnDownload, ChangeBOIMPPanleVisibility,
    BOIMPPanelVisibility, contributionsPersonalList, contributionsList, setContributionsList,
    contributionsList_BaseData,
    contributionsCompanyList, setContributionsCompanyList }) {
    //Parametri
    const [brandSelected, setBrandSelected] = React.useState(null);
    const [brandPrefix, setBrandPrefix] = React.useState(null);
    const [categorySelected, setCategorySelected] = React.useState(null);
    const [buyerTarget, setBuyerTarget] = React.useState(userContext.details.role === 'Buyer' && Boolean(userContext.details?.CodiceBuyer) ? {
        name: userContext.details.nome + " " + userContext.details.cognome,
        value: userContext.details.codiceBuyer,
        _id: userContext.details._id
    } : null);
    const [subcategorySelected, setSubCategorySelected] = React.useState(null);
    const [typeSelected, setTypeSelected] = React.useState(null);

    const [data, setData] = React.useState(dataOrigin_);


    const sortFilterList = ['misto', 'positivo', 'negativo']
    const [sortFiltersIndex, setSortFilters] = React.useState(0);
    const ResetMarginFilters = () => setSortFilters(0); //resetta lo stato dei magazzini selezionati in un array vuoto.
    const [sortedData, setSortedData] = React.useState(data);
    //stato che definisce l'array finale con tutti i filtri ( sorted, ribasso ecc ) con l'unione del filtro
    //per i magazzini sugli elemnti già filtrati in modo tale da filtrare in maniera libera e tornare 
    //allo stato antecedente ma con base gli elemnti filtrati.
    const [dataFiltred__, setDataFiltred__] = React.useState(sortedData);

    //assegna alla variabile la lista dei magazzini trovati.
    warehouses_list = UniqueWarehouses(data);

    const [statusTagP, setStatusTagP] = React.useState(false);
    const ChangeStatusTagP = () => setStatusTagP(!statusTagP);
    const [warehouses_selected, setWarehouses_selected] = React.useState([]); //lista dei magazzini selezionati
    const ResetWarehousesSelected = () => setWarehouses_selected(() => []); //resetta lo stato dei magazzini selezionati in un array vuoto.
    const [warehousesFilterType, setWarehousesFilterType] = React.useState(0); // definisci che tipo filtro si sta applicando nel Pannello Magazzini
    const HandleFlipWarehouseType = (e) => { setWarehousesFilterType(e.target.value); FilterArrayByWarehouseFilter({ data: sortedData, type: e.target.value }) };

    const [loadState, setLoadState] = React.useState(false);
    const [filterOpen, setFilterOpen] = React.useState(false);
    const ChangeStatusFilters = () => setFilterOpen(!filterOpen);

    //se il Cookie non esiste ne crea uno con le attuali colonne disponibili.
    const distList__ = React.useRef([]);
    //Assegna i fornitori al useRef distList__ che mantiene la lista dei fornitori.
    const AssignAllDist = React.useCallback(() => {
        if (distList__.current.length == 0
            && (data.length > 0)) {
            distList__.current = Object.keys(data[0].Fornitori)
        };
        return distList__.current;
    }, [data]);


    const [visibleColumns, setVisibleColumns] = React.useState(setCookie(AssignAllDist) || AssignAllDist());

    //Assegna le colonne in base all primo oggetto di dati.
    //REMEMBER: di default ogni oggetto ha con se la proprietà Fornitori che ha a sua volta ogni Fornitore.
    React.useEffect(() => {AssignAllDist()}, [data]);
    //Escludi fornitori dalla lista delle colonne visibili.
    const toggleColumnVisibility = (columnLabel) => {
        const newVisibleColumns = visibleColumns.includes(columnLabel)
            ? visibleColumns.filter((key) => key !== columnLabel)
            : [...visibleColumns, columnLabel];

        // Ordina le colonne visibili nell'ordine predefinito
        newVisibleColumns.sort((a, b) => {
            const indexA = distList__.current.indexOf(a);
            const indexB = distList__.current.indexOf(b);
            return indexA - indexB;
        });

        setVisibleColumns(newVisibleColumns);

        // Salva nei Cookie
        CookiesSaveSettings(cookieNameColumns, newVisibleColumns);
    };

    //definsce la view se tabellare o a griglia. 
    // - false => Grind View (a blocchi).
    // - true => Table View (a colonna).
    const [grindView, setGrindView] = React.useState(true);
    const [selecteAllFilter, setSelectAllFilter] = React.useState(true);

    const [paramState, setParamState] = React.useState({
        minQuantity: 1,
        margin: 4,
        ribasso: 0.01,
        ribasso_type: true,
    });
    const ChangeRibassoType = () => {
        setParamState(prev => {
            return { ...prev, ribasso_type: !prev.ribasso_type };
        });
    };
    const [temp_param, setTemp_param] = React.useState({
        margin: paramState.margin,
        ribasso: paramState.ribasso,
        ribasso_type: paramState.ribasso_type,
        contribution: "",
    });
    const ChangeRibassoType__temp = () => {
        setTemp_param(prev => {
            return { ...prev, ribasso_type: !prev.ribasso_type };
        });
    };

    //stati per definire se i parametri sono attivi o meno
    const [ribassoVisibility, setRibassoVisibility] = React.useState(false);
    const ChangeRIBVisibility = () => setRibassoVisibility(!ribassoVisibility);

    const [marginVisibility, setMarginVisibility] = React.useState(false);
    const ChangeMARGVisibility = () => setMarginVisibility(!marginVisibility);

    //Pannello dettagli fornitori.
    const [productExpandedDist, setProductExpandedDist,] = React.useState(null);
    //Permette al pannello di capire se deve far vedere i fornitori o le contribuzioni se presenti.
    const [settingsProductExpanded, setSettingsProductExpanded] = React.useState({
        distributors: true
    })
    const HandleProductExpandedDist = (e, distributors) => {
        setProductExpandedDist(e); setSettingsProductExpanded({ distributors: distributors })
    };
    const [detailsDistPanelVisibility, setDetailsDistPanelVisibility] = React.useState(false);
    const ChangeDetailsDistPanelVisibility = () => setDetailsDistPanelVisibility(!detailsDistPanelVisibility);


    const [selectedFile, setSelectedFile] = React.useState([]);
    /**
     * Stato dedicato al filtraggio degli elementi in promo o non
     * 0 | tutti
     * 1 | solo elementi in Promo
     * 2 | solo elementi non in Promo
    */
    const [promoFilterIndex, setPromoFilterIndex] = React.useState(0);

    //Contribution State
    const [contribution_selected, setContribution_selected] = React.useState({}); //lista dei magazzini selezionati
    const prevContributionRef = React.useRef(null);
    const [contribution_company_selected, setContribution_company_selected] = React.useState([]); //lista dei magazzini selezionati

    const [statusContributionP, setStatusContributionP] = React.useState(false);
    const ChangeStatusContributionP = () => {
        const AdminDev = CheckAdminPermissions({
            userRole: userContext.details.ruolo,
            permissions: userContext.details.permissions, panelToCheck: 'contribuzione', where: 0
        });
        if (AdminDev && !buyerTarget) {
            enqueueSnackbar('Perfavore, seleziona prima un buyer in modo da accedere alle sue contribuzioni', {
                title: 'Ops..',
                type: 'warning',
            });
            return ChangeStatusFilters()
        }
        setStatusContributionP(!statusContributionP)
    };


    //Intercetta il cambiamento per filtrare la lista delle contribuzioni
    React.useEffect(() => {
        if (!buyerTarget) { return };
        if (contribution_selected !== null || Object.keys(contribution_selected).length > 0) {
            setContribution_selected({});
        }
        composeFiltersFunc();
        if (contributionsPersonalList.current && contributionsPersonalList.current.length > 0) {
            setContributionsList(_ => {
                const copy = [...contributionsPersonalList.current];
                const copy_ = copy.filter(e => e.codBuyer === buyerTarget.value);
                return copy_;
            })
        }
    }, [buyerTarget]);


    //filtra per almeno 1 dei Dist__ selezionati,
    React.useEffect(() => {
        if (!dataOrigin_ || dataOrigin_.length == 0) { return }

        setData(_ => {
            const copy = [...dataOrigin_];
            const filtred = visibleColumns.length > 0 ? copy.filter(e => {
                for (const key in e.Fornitori) {
                    const dist = e.Fornitori[key];
                    if (visibleColumns.includes(key)) {
                        if ((dist.Prezzo > 0 || dist.PrezzoListino > 0) && dist.Disponibili > 0) {
                            return true; // Se trovi almeno un fornitore con Prezzo e PrezzoListino diversi da zero, restituisci true
                        }
                    }
                }
                return false; // Se nessun fornitore soddisfa le condizioni, restituisci false
            }) : copy;

            return filtred;
        });
    }, [dataOrigin_, visibleColumns]);


    //Aggiungi l'elemeneto cliccato al array dei file selezionati
    const addFileToSelected = (index) => {
        setSelectedFile(prev => {
            if (!prev.includes(index)) {
                return [...prev, index];
            } else {
                return prev.filter(e => e !== index);
            }
        });
    };
    //Aggiungi in singolo elemento cliccato pulendo l'array in modo tale da avere solo quel elemento.
    const SingleSelectionFile = (index) => {
        setSelectedFile(prev => (prev.length === 1 && prev[0] === index) ? prev : [index]);
    };

    //funzione di svuotamento dell'array.
    const MakeEmptySelection = () => {
        setSelectedFile(() => []);
        setTemp_param(prev => {
            return { ...prev, margin: paramState.margin, ribasso: paramState.ribasso, ribasso_type: paramState.ribasso_type }
        });
    };

    const handleClick = React.useCallback((e, index) => {
        // Verifica se il tasto Ctrl è stato premuto durante il click
        if (e.ctrlKey) {
            // Esegui le operazioni desiderate per il click con Ctrl
            addFileToSelected(index)
        } else {
            // Esegui le operazioni desiderate per il click normale
            SingleSelectionFile(index)
        }
    }, []);

    const Temp_HandleChange = (e, key) => {
        const filterValue = e.target.value;
        const isValidInput = /^-?\d*\.?\d*$/.test(filterValue) || filterValue === 0;

        setTemp_param(prev => {
            return { ...prev, [key]: isValidInput ? filterValue : prev[key] }
        });
    };

    /**
     * Funzione di salvataggio dei parametri inseriti all'interno degli elementi attualmente
     * selezionati, in modo da assegnarli i parametri personalizzati.
     */
    const SetParamOnBlock = () => {
        //funzione di setData che inserisce i parametri nel oggetto selezionato.
        function setParam(i) {
            const advisedFunc = AdvisedPrice(sortedData[i], (sortedData[i].margin || paramState.margin), (sortedData[i].ribasso || paramState.ribasso),
                sortedData[i].Fornitori, sortedData[i].CostoMedioGestionale);
            if (temp_param.contribution !== "" && advisedFunc.result && sortedData[i].contributed === undefined) {
                return enqueueSnackbar('Perfavore, seleziona solo prodotti con margine negativo per poter applicare la contribuzione.', {
                    title: 'Ops..',
                    type: 'warning',
                });
            };
            //modifica per l'array di visualizzazione
            setSortedData(prev => {
                const copy = [...prev];
                if (marginVisibility) {
                    copy[i].margin = temp_param.margin;
                }
                if (ribassoVisibility) {
                    copy[i].ribasso = temp_param.ribasso;
                    copy[i].ribasso_type = temp_param.ribasso_type;
                }
                if (temp_param.contribution !== "" && (contributionsList || []).length > 0) {
                    const contrSelected = contributionsList[temp_param.contribution];
                    const price = copy[i].advisedPrice ? copy[i].advisedPrice : advisedFunc.price
                    copy[i].contributed = {
                        machine: false,
                        name: contrSelected?.codRaggruppamento,
                        codBuyer: contribution_selected?.codBuyer,
                        costoMedioGestionale: (copy[i].CostoMedioGestionale - (copy[i].CostoMedioGestionale - (price - ((price * (copy[i].margin || paramState.margin)) / 100)))),
                        euro: (copy[i].CostoMedioGestionale - (price - ((price * (copy[i].margin || paramState.margin)) / 100)))
                    };
                    ReduceEuroContributions(copy, setContribution_selected);

                }
                return copy
            });

            setDataFiltred__(prev => {
                const copy = [...prev];
                if (marginVisibility) {
                    copy[i].margin = temp_param.margin;
                };
                if (ribassoVisibility) {
                    copy[i].ribasso = temp_param.ribasso;
                    copy[i].ribasso_type = temp_param.ribasso_type;
                };
                if (temp_param.contribution !== "" && (contributionsList || []).length > 0) {
                    const contrSelected = contributionsList[temp_param.contribution];
                    const price = copy[i].advisedPrice ? copy[i].advisedPrice : advisedFunc.price
                    copy[i].contributed = {
                        machine: false,
                        name: contrSelected?.codRaggruppamento,
                        codBuyer: contribution_selected?.codBuyer,
                        costoMedioGestionale: (copy[i].CostoMedioGestionale - (copy[i].CostoMedioGestionale - (price - ((price * (copy[i].margin || paramState.margin)) / 100)))),
                        euro: (copy[i].CostoMedioGestionale - (price - ((price * (copy[i].margin || paramState.margin)) / 100)))
                    }
                };
                return copy
            });

            //modifica la fonte dati.
            return setData(prev => {
                const copy = [...prev];
                const y = copy.findIndex(x => x.CodiceProduttore === sortedData[i].CodiceProduttore)
                if (marginVisibility) {
                    copy[y].margin = temp_param.margin;
                };
                if (ribassoVisibility) {
                    copy[y].ribasso = temp_param.ribasso;
                    copy[y].ribasso_type = temp_param.ribasso_type;
                };
                if (temp_param.contribution !== "" && (contributionsList || []).length > 0) {
                    const advisedFunc__ = AdvisedPrice(copy[y], (copy[y].margin || paramState.margin), (copy[y].ribasso || paramState.ribasso),
                        copy[y].Fornitori, copy[y].CostoMedioGestionale);
                    const contrSelected = contributionsList[temp_param.contribution];
                    const price = copy[y].advisedPrice ? copy[y].advisedPrice : advisedFunc.price
                    copy[y].contributed = {
                        machine: false,
                        name: contrSelected?.codRaggruppamento,
                        codBuyer: contribution_selected?.codBuyer,
                        costoMedioGestionale: (copy[y].CostoMedioGestionale - (copy[y].CostoMedioGestionale - (price - ((price * (copy[y].margin || paramState.margin)) / 100)))),
                        euro: (copy[y].CostoMedioGestionale - (price - ((price * (copy[y].margin || paramState.margin)) / 100)))
                    }
                };

                return copy
            });
        };

        for (let i = 0; i < selectedFile.length; i++) {
            const e = selectedFile[i]; //e rappresenta l'index
            setParam(e);
        };
    };

    /**
     * Contribuisce gli elementi negativi in base a se è selezionata una contribuzione o meno.
     * @param {*} dataProp array | base data per poter elaborare chi ha la contribuzione e chi no
     * @param {*} contributionChanged boolean | definsce se la funzione è richiamata per un cambio di contribuzione selezionata o meno.
     * @param {*} settings object | Definisce le impostazioni della funzione in modo da agire di conseguenza. -- | -- {
     * saveOnSetData: definisce se salvare nello stato generale dei dati, sovrascrivendo i dati presenti
     * overwriteSave: definisce se sovrascrivere la proprietà contribution se viene trovata nel elemento.
     * usePrice: definisce se deve far riferimento al prezzo consigliato già presente nel oggetto o calcolarne uno nuovo dal sistema centrale. }.
     * overwriteContributed: Definisce se sovrascrivere solo gli elementi che hanno gia una contribuzione (inserita dal sistema).
     * @returns array di dati contribuiti o rowData in base ai parametri e condizioni
     */
    const Contribuzione = (dataProp, contributionChanged, contributionNewSelected, settings) => {
        //Evita il loop di re-call della funzione, controllando lo stato precedente dello stateHook per vedere
        //se effettivamente la contribuzione è cambiata.
        const dataProp_ = dataProp ? dataProp : data;
        const contribution_selected__ = contributionNewSelected ? contributionNewSelected : contribution_selected
        if (!settings) {
            const prevContribution = prevContributionRef.current;

            if ((prevContribution && Object.keys(prevContribution).length > 0
                && prevContribution.idBudget === contribution_selected__.idBudget)
                || Object.keys(contribution_selected__).length === 0) { return dataProp };

            prevContributionRef.current = contribution_selected__;
        }

        //disattiva / attiva in base allo status definendo la proprietà checked in base inoltre
        //alla situazione, in modo tale da selezionare e deselezionare tutti gli elementi.
        if (contributionChanged) {
            let euroOperations = {
                totalEuro: 0,
                pureBaseEuro: 0,
            };
            const statusContribution = Object.keys(contribution_selected__).length > 0; //Se true è attiva se false no.
            const arrayElaborated = [];
            for (let i = 0; i < dataProp_.length; i++) {
                const e = dataProp_[i];
                //se non c'è nessuna contribuzione selezionata allora eliminala dagli elementi se presente.
                if (statusContribution) {
                    const advisedFunc = AdvisedPrice(e, parseFloat(e.margin || paramState.margin), (e.ribasso || paramState.ribasso),
                        e.Fornitori, e.CostoMedioGestionale);
                    const ePrice = settings?.usePrice ? 
                        e?.advisedPrice ? e?.advisedPrice : advisedFunc.price
                    : advisedFunc.price;

                    const negativeCheck = !advisedFunc.result;

                    if (((negativeCheck || (settings && settings.overwriteSave)) &&
                        (((e?.contributed?.name !== contribution_selected__?.codRaggruppamento &&
                            e?.contributed?.machine) || !e.contributed) || settings?.overwriteSave)) ||
                        ((settings && settings.overwriteContributed) && e.contributed && e.contributed.machine)
                    ) {
                        const obj = {
                            contributed: {
                                machine: true, //definisce se è stato settato dalla macchina o dal utente
                                codBuyer: e?.contributed?.codBuyer ? e?.contributed?.codBuyer : contribution_selected__?.codBuyer,
                                name: e?.contributed?.name ? e?.contributed?.name : contribution_selected__?.codRaggruppamento, //nome della contribuzione
                                costoMedioGestionale: (e.CostoMedioGestionale - (e.CostoMedioGestionale - (ePrice - ((ePrice * (e.margin || paramState.margin)) / 100)))),
                                euro: (e.CostoMedioGestionale - (ePrice - ((ePrice * (e.margin || paramState.margin)) / 100)))
                            }
                        };

                        euroOperations.totalEuro += (obj.contributed.euro * e.Disponibilita.Totali);

                        arrayElaborated.push({ ...e, ...obj });

                    } else {
                        arrayElaborated.push(e);
                    }
                } else {
                    //se è presente la contribuzione allora eliminala 
                    if (e?.contributed !== undefined) {
                        delete e.contributed;
                    };

                    arrayElaborated.push(e);
                };
            };

            //modifica la fonte dati. in modo da salvare gli elemnti che sono stati contribuiti
            if ((settings && settings?.saveOnSetData) || settings?.saveOnSetData === undefined) {
                setData(arrayElaborated);
            };
            ReduceEuroContributions(arrayElaborated, setContribution_selected, contribution_selected__);
            return arrayElaborated;
        } else {
            return dataProp_;
        }
    };

    //Elimina la contribuzione dagli elementi selezionati
    const DelContributionOnBlock = () => {
        function setParam(i) {
            const product = sortedData[i];
            //modifica per l'array di visualizzazione
            setSortedData(prev => {
                const copy = [...prev];
                const newItem = { ...copy[i] };
                delete newItem.contributed;
                copy[i] = newItem;
                return copy;
            });

            setDataFiltred__(prev => {
                const copy = [...prev];
                const newItem = { ...copy[i] };
                delete newItem.contributed;
                copy[i] = newItem;
                return copy;
            });

            //modifica la fonte dati.
            setData(prev => {
                const copy = [...prev];
                const y = copy.findIndex(x => x.CodiceProduttore === product.CodiceProduttore);
                const newItem = { ...copy[y] };
                delete newItem.contributed;
                copy[y] = newItem;
                return copy
            });
        }

        for (let i = 0; i < selectedFile.length; i++) {
            const e = selectedFile[i]; //e rappresenta l'index
            if (sortedData[e]?.contributed !== undefined) {
                setParam(e);
            };
        };

        //se l'utente si trova nel filtro margine positivo resetta la selezione.
        if (sortFiltersIndex === 1) {
            MakeEmptySelection();
        }
    };

    const ReduceEuroContributions = (data, setContribution, contr_sel) => {
        const contribution_selected_ = contr_sel ? contr_sel : contribution_selected
        if (contribution_selected_ && Object.keys(contribution_selected_).length > 0) {
            setContribution((prev) => {
                const val = data.reduce((accumulator, current) => {
                    if (current?.contributed) {
                        const euro = parseFloat(current.contributed.euro);
                        const dispTotali = parseFloat(current.Disponibilita?.Totali);
                
                        if (!Number.isNaN(euro) && !Number.isNaN(dispTotali)) {
                            return accumulator + (euro * dispTotali);
                        }else{
                            console.log(current)
                        }
                    }
                    return accumulator;
                }, 0);
                
                return { ...prev, restante: ((parseFloat(contribution_selected_.importoBudget) - parseFloat(contribution_selected_.importoConsolidato)) - val) };
            });
        }
    }

    /**
     * Tiene conto del prezzo di ogni fornitore in modo da consigliare il prezzo piu basso
     * del 0.01€.
     * @param { * } fornitori Object | in input l'oggetto contenente tutti i fornitori.
     * @returns Float | il prezzo consigliato
    */
    const AdvisedPrice = (elm, elmentMargin, ribasso, fornitori, CostoMedioGestionale) => {
        if (!elm) { return; };
        let lowestPrice = 0;
        let dist = 'Nessuno';
        const elmAdvicedPrice = parseFloat(elm.advisedPrice);
        const margin = parseFloat(elmentMargin ? elmentMargin : paramState.margin);


        const CostoMedioGestionale_ = Object.keys(elm).includes('contributed') ?
            elm?.contributed?.costoMedioGestionale !== undefined ?
                elm?.contributed?.costoMedioGestionale : CostoMedioGestionale
            : CostoMedioGestionale;


        for (const key in visibleColumns) {
            const k = visibleColumns[key]; //prendi la chiave dal nome del elemento in elb. di visibleColumns
            const e = PickLowest(fornitori[k]?.Prezzo, fornitori[k]?.PrezzoListino);
            if (e !== 0 && e !== undefined && (lowestPrice == 0 || lowestPrice > e) && fornitori[k]?.Disponibili !== 0) {
                lowestPrice = parseFloat(e.toFixed(2));
                dist = k
            }
        };
        //Se non viene selezionato nessun fornitore allora compara con i prezzi di focelda stessa.
        if (lowestPrice == 0) {
            dist = 'Focelda';
            lowestPrice = PickLowest(elm.Prezzo, elm.PrezzoListino);
        };
        //definendo il parametro di quanto vuoi essere piu basso rispetto al fornitore piu basso
        //paramState.ribasso_type puo essere true => euro € || false => percento %
        const lowestPrice_ = paramState.ribasso_type ?
            (lowestPrice - ribasso) //definisce la formula per l'euro €
            : (lowestPrice - CalcPercent({ percent: ribasso, number: lowestPrice })) //definisce la formula per la percentuale %
        const lowestNotNegativePrice = lowestPrice_ < 0 ? 0.01 : lowestPrice_; //evita di dare un prezzo sotto lo 0.

        //calcola la percentuale su i due prezzi quanto il prezzo piu basso dei fornitori (sottratto con il paramState.) rientra sul 
        //costo medio gestionale in modo da definire la percentuale effettiva di guadagno.
        const percent = elmAdvicedPrice ?
            parseFloat((((elmAdvicedPrice - CostoMedioGestionale_) / elmAdvicedPrice) * 100).toFixed(2))
            : parseFloat((((lowestNotNegativePrice - CostoMedioGestionale_) / lowestNotNegativePrice) * 100).toFixed(2));
        //percentuale base senza contribuzione
        const percentNoContributed = elmAdvicedPrice ?
            parseFloat((((elmAdvicedPrice - CostoMedioGestionale) / elmAdvicedPrice) * 100).toFixed(2))
            : parseFloat((((lowestNotNegativePrice - CostoMedioGestionale) / lowestNotNegativePrice) * 100).toFixed(2));

        //definisci la proprietà una sola volta assegnandogli il lowestPrice che sarebbe il prezzo consigliato
        //in modo tale che se l'utente cambia il valore manualmente, allora evita di sovrascrivere quel elemento
        //e mostrarlo a schermo
        if (elmAdvicedPrice != lowestNotNegativePrice) {
            if (elm.APSettedBy == 'Machine' || !elm.APSettedBy) {
                Object.assign(elm, { advisedPrice: (lowestNotNegativePrice), APSettedBy: 'Machine' })
            };
        };

        const dispo = CalcDisp(elm, warehouses_selected);

        const blockCheckedFilter = sortFiltersIndex == 2 ? percent < margin :
            percent >= margin


        //se il blocco (prodotto) presenta una percentuale di margine maggiore di quella base allora
        //elimina la contribuzione dal blocco.
        if (percent < percentNoContributed && (Boolean(elm.contributed) && elm.contributed.machine)) {
            delete elm.contributed;
        };

        return {
            price: parseFloat(lowestNotNegativePrice.toFixed(2)), from: dist, percent: percent,
            result: percent >= margin, checked: blockCheckedFilter, dispo: dispo
        }; //se selected è maggiore di margin selezionerà tutti i positivi
    };


    /**
     * Ordina tutti i dati in base ai parametri dei filtri
     * @param { * } index number | index di riferimento per il margine positivo/negativo.
     * @param { * } indexPromo number | index di riferimento per lo stateHook in promo/non.
     */
    const SortWholeData = React.useCallback((index, indexPromo, contributionChanged, contributionNewSelected, settings) => {
        //attiva il seleziona tutti per rimanere cooerente con il funzionamento generale.
        if (!Array.isArray(data) && data.length > 0) { return };
        if (!selecteAllFilter) { setSelectAllFilter(true); };

        let dataElab_ = [];
        const copy = [...data];

        const filterContribution_ = Contribuzione(copy, contributionChanged, contributionNewSelected, settings);

        switch (sortFilterList[index]) {
            case "positivo":
                dataElab_ = filterContribution_.filter((e, _) => AdvisedPrice(e, (e.margin || paramState.margin), (e.ribasso || paramState.ribasso),
                    e.Fornitori, e.CostoMedioGestionale).percent >= (e.margin || paramState.margin));
                break;
            case "negativo":
                dataElab_ = filterContribution_.filter((e, _) => {
                    const advisedResult = AdvisedPrice(e, (e.margin || paramState.margin), (e.ribasso || paramState.ribasso),
                        e.Fornitori, e.CostoMedioGestionale)
                    return advisedResult && !advisedResult.result;
                });
                break;
            default:
                dataElab_ = filterContribution_;
                break;
        };

        const filterWarehouse_ = FilterArrayByWarehouseFilter({ data: dataElab_ });
        const filterInPromo_ = SortPromoData(indexPromo, filterWarehouse_);

        setDataFiltred__(filterInPromo_);
        setSortedData(() => filterInPromo_);

        /*console.log('SortWholeData ||', data.length, " BASE DATA || ", filterContribution_.length, " contribuzione || ", 
            filterWarehouse_.length, " filterWarehouse_ || ", filterInPromo_.length, " filterInPromo_ ||"
        )*/

        const contribution_selected__ = contributionNewSelected ? contributionNewSelected : contribution_selected
        ReduceEuroContributions(filterInPromo_, setContribution_selected, contribution_selected__);
    }, [data, warehouses_selected, paramState, dataFiltred__,
        promoFilterIndex, contribution_selected]);



    /**
     * Seleziona Solo gli elementi Misti/Positivi/Negativi
     */
    const SwapSortData = () => {
        MakeEmptySelection(); //svuota gli elementi selezionati.
        setSortFilters(prev => {
            if (parseInt(prev) == 2) {
                SortWholeData(0, promoFilterIndex);
                return 0;
            } else {
                SortWholeData(parseInt(prev) + 1, promoFilterIndex);
                return parseInt(prev) + 1
            }
        });
    };

    /**
     * Elabora l'array e definisci gli elementi attualmente selezionati dall'utente
     * @param { * } promo String | nome della promo
     */
    const ReqDwdBOIMP = (promo, contributionCode) => {
        if (!promo || promo == "") { 
            return enqueueSnackbar('Perfavore, inserisci un codice promo valido di 4 caratteri.', {
                title: 'Codice Promo non valido',
                type: 'warning',
            });
        };
        setOnDownload(true);
        const arrayElaborated = [];
        for (let i = 0; i < dataFiltred__.length; i++) {
            const e = dataFiltred__[i];
            const advisedFunc = AdvisedPrice(e, (e.margin || paramState.margin), (e.ribasso || paramState.ribasso),
                e.Fornitori, e.CostoMedioGestionale);

            const WhichCheckedTake = e.checked !== undefined ? e.checked : advisedFunc.checked;
            const price = parseFloat(e.advisedPrice !== undefined ? e.advisedPrice : advisedFunc.price);

            if (WhichCheckedTake) {
                if (advisedFunc.dispo >= paramState.minQuantity) {
                    const Obj = {
                        XCDESC: e.CodiceProduttore,
                        XCDOFF: promo,
                        XPZOF1: parseFloat(price.toFixed(2)),
                        XQTLPR: advisedFunc.dispo,
                    };


                    if (e.contributed && (contribution_selected && Object.keys(contribution_selected).length > 0)) {
                        const lowestFinalPrice = PickLowest(e.Prezzo, e.PrezzoListino);
                        Object.assign(Obj, {
                            XPZCON: lowestFinalPrice,
                            XIMPCO: parseFloat(e.contributed.euro?.toFixed(2)), // NEW 
                            XVLSCI: Math.abs(parseFloat((lowestFinalPrice - parseFloat(e.advisedPrice))?.toFixed(2))),
                            XFORMA: "E",
                            XCDCON: contributionCode || null,
                            XQTALI: advisedFunc.dispo,
                        });
                    }
                    arrayElaborated.push(Obj);
                };
            };
        };
        //DOIT: Definire le proprietà da inserire nel arrayElaborated che servono effettivamente per il BOIMP,
        //inviare gli effettivi dati al back.
        FetchBOIMP(arrayElaborated);
        setOnDownload(false);
    };

    //salva lo stato di check all'interno dell'array
    const SaveCheckedBlockonElement = (codiceProduttore, status) => {
        setSortedData(prev => {
            const copy = [...prev];
            const findIndex = copy.findIndex(e => e.CodiceProduttore == codiceProduttore);
            copy[findIndex].checked = status;
            return copy
        });
        //modifica la fonte dati.
        return setData(prev => {
            const copy = [...prev];
            const findIndex = copy.findIndex(e => e.CodiceProduttore == codiceProduttore);
            copy[findIndex].checked = status;
            return copy
        });
    };


    function ChangeAllCheckedState(status) {
        setSelectAllFilter(!selecteAllFilter);
        //disattiva / attiva in base allo status definendo la proprietà checked in base inoltre
        //alla situazione, in modo tale da selezionare e deselezionare tutti gli elementi.
        function elbArray() {
            const arrayElaborated = [];
            for (let i = 0; i < sortedData.length; i++) {
                const e = sortedData[i];
                const advisedFunc = AdvisedPrice(e, (e.margin || paramState.margin), (e.ribasso || paramState.ribasso),
                    e.Fornitori, e.CostoMedioGestionale);
                const WhichCheckedTake = advisedFunc.checked;
                if (WhichCheckedTake) {
                    const Obj = {
                        checked: status,
                        checkedFromAI: true,
                    };
                    arrayElaborated.push({ ...e, ...Obj });
                } else {
                    arrayElaborated.push(e);
                }
            };
            return arrayElaborated;
        };

        setSortedData(elbArray());
        setDataFiltred__(elbArray());
    };

    /**
    * Callback di invio filtri precalcolati in composeFiltersFunc, funzioni dedicate all ricalcolo dei filtri
    * tramite richiamo da TAG, in modo da avere TAG rapidi sulla situazione dei filtri.
    * @param {*} query stringa calcolata dalla funzione composeFiltersFunc per il calcolo di tutti 
    * i filtri presenti inseriti dall'utente.
    */
    const SendFiltersAPI_TAG = React.useCallback((query) => {
        SendFilters(setSortedData, userContext, query, abortController, setLoadState, setData,
            FilterArrayByWarehouseFilter, ResetWarehousesSelected, buyerTarget, ResetMarginFilters,
            visibleColumns, setDataOrigin_, cookieNameColumns);
    }, [data, userContext.details, abortController.current,
        warehouses_selected, buyerTarget, visibleColumns, dataOrigin_]);

    const composeFiltersFunc = () => {
        setLoadState(true);
        const query = FiltersToSend({
            brandSelected: brandSelected, categorySelected: categorySelected,
            subcategorySelected: subcategorySelected, DispWithout0: true, dfValue: null,
            typeSelected: typeSelected
        });

        if (query) {
            ChangeStatusFilters();
            SendFiltersAPI_TAG(query)
        }
    };

    //se l'utente cambia i magazzini selezzionati, richiama la funzione in modo tale da filtrare nuovamente
    React.useEffect(() => {
        SortWholeData(sortFiltersIndex, promoFilterIndex, true, null, 
            { saveOnSetData: false, overwriteContributed: true, usePrice: true });
    }, [data, warehouses_selected, paramState, promoFilterIndex]);


    /**
     * funzione che ha lo scopo di filtrare in base ai magazzini selezionati dall'utente aggiornando
     * lo stato finale.
     * @param { * } data Array | nuovi dati da valutare e filtrare in base ai magazzini
     * @param { * } type Number | stato che definisce se presente lo switch della tipologia di filtro magazzino.
     * @returns i dati filtrati in base al type e ai magazzini selezionati
     */
    const FilterArrayByWarehouseFilter = ({ data, type, warehouses }) => {
        const warehouse = warehouses !== undefined ? warehouses : warehouses_selected;
        const filterType = type !== undefined ? type : warehousesFilterType;
        let filtered;
        // 0 => Filtra.
        if (warehouse.length > 0) {
            if (filterType == 0) {
                filtered = data.filter(item => {
                    // Controlla se l'elemento ha tutti gli elementi all'interno di warehouseFilters
                    return warehouse.every(filter => {
                        // Verifica se c'è un magazzino corrispondente all'interno di Disponibilita.Magazzini
                        return item.Disponibilita?.Magazzini?.some(element => element.Nome === filter
                            && element.Quantita > 0
                            && element.Quantita >= (paramState.minQuantity || 1));
                    });
                });
            } else { // 1 => prendi i prodotti dove contiene almeno uno dei fornitori selezionati.
                filtered = data.filter(item => {
                    // Controlla se almeno uno dei nomi dei magazzini presenti in item.Disponibilita?.Magazzini corrisponde a uno dei nomi presenti in warehouses_selected
                    return item.Disponibilita.Magazzini?.some(element => {
                        return warehouse.includes(element.Nome) && element.Quantita > 0
                            && element.Quantita >= (paramState.minQuantity || 1);
                    });
                });
            }
            setDataFiltred__(() => filtered);
        } else {
            filtered = data.filter(e => e.Disponibilita.Totali >= (paramState.minQuantity || 1));
        };

        return filtered;
    };

    //Filtra i dati Promo/Non in input in base alla in base all'index 
    const SortPromoData = React.useCallback((index, data) => {
        const copy = [...data];
        let filter_;

        switch (index) {
            case 1:
                filter_ = copy.filter(e => e.Promo === true);
                break;
            case 2:
                filter_ = copy.filter(e => e.Promo === false);
                break;
            default:
                filter_ = copy;
                break;
        };

        return filter_;
    }, [data, promoFilterIndex]);

    const PromoFilter = () => {
        setPromoFilterIndex(prev => {
            if (parseInt(prev) == 2) {
                SortWholeData(sortFiltersIndex, 0, false)
                return 0;
            } else {
                const increase = parseInt(prev) + 1
                SortWholeData(sortFiltersIndex, increase, false)
                return increase;
            }
        });

    };


    

    
    return <React.Fragment><Stack gap={1} mt={2}>
        <ExtraBar totalOfData={dataFiltred__.length} ChangeAllCheckedState={ChangeAllCheckedState}
            selecteAllFilter={selecteAllFilter} setSelectAllFilter={setSelectAllFilter}
            ChangeStatusTagP={ChangeStatusTagP} warehouses_selected={warehouses_selected}
            sortFiltersIndex={sortFiltersIndex} sortFilterList={sortFilterList} SwapSortData={SwapSortData}
            promoFilterIndex={promoFilterIndex} PromoFilter={PromoFilter} contribution_selected={contribution_selected}
            contribution_company_selected={contribution_company_selected} ChangeStatusContributionP={ChangeStatusContributionP}
            contributionsList={contributionsList}
        />

        <Filters buyerTarget={buyerTarget} setBuyerTarget={setBuyerTarget}
            categorySelected={categorySelected} setCategorySelected={setCategorySelected}
            subcategorySelected={subcategorySelected} setSubCategorySelected={setSubCategorySelected}
            brandPrefix={brandPrefix} setBrandPrefix={setBrandPrefix}
            brandSelected={brandSelected} setBrandSelected={setBrandSelected}
            typeSelected={typeSelected} setTypeSelected={setTypeSelected}
            searchDataContext={extraData}
            filterOpen={filterOpen} ChangeStatusFilters={ChangeStatusFilters} composeFiltersFunc={composeFiltersFunc}
            loadState={loadState}/>

        <ParamBar paramState={paramState} setParamState={setParamState} distList__={distList__.current}
            visibleColumns={visibleColumns} setVisibleColumns={setVisibleColumns} 
            toggleColumnVisibility={toggleColumnVisibility}
            grindView={grindView} setGrindView={setGrindView}
            ChangeBOIMPPanleVisibility={ChangeBOIMPPanleVisibility} ChangeStatusFilters={ChangeStatusFilters}
            sortedData={dataFiltred__} ChangeRibassoType={ChangeRibassoType} />

        <ActionsBar selectedFile={selectedFile} MakeEmptySelection={MakeEmptySelection}
            numFileSelected={selectedFile.length} Temp_HandleChange={Temp_HandleChange} temp_param={temp_param}
            SetParamOnBlock={SetParamOnBlock} marginVisibility={marginVisibility} ChangeMARGVisibility={ChangeMARGVisibility}
            ribassoVisibility={ribassoVisibility} ChangeRIBVisibility={ChangeRIBVisibility}
            ChangeRibassoType__temp={ChangeRibassoType__temp} paramState={paramState} DelContributionOnBlock={DelContributionOnBlock}
            contributionsList={contributionsList} setTemp_param={setTemp_param} userContext={userContext}
            buyerTarget={buyerTarget} />

        {loadState && <Stack alignItems='center' justifyContent='center' sx={{ height: '100%' }} gap={2}>
            <MinLoader sx={{ width: 25, height: 25 }} /></Stack>}

        {dataFiltred__.length > 0 ? <VirtuosoGridVI data={dataFiltred__} setData={setSortedData}
            handleClick={handleClick} selectedFile={selectedFile} setSelectedFile={setSelectedFile}
            param={paramState} grindView={grindView} AdvisedPrice={AdvisedPrice} PickLowest={PickLowest}
            SaveCheckedBlockonElement={SaveCheckedBlockonElement} HandleProductExpandedDist={HandleProductExpandedDist}
            ChangeDetailsDistPanelVisibility={ChangeDetailsDistPanelVisibility} Contribuzione={Contribuzione}
            ReduceEuroContributions={ReduceEuroContributions} setContribution_selected={setContribution_selected} />
            : <Stack><NoData img={missingDataWEBP} height={60} /></Stack>}

    </Stack>
        <DwdBOIMP ReqDwdBOIMP={ReqDwdBOIMP} BOIMPPanelVisibility={BOIMPPanelVisibility}
            ChangeBOIMPPanleVisibility={ChangeBOIMPPanleVisibility} onDownload={onDownload} 
            contribution_selected={contribution_selected}/>
        <WarehousesPanel status={statusTagP} ChangeStatusTagP={ChangeStatusTagP} warehouses_selected={warehouses_selected}
            setWarehouses_selected={setWarehouses_selected} warehouses_list={warehouses_list} noDataWEBP={noDataWEBP}
            warehousesFilterType={warehousesFilterType} HandleFlipWarehouseType={HandleFlipWarehouseType} />

        <ContributionP status={statusContributionP} ChangeStatusContributionP={ChangeStatusContributionP}
            warehouses_list={warehouses_list} noDataWEBP={noDataWEBP} loadState={loadState}

            contribution_selected={contribution_selected} setcontribution_selected={setContribution_selected}
            avabileContributionsList={contributionsList} setAvaibleContributionsList={setContributionsList}

            company_selected={contribution_company_selected} setCompany_selected={setContribution_company_selected}
            companyList={contributionsCompanyList} setCompanyList={setContributionsCompanyList}

            SortWholeData={SortWholeData} />

        {productExpandedDist && <DetailsDist detailsDistPanelVisibility={detailsDistPanelVisibility} ChangeDetailsDistPanelVisibility={ChangeDetailsDistPanelVisibility}
            dist={productExpandedDist} noDataWEBP={noDataWEBP} settingsProductExpanded={settingsProductExpanded} />}
    </React.Fragment>
}