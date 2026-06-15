import React from 'react';

// @external components
import { Checkbox, Divider, Fade, FormControl, InputAdornment, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

// @internal components
import MDTypography from 'components/MDTypography';
import { icon_close, icon_delete, icon_eurSymbol, icon_percent, icon_saveMoney } from 'config/icons';
import { icon_save } from 'config/icons';
import { icon_multiFunction } from 'config/icons';
import { CheckAdminPermissions } from 'utils/checkAdminPermissions';
import { MainTheme } from 'assets/settingsTheme';
import { useNexTheme } from '@nex/theme-system';
import FDIconButton from 'components/UI/buttons/FDIconButton';


export function ActionsBar({ selectedFile, MakeEmptySelection, numFileSelected,
Temp_HandleChange, temp_param, SetParamOnBlock, DelContributionOnBlock,
ribassoVisibility, ChangeRIBVisibility, marginVisibility, ChangeMARGVisibility, ChangeRibassoType__temp,
contributionsList, setTemp_param, userContext, buyerTarget}) {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;
    const { trasparent } = palette;
    
    const genIconButton = React.useCallback((tooltip_content, type, icon, func, status, sx) => {
        let elmToReturn;
        switch (type) {
            case 'IconButton':
                elmToReturn = <FDIconButton
                    data-tooltip-id="general-compare-tooltip"
                    data-tooltip-content={tooltip_content}
                    onClick={func} sx={{ ...sx }}
                    icon={icon} />
                break;
            case 'LoadingButton':
                elmToReturn = <LoadingButton sx={{ padding: 0, width: 25, height: 25, minWidth: 25, color: '#666b72' }}
                    loading={status}
                    data-tooltip-id="general-compare-tooltip"
                    data-tooltip-content={tooltip_content}
                    onClick={func}>
                    <span style={{ width: 'inherit', height: 'inherit' }}>{icon}</span>
                </LoadingButton>
                break;
        }
        return elmToReturn;
    }, [marginVisibility, selectedFile, temp_param]);
    
    const CheckAdmin = CheckAdminPermissions({userRole: userContext.details.ruolo, 
        permissions: userContext.details.permissions, panelToCheck: 'contribuzione', where: 0});


    return <Fade in={selectedFile.length > 0}>
        <Stack direction='row' sx={selectedFile.length > 0 ? { display: 'flex' } : { display: 'none' }}
            style={{ backgroundColor: palette.primary.light, padding: '2px 20px', borderRadius: 15, flexWrap: "wrap" }}
            alignItems='center'>
            <Stack direction='row'>
                {genIconButton('annulla selezione', 'IconButton', icon_close({ color: `${darkMode ? palette.white.main : ""}`}), () => MakeEmptySelection())}
                {genIconButton('salva i cambiamenti', 'IconButton', icon_save({ color: `${darkMode ? palette.white.main : ""}`}), () => SetParamOnBlock(temp_param))}
            </Stack>

            <Divider orientation='vertical' sx={{ height: 60, width: "1px" }} />

            {(!CheckAdmin || (CheckAdmin && buyerTarget)) && <React.Fragment><Stack direction='row' alignItems='center' gap={1}>
                {genIconButton('Cancella Contribuzione dai blocchi selezionati', 'IconButton',
                    <React.Fragment>{icon_saveMoney()}{icon_delete()}</React.Fragment>, () => DelContributionOnBlock(), null,
                    { height: 'fit-content', borderRadius: 2 })}

                <FormControl sx={{ minWidth: 130, minHeight: 50 }}>
                    <InputLabel id="contribution-select-label">Contribuzione Focelda</InputLabel>
                    <Select
                        labelId="contribution-select-label"
                        label="Contribution"
                        value={temp_param.contribution}
                        onChange={e => setTemp_param(prev => {return {...prev, contribution: e.target.value}})}
                        sx={{ height: 45 }}
                    >
                        <MenuItem value="">
                            <em>None</em>
                        </MenuItem>
                        {contributionsList.map((data, index) => (
                            <MenuItem value={index}>{data.codRaggruppamento}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Stack>
            <Divider orientation='vertical' sx={{ height: 60, width: "1px" }} /></React.Fragment>}

            <Stack direction='row'>
                <Checkbox checked={marginVisibility} onChange={() => ChangeMARGVisibility()} color="secondary" sx={{ padding: 0 }} />
                <TextField
                    disabled={!marginVisibility}
                    label={<MDTypography variant='p'>Margine</MDTypography>}                    
                    value={temp_param.margin}
                    onChange={(e) => Temp_HandleChange(e, 'margin')}
                    id="outlined-start-adornment"
                    style={!marginVisibility ? {backgroundColor: `${darkMode ? palette.grey[700] : palette.grey[400]}`, 
                    borderRadius: 9, opacity: 0.8} : {}}
                    sx={{ m: 1, width: '10ch', color: '#fff' }}
                    InputProps={{
                        startAdornment: <InputAdornment position="start">{icon_percent({ width: 20, height: 20})}</InputAdornment>,
                    }}
                />
            </Stack>

            <Divider orientation='vertical' sx={{ height: 60, width: "1px" }} />

            <Stack direction='row'>
                <Checkbox checked={ribassoVisibility} onChange={() => ChangeRIBVisibility()} color="secondary" sx={{ padding: 0 }} />
                <TextField
                    disabled={!ribassoVisibility}
                    label={<MDTypography variant='p'><span data-tooltip-id="general-compare-tooltip"
                        data-tooltip-content='Questo elemento ha funzionalità multiple'>{icon_multiFunction({ color: `${darkMode ? "white" : 'black'}`})}</span>
                        Ribasso</MDTypography>}
                    id="outlined-start-adornment"
                    value={temp_param.ribasso}
                    onChange={(e) => Temp_HandleChange(e, 'ribasso')}
                    sx={{ m: 1, width: '15ch' }}
                    style={!ribassoVisibility ? {backgroundColor: `${darkMode ? palette.grey[700] : palette.grey[400]}`, 
                    borderRadius: 9, opacity: 0.8} : {}}
                    InputProps={{
                        startAdornment: <Stack direction='row' sx={{ borderRight: '1px solid #ccc' }}>
                            <InputAdornment onClick={() => ChangeRibassoType__temp()} className='transition-all-css'
                            sx={{ cursor: 'pointer', width: '100%', height: '100%',
                                backgroundColor: `${!temp_param.ribasso_type ? palette.primary.dark : trasparent}`, p: 0.5, borderRadius: 1 }}
                            position="start">
                                {icon_percent({ width: 15, height: 15, color: `${!temp_param.ribasso_type ? palette.white.main : palette.primary.dark}`})}</InputAdornment>
                            <InputAdornment onClick={() => ChangeRibassoType__temp()} className='transition-all-css'
                            sx={{ cursor: 'pointer', width: '100%', height: '100%',
                                backgroundColor: `${temp_param.ribasso_type ? palette.primary.dark : trasparent}`, p: 0.5, borderRadius: 1 }}
                            position="start">{icon_eurSymbol({ width: 15, height: 15, color: `${temp_param.ribasso_type ? palette.white.main : palette.primary.dark}` })}</InputAdornment>
                        </Stack>,
                    }}
                />
            </Stack>

            <MDTypography component="p" style={{
                fontWeight: "normal", marginLeft: 'auto',
                fontSize: "0.7em", fontWeight: 400
            }}>
                elementi selezionati: {numFileSelected}</MDTypography>
        </Stack>
    </Fade>
}