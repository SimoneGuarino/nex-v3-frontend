import React, { Fragment } from 'react';

import { Backdrop, IconButton, Paper, Stack } from '@mui/material';
import MDTypography from "components/MDTypography";

import LoadingButton from '@mui/lab/LoadingButton';
import { icon_close, icon_reportProblem, icon_delete } from 'config/icons';
import RichTextEditor from 'components/UI/input/RichTextEditor';



export function SendEmail({ codTarget, SendEmailToAgent, commentBody, setCommentBody,
    setSendEmail, sendingEmailStatus }) {

    const headerMemo = React.useMemo(() => (
        <Fragment>
            <Stack direction='row' alignItems='center' sx={{ padding: "1rem" }} gap={2}>
                {icon_reportProblem({ width: 30, height: 30, color: '#edb448' })}
                <MDTypography component="h2" style={{ fontSize: "1.5rem", fontWeight: "500" }}>
                    Invia una e-mail di sollecito
                </MDTypography>
                <IconButton onClick={() => setSendEmail(false)} sx={{ marginLeft: 'auto', borderBottom: '1px solid #ccc' }}>
                    {icon_close({ color: '#d35a29' })}
                </IconButton>
            </Stack>

            <Stack direction='row' gap={3} alignItems='center' sx={{ padding: '0px 0px 0px 13px' }}>
                <MDTypography component="span" style={{
                    fontSize: "1.0rem", fontWeight: "500",
                    border: '1px solid #ccc', padding: '0 20px', borderRadius: 3
                }}>A</MDTypography>
                <MDTypography component="span" style={{ fontSize: "1rem", fontWeight: "200", width: '100%' }}>
                    {codTarget.nome}
                </MDTypography>
            </Stack>
        </Fragment>
    ), [codTarget])


    return (
        <Backdrop open={true} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Paper sx={{ height: '70%', width: '35%', borderRadius: 5 }}>
                <Stack gap={2} sx={{ width: '100%', height: '100%' }}>
                    {headerMemo}

                    <RichTextEditor
                        value={commentBody || ""}
                        onChange={(html) => setCommentBody(html)}
                        placeholder="Scrivi il messaggio…"
                        className="w-full h-full"
                        debounceMs={120}
                        actions={["bold", "italic", "underline", "strike", "h1", "h2", "ul", "ol", "quote", "code", "link", "clear"]}
                    />

                    <Stack direction='row' sx={{ p: "0px 16px 16px", marginTop: 'auto' }}>
                        <LoadingButton
                            onClick={() => SendEmailToAgent(1)}
                            size="small"
                            loading={sendingEmailStatus}
                            sx={{ color: '#fff', minWidth: 100 }}
                            loadingPosition="end"
                            variant="contained"
                        ><span>Invia E-Mail</span></LoadingButton>
                        <IconButton onClick={() => setCommentBody("")} sx={{ marginLeft: 'auto' }}>
                            {icon_delete({ color: '#7f7e7e' })}
                        </IconButton>
                    </Stack>
                </Stack>
            </Paper>
        </Backdrop>
    )
}