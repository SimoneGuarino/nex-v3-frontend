import React from 'react';

import {
    Backdrop, Card, CardActions, CardContent, Checkbox,
    Collapse,
    Divider,
    Fade,
    FormControl, IconButton, IconButtonProps, InputLabel, MenuItem, Select,
    Stack, Switch
} from '@mui/material';
import { icon_close, icon_expandMore, icon_save, icon_settings } from 'config/icons';

import PermissionMoudle from '../../../../classes/permission';
import styled from '@emotion/styled';

import { PopupInfo } from 'components/PopupInfo';
import { companys, rolesAvaible } from 'classes/core';
import MDTypography from 'components/MDTypography';
import { MainTheme } from 'assets/settingsTheme';
import { Tag } from 'components/Tag/Tag';
import routes from 'routes';
import { useNexTheme } from '@nex/theme-system';
const Permission = new PermissionMoudle();




interface ExpandMoreProps extends IconButtonProps {
    expand: boolean;
}
const ExpandMore = styled((props: ExpandMoreProps) => {
    const { expand, ...other } = props;
    return <IconButton {...other} />;
})(({ theme, expand }) => ({
    transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
    marginLeft: 'auto',
    transition: (theme as any).transitions.create('transform', {
        duration: (theme as any).transitions.duration.shortest,
    }),
}));


interface CompanyStatsDist {
    status: boolean;
    role?: number;
};

interface CompanyBlockPartProps {
    name: "Focelda" | "IOT";
    index: number,
    companyStats: {
        Focelda: CompanyStatsDist;
        IOT: CompanyStatsDist;
    };
    ChangeData_pipe: (company: string, prop: string, newStatus: boolean | number | null) => void;
};
const CompanyBlockPart: React.FC<CompanyBlockPartProps> = ({ name, index, companyStats, ChangeData_pipe }) => {
    const ChangeCheckedStatus_pipe = () => {
        ChangeData_pipe(name, "status", !companyStats[name].status);
        if (companyStats[name].status) {
            ChangeData_pipe(name, "role", null);
        }
    }

    return <Stack key={index} flex='50%' alignItems='center'>
        <Stack direction='row' gap={1} alignItems='center'>
            <MDTypography>{name}</MDTypography>
            <Checkbox checked={companyStats[name].status} onChange={() => ChangeCheckedStatus_pipe()} />
        </Stack>

        {companyStats[name].status && <Fade in={true}><FormControl fullWidth>
            <InputLabel id="simple-select-label">Ruolo</InputLabel>
            <Select
                labelId="simple-select-label"
                label="Age"
                sx={{ height: 40 }}
                value={companyStats[name].role}
                onChange={(e: any) => ChangeData_pipe(name, "role", e.target.value === '' ? null : e.target.value)}
            >
                <MenuItem value={""}>Nullo</MenuItem>
                {rolesAvaible.map((e: any) => (
                    <MenuItem value={e.index}>{e.index + " - " + e.name}</MenuItem>
                ))}
            </Select>
        </FormControl></Fade>}
    </Stack>
};


interface CardsRoutesProps {
    e: {
        key: string;
        name: string;
        route: string;
        type: string;
    };
    index: number;
    ChangeUserData: (from: string, company: string, prop: string, newStatus: boolean | number | null) => void;
    baseData: any;
};
const CardRoute: React.FC<CardsRoutesProps> = ({ e, index, baseData, ChangeUserData }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const [expanded, setExpanded] = React.useState<boolean>(false);
    const [cardActived, setCardActived] = React.useState<boolean>(Boolean(baseData[e.key].Focelda.status || baseData[e.key].IOT.status));
    const changeCardActived = () => {
        ChangeUserData(e.key, "Focelda", "status", !cardActived);
        ChangeUserData(e.key, "IOT", "status", !cardActived);
        setCardActived(!cardActived);
    }

    const handleExpandClick = () => {
        if (cardActived) {
            setExpanded(!expanded);
        }
    };

    const ChangeData_pipe = (company: string, prop: string, newStatus: boolean | number | null) => {
        ChangeUserData(e.key, company, prop, newStatus);
    }


    return <Card key={index} className='transition-all-css' style={{ transition: 'all 200ms ease-in !important' }}
        sx={cardActived ? { backgroundColor: `${darkMode ? '#484848' : palette.grey[200]}` } 
        : { backgroundColor: `${darkMode ? '#2d2d2d' : palette.grey[300]}` }}>
        <CardContent>
            <Stack direction='row' gap={2}>
                <MDTypography  sx={cardActived ? {} : { opacity: 0.3 }}>{e.name}</MDTypography>
                <Stack direction='row' gap={0.3}>
                    {cardActived && <Tag text='Attivo' color={palette.primary.main} textColor={`${darkMode ? "#fff" : ""}`} sx={{ mr: 2 }} />}
                    {baseData[e.key].Focelda.status && <Tag text='Focelda' color={`${darkMode ? "" : palette.grey[300]}`} />}
                    {baseData[e.key].IOT.status && <Tag text='IOT' color={`${darkMode ? "" : palette.grey[300]}`} />}
                </Stack>

                <Switch sx={{ ml: 'auto' }} checked={cardActived} onChange={changeCardActived} />
            </Stack>
        </CardContent>

        <CardActions sx={{ borderTop: `1px solid ${cardActived ? 
            darkMode ? palette.grey[900] : palette.grey[400] 
        : darkMode ? palette.grey[900] : palette.grey[500] }` }}>
            <ExpandMore
                expand={expanded}
                onClick={handleExpandClick}
                aria-expanded={expanded}
                aria-label="show more" sx={cardActived ? {} : { opacity: 0.4 }}>
                {icon_expandMore()}
            </ExpandMore>
        </CardActions>
        <Collapse in={expanded} timeout="auto" unmountOnExit>
            <CardContent>
                <Stack p={2} borderRadius={5} mb={2} sx={{ backgroundColor: palette.primary.light }}>
                    <MDTypography variant='h5'>Impostazioni</MDTypography>
                    <MDTypography variant="body2">
                        Spunta l'azienda su cui vuoi apportare la modifica/abbilitazione, selezionando inoltre il ruolo avrai la possibilità
                        di modifica il ruolo del utente per l'azienda in questione.
                    </MDTypography>
                </Stack>

                <Stack direction='row' alignItems='center' alignContent='center' gap={1}>
                    {companys.map((x: any, index: number) => (
                        <CompanyBlockPart name={x} index={index} companyStats={baseData[e.key]}
                            ChangeData_pipe={ChangeData_pipe} />
                    ))}
                </Stack>
            </CardContent>
        </Collapse>
    </Card>
};



