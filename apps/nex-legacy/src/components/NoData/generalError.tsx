import { Fade, Stack } from '@mui/material';
import MDTypography from 'components/MDTypography';
import React from 'react';

interface GeneralErrorProps{
    text?: string;
    img: any;
}

/**
 * 
 * @param text String | inserisci un testo manualmente o sarà impostato uno di default di errore
 * @param img Component | url | img | che verrà renderizzata.
 * @returns 
 */
export const GeneralError: React.FC<GeneralErrorProps> = ({ text, img }) => {
    const title = text ? text 
        : "Ops!, sembra che ci sia stato un errore nel contattare il server, perfavore riprovare tra qualche instante.";
    
    return <Fade in={true} timeout={400}>
        <Stack alignItems='center' style={{filter: "grayscale(1)"}}>
            <img className='avoid-drag' loading='lazy' style={{maxWidth: "fit-content"}} src={img} alt='General Error' />
            <MDTypography sx={{fontSize: '0.92rem'}}>{title}</MDTypography>
        </Stack></Fade>
}