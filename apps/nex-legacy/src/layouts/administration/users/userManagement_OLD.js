import React, { useState, useEffect, useContext, useRef } from "react";

//@User Details Fetched From Server
import { UserContext } from "../../../context/UserContext";

//@Component
import MDSnackbar from "components/MDSnackbar";
import MDBox from "components/MDBox";
import Stack from '@mui/material/Stack';

//Components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";

import Loader from "../../../Loader";
import MinLoader from "minLoader";
import EmojiError from "emojiError";
import Filter from "./filter";

import { VirtuosoGridVI } from "./VirtuosoGridVI.js";

import { NoData } from '../../../components/NoData/index';
import { Divider } from "@mui/material";
import MDTypography from "components/MDTypography";
import { Tooltip } from "react-tooltip";
import { enqueueSnackbar } from "components/MessageBox";
import { FetchData } from "examples/Fetch";
import { FindUsersAPI } from "./fetch/FindUsers";




function UserManagement() {
    const [userContext, setUserContext] = useContext(UserContext);
    const [userFinded, setUserFinded] = useState({ data: [] });

    const [copyOfData, setCopyOfData] = useState([]);

    const [err, setErr] = useState(false);
    const [loader, setLoader] = useState(false);


    //Notifica Generale di Error/Info/Success
    //--- Messaggio di Errore
    const [error, setError] = useState("");
    //--- Stato del Messaggio se aperto o meno
    const [errorSB, setErrorSB] = useState(false);
    const closeErrorSB = () => setErrorSB(false);
    const openErrorSB = (icon, message) => { setErrorSB(true); setDymIcon(icon); setError(message) };
    /*-----Possibile Choose
      "primary", "secondary", info", "success", "warning", "error", "dark", "light", */
    // --- Richiamando e settando uno di questi valori definisce il colore e l'icona in utilizzo dal pop-up
    const [dymIcon, setDymIcon] = useState("warning");

    const abortController = useRef(null);
    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
        }
    };


    const renderErrorSB = (
        <MDSnackbar
            color={dymIcon}
            icon={dymIcon}
            title="Focelda Dashboard"
            content={error}
            dateTime="1 sec fa"
            open={errorSB}
            onClose={closeErrorSB}
            close={closeErrorSB}
            bgWhite
        />
    );


    // Abort il panding del fetch all server
    useEffect(() => {
        //give a delay for the starting fetch call => you need first connect to the userOnline socket
        setTimeout(() => {
            findUser(0);
        }, 1)
        return () => {
            cancelRequest();
        }
    }, [])

    const findUser = (tp) => {
        setLoader(true);
        // Abort Controller per il fetch
        abortController.current = new AbortController();

        function HandleComplete(res) {
            setUserFinded(() => {
                const resDataSorted = res.data.sort((a, b) => {
                    if ((a.stato.codice === 'Online' || a.stato.codice === 'Assente') && b.stato.codice === 'Offline') {
                        return -1; // a viene prima di b
                    } else if (a.stato.codice === 'Offline' && (b.stato.codice === 'Online' || b.stato.codice === 'Assente')) {
                        return 1; // b viene prima di a
                    } else {
                        if (a.nome) {
                            return a.nome.localeCompare(b.nome);
                        } else if (a.nome) {
                            return a.nome.localeCompare(b.nome);
                        } else {
                            return 1
                        }
                    }
                });
                return { ...res, data: [{}, ...resDataSorted] }
            });
            return setLoader(false);
        }

        FindUsersAPI({
            abortController,
            body: { tp },
            HandleComplete,
            HandleError: (_) => {
                setErr(true);
                setLoader(false);
                return enqueueSnackbar("Sembra che al momento non sia possibile contattare il server, riprova piu tardi!", {
                    title: 'Ops..',
                    type: 'error',
                });
            },
        });

        return cancelRequest;
    }

    useEffect(() => setCopyOfData(userFinded.data), [userFinded.data]); //assegna i dati alla stato copia.

    const Grid = React.useMemo(() => (
        copyOfData.length > 0 ?
            <VirtuosoGridVI data={copyOfData} roles={userFinded.roles} openErrorSB={openErrorSB}
                setData={setCopyOfData} />
            :
            <NoData height={70} />
    ), [copyOfData])


    return userContext.details === null ? (
        "Error Loading User details"
    ) : !userContext.details ? (
        <div>
            <Loader />
            {window.location.assign("/dashboard")}
        </div>
    ) : (
        <DashboardLayout>
            <MDBox pt={5} translate="no">
                <Stack direction='row' flexWrap='warp'>
                    <MDTypography variant="h2">Gestione Utenti</MDTypography>
                    <Filter data={userFinded} setCopyOfData={setCopyOfData} userBanned={findUser}
                        copyOfData={copyOfData} setUserFinded={setUserFinded} />
                </Stack>
                <Divider sx={{ backgroundColor: '#ccc' }} />
                {!err ?
                    (loader ? <MinLoader /> : Grid)
                    : <EmojiError />
                }
                {renderErrorSB}
            </MDBox>
            <Tooltip id="main-user-management-tooltip" place="bottom" style={{
                maxWidth: "15vw", minWidth: 150, fontSize: '0.87rem',
                textAlign: 'center', zIndex: 1, zIndex: 9999,
            }} />
        </DashboardLayout>
    );
};
export default UserManagement;
