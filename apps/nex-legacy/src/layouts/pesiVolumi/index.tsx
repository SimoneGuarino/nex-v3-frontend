//src\layouts\pesiVolumi\index.tsx
import React, { useRef, useState } from 'react';

import { useUserContext } from "../../context/UserContext";
import type { UserState } from "types/UserContext";

import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import Loader from 'Loader';

import { Tooltip } from 'react-tooltip';
import { ParmBar } from './components/addItemForm';
import { Chrono } from './components/chrono';

import noChronoAvatar from '../../assets/images/chronological-regions-concept_1073912-1549.webp';
import { DataAPI } from './fetchData/data';
import { SaveDataAPI } from './fetchData/saveData';

import { SubHeader } from './components/subHeader';
import theme from 'assets/theme';

import noDataWEBP from 'assets/images/noCategoryAssignedBg.webp';
import { TableVirtualized } from 'components/Virtualized/table';
import { downloadCsvFromRows } from 'utils/exportCsv';
import { ContextMenu } from 'components/UI/menu/ContextMenu';
import FDButton from 'components/UI/buttons/FDButton';
import { MdFileDownload } from "react-icons/md";
import { ExportWeightsVolumesCSV } from './fetchData/exportData';
import { TagP } from './components/tagPanel';
import { FilterChip } from 'components/UI/search/FDSearchPanel';

//tour
import { useSectionTour } from 'tour/useSectionTour';
import { useTour } from "tour/TourProvider";
import { Role } from 'tour/types';

const DownloadIcon = MdFileDownload as React.FC<{ size?: number, className?: string }>;

/* ===== tipi locali minimi (solo per questo file) ===== */

type SortType = 'Number' | 'String';
type ColumnType = 'default' | 'date';

type TableColumn = {
    key: string;
    label: string;
    sort: boolean;
    width: number;
    sortType: SortType;
    type: ColumnType;
    sx?: Record<string, unknown>;
    dateType?: 'ibmi' | 'iso';
};

type DataRow = Record<string, unknown>;
type DataContextShape = { dati: DataRow[] };

/* ===== costanti ===== */

const buttonList = ['carichi', 'mancanti', 'variazioni'] as const;

const warehouseList = [
    '001', '003', '004', '007', '009', '010', '019', '021', '028', '029',
    '058', '066', '01A', '01D', '01E', '01F', '01G', '01I', '052', '055'
];

const columnsList: TableColumn[] = [
    { key: 'ci', label: 'Cod.Art', sort: true, width: 150, sortType: 'Number', type: 'default', sx: { textAlign: 'center' } },
    { key: 'codiceProduttore', label: 'codiceProduttore', sort: true, width: 200, sortType: 'String', type: 'default', sx: { alignSelf: 'flex-start' } },
    { key: 'descrizione', label: 'Descrizione', sort: true, width: 400, sortType: 'String', type: 'default', sx: { alingItems: 'flex-start' } },
    { key: 'numeroMovimento', label: 'Num.Mov', sort: true, width: 150, sortType: 'Number', type: 'default', sx: { textAlign: 'center' } },
    { key: 'codiceMagazzino', label: 'Cod.Mag', sort: true, width: 150, sortType: 'Number', type: 'default', sx: { textAlign: 'center' } },
    { key: 'dataNumeroMovimento', label: 'Data', sort: true, width: 150, sortType: 'Number', type: 'date', dateType: 'ibmi', sx: { textAlign: 'center' } },
];

/* ===== util ===== */

// Converte una data IBM i (es. 20250131 o "20250131") in "YYYY-MM-DD"
function ibmiToISO(val: unknown): string {
    if (val == null) return '';
    const s = String(val);
    if (/^\d{8}$/.test(s)) {
        return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
    }
    return s;
}

/* ===== componente ===== */

