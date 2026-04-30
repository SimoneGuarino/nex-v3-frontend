import React, { useState, useContext, useCallback, useRef, useEffect } from "react";
import { getAdminSocket } from '@nex/realtime-core';
const socket = getAdminSocket();

//@User Details Fetched From Server
import { UserContext } from "../../../context/UserContext";
import { useGSettingsContext } from "../../../context/GSettingsContext";

//Fetch dei dati
import { DataRetrive } from './fetchData/data';

//@Component
import Stack from '@mui/material/Stack';
import MDTypography from "components/MDTypography";
import { Divider } from "@mui/material";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";

import Loader from "../../../Loader";
import MinLoader from "minLoader";
import EmojiError from "emojiError";

import DynamicSettings from "./dynamicSettings";
import DisplaySettingsRoundedIcon from '@mui/icons-material/DisplaySettingsRounded';


export default function GeneralSettings() {
    //userContext usato per il retrive dei dati dell'utente e per il check se è connesso
    const [userContext, setUserContext] = useContext(UserContext);
    const [err, setErr] = useState(false);
    const [loader, setLoader] = useState(false);

    const { GSettingsMode, setGSettingsMode } = useGSettingsContext();

    const socketRef = useRef(null);

    // Abort il panding del fetch all server
    const abortController = useRef(null);
    const cancelRequest = () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
    
    useEffect(() => {
      if(userContext.details === undefined){return;}
        
      retriveDataAPI();

      return () => {
        cancelRequest();
      }
    },[])

    const retriveDataAPI = useCallback(() => {
      DataRetrive(userContext, abortController, setGSettingsMode)
    },[userContext, abortController])

    /**
     * Socket di cambiamento generale delle proprietà di generals_settings che devono essere comunicati agli utenti in tempo reale
     * in modo tale da cambiare le impostazioni generali della WebAPP.
     * @param field in input la proprietà che deve cambiare
     * @param value in input il valore della proprietà che deve essere cambiata
    */
    const setGeneralSettingsDataSocket = useCallback((field, value) => {
      // Quando il componente viene montato, richiedi la lista degli utenti online
      if (!socketRef.current) {
        socketRef.current = socket;
        socket.emit('setGeneralSettingsData', field, value);
        socketRef.current = null;
      }
      // Cleanup dell'effetto quando il componente viene smontato
      return () => {
        socket.off('setGeneralSettingsData');
      };
    },[socket])


    const fileSettingsList = [
      { label: "MaxYears", ref: "MaxYears", typology: "NumberField"},
      { label: "MaxLines", ref: "MaxLines", typology: "NumberField"},
      { label: "SplitType", ref: "SplitType", typology: "TextField"},
      { label: "SplitArrayType", ref: "SplitArrayType", typology: "TextField"}
    ]

    const data = [{
      generalTitle: "Generale",
      tabs: [
        {key: 'generals', label: "Generali", icon: <DisplaySettingsRoundedIcon />},
        //{key: 'icecat', label: "Icecat", icon: <IceCat />},
      ],
      tabPanel: [
        /*{
          key: 'icecat',
          section: [
            { title: "Auth", subElm: [
                {
                  title: "Autenticazione Icecat",
                  desc: "Permette l'accesso e il download dei diversi file proveninti dal FTP dedicato.",
                  typology: "Info"
                },
                {
                  label: "Username",
                  ref: "User",
                  typology: "TextField"
                },
                {
                  label: "Password",
                  ref: "Pass",
                  typology: "TextField"
                },
              ]
            },
            {
              title: "Download",
              subElm: [
                {
                  title: "Scaricamento dei File provenienti da Icecat",
                  desc: "Permette l'accesso e il download dei diversi file proveninti dal FTP dedicato.",
                  typology: "Info"
                },
                {
                  title: "File provenienti da Icecat",
                  desc: "Modifica o Aggiungi gli elementi che permetto il download dei diversi file di Icecat in modo da permettere il retrive delle informazioni in maniera corretta.",
                  group: [
                    {
                      ref : "index",
                      list : [{
                          label: "Url",
                          ref: "Url",
                          typology: "TextField"
                        },
                        {
                          label: "FileZip",
                          ref: "FileZip",
                          typology: "TextField"
                        },
                        {
                          label: "FileSettings",
                          ref: "FileSettings",
                          typology: "List",
                          list: fileSettingsList
                        },
                        {
                          label: "SplitDir",
                          ref: "SplitDir",
                          typology: "TextField"
                        },
                        {
                          label: "UnzipFile",
                          ref: "UnzipFile",
                          typology: "TextField"
                        }]
                    },{
                      ref : "Categories",
                      list : [{
                        label: "Url",
                        ref: "Url",
                        typology: "TextField"
                      },
                      {
                        label: "FileZip",
                        ref: "FileZip",
                        typology: "TextField"
                      },
                      {
                        label: "FileDir",
                        ref: "FileDir",
                        typology: "TextField"
                      },
                      {
                        label: "SplitDir",
                        ref: "SplitDir",
                        typology: "TextField"
                      },
                      {
                        label: "UnzipFile",
                        ref: "UnzipFile",
                        typology: "TextField"
                      }]
                    },{
                      ref : "Daily",
                      list : [{
                        label: "Url",
                        ref: "Url",
                        typology: "TextField"
                      },
                      {
                        label: "FileZip",
                        ref: "FileZip",
                        typology: "TextField"
                      },
                      {
                        label: "SplitDir",
                        ref: "SplitDir",
                        typology: "TextField"
                      },
                      {
                        label: "UnzipFile",
                        ref: "UnzipFile",
                        typology: "TextField"
                      }]
                    }
                  ],
                  typology: "MiniGroup"
                },
              ]
            },
            {
              title: "Categorie",
              subElm: [
                {
                  title: "Seleziona le categorie di Icecat",
                  desc: "Aggiungendo le categorie verranno scaricate in automatico (durante l'aggiornamento dei dati) e i prodotti verranno integrati al database e resi disponibili per essere visualizzati.",
                  typology: "Info"
                },
                {
                  title: "Seleziona le categorie di Icecat",
                  desc: "Aggiungendo le categorie verranno scaricate in automatico (durante l'aggiornamento dei dati) e i prodotti verranno integrati al database e resi disponibili per essere visualizzati.",
                  label: 'Icecat Category',
                  typology: "Chip"
                },
              ]
            },
          ]
        },*/
        { key: 'generals', section: [{ 
            title: "Impostazioni Generali",
            subElm: [
              { key: 'Manutenzione', title: "Modalità di manutenzione", typology: "switch", func: setGeneralSettingsDataSocket, var: GSettingsMode},
            ]}
          ]
        },
      ]
    }]

    return userContext.details === null ? (
        "Error Loading User details"
    ) : !userContext.details ? (
        <div>
            <Loader />
            {window.location.assign("/dashboard")}
        </div>
    ) : (
        <DashboardLayout>
            <Stack height="100%" sx={{height: "calc(100vh - 210px)",  maxHeight: "calc(100vh - 210px)"}} pt={1} gap={2} translate="no">
                <Stack>
                    <MDTypography variant="h3" sx={{fontWeight:500}} >Settings</MDTypography>
                    <Divider style={{background:'#727272', width: '100%'}}/>
                </Stack>
                {!err ? 
                    (loader ? <MinLoader /> :
                        (
                          <DynamicSettings title="Configurazione" data={data} />                   
                        )
                    )
                    : <EmojiError />
                }
            </Stack>
        </DashboardLayout>
    )
}
