import React from 'react';

import {
    Card, CardContent, CardActions,
    Stack, Checkbox,
    TextField,
} from '@mui/material';

import ConvertModule from 'classes/convert';
import { icon_TrendingUp, icon_TrendingDown, icon_multiFunction, icon_info } from 'config/icons';
import { icon_edit } from 'config/icons';
import { icon_megaphone } from 'config/icons';
import { icon_save } from 'config/icons';
import { icon_firstPlace } from 'config/icons';
import { NumberToEuro } from 'utils/numberToEuro';
import MDTypography from 'components/MDTypography';
import { MainTheme } from 'assets/settingsTheme';
import { Tag } from 'components/Tag/Tag';
import { useNexTheme } from '@nex/theme-system';

const Convert = new ConvertModule();

export function TableViewCard({ index, elm, setData, key_prop, handleClick, selectedFile, PickLowest,
checked, ChangeCheckedBlock, advicedPrice, Contribuzione, HandleProductExpandedDist, ChangeDetailsDistPanelVisibility,
ReduceEuroContributions, setContribution_selected }) {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const [editPriceMode, setEditPriceMode] = React.useState(false);
    const [advicedPriceText__, setAdvicedPriceText__] = React.useState(null);
    const HandleAdvicedPriceText = (e) => setAdvicedPriceText__(e.target.value);
    const HandleEditPriceMode = () => {
        //saveMode
        if (editPriceMode) {
            if ((elm.advisedPrice !== advicedPriceText__) && advicedPriceText__) {
                setData(prev => {
                    const copy = [...prev];
                    copy[index].advisedPrice = advicedPriceText__;
                    copy[index].APSettedBy = 'Human';
                    const obj_ = {
                        ...copy[index],
                        advisedPrice: parseFloat(advicedPriceText__),
                        APSettedBy: 'Human',
                    };
                    const contr_ = Contribuzione([obj_], true, null, { saveOnSetData: false, overwriteSave: true, usePrice: true });
                    copy[index].contributed = contr_[0].contributed;
                    //aggiorna il tot della contribuzione utilizzata per quanto riguarda la contribuzione personale se è presente.
                    ReduceEuroContributions(copy, setContribution_selected);
                    return copy;
                });
            }
            setAdvicedPriceText__(null);
        };
        setEditPriceMode(!editPriceMode)
    };

    const handleExpandClick = (whatLoad, distributorsCall) => {
        HandleProductExpandedDist(whatLoad, distributorsCall);
        ChangeDetailsDistPanelVisibility();
    };

    const FocIsLower = Boolean(PickLowest((elm.Prezzo || 0),
        (elm.PrezzoListino || 0)) < PickLowest((elm.Fornitori[advicedPrice.from]?.Prezzo || 0),
            (elm.Fornitori[advicedPrice.from]?.PrezzoListino || 0)));

            
    return (
        <Card key={key_prop} id={`fido-status-card-${index}`} className='css-height-width-100'
            style={{ flexDirection: 'column', alignItems: 'center', cursor: 'pointer',
                transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',}}
            sx={selectedFile.includes(index) ? { backgroundColor: `${darkMode ? palette.primary.dark : palette.primary.main}` }
            : { backgroundColor: `${darkMode ? '#1c1c1c' : ''}`,
            '&:hover': { backgroundColor: `${darkMode ? palette.grey[800] : palette.grey[300]}` } }}
            onClick={(e) => handleClick(e, index)}
        >
            <Stack direction='row' alignItems='center' width='inherit' className='css-height-width-100'>
                <Stack p={2} flex='33%' className='css-height-width-100'>
                    <Stack direction='row' gap={1} justifyContent='space-between'>
                        <Stack direction='row' alignItems='center' gap={1}>
                            <Checkbox sx={{ p: 0 }} checked={checked} color='secondary'
                                onClick={(() => ChangeCheckedBlock())} />
                        </Stack>

                        <MDTypography variant="title"  
                            sx={{ fontSize: "1.1rem", fontWeight: 'bold' }}>
                            {elm.CodiceProduttore}
                        </MDTypography>
                    </Stack>

                    <Stack direction='row'>
                        {elm.Promo && <Tag text={`In Promo | ${elm.CodicePromo}`} icon={icon_megaphone({ width: 20, height: 20})}
                            data_tooltip_id='general-compare-tooltip' 
                            data_tooltip_content={`Questo prodotto attualmente si trova in Promo. || ${elm.CodicePromo}`}/>}
                        <MDTypography variant="body2"  
                            data-tooltip-id="general-compare-tooltip"
                            data-tooltip-content='Marca'
                            sx={{ fontSize: '0.75rem', fontWeight: 500, marginLeft: 'auto' }}>
                            {elm.Marca}
                        </MDTypography>
                    </Stack>

                    <Stack mt='auto'>
                        <MDTypography variant="body2"
                            data-tooltip-id="general-compare-tooltip"
                            data-tooltip-content='EAN Code'
                              sx={{ fontSize: '0.8rem' }}>
                            {elm.CodiciGTIN[0]}
                        </MDTypography>

                        <MDTypography variant="body2"   sx={{ fontSize: '0.75rem' }}>
                            {elm.Descrizione.Corta}
                        </MDTypography>

                    </Stack>


                </Stack>

                <CardContent className='css-height-width-100' sx={{ padding: '0 16px', p: 2 }}>
                    <Stack direction='row' gap={2} className='css-height-width-100'>
                        <Stack className='css-height-width-100' sx={{ minWidth: 150, justifyContent: 'center' }}>

                            <Stack direction='row'>
                                <MDTypography variant="body2"  
                                    data-tooltip-id="general-compare-tooltip"
                                    data-tooltip-content='Costo Medio Gestionale' sx={{ fontSize: '0.75rem' }}>
                                    CMG
                                </MDTypography>
                                <MDTypography   sx={{
                                    fontSize: '0.9rem', fontWeight: '200',
                                    marginLeft: 'auto'
                                }}>
                                    {Convert.euro(elm.CostoMedioGestionale).Data}
                                </MDTypography>
                            </Stack>
                            <Stack direction='row'>
                                <MDTypography variant="body2"   sx={{ fontSize: '0.75rem' }}>
                                    Disponibilità
                                </MDTypography>
                                <MDTypography variant="body2"   sx={{ fontSize: '0.75rem', marginLeft: 'auto' }}>
                                    {elm.Disponibilita.Totali} pz
                                </MDTypography>
                            </Stack>

                            {(Boolean(elm.contribuzioni) && elm.contribuzioni.length > 0) &&
                                <Stack width='100%' direction='row' gap={1} alignItems='center' sx={{ fontSize: '0.75rem' }}>
                                    <MDTypography variant="body2"  
                                        sx={{ fontSize: 'inherit' }}>
                                        Contribuzione esistente</MDTypography>
                                    <Stack direction='row' gap={1} ml='auto'>
                                        {elm?.contribuzioni.map((data, index) => (
                                            <React.Fragment><MDTypography key={index} variant="body2"  
                                                sx={{ fontSize: 'inherit' }}>
                                                {NumberToEuro({ convert: data.importo })}
                                            </MDTypography>
                                                {(elm?.contribuzioni.length - 1) != index &&
                                                    <MDTypography key={index} variant="body2"  
                                                        sx={{ fontSize: 'inherit' }}>
                                                        -
                                                    </MDTypography>}
                                            </React.Fragment>
                                        ))}
                                    </Stack>
                                    <FDIconButton onClick={_ => handleExpandClick(elm.contribuzioni, false)}
                                    sx={{ borderRadius: 2, backgroundColor: `${darkMode ? palette.primary.dark : '#90d3ff87'}`,
                                    "&:hover": { backgroundColor: `${darkMode ? palette.primary.light : palette.primary.light}` }}}>
                                        {icon_multiFunction({width: 15, height: 15, color: `${darkMode ? palette.white.main : ''}` })}
                                        {icon_info({width: 15, height: 15, color: `${darkMode ? palette.white.main : ''}` })}
                                    </FDIconButton>
                                </Stack>}

                            {(Boolean(elm.margin) || Boolean(elm.ribasso) || Boolean(elm.contributed)) && <Stack sx={{ width: '100%', fontSize: '0.8rem' }}>
                                {Boolean(elm.ribasso) && <Stack direction='row'>
                                    <MDTypography   variant="body2" sx={{ fontSize: 'inherit' }}>
                                        ribasso personalizzato</MDTypography>
                                    <MDTypography   sx={{
                                        fontSize: '0.8rem', fontWeight: 'bold', marginLeft: 'auto'
                                    }}>
                                        {elm.ribasso}{elm.ribasso_type ? '€' : '%'}</MDTypography>
                                </Stack>}
                                {Boolean(elm.margin) && <Stack direction='row' >
                                    <MDTypography   variant="body2" sx={{ fontSize: 'inherit' }}>
                                        margine personalizzato</MDTypography>
                                    <MDTypography   sx={{
                                        fontSize: '0.8rem', fontWeight: 'bold', marginLeft: 'auto'
                                    }}>
                                        {elm.margin}%</MDTypography>
                                </Stack>}

                                {Boolean(elm.contributed) && <Stack direction='row' alignItems='center' gap={1} justifyContent='space-between'>
                                    <MDTypography   variant="body2" sx={{ fontSize: 'inherit' }}>
                                        Contribuzione Focelda</MDTypography>

                                    <Stack alignItems='center' direction='row' gap={1}>
                                        <MDTypography   sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                                            {elm.contributed.name}</MDTypography>
                                        -
                                        <MDTypography   sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                                            {Convert.euro(elm.contributed.euro).Data}</MDTypography>
                                    </Stack>
                                </Stack>}
                            </Stack>
                            }

                            {advicedPrice.from?.toUpperCase() != 'NESSUNO' && <Stack align-items="flex-end" alignItems='center'
                                mt='auto' sx={{ backgroundColor: `${darkMode ? palette.grey[900]: '#fff6e7'}`, borderRadius: 2, padding: 1 }}>
                                <Stack direction='row' width='100%' alignItems='center'>
                                    <MDTypography variant="body2"  
                                        sx={{ fontSize: '0.7rem', color: '#d7a01e', fontWeight: 400 }}>
                                        PREZZO CONSIGLIATO</MDTypography>
                                    <Stack direction='row' gap={1}
                                        sx={{ flexBasis: '100%', justifyContent: 'flex-end', alignItems: 'center' }}>
                                        <FDIconButton onClick={() => HandleEditPriceMode()}>
                                            {!editPriceMode ? icon_edit({ width: 17.5, height: 17.5 }) : icon_save({ width: 17.5, height: 17.5 })}
                                        </FDIconButton>

                                        {!editPriceMode ? <MDTypography   sx={{
                                            fontSize: '1rem', textAlign: 'right',
                                            fontWeight: 'bold', color: '#d7a01e'
                                        }}>
                                            {Convert.euro(elm.advisedPrice/*advicedPrice.price*/).Data}
                                            <MDTypography variant='span' data-tooltip-id="general-compare-tooltip"
                                                data-tooltip-content='Margine di guadagno se usato il prezzo consigliato'
                                                style={{ fontSize: '0.7rem', marginLeft: "10px", padding: '2px 5px', borderRadius: '10px' }}
                                                sx={advicedPrice.result ? { color: '#fff', backgroundColor: '#7fc754' } : { color: '#fff', backgroundColor: '#c76f54' }}>
                                                {advicedPrice.percent}% {advicedPrice.result ? icon_TrendingUp() : icon_TrendingDown()}</MDTypography>
                                        </MDTypography>
                                            :
                                            <TextField
                                                class='textField-editAdvicedPrice no-spin'
                                                value={advicedPriceText__}
                                                onChange={e => HandleAdvicedPriceText(e)}
                                                placeholder={advicedPrice.price}
                                                type="number"
                                                InputProps={{
                                                    startAdornment: "€",
                                                }}
                                                InputLabelProps={{
                                                    shrink: true,
                                                }}
                                                variant="filled"
                                            />}
                                    </Stack>

                                </Stack>
                                <Stack direction='row' width='100%'>
                                    <MDTypography variant="body2"  
                                        sx={{ fontSize: '0.65rem', color: '#d7a01e' }}>
                                        Fornitore con il prezzo piu basso</MDTypography>
                                    <Stack direction='row' gap={2} ml='auto'>
                                        <MDTypography   sx={{
                                            fontSize: '0.68rem',
                                            fontWeight: '400', alignSelf: 'flex-start', color: '#d7a01e'
                                        }}>
                                            {(advicedPrice.from.toLowerCase() == 'focelda' ? PickLowest((elm.Prezzo || 0),
                                                (elm.PrezzoListino || 0)) : PickLowest((elm.Fornitori[advicedPrice.from]?.Prezzo || 0),
                                                    (elm.Fornitori[advicedPrice.from]?.PrezzoListino || 0))).toFixed(2) + "€"}
                                        </MDTypography>
                                        <MDTypography   sx={{
                                            fontSize: '0.68rem',
                                            fontWeight: '400', alignSelf: 'flex-start', color: '#d7a01e'
                                        }}>
                                            {advicedPrice.from?.toUpperCase()}</MDTypography>
                                    </Stack>

                                </Stack>
                            </Stack>}

                        </Stack>

                        <Stack>
                            <Stack sx={{ minWidth: 150 }} ml='auto' alignSelf='center' alignItems="flex-end">
                                <MDTypography   variant='h3'>
                                    {Convert.euro(PickLowest(elm.Prezzo, elm.PrezzoListino)).Data}
                                </MDTypography>
                            </Stack>
                            <CardActions disableSpacing sx={{mt: 'auto', ml: 'auto'}}>
                                <FDIconButton onClick={_ => handleExpandClick(elm.Fornitori, true)}
                                    data-tooltip-id="general-compare-tooltip"
                                    data-tooltip-content='Dettagli dei Fornitori correlati'>
                                    {icon_info()}
                                </FDIconButton>
                                {FocIsLower && <span
                                    data-tooltip-id="general-compare-tooltip"
                                    data-tooltip-content='Focelda ha il prezzo piu basso rispetto agli altri fornitori'
                                    style={{ fontSize: "1.3em", display: 'flex', marginLeft: 'auto', marginRight: '8px' }}>
                                    {icon_firstPlace({
                                        color: "#dda31e",
                                        alignSelf: "center",
                                    })}
                                </span>}
                            </CardActions>
                        </Stack>

                    </Stack>
                </CardContent>
            </Stack>
        </Card>
    );
}