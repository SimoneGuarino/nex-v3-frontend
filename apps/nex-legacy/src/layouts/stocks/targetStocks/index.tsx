import React from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout"
import { UserContext } from "context/UserContext";

import { FiltersStock } from "./filters"
import { Card, Stack, Fade, Skeleton } from "@mui/material"
import { FiltersDataAPI } from "./fetchData/filtersData";
import { DataRetriveAPI } from "./fetchData/data";
import { TableVirtualized } from "components/Virtualized/table";
import { format } from 'date-fns';
import { CheckAdminPermissions, GetDate } from "utils/index";
import { GeneralError } from "components/NoData/generalError";
import ErrorIMG from 'assets/images/5203299_trasparent.webp';
import { Tooltip } from "react-tooltip";
import { FiltersBar } from "./extraBar/filtersBar";
import { MainTheme } from "assets/settingsTheme";
import { ExtraFooter } from "./extraBar/extraFooter";
import { icon_filter, icon_view } from "config/icons";
import { GroupedDetails } from "./extraPanel/groupedDetails";
import startSearchIcon from "assets/images/actions/start_yours_search.webp";
import MDTypography from "components/MDTypography";
import { useNexTheme } from "@nex/theme-system";



interface UserContextProps {
    details?: object;
    token?: string;
};
interface ColumnsProps {
    key: string | string[];
    label: string;
    sort?: boolean;
    fieldToTake?: any;
    sortType?: "Number" | "String";
    type: "default" | "eur" | "pz" | "info";
    width?: number;
    labelsx?: object;
    sx?: object;
    columnOnHover?: string;
    color?: {
        prop: any;
        type: "func";
        true: string | null;
        false: string | null;
    }
};
interface DataProps {
    buyer: string;
    prefissoFornitore: string;
    codiceArticolo?: string;
    descrizione?: string;
    linea: string;
    descrizioneLinea: string;
    gruppo?: string;
    descrizioneGruppo?: string;
    marca: string;
    q1: null | string;
    q2: null | string;
    q3: null | string;
    q4: null | string;
    q1_gr: null | string;
    q2_gr: null | string;
    q3_gr: null | string;
    q4_gr: null | string;
    stock: string;
    backorder: string;
    fatturatoTrimestreAttuale: string;
    fatturatoTrimestrePrecedente: string;
    fatturatoTrimestreAttualeNew: string;
    fatturatoTrimestrePrecedenteNew: string;
    ocfb: number;
    chiledren?: any;
};


const SkeletonTableLoad: React.FC<{}> = React.memo(() => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";

    return <Fade in={true} timeout={400}><Stack gap={2} height='100%'>
        <Skeleton sx={{
            borderRadius: 3, width: '100%', height: '100%',
            bgcolor: `${darkMode ? '#1c1c1c' : ''}`, minHeight: 580
        }} variant="rounded" />
    </Stack></Fade>
});
const SkeletonFiltersLoad: React.FC<{}> = React.memo(() => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";

    return <Fade in={true} timeout={400}><Stack gap={2} mb={2}>
        <Skeleton sx={{
            borderRadius: 3, width: '100%', minHeight: 100,
            bgcolor: `${darkMode ? '#1c1c1c' : ''}`,
        }} variant="rounded" />
    </Stack></Fade>
});



