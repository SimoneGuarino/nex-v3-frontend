import React from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout"
import { UserContext } from "context/UserContext";

import { Card, Stack, Fade, Skeleton } from "@mui/material"
import { TableVirtualized } from "components/Virtualized/table";
import { CheckAdminPermissions } from "utils/index";
import { GeneralError } from "components/NoData/generalError";
import ErrorIMG from 'assets/images/5203299_trasparent.webp';
import { Tooltip } from "react-tooltip";
import { MainTheme } from "assets/settingsTheme";
import { icon_view } from "config/icons";
import { ViewDetails } from "./extraPanel/viewDetails";
import { DetailsAPI } from "./fetch/details";
import MinLoader from "../../../minLoader";
import { useNexTheme } from "@nex/theme-system";


interface UserContextProps {
    details?: object;
    token?: string;
};
interface ColumnsProps {
    secKey?: string;
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

    return <Fade in={true} timeout={400}><Stack gap={2} height='100%' alignItems='center' justifyContent='center'>
        <Skeleton sx={{
            borderRadius: 3, width: '100%', height: '100%',
            bgcolor: `${darkMode ? '#1c1c1c' : ''}`, minHeight: 580
        }} variant="rounded" />
        <MinLoader sx={{ width: 25, height: 25, position: 'absolute' }} />
    </Stack></Fade>
});

