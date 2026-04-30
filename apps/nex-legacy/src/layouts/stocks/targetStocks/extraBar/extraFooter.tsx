import React from "react";

import { Box, Divider, Grid, Stack } from "@mui/material"
import { MainTheme } from "assets/settingsTheme";
import MDTypography from "components/MDTypography";
import { NumberToEuro } from "utils/numberToEuro";
import { useNexTheme } from "@nex/theme-system";


interface ExtraFooterProps {
    data: Array<object>;
};

export const ExtraFooter: React.FC<ExtraFooterProps> = ({ data }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;


    const GenereteTotals = () => {
        if(!data || data && data.length === 0){ return };
        const propToTake = [
            {name: 'Fatturato Canali', keyProp: 'fatturatoTrimestreAttualeNew'},
            {name: 'Fatturato Canali Prec.', keyProp: 'fatturatoTrimestrePrecedenteNew'},
            {name: 'Fatturato Trimestre', keyProp: 'fatturatoTrimestreAttuale'},
            {name: 'Fatturato Trimestre Prec.', keyProp: 'fatturatoTrimestrePrecedente'},
            {name: 'Stock', keyProp: 'stock'},
            {name: 'Backorder', keyProp: 'backorder'},
        ];
        let ret_: any = [];

    
        for (let i = 0; i < propToTake.length; i++) {
            const name = propToTake[i].name;
            const prop = propToTake[i].keyProp;
            const sum = data.reduce((max: number, item: any) => item[prop] ? parseFloat(item[prop]) + max : max, 0);
            
            ret_.push(<React.Fragment key={i}>
                <Stack ml='auto' alignItems='center' gap={1}>
                    <MDTypography component='span' sx={{
                        fontSize: '0.7rem', backgroundColor: `${darkMode ? palette.grey[800] : palette.grey[300]}`,
                        fontWeight: 700, borderRadius: 2, padding: 0.5
                    }}>
                        {name}
                    </MDTypography>
                    <MDTypography component='span' fontSize="1rem">
                        {NumberToEuro({ convert: sum })}
                    </MDTypography>
                </Stack>
                {propToTake.length !== (i + 1) && 
                    <Divider orientation="vertical" sx={{ backgroundColor: `${darkMode ? palette.grey[300] : palette.grey[800]}`}}/>}
            </React.Fragment>)
        }

        return <Stack direction='row' ml='auto' alignItems='center' gap={1}>{ret_}</Stack>
    }



    return <Box component="div"  pt={2} translate="no">
        <Grid container spacing={6}>
            <Grid item xs={12}>
                <Box component="div"  mt={-3} pt={3} px={2} display="flex" alignItems="center" flexWrap="wrap">
                    <Box component="div"  display="flex" paddingBottom="10px" width="100%"  sx={{overflow: 'auto', gap: 5}}>
                        <MDTypography variant="h3"> Totali </MDTypography>
                        {GenereteTotals()}
                    </Box>
                </Box>
            </Grid>
        </Grid>
    </Box>
}