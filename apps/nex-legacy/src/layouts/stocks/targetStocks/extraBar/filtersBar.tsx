import { Box, Grid, IconButton, Stack } from "@mui/material"
import { useNexTheme } from "@nex/theme-system";
import { MainTheme } from "assets/settingsTheme";
import MDTypography from "components/MDTypography";
import { icon_filter, icon_update } from "config/icons";

interface FiltersBarProps {
    setFilterStatus: (prev: boolean) => void;
    RetriveDataNoFilters: () => void;
}
export const FiltersBar: React.FC<FiltersBarProps> = ({setFilterStatus, RetriveDataNoFilters }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;


    return <Box component="div"  pt={2} translate="no">
        <Grid container spacing={6}>
            <Grid item xs={12}>
                <Box component="div"  mt={-3} py={3} px={2} display="flex" alignItems="center" flexWrap="wrap">
                    <Box component="div"  display="flex" paddingBottom="10px" borderBottom={`1px solid ${darkMode ? palette.grey[700] : palette.grey[400]}`} width="100%">
                        <MDTypography variant="h3"> Obiettivi Stock </MDTypography>
                        <Stack ml='auto' direction='row' alignItems='center' gap={1}>
                            <MDTypography component='span' sx={{
                                fontSize: '0.6rem', backgroundColor: `${darkMode ? palette.grey[800] : palette.grey[300]}`,
                                fontWeight: 700, borderRadius: 2, padding: 0.5
                            }}>
                                Stock/BackOrder giorno preced.
                            </MDTypography>
                            <IconButton onClick={() => setFilterStatus(true)} aria-label="filters">
                                {icon_filter()}</IconButton>
                            <IconButton data-tooltip-id="general-obiettivi-stocks-tooltip"
                                data-tooltip-content='Reset della Tabella'
                                aria-label="update" onClick={() => RetriveDataNoFilters()}>
                                {icon_update()}</IconButton>
                        </Stack>
                    </Box>
                </Box>
            </Grid>
        </Grid>
    </Box>
}