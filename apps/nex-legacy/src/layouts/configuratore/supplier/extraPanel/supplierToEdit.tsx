import React from 'react';

import {
    Backdrop, Card, Checkbox, InputAdornment,
    Stack, TextField, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import { PopupInfo } from 'components/PopupInfo';
import { icon_TrendingDown, icon_TrendingUp, icon_info, icon_percent } from 'config/icons';
import './supplierToEdit-style.css';
import VirtualizedList from "../virtualizedCategoryFilter";
import { Tag } from 'components/Tag/Tag';
import { MainTheme } from 'assets/settingsTheme';
import MDTypography from 'components/MDTypography';
import { RemoveSpaceText } from 'utils/sanitize';
import { IoCloseSharp, IoNewspaperOutline } from "react-icons/io5";
import FDIconButton from 'components/UI/buttons/FDIconButton';
import FDSelect from 'components/UI/input/FDSelect';
import FDInput from 'components/UI/input/FDInput';
import { useTour } from "tour/TourProvider";
import { useNexTheme } from '@nex/theme-system';
const CloseIcon = IoCloseSharp as React.FC<{ size?: number, className?: string }>;
const NewspaperIcon = IoNewspaperOutline as React.FC<{ size?: number, className?: string }>;


interface distSelectedProps {
    name: string;
    toIncrese?: number;
    toDecrease?: number;
    idIndexOfValue?: number;
    disabled?: boolean;
    hidePrice?: boolean;
};
interface dataToInsertProps {
    brandSelected: { Marca: string, PrefissiFornitore: Array<object> } | null;
    categorySelected: any;
    subcategorySelected: any;
    raggruppamento: any;
    note: string | null;
    distSelected: Array<distSelectedProps>;
    dist_prezzo_suggerito: string | null;
}


const LabeledCheckbox = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (event: React.ChangeEvent<HTMLInputElement>) => void; }) => (
    <div className="flex flex-col items-center gap-1">
        <MDTypography variant="body2" className="!text-xs">{label}</MDTypography>
        <Checkbox
            checked={checked}
            onChange={onChange}
            inputProps={{ 'aria-label': label }}
            sx={{ '&.MuiButtonBase-root svg': { borderColor: '#777' } }}
        />
    </div>
);


