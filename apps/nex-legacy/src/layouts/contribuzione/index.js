import React, { useContext, useEffect, useState, useRef, useCallback, Fragment } from "react";
import { SearchDataContext } from "../../context/SearchDataContext";

import { UserContext } from "../../context/UserContext";

// @mui material components
import Grid from "@mui/material/Grid";

//  components
import Loader from "../../Loader";

//  Layouts components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";

//Sistema logico per il fetch dei relativi dati
import { DataRetrive } from './table/fetchData/data';

import { Tooltip } from "react-tooltip";
import { Contribuzione } from "./table";
import { ReqBOIMP_API } from "./table/fetchData/actions/reqBOIMP";
import { CategoriesData } from "./table/fetchData/categories";
import ErrorIMG from 'assets/images/5203299_trasparent.webp';
import { GeneralError } from "components/NoData/generalError";
import { ContributionAPI } from "./table/fetchData/contributions";
import { Fade, Skeleton, Stack } from "@mui/material";
import { MainTheme } from "assets/settingsTheme";
import { useNexTheme } from "@nex/theme-system";


const cookieNameColumns = "contribuzione_settings";

function Tables() {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const [userContext, setUserContext] = useContext(UserContext);

    //variabile di stato che definisce in fase di caricamento o meno del CSV inviato al server 
    //const [progressUpload, setProgressUpload] = useState(0);

    //___________________Dati relativi al compare/search
    const [searchDataContext, setSearchDataContext] = useContext(SearchDataContext);
    const [data_, setData] = React.useState([]);
    const [extraData, setExtraData] = React.useState({});

    const [mainLoad, setMainLoad] = useState(true);
    const handleMainLoadChange = () => {
        if (mainLoad) {
            setMainLoad(false)
        }
    };

    //Errore Fetch iniziale (Emoji Error)
    const [err, setErr] = useState(false);
    const ChangeErrorStatus = () => setErr(!err);

    // Abort il panding del fetch all server
    const abortController = useRef(null);
    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
            abortController.current = null; // Reset after abort
        }
    };

    //dopo aver effutato la richiesta delle colonne difinisci uno stato di caricamento che non permette il click di altri
    //elementi nel'impostazioni tabella.
    const [impTableStatus, setImpTableStatus] = useState(false);

    const [BOIMPPanelVisibility, setBOIMPPanelVisibility] = React.useState(false);
    const ChangeBOIMPPanleVisibility = () => setBOIMPPanelVisibility(!BOIMPPanelVisibility);
    const [onDownload, setOnDownload] = React.useState(false);

    const [contributionsList_Base, setContributionsList_Base] = React.useState([]);
    const contributionsPersonalList = React.useRef(null);
    const [contributionsList, setContributionsList] = React.useState([]); //personale del buyer o la lista delle contrib. buyers
    const [contributionsCompanyList, setContributionsCompanyList] = React.useState([]); //aziendale.


    useEffect(() => {
        if (userContext.details === undefined) { return; }

        // Inizializza un nuovo AbortController
        abortController.current = new AbortController();

        // Effettua tutte le chiamate con lo stesso AbortController
        ContributionAPI({
            userContext,
            abortController,
            contributionsPersonalList,
            setContributionsList_Base,
        });

        CategoriesRetriveData();
        UpdateTablePrice(null, null);

        return () => {
            if (abortController.current) {
                abortController.current.abort();
                abortController.current = null; // Resetta per nuove richieste
            }
        };
    }, [userContext.details]);


    const UpdateTablePrice = useCallback((columns, query) => {
        DataRetrive(setSearchDataContext, userContext, handleMainLoadChange, abortController,
            setImpTableStatus, query, ChangeErrorStatus, cookieNameColumns);
    }, [userContext.details, abortController, setSearchDataContext, searchDataContext]);

    const CategoriesRetriveData = useCallback((queryColumns) => {
        CategoriesData(setExtraData, userContext, setMainLoad, abortController, queryColumns, cookieNameColumns);
    }, [userContext.details, abortController, setSearchDataContext, searchDataContext]);

    const FetchBOIMP = (data) => {
        ReqBOIMP_API(userContext, abortController, data, ChangeBOIMPPanleVisibility)
    };



    return userContext.details === null ? (
        "Error Loading User details"
    ) : !userContext.details ? (
        <div>
            <Loader />
        </div>
    ) : (
        <Fragment>
            <DashboardLayout>
                <Grid item xs={12} style={{ height: '100%', overflow: "hidden" }}>
                    {!err ?
                        !mainLoad ?
                            <Contribuzione userContext={userContext} abortController={abortController}
                                dataOrigin_={searchDataContext} setDataOrigin_={setSearchDataContext} FetchBOIMP={FetchBOIMP}
                                ChangeBOIMPPanleVisibility={ChangeBOIMPPanleVisibility} onDownload={onDownload}
                                setOnDownload={setOnDownload} BOIMPPanelVisibility={BOIMPPanelVisibility} extraData={extraData}
                                cookieNameColumns={cookieNameColumns} contributionsPersonalList={contributionsPersonalList}
                                contributionsList={contributionsList} setContributionsList={setContributionsList}
                                contributionsList_BaseData={contributionsList_Base} contributionsCompanyList={contributionsCompanyList}
                                setContributionsCompanyList={setContributionsCompanyList}
                                loadState={mainLoad} setLoadState={setMainLoad} />


                            : <Fade in={true}>
                                <Stack alignItems='center' justifyContent='center' gap={2}>
                                    <Stack gap={1} width='100%'>
                                        <Skeleton height={`50px`}
                                            sx={{ borderRadius: 3, width: '100%', bgcolor: `${darkMode ? '#1c1c1c' : ''}` }} variant="rounded" />
                                        <Skeleton height={`80px`}
                                            sx={{ borderRadius: 3, width: '100%', bgcolor: `${darkMode ? '#1c1c1c' : ''}` }} variant="rounded" />
                                    </Stack>

                                    <Stack direction='row' width='100%' gap={2} flexWrap='wrap'>
                                        {new Array(6).fill("").map((_, index) => (
                                            <Skeleton key={index} height={`330px`}
                                                sx={{ borderRadius: 3, width: '49.1%', bgcolor: `${darkMode ? '#1c1c1c' : ''}` }} variant="rounded" />
                                        ))}

                                    </Stack>
                                </Stack>
                            </Fade>
                        : <GeneralError img={ErrorIMG} />}
                </Grid>
            </DashboardLayout>
            <Tooltip id="general-compare-tooltip" place="bottom" style={{
                maxWidth: "15vw", minWidth: 150, fontSize: '0.87rem', zIndex: 9999,
                textAlign: 'center'
            }} />
        </Fragment>
    );
}

export default React.memo(Tables)