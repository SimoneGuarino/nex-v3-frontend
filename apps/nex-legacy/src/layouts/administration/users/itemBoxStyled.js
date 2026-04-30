import React, { useState, memo } from 'react';

//@MUI Components
import { Stack, Avatar, IconButton, Button } from '@mui/material';

//internal Components
import MDTypography from "components/MDTypography";
import MDBadge from "components/MDBadge";

import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import Switch from '@mui/material/Switch';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { styled } from '@mui/material/styles';
import { icon_moreSettings } from 'config/icons';
import { MainTheme } from 'assets/settingsTheme';


const UISwitch = styled((props) => (
    <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
    width: 42,
    height: 26,
    padding: 0,
    '& .MuiSwitch-switchBase': {
        padding: 0,
        transitionDuration: '300ms',
        '&.Mui-checked': {
            color: '#fff',
            '& + .MuiSwitch-track': {
                backgroundColor: theme.palette.mode === 'dark' ? '#65C466 !important' : '#cd8282 !important',
                opacity: 1,
                border: 0,
            },
            '&.Mui-disabled + .MuiSwitch-track': {
                opacity: 0.5,
            },
        },
    },

    '& .MuiSwitch-track': {
        margin: 2,
        backgroundColor: theme.palette.mode === 'light' ? '#abcb9a' : '#39393D',
        opacity: 1,
        transition: theme.transitions.create(['background-color'], {
            duration: 500,
        }),
    },
}));


/**
 * componente funzionale di struttura del singolo box elemento.
 * @param index in input l'index della posizione del'oggetto nel 'array
 * @param elm fa riferimento all'interno oggetto selezionato.
 * @param stringAvatar funzione di conversione del nome in colore e iniziali per componenti Avatar
 * @param handleOpenMenu arrow function che determina lo stato di apertura del moreMenu
 * @param setIndexUserSelected set di Stato per modificare l'index attualmente selezionato
 * @param Ban_Callback funzione di callback per l'abilitazione o disabilitazione dello stato di ban con target utente
 */
function ItemBoxStyled({ index, elm, stringAvatar, handleOpenMenu,
setIndexUserSelected, Ban_Callback, setCAStatus }) {
    const palette = MainTheme().palette;

    const [banStatus, setBanStatus] = useState(elm.disabilitato);
    const checkStatus = elm.stato?.codice == 'Offline';

    const css_h1 = {
        fontSize: '0.87rem',
        lineHeight: 'normal',
    };

    const css_p = {
        fontSize: '0.87rem',
    };

    const PickBadgeColor = (status) => {
        let color;
        switch (status) {
            case "Online":
                color = "success";
                break;
            case "Offline":
                color = "dark";
                break;
            case "Assente":
                color = "warning";
                break;
        }
        return color;
    }



    const Body = React.memo(() => (
        <Stack translate="no"
            sx={checkStatus ?
                !banStatus ? { opacity: 0.5, filter: 'grayscale(1)', backgroundColor: '#4f69b41f' }
                    : { backgroundColor: '#e7e9ecì' }
                : banStatus && { backgroundColor: palette.error.main }}
            style={{
                display: 'flex', minWidth: 400, width: '100%', borderRadius: 20, backgroundColor: '#4f69b41f',
                transition: 'background-color 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms !important', padding: 15, justifyContent: "flex-start", gap: 10
            }}
            direction='row'
        >
            <Stack width='100%' height='100%' p='16px 0' direction='row' gap={2} alignItems='flex-start' translate="no">
                <Avatar {...stringAvatar(elm.nome, elm.cognome, checkStatus)}
                    style={{ width: '60px', height: '60px', fontSize: '1.5em' }} />

                <Stack alignItems='flex-start' gap={1} sx={(checkStatus && banStatus) &&
                    { opacity: 0.5, filter: 'grayscale(1)' }}>
                    <Stack alignItems='flex-start'>
                        <MDTypography component="h3" sx={css_h1} //sx={{ color: '#f2f2f2' }}
                            style={{ fontWeight: 600, fontSize: '1.15rem' }}>
                            {elm.nome + " " + elm.cognome}
                        </MDTypography>
                        <MDTypography component="h3" style={{ ...css_p }}>
                            {elm.username}
                        </MDTypography>
                    </Stack>

                    <Stack direction='row' gap={1}>
                        <MDBadge badgeContent={elm.stato.codice} color={PickBadgeColor(elm.stato.codice)} variant="gradient" size="sm" container={true} />
                        <MDBadge badgeContent={(Array.isArray(elm.ruolo) ? 
                            elm.ruolo.length > 0 ? 
                                elm.ruolo : "Non Definito"
                        : (elm.ruolo || "Non Definito"))} color={'info'} variant="gradient" size="sm" container={true} />
                    </Stack>
                    <Stack direction='row' alignItems='center' gap={1}>
                        <AccessTimeFilledIcon sx={{ ...css_p }} />
                        <MDTypography component="h3" style={{ ...css_p }}>
                            {elm.stato.ultimoAccesso ? 'ultimo accesso: ' + formatDistanceToNow(new Date(elm.stato.ultimoAccesso), { locale: it }) + " fa" : "L'utente non mai entrato"}
                        </MDTypography>
                    </Stack>
                </Stack>

                <Stack marginLeft='auto' direction='row' alignItems='center'>
                    <UISwitch
                        data-tooltip-id="main-user-management-tooltip"
                        data-tooltip-content={`${!banStatus ? 'Disattiva' : 'Attiva'} questo Account`}
                        defaultChecked={banStatus}
                        onChange={() => Ban_Callback(index, !banStatus, setBanStatus)}
                        sx={{ alignSelf: 'flex-end', marginBottom: '3px' }}
                    />
                    <IconButton data-tooltip-id="main-user-management-tooltip"
                        data-tooltip-content='Impostazione Utente'
                        onClick={(e) => {
                            setIndexUserSelected(index);
                            handleOpenMenu(e);
                        }}>
                        {icon_moreSettings()}
                    </IconButton>
                </Stack>
            </Stack>

        </Stack>
    ))

    const AddMoreBox = React.memo(() => (
        <Button translate="no"
            onClick={() => setCAStatus(true)}
            sx={{ opacity: 0.5, filter: 'grayscale(1)', backgroundColor: '#4f69b41f', '&:hover': { backgroundColor: '#ccc' } }}
            style={{
                display: 'flex', minWidth: 400, width: '100%', borderRadius: 20,
                transition: 'background-color 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms !important', padding: 15,
                justifyContent: "center"
            }}
            direction='row'
        >
            <AddRoundedIcon sx={{ width: '100%', height: '100%' }} />
        </Button>
    ))

    return (
        index > 0 ?
            <Body /> : <AddMoreBox />
    )
}

export default memo(ItemBoxStyled);