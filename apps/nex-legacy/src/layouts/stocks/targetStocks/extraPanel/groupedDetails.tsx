import React from 'react';

import {
    Backdrop, Card, Divider, IconButton,
    Stack,
} from '@mui/material';
import avatarNoChild from 'assets/images/emptyBox-removebg.png'
import { icon_close } from 'config/icons';
import MDTypography from 'components/MDTypography';
import { MainTheme } from 'assets/settingsTheme';
import { Tag } from 'components/Tag/Tag';
import { NumberToEuro } from 'utils/numberToEuro';
import { ExtraFooter } from '../extraBar/extraFooter';
import { useNexTheme } from '@nex/theme-system';


interface DataProps {
    buyer: string;
    prefissoFornitore: string;
    codiceArticolo?: string;
    descrizione?: string;
    linea: string;
    descrizioneLinea: string;
    gruppo?: string;
    descrizioneGruppo?: string;
    marca: string;
    q1: null | string;
    q2: null | string;
    q3: null | string;
    q4: null | string;
    q1_gr: null | string;
    q2_gr: null | string;
    q3_gr: null | string;
    q4_gr: null | string;
    stock: string;
    backorder: string;
    fatturatoTrimestreAttuale: string;
    fatturatoTrimestrePrecedente: string;
    chiledren?: any;
};

interface SingleButtonSupplierPorps {
    index: number;
    item: DataProps;
}


const Row: React.FC<SingleButtonSupplierPorps> = ({ index, item,
}) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const details = [
        { key: 'gruppo', label: 'Gruppo' },
        { key: 'descrizioneGruppo', label: 'Descrizione Gruppo' }]
    const q_ = ['q1', 'q2', 'q3', 'q4']
    const sales = [
        { key: 'fatturatoTrimestreAttuale', label: 'Fatturato Trimestre' },
        { key: 'fatturatoTrimestrePrecedente', label: 'Fatturato Trimestre Prec.' },
        { key: 'stock', label: 'Stock' },
        { key: 'backorder', label: 'Backorder' }]


    
    return <Stack key={index} sx={{
        backgroundColor: `${darkMode ? palette.grey[700] : '#e9eef3'}`,
        p: 2, pb: 3, borderRadius: 5, display: 'flex',
        justifyContent: 'flex-start',
        gap: 2,
    }} style={{ opacity: 1 }}>
        <Stack direction='row' gap={2}>
            {details.map((element: { key: string, label: string }, y: number) => (
                <Stack alignItems='center' mr={element.key === 'codiceArticolo' ? 'auto' : 0}>
                    <Tag text={element.label} />
                    <MDTypography variant='title2' fontSize='0.9rem' sx={{fontWeight: 600}}>{(item as any)[element.key]}</MDTypography>
                </Stack>
            ))}
        </Stack>

        <Stack direction='row' gap={1} ml='auto'>
            {q_.map((element: string, i: number) => (
                <Stack key={i} alignItems='center' sx={{
                    minWidth: 100,
                    p: 1,
                    backgroundColor: `${darkMode ? palette.grey[800] : palette.grey[300]}`,
                    borderRadius: 2
                }}>
                    <MDTypography variant='body1' fontSize='0.8rem'>{element.toUpperCase()}</MDTypography>
                    <MDTypography variant='body2' fontSize='0.8rem'>
                        {NumberToEuro({ convert: (item as any)[element] }) || 0}</MDTypography>
                </Stack>
            ))}
        </Stack>

        <Divider sx={{ backgroundColor: '#000', width: '100%', height: '1px', margin: 0 }} />

        <Stack direction='row' gap={1} sx={{
            p: 1, borderRadius: 2,
            backgroundColor: `${darkMode ? palette.grey[800] : palette.grey[400]}`,
        }}>
            {sales.map((element: { key: string, label: string }, y: number) => (
                <Stack key={y} alignItems='center' sx={{ minWidth: 100 }}>
                    <Tag text={element.label} />
                    <MDTypography variant='title2' fontSize='0.8rem'>
                        {NumberToEuro({ convert: (item as any)[element.key] }) || 0}</MDTypography>
                </Stack>
            ))}
        </Stack>
    </Stack>
}

