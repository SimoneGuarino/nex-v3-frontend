import React, { useContext, useEffect, useRef } from "react";
import { UserContext } from "context/UserContext";
import { TableVirtualized } from "components/Virtualized/table";
import { InfiniteScrollAPI } from "../fetchData/InfiniteScrollAPI";
import { DataOverviewProps } from "layouts/swot";
import { icon_view } from "config/icons";
import { enqueueSnackbar } from "components/MessageBox";

interface FilterState {
    brand?: string;
    linea?: string;
    gruppo?: string;
    famiglia?: string;
}

interface TableSubObjProps {
    data: DataOverviewProps[] | null;
    loadStatus: { [key: string]: any };
    backUpTableData: DataOverviewProps[] | null;
    setData: React.Dispatch<React.SetStateAction<DataOverviewProps[] | null>>;
    setOverviewData: (data: any) => void;
    CreateOverviewData: (data?: DataOverviewProps[] | null) => void;
    //ChangeLoadStatus: ({ from, bool }: { from: string; bool: boolean }) => void;
}

const TableSubObj: React.FC<TableSubObjProps> = ({ data, loadStatus, backUpTableData, setOverviewData, setData, CreateOverviewData }) => {
    // Stato per i filtri correnti
    const [filters, setFilters] = React.useState<FilterState>({});

    // Cambia lo stato del overview data del pannello in base all'elemento cliccato nella tabella
    const handleChangeOverviewData = (index: number, data: DataOverviewProps[]) => {
        if (!data || !data[index]) return;
        const item: DataOverviewProps = data[index];

        setOverviewData((prev: DataOverviewProps | null) => {
            const overviewData = prev;
            //controlla se i dati di item sono già presenti in overviewData
            if (overviewData &&
                overviewData.linea && overviewData.gruppo && overviewData.famiglia &&
                item.brand && item.linea && item.gruppo && item.famiglia &&
                overviewData.brand === item.brand &&
                overviewData.linea.codice === item.linea.codice &&
                overviewData.gruppo.codice === item.gruppo.codice &&
                overviewData.famiglia.codice === item.famiglia.codice) {
                return overviewData;
            }

            enqueueSnackbar("I Dati sono stati caricati con successo", {
                title: 'Caricati con successo',
                type: 'success',
            });

            return item;
        });
    };
    // Stato per le colonne della tabella
    // Questo stato gestisce le colonne da visualizzare nella tabella
    const [columns, setColumns] = React.useState<any>([
        {
            key: [], fieldToTake: [
                { key: 'View', type: 'button', title: 'Vedi in dettaglio', ariaLabel: 'escludi', icon: icon_view(), funcAction: handleChangeOverviewData, onHoverColor: '#b7b7b76b' },
            ], label: 'Opzioni', type: 'info', excludeLogic: true, sx: { alignItems: 'flex-start' }
        },
        { key: 'brand', label: 'Brand', type: 'default', sort: true, sortType: 'string', width: 200, sx: { textAlign: 'center' } },
        { key: 'linea', secKey: 'descrizione', label: 'Linea', type: 'default', sort: true, sortType: 'string', width: 200, sx: { textAlign: 'center' } },
        { key: 'gruppo', secKey: 'descrizione', label: 'Gruppo', type: 'default', sort: true, sortType: 'string', width: 200, sx: { textAlign: 'center' } },
        { key: 'famiglia', secKey: 'descrizione', label: 'Famiglia', type: 'default', sort: true, sortType: 'string', width: 200, sx: { textAlign: 'center' } }
    ]);

    // Calcola liste uniche per i dropdown
    const uniqueBrands = React.useMemo(
        () => Array.from(new Set((backUpTableData || []).sort((a: any, b: any) => a.brand.localeCompare(b.brand)).map(d => d.brand).filter(Boolean))),
        [backUpTableData]
    );
    const uniqueLinee = React.useMemo(
        () => Array.from(new Set((backUpTableData || []).sort((a: any, b: any) => a.linea?.descrizione.localeCompare(b.linea?.descrizione)).map(d => d.linea?.descrizione).filter(Boolean))),
        [backUpTableData]
    );
    const uniqueGruppi = React.useMemo(
        () => Array.from(new Set((backUpTableData || []).sort((a: any, b: any) => a.gruppo?.descrizione.localeCompare(b.gruppo?.descrizione)).map(d => d.gruppo?.descrizione).filter(Boolean))),
        [backUpTableData]
    );
    const uniqueFamiglie = React.useMemo(
        () => Array.from(new Set((backUpTableData || []).sort((a: any, b: any) => a.famiglia?.descrizione.localeCompare(b.famiglia?.descrizione)).map(d => d.famiglia?.descrizione).filter(Boolean))),
        [backUpTableData]
    );

    // Handler generico per select
    const handleFilterChange = (key: keyof FilterState, value: string) => {
        if (!backUpTableData) return;
        // Aggiorna lo stato dei filtri
        setFilters(prev => ({
            ...prev,
            [key]: value ? value : undefined,
        }));
        // Filtra i dati in base ai filtri selezionati
        const filteredData: DataOverviewProps[] | null = backUpTableData.filter(item => {
            return Object.entries({ ...filters, [key]: value }).every(([filterKey, filterValue]) => {
                if (!filterValue) return true; // Se il filtro non è selezionato, non filtra
                if (filterKey === 'brand') return item.brand === filterValue;
                if (filterKey === 'linea') return item.linea?.descrizione === filterValue;
                if (filterKey === 'gruppo') return item.gruppo?.descrizione === filterValue;
                if (filterKey === 'famiglia') return item.famiglia?.descrizione === filterValue;
                return true;
            });
        });
        setData(filteredData);
        // Aggiorna i dati del overview sulla base dei dati filtrati
        CreateOverviewData(filteredData);
    };

    return (
        !loadStatus.table ? data && <div className="w-full !space-y-4">
            {/* Pannello filtri */}
            <div className="flex flex-wrap gap-2 mb-4 text-sm">
                <div>
                    <label className="block font-semibold">Brand</label>
                    <select
                        value={filters.brand || ''}
                        onChange={e => handleFilterChange('brand', e.target.value)}
                        className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                    >
                        <option value="">Tutti</option>
                        {uniqueBrands.map(b => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block font-semibold">Linea</label>
                    <select
                        value={filters.linea || ''}
                        onChange={e => handleFilterChange('linea', e.target.value)}
                        className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                    >
                        <option value="">Tutte</option>
                        {uniqueLinee.map(l => (
                            <option key={l} value={l}>{l}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block font-semibold">Gruppo</label>
                    <select
                        value={filters.gruppo || ''}
                        onChange={e => handleFilterChange('gruppo', e.target.value)}
                        className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                    >
                        <option value="">Tutti</option>
                        {uniqueGruppi.map(g => (
                            <option key={g} value={g}>{g}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block font-semibold">Famiglia</label>
                    <select
                        value={filters.famiglia || ''}
                        onChange={e => handleFilterChange('famiglia', e.target.value)}
                        className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                    >
                        <option value="">Tutte</option>
                        {uniqueFamiglie.map(f => (
                            <option key={f} value={f}>{f}</option>
                        ))}
                    </select>
                </div>
            </div>

            <TableVirtualized
                className='flex-3'
                tableType='bottom-line'
                data={data || []}
                setData={setData}
                columns={columns}
                setColumns={setColumns}
                results={(data || []).length}
                loadStatus={loadStatus.table}
                whereToFindData={false}
                /*infiniteScroll={{
                    func: infiniteScroll,
                    offset: offset
                }}*/
            />
        </div> : <div className="min-h-[600px] lg:w-3/4 sm:w-full bg-gray-200 dark:bg-neutral-700 rounded animate-pulse" />
    );
};

export default TableSubObj;
