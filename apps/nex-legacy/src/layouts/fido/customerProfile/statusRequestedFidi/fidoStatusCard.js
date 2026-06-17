import React, { Fragment } from 'react';

import { styled } from '@mui/material/styles';
import {
    Card, CardHeader, CardContent, CardActions,
    Collapse, Avatar, IconButton, Stack, Divider
} from '@mui/material';

import { red } from '@mui/material/colors';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { SplitCammelCase } from 'utils';
import { listOfRequestStatus, GenStatusColor } from 'layouts/fido/status';
import MDTypography from 'components/MDTypography';

import ConvertModule from 'classes/convert';
import { MainTheme } from 'assets/settingsTheme';
import { icon_chat, icon_note } from 'config/icons';
import { StringToHTML } from 'utils/stringToHTML';
import { useNexTheme } from '@nex/theme-system';
import { FDIconButton } from "@nex/fd-ui";
const Convert = new ConvertModule();

const paragraph_secondary_css = {
    fontSize: '0.8rem'
};
const paragraph_main_css = {
    fontSize: '1rem'
};


const ExpandMore = styled((props) => {
    const { expand, ...other } = props;
    return <IconButton {...other} />;
})(({ theme, expand }) => ({
    transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
        duration: theme.transitions.duration.shortest,
    }),
}));

