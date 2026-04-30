import React from "react";
import ErrorIMG from 'assets/images/5203299_trasparent.webp';
import { GeneralError } from "components/NoData/generalError";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import { Fade, Skeleton, Stack } from "@mui/material";
import { Tooltip } from "react-tooltip";
import { DistributorsListAPI } from "./fetch/distributorsList";
import { UserContext } from "context/UserContext";
import { MainBar } from "./components/mainBar";
import { TableVirtualized } from "components/Virtualized/table";
import { InsertBar } from "./components/insertBar";
import { GetDistributorsParamsAPI } from "./fetch/getDistributorsParms";
import { enqueueSnackbar } from "components/MessageBox";
import { GetTableDataAPI } from "./fetch/getTableData";
import { InfiniteScrollAPI } from "./fetch/InfiniteScrollAPI";
import { icon_delete } from "config/icons";
import { PopupInfo } from "components/PopupInfo";
import { ConfiguratorsActionsAPI } from "./fetch/configuratorsActions";
import { ContextMenu } from "components/UI/menu/ContextMenu";
import FiltersPanelInMenu from "./components/Filters";
import { FilterChip } from "components/UI/search/FDSearchPanel";

export type itemsFamiglia = {
    famiglia: string,
    descrizione: string,
    buyer: string[]
};
export type itemsGruppo = {
    gruppo: string,
    descrizione: string,
    famiglie: itemsFamiglia[]
};
export type itemsLinea = {
    linea: string,
    descrizione: string,
    gruppi: itemsGruppo[]
};
export type DistributorStructure = {
    focelda: {
        categorie: itemsLinea[],
        gruppi: itemsGruppo[],
        famiglie: itemsFamiglia[],
        raggruppamenti: Array<{ valore: string, descrizione: string }>
    },
    fornitore: {
        linee: Array<{ valore: string, descrizione: string }>
        gruppi: Array<{ valore: string, descrizione: string }>
        famiglie: Array<{ valore: string, descrizione: string }>
    }
};

