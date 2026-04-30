import React from 'react';
import { MainTheme } from 'assets/settingsTheme';

import { Card, Grid, Grow, Stack } from '@mui/material';
import MDTypography from 'components/MDTypography';
import { Tag } from 'components/Tag/Tag';
import { icon_creditCard } from 'config/icons';
import { useNexTheme } from '@nex/theme-system';


interface BlocksProps {
    index: number;
    title: string;
    esito: string | null;
    scadenza: string;
    valore: number | null;
}
const Blocks: React.FC<BlocksProps> = ({ index, title, esito, scadenza, valore }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;


    return <Card elevation={1} key={index}
        sx={{ width: '33.3%', minWidth: 250, backgroundColor: `${darkMode ? palette.grey[900] : palette.grey[200]}` }}>
        <Stack p={2} gap={2}
            sx={{ height: '100%', }}>
            <MDTypography variant='h6'>{title.toUpperCase()}</MDTypography>
            {['esito', 'scadenza', 'valore'].map((e: string, i: number) => (
                <Stack key={i} direction='row' justifyContent='space-between'>
                    <MDTypography variant='body2' fontSize='0.8rem'>{e}</MDTypography>
                    <Tag text={eval(e) || 'Vuoto'} color={`${darkMode ? palette.grey[700] : palette.grey[300]}`} />
                </Stack>
            ))}
        </Stack>
    </Card>
};



interface TipiFidoDetailsProps {
    data: any;
    companyActived: any;
    companyList: string[];
};
export const TipiFido: React.FC<TipiFidoDetailsProps> = ({ data, companyActived, companyList }) => {
    return <Grow
        in={true}
        style={{ transformOrigin: '0 0 0' }}
        {...{ timeout: 2000 }}><Grid item xs={12} md={12} lg={12}>
            <Card sx={{ width: '100%', height: '100%', p: 1 }} data-tour="sblocco-fido">
                <Stack direction='row' gap={0.5} alignItems='center' ml={1}>
                    {icon_creditCard({ width: 30, height: 30 })}
                    <MDTypography variant='h3'>Fido</MDTypography>
                </Stack>
                <Stack direction='row' overflow='auto' gap={2} p={1}
                    sx={{ height: '100%', minHeight: 150, width: '100%', borderRadius: 5 }}>
                    {data && Object.keys(data).map((key: any, index: number) => (
                        <Blocks key={index} index={index} title={key} esito={data[key].esito} scadenza={data[key].scadenza} valore={data[key].valore} />
                    ))}
                </Stack>
            </Card>
        </Grid>
    </Grow>
};