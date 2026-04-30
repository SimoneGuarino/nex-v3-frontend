import React, { memo } from "react";
import FDSelect from "components/UI/input/FDSelect";
import { IoCloseSharp } from "react-icons/io5";
import { DistributorStructure, itemsFamiglia, itemsGruppo, itemsLinea } from "..";
import FDButton from "components/UI/buttons/FDButton";
const CloseIcon = IoCloseSharp as React.FC<{ size?: number, className?: string }>;

const FiltersPanelInMenu: React.FC<{
    filterFocLinea: itemsLinea | string; setFilterFocLinea: (val: itemsLinea | string) => void;
    filterFocGruppo: itemsGruppo | string; setFilterFocGruppo: (val: itemsGruppo | string) => void;
    filterFocFamiglia: itemsFamiglia | string; setFilterFocFamiglia: (val: itemsFamiglia | string) => void;
    filterFocRaggruppamento: string; setFilterFocRaggruppamento: (val: string) => void;
    filterDistLinea: string; setFilterDistLinea: (val: string) => void;
    filterDistGruppo: string; setFilterDistGruppo: (val: string) => void;
    filterDistFamiglia: string; setFilterDistFamiglia: (val: string) => void;
    distributorStructure: DistributorStructure;
    applyFilters: () => void;
}> = ({
    filterFocLinea, setFilterFocLinea,
    filterFocGruppo, setFilterFocGruppo,
    filterFocFamiglia, setFilterFocFamiglia,
    filterFocRaggruppamento, setFilterFocRaggruppamento,
    filterDistLinea, setFilterDistLinea,
    filterDistGruppo, setFilterDistGruppo,
    filterDistFamiglia, setFilterDistFamiglia,

    distributorStructure,
    applyFilters,
}) => {
        // definizione dei filtri di classificazione
        const filtersClassification = [
            { label: 'Focelda Linea', value: filterFocLinea, onChange: setFilterFocLinea, 
                typeOptions: distributorStructure.focelda.categorie.map(cat => ({ label: `${cat.linea} - ${cat.descrizione ?? "n/a"}`, value: cat })) },
            { label: 'Focelda Gruppo', value: filterFocGruppo, onChange: setFilterFocGruppo, 
                typeOptions:  (typeof filterFocLinea !== "string" ? filterFocLinea?.gruppi
                : distributorStructure.focelda.gruppi).map(grp => ({ label: `${grp.gruppo} - ${grp.descrizione ?? "n/a"}`, value: grp })) },
            { label: 'Focelda Famiglia', value: filterFocFamiglia, onChange: setFilterFocFamiglia, 
                typeOptions: (typeof filterFocGruppo !== "string" ? filterFocGruppo?.famiglie 
                : distributorStructure.focelda.famiglie).map(fam => ({ label: `${fam.famiglia} - ${fam.descrizione ?? "n/a"}`, value: fam })) },
            { label: 'Focelda Raggruppamento', value: filterFocRaggruppamento, onChange: setFilterFocRaggruppamento, 
                typeOptions: distributorStructure.focelda.raggruppamenti.map(rag => ({ label: `${rag.valore} - ${rag.descrizione ?? "n/a"}`, value: rag.valore })) },

            { label: 'Fornitore Linea', value: filterDistLinea, onChange: setFilterDistLinea, typeOptions: distributorStructure.fornitore.linee.map(linea => ({ label: `${linea.valore} - ${linea.descrizione ?? "n/a"}`, value: linea.valore })) },
            { label: 'Fornitore Gruppo', value: filterDistGruppo, onChange: setFilterDistGruppo, typeOptions: distributorStructure.fornitore.gruppi.map(gruppo => ({ label: `${gruppo.valore} - ${gruppo.descrizione ?? "n/a"}`, value: gruppo.valore })) },
            { label: 'Fornitore Famiglia', value: filterDistFamiglia, onChange: setFilterDistFamiglia, typeOptions: distributorStructure.fornitore.famiglie.map(famiglia => ({ label: `${famiglia.valore} - ${famiglia.descrizione ?? "n/a"}`, value: famiglia.valore })) },
        ];

        // funzione per resettare tutti i filtri
        function resetFilters() {
            setFilterFocLinea('');
            setFilterFocGruppo('');
            setFilterFocFamiglia('');
            setFilterFocRaggruppamento('');
            setFilterDistLinea('');
            setFilterDistGruppo('');
            setFilterDistFamiglia('');
        };

        return (
            <div className="w-[360px] max-w-full space-y-4">
                {/* Header */}
                <div className="text-sm font-medium">Filter</div>

                <div className="space-y-4">
                    {filtersClassification.map((filter, index) => {
                        return (
                            <div key={index}>
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="opacity-80">{filter.label}</span>
                                </div>
                                <FDSelect
                                    options={filter.typeOptions}
                                    value={filter.value}
                                    onChange={(v) => filter.onChange((v as string) ?? '')}
                                    placeholder="Tutte"
                                    size="sm" variant="outline" color="dark" radius="md" fullWidth searchable
                                    menuMaxHeight={240}
                                />
                            </div>
                        )
                    })}
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-between pt-1">
                    <button
                        className="px-3 py-2 text-sm rounded-md border border-[#2a2a2a] hover:bg-[#2a2a2a]"
                        onClick={resetFilters}
                    >
                        Reset
                    </button>
                    <FDButton color="primary" onClick={applyFilters}>Applica</FDButton>
                </div>
            </div>
        );
    };

export default memo(FiltersPanelInMenu);
