import React from 'react';
import { UserContext } from "context/UserContext";

import { Card, Fade, Skeleton, Stack, Typography } from '@mui/material';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';

import { FiltersBar } from './extraPanel/filtersBar';
import { PopupInfo } from 'components/PopupInfo';

import theme from 'assets/theme';
import { EditPanel } from './extraPanel/editPanel';
import { Tooltip } from 'react-tooltip';
import { icon_delete, icon_settings } from 'config/icons';
import { SaveConditionAPI } from './fetchData/saveCondition';

import ErrorIMG from 'assets/images/5203299_trasparent.webp';
import { GeneralError } from 'components/NoData/generalError';
import { SuppliersListAPI } from './fetchData/SuppliersListAPI';
import MDSnackbar from 'components/MDSnackbar';
import { TableDataAPI } from './fetchData/tableData';
import { TableVirtualized } from 'components/Virtualized/table';



interface distSelectedProps {
    name: string;
    value?: number;
}
interface dataToInsertProps {
    buyerSelected: any;
    brandSelected: { Marca: string, PrefissiFornitore: Array<object> } | null;
    categorySelected: any;
    subcategorySelected: any;
    raggruppamento: any;
    quarters: Array<distSelectedProps>;
}
interface ConfiguratoreFornitoriProps { }
interface TagDistProps {
    distSelected: Array<distSelectedProps>;
}
interface MakeEmptyProps_ {
    setData: (prev: any) => void;
}




const TagDist: React.FC<TagDistProps> = ({ distSelected }) => {
    return <Stack direction='row' gap={0.5} alignItems='center' alignContent='flex-start'>
        {distSelected.length > 0 ? distSelected.filter(e => e.value).map((data, index) => (
            <Typography key={index} sx={{
                backgroundColor: '#e9e9e9', fontSize: '0.7rem',
                height: 'fit-content', p: "3px 10px", borderRadius: 5
            }}>
                {data.name}
            </Typography>
        )) : <Typography sx={{
            backgroundColor: '#e9e9e9', fontSize: '0.7rem',
            height: 'fit-content', p: "3px 10px", borderRadius: 5
        }}>
            Nessun Valore Inserito
        </Typography>}
    </Stack>
}


const CheckDataToInsert = (dataToInsert: any) => {
    const exception = ['subcategorySelected', "raggruppamento"]
    for (const key in dataToInsert) {
        const e = (dataToInsert as any)[key];
        if (e == null && !exception.includes(key)) {
            return false;
        } else if (Array.isArray(e)) {
            if (Boolean(e.length === 0)) {
                return false
            } else { continue };
        } { continue };
    }
    return true;
};


/**
 * 
 * @param { * } setData Object | set state hook della proprietà principale per la raccolta dei dati che verranno 
 * inseriti in tabella
 * @returns void | setData pulito.
 */
const MakeEmptyProps = ({ setData }: MakeEmptyProps_) => {
    return setData((prev: any) => {
        const copy = { ...prev };
        for (const key in copy) {
            if (Array.isArray((copy as any)[key])) {
                (copy as any)[key] = [];
            } else {
                (copy as any)[key] = null;
            }
        }
        return copy;
    })
}

