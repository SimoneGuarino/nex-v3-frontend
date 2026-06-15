/**
 * props dei Filtri => 
 * cdl = codice listino dei select
 * cdp = codice della promozione <Input Box>
 * 
 * Start timer => 12:10
 * Inizializzazione dei fetch => 12:21 => 12:31
 * END Struttura Generale 12:43
 * Inizializzazione per il download file EXCEL => 12:44 => 12:51
 * Aggiustamenti vari => 12:51 => 12:56
 * Collegamento Front/Back START => 16:25 => 16:40
 * 
 * TOT => 46 min + 15min => 1h
 */

import React from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout"
import { UserContext } from "context/UserContext";

import { Card, Stack, Fade, Skeleton } from "@mui/material"

import { FiltersDataAPI } from "./fetchData/FiltersData";
import { DataAPI } from "./fetchData/data";
import { DwdExcelAPI } from "./fetchData/excel";

import { TableVirtualized } from "components/Virtualized/table";
import { GeneralError } from "components/NoData/generalError";
import ErrorIMG from 'assets/images/5203299_trasparent.webp';
import { Tooltip } from "react-tooltip";
import { FiltersBar } from "./extraBar/filtersBar";
import { useSectionTour } from "tour/useSectionTour";
import { Role } from "tour/types";
import { useNexTheme } from "@nex/theme-system";


