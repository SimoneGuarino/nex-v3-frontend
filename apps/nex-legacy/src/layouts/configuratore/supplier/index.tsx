import React from 'react';
import { UserContext } from "context/UserContext";

import { Card, Fade, Stack, Typography } from '@mui/material';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import { AddElements } from './extraPanel/addElements';

import { SupplierToEdit } from './extraPanel/supplierToEdit';
import { Tooltip } from 'react-tooltip';
import { icon_TrendingDown, icon_TrendingUp, icon_delete, icon_settings } from 'config/icons';
import { SaveConditionAPI } from './fetchData/saveCondition';
import { TableDataAPI } from './fetchData/tableData';

import ErrorIMG from 'assets/images/5203299_trasparent.webp';
import { GeneralError } from 'components/NoData/generalError';
import { SuppliersListAPI } from './fetchData/SuppliersListAPI';
import MDSnackbar from 'components/MDSnackbar';
import { TableVirtualized } from 'components/Virtualized/table';
import { RemoveSpaceText } from 'utils/sanitize';
import FDBox from 'components/UI/box/FDBox';

//tour
import { useSectionTour } from 'tour/useSectionTour';
import { useTour } from "tour/TourProvider";
import { Role } from 'tour/types';


interface distSelectedProps {
    name: string;
    idIndexOfValue?: number;
    toIncrese?: number;
    toDecrease?: number;
}
interface dataToInsertProps {
    brandSelected: { Marca: string, PrefissiFornitore: Array<object> } | null;
    categorySelected: any;
    subcategorySelected: any;
    raggruppamento: any;
    note: string | null;
    distSelected: Array<distSelectedProps>;
    dist_prezzo_suggerito: string | null;
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
        {distSelected.length > 0 ? distSelected.map((data, index) => (
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
            Nessun Fornitore
        </Typography>}
    </Stack>
}

/**
 * Funzione che controlla se i dati inseriti dall'utente sono validi per essere inseriti in tabella.
 * @param { * } dataToInsert Object | oggetto che contiene i dati da controllare.
 * @returns Boolean | true se i dati sono validi, false altrimenti.
 */
const CheckDataToInsert = (dataToInsert: any) => {
    for (const key in dataToInsert) {
        const e = (dataToInsert as any)[key];
        if (e == null && key !== 'raggruppamento' && key !== 'note' && key !== 'dist_prezzo_suggerito') {
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

export const SupplierConfigurator: React.FC<ConfiguratoreFornitoriProps> = () => {
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

    //0 => Inserisci Nuova Condizione || 1 => Modifica Condizione Esistente in tabella
    const [extraSuppliersPanelOpenedBy, setExtraSuppliersPanelOpenedBy] = React.useState<0 | 1>(0);
    const [selectedItemtoEdit, setSelectedItemtoEdit] = React.useState<any>(null); //stato che mantiene i cambiamenti fatti dall'utente sia in editMode che in CreateMode

    //funzione di richiamo per modificare i valori in tabella.
    const EditConditionsOfItems = (e: any, item: any) => {
        setSuppliersFromEditItem(item.Fornitori.map((e: any) => e.name));
        ChangeStatusPanelSupplierToEdit(1); //comunica al panello che è in editMode e non in AddMode.

        setSelectedItemtoEdit(item);
    };

    const [tableData, setTableData] = React.useState<Array<Object>>([]);
    const [supplierList, setSupplierList] = React.useState<any>([]);

    const [suppliersFromNewInsert, setSuppliersFromNewInsert] = React.useState<String[]>([]); //lista dei fornitori attualmente attivi nel pannello
    const [suppliersFromEditItem, setSuppliersFromEditItem] = React.useState<String[]>([]); //lista dei fornitori attualmente attivi nel pannello

    //funzione che aggiorna la lista dei fornitori attivi in base al pannello aperto.
    //0 => pannello di inserimento nuova condizione || 1 => pannello di modifica condizione esistente
    /**
     * Funzione che aggiorna la lista dei fornitori attivi in base al pannello aperto.
     * @param distName String | nome del fornitore da aggiungere o rimuovere dalla lista
     */
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
            setSuppliersFromEditItem((prev: any) => {
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
        brandSelected: null,
        categorySelected: null,
        subcategorySelected: null,
        raggruppamento: null,
        note: null,
        distSelected: [],
        dist_prezzo_suggerito: null
    });


    //funzione di richiamo per modificare i valori in tabella.
    const DeleteItem = (index: number, itemsList: any) => {
        setTableData((prev: any) => {
            const copy = [...prev];
            copy.splice(index, 1);
            return copy;
        });
        SaveConditionAPI({ userContext, abortController, dataToInsert: itemsList[index], tp: 1 });
    };

    //colonne della tabella dati.
    const [columns, setColumns] = React.useState([
        {
            key: [], fieldToTake: [
                {
                    key: 'Delete', type: 'button', title: 'Cancella Configurazione', ariaLabel: 'remove', icon: icon_delete(),
                    funcAction: DeleteItem, onHoverColor: '#ff8080'
                },
                {
                    key: 'Comments', type: 'button', title: 'Modifica i Fornitori', ariaLabel: 'edit', icon: icon_settings(),
                    funcAction: EditConditionsOfItems, onHoverColor: '#efb530a3'
                },
            ], label: 'Opzioni', type: 'info', width: 100, excludeLogic: true, sx: { flexDirection: 'row', alignItems: 'center', width: '100%' }
        },
        { key: 'Raggruppamento', label: 'Raggruppamento', sort: false, width: 100, sortType: 'String', type: 'default', sx: { alignItems: 'center', width: '100%' } },
        {
            key: 'note', label: 'Note', sort: false, width: 200, sortType: 'String', onHover: true, type: 'default', sx: {
                alignItems: 'center', textAlign: 'center', width: '100%',
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
                WebkitLineClamp: "2"
            }
        },
        {
            key: 'dist_prezzo_suggerito', label: 'Distributore Ref. Prezzo Suggerito', sort: false, width: 200, sortType: 'String', onHover: true, type: 'default', sx: {
                alignItems: 'center', textAlign: 'center', width: '100%',
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
                WebkitLineClamp: "2"
            }
        },
        { key: 'Marca', label: 'Marca', sort: false, width: 200, sortType: 'String', type: 'default', sx: { alignSelf: 'center', textAlign: 'center', alignItems: 'center', } },
        {
            key: ['Linea'], fieldToTake: [
                { key: 'DescrizioneLinea', type: 'default', sx: { alignSelf: 'center' } },
            ], label: 'Linea', width: 300, type: 'default', sx: { alignItems: 'center' }
        },
        {
            key: ['Gruppo'], fieldToTake: [
                { key: 'DescrizioneGruppo', type: 'default', sx: { alignSelf: 'center' } },
            ], label: 'Gruppo', width: 300, type: 'default', sx: { alignItems: 'center' }
        },
        {
            key: 'Fornitori', label: 'Fornitori', sort: false, width: 450, type: 'tag',
            showProps: [{ name: 'toIncrese', icon: icon_TrendingUp({ width: '16px', height: '100%' }) },
            { name: 'toDecrease', icon: icon_TrendingDown({ width: '16px', height: '100%' }) }],
            sx: { alignSelf: 'center' }
        },
    ]);


    // Abort il panding del fetch all server
    const abortController = React.useRef<any>(null);
    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
        }
    };
    //stato del pannello di selezione dei fornitori
    const [suppliersToEditStatus, setSuppliersToEditStatus] = React.useState<boolean>(false);
    const [tourSuppliersModalOpen, setTourSuppliersModalOpen] = React.useState<boolean>(false);
    const ChangeStatusPanelSupplierToEdit = (openedByIndex?: 0 | 1) => {
        if (openedByIndex !== undefined) { setExtraSuppliersPanelOpenedBy(openedByIndex); }
        setSuppliersToEditStatus(!suppliersToEditStatus)
    };

    const [categoryData, setCategoryData] = React.useState<Array<object>>([]);


    //operazioni iniziali.
    React.useEffect(() => {
        if (userContext.details === undefined) { return; }

        TableDataAPI({ userContext, abortController, setTableData, setErr });
        SuppliersListAPI({ userContext, abortController, setSupplierList, setErr })

        return () => {
            cancelRequest();
        };
    }, [userContext.details]);

    const SaveChangedConfiguration = ({ raggruppamento, note, dist_prezzo_suggerito }
        : { raggruppamento: object | null, note: string | null, dist_prezzo_suggerito: string | null }) => {
        if (extraSuppliersPanelOpenedBy === 0) { return };
        const dataToSend = {
            ...selectedItemtoEdit,
            Raggruppamento: raggruppamento,
            note: RemoveSpaceText(note),
            dist_prezzo_suggerito: dist_prezzo_suggerito
        };
        SaveConditionAPI({ userContext, abortController, dataToInsert: dataToSend });
        setSelectedItemtoEdit(null);
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
     * resetta la lista dei fornitori portandola allo stato originale, cioè:
     * { name: "Esprinet" };
     */
    const ResetSuppliersList = () => {
        setSupplierList((prev: { name: string }[]) => {
            const copy = [...prev];
            const restructure = copy.map((e: { name: string }) => { return { name: e.name } });
            return restructure;
        });
    }

    /**
     * Inserisce gli elementi compilati dall'utente come Brand/Categoria/Sotto categoria/Fornitori all'interno
     * della tabella.
     */
    const InsertConditionInTable = () => {
        if (!CheckDataToInsert(dataToInsert)) { return console.error('Sembra esserci un elemento nullo o vuoto') };

        setTableData((prev: any) => {
            const elements = [];

            let prepareObject = {
                Marca: (dataToInsert?.brandSelected?.Marca || "Empty"),
                Categoria: dataToInsert.categorySelected,
                Raggruppamento: dataToInsert?.raggruppamento ? dataToInsert?.raggruppamento?.Codice : null,
                note: RemoveSpaceText(dataToInsert.note),
                dist_prezzo_suggerito: dataToInsert.dist_prezzo_suggerito,
                Fornitori: dataToInsert.distSelected
            };

            if (Array.isArray(dataToInsert?.subcategorySelected) && dataToInsert?.subcategorySelected.length > 0) {
                for (let i = 0; i < dataToInsert?.subcategorySelected.length; i++) {
                    const subcategory = dataToInsert?.subcategorySelected[i];
                    elements.push({
                        ...prepareObject, Sottocategoria: subcategory,
                    });
                };
            } else {
                elements.push({
                    ...prepareObject, Sottocategoria: dataToInsert.subcategorySelected,

                });
            };

            return [...elements, ...prev];
        });

        SaveConditionAPI({ userContext, abortController, dataToInsert });

        MakeEmptyProps({ setData: setDataToInsert });
        ResetSuppliersList();
        setSuppliersFromNewInsert([]);
    };

    /**
     * @param { * } indexValue number | valore numerico tra 0 | 1 che definisce:
     * 0 è un valore che andrà in increseValue;
     * 1 è un valore che andrà in decreaseValue;
     * @param { * } value number | valore effettivo che andrà nella proprietà di destinazione in base a indexValue
     * @param { * } name string | nome del fornitore con il quale si vuole interagire 
     */
    const ChangeValueOnDistSelected = (name: string, indexValue: undefined | number, value: number | string, from?: "disabled" | "hidePrice") => {
        if (typeof value === 'string' && (value as string)?.includes(',')) { return; };

        let value__: string | number = value;
        if ((value as string)[(value as string).length - 1] != ".") {
            value__ = parseFloat(value as string);
        }

        if (extraSuppliersPanelOpenedBy === 0) {
            setDataToInsert((prev: any) => {
                const copyDist = [...prev.distSelected];
                const indexDist = copyDist.findIndex(e => e.name == name);
                if (indexValue !== undefined) {
                    if (indexValue == 0) {
                        delete copyDist[indexDist].toDecrease;
                        copyDist[indexDist].toIncrese = value__;
                        copyDist[indexDist].idIndexOfValue = 1;
                    } else {
                        delete copyDist[indexDist].toIncrese;
                        copyDist[indexDist].toDecrease = value__;
                        copyDist[indexDist].idIndexOfValue = 0;
                    };
                } else if (indexValue === undefined && from) {
                    copyDist[indexDist][from] = value;
                };

                return { ...prev, distSelected: copyDist };
            })
        } else {
            setTableData((prev: any) => {
                const copy = [...prev];
                const findItemIndex = copy.findIndex(e => e.Marca === selectedItemtoEdit.Marca
                    && e.Categoria === selectedItemtoEdit.Categoria && e.Sottocategoria === selectedItemtoEdit.Sottocategoria);
                if (findItemIndex !== -1) {
                    const item = copy[findItemIndex];
                    const indexDist = item.Fornitori.findIndex((e: any) => e.name == name); //index del fornitore
                    if (indexValue !== undefined) {
                        if (indexValue == 0) {
                            delete item.Fornitori[indexDist].toDecrease;
                            item.Fornitori[indexDist].toIncrese = value__;
                            item.Fornitori[indexDist].idIndexOfValue = 1;
                        } else {
                            delete item.Fornitori[indexDist].toIncrese;
                            item.Fornitori[indexDist].toDecrease = value__;
                            item.Fornitori[indexDist].idIndexOfValue = 0;
                        }
                    } else if (indexValue === undefined && from) {
                        copy[findItemIndex].Fornitori[indexDist][from] = value;
                    };
                };

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
    const DeletePropsOnItem = (nameDist: string, namePropsToDelete: string[]) => {
        if (extraSuppliersPanelOpenedBy === 0) {
            setDataToInsert((prev: any) => {
                const copy = { ...prev };
                if (copy.distSelected) {
                    const indexTarget = copy.distSelected.findIndex((e: { name: string }) => e.name === nameDist);
                    if (Boolean(Array.isArray(namePropsToDelete))) {
                        namePropsToDelete.map((nameProps: string) => {
                            delete copy.distSelected[indexTarget][nameProps];
                        })
                    }
                }
                return copy
            })
        } else {
            setTableData((prev: any) => {
                const copy = [...prev];
                const findItemIndex = copy.findIndex(e => e.Marca === selectedItemtoEdit.Marca
                    && e.Categoria === selectedItemtoEdit.Categoria && e.Sottocategoria === selectedItemtoEdit.Sottocategoria);
                if (findItemIndex !== -1) {
                    const item = copy[findItemIndex];
                    const indexTarget = item.Fornitori.findIndex((e: { name: string }) => e.name == nameDist);
                    if (item.Fornitori && indexTarget != -1) {
                        if (Boolean(Array.isArray(namePropsToDelete))) {
                            namePropsToDelete.map((nameProps: string) => {
                                delete item.Fornitori[indexTarget][nameProps];
                            })
                        }
                    }
                }
                return copy
            })
        }
    };

    /**
     * Funzione che ha lo scopo di fare il retrive dei dati salvati in base alla provenienza del click.
     * @param nameDist String | nome del fornitore da ricercare
     * @returns Oggetto elemento contenete i dati del fornitore nello statehook.
     */
    const RetriveDistData = (nameDist: string) => {
        if (extraSuppliersPanelOpenedBy === 0) {
            const indexDist = dataToInsert.distSelected.findIndex((e: distSelectedProps) => e.name === nameDist);
            return dataToInsert.distSelected[indexDist];
        } else {
            const indexDist = selectedItemtoEdit.Fornitori.findIndex((e: distSelectedProps) => e.name === nameDist);
            return selectedItemtoEdit.Fornitori[indexDist];
        };
    };

    /**
     * Cerca i raggruppamenti in base al item aperto.
     * @returns Array di raggruppamenti
     */
    const RetriveRaggruppmanetoData = () => {
        if (!selectedItemtoEdit) { return };
        const x = selectedItemtoEdit; //elemento selezionato
        const dataList = (categoryData as any);
        let raggruppamento;

        const brandIndex_ = dataList.findIndex((e: any) => e.Marca === x.Marca);
        if (brandIndex_ !== -1) {
            const catIndex_ = dataList[brandIndex_].Categories.findIndex((e: any) => e.Linea === x.Categoria.Linea);
            if (catIndex_ !== -1) {
                const subCatIndex_ = dataList[brandIndex_].Categories[catIndex_].SubCategory.findIndex((e: any) => e.Gruppo === x.Sottocategoria.Gruppo);
                if (subCatIndex_ !== -1) {
                    raggruppamento = dataList[brandIndex_].Categories[catIndex_].SubCategory[subCatIndex_].Raggruppamento;
                }
            }
        }

        return raggruppamento;
    };


    //

    const tour = useSectionTour({
        id: 'nex_v2_fornitori',
        version: '2.0.0',
        user: {
            id: userContext?.details?._id ?? '',
            role: (userContext?.details?.ruolo as Role) ?? 'Tester',
        },
        keys: 'fornitori',
        actions: {
            4: () => { setSuppliersToEditStatus(false); setTourSuppliersModalOpen(false); },
            5: () => { setSuppliersToEditStatus(true); setTourSuppliersModalOpen(true); },
            6: () => { setSuppliersToEditStatus(true); setTourSuppliersModalOpen(true); },
            7: () => { setSuppliersToEditStatus(false); setTourSuppliersModalOpen(false); },
        }
    });

    //

    const { isOpen, index: tourIndex } = useTour();
    const modalStatus = suppliersToEditStatus || (isOpen && tourSuppliersModalOpen);
    const lockInteractions = isOpen && tourIndex === 8;

    return <DashboardLayout>
        {/*!err*/ true ? <React.Fragment>
            <Stack gap={2}>
                <FDBox variant='gradient' pad='md' className='space-y-4 z-3' radius='xl' border={true} shadow='sm'>
                    <AddElements ChangeStatusPanelSupplierToEdit={ChangeStatusPanelSupplierToEdit}
                        dataToInsert={dataToInsert} setDataToInsert={setDataToInsert} TagDist={TagDist}
                        InsertConditionInTable={InsertConditionInTable} saveBtnState={CheckDataToInsert(dataToInsert)}
                        tableData={tableData} openErrorSB={openErrorSB} categoryData={categoryData} setCategoryData={setCategoryData} />
                </FDBox>

                <Fade in={true} timeout={300}>
                    <Card data-tour="fornitori-tabella">
                        <TableVirtualized
                            data={tableData}
                            setData={setTableData}
                            results={tableData.length}
                            columns={columns}
                            setColumns={setColumns}
                            height="calc(100vh - 340px)"
                        />
                        {lockInteractions && (
                            <div
                                aria-hidden="true"
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    zIndex: 10,
                                    pointerEvents: 'auto',
                                }}
                                onClickCapture={(e) => e.stopPropagation()}
                            />
                        )}
                    </Card>
                </Fade>
            </Stack>
            <SupplierToEdit supplierList={supplierList} status={modalStatus}
                ChangeStatus={ChangeStatusPanelSupplierToEdit} HandleDistToInsert={HandleDistToInsert}
                ChangeValueOnDistSelected={ChangeValueOnDistSelected} UpdateSuppliersActived={UpdateSuppliersActived}
                suppliersFromNewInsert={suppliersFromNewInsert} suppliersFromEditItem={suppliersFromEditItem}
                DeletePropsOnItem={DeletePropsOnItem} openedBy={extraSuppliersPanelOpenedBy} RetriveDistData={RetriveDistData}
                SaveChangedConfiguration={SaveChangedConfiguration} RetriveRaggruppmanetoData={RetriveRaggruppmanetoData}
                selectedItemtoEdit={selectedItemtoEdit} setTableData={setTableData} ResetSuppliersList={ResetSuppliersList}
                dataToInsert={dataToInsert} setDataToInsert={setDataToInsert} />
        </React.Fragment> : <GeneralError img={ErrorIMG} />}
        {renderErrorSB}
        <Tooltip id="general-confg-suppliers-tooltip" place="bottom" style={{
            maxWidth: "15vw", minWidth: 150, fontSize: '0.87rem', zIndex: 9999,
            textAlign: 'center'
        }} />
    </DashboardLayout>
}