const TargetAgents: React.FC<{}> = () => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const [userContext, setUserContext] = React.useContext<UserContextProps | any>(UserContext);
    const CheckAdminDev = CheckAdminPermissions({
        userRole: userContext.details.ruolo,
        permissions: userContext.details.permissions, panelToCheck: 'obiettivi_commerciali', where: 0
    });


    const [loadStatus, setLoadStatus] = React.useState<any>({
        table: false,
        dataOnInspect: false,
    });
    const ChangeLoadStatus = ({ from, bool }: { from: "table" | "dataOnInspect"; bool?: boolean }) => {
        setLoadStatus((prev: {
            table: boolean,
            dataOnInspect: boolean,
        }) => ({...prev, [from]: bool !== undefined ? bool : !prev[from]}))
    };

    //Errore Fetch iniziale (Emoji Error)
    const [err, setErr] = React.useState(false);
    // Abort il panding del fetch all server
    const abortController = React.useRef<AbortController | null>(null);
    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
            abortController.current = null; // Reset after abort
        }
    };

    //Stato che mantiene il quarter ricorrente.
    const [q_, setQ_] = React.useState<null | {quarter: string; range: any}>(null);
    const [groupedDetailsStatus, setGroupedDetailsStatus] = React.useState<boolean>(false);
    const GroupedDetailsStatusChange = () => setGroupedDetailsStatus(!groupedDetailsStatus);

    const [tableLoad, setTableLoad] = React.useState(false);
    //___________________Dati relativi al compare/search
    const [data, setData] = React.useState<Array<any>>([
        /*{
            linea: "Tastiere Mouse",
            trimestri: {
              q1: 200,
              q2: 200,
              q3: 300,
              q4: 300,
            },
            fatturati: {
                q1: 200,
                q2: 200,
                q3: 300,
                q4: 300,
            },
            marche: [{
                nome: 'SAMSUNG',
                assegnazioni: [
                    {
                        commerciale: 'SMI',
                        canaleVendita: 'TEST1',
                        annuale: 0,
                        fatturati: {
                            q1: 200,
                            q2: 200,
                            q3: 300,
                            q4: 300,
                        },
                        trimestri: {
                            q1: 200,
                            q2: 200,
                            q3: 300,
                            q4: 300,
                        },
                    }
                ]
            }]
        }*/
    ]);

    //raggruppamento selezionato
    const [inspectedItemCopy_, setInspectedItemCopy_] = React.useState<DataProps | null>(null);
    const [groupedItem_, setGroupedItem_] = React.useState<DataProps | null>(null);
    const BridgeOpenDetails = (index: number, list: any) => {
        ChangeLoadStatus({from: 'dataOnInspect', bool: true});
        const item_ = list[index];
        setGroupedDetailsStatus(true);
        DetailsAPI({ userContext, abortController, item_, setInspectedItemCopy_, ChangeLoadStatus, setGroupedItem_ })
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
        { key: 'linea', label: 'Linea', type: 'default', sx: { alignItems: 'center' } },
        { key: 'descrizioneLinea', label: 'Desc.Linea', sort: true, sortType: "String", width: 300, type: 'default', sx: { alignItems: 'center' }, labelsx: { textAlign: 'center' } },
        { key: 'stock', label: 'stock', sort: true, sortType: "Number", type: 'eur', sx: { alignItems: 'center' }, labelsx: { textAlign: 'center' } },
        { key: 'ocfb', label: 'ocfb', sort: true, sortType: "Number", type: 'eur', sx: { alignItems: 'center' }, labelsx: { textAlign: 'center' } },
        {
            secKey: 'q1', key: 'trimestri', label: 'Obiettivo Q1', sort: true, sortType: "Number", type: 'eur', width: 150, sx: { alignItems: 'center', borderLeft: `1px solid ${darkMode ? palette.grey[800]: palette.grey[300]}` },
            color: {
                type: 'func', prop: () => CheckRangeDateQuorters({ range: { from: new Date("2024-01-01"), to: new Date("2024-03-31"), } }),
                true: '#62a1ff1f', false: null
            }
        },
        {
            secKey: 'q1', key: 'fatturati', label: 'Fatturato Q1', sort: true, sortType: "Number", type: 'eur', width: 150, sx: { alignItems: 'center' },
            color: {
                type: 'func', prop: () => CheckRangeDateQuorters({ range: { from: new Date("2024-01-01"), to: new Date("2024-03-31"), } }),
                true: '#62a1ff1f', false: null
            }
        },
        {
            secKey: 'q2', key: 'trimestri', label: 'Obiettivo Q2', sort: true, sortType: "Number", type: 'eur', width: 150, sx: { alignItems: 'center', borderLeft: `1px solid ${darkMode ? palette.grey[800]: palette.grey[300]}` },
            color: {
                type: 'func', prop: () => CheckRangeDateQuorters({ range: { from: new Date("2024-04-01"), to: new Date("2024-06-30"), } }),
                true: '#62a1ff1f', false: null
            }
        },
        {
            secKey: 'q2', key: 'fatturati', label: 'Fatturato Q2', sort: true, sortType: "Number", type: 'eur', width: 150, sx: { alignItems: 'center' },
            color: {
                type: 'func', prop: () => CheckRangeDateQuorters({ range: { from: new Date("2024-04-01"), to: new Date("2024-06-30"), } }),
                true: '#62a1ff1f', false: null
            }
        },
        {
            secKey: 'q3', key: 'trimestri', label: 'Obiettivo Q3', sort: true, sortType: "Number", type: 'eur', width: 150, sx: { alignItems: 'center', borderLeft: `1px solid ${darkMode ? palette.grey[800]: palette.grey[300]}` },
            color: {
                type: 'func', prop: () => CheckRangeDateQuorters({ range: { from: new Date("2024-07-01"), to: new Date("2024-09-30"), } }),
                true: '#62a1ff1f', false: null
            }
        },
        {
            secKey: 'q3', key: 'fatturati', label: 'Fatturato Q3', sort: true, sortType: "Number", type: 'eur', width: 150, sx: { alignItems: 'center' },
            color: {
                type: 'func', prop: () => CheckRangeDateQuorters({ range: { from: new Date("2024-07-01"), to: new Date("2024-09-30"), } }),
                true: '#62a1ff1f', false: null
            }
        },
        {
            secKey: 'q4', key: 'trimestri', label: 'Obiettivo Q4', sort: true, sortType: "Number", type: 'eur', width: 150, sx: { alignItems: 'center', borderLeft: `1px solid ${darkMode ? palette.grey[800]: palette.grey[300]}` },
            color: {
                type: 'func', prop: () => CheckRangeDateQuorters({ range: { from: new Date("2024-10-01"), to: new Date("2024-12-31"), } }),
                true: '#62a1ff1f', false: null
            }
        },
        {
            secKey: 'q4', key: 'fatturati', label: 'Fatturato Q4', sort: true, sortType: "Number", type: 'eur', width: 150, sx: { alignItems: 'center', borderRight: `1px solid ${darkMode ? palette.grey[800]: palette.grey[300]}` },
            color: {
                type: 'func', prop: () => CheckRangeDateQuorters({ range: { from: new Date("2024-10-01"), to: new Date("2024-12-31"), } }),
                true: '#62a1ff1f', false: null
            }
        },
    ]);

    const CheckRangeDateQuorters = ({ range }: { range: { to: Date, from: Date } }) => {
        const currentDate = new Date();
        // Controlla se la data corrente è compresa tra fromDate e toDate
        return currentDate >= range.from && currentDate <= range.to;
    }

    React.useEffect(() => {
        if (!userContext || (userContext && userContext.details === undefined)) { return; }
        WhatQuarterWeAre();
        //DataAPI({ userContext, abortController, setData, ChangeLoadStatus });

        return () => {
            cancelRequest();
        };
    }, [userContext])


    /**
     * Funzione che ha lo scopo di comparare le varie range di date per definire in quale trimestre ci troviamo attualmente.
     * @returns nome del quarter con il range di date in cui siamo attualmente.
     */
    const WhatQuarterWeAre = () => {
        const CheckRangeDateQuorters = ({ range }: { range: { to: Date, from: Date } }) => {
            const currentDate = new Date();
            // Controlla se la data corrente è compresa tra fromDate e toDate
            return currentDate >= range.from && currentDate <= range.to;
        }

        let actual_q = null;
        const dataQuarters: any = {
            q1: { range: { from: new Date("2024-01-01"), to: new Date("2024-03-31"), } },
            q2: { range: { from: new Date("2024-01-04"), to: new Date("2024-06-30"), } },
            q3: { range: { from: new Date("2024-07-01"), to: new Date("2024-09-30"), } },
            q4: { range: { from: new Date("2024-10-01"), to: new Date("2024-12-31"), } },
        };
        
        for(const key in dataQuarters){
            const q = dataQuarters[key];
            const check = CheckRangeDateQuorters({ range: q.range})
            if(check){
                actual_q = {quarter: key, range: q.range};
            };
        };
        return setQ_(actual_q);
    };




    return <DashboardLayout>
        {!err ? <React.Fragment>
            {!tableLoad ? <Fade in={true} timeout={800}><Card sx={{ marginTop: 1, height: '100%' }}>
                <TableVirtualized
                    columns={columns}
                    setColumns={setColumns}
                    data={data}
                    setData={setData}
                    results={data.length}
                    whereToFindData={false}
                    loadStatus={loadStatus.table}
                />
            </Card>
            </Fade>
                : <SkeletonTableLoad />
            }
        </React.Fragment> : <GeneralError img={ErrorIMG} />}
        <ViewDetails statusMode={groupedDetailsStatus} ChangeStatus={GroupedDetailsStatusChange} item_={groupedItem_} 
            q_={q_} setGroupedItem_={setGroupedItem_} inspectedItemCopy_={inspectedItemCopy_} loadStatus={loadStatus.dataOnInspect}/>
        <Tooltip id="general-obiettivi-commerciali-tooltip" place="bottom" style={{
            maxWidth: "15vw", minWidth: 150, fontSize: '0.87rem', zIndex: 9999,
            textAlign: 'center'
        }} />
    </DashboardLayout>
};

export default TargetAgents;