function FidoStatusCard({ index, elm, key_prop, CreateChat }) {
    const [expanded, setExpanded] = React.useState(false);
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;


    const handleExpandClick = () => {
        setExpanded(!expanded);
    };


    /**
     * Funzione che genera l'oggetto in maniera styled, tenendo conto delle varie proprietà array/oggetto
     * innestate nei vari oggetti.
     * @returns array di TAG definiti per la visualizzazione in maniera 
     * strutturata/styled delle proprietà oggetto.
     */
    const Gen_Expand = React.memo(() => {
        const stack = [];
        for (const mainKey in elm) {
            const e_main = elm[mainKey];

            if (typeof e_main == 'object') {
                const y_sec_arr = [];
                for (const seckey in e_main) {
                    const y_sec = e_main[seckey];
                    const x_third_arr = [];
                    if (y_sec) {
                        if (Array.isArray(y_sec)) {
                            for (let i = 0; i < y_sec.length; i++) {
                                const x_third = y_sec[i];
                                if (typeof x_third == 'object') {
                                    const e_foruth_arr = [];

                                    for (const fourthKey in x_third) {
                                        const e_foruth = x_third[fourthKey];
                                        e_foruth_arr.push(<Stack key={mainKey + seckey + fourthKey} direction='row' gap={1}>
                                            <MDTypography sx={paragraph_secondary_css}>{fourthKey}</MDTypography>
                                            <MDTypography sx={{ ...paragraph_main_css, marginLeft: 'auto' }}>{e_foruth}</MDTypography>
                                        </Stack>)
                                    };

                                    if (e_foruth_arr.length > 0) {
                                        x_third_arr.push(<Stack key={mainKey + seckey + i + "_group"}>{e_foruth_arr}</Stack>);
                                    }
                                }
                            }
                        } else {
                            if (typeof y_sec == 'object') {
                                const e_foruth_arr = [];
                                for (const fourthKey in y_sec) {
                                    const e_foruth = y_sec[fourthKey];
                                    if (Array.isArray(e_foruth)) {
                                        const e_fifth_arr = [];

                                        e_foruth.map((fifth, index) => {
                                            const e_sixty_arr = [];
                                            for (const sixtyKey in fifth) {
                                                const e_sixty = fifth[sixtyKey];
                                                if (sixtyKey && sixtyKey != '_id') {
                                                    e_sixty_arr.push(<Stack key={mainKey + "_" + seckey + "_" + fourthKey + index + "_" + sixtyKey} direction='row' gap={1}>
                                                        <MDTypography sx={paragraph_secondary_css}>{SplitCammelCase({ string: sixtyKey })}</MDTypography>
                                                        <MDTypography sx={{ ...paragraph_main_css, marginLeft: 'auto' }}
                                                            style={sixtyKey == 'Tipo' ? { textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '200' } : {}}>
                                                            {e_sixty}</MDTypography>
                                                    </Stack>)
                                                }

                                            }
                                            e_fifth_arr.push(<Stack key={mainKey + "_" + seckey + "_" + fourthKey + index} sx={{
                                                backgroundColor: `${darkMode ? palette.grey[900] : palette.grey[300]}`, borderRadius: 2, padding: 1
                                            }}>{e_sixty_arr}</Stack>)
                                        });

                                        e_foruth_arr.push(<Stack key={mainKey + "_" + seckey + "_" + fourthKey} gap={1}>
                                            <MDTypography sx={{ fontSize: '1rem', marginTop: 2, marginBottom: 1 }}>
                                                {fourthKey}</MDTypography>{e_fifth_arr}</Stack>)

                                    } else {
                                        e_foruth_arr.push(<Stack key={mainKey + seckey + fourthKey} direction='row' gap={1}>
                                            <MDTypography sx={paragraph_secondary_css}>{SplitCammelCase({ string: fourthKey })}</MDTypography>
                                            <MDTypography sx={{ ...paragraph_main_css, marginLeft: 'auto' }}>{e_foruth}</MDTypography>
                                        </Stack>)
                                    }
                                };

                                x_third_arr.push(<Stack key={mainKey + seckey}><Divider flexItem sx={{ height: "2px", backgroundColor: '#ccc' }} />
                                    <MDTypography paragraph>{seckey}</MDTypography>{e_foruth_arr}</Stack>);
                            } else if (seckey !== 'ID') {
                                let ret;
                                switch (seckey) {
                                    case "FidoRichiesto":
                                        ret = <Fragment key={mainKey + seckey}><Divider flexItem sx={{ height: "2px", backgroundColor: '#ccc' }} />
                                            <Stack direction='row' gap={1} mt={2}>
                                                <MDTypography sx={paragraph_secondary_css}>{SplitCammelCase({ string: seckey })}</MDTypography>
                                                <MDTypography sx={{ marginLeft: 'auto', fontSize: '1.2rem', fontWeight: 600 }}>
                                                    {Convert.euro(y_sec).Data}
                                                </MDTypography>
                                            </Stack></Fragment>
                                        break;
                                    case "DataRichiesta":
                                        ret = <Fragment key={mainKey + seckey}><Divider flexItem sx={{ height: "2px", backgroundColor: '#ccc' }} />
                                            <Stack direction='row' gap={1} mt={2}>
                                                <MDTypography sx={paragraph_secondary_css}>{SplitCammelCase({ string: seckey })}</MDTypography>
                                                <MDTypography sx={{ ...paragraph_main_css, marginLeft: 'auto', }}>
                                                    {new Date(y_sec).toLocaleString('it-IT')}
                                                </MDTypography>
                                            </Stack></Fragment>
                                        break;
                                    default:
                                        ret = <Fragment key={mainKey + seckey}><Divider flexItem sx={{ height: "2px", backgroundColor: '#ccc' }} />
                                            <Stack direction='row' gap={1} mt={2}>
                                                <MDTypography sx={paragraph_secondary_css}>{SplitCammelCase({ string: seckey })}</MDTypography>
                                                <MDTypography sx={{ ...paragraph_main_css, marginLeft: 'auto' }}>{y_sec}</MDTypography>
                                            </Stack></Fragment>
                                        break;
                                }
                                y_sec_arr.push(ret)
                            }
                        }
                    }
                    y_sec_arr.push(<Stack key={mainKey + seckey + "_group"}>{x_third_arr}</Stack>)
                }

                stack.push(<Stack key={mainKey + "_group"}>{y_sec_arr}</Stack>)
            } else {
                let ret;
                switch (mainKey) {
                    case "_id":
                    case "Stato":
                        break;
                    /*case "Stato":
                        ret = <Stack key={mainKey} direction='row' gap={1}>
                            <MDTypography sx={paragraph_secondary_css}>{SplitCammelCase({ string: mainKey })}</MDTypography>
                            <MDTypography sx={{ ...GenStatusColor(listOfRequestStatus[e_main]), marginLeft: 'auto', fontSize: '0.8rem', borderRadius: 3, p: 0.5 }}>
                                {listOfRequestStatus[e_main]}</MDTypography>
                        </Stack>
                        break;*/
                    case "VotoRaiting":
                        ret = <Stack key={mainKey} direction='row' gap={1} alignItems='flex-end'>
                            <MDTypography sx={paragraph_secondary_css}>{SplitCammelCase({ string: mainKey })}</MDTypography>
                            <MDTypography sx={{
                                marginLeft: 'auto',
                                fontWeight: "bold",
                                fontSize: "2rem",
                                padding: "10px",
                                backgroundColor: `${darkMode ? palette.grey[900] : palette.grey[400]}`,
                                boxShadow: "0rem 0.25rem 0.375rem -0.0625rem rgba(0, 0, 0, 0.1), 0rem 0.125rem 0.25rem -0.0625rem rgba(0, 0, 0, 0.06)",
                                borderRadius: "50%",
                                width: "70px",
                                textAlignLast: "center",
                                marginTop: "20px",
                                color: "#606060"
                            }}>
                                {e_main}</MDTypography>
                        </Stack>
                        break;
                    case "CommentoEsito":
                        if (e_main) {
                            ret = <Stack key={mainKey} direction='row' gap={1}>
                                <MDTypography sx={paragraph_secondary_css}>{SplitCammelCase({ string: mainKey })}</MDTypography>
                                <p style={{ marginLeft: 'auto', textAlign: 'right', fontSize: '0.8rem', borderRadius: 3, p: 0.5 }}
                                    dangerouslySetInnerHTML={{ __html: StringToHTML({ string: e_main }) }}></p>
                            </Stack>
                        }
                        break;
                    default:
                        ret = <Stack key={mainKey} direction='row' gap={1}>
                            <MDTypography sx={paragraph_secondary_css}>{SplitCammelCase({ string: mainKey })}</MDTypography>
                            <MDTypography sx={{ fontSize: '1.2rem', marginLeft: 'auto' }}>{e_main}</MDTypography>
                        </Stack>
                        break;
                }
                stack.push(ret);
            }
        }

        return stack;
    })

    return (
        <Card key={key_prop} id={`fido-status-card-${index}`} sx={{ width: '100%', background: `${darkMode ? palette.grey[800] : palette.grey[200]}` }}>
            <CardHeader
                sx={{ color: `${darkMode ? palette.white.main : palette.black.main} !important` }}
                avatar={
                    <Avatar sx={{ bgcolor: red[500] }} aria-label="recipe">
                        {elm.Dettagli.Azienda.Nome[0]}
                    </Avatar>
                }
                action={
                    <IconButton aria-label="settings" onClick={() => CreateChat(elm)}
                        data-tooltip-content="Avvia una chat con l'incaricato del fido" data-tooltip-id='general-actionBar-tooltip'>
                        {icon_chat()}
                    </IconButton>
                }
                title={elm.Dettagli.Azienda.Nome}
                subheader={<MDTypography sx={paragraph_secondary_css}>
                    {new Date(elm.Dettagli.DataRichiesta).toLocaleString('it-IT')}
                </MDTypography>}
            />
            <CardContent sx={{ padding: '0.5rem 1.5rem 0rem' }}>
                <Stack mb={1} gap={1}>
                    <Stack direction='row' gap={1} alignItems='center'>
                        <MDTypography sx={paragraph_secondary_css}>Stato</MDTypography>
                        <MDTypography sx={{
                            ...GenStatusColor(listOfRequestStatus[elm.Stato]),
                            marginLeft: 'auto', fontSize: '0.8rem', borderRadius: 3, p: 0.5
                        }}>
                            {listOfRequestStatus[elm.Stato]}</MDTypography>
                    </Stack>
                    {elm?.CommentoEsito && <Stack direction='row' gap={1} alignItems='center' justifyContent='space-between'>
                        <MDTypography sx={paragraph_secondary_css}>Commento Esito</MDTypography>
                        <FDIconButton icon={icon_note()} onClick={handleExpandClick} />
                    </Stack>}
                </Stack>

                <Stack direction='row' sx={{ textTransform: 'uppercase' }}>
                    <MDTypography variant="body2" sx={paragraph_secondary_css}>
                        Sito
                    </MDTypography>
                    <MDTypography variant="body2" sx={{ marginLeft: 'auto', fontSize: '0.8rem' }}>
                        {elm.Dettagli.Azienda.Sito || "N/D"}
                    </MDTypography>
                </Stack>
                <Stack direction='row' sx={{ textTransform: 'uppercase' }}>
                    <MDTypography variant="body2" sx={paragraph_secondary_css}>
                        Sede
                    </MDTypography>
                    <MDTypography variant="body2" sx={{ marginLeft: 'auto', fontSize: '0.8rem' }}>
                        {elm.Dettagli.Azienda.Sede || "N/D"}
                    </MDTypography>
                </Stack>
                <Stack direction='row' sx={{ textTransform: 'uppercase' }}>
                    <MDTypography variant="body2" sx={paragraph_secondary_css}>
                        Fido Richiesto
                    </MDTypography>
                    <MDTypography variant="body2" sx={{ marginLeft: 'auto', fontSize: '1.2rem', fontWeight: 600 }}>
                        {Convert.euro(elm.Dettagli.FidoRichiesto).Data}
                    </MDTypography>
                </Stack>

            </CardContent>

            <CardActions disableSpacing>
                <ExpandMore
                    expand={expanded}
                    onClick={handleExpandClick}
                    aria-expanded={expanded}
                    aria-label="show more"
                >
                    <ExpandMoreIcon />
                </ExpandMore>
            </CardActions>

            <Collapse in={expanded} timeout="auto" unmountOnExit>
                <CardContent>
                    <Gen_Expand />
                </CardContent>
            </Collapse>
        </Card>
    )
}

export default React.memo(FidoStatusCard);