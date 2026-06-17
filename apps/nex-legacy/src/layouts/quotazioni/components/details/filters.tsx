import React, { memo } from "react";
import { FiltersType } from "layouts/quotazioni/types/qts_product";
import { FDButton, FDSelect } from "@nex/fd-ui";
import { MdSearch } from 'react-icons/md';
import { useTour } from "tour/TourProvider";

const MdSearchIcon = MdSearch as React.FC<{ size?: number; className?: string }>;

const Filters: React.FC<{
    categoryData: any[];
    filterState: FiltersType; setFilterState: (s: any) => void;
    scope: string | null;
    runSearch: (q: string, fromDebounced: boolean) => void;
    resetFilters: () => void;
}> = ({
    categoryData,
    filterState, setFilterState,
    scope,
    runSearch, resetFilters,
}) => {
        const { isOpen, activeStepSelector } = useTour();
        // Durante lo step "pannello filtri prodotti" del tour blocchiamo
        // le interazioni interne al menu:
        // - il tour deve guidare il focus in modo deterministico;
        // - click casuali su select/pulsanti potrebbero alterare stato/focus.
        const lockInteractions =
            isOpen && activeStepSelector === '[data-tour="quotazioni-products-filters-3"]';

        //dati che permetto la creazione dei select a filtraggio.
        const dataSelects = [
            {
                label: "Marca",
                ref: "Marca",
                stateRef: filterState.marca,
                noneOnClick: () => {
                    HandleDataToInsert('marca', null);
                    HandleDataToInsert('linea', null);
                    HandleDataToInsert('gruppo', null);
                },
                menuItemOnClick: (item: object) => {
                    HandleDataToInsert("marca", item);
                    HandleDataToInsert('linea', null);
                    HandleDataToInsert('gruppo', null);
                },
                dataArray: categoryData
            },
            {
                label: "Linea",
                ref: "DescrizioneLinea",
                stateRef: filterState.linea,
                noneOnClick: () => {
                    HandleDataToInsert('linea', null);
                    HandleDataToInsert('gruppo', null);
                },
                menuItemOnClick: (item: object) => {
                    HandleDataToInsert("linea", item);
                    HandleDataToInsert('gruppo', null);
                },
                dataArray: filterState.marca?.Categories
            },
            {
                label: "Gruppo",
                ref: "DescrizioneGruppo",
                stateRef: (filterState.gruppo || []),
                noneOnClick: () => {
                    HandleDataToInsert('gruppo', null);
                },
                menuItemOnClick: (item: object) => {
                    HandleDataToInsert("gruppo", item);
                },
                multiSelect: true,
                dataArray: filterState.linea?.SubCategory
            },
            {
                label: "famiglia",
                ref: "descrizioneFamiglia",
                stateRef: (filterState.famiglia || []),
                noneOnClick: () => {
                    HandleDataToInsert('famiglia', null);
                },
                menuItemOnClick: (item: object) => {
                    HandleDataToInsert("famiglia", item);
                },
                multiSelect: true,
                dataArray: filterState.gruppo?.famiglie
            }
        ];

        //inserisce i dati selezionati dall'utente nell'oggetto filterState.
        const HandleDataToInsert = (props: string, value: any) => {
            setFilterState((prev: any) => {
                const copy = { ...prev };
                copy[props] = value;
                return copy;
            })
        };

        return (
            <div className="relative w-[360px] max-w-full space-y-4" data-tour="quotazioni-products-filters-3">
                {lockInteractions && (
                    <div
                        aria-hidden="true"
                        style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "auto" }}
                        onClickCapture={(e) => e.stopPropagation()}
                    />
                )}
                {/* Header */}
                <div className="text-sm font-medium">Filter</div>

                {/* Disclaimer: se l'utente seleziona un filtro, i prodotti ricercati saranno tra quelli che attualmente Focelda possiede nel proprio Database, e non farà riferimento ai prodotti registrati nel database degli altri fornitori */}
                <div className="text-xs text-yellow-500 border border-dashed border-yellow-700 p-2 rounded">
                    Selezionando uno o più filtri, i prodotti ricercati saranno tra quelli che attualmente Focelda
                    possiede nel proprio Database, e non farà riferimento ai prodotti registrati nel database degli altri fornitori.
                </div>

                {dataSelects.map((elements, index) => {
                    return <div key={index}>
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span className="opacity-80">{elements.label}</span>
                        </div>
                        <FDSelect
                            options={elements?.dataArray?.map((item: any) => ({ label: item[elements.ref], value: item })) ?? []}
                            value={elements.stateRef as any}
                            onChange={(v: any) => elements.menuItemOnClick(v)}
                            placeholder="Tutte"
                            size="sm" variant="outline" color="dark" radius="md" fullWidth searchable
                            disabled={!elements.dataArray || elements.dataArray.length === 0}
                            menuMaxHeight={240}
                        />
                    </div>
                })}

                <div className="text-xs text-blue-500 border border-dashed border-blue-700 p-2 rounded">
                    Cliccando su applica filtri, i filtri selezionati verranno applicati alla ricerca,
                    e i risultati mostreranno solo i prodotti che corrispondono ai criteri di filtraggio scelti
                    <strong>Nel attuale TAB in visualizzazione ( "{scope?.replace("_", " ") ?? "N/A"}" )</strong>.
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-between pt-1">
                    <FDButton size="small" variant="outline" color="dark" onClick={resetFilters} disabled={lockInteractions}>
                        Reset
                    </FDButton>
                    <FDButton size="small" variant="outline" color="dark" onClick={() => runSearch("", false)} icon={<MdSearchIcon />} disabled={lockInteractions}>
                        Applica Filtri
                    </FDButton>
                </div>
            </div>
        );
    };

export default memo(Filters);