export default React.memo(function PesiVolumi(): JSX.Element {
    const [userContext] = useUserContext();
    const [err, setErr] = React.useState<boolean>(false); // serve a tracciare uno stato d’errore globale della pagina
    const ChangeErrorStatus = React.useCallback(() => setErr((v) => !v), []);
    const [chronoData, setChronoData] = React.useState<DataRow[]>([]); // serve a memorizzare le righe mostrate nel widget cronologico (Chrono)
    const [dataContext, setDataContext] = React.useState<DataContextShape>({ dati: [] }); // serve a contenere i dati correnti della tabella principale
    const [columns, setColumns] = React.useState<TableColumn[]>(columnsList); // serve a definire l’insieme/ordine delle colonne attive nella tabella
    const [btnActived, setBtnActived] = React.useState<number>(1); // serve a sapere quale tab è attiva (1=carichi, 2=mancanti, 3=variazioni)

    const [openDownloadMenu, setOpenDownloadMenu] = useState<boolean>(false);
    const [openFiltersMenu, setOpenFiltersPanel] = useState<boolean>(false);

    const contextMenuRef = useRef<HTMLDivElement>(null);

    const changeTab = React.useCallback((newTab: number) => {
        // normalizzo il valore: se è un numero lo uso, altrimenti tengo quello attuale
        const next = (typeof newTab === "number" ? newTab : btnActived) ?? btnActived;

        // durante il tour allo step 5 → non permettere il cambio tab
        if (isTourOpen && tourIndex === 5) {
            return;
        }

        if (next !== btnActived) {
            changeTab(next);
        }

        setBtnActived(newTab);
        RetriveData(newTab);
        if (newTab === 2) {
            setColumns(() => ([
                { key: 'ci', label: 'Cod.Art', sort: true, width: 200, sortType: 'Number', type: 'default', sx: { alignSelf: 'center' } },
                { key: 'descrizione', label: 'descrizione', sort: true, width: 400, sortType: 'String', type: 'default', sx: { alignSelf: 'flex-start' } },
            ]));
        } else {
            setColumns(() => columnsList);
        }
    }, []);

    //tour
    const [chronoOpen, setChronoOpen] = React.useState(false);
    const { isOpen: isTourOpen, index: tourIndex } = useTour();

    const tour = useSectionTour({
        id: 'nex_v2_pesiEvolumi',
        version: '2.0.0',
        user: {
            id: userContext?.details?._id ?? '',
            role: (userContext?.details?.ruolo as Role) ?? 'Tester',
        },
        keys: 'pesiEvolumi',
        actions: {
            3: () => { setChronoOpen(false) },
            4: () => { setChronoOpen(true) },
            5: () => { setChronoOpen(false) },
        }
    });

    //

    const abortController = React.useRef<AbortController | null>(null);
    const cancelRequest = React.useCallback(() => {
        if (abortController.current) {
            abortController.current.abort();
            abortController.current = null;
        }
    }, []);

    const [loadingChrono, setLoadingChrono] = React.useState<boolean>(true); // serve a mostrare/nascondere il loader del widget Chrono
    const ChangeLoadingChronoState = React.useCallback(
        () => setLoadingChrono((v) => !v),
        []
    );
    const [loadingTable, setLoadingTable] = React.useState<boolean>(false); // serve a mostrare/nascondere il loader della tabella principale
    const ChangeLoadingTableState = React.useCallback(
        () => setLoadingTable((v) => !v),
        []
    );
    const DisableLoadTableState = React.useCallback(
        () => setLoadingTable(false),
        []
    );

    // null = "tutti i magazzini"
    const [warehouse, setWarehouse] = React.useState<number | null>(5); // serve a memorizzare il magazzino selezionato (null=tutti)
    const WarehouseChange = (value: number | null) => {
        RetriveData(btnActived, value);
    };


    React.useEffect(() => {
        if (userContext?.details === undefined) { return; }
        ChangeLoadingTableState();
        RetriveData(1);
        RetriveData(0);

        return () => {
            cancelRequest();
        }
    }, [userContext?.details]);

    function InsertRow(item: any): void {
        ActionOnData(0, item);
        setChronoData(prev => {
            const copy = [...prev];
            const findIndexInMainTab = dataContext.dati.findIndex(e => (e as any).ci === item.ci);
            if (findIndexInMainTab !== -1) {
                Object.assign(item, dataContext.dati[findIndexInMainTab]);
                return [item, ...prev];
            } else {
                const chronoIndex = copy.findIndex(e => (e as any).ci === item.ci);
                if (chronoIndex !== -1) {
                    Object.assign(copy[chronoIndex], item);
                }
                return copy;
            }
        });
        setDataContext(prev => {
            const copy = [...prev.dati];
            const indexE = copy.findIndex(e => (e as any).ci == item.ci);
            if (indexE !== -1) {
                copy.splice(indexE, 1);
            }
            return { dati: copy };
        });
    }

    function DeleteRow(item: any): void {
        setChronoData(prev => {
            const copy = [...prev];
            const indexE = copy.findIndex(e => (e as any).codiceArticolo == item.codiceArticolo);
            if (indexE !== -1) {
                copy.splice(indexE, 1);
            }
            return copy;
        });
        setDataContext(prev => {
            return { dati: [item, ...prev.dati] };
        });
        ActionOnData(1, item);
    }

    function ActionOnData(tp: 0 | 1, dataToSave: any): void {
        SaveDataAPI({
            userContext: userContext as UserState,
            abortController: abortController,
            tp: tp,
            dataToSave: dataToSave
        } as any);
    }

    function RetriveData(tp: number, wh?: number | null): void {
        if (loadingTable) {
            cancelRequest();
        }

        let whInputed: string | null;
        if (wh === null) {
            whInputed = null;
        } else if (typeof wh === 'number') {
            whInputed = warehouseList[wh];
        } else if (warehouse === null) {
            whInputed = null;
        } else {
            whInputed = warehouseList[warehouse];
        }

        setLoadingTable(true);

        DataAPI({
            userContext: userContext as UserState,
            abortController: abortController,
            setDataContext: setDataContext,
            tp: tp,
            setChronoData: setChronoData,
            ChangeLoadingChronoState: ChangeLoadingChronoState,
            ChangeErrorStatus,
            DisableLoadTableState: DisableLoadTableState,
            warehouse: whInputed
        } as any);
    }

    // chips per i filtri attivi
    // derivati dai filtri controllati
    // usati sia in TopBar che in DocumentsSearch
    const chips: FilterChip[] = [
        ...((warehouse ? warehouseList[warehouse] : '') !== "" ? [{ key: "Magazzino", label: "Tipologia", value: (warehouse ? warehouseList[warehouse] : ''), onRemove: () => setWarehouse(null) }] : []),
    ];

    // ===== EXPORT CSV =====
    const handleDownloadCsv = React.useCallback(() => {
        // dati attualmente mostrati in tabella
        const rows = dataContext.dati ?? [];

        // colonne nell'ordine visualizzato
        const cols = (columns ?? []).map(c => c.key);

        // normalizza i campi data (se type === 'date' e dateType === 'ibmi')
        const dateColsIbmi = (columns ?? [])
            .filter(c => c.type === 'date' && c.dateType === 'ibmi')
            .map(c => c.key);

        const normalizedRows = rows.map((r) => {
            const copy: Record<string, unknown> = { ...r };
            for (const k of dateColsIbmi) {
                copy[k] = ibmiToISO((r as any)?.[k]);
            }
            return copy;
        });

        // filename base: tab + magazzino o "tutti"
        const tabName = buttonList[(btnActived ?? 1) - 1] ?? 'tab';
        const whLabel = warehouse === null ? 'tutti' : warehouseList[warehouse];
        const filenameBase = `pesi-volumi_${tabName}_${whLabel}`;

        // alcune colonne da forzare come testo per non perdere zeri in Excel
        const forcedTextCols = ['ci', 'codiceProduttore', 'codiceMagazzino'];

        downloadCsvFromRows(normalizedRows, {
            columns: cols,
            filenameBase,
            forcedTextCols,
            // delimiter ';' e decimalComma true sono i default dell’helper
            // includeHeader e BOM restano di default true
        });
    }, [dataContext.dati, columns, btnActived, warehouse]);

    if (userContext?.details === null) {
        return <div>Error Loading User details</div>;
    }
    if (!userContext?.details) {
        return (
            <div>
                <Loader />
            </div>
        );
    }
    if (!userContext.token) {
        return (
            <div>
                <Loader />
            </div>
        );
    }

    return (
        <DashboardLayout>
            <div className='flex w-full flex-col gap-3 h-full'>
                <ParmBar
                    InsertRow={InsertRow}
                    abortController={abortController}
                    userContext={{ token: userContext.token }}
                />

                <Chrono
                    chronoData={chronoData as unknown as any[]}
                    noChronoAvatar={noChronoAvatar}
                    DeleteRow={DeleteRow}
                    loadingChrono={loadingChrono}
                    isOpen={chronoOpen}
                    onToggle={() => setChronoOpen(prev => !prev)}
                />

                <SubHeader
                    theme={theme}
                    loadingTable={loadingTable}

                    tabList={buttonList as unknown as string[]}
                    tabActived={btnActived}
                    changeTab={changeTab}

                    chips={chips}

                    contextMenuRef={contextMenuRef} setOpenDownloadMenu={setOpenDownloadMenu}
                    setOpenFiltersPanel={setOpenFiltersPanel}
                />

                <TableVirtualized
                    data={dataContext.dati}
                    whereToFindData="dati"
                    loadStatus={loadingTable}
                    setData={setDataContext}
                    results={dataContext.dati.length}
                    columns={columns}
                    setColumns={setColumns}
                    className='h-full'
                />
            </div>

            <ContextMenu
                openFor={openDownloadMenu || openFiltersMenu}
                pos={contextMenuRef}
                onClose={() => { setOpenDownloadMenu(false); setOpenFiltersPanel(false); }}
                placement="left-start"
                panel={openFiltersMenu ?
                    <TagP
                        status={openFiltersMenu}
                        ChangeStatusTagP={() => setOpenFiltersPanel(false)}
                        warehouses_selected={[warehouse ? warehouseList[warehouse] : ''].filter(Boolean)}
                        setWarehouse={setWarehouse}
                        warehouses_list={warehouseList}
                        noDataWEBP={noDataWEBP}
                        WarehouseChange={WarehouseChange}
                        loadingTable={loadingTable ?? false}
                    />
                    : <div className='p-1 w-[220px] flex flex-col gap-2'>
                        <div className="text-sm font-medium">Download</div>

                        <FDButton
                            size='small'
                            radius='md'
                            fullWidth
                            variant='outline'
                            color='dark'
                            onClick={() => {
                                handleDownloadCsv();
                                setOpenDownloadMenu(false);
                            }}
                            dataTooltipId='general-logistic-tooltip'
                            dataTooltipContent='Scarica il contenuto attuale della tabella'
                        >
                            Tabella
                        </FDButton>
                        <FDButton
                            size='small'
                            radius='md'
                            fullWidth
                            variant='outline'
                            color='dark'
                            onClick={() => {
                                ExportWeightsVolumesCSV({ abortRef: abortController });
                                setOpenDownloadMenu(false);
                            }}
                            dataTooltipId='general-logistic-tooltip'
                            dataTooltipContent='Scarica la lista completa dei pesi e volumi'
                        >
                            Elenco Completo
                        </FDButton>
                    </div>
                }
            />

            <Tooltip id="general-logistic-tooltip" place="bottom" style={{
                maxWidth: "15vw", minWidth: 150, fontSize: '0.87rem', zIndex: 9999,
                textAlign: 'center'
            }} />
        </DashboardLayout >
    );
});
