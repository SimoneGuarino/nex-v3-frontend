import React from 'react';

// @external components
import { Fade, Stack, TextField, InputAdornment, Button, Divider, Card } from '@mui/material';
import './style.css';
import Settings from '../../settingsTable'
import { icon_eurSymbol, icon_gridView, icon_percent } from 'config/icons';
import { icon_reorder } from 'config/icons';
import { icon_fileDownload } from 'config/icons';
import { icon_filter } from 'config/icons';
import theme from 'assets/theme';
import { icon_multiFunction } from 'config/icons';
import MDTypography from 'components/MDTypography';
import { icon_quantity } from 'config/icons';
import { MainTheme } from 'assets/settingsTheme';
import { useNexTheme } from '@nex/theme-system';
import FDIconButton from 'components/UI/buttons/FDIconButton';


export function ParamBar({ paramState, setParamState, distList__, visibleColumns, 
setVisibleColumns, toggleColumnVisibility,
grindView, setGrindView, ChangeBOIMPPanleVisibility,
ChangeStatusFilters, ChangeRibassoType, FilterByQuantity }) {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const { primary, trasparent } = palette;

    const HandleChange = (e, key) => {
        const filterValue = e.trim();
        const isValidInput = /^-?\d*\.?\d*$/.test(filterValue) || filterValue === 0;

        setParamState(prev => {
            return { ...prev, [key]: isValidInput ? 
                filterValue === "" ? 0 : filterValue : prev[key] }
        })
    }


    const SwtichView = React.memo(() => {
        const styleTableBtn = {
            backgroundColor: !grindView ? palette.primary.main : darkMode ? palette.grey[800] : '#fff',
            borderTopLeftRadius: 4, borderBottomLeftRadius: 4,
            '&:hover': { color: '#000', backgroundColor: !grindView ? palette.primary.dark 
                : darkMode ? palette.grey[700] : palette.grey[300] }
        };
        const styleGrindBtn = {
            backgroundColor: grindView ? palette.primary.main : darkMode ? palette.grey[800] : '#fff',
            borderRadius: 2,
            borderTopRightRadius: 3, borderBottomRightRadius: 3,
            '&:hover': { color: '#000', backgroundColor: grindView ? palette.primary.dark 
                : darkMode ? palette.grey[700] : palette.grey[300] }
        };

        return <Stack direction='row' overflow='hidden'
            sx={{ border: `1px solid ${darkMode ? palette.grey[800] : palette.grey[300]}`, height: 50, borderRadius: 3 }}>
            <Button sx={{ ...styleGrindBtn }} onClick={() => setGrindView(true)}>
                {icon_gridView({ width: 20, height: 20 })}</Button>
            <Button sx={{ ...styleTableBtn }} onClick={() => setGrindView(false)}>
                {icon_reorder({ width: 20, height: 20 })}</Button>
        </Stack>
    });



    return <Fade in={true}>
        <Card>
        <Stack direction='row'
            style={{ padding: '2px 15px', borderRadius: 15 }}
            justifyContent='flex-end' alignItems='center'>
            <Stack direction='row' mr='auto' gap={2}>
                <FDIconButton
                    icon={icon_fileDownload({ width: 30 })}
                    onClick={() => ChangeBOIMPPanleVisibility()} 
                    data-tooltip-id='general-compare-tooltip'
                    data-tooltip-content='Scarica il BOIMP in formato Excel' />
                <SwtichView />
            </Stack>

            <TextField
                label="Qnt.Min"
                value={paramState.minQuantity}
                onChange={(e) => {
                    HandleChange(e.target.value, 'minQuantity');
                }}
                onBlur={(e) => {
                    if (e.target.value == '') {
                        HandleChange(1, 'minQuantity');
                    }
                }}
                id="outlined-start-adornment"
                sx={{ m: 1, width: '8ch' }}
                InputProps={{
                    startAdornment: <InputAdornment position="start">{icon_quantity({ width: 20, height: 20 })}</InputAdornment>,
                }}
            />

            <Divider orientation='vertical' sx={{ backgroundColor: '#ccc', height: 50 }} />

            <TextField
                label="Margine"
                value={paramState.margin}
                onChange={(e) => HandleChange(e.target.value, 'margin')}
                id="outlined-start-adornment"
                sx={{ m: 1, width: '10ch' }}
                InputProps={{
                    startAdornment: <InputAdornment position="start">{icon_percent({ width: 20, height: 20})}</InputAdornment>,
                }}
            />
            <TextField
                label={<MDTypography variant='p'><span data-tooltip-id="general-compare-tooltip"
                    data-tooltip-content='Questo elemento ha funzionalità multiple'>{icon_multiFunction()}</span>
                    Ribasso</MDTypography>}
                id="outlined-start-adornment"
                value={paramState.ribasso}
                onChange={(e) => HandleChange(e.target.value, 'ribasso')}
                sx={{ m: 1, width: '15ch' }}
                InputProps={{
                    startAdornment: <Stack direction='row' sx={{ borderRight: '1px solid #ccc' }}>
                        <InputAdornment onClick={() => ChangeRibassoType()} className='transition-all-css'
                            sx={{ cursor: 'pointer', width: '100%', height: '100%',
                                backgroundColor: `${!paramState.ribasso_type ? primary.light : trasparent}`, p: 0.5, borderRadius: 1 }}
                            position="start">{icon_percent({ width: 15, height: 15,
                                color: `${!paramState.ribasso_type ? palette.white.main : theme.palette.text.main}`
                            })}</InputAdornment>
                        <InputAdornment onClick={() => ChangeRibassoType()} className='transition-all-css'
                            sx={{ cursor: 'pointer', width: '100%', height: '100%',
                                backgroundColor: `${paramState.ribasso_type ? primary.light : trasparent}`, p: 0.5, borderRadius: 1 }}
                            position="start">{icon_eurSymbol({ width: 15, height: 15,
                                color: `${paramState.ribasso_type ? palette.white.main : theme.palette.text.main}`
                            })}</InputAdornment>
                    </Stack>,
                }}
            />

            <Divider orientation='vertical' sx={{ backgroundColor: '#ccc', height: 50 }} />
            <Stack direction='row' alignItems='center' gap={1}>
                <FDIconButton icon={icon_filter({ width: 28 })} onClick={() => ChangeStatusFilters()} />
                <Settings columns={distList__} visibleColumns={visibleColumns} 
                toggleColumnVisibility={toggleColumnVisibility} setVisibleColumns={setVisibleColumns}/>
            </Stack>

        </Stack>
        </Card>
    </Fade>
}