const GeneralDetails: React.FC<{ item: DataProps }> = ({ item }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const detailsToShow = ['buyer', 'marca', 'linea', 'descrizioneLinea']
    const q_ = [
        {key: 'q1_gr', label: "q1"}, 
        {key: 'q2_gr', label: "q2"}, 
        {key: 'q3_gr', label: "q3"}, 
        {key: 'q4_gr', label: "q4"}];

    return <Stack sx={{
        border: "1px solid #ccc",    
        p: 1, pl: 3, pr: 3, borderRadius: 5, display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        gap: 2,
        mb: 2
    }} style={{ opacity: 1 }}>
        <Stack direction='row' width='100%' height='100%' sx={{ justifyContent: 'space-around', }}>
            {detailsToShow.map((element: string, index: number) => (
                <React.Fragment key={index}>
                    <Stack alignItems='center'>
                        <Tag text={element} color={palette.info.main} 
                        textColor={`${darkMode ? palette.black.main :''}`}/>
                        <MDTypography variant='title2' fontSize='0.8rem'>{((item as any)[element] || "Non Presente")}</MDTypography>
                    </Stack>
                    {detailsToShow.length !== (index + 1) &&
                        <Divider orientation="vertical" sx={{ backgroundColor: '#ccc' }} />}
                </React.Fragment>
            ))}
        </Stack>

        <Divider sx={{ backgroundColor: '#ccc', width: '100%', margin: 0 }} />

        <Stack direction='row' width={'100%'} gap={1} sx={{ justifyContent: 'space-around', alignItems: 'center' }}>
            <MDTypography variant='title2' sx={{fontWeight: 600}} fontSize='0.9rem'>Obietivo generale</MDTypography>
            {q_.map((element: {key: string; label: string}, i: number) => (
                <Stack key={i} alignItems='center' sx={{
                    minWidth: 100,
                }}>
                    <MDTypography variant='body1' fontSize='0.8rem'>{element.label.toUpperCase()}</MDTypography>
                    <MDTypography variant='body2' fontSize='0.8rem'>
                        {NumberToEuro({ convert: (item as any)[element.key] }) || 0}</MDTypography>
                </Stack>
            ))}
        </Stack>
    </Stack>
}


interface EditPanelProps {
    statusMode: boolean; // definisce in quale stato si trova il pannello
    ChangeStatus: () => void;
    item_: DataProps
}
export const GroupedDetails: React.FC<EditPanelProps> = ({ statusMode, ChangeStatus, item_
}) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;



    return <Backdrop open={statusMode} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        {statusMode && <Card sx={{
            height: '95%', width: '70%', maxWidth: 1200, minWidth: 580, maxHeight: 1000, minHeight: 580
        }}>
            <Stack p={3} gap={1} height='100%' width='100%' >
                <Stack direction='row'>
                    <MDTypography variant='h4'>
                        Dettagli Gruppo
                    </MDTypography>
                    <IconButton sx={{
                        ml: 'auto', backgroundColor: palette.error.light,
                        "&:hover": { backgroundColor: palette.error.dark }
                    }} onClick={() => ChangeStatus()}>
                        {icon_close({ color: '#fff' })}
                    </IconButton>
                </Stack>

                <GeneralDetails item={item_} />

                {item_.chiledren && item_.chiledren.length > 0 ? <>
                    <Stack gap={2.5} overflow='auto' mb='auto'>{
                            item_.chiledren.map((item: any, index: number) => (
                                <Row item={item} index={index} />
                            ))
                    }</Stack>
                    <ExtraFooter data={item_.chiledren} />
                </>: <Stack sx={{
                        width: "100%",
                        height: "100%",
                        alignItems: "center",
                        justifyContent: "center",
                }}>
                    <img src={avatarNoChild} style={{filter: "grayscale(1)"}}/>
                    <MDTypography variant='body2' fontSize='0.8rem'>
                        Nessun Gruppo presente
                    </MDTypography>    
                </Stack>}
            </Stack>
        </Card>}
    </Backdrop>
}