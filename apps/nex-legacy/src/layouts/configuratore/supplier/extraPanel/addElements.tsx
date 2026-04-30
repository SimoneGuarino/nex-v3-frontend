import React from 'react';
//components
import { UserContext } from "context/UserContext";
import { icon_note } from 'config/icons';
import { CategoryListAPI } from '../fetchData/categoryList';
import { MainTheme } from 'assets/settingsTheme';
import { Tag } from 'components/Tag/Tag';
import FDButton from 'components/UI/buttons/FDButton';
import FDSelect from 'components/UI/input/FDSelect';
import FDIconButton from 'components/UI/buttons/FDIconButton';
//icons
import { IoSaveOutline } from "react-icons/io5";
import { Label } from 'recharts';
import { useNexTheme } from '@nex/theme-system';

const IoSaveOutlineIcon = IoSaveOutline as React.FC<{ size?: string | number }>;


interface distSelectedProps {
    name: string;
    toIncrese?: number;
    toDecrease?: number;
};
interface dataToInsertProps {
    brandSelected: any;
    categorySelected: any;
    subcategorySelected: any;
    raggruppamento: any;
    note: string | null;
    distSelected: Array<distSelectedProps>;
};
interface AddElementsProps {
    ChangeStatusPanelSupplierToEdit: (openedByIndex: 0 | 1) => void;
    dataToInsert: dataToInsertProps;
    setDataToInsert: (prev: any) => void;
    TagDist: any;
    InsertConditionInTable: () => void;
    saveBtnState: boolean;
    tableData: any;
    openErrorSB: (icon: string, message: string) => void;

    categoryData: any;
    setCategoryData: (prev: any) => void;
};


