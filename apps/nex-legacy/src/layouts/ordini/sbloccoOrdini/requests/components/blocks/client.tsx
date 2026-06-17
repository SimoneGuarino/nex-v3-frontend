import React from 'react';

import {
    Card, Divider, Grid, Grow, IconButton, Skeleton,
    Stack, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import { icon_people, icon_view } from 'config/icons';
import { statusList } from 'layouts/ordini/sbloccoOrdini/statusToColor';
import { Tag } from 'components/Tag/Tag';
import { MainTheme } from 'assets/settingsTheme';
import MDTypography from 'components/MDTypography';

import { FDButton } from '@nex/fd-ui';

import { VscRequestChanges } from "react-icons/vsc";
import { useTour } from "tour/TourProvider";
import { useNexTheme } from '@nex/theme-system';

const RequestChangesIcon = VscRequestChanges as React.FC<{ size?: number; className?: string }>;


interface DataClientProps {
    stato: 0 | 1 | 2;
    creata: {
        nota: string;
    }
    dettagli: {
        numeroOrdine: string;
        cliente: {
            nome: string;
            codice: string;
            email: string;
            pagamento?: string;
        };
    };
}
interface ClientDetailsProps {
    data: DataClientProps | null;
    companyActived: any;
    companyList: string[];
    checkAdminDev: boolean;
    FBAlreadyInRequest: boolean;

    HandleCompanyChange: (prev: any) => void;
    ChangeSendPanelStatus: () => void;
    ChangeCommentsPanelStatus: () => void;
}
export const ClientDetails: React.FC<ClientDetailsProps> = ({ data, companyActived, HandleCompanyChange,
    companyList, ChangeSendPanelStatus, checkAdminDev, FBAlreadyInRequest, ChangeCommentsPanelStatus }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;
    const { isOpen, index: tourIndex } = useTour();
    const lockInteractions = (isOpen && checkAdminDev && (tourIndex === 5 || tourIndex === 6)) ||
        (isOpen && !checkAdminDev && (tourIndex === 4 || tourIndex === 5));

    const titleCSS = {
        fontWeight: 500,
        color: palette.grey[600]
    };

    return <Grow
        in={true}
        style={{ transformOrigin: '0 0 0' }}
        {...{ timeout: 1000 }}>
        <Grid item xs={12} md={6} lg={6}> {
            data ? <Card><Stack sx={{ width: '100%', minHeight: 280, height: '100%', borderRadius: 5, p: 2, position: 'relative', }} data-tour="sblocco-info-cliente">
                <Stack direction='row' alignItems='center' gap={1}>
                    {lockInteractions && (
                        <div
                            aria-hidden="true"
                            style={{
                                position: 'absolute',
                                inset: 0,
                                zIndex: 10,
                                pointerEvents: 'auto',          // <-- blocca tutto sotto
                            }}
                            onClickCapture={(e) => e.stopPropagation()} // <-- niente bubbling
                        />
                    )}
                    {icon_people({ width: 30, height: 30 })}
                    <MDTypography variant='h5'>Informazioni Cliente {companyList[companyActived]}</MDTypography>
                </Stack>
                <Divider sx={{ backgroundColor: '#000' }} />
                <Stack direction='row' justifyContent='space-between' gap={2}>
                    <MDTypography variant='body2' sx={titleCSS}>Ragione Sociale</MDTypography>
                    <MDTypography variant='body2'>{data.dettagli.cliente.nome}</MDTypography>
                </Stack>
                <Stack direction='row' justifyContent='space-between' gap={2}>
                    <MDTypography variant='body2' sx={titleCSS}>Codice Cliente</MDTypography>
                    <MDTypography variant='body2'>{(data.dettagli.cliente as any)[companyList[companyActived] == 'focelda' ? "codice" : "codiceIot"]}</MDTypography>
                </Stack>
                <Stack direction='row' justifyContent='space-between' gap={2}>
                    <MDTypography variant='body2' sx={titleCSS}>Email</MDTypography>
                    <MDTypography variant='body2'>{data.dettagli.cliente.email}</MDTypography>
                </Stack>
                {data.dettagli.cliente?.pagamento && <Stack direction='row' justifyContent='space-between' gap={2}>
                    <MDTypography variant='body2' sx={titleCSS}>Pagamento</MDTypography>
                    <MDTypography variant='body2'>{data.dettagli.cliente.pagamento}</MDTypography>
                </Stack>}

                {checkAdminDev && <Stack direction='row' justifyContent='space-between' gap={2}>
                    <MDTypography variant='body2' sx={titleCSS}>Commento del Commerciale</MDTypography>
                    {data.creata.nota !== "" ?
                        <IconButton onClick={() => ChangeCommentsPanelStatus()} disabled={lockInteractions} data-tour="sblocco-comm" sx={{
                            '&.Mui-disabled': {
                                opacity: 1, cursor: 'default', pointerEvents: 'none',
                            },
                        }}>
                            {icon_view()}
                        </IconButton>
                        : <MDTypography variant='body2'>Non Presente</MDTypography>}
                </Stack>}

                <Stack direction='row' mt='auto' justifyContent='space-between'>
                    <ToggleButtonGroup
                        sx={{ backgroundColor: `${darkMode ? palette.grey[800] : palette.grey[200]}`, width: 'fit-content', }}
                        value={companyActived}
                        exclusive
                        onChange={(e) => !lockInteractions && HandleCompanyChange(e)}
                        disabled={lockInteractions}
                        aria-label="Platform"
                    >
                        {companyList.map((data, index) => (
                            <ToggleButton key={index} value={index} className='transition-all-css'
                                sx={companyActived == index ? {
                                    backgroundColor: `${palette.primary.main} !important`,
                                    color: `${darkMode ? palette.white.main : palette.black.main} !important`
                                }
                                    : {
                                        color: `${palette.grey[500]}`
                                    }}>{data}</ToggleButton>
                        ))}

                    </ToggleButtonGroup>
                    {(data.stato === 0 || !data.stato) ? !FBAlreadyInRequest ?
                        <span data-tour="sblocco-gest" className="inline-flex items-center align-middle">
                            <FDButton color='primary' className="!py-3 !min-h-[36px]" icon={<RequestChangesIcon size={16} />} onClick={() => ChangeSendPanelStatus()} disabled={lockInteractions}>
                                {checkAdminDev ? "Gestisci" : "Richiedi"} Sblocco
                            </FDButton></span> :
                        <Stack alignItems='center'>
                            <MDTypography variant='body2' sx={{ fontSize: '0.7rem', fontWeight: 600 }}>STATO</MDTypography>
                            <Tag text="Richiesta già in Elaborazione." fontSize='0.8rem' />
                        </Stack>
                        : <Stack alignItems='center'>
                            <MDTypography variant='body2' sx={{ fontSize: '0.7rem', fontWeight: 600 }}>STATO</MDTypography>
                            <Tag text={statusList[data.stato]} fontSize='0.8rem' />
                        </Stack>}
                </Stack>



            </Stack></Card> : <Skeleton sx={{
                borderRadius: 3, height: 200,
                width: '100%', bgcolor: `${darkMode ? '#1c1c1c' : ''}`
            }} variant="rounded" />}
        </Grid>
    </Grow>
}