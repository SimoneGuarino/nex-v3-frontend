import React from "react";
import { Divider } from "@mui/material";
import { Select_ } from "components/Select";
import { enqueueSnackbar } from "components/MessageBox";
import { MainTheme } from "assets/settingsTheme";
import FDButton from "components/UI/buttons/FDButton";
//icons
import { MdSearch, MdAdd, MdClose, MdFilterList } from 'react-icons/md';
import FDIconButton from "components/UI/buttons/FDIconButton";
import FDBox from "components/UI/box/FDBox";
import { useNexTheme } from "@nex/theme-system";

const MdSearchIcon = MdSearch as React.FC<{ size?: number; className?: string }>;
const MdAddIcon = MdAdd as React.FC<{ size?: number; className?: string }>;
const MdCloseIcon = MdClose as React.FC<{ size?: number; className?: string }>;
const MdFilterListIcon = MdFilterList as React.FC<{ size?: number; className?: string }>;

interface MainBarProps {
    distributorList: Array<any>;
    distributor: any;
    panelAddStatus: boolean;
    distributorName: string | null;
    distributorsOnTableSearched: string | null;
    distributorStructure: {
        focelda: {
            categorie: Array<{
                linea: string,
                descrizione: string,
                gruppi: Array<{
                    gruppo: string,
                    descrizione: string,
                    famiglie: Array<{
                        famiglia: string,
                        descrizione: string,
                        buyer: string[]
                    }>
                }>
            }>,
            raggruppamenti: Array<{ valore: string, descrizione: string }>
        },
        fornitore: {
            linee: Array<{ valore: string, descrizione: string }>
            gruppi: Array<{ valore: string, descrizione: string }>
            famiglie: Array<{ valore: string, descrizione: string }>
        }
    };
    loadStatus: {
        table: boolean;
    };
    menuRef: React.MutableRefObject<any>;
    chips: Array<any>;

    setAddPanelStatus: (arg0: boolean) => void;
    setDistributor: (arg0: any) => void;
    Search: () => void;
    setOpenFiltersPanel: (arg0: boolean) => void;

}

export const MainBar: React.FC<MainBarProps> = ({
    distributorList,
    distributor,
    panelAddStatus,
    distributorName,
    distributorStructure,
    distributorsOnTableSearched,
    loadStatus, setAddPanelStatus, setDistributor, Search,
    menuRef, chips, setOpenFiltersPanel,
}) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const openAddPanel = () => {
        if (!distributorName) {
            return enqueueSnackbar('Seleziona un fornitore prima di aprire il pannello di inserimento configurazione.', {
                title: 'Seleziona Fornitore',
                type: 'warning',
            });
        };

        if (
            (!distributorStructure.focelda.categorie.length) &&
            (!distributorStructure.fornitore.linee.length && !distributorStructure.fornitore.gruppi.length && !distributorStructure.fornitore.famiglie.length)
        ) {
            return enqueueSnackbar('La struttura delle categorie del fornitore selezionato non è stata ancora caricata o non è presente.', {
                title: 'Struttura Categorie',
                type: 'warning',
            });
        }

        setAddPanelStatus(!panelAddStatus);
    }

    return <FDBox pad="sm" radius="xl" className="flex items-center gap-4">
        <FDIconButton icon={<MdSearchIcon size={18} />}
            dataTooltipContent="Ricerca configurazioni correlate al fornitore selezionato"
            dataTooltipId="general-confg-correlazione-categorie-tooltip"
            className="h-fit" onClick={Search} disabled={loadStatus.table} />
        <Select_
            label="Seleziona il distributore"
            value={(distributor ?? "")}
            onChange={setDistributor}
            items={distributorList}
            width="15rem" />
        {distributorsOnTableSearched && <>
            <div className="flex flex-col ml-auto text-sm">
                <span className="text-xs opacity-50">Attualmente stai visualizzando:</span>
                <span>{distributorsOnTableSearched}</span>
            </div></>}

        {distributorsOnTableSearched && <React.Fragment>
            <Divider orientation="vertical" sx={{ width: '1px', backgroundColor: `${darkMode ? palette.grey[800] : '#e7e7e7'}` }} />
            {/* Filters */}
            <div className="relative" onClick={(e: any) => menuRef.current = e.currentTarget}>
                <FDButton variant="outline" color='neutral' size="small" onClick={() => setOpenFiltersPanel(true)}>
                    <MdFilterListIcon className="mr-1.5" /> Filtri {chips.length > 0 && (
                        <span
                            data-tooltip-id='general-confg-correlazione-categorie-tooltip'
                            data-tooltip-content={`${chips.length} filtr${chips.length > 1 ? "i" : "o"} attiv${chips.length > 1 ? "i" : "o"} - ${chips.map(c => c.label).join(", ")}`}
                            className="text-xs text-sky-500 ml-1 font-bold">({chips.length})</span>
                    )}
                </FDButton>
            </div>
            <FDIconButton
                dataTooltipContent={panelAddStatus ? "Chiudi pannello" : "Apri pannello"}
                dataTooltipId="general-confg-correlazione-categorie-tooltip"
                icon={panelAddStatus ? <MdCloseIcon size={18} /> : <MdAddIcon size={18} />} className="h-fit" onClick={openAddPanel} />
        </React.Fragment>}
    </FDBox>
}