export const AddElements: React.FC<AddElementsProps> = ({ ChangeStatusPanelSupplierToEdit, dataToInsert, setDataToInsert,
    TagDist, InsertConditionInTable, saveBtnState, tableData, openErrorSB, categoryData, setCategoryData,
}) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const [userContext, setUserContext] = React.useContext<any>(UserContext);
    const [groupings, setGroupings] = React.useState<Array<object>>([]);

    //dati che permetto la creazione dei select a filtraggio.
    const dataSelects = [
        {
            label: "Marca",
            ref: "Marca",
            tour: "fornitori-fil-marca",
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
            dataArray: categoryData
        },
        {
            label: "Linea",
            ref: "DescrizioneLinea",
            tour: "fornitori-fil-linea",
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
            label: "Gruppo",
            ref: "DescrizioneGruppo",
            tour: "fornitori-fil-gruppo",
            stateRef: (dataToInsert.subcategorySelected || []),
            noneOnClick: () => {
                HandleDataToInsert('subcategorySelected', null);
            },
            menuItemOnClick: (item: object) => {
                HandleDataToInsert("subcategorySelected", item);
            },
            multiSelect: true,
            dataArray: dataToInsert.categorySelected?.SubCategory
        },
    ];
    const raggruppamentoElement = {
        label: "Raggruppamento",
        ref: "Codice",
        stateRef: dataToInsert.raggruppamento,
        noneOnClick: () => {
            HandleDataToInsert('raggruppamento', null);
        },
        menuItemOnClick: (item: object) => {
            HandleDataToInsert("raggruppamento", { Codice: item });
        },
        dataArray: dataToInsert.subcategorySelected?.Raggruppamento,
        width: 170,
    };

    // Abort il panding del fetch all server
    const abortController = React.useRef<AbortController | null>(null);
    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
        }
    };
    //inserisce i dati selezionati dall'utente nell'oggetto dataToInsert.
    const HandleDataToInsert = (props: string, value: any) => {
        setDataToInsert((prev: any) => {
            const copy = { ...prev };
            copy[props] = value;
            return copy;
        })
    };

    //operazioni iniziali.
    React.useEffect(() => {
        if (userContext.details === undefined) { return; }

        CategoryListAPI({ userContext, abortController, setBrandsCategoryData: setCategoryData, setGroupings })

        return () => {
            cancelRequest();
        }
    }, [userContext.details])

    const filterRender = React.useMemo(() => (
        <div className='flex space-x-2 text-white'>
            {dataSelects.map((elements, index) => {
                return <div
                    key={index}
                    className="w-full"
                    data-tour={elements.tour}
                ><FDSelect
                        options={elements?.dataArray?.map((item: any) => ({ label: item[elements.ref], value: item })) ?? []}
                        value={elements.stateRef as any}
                        onChange={(v: any) => elements.menuItemOnClick(v)}
                        placeholder=""
                        label={elements.label}
                        size="sm"
                        variant="outline"
                        radius="md"
                        fullWidth
                        searchable
                        menuMaxHeight={240}
                    /></div>
            })}
        </div>
    ), [dataToInsert, categoryData, palette])

    //elimina brand, categorie e gruppi una volta inseriti in tabella.
    const DeleteConditionsFromList = () => {
        setCategoryData((prev: any) => {
            const copy = [...prev];
            const brandIndex = copy.findIndex((e: any) => e.Marca === dataToInsert.brandSelected.Marca);

            if (brandIndex !== -1) {
                const Categories = copy[brandIndex].Categories;
                const categoriesIndex = Categories.findIndex((e: any) => e.Linea === dataToInsert.categorySelected.Linea);
                if (categoriesIndex !== -1) {
                    const subCategory = Categories[categoriesIndex].SubCategory;
                    if (Array.isArray(dataToInsert.subcategorySelected)) {
                        //se sono stati selezionati più gruppi allora elimina tutti i gruppi selezionati.
                        dataToInsert.subcategorySelected.forEach((subcategory: any) => {
                            const subGroupIndex = subCategory.findIndex((e: any) => e.Gruppo === subcategory.Gruppo);
                            if (subGroupIndex !== -1) {
                                const raggr_ = subCategory[subGroupIndex].Raggruppamento;

                                if (subcategory.Raggruppamento) {
                                    const raggrIndex = subCategory[subGroupIndex].Raggruppamento.findIndex((e: { Codice: string }) => e === subcategory.Raggruppamento.Codice);
                                    if (raggrIndex !== -1) {
                                        raggr_.splice(raggrIndex, 1) //elimina l'oggetto raggruppamento interessato.
                                    }
                                };

                                //controlla se la versione base è già in tabella
                                const checkIfInTable = tableData.findIndex((e: any) => e.Categoria.Linea === dataToInsert.categorySelected.Linea &&
                                    e.Sottocategoria.Gruppo === subcategory.Gruppo && e.Marca === dataToInsert.brandSelected.Marca &&
                                    e.Raggruppamento == null);

                                //se la versione della configurazione base (senza raggruppamento) è già in tabella e non ha ragruppamenti nell'array allora
                                //elimina il gruppo e viceversa ( se c'è in tabella ma ha raggruppamenti mostra il gruppo fino a che non viene inserito nello specifico).
                                if ((raggr_.length === 0 && checkIfInTable !== -1) ||
                                    (raggr_.length === 0 && checkIfInTable === -1 && subcategory.Raggruppamento == null)) {
                                    if (subGroupIndex !== -1) {
                                        subCategory.splice(subGroupIndex, 1); //elimina la sottocategoria inserita.
                                    };
                                };
                            };
                        });
                    } else {
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
                        const checkIfInTable = tableData.findIndex((e: any) => e.Categoria.Linea === dataToInsert.categorySelected.Linea &&
                            e.Sottocategoria.Gruppo === dataToInsert.subcategorySelected.Gruppo && e.Marca === dataToInsert.brandSelected.Marca &&
                            e.Raggruppamento == null);

                        //se la versione della configurazione base (senza raggruppamento) è già in tabella e non ha ragruppamenti nell'array allora
                        //elimina il gruppo e viceversa ( se c'è in tabella ma ha raggruppamenti mostra il gruppo fino a che non viene inserito nello specifico).
                        if ((raggr_.length === 0 && checkIfInTable !== -1) ||
                            (raggr_.length === 0 && checkIfInTable === -1 && dataToInsert.raggruppamento == null)) {
                            if (subGroupIndex !== -1) {
                                subCategory.splice(subGroupIndex, 1); //elimina la sottocategoria inserita.
                            };
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
            }

            return copy;
        })
    }

    /**
     *Controlla se i dati inseriti dall'utente siano già presenti all'interno della tabella.
     *qualora fossero già presenti
      @return Boolean.
     */
    const CheckIfDataIsAlreadyIn: () => Boolean = () => {
        if (!dataToInsert.categorySelected || !dataToInsert.subcategorySelected || !dataToInsert.brandSelected) {
            openErrorSB("info", "Perfavore seleziona tutti i campi prima di salvare.");
            return true;
        };

        if (Array.isArray(dataToInsert.subcategorySelected) && dataToInsert.subcategorySelected.length > 0) {
            for (let i = 0; i < dataToInsert.subcategorySelected.length; i++) {
                const subcategorySelected = dataToInsert.subcategorySelected[i];
                const checkIfInTable = tableData.findIndex((e: any) => e.Categoria.Linea === dataToInsert.categorySelected.Linea &&
                    e.Sottocategoria.Gruppo === subcategorySelected.Gruppo && e.Marca === dataToInsert.brandSelected.Marca &&
                    ((e.Raggruppamento || null) == dataToInsert.raggruppamento));
                if (checkIfInTable !== -1) {
                    return true;
                };
            };
        };

        return false;
    };

    // Funzione per salvare i dati
    const Save = () => {
        if (CheckIfDataIsAlreadyIn()) {
            return openErrorSB("info",
                "L'elemento è gia presente nella tabella, perfavore inserisci un'altra configurazione.");
        };
        InsertConditionInTable();
        DeleteConditionsFromList();
    };

    return <React.Fragment>
        {filterRender}
        <div className='flex justify-between items-center'>
            {/* Aggiunta di condizione Fornitore */}
            <div className='flex space-x-2 w-full items-center'>
                <span data-tour="fornitori-condizioni" >
                    <FDButton color='primary' size="small" onClick={() => ChangeStatusPanelSupplierToEdit(0)}>
                        Condizioni
                    </FDButton></span>
                {/* Select Raggruppamento e Salva */}
                {dataToInsert.subcategorySelected?.Raggruppamento && Array.isArray(dataToInsert.subcategorySelected?.Raggruppamento) &&
                    (dataToInsert.subcategorySelected?.Raggruppamento.length > 0 ?
                        <FDSelect
                            options={raggruppamentoElement?.dataArray?.map((item: any) => ({ label: item, value: item })) ?? []}
                            value={dataToInsert.raggruppamento?.Codice}
                            onChange={(v: any) => raggruppamentoElement.menuItemOnClick(v)}
                            placeholder="Tutte"
                            size="sm" variant="outline" radius="md" fullWidth containerClassName='max-w-42'
                            menuMaxHeight={240}
                        /> : <p className='text-xs text-neutral-500 italic'>Questo gruppo non ha prodotti con raggruppamenti</p>)}
                <TagDist distSelected={dataToInsert.distSelected} />
            </div>

            {/* Note Tag */}
            {dataToInsert.note && dataToInsert.note.length > 0 && <Tag
                icon={icon_note({ color: `${darkMode ? palette.grey[500] : palette.grey[600]}`, width: "1.2rem", height: "1.2rem" })}
                text={dataToInsert.note.slice(0, 20) + (dataToInsert.note.length > 20 ? "..." : "")}
                sx={{ mr: 1 }}
                data_tooltip_id="general-confg-suppliers-tooltip"
                data_tooltip_content={dataToInsert.note}
            />}
            {/* Salva Condizione */}
            <FDIconButton dataTour="fornitori-save" icon={<IoSaveOutlineIcon size={20} />} onClick={Save} disabled={!saveBtnState} />
        </div>
    </React.Fragment>
}