import React from 'react';
import FDSelect from 'components/UI/input/FDSelect';

interface TagPProps {
    status: boolean;
    ChangeStatusTagP: () => void;
    warehouses_selected: string[];
    setWarehouse: (prev: any) => void;
    warehouses_list: string[];
    noDataWEBP: any;
    WarehouseChange: (name: number | null) => void;
    loadingTable: boolean;
}

export const TagP: React.FC<TagPProps> = ({
    warehouses_selected = [],
    setWarehouse,
    warehouses_list = [],
    WarehouseChange,
    loadingTable = false,
}) => {
    // ---------- VARIABILI "SAFE" ----------
    const selectedSafe = warehouses_selected ?? [];
    const listSafe = warehouses_list ?? [];

    /*const AddElementToList = (name: string) => {
        if (!loadingTable) {
            const index = listSafe.indexOf(name);
            setWarehouse(() => {
                if (selectedSafe[0] == name) {
                    WarehouseChange(null);
                    return null;
                } else {
                    WarehouseChange(index >= 0 ? index : null);
                    return index >= 0 ? index : null;
                }
            });
        }
    }*/

    const currentValue = selectedSafe?.[0] ?? '';

    return (
        <div className='max-w-[1400px] w-full sm:w-[200px] max-h-[93.2vh] p-1 flex flex-col space-y-4'>
            {/* Header */}
            <div className="text-sm font-medium">Filtri</div>
            {/* Magazzini */}
            <div>
                <div className="flex items-center justify-between text-xs mb-1">
                    <span className="opacity-80">Magazzini</span>
                </div>
                <FDSelect
                    options={[
                        { value: '', label: 'Tutti i Magazzini' },
                        ...listSafe.map((w) => ({ value: w, label: w }))
                    ]}
                    value={currentValue}
                    onChange={(v) => {
                        if (loadingTable) return;
                        const name = (v ?? '') as string;
                        const isAll = name === '';
                        const index = !isAll ? listSafe.indexOf(name) : -1;
                        setWarehouse(() => {
                            if (isAll || index < 0) {
                                WarehouseChange(null);  // null = tutti
                                return null;
                            } else {
                                WarehouseChange(index);
                                return index;
                            }
                        });
                    }}
                    placeholder="Seleziona un magazzino…"
                    searchable
                    fullWidth
                    radius="md"
                    size='sm'
                    variant="outline"
                    color='dark'
                />
            </div>
            {/* Footer actions */}
            <div className="flex items-center justify-between pt-1">
                <button
                    className="px-3 py-2 text-sm rounded-md border border-[#2a2a2a] hover:bg-[#2a2a2a]"
                    onClick={() => {setWarehouse(null); WarehouseChange(null)}}
                >
                    Reset
                </button>
            </div>
        </div>
    )
}