interface InsertElementsProps {
    linea: { valore: string | number, descrizione: string };
    gruppo: { valore: string | number, descrizione: string };
    famiglia: { valore: string | number, descrizione: string };
    raggruppamento: { valore: string | number, descrizione: string };
};
const CorrelazioneCategorieDistributori: React.FC<{}> = () => {
    const [userContext] = React.useContext<any>(UserContext);
    const [loadStatus, setLoadStatus] = React.useState<any>({
        correlations: true,
        table: false,
    });
    const ChangeLoadStatus = ({ from, bool }: { from: string, bool: boolean }) => {
        setLoadStatus((prev: any) => ({ ...prev, [from]: bool !== undefined ? bool : !prev[from] }))
    };

    // Nome del fornitore attualmente cercato, permette di mantenere una coerenza con i dati visualizzati in tabella.
    const [distributorsOnTableSearched, setDistributorsOnTableSearched] = React.useState<string | null>(null);
    // Distributors list (index)
    const [distributor, setDistributor] = React.useState<number | null>(null);
    // Stato che contiene la lista dei distributori.
    const [distributorList, setDistributorList] = React.useState<any>([]);
    // stato che contiene la struttura delle categorie del fornitore cercato.
    const [distributorStructure, setDistributorStructure] = React.useState<DistributorStructure>({
        focelda: {
            categorie: [],
            gruppi: [], //gruppi estrapolati dalle categorie
            famiglie: [], //famiglie estrapolate dalle categorie
            raggruppamenti: []
        },
        fornitore: {
            linee: [],
            gruppi: [],
            famiglie: []
        }
    });

    //  Funzione che elimina un elemento dalla tabella.
    const deleteItem = (i: number, array: any) => {
        ConfiguratorsActionsAPI({
            userContext, abortController, setFilteredData, setRawData, settings: {
                tp: 0,
                dataToSend: array[i]._id,
            }
        });

        const newArray = [...array];
        newArray.splice(i, 1);
        setFilteredData(newArray);

        //cancella anche da rawData l'elemento eliminato
        setRawData((prev: any) => prev.filter((item: any) => item._id !== array[i]._id));
    };

    const [columns, setColumns] = React.useState<any>([
        {
            key: [], fieldToTake: [
                {
                    key: 'Delete', type: 'button', title: 'Cancella', ariaLabel: 'edit', icon: icon_delete(),
                    funcAction: deleteItem, onHoverColor: '#efb530a3'
                },
            ], label: 'Opzioni', type: 'info', width: 100, sx: { alignItems: 'center', flexDirection: 'row' }
        },
        { secKey: 'linea', key: 'focelda', label: 'Linea', sort: true, sortType: "Number", type: 'default', width: 200, sx: { alignItems: 'center' } },
        { secKey: 'gruppo', key: 'focelda', label: 'Gruppo', sort: true, sortType: "Number", type: 'default', width: 200, sx: { alignItems: 'center' } },
        { secKey: 'famiglia', key: 'focelda', label: 'Famiglia', sort: true, sortType: "Number", type: 'default', width: 200, sx: { alignItems: 'center' } },
        { secKey: 'raggruppamento', key: 'focelda', label: 'Raggruppamento', sort: true, sortType: "Number", type: 'default', width: 200, sx: { alignItems: 'center' } },

        { secKey: 'linea', key: 'fornitore', label: 'Fornitore Linea', sort: true, sortType: "Number", type: 'default', width: 200, sx: { alignItems: 'center' } },
        { secKey: 'gruppo', key: 'fornitore', label: 'Fornitore Gruppo', sort: true, sortType: "Number", type: 'default', width: 200, sx: { alignItems: 'center' } },
        { secKey: 'famiglia', key: 'fornitore', label: 'Fornitore Famiglia', sort: true, sortType: "Number", type: 'default', width: 200, sx: { alignItems: 'center' } },

    ]);
    const [rawData, setRawData] = React.useState<any>([]); // dati iniziali della tabella
    const [filteredData, setFilteredData] = React.useState<any>([]); // dati filtrati

    const [panelAddStatus, setAddPanelStatus] = React.useState<boolean>(false);
    const [openFiltersPanel, setOpenFiltersPanel] = React.useState(false); // per mostrare/nascondere il pannello filtri
    const contextMenuRef = React.useRef<HTMLDivElement>(null); // riferimento per il context menu

    // stato dei filtri controllati
    const [filterFocLinea, setFilterFocLinea] = React.useState<string | itemsLinea>('');
    const [filterFocGruppo, setFilterFocGruppo] = React.useState<string | itemsGruppo>('');
    const [filterFocFamiglia, setFilterFocFamiglia] = React.useState<string | itemsFamiglia>('');
    const [filterFocRaggruppamento, setFilterFocRaggruppamento] = React.useState<string>('');
    const [filterDistLinea, setFilterDistLinea] = React.useState<string>('');
    const [filterDistGruppo, setFilterDistGruppo] = React.useState<string>('');
    const [filterDistFamiglia, setFilterDistFamiglia] = React.useState<string>('');

    const offset = React.useRef<number>(0);
    const [err, setErr] = React.useState(false);
    const abortController = React.useRef<AbortController | null>(null);

    React.useEffect(() => {
        if (!userContext || (userContext && !userContext.details)) return;
        DistributorsListAPI({ userContext, abortController, setDistributorList, setDistributorStructure });
    }, [userContext]);

    const Search = () => {
        if (distributor === null) {
            return enqueueSnackbar('Seleziona un fornitore prima di aprire il pannello di inserimento configurazione.', {
                title: 'Seleziona Fornitore',
                type: 'warning',
            });
        };
        setDistributorsOnTableSearched(distributorList[distributor]);
        ChangeLoadStatus({ from: 'table', bool: true });
        GetDistributorsParamsAPI({
            userContext,
            abortController,
            distributorsName: distributorList[distributor],
            setDistributorStructure,
            ChangeLoadStatus
        });
        GetTableDataAPI({
            userContext,
            abortController,
            distributorsName: distributorList[distributor],
            setRawData,
            setFilteredData,
            ChangeLoadStatus
        });
    };

    /*const infiniteScroll = () => {
        return InfiniteScrollAPI({
            userContext,
            abortController,
            setData: setRawData,
            distributorsName: distributorsOnTableSearched,
            setErr,
            offset: offset.current
        })
    };*/

    //  Funzione che inserisce i dati inseriti dall'utente in tabella.
    const insertConfigInTable = ({ focData, distData }: { focData: InsertElementsProps, distData: InsertElementsProps }) => {
        const hasValidData = (data: InsertElementsProps) => {
            return Object.values(data).some(item => item !== "" && item !== null && item !== undefined);
        };

        if (hasValidData(focData) && hasValidData(distData)) {
            const getValue = (data: any, type: string) =>
                data[type] ? data[type].valore : null;

            const newData: { [key: string]: any } = {
                focelda: {
                    linea: getValue(focData, 'linea'),
                    gruppo: getValue(focData, 'gruppo'),
                    famiglia: getValue(focData, 'famiglia'),
                    raggruppamento: getValue(focData, 'raggruppamento')
                },
                fornitore: {
                    linea: getValue(distData, 'linee'),
                    gruppo: getValue(distData, 'gruppi'),
                    famiglia: getValue(distData, 'famiglie')
                }
            };

            // Controllo se la configurazione è già presente in tabella.
            const isDuplicate = rawData.some((item: any) =>
                item.focelda.linea === newData.focelda.linea &&
                item.focelda.gruppo === newData.focelda.gruppo &&
                item.focelda.famiglia === newData.focelda.famiglia &&
                item.focelda.raggruppamento === newData.focelda.raggruppamento &&
                item.fornitore.linea === newData.fornitore.linea &&
                item.fornitore.gruppo === newData.fornitore.gruppo &&
                item.fornitore.famiglia === newData.fornitore.famiglia
            );

            if (isDuplicate) {
                return enqueueSnackbar('La configurazione esiste già in tabella.', {
                    title: 'Duplicato',
                    type: 'warning',
                });
            };

            if (!distributorsOnTableSearched) {
                return enqueueSnackbar('Seleziona un fornitore prima di inserire una configurazione.', {
                    title: 'Seleziona Fornitore',
                    type: 'warning',
                });
            };

            ConfiguratorsActionsAPI({
                userContext, abortController, setFilteredData, setRawData, settings: {
                    tp: 1,
                    dataToSend: newData,
                    nome: distributorsOnTableSearched
                }
            });
        } else {
            return enqueueSnackbar('Entrambe le configurazioni devono avere almeno una proprietà diversa da una stringa vuota.', {
                title: 'Dati non validi',
                type: 'warning',
            });
        }
    };

    // chips per i filtri attivi
    // derivati dai filtri controllati
    // usati sia in TopBar che in DocumentsSearch
    const chips: any = [
        ...(filterFocLinea ? [{ key: "filterFocLinea", label: "Linea", value: typeof filterFocLinea != "string" ? filterFocLinea?.linea : filterFocLinea, onRemove: () => setFilterFocLinea('') }] : []),
        ...(filterFocGruppo ? [{ key: "filterFocGruppo", label: "Gruppo", value: typeof filterFocGruppo != "string" ? filterFocGruppo?.gruppo : filterFocGruppo, onRemove: () => setFilterFocGruppo('') }] : []),
        ...(filterFocFamiglia ? [{ key: "filterFocFamiglia", label: "Famiglia", value: typeof filterFocFamiglia != "string" ? filterFocFamiglia?.famiglia : filterFocFamiglia, onRemove: () => setFilterFocFamiglia('') }] : []),
        ...(filterFocRaggruppamento !== "" ? [{ key: "filterFocRaggruppamento", label: "Raggruppamento", value: filterFocRaggruppamento, onRemove: () => setFilterFocRaggruppamento("") }] : []),
        ...(filterDistLinea !== "" ? [{ key: "filterDistLinea", label: "Fornitore Linea", value: filterDistLinea, onRemove: () => setFilterDistLinea("") }] : []),
        ...(filterDistGruppo !== "" ? [{ key: "filterDistGruppo", label: "Fornitore Gruppo", value: filterDistGruppo, onRemove: () => setFilterDistGruppo("") }] : []),
        ...(filterDistFamiglia !== "" ? [{ key: "filterDistFamiglia", label: "Fornitore Famiglia", value: filterDistFamiglia, onRemove: () => setFilterDistFamiglia("") }] : []),
    ];

    //funzione che applica i filtri ai dati della tabella, usando gli stati dei filtri controllati
    function applyFilters() {
        let filteredData = [...rawData];
        if (filterFocLinea) {
            filteredData = filteredData.filter(item =>
                item.focelda.linea === (typeof filterFocLinea !== "string" ? filterFocLinea?.linea : filterFocLinea)
            );
        }
        if (filterFocGruppo) {
            filteredData = filteredData.filter(item =>
                item.focelda.gruppo === (typeof filterFocGruppo !== "string" ? filterFocGruppo?.gruppo : filterFocGruppo)
            );
        }
        if (filterFocFamiglia) {
            filteredData = filteredData.filter(item =>
                item.focelda.famiglia === (typeof filterFocFamiglia !== "string" ? filterFocFamiglia?.famiglia : filterFocFamiglia)
            );
        }
        if (filterFocRaggruppamento) {
            filteredData = filteredData.filter(item =>
                item.focelda.raggruppamento === filterFocRaggruppamento
            );
        };

        console.log(filteredData);
        if (filterDistLinea) {
            filteredData = filteredData.filter(item =>
                item.fornitore.linea === filterDistLinea
            );
        }
        if (filterDistGruppo) {
            filteredData = filteredData.filter(item =>
                item.fornitore.gruppo === filterDistGruppo
            );
        }
        if (filterDistFamiglia) {
            filteredData = filteredData.filter(item =>
                item.fornitore.famiglia === filterDistFamiglia
            );
        }
        setFilteredData(filteredData);
    };


    return <DashboardLayout>
        {!err ? <Stack gap={2} sx={{ height: '100%' }}>
            <MainBar distributorList={distributorList} distributor={distributor} setDistributor={setDistributor}
                Search={Search} loadStatus={loadStatus}
                panelAddStatus={panelAddStatus} distributorName={typeof distributor === 'number' ? distributorList[distributor] : null}
                setAddPanelStatus={setAddPanelStatus} distributorStructure={distributorStructure}
                distributorsOnTableSearched={distributorsOnTableSearched}
                menuRef={contextMenuRef} setOpenFiltersPanel={setOpenFiltersPanel} chips={chips} />

            {panelAddStatus && <InsertBar insertConfigInTable={insertConfigInTable}
                distributorStructure={distributorStructure}
            />}

            {<PopupInfo close={false}
                title='Informazioni'
                body='Gli elementi che visualizzerai in tabella saranno le configurazioni/associazioni linea, gruppo, famiglia. 
                già create precedentemente per il fornitore attualmente selezionato.' />}

            {(distributorsOnTableSearched) && (
                !loadStatus.table ? <Fade in={true} timeout={500}><Stack sx={{ borderRadius: 3, height: '100%' }}>
                    <TableVirtualized
                        data={filteredData}
                        setData={setFilteredData}
                        results={filteredData.length}
                        columns={columns}
                        setColumns={setColumns}
                        footerSettings={{ showColSettings: false }}
                        loadStatus={loadStatus.table}
                        /*infiniteScroll={{
                            func: infiniteScroll,
                            offset: offset
                        }}*/
                    />
                </Stack></Fade>
                    : <Fade in={true}>
                        <Skeleton height="calc(100vh - 370px)" sx={{ borderRadius: 3, width: '100%' }} variant="rounded" /></Fade>)}
        </Stack>
            : <GeneralError img={ErrorIMG} />}

        {/* Tooltip Generale per l'onHover title */}
        <Tooltip id="general-confg-correlazione-categorie-tooltip" place="bottom" style={{
            maxWidth: "15vw", minWidth: 150, fontSize: '0.87rem', zIndex: 9999,
            textAlign: 'center'
        }} />

        {/* Context Menu per i Release Notes */}
        <ContextMenu
            openFor={openFiltersPanel}
            pos={contextMenuRef}
            onClose={() => setOpenFiltersPanel(false)}
            panel={<FiltersPanelInMenu
                filterFocLinea={filterFocLinea} setFilterFocLinea={setFilterFocLinea}
                filterFocGruppo={filterFocGruppo} setFilterFocGruppo={setFilterFocGruppo}
                filterFocFamiglia={filterFocFamiglia} setFilterFocFamiglia={setFilterFocFamiglia}
                filterFocRaggruppamento={filterFocRaggruppamento} setFilterFocRaggruppamento={setFilterFocRaggruppamento}
                filterDistLinea={filterDistLinea} setFilterDistLinea={setFilterDistLinea}
                filterDistGruppo={filterDistGruppo} setFilterDistGruppo={setFilterDistGruppo}
                filterDistFamiglia={filterDistFamiglia} setFilterDistFamiglia={setFilterDistFamiglia}
                distributorStructure={distributorStructure}
                //actions
                applyFilters={applyFilters}
            />}
        />
    </DashboardLayout>;
};

export default CorrelazioneCategorieDistributori;