interface SingleButtonSupplierPorps {
    //openedBy : 0 | 1; //0 => Inserisci Nuova Condizione || 1 => Modifica Condizione Esistente in tabella
    dist: { name: string };
    data: (nameDist: string) => distSelectedProps;
    index: number;
    HandleDistToInsert: (checkbox: boolean, dist: distSelectedProps) => void;
    ChangeValueOnDistSelected: (name: string, indexValue: undefined | 0 | 1, value: number | string, from?: "disabled" | "hidePrice") => void;
    actived: boolean;
    UpdateSuppliersActived: (distName: string) => void;
    DeletePropsOnItem: (nameDist: string, namePropsToDelete: string[]) => void;
};
const SingleButtonSupplier: React.FC<SingleButtonSupplierPorps> = ({ data, dist, index, HandleDistToInsert,
    ChangeValueOnDistSelected, actived, UpdateSuppliersActived, DeletePropsOnItem,
}) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const CheckedBox_init = data(dist.name) ?
        Boolean(data(dist.name).idIndexOfValue) : false;
    const [reChargeStat, setReChargeStat] = React.useState<boolean>(CheckedBox_init);
    const ChangeReChargeStat = () => {
        if (reChargeStat) {
            DeletePropsOnItem(dist.name, ['toIncrese', 'toDecrease', 'idIndexOfValue']);
        }
        setReChargeStat(!reChargeStat);
    };

    const ChangeChecked = () => {
        HandleDistToInsert(!actived, dist);
        UpdateSuppliersActived(dist.name);
    };

    const [indexValue, setIndexValue] = React.useState<0 | 1>(0);
    const ChangeIndexValue = (event: any, value: 0 | 1) => {
        setIndexValue(value);
        ChangeValueOnDistSelected(dist.name, value, 0)
    };

    const { isOpen, index: tourIndex } = useTour();
    const lockInteractions = isOpen && tourIndex === 5;

    return <div
        key={index}
        className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 !p-4 !mr-2 rounded-xl transition-opacity ${actived
            ? 'opacity-100 border-1 dark:border-neutral-700 border-neutral-300 dark:bg-neutral-700 bg-white-300'
            : 'opacity-50 dark:bg-neutral-900 bg-gray-300'
            }`}
    >{lockInteractions && (
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
        <div className="flex flex-col items-center">
            <MDTypography variant="body2" className="text-xs">Attiva</MDTypography>
            <Checkbox
                checked={actived}
                onChange={ChangeChecked}
                inputProps={{ 'aria-label': 'Attiva' }}
                sx={{ '&.MuiButtonBase-root svg': { borderColor: '#777' } }}
            />
        </div>

        <MDTypography variant="h5" className="md:ml-4">{dist.name}</MDTypography>

        {actived && (
            <div className="flex flex-wrap md:flex-nowrap items-center justify-start gap-4 ml-auto w-full md:w-auto">

                <LabeledCheckbox
                    label="Nascondi Prezzo"
                    checked={data(dist.name)?.hidePrice || false}
                    onChange={(e: any) =>
                        ChangeValueOnDistSelected(dist.name, undefined, e.target.checked, 'hidePrice')
                    }
                />

                <LabeledCheckbox
                    label="Rimani Disabilitato"
                    checked={data(dist.name)?.disabled || false}
                    onChange={(e: any) =>
                        ChangeValueOnDistSelected(dist.name, undefined, e.target.checked, 'disabled')
                    }
                />

                <div className="flex items-center gap-2 border-l border-gray-300 dark:border-neutral-600 pl-4">
                    <Checkbox
                        className="checkbox-suppliers"
                        checked={reChargeStat}
                        onChange={ChangeReChargeStat}
                        color="secondary"
                    />
                    <div
                        className={`flex gap-2 items-center ${!reChargeStat ? 'opacity-50 grayscale blur-[1px]' : ''
                            }`}
                    >
                        <ToggleButtonGroup
                            disabled={!reChargeStat}
                            color="primary"
                            value={indexValue}
                            exclusive
                            onChange={ChangeIndexValue}
                            aria-label="Selettore modifica prezzo"
                        >
                            <ToggleButton value={0}>
                                {icon_TrendingUp({ color: darkMode ? palette.white.main : '' })}
                            </ToggleButton>
                            <ToggleButton value={1}>
                                {icon_TrendingDown({ color: darkMode ? palette.white.main : '' })}
                            </ToggleButton>
                        </ToggleButtonGroup>

                        <TextField
                            label={indexValue === 0 ? 'Aumenta Prezzo' : 'Diminuisci Prezzo'}
                            value={
                                indexValue === 0
                                    ? data(dist.name).toIncrese || 0
                                    : data(dist.name)?.toDecrease || 0
                            }
                            onChange={(e) =>
                                ChangeValueOnDistSelected(dist.name, indexValue, e.target.value)
                            }
                            disabled={!reChargeStat}
                            className="max-w-[13ch]"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        {icon_percent({ color: darkMode ? palette.white.main : '' })}
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </div>
                </div>
            </div>
        )}
    </div>
};


// Props for the SupplierToEdit component
interface SupplierToEditProps {
    openedBy: 0 | 1; //0 => Inserisci Nuova Condizione || 1 => Modifica Condizione Esistente in tabella
    supplierList: Array<distSelectedProps>;
    status: boolean;
    selectedItemtoEdit: any;
    ChangeStatus: () => void;
    HandleDistToInsert: (checkbox: boolean, dist: distSelectedProps) => void;
    ChangeValueOnDistSelected: (name: string, indexValue: undefined | 0 | 1, value: number | string, from?: "disabled" | "hidePrice") => void;
    UpdateSuppliersActived: (distName: string) => void;
    suppliersFromNewInsert: String[];
    suppliersFromEditItem: String[];
    DeletePropsOnItem: (nameDist: string, namePropsToDelete: string[]) => void;
    RetriveDistData: (nameDist: string) => distSelectedProps;
    SaveChangedConfiguration: (prev: { raggruppamento: object | null, note: string | null, dist_prezzo_suggerito: string | null }) => void;
    RetriveRaggruppmanetoData: () => string[];
    setTableData: (prev: any) => void;
    ResetSuppliersList: () => void;
    setDataToInsert: (prev: any) => void; // Used when openedBy === 0 to set the data for a new item
    dataToInsert: dataToInsertProps;
};
export const SupplierToEdit: React.FC<SupplierToEditProps> = ({ supplierList, ResetSuppliersList, status, ChangeStatus, HandleDistToInsert,
    ChangeValueOnDistSelected, UpdateSuppliersActived, suppliersFromNewInsert, suppliersFromEditItem, selectedItemtoEdit,
    DeletePropsOnItem, openedBy, RetriveDistData, SaveChangedConfiguration, RetriveRaggruppmanetoData,
    setTableData, setDataToInsert, dataToInsert
}) => {
    const [itemStored, setItemStored] = React.useState<any>({ raggruppamento: null, note: null, dist_prezzo_suggerito: null });

    React.useEffect(() => {
        if (!selectedItemtoEdit?.Raggruppamento && !selectedItemtoEdit?.note && !selectedItemtoEdit?.dist_prezzo_suggerito) { return };
        setItemStored((prev: any) => {
            return {
                ...prev,
                raggruppamento: (selectedItemtoEdit?.Raggruppamento ? { Codice: selectedItemtoEdit?.Raggruppamento } : null),
                note: selectedItemtoEdit?.note || null,
                dist_prezzo_suggerito: selectedItemtoEdit?.dist_prezzo_suggerito || null,
            };
        })
    }, [selectedItemtoEdit]);

    const HandleDataToInsert = (props: string, value: any) => {
        setItemStored((prev: any) => {
            const copy = { ...prev };
            copy[props] = value;
            setTableData((prev: any) => {
                const copy = [...prev];
                const findItemIndex = copy.findIndex(e => e.Marca === selectedItemtoEdit.Marca
                    && e.Categoria === selectedItemtoEdit.Categoria && e.Sottocategoria === selectedItemtoEdit.Sottocategoria);
                copy[findItemIndex].Raggruppamento = value ? value.Codice : null;
                return copy;
            });
            return copy;
        });

    };

    const Brige_ChangeStatus = () => {
        SaveChangedConfiguration({ raggruppamento: itemStored.raggruppamento, note: RemoveSpaceText(itemStored.note), dist_prezzo_suggerito: itemStored.dist_prezzo_suggerito });
        ChangeStatus();
        setItemStored((_: any) => { return { raggruppamento: null, note: null, dist_prezzo_suggerito: null } });
        ResetSuppliersList();
    };

    const handleChangeNote = (e: any) => {
        const SaveInTable = (prop: string, value: string | boolean | number) => {
            setItemStored((prev: any) => {
                return { ...prev, [prop]: value }
            });
            setTableData((prev: any) => {
                const copy = [...prev];
                const findItemIndex = copy.findIndex(e => e.Marca === selectedItemtoEdit.Marca
                    && e.Categoria === selectedItemtoEdit.Categoria && e.Sottocategoria === selectedItemtoEdit.Sottocategoria);
                copy[findItemIndex][prop] = (value || null);
                return copy;
            });
        }

        if (openedBy === 1) {
            // Handle specific logic for when the panel is opened for editing
            SaveInTable('note', e.target.value);
        } else {
            // Handle specific logic for when the panel is opened for creating a new item
            setDataToInsert((prev: any) => {
                return { ...prev, note: e.target.value }
            });
        }
    };

    const handleChangeDistPrezzoSugerito = (e: any) => {
        const SaveInTable = (prop: string, value: string | boolean | number) => {
            setItemStored((prev: any) => {
                return { ...prev, [prop]: value }
            });
            setTableData((prev: any) => {
                const copy = [...prev];
                const findItemIndex = copy.findIndex(e => e.Marca === selectedItemtoEdit.Marca
                    && e.Categoria === selectedItemtoEdit.Categoria && e.Sottocategoria === selectedItemtoEdit.Sottocategoria);
                copy[findItemIndex][prop] = (value || null);
                return copy;
            });
        }

        if (openedBy === 1) {
            // Handle specific logic for when the panel is opened for editing
            SaveInTable('dist_prezzo_suggerito', e);
        } else {
            // Handle specific logic for when the panel is opened for creating a new item
            setDataToInsert((prev: any) => {
                return { ...prev, dist_prezzo_suggerito: e }
            });
        }
    };


    return <Backdrop open={status} sx={{ zIndex: (theme: any) => theme.zIndex.drawer + 1 }}>
        {status && <Card className={`w-full max-w-[1000px] min-w-[320px] md:min-w-[580px] max-h-[1000px] min-h-[580px] h-[80vh] !p-6 
            bg-white dark:!bg-neutral-800 shadow-lg rounded-xl overflow-hidden`} data-tour="fornitori-modal">
            <Stack gap={1} height='100%' width='100%'>
                <div className='flex justify-between items-center'>
                    <h2 className='text-xl'>Modifica Fornitori</h2>
                    <FDIconButton variant='danger' dataTour="fornitori-modal-close" icon={<CloseIcon size={20} />} size='small' onClick={Brige_ChangeStatus} />
                </div>
                <PopupInfo className='dark:!bg-neutral-900'
                    body="Seleziona/Delezionata un fornitore per attivarlo/disattivarlo nella tabella dei commerciali per la categoria/sottoCategoria/Brand
                    attualmente selezionati." close={false} icon={icon_info()} />

                {openedBy === 1 && <React.Fragment>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-2 !mt-4">
                        <MDTypography variant='body2'>Raggruppamento</MDTypography>
                        {RetriveRaggruppmanetoData() ?
                            (RetriveRaggruppmanetoData().length > 0 ? <VirtualizedList data={{
                                label: "Raggruppamento",
                                ref: "Codice",
                                stateRef: itemStored.raggruppamento,
                                noneOnClick: () => {
                                    HandleDataToInsert('raggruppamento', null);
                                },
                                menuItemOnClick: (item: object) => {
                                    HandleDataToInsert("raggruppamento", { Codice: item });
                                },
                                dataArray: RetriveRaggruppmanetoData(),
                                width: 170,
                            }}
                                HandleDataToInsert={HandleDataToInsert}
                                dataToInsert={itemStored}
                                brandSelected={"brandSelected"} categorySelected={"categorySelected"} />
                                : <Tag text='Questa sottocategoria non è presente in nessun raggruppamento' color='#ebebeb' fontSize='0.8rem' />)
                            : <Tag text='Nessun raggruppamento presente' color='#ebebeb' fontSize='0.8rem' />}
                    </div></React.Fragment>}
                <div className='flex flex-col'>
                    <div className="flex flex-col gap-2">
                        <span className='text-sm'
                            data-tooltip-id='general-confg-suppliers-tooltip'
                            data-tooltip-content='Inserisci una nota per questa linea-gruppo-famiglia'>Nota</span>
                        <FDInput
                            fullWidth
                            size="md"
                            leftIcon={<NewspaperIcon />}
                            placeholder='Inserisci una nota per questa linea-gruppo-famiglia'
                            value={(openedBy === 1 ? itemStored?.note : dataToInsert.note) || ''}
                            onChange={handleChangeNote}
                            aria-label="Search"
                        />
                    </div>
                    <div>
                        <span className='text-sm'
                            data-tooltip-id='general-confg-suppliers-tooltip'
                            data-tooltip-content='Seleziona il fornitore che vuoi impostare di default se lo stock Focelda risulta essere 0, 
                        ATTENZIONE: qual ora non venisse selezionato, verrà fatta una scelta sul prezzo piu basso per i fornitori abilitati'>Fornitore Prezzo Suggerito</span>
                        <FDSelect
                            className='w-full'
                            placeholder='Seleziona un fornitore'
                            options={supplierList.map((item) => ({ label: item.name, value: item.name }))}
                            value={(openedBy === 1 ? itemStored?.dist_prezzo_suggerito : dataToInsert.dist_prezzo_suggerito) || ''}
                            onChange={handleChangeDistPrezzoSugerito}
                        />
                    </div>
                </div>


                <div className={`w-full h-px dark:bg-neutral-700 bg-gray-300 !my-3`} />

                <Stack gap={1} overflow='auto'>
                    {supplierList.map((dist, index) => (
                        <SingleButtonSupplier key={index} dist={dist} index={index} HandleDistToInsert={HandleDistToInsert}
                            ChangeValueOnDistSelected={ChangeValueOnDistSelected} UpdateSuppliersActived={UpdateSuppliersActived}
                            actived={Boolean(openedBy === 0 ? suppliersFromNewInsert.includes(dist.name)
                                : suppliersFromEditItem.includes(dist.name))}
                            DeletePropsOnItem={DeletePropsOnItem} data={RetriveDistData} />
                    ))}
                </Stack>
            </Stack>
        </Card>}
    </Backdrop>
}