const TargetStocks: React.FC<{}> = () => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const [userContext, setUserContext] = React.useContext<UserContextProps | any>(UserContext);
    const CheckAdminDev = CheckAdminPermissions({
        userRole: userContext.details.ruolo,
        permissions: userContext.details.permissions, panelToCheck: 'obiettivi_stocks', where: 0
    });

    const [firstLoad, setFirstLoad] = React.useState<Boolean>(true);

    //Errore Fetch iniziale (Emoji Error)
    const [err, setErr] = React.useState(false);

    // Abort il panding del fetch all server
    const abortController = React.useRef<AbortController | null>(null);
    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
        }
    };

    const [tableLoad, setTableLoad] = React.useState(true);
    const [filtersLoad, setFiltersLoad] = React.useState(true);
    //___________________Dati relativi al compare/search
    const backupData = React.useRef<Array<DataProps>>([]);
    const [data, setData] = React.useState<Array<DataProps>>([]);
    const [configsData, setConfigsData] = React.useState<Array<DataProps>>([]);
    const [filtersData, setFiltersData] = React.useState(null);
    const [userChoose, setUserChoose] = React.useState<any>({
        dsd: format(new Date(GetDate().yesterday), 'dd/MM/yyyy'),
        dft: format(new Date(GetDate().fortyFiveDaysAgo), 'dd/MM/yyyy'),
        detailsCheck: true
    });

    //stato del pannello filtri
    const [filterStatus, setFilterStatus] = React.useState(!CheckAdminDev ? false : true);
    //raggruppamento selezionato
    const [groupedItem_, setGroupedItem_] = React.useState<DataProps | null>(null);
    //stato pannello Raggruppamenti
    const [groupedDetailsStatus, setGroupedDetailsStatus] = React.useState<boolean>(false);
    const GroupedDetailsStatusChange = () => setGroupedDetailsStatus(!groupedDetailsStatus);
    const BridgeOpenDetails = (index: number, list: any) => {
        const item_ = list[index];
        console.log(item_)
        setGroupedItem_(item_);
        GroupedDetailsStatusChange();
    };


    const [columns, setColumns] = React.useState<Array<ColumnsProps>>([
        {
            key: [], fieldToTake: [
                {
                    key: 'View', type: 'button', title: 'Vedi i dettagli', ariaLabel: 'edit', icon: icon_view(),
                    funcAction: BridgeOpenDetails, onHoverColor: '#efb530a3'
                },
            ], label: 'Opzioni', type: 'info', width: 100, sx: { alignItems: 'center', flexDirection: 'row' }
        },
        { key: 'buyer', label: 'CodiceBuyer', sort: true, sortType: "String", type: 'default', sx: { alignItems: 'center' }, labelsx: { textAlign: 'center' } },
        { key: 'marca', label: 'Marca', sort: true, sortType: "String", type: 'default', width: 180, sx: { alignItems: 'center' } },
        { key: 'prefissoFornitore', label: 'prefissoFornitore', type: 'default', sx: { alignItems: 'center' } },
        { key: 'codiceArticolo', label: 'Cod.Art', sort: true, sortType: "String", type: 'default', sx: { alignItems: 'center' } },
        { key: 'descrizione', label: 'Descrizione', sort: true, sortType: "String", type: 'default', width: 300, labelsx: { fontWeight: 300 } },
        { key: 'linea', label: 'Linea', sort: true, sortType: "String", type: 'default', sx: { alignItems: 'center' } },
        { key: 'descrizioneLinea', label: 'Desc.Linea', sort: true, sortType: "String", width: 300, type: 'default', sx: { alignItems: 'center' }, labelsx: { textAlign: 'center' } },
        { key: 'gruppo', label: 'Famiglia', sort: true, sortType: "String", type: 'default', sx: { alignItems: 'center' } },
        { key: 'descrizioneGruppo', label: 'Desc.Famiglia', sort: true, sortType: "String", width: 300, type: 'default', sx: { alignItems: 'center' } },

        {
            key: 'q1', label: 'Q1', sort: true, sortType: "Number", type: 'eur', width: 150, sx: { alignItems: 'center' },
            color: {
                type: 'func', prop: () => CheckRangeDateQuorters({ range: { from: new Date("2024-01-01"), to: new Date("2024-03-31"), } }),
                true: '#62a1ff1f', false: null
            }
        },
        {
            key: 'q2', label: 'Q2', sort: true, sortType: "Number", type: 'eur', width: 150, sx: { alignItems: 'center' },
            color: {
                type: 'func', prop: () => CheckRangeDateQuorters({ range: { from: new Date("2024-01-04"), to: new Date("2024-06-30"), } }),
                true: '#62a1ff1f', false: null
            }
        },
        {
            key: 'q3', label: 'Q3', sort: true, sortType: "Number", type: 'eur', width: 150, sx: { alignItems: 'center' },
            color: {
                type: 'func', prop: () => CheckRangeDateQuorters({ range: { from: new Date("2024-07-01"), to: new Date("2024-09-30"), } }),
                true: '#62a1ff1f', false: null
            }
        },
        {
            key: 'q4', label: 'Q4', sort: true, sortType: "Number", type: 'eur', width: 150, sx: { alignItems: 'center' },
            color: {
                type: 'func', prop: () => CheckRangeDateQuorters({ range: { from: new Date("2024-10-01"), to: new Date("2024-12-31"), } }),
                true: '#62a1ff1f', false: null
            }
        },

        { key: 'fatturatoTrimestreAttuale', label: 'Fatturato Trimestre', sort: true, sortType: "Number", type: 'eur', width: 150, sx: { alignItems: 'center' } },
        { key: 'fatturatoTrimestreAttualeNew', label: 'Fatturato Canali', sort: true, sortType: "Number", type: 'eur', columnOnHover: 'E-COMMERCE DISTRIBUTORE/SUBSTRIBUTOR DEALER', 
            width: 150, sx: { alignItems: 'center' } },

        { key: 'fatturatoTrimestrePrecedente', label: 'Fatturato Trimestre Prec.', sort: true, sortType: "Number", type: 'eur', width: 150, sx: { alignItems: 'center' } },
        { key: 'fatturatoTrimestrePrecedenteNew', label: 'Fatturato Canali Prec.', sort: true, sortType: "Number", type: 'eur', columnOnHover: 'E-COMMERCE DISTRIBUTORE/SUBSTRIBUTOR DEALER',
            width: 150, sx: { alignItems: 'center' } },

        { key: 'ocfb', label: 'OC/FB', sort: true, sortType: "Number", type: 'eur', width: 120, sx: { alignItems: 'center' } },
        { key: 'stock', label: 'Stock', sort: true, sortType: "Number", type: 'eur', width: 120, sx: { alignItems: 'center' } },
        { key: 'backorder', label: 'BackOrder', sort: true, sortType: "Number", type: 'eur', width: 120, sx: { alignItems: 'center' } },
    ]);

    //Carica i salvataggi Cookie se esiste se no attiva tutte le colonne.
    const expectionsForColumnsGroup = ['codiceArticolo', 'prefissoFornitore', 'descrizione', 'gruppo', 'descrizioneGruppo']
    const raggrupColumns = React.useRef<Array<any>>(columns.map((column: ColumnsProps) =>
        !Array.isArray(column.key) ? (Boolean(!expectionsForColumnsGroup.includes(column.key)) && column) : column));
    const defaultColumns = React.useRef<Array<ColumnsProps>>(columns.filter((column: ColumnsProps) => !Array.isArray(column.key)));

    //Parametri
    const [categorySelected, setCategorySelected] = React.useState<{ linea: string } | null>(null);



    const CheckRangeDateQuorters = ({ range }: { range: { to: Date, from: Date } }) => {
        const currentDate = new Date();
        // Controlla se la data corrente è compresa tra fromDate e toDate
        return currentDate >= range.from && currentDate <= range.to;
    }

    React.useEffect(() => {
        if (userContext && userContext.details === undefined) { return; }

        if(!CheckAdminDev){ DataRetrive(); }else{ setTableLoad(false); }
        FiltersData();

        return () => {
            cancelRequest();
        };
    }, [userContext.details]);

    /**
     * Permette di regruppare gli elementi presenti all'interno dell'array utilizzando diversi parametri
     * in modo da generare un nuovo array con gli elementi gruppati
     * @param data Array di dati su cui svolegere le operazioni.
     * @param groupBy Array di stringhe che permette di grouppare per quei parametri inseriti all'interno dell'array.
     * @param paramsListToSum Array di stringhe che permette di definire quale parametri numerici sommare tra di loro.
     * @returns array di oggetti gruppati.
     */
    const RegrupArray = ({ data, groupBy, paramsListToSum, configsData_props }:
        { data: Array<DataProps>; groupBy: Array<string>, paramsListToSum?: Array<string>, configsData_props?: Array<string> }): Array<DataProps> => {
        const group: Array<DataProps> = [];
        if (data && data.length > 0) {
            for (let i = 0; i < data.length; i++) {
                const e: DataProps = data[i];
                const groupIndex = group.findIndex((x: DataProps) =>
                    groupBy.every((prop: string) => (x as any)[prop] === (e as any)[prop]));
                const e_: any = {
                    buyer: e.buyer,
                    marca: e.marca,
                    prefissoFornitore: e.prefissoFornitore,
                    linea: e.linea,
                    descrizioneLinea: e.descrizioneLinea,
                    fatturatoTrimestreAttuale: e.fatturatoTrimestreAttuale,
                    fatturatoTrimestrePrecedente: e.fatturatoTrimestrePrecedente,
                    fatturatoTrimestreAttualeNew: e.fatturatoTrimestreAttualeNew,
                    fatturatoTrimestrePrecedenteNew: e.fatturatoTrimestrePrecedenteNew,
                    q1: e.q1,
                    q2: e.q2,
                    q3: e.q3,
                    q4: e.q4,
                    q1_gr: e.q1_gr, //derivato dall'impostazione dei tutti le sottocategorie. (senza gruppo nel configuratore)
                    q2_gr: e.q2_gr, //derivato dall'impostazione dei tutti le sottocategorie. (senza gruppo nel configuratore)
                    q3_gr: e.q3_gr, //derivato dall'impostazione dei tutti le sottocategorie. (senza gruppo nel configuratore)
                    q4_gr: e.q4_gr, //derivato dall'impostazione dei tutti le sottocategorie. (senza gruppo nel configuratore)
                    backorder: e.backorder,
                    stock: e.stock,
                    ocfb: e.ocfb,
                    chiledren: []
                };

                const configsData_: any = configsData_props ? configsData_props : configsData;

                //quorters idex all'inderno dell'array di di configs
                const qIndex_ = configsData_.findIndex((x: {buyer: string; marca: string; linea: string;}) => 
                    x.buyer === e_.buyer && x.marca === e_.marca && x.linea === e_.linea);
                if(qIndex_ !== -1){
                    if(configsData_[qIndex_].q1){
                        e_.q1 = configsData_[qIndex_].q1;
                        e_.q1_gr = configsData_[qIndex_].q1;
                    }
                    if(configsData_[qIndex_].q2){
                        e_.q2 = configsData_[qIndex_].q2;
                        e_.q2_gr = configsData_[qIndex_].q2;
                    }
                    if(configsData_[qIndex_].q3){
                        e_.q3 = configsData_[qIndex_].q3;
                        e_.q3_gr = configsData_[qIndex_].q3;
                    }
                    if(configsData_[qIndex_].q4){
                        e_.q4 = configsData_[qIndex_].q4;
                        e_.q4_gr = configsData_[qIndex_].q4;
                    };
                };

                if (groupIndex !== -1) {
                    if (paramsListToSum) {
                        //somma le proprietà
                        paramsListToSum.forEach((prop) => {
                            return (group[groupIndex] as any)[prop] =
                                parseFloat((group[groupIndex] as any)[prop]) + parseFloat((e as any)[prop]);
                        });
                    };
                    const indexInArray = group[groupIndex].chiledren.findIndex((d: any) => d.gruppo === e.gruppo);
                    if (indexInArray == -1) {
                        group[groupIndex].chiledren = [...(group[groupIndex].chiledren || []), e];
                    }
                } else {
                    //inserisci l'elemento
                    group.push(e_);
                };
            };
        };

        return group;
    };

    const RetriveDataNoFilters = React.useCallback(() => {
        setTableLoad(true);
        setUserChoose((_: any) => {
            const reset = {
                dsd: format(new Date(GetDate().yesterday), 'dd/MM/yyyy'),
                dft: format(new Date(GetDate().fortyFiveDaysAgo), 'dd/MM/yyyy'),
                detailsCheck: true,
            };
            DataRetriveAPI(userContext, abortController, setData, reset, setTableLoad, 
                backupData, CheckAdminDev, setConfigsData);
            return reset;
        });
    }, [abortController]);

    const DataRetrive = React.useCallback(() => {
        if(firstLoad){ setFirstLoad(false); };
        setTableLoad(true);
        const details = { ...userChoose, lin: categorySelected ? categorySelected.linea : null }
        DataRetriveAPI(userContext, abortController, setData, details, setTableLoad,
            backupData, CheckAdminDev, setConfigsData, userChoose.detailsCheck, RegrupArray);

        if (userChoose.detailsCheck) {
            setColumns(defaultColumns.current);
        } else {
            setColumns(raggrupColumns.current);
        };
    }, [data, userChoose, categorySelected, firstLoad]);

    const FiltersData = React.useCallback(() => {
        setFiltersLoad(true);
        FiltersDataAPI(userContext, abortController, setFiltersData, setFiltersLoad);
    }, []);



    return <DashboardLayout>
        {!err ? <React.Fragment>
            {!filtersLoad ? <Fade in={true} timeout={800}><Stack>
                <FiltersBar setFilterStatus={setFilterStatus} RetriveDataNoFilters={RetriveDataNoFilters} /></Stack></Fade>
                : <SkeletonFiltersLoad />}
            { !firstLoad ? 
                    !tableLoad ? <Fade in={true} timeout={800}><Card sx={{ marginTop: 1, height: '100%' }}>
                        <TableVirtualized
                            columns={columns}
                            setColumns={setColumns}
                            data={data}
                            setData={setData}
                            results={data.length}
                            whereToFindData={false}
                        />
                        {(data && data.length > 0) && <ExtraFooter data={data} />}
                        </Card>
                        </Fade>
                    : <SkeletonTableLoad />
                :
            <Stack alignItems='center' gap={2}>
                <img src={startSearchIcon} style={{width: '100%', maxWidth: 500}}/>
                <MDTypography variant="body2">Inizia subito ricercando i dati necessari, apri il pannelo dei filtri {icon_filter({ width: 25, height: 25})} </MDTypography>
            </Stack>}
        </React.Fragment> : <GeneralError img={ErrorIMG} />}
        {!filtersLoad && <FiltersStock filterStatus={filterStatus} setFilterStatus={setFilterStatus}
            filtersData={filtersData} DataRetrive={DataRetrive} userContext={userContext}
            userChoose={userChoose} setUserChoose={setUserChoose} CheckAdminDev={CheckAdminDev}
            categorySelected={categorySelected} setCategorySelected={setCategorySelected}
            tableLoad={tableLoad} />}
        {groupedItem_ && <GroupedDetails statusMode={groupedDetailsStatus} ChangeStatus={GroupedDetailsStatusChange}
            item_={groupedItem_} />}
        <Tooltip id="general-obiettivi-stocks-tooltip" place="bottom" style={{
            maxWidth: "15vw", minWidth: 150, fontSize: '0.87rem', zIndex: 9999,
            textAlign: 'center'
        }} />
    </DashboardLayout>
};

export default TargetStocks;