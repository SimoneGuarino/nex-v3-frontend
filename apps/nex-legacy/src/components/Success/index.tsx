import React from 'react';
// @MUI Components
import Stack from '@mui/material/Stack';
import Backdrop from '@mui/material/Backdrop';
import { Grow, IconButton, Slide, Fade } from '@mui/material';
import MDTypography from 'components/MDTypography';

import DoneRoundedIcon from '@mui/icons-material/DoneRounded';
import { icon_close } from 'config/icons';

type SuccessProps = {
    success: boolean;
    setSuccess: React.Dispatch<React.SetStateAction<boolean>>;
};

export function Success({ success, setSuccess }: SuccessProps): JSX.Element {
    return (
        <Fade in={success} timeout={1000}>
            <Backdrop open={success} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 2 }}>
                <Stack
                    sx={{
                        backgroundColor: '#fff',
                        width: '30%',
                        height: '70%',
                        minWidth: '450px',
                        borderRadius: '10px',
                        position: 'relative',
                        maxHeight: 700,
                        maxWidth: 500,        // rimosso duplicato
                        overflow: 'auto',     // spostato qui da prop
                    }}
                >
                    <Stack minHeight={500} height="100%" p={3}>
                        <Slide direction="down" in={success} timeout={2000} mountOnEnter unmountOnExit>
                            <IconButton
                                onClick={() => setSuccess(false)}
                                sx={{ fontSize: '1.5em', color: '#c92020bd', ml: 'auto', textAlign: 'center' }}
                            >
                                {icon_close()}
                            </IconButton>
                        </Slide>

                        <Stack alignItems="center" justifyContent="center" height="100%">
                            <Grow in={success} timeout={1000}>
                                <DoneRoundedIcon sx={{ color: '#7ec143ad', width: '50%', height: '50%' }} />
                            </Grow>
                            <Grow in={success} timeout={200}>
                                <span
                                    style={{
                                        position: 'absolute',
                                        height: 280,
                                        border: '3px solid #7ec143ad',
                                        borderRadius: '50%',
                                        minWidth: 300,
                                    }}
                                />
                            </Grow>
                        </Stack>

                        <Slide direction="up" in={success} timeout={2000} mountOnEnter unmountOnExit>
                            <MDTypography component="p" sx={{ width: '100%', textAlign: 'center' }}>
                                Operazione Riuscita con successo!
                            </MDTypography>
                        </Slide>
                    </Stack>
                </Stack>
            </Backdrop>
        </Fade>
    );
}
