import { useEffect, useState, useRef } from "react";
import { useMaterialUIController } from "context";

import MDTypography from "components/MDTypography";

import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';

import AddIcon from '@mui/icons-material/Add';

import FormControlElm from "./formControlElm";
import Divider from "@mui/material/Divider";

import CreateOutlinedIcon from '@mui/icons-material/CreateOutlined';
import ExpandLess from '@mui/icons-material/ExpandLess';

export default function SupplierElements (props){
    const [controller, dispatch] = useMaterialUIController();
    const {
        transparentSidenav,
    } = controller;

    const [open, setOpen] = useState(false);

    const [integralData, setIntegralData] = useState(props.data[0]);
    const [data, setData] = useState(props.data[0].filter(data => data.key !== 'Name' && data.key !== "Table"));//props.data[0].filter(data => data.value !== ''));
    //const data = props.data;

    const [elmOnScreen, setElmOnScreen] = useState([]);
    const [fieldCurrentCollection, setfieldCurrentCollection] = useState();

    //Definisce il numero di Form Select > Select
    const [settingSuppliers, setSettingSupplier] = useState([]);

    // Abort il panding del fetch all server
    const abortController = useRef(null);

    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
        }
    };

    const [filtredData, setFiltredData] = useState()

    useEffect(()=>{
        setfieldCurrentCollection(() => {
            return [
                "Articolo",
                "Descri",
                "Produttore",
                "CatMerc",
                "DescrizioneCatMerc",
                "ModelNumber",
                "EAN",
                "CodArtFor",
                "Offerta",
                "Prezzo",
                "PrezzoNetto",
                "Sconto",
                "RAEE",
                "SIAE",
                "DispSEDE",
                "ImpSEDE",
                "OrdAForSEDE",
                "Data",
                "CodicePulito",
                "EANPulito",
            ]
        })
        /*fetch(import.meta.env.VITE_API_ADMIN + "requests/suppliers/read/4s4EhGX6OUjPeQwacex8", {
            //signal: abortController.current.signal,
            method: "POST",
            headers: {"Content-Type": "application/JSON"},
            body: JSON.stringify({
                collectionName: data[0].value
            })
          }).then(response => {
            if (!response.ok) {
                throw new Error(response);
            }
            return response.json();
          })*/
      
          //return cancelRequest;
    },[])

    
    const addMoreSettings = () => {
        setSettingSupplier(prev => {
            const obj = {
                "none": "none"
            }
            return [...prev, obj]
        })
    }

    const removeSettings = (i) => {
        setSettingSupplier(prev => {
            const settingsArr = [...prev]; // Create a copy of the array
            settingsArr.splice(i, 1); // Remove the element at the specified index
            return settingsArr; // Return the updated array
        })
    }

    const [objects, setObjects] = useState([{}]);

    // Trasforma l'oggetto in più oggetti all'avvio del componente
    useState(() => {
        // define target as an array
        for (let i = 0; i < Object.keys(data[0]).length; i++) {
            const dat = data[0];
            const element = Object.values(dat);
            const key = Object.keys(dat);

            setObjects(prev => {
                return [...prev, {[key[i]] : element[i]}]
            }) 
        }
    }, []);


    return (
        <Stack>
            <Stack direction="row">
                <MDTypography variant="h5" fontSize="2rem" textTransform="uppercase" style={{paddingLeft: "0.7em", paddingTop: "0.7em",paddingBottom: "0.5em", opacity: "0.6"}} >
                    {props.data[0][0].value}
                </MDTypography>
                <IconButton onClick={() => setOpen(() => !open)} sx={{marginLeft: "auto", marginRight: "20px", maxWidth: "2em", maxHeight:"2em", alignSelf:"center"}}>
                        <ExpandLess style={{transition: "transform 150ms ease-in"}} sx={!open ? {transform: "rotate(181deg)"} : {transform: "rotate(0)"}}/>
                </IconButton>
            </Stack>
            {open &&
            <Stack>
                <Stack direction="row">
                    <Stack sx={{padding: 2, flexBasis:"50%"}}>
                    {
                        data?.map((singleElm, index) => {
                            return <FormControlElm key={index} i={index} data={data} setData={setData} fieldCurrentCollection={fieldCurrentCollection} missingElm={integralData.filter(elm => !elmOnScreen.includes(elm.key))} setElmOnScreen={setElmOnScreen} objects={objects} singleElm={singleElm} removeSettings={removeSettings} />
                        })
                    }
                    </Stack>
                    <Divider orientation="vertical" flexItem sx={{height: "auto"}} />
                    <Stack sx={{flexBasis:"50%"}}>
                        <Stack spacing={2} className={!transparentSidenav ? "css-color-bgwhite" : null}  sx={{border: "1px solid #ccc", borderRadius:"10px", padding:"20px", margin: "0 20px"}} alignItems="center">
                            <MDTypography component="h6" style={{fontSize: "1rem",fontWeight:"500"}}>
                                Seleziona la Categoria
                            </MDTypography>
                            <Stack direction="row" spacing={3}>
                                <CreateOutlinedIcon  sx={{fontSize:"2em !important"}}/>
                                <MDTypography component="p" style={{fontSize: "1rem",fontWeight:"300"}}>
                                    Dove pensi che sia posizionata la tua domanda/problema all'interno delle tipologie?
                                </MDTypography>
                            </Stack>
                        </Stack>
                    </Stack>
                </Stack>
                <IconButton onClick={() => addMoreSettings()} aria-label="add" size="large" sx={{maxWidth: 50}}>
                    <AddIcon fontSize="inherit" />
                </IconButton>
            </Stack>
            }
        </Stack>
    )
};