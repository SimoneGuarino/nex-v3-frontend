import React, { Fragment } from 'react';

import { IconButton, Stack, TextField, Backdrop, Card, Theme } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import MDTypography from "components/MDTypography";

import { MainTheme } from 'assets/settingsTheme';
import { icon_close, icon_email, icon_info } from 'config/icons';
import { enqueueSnackbar } from 'components/MessageBox';
import { PopupInfo } from 'components/PopupInfo';
import { SendMailAPI } from './fetch/send';
import { useUserContext } from 'context/UserContext';
import { Success } from 'components/Success';
import RichTextEditor from 'components/UI/input/RichTextEditor';
import { useNexTheme } from '@nex/theme-system';


interface SendMailProps {
    SendEmail?: ({ to, body }: { to: string, body: string }) => void;
    interactionsLocked?: boolean;
    allowClose?: boolean;
    loading: boolean;
    ChangeLoadStatus: ({ from, bool }: { from: string, bool: boolean }) => void;
    closeMailPanel: () => void;
    panelStatus: boolean;
    fetchSettings: {
        url: string;
        body: object;
    },
    infoBox?: {
        title: string;
        description: string;
    },

}

export const SendMail: React.FC<SendMailProps> = ({
    SendEmail,
    panelStatus,
    loading,
    closeMailPanel,
    fetchSettings,
    infoBox,
    ChangeLoadStatus,
    interactionsLocked = false,
    allowClose = false,
}) => {
    const [userContext] = useUserContext();
    //
    const [success, setSuccess] = React.useState(false);

    const [toEmail, setToEmail] = React.useState('');
    const [bodyEmail, setBodyEmail] = React.useState('');

    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const handleToEmail = (e: any) => setToEmail(e.target.value);
    const handleBodyEmail = (e: any) => setBodyEmail(e);

    // Abort il panding del fetch all server
    const abortController = React.useRef(null);

    const headerMemo = React.useMemo(() => (
        <Fragment>
            <Stack direction='row' alignItems='center' sx={{ padding: "1rem" }} gap={2}>
                {icon_email({ width: 30, height: 30, color: '#adadad' })}
                <MDTypography component="h2" sx={{ fontSize: "1.5rem", fontWeight: "500" }}>
                    Invia una e-mail
                </MDTypography>
                <IconButton data-tour="sit-fidi-mail-close" onClick={() => { if (interactionsLocked && !allowClose) return; closeMailPanel(); }}
                    disabled={interactionsLocked && !allowClose} sx={{
                        marginLeft: 'auto', backgroundColor: palette.error.light,
                        "&:hover": { backgroundColor: palette.error.dark }, "&.Mui-disabled": {
                            backgroundColor: palette.error.light,
                            opacity: 1,
                            cursor: 'not-allowed',
                        },
                    }}>
                    {icon_close({ color: '#fff' })}
                </IconButton>
            </Stack>

            {infoBox && <PopupInfo title={infoBox?.title} body={infoBox?.description} icon={icon_info()} sx={{ ml: 1, mr: 1 }} />}

            <Stack direction='row' gap={3} alignItems='center' sx={{ padding: '0px 0px 0px 13px' }}>
                <MDTypography component="span" sx={{
                    fontSize: "1.0rem", fontWeight: "500",
                    border: `1px solid ${darkMode ? palette.grey[700] : palette.grey[400]}`, padding: '0 20px', borderRadius: 3
                }}>A</MDTypography>

                <TextField value={toEmail} onChange={e => handleToEmail(e)} id="outlined-basic"
                    label="e-mail utente" variant="outlined" fullWidth sx={{ mr: 2 }} disabled={interactionsLocked} />

            </Stack>
        </Fragment>
    ), [toEmail, interactionsLocked, allowClose, closeMailPanel,]);


    const BridgeSendMail = () => {
        if (toEmail === '' || bodyEmail === '' || !userContext) {
            return enqueueSnackbar("Compila tutti i campi prima di proseguire con l'invio della mail", {
                title: 'Compila i campi',
                type: 'error',
            })
        };
        ChangeLoadStatus({ from: 'mail', bool: true });

        SendMailAPI({
            userContext, abortController, fetchSettings: {
                url: fetchSettings.url,
                body: {
                    to: toEmail,
                    body: bodyEmail,
                    ...fetchSettings.body
                }
            }, closeMailPanel, setSuccess, ChangeLoadStatus
        });
    }

    return (<React.Fragment>
        <Backdrop open={panelStatus} sx={{ color: '#fff', zIndex: (theme: Theme) => theme.zIndex.drawer + 1 }}>
            <Card sx={{ height: '80%', width: '80%', borderRadius: 5, transition: 'all 200ms ease-in' }} data-tour="sit-fidi-mail-2">
                <Stack gap={2} sx={{ width: '100%', height: '100%' }}>
                    {headerMemo}
                    <RichTextEditor
                        value={bodyEmail || ""}
                        //onChange={(html: any) => handleBodyEmail(html)}
                        onChange={handleBodyEmail}
                        placeholder="Scrivi il messaggio…"
                        className="w-full h-full"
                        debounceMs={120}
                        actions={["bold", "italic", "underline", "strike", "h1", "h2", "ul", "ol", "quote", "code", "link", "clear"]}
                    />

                    <Stack direction='row' sx={{ p: "0px 16px 16px", marginTop: 'auto' }}>
                        <LoadingButton
                            color='secondary'
                            onClick={() => BridgeSendMail()}
                            size="small"
                            loading={loading}
                            disabled={interactionsLocked || loading}
                            sx={{ color: '#fff', minWidth: 100 }}
                            loadingPosition="end"
                            variant="contained"
                        ><span>Invia E-Mail</span></LoadingButton>
                        <IconButton onClick={() => setBodyEmail("")} sx={{ marginLeft: 'auto' }} >
                            <DeleteOutlineOutlinedIcon sx={{ color: palette.error.dark }} />
                        </IconButton>
                    </Stack>
                </Stack>
            </Card>
        </Backdrop>
        <Success success={success} setSuccess={setSuccess} />
    </React.Fragment>
    )
}