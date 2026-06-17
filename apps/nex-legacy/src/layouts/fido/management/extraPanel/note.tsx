import React from 'react';

import { Backdrop, Card, Divider, IconButton, Stack, Typography } from '@mui/material';
import { PopupInfo } from 'components/PopupInfo';
import { icon_close, icon_info } from 'config/icons';
import LoadingButton from '@mui/lab/LoadingButton';
import MinLoader from '../../../../minLoader';
import { MainTheme } from 'assets/settingsTheme';
import { RichTextEditor } from '@nex/fd-ui';


interface NoteProps {
    status: boolean;
    handleComments: string;
    onSendLoad: boolean;

    ChangePanelStatus: () => void;
    Send: (res: { tp?: 0 | 1, esito?: 1 | 2 }) => void;
    ChangeComments: (e: any) => void;
};
export const Note: React.FC<NoteProps> = ({ status, handleComments, onSendLoad,
    ChangePanelStatus, Send, ChangeComments }) => {
    const palette = MainTheme().palette;

    return <Backdrop open={status} sx={{ color: '#fff', zIndex: (theme: any) => theme.zIndex.drawer + 1 }}>
        <Card sx={{ width: '40%', height: '70%', borderRadius: 5, p: 2, alignItems: 'center' }}>
            <Stack direction='row' width='100%' alignItems='center'>
                <Typography variant='h4'>Completa la Richiesta</Typography>
                <IconButton sx={{
                    ml: 'auto', backgroundColor: palette.error.light,
                    "&:hover": { backgroundColor: palette.error.dark }
                }} onClick={() => ChangePanelStatus()}>
                    {icon_close({ color: '#fff' })}
                </IconButton>
            </Stack>

            <Divider sx={{ width: '100%', backgroundColor: '#000' }} />

            <PopupInfo title='Commento' icon={icon_info({ color: '#000' })} body="Hai la possibilità di inserire 
            un commento sul motivo della tua azione. Oppure decidere di continuare comunque con l'aggiornamento della richiesta." close={false} />
            {!onSendLoad ?
                <RichTextEditor
                    value={handleComments || ""}
                    onChange={(html: any) => ChangeComments(html)}
                    placeholder="Scrivi il messaggio…"
                    className="w-full h-full"
                    debounceMs={120}
                    actions={["bold", "italic", "underline", "strike", "h1", "h2", "ul", "ol", "quote", "code", "link", "clear"]}
                />
                : <MinLoader sx={{ width: 40, mt: 'auto', mb: 'auto' }} />}

            <Divider sx={{ width: '100%', backgroundColor: '#000' }} />
            <LoadingButton variant='contained' color='secondary'
                loading={onSendLoad}
                sx={{ color: '#fff' }} onClick={() => Send({ tp: 0 })}>
                invia la richiesta di sblocco
            </LoadingButton>
        </Card>
    </Backdrop>
};