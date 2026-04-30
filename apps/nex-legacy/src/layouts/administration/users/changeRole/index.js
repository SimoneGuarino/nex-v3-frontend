import React, { memo, useRef } from 'react';
import { UserContext } from 'context/UserContext';

//@MUI Components
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Backdrop from '@mui/material/Backdrop';
import Divider from '@mui/material/Divider';

import IconButton from '@mui/material/IconButton';

import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import MDTypography from "components/MDTypography";
import AutocompleteRole from './autocomplateRole';

import changeIcon from '../../../../assets/images/settings/8900_3_04_transparent-bg-resized.webp';
import { Card, Fade } from '@mui/material';
import { ChangeRoleAPI } from './fetch/actions/changeRoleAPI.js';




function ChangeRoleLogic({ setChangeRoleMenu, target_username,
    target_role_data, roles, openErrorSB, setData, setSuccess }) {
    const [userContext, setUserContext] = React.useContext(UserContext);
    // Abort il panding del fetch all server
    const abortController = useRef(null);

    const changeRole = React.useCallback((selectedRole) => {
        ChangeRoleAPI(target_username, userContext, selectedRole, abortController, setData,
            setChangeRoleMenu, setSuccess, openErrorSB)
    }, [userContext, target_username]);

    const Head = React.memo(() => {
        return (
            <Stack direction='row' sx={{ padding: '5px 10px 5px' }}>
                <Stack direction='row' sx={{ alignItems: 'center' }} gap={2}>
                    <Tooltip title="Utente attualmente visualizzato.">
                        <InfoOutlinedIcon sx={{ color: '#1597c1' }} />
                    </Tooltip>
                    <MDTypography component="p" style={{
                        fontWeight: "400", textAlign: "center",
                        fontSize: '0.8em', alignSelf: 'center'
                    }}>
                        {target_username}
                    </MDTypography>
                </Stack>

                <Stack direction='row' sx={{ marginLeft: "auto" }}>
                    <Tooltip title="Chiudi">
                        <IconButton sx={{ maxWidth: 40, maxHeight: 40 }} onClick={() => setChangeRoleMenu(false)} aria-label="delete" size="medium">
                            <CloseRoundedIcon sx={{ color: '#1597c1' }} />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Stack>
        )
    })
    
    console.log("target_role_data", target_role_data)

    const Body = React.memo(() => {
        return (
            <Stack marginTop={4}>
                <Stack direction='row' alignItems='center' justifyContent='center' gap={1}>
                    <Stack p={2}>
                        <MDTypography component="p" style={{
                            fontWeight: "300", textAlign: "center", fontSize: 'CLAMP(0.7rem, 1rem, 1rem)',
                            alignSelf: 'center', color: '#c9c9c9'
                        }}>
                            ruolo attuale
                        </MDTypography>
                        <MDTypography component="p" style={{
                            fontWeight: "600", textAlign: "center", fontSize: 'clamp(0.7rem, 2rem, 2rem)', alignSelf: 'center',
                            textTransform: 'uppercase', color: '#1597c1'
                        }}>
                            {target_role_data.ruolo ? target_role_data.ruolo : 'Non Definito'}
                        </MDTypography>
                        <MDTypography component="p" style={{
                            fontWeight: "500", textAlign: "center", fontSize: 'CLAMP(0.7rem, 0.77rem, 1rem)',
                            alignSelf: 'center', color: '#c3c3c3', textTransform: 'uppercase'
                        }}>
                            {target_role_data.ruolo ? roles.find(e => e.ruolo === target_role_data.ruolo).descrizione : ''}
                        </MDTypography>
                    </Stack>
                    <Fade in={true}>
                        <img src={changeIcon} alt='change icon image' loading='lazy' style={{ width: '50%', maxWidth: 250 }} />
                    </Fade>
                </Stack>

                <AutocompleteRole data={roles}
                    openErrorSB={openErrorSB}
                    changeRole={changeRole}
                />
            </Stack>

        )
    })

    return (
        <Backdrop open={true} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} translate="no">
            <Card sx={{
                    width: "30%", height: "auto",
                    minWidth: '600px', maxWidth: '800px', borderRadius: "10px"
            }}>
                <Stack translate="no"
                >
                    <Head />
                    <Divider style={{ background: '#727272', margin: 0 }} />
                    <Body />
                </Stack>
            </Card>
        </Backdrop>
    )
}

export default memo(ChangeRoleLogic);