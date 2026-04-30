import React from 'react';

import {
    Backdrop, Card, Checkbox, Divider, IconButton, InputAdornment,
    Stack, TextField
} from '@mui/material';
import { PopupInfo } from 'components/PopupInfo';
import { icon_close, icon_eurSymbol } from 'config/icons';
import './EditPanel-style.css';
import MDTypography from 'components/MDTypography';
import { MainTheme } from 'assets/settingsTheme';
import { Tag } from 'components/Tag/Tag';
import MDButton from 'components/MDButton';
import { useNexTheme } from '@nex/theme-system';


interface distSelectedProps {
    name: string;
    value?: number;
}


interface SingleButtonSupplierPorps {
    openedBy : 0 | 1; //0 => Inserisci Nuova Condizione || 1 => Modifica Condizione Esistente in tabella
    quarter: string;
    data: (nameDist: string) => distSelectedProps;
    index: number;
    HandleDistToInsert: (checkbox: boolean, dist: distSelectedProps) => void;
    ChangeValueOnQuarters: (name: string, value: number | string) => void;
    UpdateSuppliersActived: (distName: string) => void;
    DeletePropsOnItem: (nameDist: string, namePropsToDelete: string[]) => void;
}

const period: object = {
    Q1: {from: "2024-01-01", to: "2024-03-31"},
    Q2: {from: "2024-01-04", to: "2024-06-30"},
    Q3: {from: "2024-07-01", to: "2024-09-30"},
    Q4: {from: "2024-10-01", to: "2024-12-31"},
}

const SingleButtonSupplier: React.FC<SingleButtonSupplierPorps> = ({ data, quarter, index, HandleDistToInsert,
    ChangeValueOnQuarters, openedBy, DeletePropsOnItem,
}) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const CheckedBox_init = data(quarter) ?
    Boolean(((openedBy == 1 ? data(quarter) : data(quarter)?.value))) : false;
    const [reChargeStat, setReChargeStat] = React.useState<boolean>(CheckedBox_init);
    


    const ChangeReChargeStat = () => {
        if (reChargeStat) {
            DeletePropsOnItem(quarter, ['value']);
        }
        setReChargeStat(!reChargeStat);
    };



    return <Stack key={index} direction='row' sx={{
        backgroundColor: `${darkMode ? palette.grey[700] : '#e9eef3' }`, 
        p: 2, borderRadius: 5, display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 2,
    }} style={{ opacity: 1 }}>
        <MDTypography variant='h5'  >
            {quarter}
        </MDTypography>

        <Divider orientation='vertical' 
        sx={{ backgroundColor: `${darkMode ? palette.primary.light : palette.grey[800]}`, width: '1px', height: '100%' }} />

        <Stack direction='row' gap={2}>
            <Stack alignItems='center'>
                <MDTypography variant='body2' fontSize='0.7rem'>Dal</MDTypography>
                <Tag text={(period as any)[quarter].from}/>
            </Stack>
            <Stack alignItems='center'>
                <MDTypography variant='body2' fontSize='0.7rem'>Al</MDTypography>
                <Tag text={(period as any)[quarter].to}/>
            </Stack>
        </Stack>
        

        <Stack direction='row' alignItems='center' gap={1} height='100%' ml='auto'>
            <Divider orientation='vertical' sx={{ backgroundColor: '#000', width: '1px', height: '100%' }} />
            <Checkbox className='checkbox-suppliers' checked={reChargeStat} onChange={ChangeReChargeStat} color="secondary" />
            <Stack direction='row' gap={2} sx={!reChargeStat ? { borderRadius: 1, opacity: 0.8, filter: "blur(1px)" } : {}}>
                <TextField
                    label="Target"
                    value={((openedBy == 1 ? data(quarter) : data(quarter)?.value) || 0)}
                    onChange={(e) => ChangeValueOnQuarters(quarter, e.target.value)}
                    id="outlined-start-adornment"
                    style={{ maxWidth: '13ch' }}
                    disabled={!reChargeStat}
                    sx={!reChargeStat ? { opacity: 0.5, filter: "grayscale(1)" } : {}}
                    InputProps={{
                        startAdornment: <InputAdornment position="start">{icon_eurSymbol()}</InputAdornment>,
                    }}
                />
            </Stack>

        </Stack>
    </Stack>
}



interface EditPanelProps {
    openedBy: 0 | 1; //0 => Inserisci Nuova Condizione || 1 => Modifica Condizione Esistente in tabella
    supplierList: Array<distSelectedProps>;
    statusMode: boolean; // definisce in quale stato si trova il pannello
    ChangeStatus: () => void;
    HandleDistToInsert: (checkbox: boolean, dist: distSelectedProps) => void;
    ChangeValueOnQuarters: (name: string, value: number | string) => void;
    UpdateSuppliersActived: (distName: string) => void;
    suppliersFromNewInsert: String[];
    quarterFromEditItem: String[];
    DeletePropsOnItem: (nameDist: string, namePropsToDelete: string[]) => void;
    RetriveDistData: (nameDist: string) => distSelectedProps;
    SaveChangedConfiguration: () => void;
}
export const EditPanel: React.FC<EditPanelProps> = ({ statusMode, ChangeStatus, HandleDistToInsert,
    ChangeValueOnQuarters, UpdateSuppliersActived, openedBy,
    DeletePropsOnItem, RetriveDistData, SaveChangedConfiguration
}) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const quarter: string[] = ['Q1', 'Q2', 'Q3', 'Q4']

    const Brige_ChangeStatus = () => {
        SaveChangedConfiguration();
        ChangeStatus();
    }

    return <Backdrop open={statusMode} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        {statusMode && <Card sx={{
            height: '80%', width: '50%', maxWidth: 800, minWidth: 580, maxHeight: 800, minHeight: 580 }}>
            <Stack p={3} sx={{ height: '100%', width: '100%'}}
            alignItems="center" translate="no">
            <Stack gap={1} height='100%' width='100%' >
                <Stack direction='row'>
                    <MDTypography variant='h4'>
                        Previsioni Annuali
                    </MDTypography>
                    <IconButton sx={{ ml: 'auto', backgroundColor: palette.error.light, 
                    "&:hover": { backgroundColor: palette.error.dark }}} onClick={() => Brige_ChangeStatus()}>
                        {icon_close({ color: '#fff'})}
                    </IconButton>
                </Stack>

                <PopupInfo body="Inserisci i valori annuali previsti per il Buyer selezionato, inserendo le previsioni nei vari periodi." close={false} />
                <Divider sx={{ backgroundColor: '#000', width: '100%', height: '1px' }} />

                <Stack gap={1} overflow='auto'>
                    {quarter.map((element, index) => (
                        <SingleButtonSupplier key={index} quarter={element} index={index} HandleDistToInsert={HandleDistToInsert}
                            ChangeValueOnQuarters={ChangeValueOnQuarters} UpdateSuppliersActived={UpdateSuppliersActived}
                            DeletePropsOnItem={DeletePropsOnItem}
                            data={RetriveDistData} openedBy={openedBy} />
                    ))}
                </Stack>

                <MDButton variant='contained' color={`${darkMode ? 'primary' : 'secondary'}`} sx={{ color: '#fff', mt: 'auto' }}
                    onClick={() => Brige_ChangeStatus()}>Fatto</MDButton>
            </Stack>
        </Stack></Card>}
    </Backdrop>
}