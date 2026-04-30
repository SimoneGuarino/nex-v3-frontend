import { useState, useContext, useEffect } from "react";

//@User Details Fetched From Server
import { UserContext } from "../../../context/UserContext";

//@Component
import MDSnackbar from "components/MDSnackbar";
import MDBox from "components/MDBox";

import Divider from "@mui/material/Divider";
import Card from "@mui/material/Card";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";

import Loader from "../../../Loader";
import MinLoader from "minLoader";
import EmojiError from "emojiError";

import SupplierElement from "./supplierElement";

export default function SupplierConfig(){
    //userContext usato per il retrive dei dati dell'utente e per il check se è connesso
    const [userContext, setUserContext] = useContext(UserContext);
    const [err, setErr] = useState(false);
    const [loader, setLoader] = useState(false);

    const [settingSuppliers, setSettingSupplier] = useState([
      {
        "Name" : "Brevi",
        Setting : []
      },
      {
        "Name" : "Esprinet",
        Setting : []
      }
    ]);
    const [existSuppliers, setExistSuppliers] = useState([
      {
        Name : "Brevi",
        "Codice" : "Articolo",
        "CodiceProduttore" : "CodArtFor",
        "Marca" : "Produttore",
        "Descrizione" : "Descri",
        "Disponibili" : "DispSEDE",
        "Linea" : "",
        "DescrizioneLinea" : "",
        "Gruppo" : "",
        "DescrizioneGruppo" : "",
        "Famiglia" : "",
        "DescrizioneFamiglia" : "",
        "InizioPromo" : "",
        "FinePromo" : "0",
        "PrezzoListino" : "Prezzo",
        "Prezzo" : "Prezzo",
        "Promo" : "Offerta",
        "Siae" : "SIAE",
        "Raee" : "RAEE",
        "Sisvel" : "",
        "UltimaModifica" : "Data",
        "CodiceEAN" : "EAN",
        "Table" : "brevi_products"
    },
    {
      "Name" : "Esprinet",
      "Codice" : "Codice",
      "CodiceProduttore" : "CodiceProduttore",
      "Marca" : "NomeCasaProd",
      "Descrizione" : "Descrizione",
      "Disponibili" : "Dispo",
      "Linea" : "",
      "DescrizioneLinea" : "",
      "Gruppo" : "",
      "DescrizioneGruppo" : "",
      "Famiglia" : "",
      "DescrizioneFamiglia" : "",
      "InizioPromo" : "DataPromoDa",
      "FinePromo" : "DataPromoA",
      "PrezzoListino" : "PrezzoRivenditore",
      "Prezzo" : "PrezzoPromo",
      "Promo" : "PrezzoPromo",
      "Siae" : "",
      "Raee" : "Raee",
      "Sisvel" : "",
      "UltimaModifica" : "",
      "CodiceEAN" : "CodiceEAN",
      "Table" : "esprinet_products"
    } ]);



    //Notifica Generale di Error/Info/Success
    //--- Messaggio di Errore
    const [error, setError] = useState("");
    //--- Stato del Messaggio se aperto o meno
    const [errorSB, setErrorSB] = useState(false);
    const closeErrorSB = () => setErrorSB(false);
    const openErrorSB = () => setErrorSB(true);

    /*-----Possibile Choose
      "primary",
      "secondary",
      "info",
      "success",
      "warning",
      "error",
      "dark",
      "light", */
    // --- Richiamando e settando uno di questi valori definisce il colore e l'icona in utilizzo dal pop-up
    const [dymIcon, setDymIcon] = useState("warning");

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

    const [arrays, setArrayOfObjects] = useState([]);

    useEffect(() => {
      const arrayOfObjects = [];
    
      for (let i = 0; i < existSuppliers.length; i++) {
        const supplier = existSuppliers[i];
        const supplierProperties = Object.entries(supplier).map(([key, value]) => ({
          key,
          value
        }));
    
        const supplierObject = [supplierProperties];//{ [supplier.Name]: supplierProperties };
        arrayOfObjects.push(supplierObject);
      }
    
      setArrayOfObjects(prev => [...prev, ...arrayOfObjects]);
    }, [existSuppliers]);
    

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
              <h1>Fornitori Config</h1>
              <Divider sx={{ margin: 2 }} style={{backgroundImage: "linear-gradient(to right, rgba(52, 71, 103, 0), rgb(52 71 103), rgb(52 71 103 / 13%))!important"}} />
              {!err ?
                (loader ? <MinLoader /> :
                  (
                    <>
                    {arrays.map((data, index) => {
                        return (
                          <Card key={index} sx={{marginBottom: 1}}>
                            <SupplierElement key={index} data={data} i={index}/>
                          </Card>
                        )
                    })}
                    {renderErrorSB}
                    </>
                  )
                )
                : <EmojiError />
              }
            </MDBox>
          </DashboardLayout>
    )
}