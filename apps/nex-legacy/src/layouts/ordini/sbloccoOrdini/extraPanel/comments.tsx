import React from 'react';

import { Avatar, Backdrop, Card, Divider, IconButton, Stack } from '@mui/material';
import { PopupInfo } from 'components/PopupInfo';
import { icon_close, icon_info, icon_time } from 'config/icons';
import { StringAvatar } from 'utils/stringToColor';
import { MainTheme } from 'assets/settingsTheme';
import MDTypography from 'components/MDTypography';
import { useMaterialUIController } from 'context/index';
import { useTour } from "tour/TourProvider";
import { useNexTheme } from '@nex/theme-system';

interface MessageBlockProps {
    title: string;
    username: string;
    message: string;
    direction: 'left' | 'right';
    date: string;
};
const MessageBlock: React.FC<MessageBlockProps> = ({ username, title, message, date, direction }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    return <Stack height='100%' width='100%' color='#000' mt={1} gap={1}>
        <MDTypography variant='h6' sx={{ fontSize: '0.9rem', textAlign: direction }}>Nota da parte {title}</MDTypography>
        {message && <Stack direction='row' gap={1} alignItems='center' justifyContent={direction == 'left' ? 'flex-start' : 'flex-end'} >
            {icon_time({ color: '#ccc' })}
            <MDTypography variant='body2' sx={{ fontSize: '0.77rem', textAlign: direction }}>{date}</MDTypography>
        </Stack>}
        <Stack direction='row' gap={1} justifyContent='flex-end' sx={{ direction: `${direction === 'right' ? 'ltr' : 'rtl'}` }}>
            <Stack p={2} sx={{ backgroundColor: `${darkMode ? palette.grey[800] : palette.grey[300]}`, borderRadius: 3, direction: "ltr" }} height='fit-content'>
                {message ? <p style={{ color: `${darkMode ? palette.white.main : palette.black.main}`, fontSize: "0.9rem", fontWeight: "300", maxWidth: "60em" }}
                    dangerouslySetInnerHTML={{ __html: message }}></p>
                    : <MDTypography variant='body2' sx={{ fontSize: '0.9rem', textAlign: direction }}>L'utente non ha lasciato un commento</MDTypography>}
            </Stack>
            {message && <Avatar data-tooltip-content={username || 'Sistema'} data-tooltip-id='general-confg-suppliers-tooltip'
                {...StringAvatar({ firstName: (username || 'Sistema') })} />}
        </Stack>
    </Stack>
}


interface CommentsProps {
    panelStatus: boolean;
    creata: {
        data: any;
        nota: string;
        da: {
            username: string;
        };
    };
    esito: {
        data: any;
        nota: string,
        da: {
            username: string;
        }
    };

    ChangePanelStatus: () => void;
    checkAdminDev?: boolean;
};
export const Comments: React.FC<CommentsProps> = ({ panelStatus, creata, esito, ChangePanelStatus, checkAdminDev }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;
    //const { isOpen, index } = useTour();
    //const disableClose = isOpen && index === 8;
    const { isOpen, index: tourIndex } = useTour();
    const lockInteractions =
        (isOpen && checkAdminDev && tourIndex === 8) ||
        (isOpen && !checkAdminDev && tourIndex === 18);

    return <Backdrop open={panelStatus} sx={{ color: '#fff', zIndex: (theme: any) => theme.zIndex.drawer + 2 }}>
        <Card sx={{ width: '40%', maxWidth: 600, height: 'fit-content', maxHeight: '70%', borderRadius: 5, p: 2, alignItems: 'center', position: 'relative', }} data-tour="sblocco-comm-2">
            {lockInteractions && (
                <div
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 10,
                        pointerEvents: 'auto',
                    }}
                    onClickCapture={(e) => e.stopPropagation()}
                />
            )}
            <Stack direction='row' width='100%' alignItems='center'>
                <MDTypography variant='h4'>Commenti</MDTypography>
                <IconButton sx={{
                    ml: 'auto', backgroundColor: palette.error.light,
                    "&:hover": { backgroundColor: palette.error.dark },
                    '&.Mui-disabled': {
                        opacity: 1,
                        backgroundColor: palette.error.light,
                        color: '#fff',
                        cursor: 'default',
                        pointerEvents: 'none',
                    },
                }} disabled={lockInteractions} onClick={() => ChangePanelStatus()} data-tour="sblocco-comm-close">
                    {icon_close({ color: '#fff' })}
                </IconButton>
            </Stack>

            <Divider sx={{ width: '100%', backgroundColor: '#000' }} />

            <PopupInfo title='Info Commenti' icon={icon_info({ color: `${darkMode ? palette.grey[600] : palette.grey[500]}` })}
                body='In questo pannello è presente il commento scritto dal commerciale 
            che ha eseguito la richiesta (attualmente in elaborazione) e il commento di chi accetta o rifiuta la richiesta' close={false} />

            <Stack height='fit-content' width='100%' overflow='auto' gap={3} mt={2} mb={3} p={1}>
                <MessageBlock username={creata.da.username} title="del Commerciale" message={creata.nota} direction='left' date={new Date(creata.data).toLocaleString()} />
                {esito && <MessageBlock username={esito?.da?.username} title="dell'Amministrativo" message={esito?.nota} direction='right'
                    date={new Date(esito?.data).toLocaleString()} />}
            </Stack>
        </Card>
    </Backdrop>
};