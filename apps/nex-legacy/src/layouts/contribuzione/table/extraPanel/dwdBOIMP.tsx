import { Backdrop, Card, Divider, IconButton, Stack, TextField } from '@mui/material';
import { icon_close, icon_download, icon_info } from '../../../../config/icons';
import React from 'react';
import { PopupInfo } from '../../../../components/PopupInfo';
import MinLoader from '../../../../minLoader';
import MDTypography from 'components/MDTypography';
import { MainTheme } from 'assets/settingsTheme';
import MDButton from 'components/MDButton';
import { useNexTheme } from '@nex/theme-system';

interface DwdBOIMPProps {
    children: React.ReactNode;
    ReqDwdBOIMP: (promo: String, contributionCode: String) => void;
    ChangeBOIMPPanleVisibility: () => void;
    BOIMPPanelVisibility: boolean;
    onDownload: boolean;
    contribution_selected: any;
}

const InfoBox: React.FC = React.memo(() => {
    return <PopupInfo icon={icon_info()} title='Info sullo scaricamento del file' close={false}
        body="Gli elementi all'interno del BOIMP saranno tutti quelli attualmente selezionati." />
})


export const DwdBOIMP: React.FC<DwdBOIMPProps> = ({ ReqDwdBOIMP, BOIMPPanelVisibility, ChangeBOIMPPanleVisibility,
onDownload, contribution_selected }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const [promo, setPromo] = React.useState<String>("");
    const handlePromo = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | null): void => {
        if (!e) { return };
        const { value } = e.target;
        if (value.length <= 4) {
            setPromo(value);
        }
    };
    const [contributionCode, setContributionCode] = React.useState<String>("");
    const handleContributionCode = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | null): void => {
        if (!e) { return };
        const { value } = e.target;
        setContributionCode(value);
    };



    return (
        <Backdrop open={BOIMPPanelVisibility} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Card sx={{ width: '40%', borderRadius: 5, transition: 'all 200ms ease-in', p: 2, display: 'flex', flexDirection: 'column' }}>
                <Stack direction='row' alignItems='center' mb={2}>
                    <Stack direction='row' alignItems='center' gap={1}>
                        {icon_download({width: 25, height: 25})}
                        <MDTypography variant='h4'>
                            BOIMP
                        </MDTypography>
                    </Stack>
                    <IconButton sx={{
                        ml: 'auto', mb: 1,
                        backgroundColor: palette.error.light, "&:hover": { backgroundColor: palette.error.dark }
                    }} onClick={() => ChangeBOIMPPanleVisibility()}>
                        {icon_close({ color: palette.white.main })}
                    </IconButton>
                </Stack>

                <InfoBox />
                <Divider sx={{ width: '100%', backgroundColor: '#ccc' }} />
                <Stack sx={{ height: '100%', p: 1 }}>
                    <MDTypography sx={{ fontSize: '0.8rem', mb: 1, }}>
                        Inserisci il codice Promo in modo tale che sia presente all'interno del BOIMP. (Max 4 Caratteri)</MDTypography>
                    <TextField id="outlined-basic" value={promo} label="Codice Promo" variant="outlined" onChange={e => handlePromo(e)} />

                    {Object.keys(contribution_selected).length > 0 && <React.Fragment><MDTypography sx={{ fontSize: '0.8rem', mt: 3, mb: 1 }}>
                            Inserisci il codice della contribuzione</MDTypography>
                        <TextField id="outlined-basic" label="Codice Contribuzione" variant="outlined" onChange={e => handleContributionCode(e)} />
                    </React.Fragment>}

                    {!onDownload ? <MDButton disabled={promo == "" || promo.length !== 4 || ((contribution_selected && Object.keys(contribution_selected).length > 0) ? contributionCode == "" : false) } variant="contained" color={darkMode ? 'primary' : 'secondary'}
                        onClick={() => ReqDwdBOIMP(promo, contributionCode)}
                        sx={{ marginTop: 2 }}>
                        download
                    </MDButton> :
                        <MinLoader />}
                </Stack>
            </Card>
        </Backdrop>
    );
};