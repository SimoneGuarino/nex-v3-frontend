import { memo } from 'react';

import Stack from '@mui/material/Stack';
import MDTypography from "components/MDTypography";

import SettingsTable from './settingsTable';
import MinLoader from 'minLoader';
import { Skeleton } from '@mui/material';
import theme from 'assets/theme';
import { useNexTheme } from '@nex/theme-system';

function FooterTable (props) {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";

    const { data } = props;
    const { resultsMax, currentResultsLoad, columns, visibleColumns, toggleColumnVisibility, setAllColumnsVisibility } = props;
    const { impTableStatus, setImpTableStatus, infinteScrollAnim } = props;

    
    return (
        <Stack direction='row' p={1} alignItems='center' mt='auto' className='mt-auto'
        borderTop={`1px solid ${darkMode ? theme.palette.grey[800] : '#ccc'}`}>
            <Stack direction='row' gap={3} sx={{marginLeft: 'auto', alignItems:'center'}} >
                {infinteScrollAnim && <MinLoader color='#ccc' width='auto' sx={{margin: '0 !important'}} />}
                {(data && Array.isArray(data) && data.length !== 0) && ((resultsMax !== 0 && resultsMax !== undefined) ? 
                    <MDTypography variant="p" sx={{ fontSize: '0.7em'}}>
                        {currentResultsLoad} di {resultsMax}
                    </MDTypography>
                : <Skeleton width={60}/>)}
                <SettingsTable 
                    columns={columns} 
                    visibleColumns={visibleColumns} 
                    toggleColumnVisibility={toggleColumnVisibility}
                    impTableStatus={impTableStatus}
                    setImpTableStatus={setImpTableStatus}
                    setAllColumnsVisibility={setAllColumnsVisibility}
                />            
            </Stack>
        </Stack>
    )
}

export default memo(FooterTable);