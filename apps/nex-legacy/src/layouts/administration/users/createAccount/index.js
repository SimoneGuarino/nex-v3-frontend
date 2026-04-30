import React, { Fragment } from "react";
import './style.css';
//@Internal Packages
import MDTypography from "components/MDTypography";
import { CreateAccountAPI } from "../fetch/actions/createAccountAPI";

import bgIcon from 'assets/images/settings/Wavy_Gen-01_Single-07.webp'
//@MUI external Packages
import {
    Button, Backdrop, Stack,
    InputBase, Divider, IconButton, Fade,
    Card
} from "@mui/material";
//@MUI Icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LoadingButton from "@mui/lab/LoadingButton";
import { MainTheme } from "assets/settingsTheme";
import { icon_close } from "config/icons";

import sanitizeModule from "classes/sanitize";
import { useNexTheme } from "@nex/theme-system";
const Sanitize = new sanitizeModule();



export function CreateAccount({ setCAStatus, abortController, setSuccess, openErrorSB, userContext }) {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const [newUserData, setNewUserData] = React.useState({});
    const [loadingBtnStatus, setLoadingBtnStatus] = React.useState(false);
    //Field that need to appear in the form box
    const [field, setField] = React.useState([
        { key: 'Nome', type: 'string' },
        { key: 'Cognome', type: 'string' },
        { key: 'Email', type: 'email' },
        { key: 'Password', type: 'password' },
    ]);




    const handleText = (target, e) => {
        console.log(target)
        const elm = e.target.value;
        setNewUserData(prev => {
            return { ...prev, [target]: elm };
        })
    };

    const CheckSingleField = (target) => {
        if (newUserData[target] && newUserData[target].trim() !== '') {
            return true;
        }
        return false;
    }

    const GenQuestions = React.useCallback(() => (
        <Stack mt={3}>
            {field.map((elm, index) => (
                <Fragment key={index}>
                    <MDTypography component='p' sx={{
                        fontWeight: 600, color: '#c9c9c9',
                        fontSize: '0.76rem', paddingLeft: 0.5, marginTop: 2
                    }}>{elm.key} dell'utente</MDTypography>
                    <Stack direction='row' sx={{ width: '100%', border: '1px solid #ccc', borderRadius: 1.5 }} alignItems='center'>
                        <InputBase
                            sx={{ m: 0.8, ml: 1, flex: 1, fontSize: '0.9rem', color: `${darkMode ? palette.white.main : palette.black.main}`}}
                            onChange={e => handleText(elm.key, e)}
                            type={elm.type.toLowerCase() === 'password' ? 'password' : 'text'}
                            placeholder={elm.key}
                            inputProps={{ 'aria-label': elm.key }}
                        />
                        {CheckSingleField(elm.key) && <CheckCircleIcon sx={{ color: '#1597c1', marginRight: 1, width: 25, height: 25 }} />}
                    </Stack>
                </Fragment>
            ))}
        </Stack>
    ))

    const CreateAccount = React.useCallback(() => {
        setLoadingBtnStatus(true);
        //Controllo se effettivamente nei campi ci sono dei valori validi sanificandoli
        for (let i = 0; i < field.length; i++) {
            const e = field[i];
            const value = newUserData[e.key]

            if (CheckSingleField(value)) return false
            const e_sanitized = Sanitize[e.type](value);
            if (!e_sanitized.Success) {
                openErrorSB('info', `inserisci ${e.key}, o controlla che sia un valore valido.`)
                return false;
            }
        }

        CreateAccountAPI(newUserData, setCAStatus, setSuccess, abortController, openErrorSB, userContext, setLoadingBtnStatus);
    })




    return <Backdrop open={true} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} translate="no">
        <Card sx={{
            width: "55%", height: "70%", minWidth: '450px', maxHeight: 700,
            maxWidth: '1200px',
        }}>
            <Stack direction='row' translate="no" height='100%'>
                <Stack sx={{ background: 'linear-gradient(195deg, #4e65a5, #556fb5)', height: '100%',
                 flexBasis: '40%', borderTopLeftRadius: 9, borderBottomLeftRadius: 9 }}
                    alignContent='center' justifyContent='center'>
                    <Fade in={true} timeout={1000}>
                        <img src={bgIcon} alt='user register icon' loading="lazy" style={{ width: '100%' }} />
                    </Fade>
                </Stack>
                <Stack sx={{ flexBasis: '60%' }} p={5}>
                    <MDTypography component='h2' sx={{ fontWeight: 800 }}>
                        Crea un nuovo Account
                    </MDTypography>
                    <Divider sx={{ backgroundColor: '#ccc', height: '1px', marginBottom: 0 }} />
                    {GenQuestions()}
                    <Divider sx={{ backgroundColor: '#ccc', height: '1px', marginTop: 'auto' }} />
                    <LoadingButton loading={loadingBtnStatus}
                        variant="contained" onClick={() => CreateAccount()} sx={{
                            color: '#fff', backgroundColor: '#1597c1',
                            '&:hover': { backgroundColor: '#25a9d3' }
                        }}>
                        Crea!
                    </LoadingButton>
                </Stack>
                <IconButton onClick={() => setCAStatus(false)}
                    sx={{ position: 'absolute', backgroundColor: palette.error.light, top: 10, right: 10, "&:hover": { backgroundColor: palette.error.dark }}}>
                    {icon_close({ color: '#fff' })}
                </IconButton>
            </Stack>
        </Card>
    </Backdrop>
}