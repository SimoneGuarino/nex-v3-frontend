import { useCallback, memo, useRef } from 'react';
import { useGSettingsContext } from "../context/GSettingsContext";

import { MTCAccess } from './requests/MTCAccess';

import Stack from '@mui/material/Stack';
import MDTypography from "components/MDTypography";

import mainbg from "assets/images/maintenance/3675500.webp";
import logoF from "assets/images/logo-fc.png";

import IconButton from '@mui/material/IconButton';
import PasswordOutlinedIcon from '@mui/icons-material/PasswordOutlined';


function Maintenance() {
    const { setGSettingsMode, setCanAccess } = useGSettingsContext();

    // Abort il panding del fetch all server
    const abortController = useRef(null);

    const MTCAccessAPI = useCallback(() => {
        MTCAccess(abortController, setGSettingsMode, setCanAccess);
    },[abortController.current])

    return (
        <Stack sx={{width: '100%', height: '100vh'}}>
            <Stack direction='row' sx={{maxHeight: 70, backgroundColor: '#142433'}} justifyContent='center'>
                <img src={logoF} alt="Under Maintenance" style={{maxWidth: 50}} />
                <MDTypography component="span" style={{color:"#e7e7e7", textAlign:"center", marginTop:"0.3em", font:"30px/1.25 Google Sans,Helvetica Neue,sans-serif"}}>
                    Focelda
                </MDTypography>
            </Stack>
            <Stack alignItems='center'>
                <img src={mainbg} alt="Under Maintenance" style={{width: '70%', maxWidth: 900}}/>
                <Stack sx={{maxWidth: '50%'}} justifyContent='center'>
                    <MDTypography component="span" style={{ color: "#000", fontWeight: 600, textAlign: "center", marginTop: "0.3em", fontSize: 'xxx-large', lineHeight: 1.1}}>
                        Torneremo presto!
                    </MDTypography>
                    <MDTypography component="span" style={{ color: "#000", textAlign: "center", marginTop: "0.3em", fontSize: 'small', fontWeight: 300 }}>
                        Ci scusiamo per l'eventuale disagio, 
                        siamo temporaneamente inattivi a causa della regolare manutenzione. 
                        torneremo presto operativi!
                    </MDTypography>
                </Stack>
            </Stack>
            <IconButton variant="contained" onClick={() => MTCAccessAPI()} sx={{marginTop: 2, maxWidth: 50, maxHeight:50, alignSelf: 'center', backgroundColor: '#e6e6e6'}}><PasswordOutlinedIcon /></IconButton>
        </Stack>
    )
}

export default memo(Maintenance);