export const StocksTargetConfigurator: React.FC<ConfiguratoreFornitoriProps> = () => {
    const { palette } = theme;
    const { background } = palette;

    const [userContext, setUserContext] = React.useContext<any>(UserContext);
    //Errore Fetch iniziale (Emoji Error)
    const [err, setErr] = React.useState(false);
    //--- Stato del Messaggio se aperto o meno
    const [errorSB, setErrorSB] = React.useState<Boolean>(false);
    const closeErrorSB = () => setErrorSB(false);
    const openErrorSB = (icon: string, message: string) => { setErrorSB(true); setDymIcon(icon); setError(message) };

    // --- Richiamando e settando uno di questi valori definisce il colore e l'icona in utilizzo dal pop-up
    const [dymIcon, setDymIcon] = React.useState<string>("warning");
    //--- Messaggio di Errore
    const [error, setError] = React.useState<String>("");
    const renderErrorSB = (
        <MDSnackbar
            color={dymIcon}
            icon={dymIcon}
            title="Focelda Dashboard"
            content={error}
            dateTime="1 sec fa"
            open={errorSB}
            onClose={closeErrorSB}
            close={closeErrorSB}
            bgWhite
        />
    );
    const [onLoad, setOnLoad] = React.useState<boolean>(true);

    //0 => Inserisci Nuova Condizione || 1 => Modifica Condizione Esistente in tabella
    const [extraSuppliersPanelOpenedBy, setExtraSuppliersPanelOpenedBy] = React.useState<0 | 1>(0);
    const [selectedItemtoEdit, setSelectedItemtoEdit] = React.useState<any>(null); //stato che mantiene i cambiamenti fatti dall'utente sia in editMode che in CreateMode

    //funzione di richiamo per modificare i valori in tabella.
    const EditConditionsOfItems = (index: number, list: any) => {
        const quortersActived = [];
        const item_ = list[index];
        const takeOnly = ['Q1', 'Q2', 'Q3', 'Q4'];
        const prop_ = Object.keys(item_);

        for (let i = 0; i < prop_.length; i++) {
            const e = prop_[i];
            if (takeOnly.includes(e) && item_[e] !== null && item_[e] !== "Nessun Valore") {
                quortersActived.push(e)
            }
        };
        setQuarterFromEditItem(quortersActived);
        ChangeStatusPanelSupplierToEdit(1); //comunica al panello che è in editMode e non in AddMode.

        setSelectedItemtoEdit(item_);
    };
    //Elimina l'item in tabella e nel DB.
    const DeleteItem = (index: number, list: any) => {
        actionType.current = 2;
        const item_ = list[index];

        setTableData((prev: any) => {
            const copy = [...prev];
            const index = copy.findIndex(e => e.Buyer === item_.Buyer && e.Marca === item_.Marca
                && e.Categoria === item_.Categoria && e.Sottocategoria === item_.Sottocategoria);
            if (index !== -1) {
                copy.splice(index, 1);
            }
            return copy;
        });
        SaveConditionAPI({ userContext, abortController, dataToInsert: item_, actionType: actionType.current });
    }

    const [tableData, setTableData] = React.useState<Array<Object>>([]);
    const [supplierList, setSupplierList] = React.useState<any>([]);

    const [suppliersFromNewInsert, setSuppliersFromNewInsert] = React.useState<String[]>([]); //lista dei fornitori attualmente attivi nel pannello
    const [quarterFromEditItem, setQuarterFromEditItem] = React.useState<String[]>([]); //lista dei fornitori attualmente attivi nel pannello

    const UpdateSuppliersActived = (distName: string) => {
        if (extraSuppliersPanelOpenedBy == 0) {
            setSuppliersFromNewInsert((prev: any) => {
                const copy = [...prev];
                const checkifExist = copy.findIndex(e => e === distName);
                if (checkifExist !== -1) {
                    copy.splice(checkifExist, 1);
                } else {
                    copy.push(distName);
                }
                return copy;
            })
        } else {
            setQuarterFromEditItem((prev: any) => {
                const copy = [...prev];
                const checkifExist = copy.findIndex(e => e === distName);
                if (checkifExist !== -1) {
                    copy.splice(checkifExist, 1);
                } else {
                    copy.push(distName);
                }
                return copy;
            })
        };
    };

    //statehook per i dati inseriti dall'utente.
    const [dataToInsert, setDataToInsert] = React.useState<dataToInsertProps>({
        buyerSelected: null,
        brandSelected: null,
        categorySelected: null,
        subcategorySelected: null,
        raggruppamento: null,
        quarters: []
    });
    const actionType = React.useRef<number>(0);

    //colonne della tabella dati.
    const [columns, setColumns] = React.useState([
        {
            key: [], fieldToTake: [
                {
                    key: 'Edit', type: 'button', title: 'Modifica', ariaLabel: 'edit', icon: icon_settings(),
                    funcAction: EditConditionsOfItems, onHoverColor: '#efb530a3'
                },
                {
                    key: 'Delete', type: 'button', title: 'Elimina', ariaLabel: 'edit', icon: icon_delete(),
                    funcAction: DeleteItem, onHoverColor: '#ff8080'
                },
            ], label: 'Opzioni', type: 'info', width: 100, excludeLogic: true, sx: { alignItems: 'center', flexDirection: 'row' }
        },
        { key: 'Buyer', label: 'Buyer', sort: true, width: 150, sortType: 'String', type: 'default', sx: { alignSelf: 'center', alignItems: "center" } },
        { key: 'Marca', label: 'Marca', sort: true, width: 150, sortType: 'String', type: 'default', sx: { alignSelf: 'center', alignItems: "center" } },
        {
            key: ['Categoria'], fieldToTake: [
                { key: 'DescrizioneLinea', type: 'default', sx: { alignSelf: 'center' } },
            ], label: 'Linea', width: 250, type: 'default', sx: { alignItems: 'center' }
        },
        {
            key: ['Sottocategoria'], fieldToTake: [
                { key: 'DescrizioneGruppo', type: 'default', sx: { alignSelf: 'center' } },
            ], label: 'Famiglia', width: 250, type: 'default', sx: { alignItems: 'center' }
        },
        { key: 'Q1', label: 'Q1', sort: true, width: 150, type: 'eur', sx: { alignSelf: 'center' } },
        { key: 'Q2', label: 'Q2', sort: true, width: 150, type: 'eur', sx: { alignSelf: 'center' } },
        { key: 'Q3', label: 'Q3', sort: true, width: 150, type: 'eur', sx: { alignSelf: 'center' } },
        { key: 'Q4', label: 'Q4', sort: true, width: 150, type: 'eur', sx: { alignSelf: 'center' } },

    ]);

    //controlla lo stato della chiamata infiniteScroll per evitare una seconda chiamata
    const onTimeCallRef = React.useRef<boolean>(false);
    // Abort il panding del fetch all server
    const abortController = React.useRef<any>(null);
    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
        }
    };
    //stato del pannello di selezione dei fornitori
    const [quartersToEditStatus, setQuartersToEditStatus] = React.useState<boolean>(false);
    const ChangeStatusPanelSupplierToEdit = (openedByIndex?: 0 | 1) => {
        if (openedByIndex !== undefined) { setExtraSuppliersPanelOpenedBy(openedByIndex); }
        setQuartersToEditStatus(!quartersToEditStatus)
    };


    //operazioni iniziali.
    React.useEffect(() => {
        if (userContext.details === undefined) { return; }

        TableDataAPI({ userContext, abortController, setTableData, setErr, buyerTarget: null, setOnLoad });
        SuppliersListAPI({ userContext, abortController, setSupplierList, setErr })

        return () => {
            cancelRequest();
        }
    }, [userContext.details]);

    const SaveChangedConfiguration = () => {
        if (extraSuppliersPanelOpenedBy === 0) { return };
        actionType.current = 1;
        SaveConditionAPI({ userContext, abortController, dataToInsert: selectedItemtoEdit, actionType: actionType.current });
    };

    /**
     * funzione che elimina o inserisce il fornitore in base al openedBy.
     * @param checkbox Boolean | indica se il fornitore è attivo o meno
     * @param dist Object | oggetto che deve togliere o inserire in base al valore boolean di checkbox
     */
    const HandleDistToInsert = (checkbox: boolean, dist: distSelectedProps) => {
        if (extraSuppliersPanelOpenedBy === 0) {
            setDataToInsert((prev: any) => {
                const copy = { ...prev };
                if (checkbox) {
                    copy.distSelected = [...copy.distSelected, dist];
                } else {
                    const index = copy.distSelected.findIndex((e: distSelectedProps) => e.name === dist.name);
                    copy.distSelected.splice(index, 1);
                }

                return copy;
            })
        } else {
            setTableData((prev: any) => {
                const copy = [...prev];
                const findItemIndex = copy.findIndex(e => e.Marca === selectedItemtoEdit.Marca
                    && e.Categoria === selectedItemtoEdit.Categoria && e.Sottocategoria === selectedItemtoEdit.Sottocategoria);
                if (findItemIndex !== -1) {
                    const item = copy[findItemIndex];
                    if (checkbox) {
                        item.Fornitori = [...item.Fornitori, dist];
                    } else {
                        const index = item.Fornitori.findIndex((e: distSelectedProps) => e.name === dist.name);
                        item.Fornitori.splice(index, 1);
                    }
                }

                return copy;
            })
        }
    };

    /**
     * Inserisce gli elementi compilati dall'utente come Brand/Categoria/Sotto categoria/Fornitori all'interno
     * della tabella.
     */
    const InsertConditionInTable = (): Array<object> | any => {
        if (!CheckDataToInsert(dataToInsert)) { return console.error('Sembra esserci un elemento nullo o vuoto') };
        let dataToRet; //ritorna i dati in modo tale che quando fa il controllo per cancellare la proprietà nei filtri abbia i dati aggiornati
        setTableData((prev: any) => {
            const prepareObject = {
                Buyer: dataToInsert.buyerSelected.Codice,
                Marca: (dataToInsert?.brandSelected?.Marca || "Empty"),
                Categoria: dataToInsert.categorySelected,
                Sottocategoria: dataToInsert.subcategorySelected ? dataToInsert.subcategorySelected : { Gruppo: "", DescrizioneGruppo: 'Tutte le Sottocategorie' },
                Raggruppamento: dataToInsert.raggruppamento ? dataToInsert.raggruppamento.Codice : null,
                Q1: (dataToInsert.quarters?.find(e => e.name === 'Q1')?.value || null),
                Q2: (dataToInsert.quarters?.find(e => e.name === 'Q2')?.value || null),
                Q3: (dataToInsert.quarters?.find(e => e.name === 'Q3')?.value || null),
                Q4: (dataToInsert.quarters?.find(e => e.name === 'Q4')?.value || null),
                //Quorters: dataToInsert.quarters
            };

            if (dataToInsert.subcategorySelected) {
                dataToRet = [prepareObject, ...prev];
                return [prepareObject, ...prev];
            } else {
                const subCategoryList = dataToInsert.categorySelected.SubCategory;
                const elementsToAdd = [];
                for (let index = 0; index < subCategoryList.length; index++) {
                    const subcategory = subCategoryList[index];
                    const obj = {
                        ...prepareObject,
                        Sottocategoria: subcategory,
                        Q1: null,
                        Q2: null,
                        Q3: null,
                        Q4: null,
                        //Quorters: dataToInsert.quarters
                    };
                    elementsToAdd.push(obj);
                };

                elementsToAdd.push({
                    ...prepareObject,
                    Sottocategoria: { Gruppo: "", DescrizioneGruppo: 'Tutte le Sottocategorie' },
                });
                dataToRet = [elementsToAdd, ...prev];
                return [...elementsToAdd, ...prev];
            }

        });
        if (!dataToInsert.brandSelected) { return };

        const prepareDataToSend = {
            Buyer: dataToInsert.buyerSelected.Codice,
            Marca: dataToInsert.brandSelected.Marca,
            ...dataToInsert,
            Q1: (dataToInsert.quarters?.find(e => e.name === 'Q1')?.value || null),
            Q2: (dataToInsert.quarters?.find(e => e.name === 'Q2')?.value || null),
            Q3: (dataToInsert.quarters?.find(e => e.name === 'Q3')?.value || null),
            Q4: (dataToInsert.quarters?.find(e => e.name === 'Q4')?.value || null),
        };
        actionType.current = 0;
        SaveConditionAPI({ userContext, abortController, dataToInsert: prepareDataToSend, actionType: actionType.current });

        MakeEmptyProps({ setData: setDataToInsert });
        setSuppliersFromNewInsert([]);
        return dataToRet;
    };



    /**
     * @param { * } value number | valore effettivo che andrà nella proprietà di destinazione in base a indexValue
     * @param { * } name string | nome del fornitore con il quale si vuole interagire 
     */
    const ChangeValueOnQuarters = (name: string, value: number | string) => {
        if (typeof value === 'string' && (value as string)?.includes(',')) { return; };

        let value__: string | number = value;
        if ((value as string)[(value as string).length - 1] != ".") {
            value__ = parseFloat(value as string);
        }

        if (extraSuppliersPanelOpenedBy === 0) {
            //modifica gli elementi del oggetto di invio dati al server
            setDataToInsert((prev: any) => {
                const copyDist = [...prev.quarters];
                const indexDist = copyDist.findIndex(e => e.name == name);
                if (indexDist !== -1) {
                    copyDist[indexDist].value = value__;
                } else {
                    const obj = {
                        name: name,
                        value: value
                    };
                    copyDist.push(obj);
                }

                return { ...prev, quarters: copyDist };
            })
        } else {
            //modifica gli elementi del presenti in tabella.
            setTableData((prev: any) => {
                const copy = [...prev];
                const findItemIndex = copy.findIndex(e => e.Marca === selectedItemtoEdit.Marca
                    && e.Categoria === selectedItemtoEdit.Categoria && e.Sottocategoria === selectedItemtoEdit.Sottocategoria);
                if (findItemIndex !== -1) {
                    const item = copy[findItemIndex];
                    const indexDist = name;
                    item[indexDist] = value__;
                }

                return copy;
            })
        }

    };

    /**
     * Funzione che elimina le proprietà dal oggetto fornitore nello statehook
     * @param nameDist String | nome del fornitore
     * @param namePropsToDelete Array<string> | nome delle proprietà che si vogliono eliminare all'interno
     * dei dati fornitore.
     */
    const DeletePropsOnItem = (quarter: string, namePropsToDelete: string[]) => {
        if (extraSuppliersPanelOpenedBy === 0) {
            setDataToInsert((prev: any) => {
                const copy = { ...prev };
                if (copy.quarters) {
                    const indexTarget = copy.quarters.findIndex((e: { name: string }) => e.name === quarter);
                    if (indexTarget !== -1) {
                        if (Boolean(Array.isArray(namePropsToDelete))) {
                            namePropsToDelete.map((nameProps: string) => {
                                delete copy.quarters[indexTarget][nameProps];
                            })
                        }
                    }
                }
                return copy
            })
        } else {
            //elimina gli elementi dalla tabella quando vengono deselezionati da un elemento in edit mode.
            setTableData((prev: any) => {
                const copy = [...prev];
                const findItemIndex = copy.findIndex(e => e.Marca === selectedItemtoEdit.Marca
                    && e.Categoria === selectedItemtoEdit.Categoria && e.Sottocategoria === selectedItemtoEdit.Sottocategoria);
                if (findItemIndex !== -1) {
                    const item = copy[findItemIndex];
                    const target = quarter;
                    if (item[target]) {
                        item[target] = null;
                    }
                }
                return copy
            })
        }
    };

    /**
     * Funzione che ha lo scopo di fare il retrive dei dati salvati in base alla provenienza del click.
     * @param quarter String | nome del fornitore da ricercare
     * @returns Oggetto elemento contenete i dati del fornitore nello statehook.
     */
    const RetriveDistData = (quarter: string) => {
        if (extraSuppliersPanelOpenedBy === 0) {
            const indexDist = dataToInsert.quarters.findIndex((e: distSelectedProps) => e.name === quarter);
            return dataToInsert.quarters[indexDist];
        } else {
            return selectedItemtoEdit[quarter];
        };
    };

    const Search = () => {
        setOnLoad(true);
        TableDataAPI({ userContext, abortController, setTableData, setErr, buyerTarget: dataToInsert.buyerSelected?.Codice, setOnLoad });
    };


    return <DashboardLayout>
        {!err ? <React.Fragment>
            <Stack gap={2}>
                <PopupInfo title='Info' close={false}
                    body='Inserisci brand, categoria e sotto categoria per definire la nuova impostazione 
            fornitore per quei specifici prodotti.' />

                <Card>
                    <Stack sx={{ p: 1.5, bborderRadius: 2 }} gap={2}>
                        <FiltersBar ChangeStatusPanelSupplierToEdit={ChangeStatusPanelSupplierToEdit}
                            dataToInsert={dataToInsert} setDataToInsert={setDataToInsert} TagDist={TagDist}
                            InsertConditionInTable={InsertConditionInTable} saveBtnState={CheckDataToInsert(dataToInsert)}
                            tableData={tableData} openErrorSB={openErrorSB} Search={Search} onLoad={onLoad} />
                    </Stack>
                </Card>

                {!onLoad ? <Fade in={true} timeout={300}><Stack sx={{ borderRadius: 3 }}>
                    <TableVirtualized
                        data={tableData}
                        whereToFindData={false}
                        setData={setTableData}
                        results={tableData.length}
                        columns={columns}
                        setColumns={setColumns}
                        height="calc(100vh - 400px)"
                    />
                </Stack></Fade> : <Fade in={true}>
                    <Skeleton height="calc(100vh - 370px)" sx={{ borderRadius: 3, width: '100%' }} variant="rounded" /></Fade>}
            </Stack>
            <EditPanel supplierList={supplierList} statusMode={quartersToEditStatus}
                ChangeStatus={ChangeStatusPanelSupplierToEdit} HandleDistToInsert={HandleDistToInsert}
                ChangeValueOnQuarters={ChangeValueOnQuarters} UpdateSuppliersActived={UpdateSuppliersActived}
                suppliersFromNewInsert={suppliersFromNewInsert} quarterFromEditItem={quarterFromEditItem}
                DeletePropsOnItem={DeletePropsOnItem} openedBy={extraSuppliersPanelOpenedBy} RetriveDistData={RetriveDistData}
                SaveChangedConfiguration={SaveChangedConfiguration} />
        </React.Fragment> : <GeneralError img={ErrorIMG} />}
        {renderErrorSB}
        <Tooltip id="general-confg-suppliers-tooltip" place="bottom" style={{
            maxWidth: "15vw", minWidth: 150, fontSize: '0.87rem', zIndex: 9999,
            textAlign: 'center'
        }} />
    </DashboardLayout>
}