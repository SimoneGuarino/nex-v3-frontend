import { memo } from 'react';

//@MUI Components
import Stack from '@mui/material/Stack';

//internal Components
import MDTypography from "components/MDTypography";
import MDAvatar from "components/MDAvatar";

import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import { MainTheme } from 'assets/settingsTheme';
import { useNexTheme } from '@nex/theme-system';


const tableOfColor = [
    {
        name: 'default',
        sx: {
            background: '#1a73e81f',
            mainColor: '#5580b9 !important',
            secondaryColor: '#8daad1 !important',
        },
    },
    {
        name: 'log-out',
        sx: {
            background: '#e81a1a1f',
            mainColor: '#e5630e !important',
            secondaryColor: '#e0884f !important',
        },
    },
    {
        name: 'log-in',
        sx: {
            background: '#a4ca091f',
            mainColor: '#7e9911 !important',
            secondaryColor: '#a1b15f !important',
        },
    }
];

function UserLastAction(props) {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const { data } = props;
    const style = tableOfColor.find(elm => elm.name === data.Route?.toLowerCase()) ||
        tableOfColor.find(elm => elm.name === data.Event?.toLowerCase()) ||
        tableOfColor.find(elm => elm.name === 'default')

    return (
        <Stack translate="no" sx={{
            background: style.sx.background,
            width: '100%',
            maxWidth: 500,
            height: 'auto',
            minHeight: 150,
            marginBottom: 2,
            padding: '18px 38px',
            borderRadius: 3
        }}>
                <Stack direction='row' gap={2} alignItems='center'>
                    <MDAvatar
                        data-tooltip-id="main-user-management-tooltip"
                        data-tooltip-content={data.route?.toLowerCase()}
                        src={<AccessTimeOutlinedIcon />}
                        alt={data.route?.toUpperCase()}
                        size="lg"
                        sx={({ borders: { borderWidth }, palette: { white } }) => ({
                            cursor: "pointer",
                            position: "relative",
                            background: `${darkMode ? palette.grey[800] : palette.white.main}`,
                            color: `${!darkMode ? palette.grey[400] : palette.white.main}`,
                            fontSize: '100%',
                            "&:hover, &:focus": {
                                zIndex: "10",
                            },
                        })}
                    />
                    <Stack sx={{ color: style.sx.text }}>
                        <MDTypography variant="h5" sx={{ color: style.sx.mainColor }} fontWeight="medium">
                            {data.event}
                        </MDTypography>
                        <MDTypography variant="p" sx={{ color: style.sx.secondaryColor, fontSize: '0.7em' }} fontWeight="small">
                            Evento
                        </MDTypography>
                        <MDTypography variant="p" sx={{ color: style.sx.secondaryColor, fontSize: '0.8em' }}>
                            l'utente è {data.Event !== 'Log-out' ? 'entrato nella' : 'uscito dalla'} pagina {data.route?.toLowerCase()}
                        </MDTypography>
                    </Stack>
                </Stack>
                <Stack direction='row' gap={2} mt='auto'>
                    <AccessTimeOutlinedIcon sx={{ color: style.sx.mainColor }} />
                    <MDTypography variant="h5" sx={{ color: style.sx.mainColor, fontWeight: 600, fontSize: '0.8em' }}>
                        {new Date(data.date).getHours().toString().padStart(2, '0') + ':' + new Date(data.date).getMinutes().toString().padStart(2, '0')}
                    </MDTypography>
                </Stack>
        </Stack>
    )
}

export default memo(UserLastAction);