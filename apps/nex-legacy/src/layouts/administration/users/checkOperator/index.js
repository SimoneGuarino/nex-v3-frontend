import { useState, memo, useCallback, useRef, useEffect } from 'react';

//@MUI Components
import Stack from '@mui/material/Stack';
import Backdrop from '@mui/material/Backdrop';
import Divider from '@mui/material/Divider';

import IconButton from '@mui/material/IconButton';

import ErrorIMG from 'assets/images/noData/no-data-illustration_2150696443.webp';

import MainTab from './tabs/mainTab';
import MDTypography from "components/MDTypography";
import { icon_close, icon_info, icon_update } from 'config/icons';
import { Card } from '@mui/material';
import { MainTheme } from 'assets/settingsTheme';
import { GeneralError } from 'components/NoData/generalError';
import { CheckOperatorAPI } from '../fetch/CheckOperator';


function CheckOperator(props) {
    const palette = MainTheme().palette;

    const { setStatus, target_username } = props;
    const [data, setData] = useState([]);
    // Abort il panding del fetch all server
    const abortController = useRef(null);
    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
        }
    };

    const askData = useCallback(() => {
        // Abort Controller per il fetch
        abortController.current = new AbortController();

        CheckOperatorAPI({
            abortController,
            body: { target_username },
            HandleComplete: (res) => {
                splitData(res.data);
            },
            HandleError: (errorMessage) => { console.error(errorMessage) },
        })
    }, [target_username]);

    useEffect(() => {
        if (!props.tk) { return };
        askData();

        return cancelRequest;
    }, []);

    const splitData = useCallback((data) => {
        // Funzione per ottenere il giorno della settimana
        function getDayOfWeek(dateString) {
            const daysOfWeek = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
            const monthOfYear = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
            const date = new Date(dateString);
            const dayOfWeek = date.getDay();
            const getMonth = date.getMonth();
            return { day: daysOfWeek[dayOfWeek], month: monthOfYear[getMonth] };
        }
        const result = {};

        data.forEach((obj) => {
            const date = obj.date.split('T')[0]; // Estrai la parte della data (senza ora)

            if (!result[date]) {
                result[date] = {
                    numberDay: date.split("-")[2],
                    dayOfWeek: getDayOfWeek(obj.date).day,
                    monthOfYear: getDayOfWeek(obj.date).month,
                    date: date,
                    elements: [obj],
                };
            } else {
                result[date].elements.push(obj);
            }

            // Ordina gli elementi all'interno di ciascun array per data più recente
            result[date].elements.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB - dateA; // Ordina in modo decrescente per data
            });
        });

        // Ordina l'array di risultati per data
        const sortedResult = Object.values(result).sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateA - dateB; // Ordina in modo crescente per data
        });

        setData(sortedResult);
    }, [data]);


    return (
        <Backdrop open={true} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} translate="no">
            <Card sx={{ width: "85%", height: "80%", borderRadius: "10px" }} >
                <Stack translate="no" height='100%'>
                    <Stack direction='row' sx={{ padding: '5px 10px 5px' }}>
                        <Stack direction='row' sx={{ alignItems: 'center' }} gap={2}>
                            {icon_info({ color: '#8c8c8c' })}
                            <MDTypography component="p"
                                data-tooltip-id="main-user-management-tooltip"
                                data-tooltip-content='Utente attualmente visualizzato.'
                                style={{ fontWeight: "400", textAlign: "center", fontSize: '0.8em', alignSelf: 'center' }}>
                                {target_username}
                            </MDTypography>
                        </Stack>

                        <Stack direction='row' sx={{ marginLeft: "auto" }} gap={2}>
                            <IconButton sx={{ maxWidth: 40, maxHeight: 40 }}
                                data-tooltip-id="main-user-management-tooltip"
                                data-tooltip-content='Ricarica'
                                onClick={() => askData()} aria-label="reload" size="medium">
                                {icon_update()}
                            </IconButton>
                            <IconButton sx={{
                                maxWidth: 40, maxHeight: 40, backgroundColor: palette.error.light,
                                "&:hover": { backgroundColor: palette.error.dark }
                            }}
                                data-tooltip-id="main-user-management-tooltip"
                                data-tooltip-content='Chiudi'
                                onClick={() => setStatus(false)} aria-label="delete" size="medium">
                                {icon_close({ color: '#fff' })}
                            </IconButton>
                        </Stack>
                    </Stack>

                    <Divider style={{ background: '#727272', margin: 0 }} />

                    {data && data.length > 0 ? <MainTab data={data} /> :
                        <GeneralError img={ErrorIMG}
                            text="Ops!, sembra che al momento l'utente non abbia nessun azione registrata." />}
                </Stack>
            </Card>

        </Backdrop>
    )
}

export default memo(CheckOperator);