interface UserContextProps {
    details?: object;
    token?: string;
};
interface ColumnsProps {
    key: string;
    label: string;
    sort?: boolean;
    sortType?: "Number" | "String";
    type: "default" | "eur" | "pz";
    width?: number;
    labelsx?: object;
    sx?: object;
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
    codiceArticolo: string;
    descrizione: string;
    linea: string;
    descrizioneLinea: string;
    gruppo: string;
    descrizioneGruppo: string;
    marca: string;
    q1: null | string;
    q2: null | string;
    q3: null | string;
    q4: null | string;
    stock: string;
    backorder: string;
    fatturatoTrimestreAttuale: string;
    fatturatoTrimestrePrecedente: string;
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


const Promozioni: React.FC<{}> = () => {
    const [userContext, setUserContext] = React.useContext<UserContextProps | any>(UserContext);

    //Errore Fetch iniziale (Emoji Error)
    const [err, setErr] = React.useState(false);

    const tour = useSectionTour({
        id: "nex_v2_promozioni",
        version: "2.0.0",
        user: { id: userContext?.details?.id ?? "", role: (userContext?.details?.ruolo as Role) ?? "Tester" },
        keys: "promozioni",
        actions: {
        }
    });



    // Abort il panding del fetch all server
    const abortController = React.useRef<AbortController | null>(null);
    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
        }
    };

    //Load Status
    const [tableLoad, setTableLoad] = React.useState(false);
    const [filtersLoad, setFiltersLoad] = React.useState(false);


    const [data, setData] = React.useState<Array<DataProps>>([]);
    const [filtersData, setFiltersData] = React.useState(null);

    const [userChoose, setUserChoose] = React.useState<any>({
        cdp: '',
        cdl: '03',
    });
    const [filtersInTable, setfiltersInTable] = React.useState<any>({
        cdp: '',
        cdl: '03',
    });
    const [columns, setColumns] = React.useState<Array<ColumnsProps>>([
        { key: 'Cod articolo', label: 'Cod.Articolo', sort: true, sortType: "String", type: 'default', sx: { alignItems: 'center' } },
        { key: 'Denominazione', label: 'Denominazione', sort: true, sortType: "String", type: 'default', width: 200, labelsx: { fontWeight: 300 }, sx: { alignItems: 'center' } },
        { key: 'Descrizione', label: 'Descrizione', sort: true, sortType: "String", type: 'default', width: 300, sx: { alignItems: 'center' } },
        { key: 'Gruppo', label: 'Gruppo', sort: true, sortType: "String", type: 'default', width: 170, sx: { alignItems: 'center' } },
        { key: 'Famiglia', label: 'Famiglia', sort: true, sortType: "String", width: 300, type: 'default', sx: { alignItems: 'center' } },
        { key: 'Pref fornitore', label: 'Pref.Fornitore', type: 'default', sx: { alignItems: 'center' } },
        { key: 'Descrizione Suppl', label: 'Descrizione Suppl.', sort: true, sortType: "String", type: 'default', width: 300, sx: { alignItems: 'center' } },
        { key: 'Qta scaglione da 1', label: 'Qta scaglione da 1', sort: true, sortType: "String", type: 'default', width: 150, sx: { alignItems: 'center' } },
        { key: 'Qta scaglione a 1', label: 'Qta scaglione a 1', sort: true, sortType: "String", type: 'default', width: 150, sx: { alignItems: 'center' } },
        { key: 'Prezzo offerta scaglione 1', label: 'Prezzo offerta scaglione 1', sort: true, sortType: "String", type: 'default', width: 150, sx: { alignItems: 'center' } },
        { key: 'Prezzo offerta scaglione 2', label: 'Prezzo offerta scaglione 2', sort: true, sortType: "String", type: 'default', width: 150, sx: { alignItems: 'center' } },
        { key: 'Cod listino', label: 'Cod.Listino', sort: true, sortType: "String", type: 'default', width: 150, sx: { alignItems: 'center' } },
        { key: 'Prezzo listino', label: 'Prezzo listino', sort: true, sortType: "String", type: 'default', width: 150, sx: { alignItems: 'center' } },
        { key: 'Inizio promo', label: 'Inizio promo', sort: true, sortType: "String", type: 'default', width: 150, sx: { alignItems: 'center' } },
        { key: 'Fine promo', label: 'Fine promo', sort: true, sortType: "String", type: 'default', width: 150, sx: { alignItems: 'center' } },
        { key: 'Cod offerta', label: 'Cod.Offerta', sort: true, sortType: "String", type: 'default', width: 150, sx: { alignItems: 'center' } },
        { key: 'Classificazione offerta', label: 'Classificazione offerta', sort: true, sortType: "String", type: 'default', width: 150, sx: { alignItems: 'center' } },
        { key: "Disp Napoli", label: "Disp.Napoli", sort: true, sortType: "String", type: 'default', width: 120, sx: { alignItems: 'center' } },
        { key: "Disp Ciampino", label: "Disp.Ciampino", sort: true, sortType: "String", type: 'default', width: 120, sx: { alignItems: 'center' } },
        { key: "Disp Bari", label: "Disp.Bari", sort: true, sortType: "String", type: 'default', width: 120, sx: { alignItems: 'center' } },
        { key: "Disp Firenze", label: "Disp.Firenze", sort: true, sortType: "String", type: 'default', width: 120, sx: { alignItems: 'center' } },
        { key: "Disp Milano", label: "Disp.Milano", sort: true, sortType: "String", type: 'default', width: 120, sx: { alignItems: 'center' } },
        { key: "Disp Linate", label: "Disp.Linate", sort: true, sortType: "String", type: 'default', width: 120, sx: { alignItems: 'center' } },
        { key: "Disp Pozzuoli", label: "Disp.Pozzuoli", sort: true, sortType: "String", type: 'default', width: 120, sx: { alignItems: 'center' } },
        { key: "Disp Web", label: "Disp.Web", sort: true, sortType: "String", type: 'default', width: 120, sx: { alignItems: 'center' } },
        { key: "Disp Torino", label: "Disp.Torino", sort: true, sortType: "String", type: 'default', width: 120, sx: { alignItems: 'center' } },
        { key: "Disp Reggio Emilia", label: "Disp.Reggio Emilia", sort: true, sortType: "String", type: 'default', width: 120, sx: { alignItems: 'center' } },
        { key: "Disp Catanzaro", label: "Disp.Catanzaro", sort: true, sortType: "String", type: 'default', width: 120, sx: { alignItems: 'center' } },
        { key: "Disp Roma Nord", label: "Disp.Roma Nord", sort: true, sortType: "String", type: 'default', width: 120, sx: { alignItems: 'center' } },
        { key: "Disp Pordenone", label: "Disp.Pordenone", sort: true, sortType: "String", type: 'default', width: 120, sx: { alignItems: 'center' } },
        { key: "Disp Magazzino 29", label: "Disp.Mag.29", sort: true, sortType: "String", type: 'default', width: 120, sx: { alignItems: 'center' } },
        { key: 'Visibilita', label: 'Visibilita', sort: true, sortType: "String", type: 'default', width: 120, sx: { alignItems: 'center' } },
    ]);



    React.useEffect(() => {
        if (userContext && userContext.details === undefined) { return; }

        FiltersData();

        return () => {
            cancelRequest();
        };
    }, [userContext.details]);



    const DataRetrive = React.useCallback(() => {
        setTableLoad(true);
        DataAPI({ userContext, abortController, setData, filters: userChoose, setTableLoad, setColumns });
        setfiltersInTable(userChoose);
    }, [data, userChoose]);

    const FiltersData = React.useCallback(() => {
        setFiltersLoad(true);
        FiltersDataAPI({ userContext, abortController, setFiltersData, setFiltersLoad });
    }, []);

    const DwdExcel = () => {
        DwdExcelAPI(userContext, abortController, filtersInTable);
    };




    return (
        <DashboardLayout>
            {!err ? <React.Fragment>
                {!filtersLoad ? <Fade in={true} timeout={800}><Stack>
                    <FiltersBar userChoose={userChoose} setUserChoose={setUserChoose}
                        filtersData={filtersData}
                        DwdExcel={DwdExcel} DataRetrive={DataRetrive} />
                </Stack>
                </Fade>
                    : <SkeletonFiltersLoad />}
                {!tableLoad ? <Fade in={true} timeout={800}><Card sx={{ marginTop: 1, height: '100%' }}>
                    <TableVirtualized
                        columns={columns}
                        setColumns={setColumns}
                        data={data}
                        setData={setData}
                        results={data.length}
                    />
                </Card>

                </Fade>
                    : <SkeletonTableLoad />}
            </React.Fragment> : <GeneralError img={ErrorIMG} />}
            <Tooltip id="general-obiettivi-stocks-tooltip" place="bottom" style={{
                maxWidth: "15vw", minWidth: 150, fontSize: '0.87rem', zIndex: 9999,
                textAlign: 'center'
            }} />
        </DashboardLayout>
    )
};

export default Promozioni;