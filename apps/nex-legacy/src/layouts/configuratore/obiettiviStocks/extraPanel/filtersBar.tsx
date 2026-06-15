import React from 'react';
import { UserContext } from "context/UserContext";

import { Divider, Fade, IconButton, Stack, Typography } from '@mui/material';
import VirtualizedList from "../virtualizedCategoryFilter";
import { icon_save, icon_search } from 'config/icons';
import { CategoryListAPI } from '../fetchData/categoryList';
import LoadingButton from '@mui/lab/LoadingButton';
import { MainTheme } from 'assets/settingsTheme';
import MDButton from 'components/MDButton';
import { useNexTheme } from '@nex/theme-system';
import { enqueueSnackbar } from 'components/MessageBox/SnackbarProvider/SnackbarProvider';

interface distSelectedProps {
    name: string;
    value?: number;
}
interface dataToInsertProps {
    buyerSelected: any;
    brandSelected: any;
    categorySelected: any;
    subcategorySelected: any;
    raggruppamento: any;
    quarters: Array<distSelectedProps>;
}

interface AddElementsProps {
    ChangeStatusPanelSupplierToEdit: (openedByIndex: 0 | 1) => void;
    dataToInsert: dataToInsertProps;
    setDataToInsert: (prev: any) => void;
    TagDist: any;
    InsertConditionInTable: () => Array<object>;
    saveBtnState: boolean;
    tableData: any;
    Search: () => void;
    onLoad: boolean;
}