interface PermissionsPanelProps {
    ChangePermissionsPanelStatus: () => void;
    userTargetData: { ruolo: string; username: string, _id: string; permissions: Array<object> };
    SaveData: (userTargetData: any, userChanges: any) => void;
};
export const PermissionsPanel: React.FC<PermissionsPanelProps> = ({ ChangePermissionsPanelStatus, userTargetData, SaveData }) => {
    const palette = MainTheme().palette;
    const permissionList = Permission.getRoute(routes);

    //Lista delle route in base ai permessi
    const permissionListbasedRole = Permission.RouteToShow(userTargetData.ruolo[0], routes, userTargetData.username, null);
    const permissionListDB = (userTargetData as any).permissions || [];


    //definisce gli elementi in lista facendo una distinzione in base alle condizioni del profilo selezionato.
    const baseData = React.useCallback(() => {
        const array = (permissionList.Data as Array<{ key: string }>)
            .map(e => {
                const status_foc = permissionListDB.length > 0 ?
                    permissionListDB[0][e.key] ?
                        permissionListDB[0][e.key].Focelda.status
                        : false
                    : Boolean((permissionListbasedRole as any)?.Data.findIndex((x: any) => x.key == e.key) >= 0);
                const status_iot = permissionListDB.length > 0 ?
                    permissionListDB[0][e.key] ?
                        permissionListDB[0][e.key].IOT.status
                        : false
                    : Boolean((permissionListbasedRole as any)?.Data.findIndex((x: any) => x.key == e.key) >= 0);

                const role_foc = permissionListDB.length > 0 ?
                    permissionListDB[0][e.key] ?
                        permissionListDB[0][e.key].Focelda.role
                        : null
                    : null;

                const role_iot = permissionListDB.length > 0 ?
                    permissionListDB[0][e.key] ?
                        permissionListDB[0][e.key].IOT.role
                        : null
                    : null;

                return {
                    [e.key]: {
                        Focelda: { status: status_foc, role: role_foc },
                        IOT: { status: status_iot, role: role_iot },
                    }
                }
            });

        let mergedObject = {};

        array.forEach(obj => {
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    (mergedObject as any)[key] = { ...(mergedObject as any)[key], ...obj[key] };
                }
            }
        });

        return mergedObject;
    }, []);

    const [userChanges, setUserChanges] = React.useState<any>(baseData());
    const ChangeUserData = (from: string, company: string, prop: string, newStatus: boolean | number | null) => {
        setUserChanges((prev: any) => {
            return { ...prev, [from]: { ...prev[from], [company]: { ...prev[from][company], [prop]: newStatus } } }
        })
    };


    return <Backdrop open={true} sx={{ color: '#fff', zIndex: (theme: any) => theme.zIndex.drawer + 1 }}>
        <Card sx={{width: '60%', height: '80%', maxHeight: '900px',
            borderRadius: 5, transition: 'all 200ms ease-in', p: 2
        }}>
            <Stack height='100%'>
                <Stack gap={2}>
                    <Stack direction='row'>
                        <MDTypography variant='h4'>Cambio dei Permessi</MDTypography>
                        <Stack direction='row' sx={{ ml: 'auto' }} gap={1}>
                            <IconButton onClick={() => SaveData(userTargetData, userChanges)}>
                                {icon_save()}
                            </IconButton>
                            <IconButton sx={{ backgroundColor: palette.error.light, "&:hover": { backgroundColor: palette.error.dark} }}
                            onClick={() => ChangePermissionsPanelStatus()}>
                                {icon_close({ color: '#fff' })}
                            </IconButton>
                        </Stack>
                    </Stack>
                    <PopupInfo title='Info' close={false} icon={icon_settings({ color: '#000' })}
                        body="Attivando i blocchi sarà possibile far vedere la route di riferimento a 
                questo determinato utente, inoltre potrai cambiare ruolo all'utente in questione in
                base alla necessità. Se ogni blocco si trova in uno stato di disattivazione
                l'utente avrà le route pre-definite dal sistema in base al ruolo di riferimento."/>
                </Stack>

                <Divider sx={{ backgroundColor: '#000' }} />

                <Stack sx={{ overflow: 'auto' }} gap={3} p={1}>
                    {(permissionList.Data as Array<Object>).map((e: any, index: number) => (
                        <CardRoute e={e} index={index} ChangeUserData={ChangeUserData} baseData={userChanges} />
                    ))}
                </Stack>
            </Stack>
        </Card>
    </Backdrop>
};