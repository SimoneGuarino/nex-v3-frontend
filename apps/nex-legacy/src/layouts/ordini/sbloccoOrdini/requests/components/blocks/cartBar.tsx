import React from 'react';

import { Button, Card, Divider, Fade, Grid, Stack } from '@mui/material';
import { icon_cart, icon_saveMoney } from 'config/icons';
import { NumberToEuro } from 'utils/numberToEuro';
import { Tag } from 'components/Tag/Tag';
import { statusList } from 'layouts/ordini/sbloccoOrdini/statusToColor';
import { MainTheme } from 'assets/settingsTheme';
import MDTypography from 'components/MDTypography';
import MDButton from 'components/MDButton';
import { useTour } from "tour/TourProvider";
import { useNexTheme } from '@nex/theme-system';


interface CartBarProps {
    stato: 0 | 1 | 2;
    residuo: any;
    totaleOrdine: any;
    companyActived: any;
    companyList: string[];
    checkAdminDev: boolean;
    FBAlreadyInRequest: boolean;
    elementSelected: number;
    ifFromGroup: boolean;

    ChangeSendPanelStatus: () => void;
};
export const CartBar: React.FC<CartBarProps> = ({ stato, residuo, totaleOrdine, companyList, companyActived, checkAdminDev,
    ifFromGroup, elementSelected, FBAlreadyInRequest, ChangeSendPanelStatus }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;
    const { isOpen, index: tourIndex } = useTour();
    const lockInteractions =
        (isOpen && checkAdminDev && tourIndex === 17) ||
        (isOpen && !checkAdminDev && tourIndex === 13);



    return <Fade in={true} timeout={1500}><Grid item xs={12} md={12} lg={12} mb={1}>
        <Card sx={{ pl: 2, pr: 2, pt: 1, pb: 1 }} data-tour="sblocco-total">
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
            <Stack direction='row' gap={1} alignItems='center' justifyContent='space-between'
                sx={{ width: '100%', minHeight: 50, height: '100%', }}>
                <Stack direction='row' alignItems='center' gap={1}>
                    {!checkAdminDev && <React.Fragment><MDTypography variant='body2'>
                        FB Selezionati: {elementSelected}
                    </MDTypography>
                        <Divider orientation='vertical' sx={{ backgroundColor: '#000', height: 45 }} /></React.Fragment>}

                    <Stack direction='row' alignItems='center'>
                        {icon_saveMoney({ width: 35, height: 35 })}
                        <Stack alignItems='center'>
                            <MDTypography variant='body2' sx={{ fontSize: '0.7rem' }}>Fido Residuo {companyList[companyActived]}</MDTypography>
                            <MDTypography variant='h5'>{NumberToEuro({ convert: (residuo - totaleOrdine) })}</MDTypography>
                        </Stack>
                    </Stack>

                </Stack>


                <Stack direction='row' alignItems='center' gap={1}>
                    {icon_cart({ width: 35, height: 35 })}
                    <Stack alignItems='center'>
                        <MDTypography variant='body2' sx={{ fontSize: '0.7rem' }}>Ordine Totale</MDTypography>
                        <MDTypography variant='h5'>{NumberToEuro({ convert: totaleOrdine })}</MDTypography>
                    </Stack>

                    {!ifFromGroup && <React.Fragment>
                        <Divider orientation='vertical' sx={{ backgroundColor: `${darkMode ? palette.grey[500] : palette.black.main}`, height: 45, }} />
                        {(stato === 0 || !stato) ?
                            !FBAlreadyInRequest ?
                                <MDButton color='secondary' variant='contained' sx={{ color: '#fff' }} disabled={lockInteractions} onClick={() => ChangeSendPanelStatus()}>
                                    {checkAdminDev ? "Gestisci" : "Richiedi"} Sblocco
                                </MDButton>
                                : <Stack alignItems='center'>
                                    <MDTypography variant='body2' sx={{ fontSize: '0.7rem', fontWeight: 600 }}>STATO</MDTypography>
                                    <Tag text="Richiesta già in Elaborazione." fontSize='0.8rem' />
                                </Stack>
                            : <Stack alignItems='center'>
                                <MDTypography variant='body2' sx={{ fontSize: '0.7rem', fontWeight: 600 }}>STATO</MDTypography>
                                <Tag text={statusList[stato]} fontSize='0.8rem' />
                            </Stack>}
                    </React.Fragment>
                    }
                </Stack>

            </Stack>
        </Card>
    </Grid>
    </Fade>
};