export const FiltersBar: React.FC<AddElementsProps> = ({ ChangeStatusPanelSupplierToEdit, dataToInsert, setDataToInsert,
    TagDist, InsertConditionInTable, saveBtnState, tableData, Search, onLoad,
}) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const [userContext, setUserContext] = React.useContext<any>(UserContext);
    const [data, setData] = React.useState<Array<object>>([]);
    const [groupings, setGroupings] = React.useState<Array<object>>([]);

    //dati che permetto la creazione dei select a filtraggio.
    const dataSelects = [
        {
            label: "Marca",
            ref: "Marca",
            stateRef: dataToInsert.brandSelected,
            noneOnClick: () => {
                HandleDataToInsert('brandSelected', null);
                HandleDataToInsert('categorySelected', null);
                HandleDataToInsert('subcategorySelected', null);
            },
            menuItemOnClick: (item: object) => {
                HandleDataToInsert("brandSelected", item);
                HandleDataToInsert('categorySelected', null);
                HandleDataToInsert('subcategorySelected', null);
            },
            dataArray: data[dataToInsert.buyerSelected?.Codice]
        },
        {
            label: "Categorie",
            ref: "DescrizioneLinea",
            stateRef: dataToInsert.categorySelected,
            noneOnClick: () => {
                HandleDataToInsert('categorySelected', null);
                HandleDataToInsert('subcategorySelected', null);
            },
            menuItemOnClick: (item: object) => {
                HandleDataToInsert("categorySelected", item);
                HandleDataToInsert('subcategorySelected', null);
            },
            dataArray: dataToInsert.brandSelected?.Categories
        },
        {
            label: "Famiglia",
            ref: "DescrizioneGruppo",
            stateRef: dataToInsert.subcategorySelected,
            noneOnClick: () => {
                HandleDataToInsert('subcategorySelected', null);
            },
            menuItemOnClick: (item: object) => {
                HandleDataToInsert("subcategorySelected", item);
            },
            dataArray: dataToInsert.categorySelected?.SubCategory
        },
    ];

    // Abort il panding del fetch all server
    const abortController = React.useRef<AbortController | null>(null);
    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
        }
    };


    const HandleDataToInsert = (props: string, value: any) => {
        setDataToInsert((prev: any) => {
            const copy = { ...prev };
            copy[props] = value;
            return copy;
        })
    }

    //operazioni iniziali.
    React.useEffect(() => {
        if (userContext.details === undefined) { return; }

        CategoryListAPI({ userContext, abortController, setData, setGroupings })

        return () => {
            cancelRequest();
        }
    }, [userContext.details])

    const filterRender = React.useMemo(() => (
        <Stack gap={1} direction='row' sx={{
            alignItems: "flex-start",
            width: '100%',
            flexWrap: "wrap",
            padding: "20px",
            backgroundColor: `${darkMode ? palette.grey[700] : palette.primary.light}`,
            borderRadius: "20px",
        }}>
            {dataSelects.map((elements, index) => {
                return <React.Fragment key={index}>
                    <VirtualizedList
                        key={index}
                        data={elements}
                        HandleDataToInsert={HandleDataToInsert}
                        dataToInsert={dataToInsert}
                        brandSelected={"brandSelected"}
                        categorySelected={"categorySelected"}
                    // subcategorySelected={"subcategorySelected"}
                    />
                    {(dataSelects.length - 1) !== index && ">"}
                </React.Fragment>
            })}
            {/* {dataSelects.map((elements, index) => {
                const shouldRender = elements.dataArray && elements.dataArray.length > 0;
                return shouldRender ? (
                    <React.Fragment key={index}>
                        <VirtualizedList
                            data={elements}
                            HandleDataToInsert={HandleDataToInsert}
                            dataToInsert={dataToInsert}
                            brandSelected="brandSelected"
                            categorySelected="categorySelected"
                        />
                        {(dataSelects.length - 1) !== index && ">"}
                    </React.Fragment>
                ) : null;
            })} */}
        </Stack>
    ), [dataToInsert, data, darkMode])

    //elimina brand, categorie e gruppi una volta inseriti in tabella.
    const DeleteConditionsFromList = ({ dataToCheck }: { dataToCheck: Array<object> }) => {
        setData((prev: any) => {
            const copy = [...prev[dataToInsert.buyerSelected.Codice]];
            const brandIndex = copy.findIndex((e: any) => e.Marca === dataToInsert.brandSelected.Marca);

            if (brandIndex !== -1) {
                const Categories = copy[brandIndex].Categories;
                const categoriesIndex = Categories.findIndex((e: any) => e.Linea === dataToInsert.categorySelected.Linea);
                if (categoriesIndex !== -1) {
                    const subCategory = Categories[categoriesIndex].SubCategory;
                    const subGroupIndex = subCategory.findIndex((e: any) => e.Gruppo === dataToInsert.subcategorySelected.Gruppo);

                    const raggr_ = subCategory[subGroupIndex].Raggruppamento;

                    if (dataToInsert.raggruppamento) {
                        const raggrIndex = subCategory[subGroupIndex].Raggruppamento.findIndex((e: { Codice: string }) => e === dataToInsert.raggruppamento.Codice);
                        if (raggrIndex !== -1) {
                            raggr_.splice(raggrIndex, 1) //elimina l'oggetto raggruppamento interessato.
                        }
                    };


                    //TODO : SEMBRA CHE NON CANCELLI LA SOTTOCATEGORIA QUANDO VIENE INSERITO PRIMA LA CONFIG. BASE E POI QUELLA
                    //CON IL RAGGRUPPAMENTO.


                    //controlla se la versione base è già in tabella
                    const checkIfInTable = dataToCheck.findIndex((e: any) => e.Categoria.Linea === dataToInsert.categorySelected.Linea &&
                        e.Sottocategoria.Gruppo === dataToInsert.subcategorySelected.Gruppo && e.Marca === dataToInsert.brandSelected.Marca /*&& e.Raggruppamento == null*/);

                    console.log("QUA", checkIfInTable)
                    //console.log(raggr_.length, checkIfInTable, Boolean(raggr_.length === 0 && checkIfInTable !== -1), (raggr_.length === 0 && checkIfInTable === -1 && dataToInsert.raggruppamento == null))
                    //se la versione della configurazione base (senza raggruppamento) è già in tabella e non ha ragruppamenti nell'array allora
                    //elimina il gruppo e viceversa ( se c'è in tabella ma ha raggruppamenti mostra il gruppo fino a che non viene inserito nello specifico).
                    if ((/*raggr_.length === 0 &&*/ checkIfInTable !== -1) /*||
                        (raggr_.length === 0 && checkIfInTable === -1 && dataToInsert.raggruppamento == null)*/) {
                        if (subGroupIndex !== -1) {
                            subCategory.splice(subGroupIndex, 1); //elimina la sottocategoria inserita.
                        };
                    };

                    //dopo aver eliminato la sottocategoria controlla la categoria ed eliminala se non ha sottocategorie all'interno.
                    if (subCategory.length === 0) {
                        Categories.splice(categoriesIndex, 1)
                    };

                    //controlla la dimensione dell'array in modo che se è vuoto elimina il brand, perche è stato già inserito.
                    if (Categories.length === 0) {
                        copy.splice(brandIndex, 1);
                    };
                }
            };


            return { ...prev, [dataToInsert.buyerSelected.Codice]: copy };
        })
    };


    /**
     *Controlla se i dati inseriti dall'utente siano già presenti all'interno della tabella.
     *qualora fossero già presenti
      @return Boolean.
     */
    const CheckIfDataIsAlreadyIn: () => Boolean = () => {
        const checkIfInTable = tableData.findIndex((e: any) => e.Categoria.Linea === dataToInsert.categorySelected.Linea &&
            e.Marca === dataToInsert.brandSelected.Marca &&
            (dataToInsert.raggruppamento !== null ? (e.Raggruppamento == dataToInsert.raggruppamento.Codice) : true) &&
            (dataToInsert.subcategorySelected !== null ? (e.Sottocategoria.Gruppo == dataToInsert.subcategorySelected.Gruppo) : true)
        );
        return Boolean(checkIfInTable !== -1);
    }

    const Save = () => {
        if (CheckIfDataIsAlreadyIn()) {
            enqueueSnackbar("L'elemento è gia presente nella tabella, perfavore inserisci un'altra configurazione.", {
                title: 'Ops..',
                type: 'info',
            });
            return;
        }
        const dataToPass = InsertConditionInTable();
        if (Array.isArray(dataToPass)) {
            DeleteConditionsFromList({ dataToCheck: dataToPass });
        }
    }



    return <React.Fragment>
        <Stack direction='row' justifyContent='space-between' gap={2}>
            <Stack direction='row' pl={2.5} gap={1}>
                {data &&
                    (Object.keys(data).length > 0 ? <VirtualizedList data={{
                        label: "Buyer",
                        ref: "Codice",
                        stateRef: dataToInsert.buyerSelected,
                        noneOnClick: () => {
                            HandleDataToInsert('buyerSelected', null);
                            HandleDataToInsert('brandSelected', null);
                            HandleDataToInsert('categorySelected', null);
                            HandleDataToInsert('subcategorySelected', null);
                        },
                        menuItemOnClick: (item: object) => {
                            HandleDataToInsert("buyerSelected", { Codice: item });
                        },
                        dataArray: Object.keys(data),
                        width: 170,
                    }}
                        HandleDataToInsert={HandleDataToInsert}
                        dataToInsert={dataToInsert} />
                        :
                        <Fade in={true}>
                            <Typography sx={{ fontSize: '0.7rem', alignSelf: 'center' }}>
                                Non ci sono Buyers</Typography>
                        </Fade>)}
                <LoadingButton onClick={() => Search()} loading={onLoad}
                    data-tooltip-id='general-confg-suppliers-tooltip' data-tooltip-content='Cerca gli elementi di questo buyer già inseriti in tabella'>
                    {icon_search({ width: 20, height: 20, })}
                </LoadingButton>
            </Stack>
            <Divider orientation='vertical' sx={{ backgroundColor: '#7c7c7c', margin: 0, mr: 3 }} />

            <Stack direction='row' gap={1} mr='auto'>
                <MDButton variant='contained' color={`${darkMode ? "primary" : "secondary"}`}
                    onClick={() => ChangeStatusPanelSupplierToEdit(0)}>
                    Inserisci i valori
                </MDButton>
                <TagDist distSelected={dataToInsert.quarters} />
            </Stack>

            <Stack direction='row'>
                <Divider orientation='vertical' sx={{ backgroundColor: '#7c7c7c' }} />
                <IconButton disabled={!saveBtnState} onClick={() => Save()}>
                    {icon_save({
                        color: `${!saveBtnState ?
                            darkMode ? palette.grey[800] : palette.grey[300]
                            : darkMode ? palette.grey[500] : palette.grey[600]}`
                    })}
                </IconButton>
            </Stack>

        </Stack>
        {filterRender}
    </React.Fragment>
}