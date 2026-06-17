import React, { Fragment, useCallback } from 'react';

import { Backdrop, Card, IconButton, Stack, TextField } from '@mui/material';
import MDTypography from "components/MDTypography";

import LoadingButton from '@mui/lab/LoadingButton';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';

import PDFIcon from 'assets/icons/PDF.webp';
import { MainTheme } from 'assets/settingsTheme';
import { icon_close, icon_file } from 'config/icons';
import { RichTextEditor } from '@nex/fd-ui';
import { useNexTheme } from '@nex/theme-system';

type AttachmentKey = string | number;

type DataAttachment = {
    fileName: string;
    _id?: string;
};

type DataAttachments = DataAttachment[] | Record<AttachmentKey, DataAttachment>;

type Settings = {
    smallIcon?: boolean;
};

type SendEmailProps = {
    attachments?: AttachmentKey[];
    dataAttachments: DataAttachments;
    sendMail__: () => void;
    bodyEmail: string;
    setBodyEmail: React.Dispatch<React.SetStateAction<string>>;
    sendingEmailStatus: boolean;
    toEmail: string;
    setToEmail: React.Dispatch<React.SetStateAction<string>>;
    closeMailPanel: () => void;
    settings?: { smallIcon?: boolean };
};

export function SendEmail({
    attachments,
    dataAttachments,
    sendMail__,
    bodyEmail,
    setBodyEmail,
    sendingEmailStatus,
    toEmail,
    setToEmail,
    closeMailPanel,
    settings = { smallIcon: false },
}: SendEmailProps): JSX.Element {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const handleToEmail = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => setToEmail(e.target.value);

    const handleBodyEmail = (value: string) => setBodyEmail(value);

    const smallIcon = settings && settings.smallIcon;

    // helper per leggere il nome file in modo type-safe
    const getFileName = (key: AttachmentKey): string | undefined => {
        if (Array.isArray(dataAttachments)) {
            const idx = typeof key === 'number' ? key : Number(key);
            return dataAttachments[idx]?.fileName;
        }
        return (dataAttachments as Record<AttachmentKey, DataAttachment>)[key]?.fileName;
    };

    const elabAttachments = useCallback(() => (
        attachments && (
            <Stack direction="row" gap={0.5} sx={{ padding: '0 10px', position: 'relative', overflow: 'auto' }}>
                {attachments.map((elm, index) => (
                    <Stack
                        key={index}
                        p={1}
                        gap={1}
                        direction="row"
                        sx={{
                            width: smallIcon ? 'fit-content' : 280,
                            border: `1px solid ${darkMode ? palette.grey[700] : palette.grey[400]}`,
                            borderRadius: 2,
                        }}
                    >
                        {(!settings || smallIcon) ? (
                            icon_file({ color: palette.grey[600], width: 30, height: 30 })
                        ) : (
                            <Stack
                                sx={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                            >
                                <img
                                    className="avoid-drag"
                                    src={PDFIcon}
                                    alt="PDF file"
                                    loading="lazy"
                                    style={{ width: 70, objectFit: 'cover' }}
                                />
                            </Stack>
                        )}
                        <MDTypography
                            component="span"
                            style={{
                                lineBreak: 'auto',
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                textAlign: 'left',
                                alignSelf: 'center',
                                fontSize: '0.65rem',
                                fontWeight: '200',
                                borderRadius: 3,
                            }}
                        >
                            {getFileName(elm)}
                        </MDTypography>
                    </Stack>
                ))}
            </Stack>
        )
    ), [darkMode]);

    const headerMemo = React.useMemo(() => (
        <Fragment>
            <Stack direction="row" alignItems="center" sx={{ padding: '1rem' }} gap={2}>
                <EmailOutlinedIcon sx={{ width: 30, height: 30, color: '#adadad' }} />
                <MDTypography component="h2" style={{ fontSize: '1.5rem', fontWeight: '500' }}>
                    Invia una e-mail
                </MDTypography>
                <IconButton
                    onClick={() => closeMailPanel()}
                    sx={{ marginLeft: 'auto', backgroundColor: palette.error.light, '&:hover': { backgroundColor: palette.error.dark } }}
                >
                    {icon_close({ color: '#fff' })}
                </IconButton>
            </Stack>

            <Stack direction="row" gap={3} alignItems="center" sx={{ padding: '0px 0px 0px 13px' }}>
                <MDTypography
                    component="span"
                    style={{
                        fontSize: '1.0rem',
                        fontWeight: '500',
                        border: `1px solid ${darkMode ? palette.grey[700] : palette.grey[400]}`,
                        padding: '0 20px',
                        borderRadius: 3,
                    }}
                >
                    A
                </MDTypography>

                <TextField
                    value={toEmail}
                    onChange={handleToEmail}
                    id="outlined-basic"
                    label="e-mail utente"
                    variant="outlined"
                    fullWidth
                    sx={{ mr: 2 }}
                />
            </Stack>
            {elabAttachments()}
        </Fragment>
    ), [toEmail]);

    return (
        <Backdrop open={true} sx={{ color: '#fff', zIndex: (theme: any) => theme.zIndex.drawer + 1 }}>
            <Card sx={{ height: '80%', width: '80%', borderRadius: 5, transition: 'all 200ms ease-in' }}>
                <Stack gap={2} sx={{ width: '100%', height: '100%' }}>
                    {headerMemo}

                    <RichTextEditor
                        value={bodyEmail || ""}
                        onChange={(html: any) => handleBodyEmail(html)}
                        placeholder="Scrivi il messaggio…"
                        className="w-full h-full"
                        debounceMs={120}
                        actions={["bold", "italic", "underline", "strike", "h1", "h2", "ul", "ol", "quote", "code", "link", "clear"]}
                    />

                    <Stack direction="row" sx={{ p: '0px 16px 16px', marginTop: 'auto' }}>
                        <LoadingButton
                            color="secondary"
                            onClick={() => sendMail__()}
                            size="small"
                            loading={sendingEmailStatus}
                            sx={{ color: '#fff', minWidth: 100 }}
                            loadingPosition="end"
                            variant="contained"
                        >
                            <span>Invia E-Mail</span>
                        </LoadingButton>
                        <IconButton onClick={() => setBodyEmail('')} sx={{ marginLeft: 'auto' }}>
                            <DeleteOutlineOutlinedIcon sx={{ color: palette.error.dark }} />
                        </IconButton>
                    </Stack>
                </Stack>
            </Card>
        </Backdrop>
    );
}
