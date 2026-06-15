//@MUI Components
import { Stack, Fade, Tooltip } from '@mui/material'

//internal Components
import MDTypography from "components/MDTypography";

// themes
import { MainTheme } from 'assets/settingsTheme';
import { icon_chrono, icon_forum, icon_time } from 'config/icons';
import { useGeneralDataContext } from 'context/GeneralDataContext';
import { ConvertToItalianDate } from 'utils/italianDate';
import FDBox from 'components/UI/box/FDBox';

import ConvertModule from "classes/convert.js";
import { useNexTheme } from '@nex/theme-system';
import FDIconButton from 'components/UI/buttons/FDIconButton';
const Convert = new ConvertModule();


/**
 * componente funzionale di struttura del singolo box elemento.
 * @param index in input l'index della posizione del'oggetto nel 'array
 * @param elmDetails la proprietà .dettails all'interno del'oggetto selezionato
 * @param elm fa riferimento all'interno oggetto selezionato.
 * @param rowSelected stato di mantenimento del'index attualmente attivo (in selezione)
 * @param StringAvatar funzione di conversione del nome in colore e iniziali per componenti Avatar
 * @param ChangeItemChrono set State il cui scopo è salvare la chrono dell'elemento che si sta per vedere
 */
export function ItemBoxStyled({ index, elmDetails, elm, rowSelected,
    genColorForRequestStatus, listOfRequestStatus, ChangeItemChrono, CreateChat, openOverview, lockCrono, lockChatCard, lockOverviewOpen }) {
    const { openChat } = useGeneralDataContext();

    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;
    if (elmDetails == undefined) { console.error('Sembra che elmDetails in rowStyled sia undefined.'); return; }
    const { dark } = palette;


    return (
        <Fade in={true}>
            <FDBox variant={rowSelected == index ? "soft" : "solid"} className='!cursor-pointer' data-tour="gest-card"
                color={rowSelected == index ? "warning" : "light"} onClick={() => { if (!lockOverviewOpen) openOverview(index); }}
                style={{ display: 'flex', width: '100%', borderRadius: 20, padding: 15, justifyContent: "flex-start", gap: 10 }}
            >
                <span style={{ height: '100%', backgroundColor: darkMode ? palette.grey[900] : palette.grey[400], width: 7, borderRadius: 8 }}></span>
                <Stack direction='row' width='100%' height='100%' gap={2} flexWrap='wrap' alignItems='center'>
                    <Stack gap={2} alignItems='flex-start' flex={40}>
                        <Stack direction='row' gap={2} alignItems='center' width='100%'>
                            <Stack gap={1} alignItems='center' data-tour="crono-change-status">
                                <FDIconButton icon={icon_chrono({ color: palette.white, width: 25, height: 25 })} disabled={lockCrono} onClick={() => ChangeItemChrono(elm)}
                                    sx={{ width: 'fit-content' }}
                                    data-tooltip-id='general-fido-tooltip'
                                    data-tooltip-content='Cronologia cambiamento di stati' />

                                {([2, 3].includes(elm.Stato) && elm.messageExist) && 
                                    <FDIconButton
                                        icon={<>
                                            {icon_forum({ color: palette.white, width: 20, height: 20 })}
                                            {icon_chrono({ color: palette.white, width: 20, height: 20 })}
                                        </>}
                                        disabled={lockChatCard} 
                                        onClick={() => CreateChat({ item: elm })}
                                        data-tooltip-id='general-fido-tooltip'
                                        data-tooltip-content='Vedi la chat avvenuta per la richiesta' />}
                            </Stack>

                            <Stack alignItems='flex-start' width='100%'>
                                <MDTypography component="h3" sx={rowSelected != index ? {
                                    color: `${darkMode ? palette.grey[500] : "#6977ac"}`
                                }
                                    : { color: dark.main }
                                }
                                    style={{ fontWeight: 600, fontSize: 'min(calc(0.5rem + 0.5vw), 45px)', textAlign: "left", }}>
                                    {elmDetails.Azienda.Nome}
                                </MDTypography>
                                <MDTypography component="h3" sx={{
                                    backgroundColor: genColorForRequestStatus(listOfRequestStatus[elm.Stato]),
                                    color: genColorForRequestStatus(listOfRequestStatus[elm.Stato]),
                                    fontSize: 'min(calc(0.5vw + 0.5vh), 13px)', padding: 0.5, pl: 1, pr: 1,
                                    fontWeight: 600, borderRadius: 3
                                }}>
                                    {listOfRequestStatus[elm.Stato]}
                                </MDTypography>

                            </Stack>
                        </Stack>
                    </Stack>

                    <Stack alignItems='flex-start' ml={1} flex={40} style={{ fontSize: 'min(calc(0.5rem + 0.5vw), 45px)' }}
                        sx={rowSelected != index ? { color: "#959595", fontWeight: 300 } : { color: '#05314e' }}>
                        {elmDetails.Azienda?.codiceCliente && <Stack alignItems='flex-start'>
                            {(elmDetails.Azienda?.codiceCliente || elmDetails.Azienda?.codiceClienteIOT) &&
                                <MDTypography component="h3" style={{ color: 'inherit', fontWeight: 'inherit', fontSize: 'inherit', }}>
                                    {"Cod. Cliente: " + elmDetails.Azienda?.codiceCliente}
                                </MDTypography>}
                            {elmDetails.Azienda?.codiceClienteIOT && <MDTypography component="h3" style={{ color: 'inherit', fontWeight: 'inherit', fontSize: 'inherit', }}>
                                {"Cod. Cliente IOT: " + elmDetails.Azienda?.codiceClienteIOT}
                            </MDTypography>}
                        </Stack>}
                        <Stack direction='row' gap={1} alignItems='center'>
                            {icon_time({ width: 20, height: 20, color: 'inherit' })}
                            <MDTypography component="h3" style={{ color: 'inherit', fontWeight: 'inherit', fontSize: 'inherit' }}>
                                {ConvertToItalianDate(elmDetails.DataRichiesta, { time: true })}
                            </MDTypography>
                        </Stack>
                    </Stack>

                    <Stack alignItems='flex-start' ml='auto' direction='row' gap={5} flex={20}>
                        <Stack alignItems='flex-start'>
                            <MDTypography component="h3" sx={{ color: `${darkMode ? palette.grey[500] : "#6977ac"}` }}
                                style={{ fontWeight: 300, fontSize: '0.89rem', }}>
                                fido richiesto
                            </MDTypography>
                            <MDTypography component="h3" sx={{ color: `${darkMode ? palette.grey[500] : "#6977ac"}` }}
                                style={{ fontWeight: 500, fontSize: '1.7rem', marginTop: '-10px' }}>
                                {Convert.euro(elmDetails.FidoRichiesto).Data}
                            </MDTypography>
                        </Stack>
                        <Tooltip title='Valutazione Rating'>
                            <MDTypography component="span"
                                sx={{
                                    ml: 'auto',
                                    backgroundColor: `${darkMode ? '#2125299e' : palette.grey[300]}`, padding: 1,
                                    minWidth: 50, color: `${darkMode ? palette.grey[500] : "#6977ac"}`,
                                    borderRadius: '50%', fontWeight: 600
                                }}
                                className='flex justify-center items-center'
                            >
                                {elm.VotoRaiting}
                            </MDTypography>
                        </Tooltip>
                    </Stack>
                </Stack>
            </FDBox>
        </Fade>
    )
};