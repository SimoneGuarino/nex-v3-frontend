import React, { useState, useContext, useMemo, useCallback, useEffect } from "react";
import Stack from '@mui/material/Stack';

//@User Details Fetched From Server
import { UserContext } from "../../../context/UserContext";

//@Component
import MDBox from "components/MDBox";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";

import Loader from "../../../Loader";
import MinLoader from "minLoader";
import EmojiError from "emojiError";

import VirtualizedTable from "./virtualizedTable";
//Element Message
import MessageElement from '../../quotation/AI/message/element';


export default function RelateCategories() {

    //userContext usato per il retrive dei dati dell'utente e per il check se è connesso
    const [userContext, setUserContext] = useContext(UserContext);
    const [err, setErr] = useState(false);
    const [loader, setLoader] = useState(false);

    const [data, setData] = useState({
        dati:             {
            nomeFornitore: "Focelda",
            Categorie: [
                {
                    DescrizioneLinea: "CAT1",
                    Fornitori: {
                        Esprinet: "BH1"
                    },
                    SottoCategoria: [{
                        Gruppo : "SBA1",
                        DescrizioneGruppo: "SUBCAT_A1",
                        Fornitori: {
                            Esprinet: "BH2"
                        }
                    },{
                        Gruppo : "SBA2",
                        DescrizioneGruppo: "SUBCAT_A2",
                        Fornitori: {}
                    },{
                        Gruppo : "SBA3",
                        DescrizioneGruppo: "SUBCAT_A3",
                        Fornitori: {}
                    }]
                },
                {
                    DescrizioneLinea: "CAT2",
                    Fornitori: {},
                    SottoCategoria: [{
                        Gruppo : "SBB1",
                        DescrizioneGruppo: "SUBCAT_B1",
                        Fornitori: {},
                    },{
                        Gruppo : "SBB2",
                        DescrizioneGruppo: "SUBCAT_B2",
                        Fornitori: {},
                    }]
                },
                {
                    DescrizioneLinea: "CAT3",
                    Fornitori: {},
                    SottoCategoria: [{
                        Gruppo : "SBB1",
                        DescrizioneGruppo: "SUBCAT_C1",
                        Fornitori: {},
                    },{
                        Gruppo : "SBB2",
                        DescrizioneGruppo: "SUBCAT_C2",
                        Fornitori: {},
                    }]
                }
            ]
        },
        datiFornitori: [
            {
                nomeFornitore: "Esprinet",
                Categorie: [{Linea: "BH1", DescrizioneLinea: "BOH"},{Linea: "BH2", DescrizioneLinea: "BOH2"}]
            },
            {
                nomeFornitore: "Difox",
                Categorie: [{Linea: "BH1", DescrizioneLinea: "BOH"},{Linea: "BH2", DescrizioneLinea: "BOH2"}]
            },
            {
                nomeFornitore: "Techdata",
                Categorie: [{Linea: "BH1", DescrizioneLinea: "BOH"},{Linea: "BH2", DescrizioneLinea: "BOH2"}]
            },
            {
                nomeFornitore: "Runner",
                Categorie: [{Linea: "BH1", DescrizioneLinea: "BOH"},{Linea: "BH2", DescrizioneLinea: "BOH2"}]
            }
        ],
    });
    const [conversation, setConversation] = useState({
        creator: "AI", message: "Ricorda di assegnare/associare tutte le relative categorie e sottocategorie ai fornitori generati in maniera dinamica, o ci potrebbero essere problemi generali futuri."
    });

    const [sendData, setSendData] = useState(data.dati);
    
    const DefineElmLine = useCallback((value, nameFornitore, index) => {
        //index => riferimento alla linea singola
        // Aggiorna lo stato in base a index
        setSendData(prevData => {
          const newData = [...prevData.Categorie];
          newData[index].Fornitori[nameFornitore[0]] = value;
          return {...prevData, Categorie: newData};
        });
    },[]);
      
    const DefineElmGroup = useCallback((value, nameFornitore, indexRow, index) => {
        //indexRow fa riferimento alla riga madre metre index => riga figlio
        // Crea una copia del tuo stato e applica le modifiche
        setSendData(prevData => {
          const newData = [...prevData.Categorie];
          newData[indexRow].SottoCategoria[index].Fornitori[nameFornitore] = value;
          return {...prevData, Categorie: newData};
        });
      },[]);

    // Utilizza useMemo per memorizzare la componente VirtualizedTable
    const virtualizedTable = useMemo(() => {
        return <VirtualizedTable
            data={data}
            distData={data.datiFornitori}
            focData={data.dati}
            setSendData={setSendData}
            defineElmLine={DefineElmLine}
            defineElmGroup={DefineElmGroup} 
        />;
    }, [data]); // Specifica 'data' come dipendenza


    return userContext.details === null ? (
        "Error Loading User details"
    ) : !userContext.details ? (
        <div>
            <Loader />
            {window.location.assign("/dashboard")}
        </div>
    ) : (
        <DashboardLayout>
            <MDBox pt={6} pb={3}>
                <h2>Correlazione Categorie</h2>
                {!err ?
                    (loader ? <MinLoader /> :
                        (
                            <Stack sx={{backgroundColor: "#fff", borderRadius:3, marginTop:2.5}}>
                                <Stack sx={{height: "auto", alignItems:"flex-start", borderTopLeftRadius: 10, borderTopRightRadius: 10, background:"#fcefff", borderRight: "1px solid #ddd", borderLeft: "1px solid #ddd"}}>
                                    <MessageElement data={conversation}/>
                                </Stack>
                                {virtualizedTable}
                            </Stack>
                        )
                    )
                    : <EmojiError />
                }
            </MDBox>
        </DashboardLayout>
    )
}
