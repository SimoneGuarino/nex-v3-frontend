import React from 'react';

import { Card, Divider, Grid, Grow, Stack } from '@mui/material';
import { icon_people, icon_saveMoney } from 'config/icons';
import { NumberToEuro } from 'utils/numberToEuro';
import ProgressCharts from 'examples/Charts/ProgressCharts';
import MDTypography from 'components/MDTypography';
import { MainTheme } from 'assets/settingsTheme';
import { useNexTheme } from '@nex/theme-system';


interface FidoDetailsProps {
    totale: number;
    residuo: number;
    companyActived: any;
    companyList: string[];
};
export const Fido: React.FC<FidoDetailsProps> = ({ totale, residuo, companyList, companyActived }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    return <Grow
        in={true}
        style={{ transformOrigin: '0 0 0' }}
        {...{ timeout: 2000 }}><Grid item xs={12} md={6} lg={6}>
            <Card sx={{ width: '100%', height: '100%' }} data-tour="sblocco-fido-att">
                <Stack sx={{ width: '100%', height: '100%', minHeight: 200, borderRadius: 5, p: 2 }}>
                    <Stack direction='row' alignItems='center' gap={1}>
                        {icon_people({ width: 30, height: 30 })}
                        <MDTypography variant='h5'>Fido Attuale {companyList[companyActived]}</MDTypography>
                    </Stack>
                    <Divider sx={{ backgroundColor: '#000' }} />
                    <Stack direction='row' gap={2} alignItems='center' justifyContent='center'>
                        <ProgressCharts label='' percent={((residuo / totale) * 100)} icon={icon_saveMoney()} />
                        <Stack alignItems='flex-end'>
                            <MDTypography variant='h1' sx={{ fontWeight: 500 }}>{NumberToEuro({ convert: residuo })}</MDTypography>
                            <MDTypography variant='body2'>di {NumberToEuro({ convert: totale })}</MDTypography>
                        </Stack>
                    </Stack>
                    <MDTypography variant='body2' sx={{ fontSize: '0.75rem', mt: 'auto', color: `${darkMode ? palette.grey[400] : palette.grey[600]}` }}>Il valore presente specifica il fido residuo, valore messo a
                        paragone con il fido totale in modo tale da avere chiarezza generale della situazione del cliente</MDTypography>
                </Stack>
            </Card>
        </Grid>
    </Grow>
};