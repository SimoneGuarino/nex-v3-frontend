import React from 'react';
import { Card, Divider, Grid, Grow, Stack, Typography } from '@mui/material';
import { NumberToEuro } from 'utils/numberToEuro';
import { Tag } from 'components/Tag/Tag';
import theme from 'assets/theme';
import { icon_TrendingDown, icon_TrendingUp } from 'config/icons';
import { MainTheme } from 'assets/settingsTheme';
import MDTypography from 'components/MDTypography';
import { useNexTheme } from '@nex/theme-system';



interface BlocksProps {
    year: string;
    amount: number;
    percent: number | null;
    companyActived: string;
    insoluti: number;
}
const Blocks: React.FC<BlocksProps> = ({ year, percent, insoluti, amount, companyActived }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;


    return <Card elevation={1} sx={{ width: '33.3%', minWidth: 400 }}><Stack p={2} gap={2}
        sx={{
            height: '100%', background: `linear-gradient(17deg, ${darkMode ? palette.grey[900] : palette.white.main} 33%, 
        ${darkMode ? "rgb(194 231 255 / 13%)" : "rgb(194 231 255 / 38%)"} 50%)`
        }}>
        <Stack direction='row'>
            <Tag text={"Fatturato " + year} fontSize='0.8rem' color={palette.primary.main} textColor='#fff' />
            {percent && <Tag text={Math.round(percent) + "%"}
                icon={percent > 0 ? icon_TrendingUp({ width: 25, height: 25, color: '#fff' }) : icon_TrendingDown({ width: 25, height: 25, color: '#fff' })}
                fontSize='0.8rem' color={percent > 0 ? theme.palette.success.light : theme.palette.error.light} sx={{ ml: 'auto' }} textColor='#fff' />}
        </Stack>

        <Typography variant='h4' sx={{ fontWeight: 500 }}>{NumberToEuro({ convert: amount })}</Typography>
        <Stack mt='auto'>
            <Stack direction='row' width='100%' justifyContent='space-between'>
                <MDTypography component="span"
                    sx={{ textTransform: 'uppercase', fontWeight: '500', fontSize: '0.76rem' }}>
                    Insoluti
                </MDTypography>
                <MDTypography component="span" fontSize='0.8rem'>
                    {insoluti || insoluti == 0
                        ? insoluti : "Valore non presente"}
                </MDTypography>
            </Stack>

            <Divider sx={{ m: 1, backgroundColor: `${darkMode ? palette.grey[500] : palette.black.main}`, }} />

            <MDTypography variant='body2' sx={{ fontWeight: 500, }}>{companyActived}</MDTypography>
            <MDTypography variant='body2' sx={{ fontSize: '0.66rem', mt: 'auto' }}>
                {year === "2024" ?
                    `Fatturato del ${new Date().getFullYear()} del cliente ${companyActived}, in rapporto con il fatturato del periodo precedente al ${new Date().toLocaleDateString()}`
                    : `Fatturato Fatturato del ${year} del cliente ${companyActived}.`}</MDTypography>
        </Stack>
    </Stack></Card>
};



interface FatturatiPorps {
    data: any;
    companyActived: any;
    companyList: string[];
};
export const Fatturati: React.FC<FatturatiPorps> = ({ data, companyActived, companyList }) => {
    const GenerateBlocks = () => {
        const return_ = [];
        for (const key in data) {
            const ammount = data[key];

            if (key.toLowerCase() !== 'annoprecedente' && !key.toLowerCase().includes("insoluti")) {
                let percent = null;
                let fatturatoPrev;
                const findIndex = Object.keys(data).findIndex((e: string) => e == key);

                if (findIndex !== -1 && findIndex > 0) {
                    if (key !== new Date().getFullYear().toString()) {
                        fatturatoPrev = data[Object.keys(data)[findIndex - 1]];
                    } else {
                        fatturatoPrev = data.annoPrecedente;
                    };

                    if (fatturatoPrev && fatturatoPrev !== 0) {
                        percent = ((ammount - fatturatoPrev) / fatturatoPrev) * 100;
                    };
                }

                return_.push(<Blocks key={key} percent={percent} insoluti={data[key + "Insoluti"]} year={key}
                    amount={ammount} companyActived={companyList[companyActived]} />)
            }
        }
        return <Stack gap={1} direction='row' width='100%'>{return_}</Stack>;
    };

    return <Grow in={true} style={{ transformOrigin: '0 0 0' }}{...{ timeout: 3000 }}>
        <Grid item xs={12} md={12} lg={12}>
            <Card data-tour="sblocco-fatturato">
                <Stack direction='row' overflow='auto'
                    sx={{ height: '100%', minHeight: 200, width: '100%', borderRadius: 5 }}>
                    {GenerateBlocks()}
                </Stack></Card>
        </Grid>
    </Grow>
};