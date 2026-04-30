import React from 'react';

import {
    Backdrop, Button, Checkbox, Divider, IconButton, InputAdornment,
    Stack, TextField, Typography
} from '@mui/material';
import { PopupInfo } from 'components/PopupInfo';
import { icon_close } from 'config/icons';
import './supplierToEdit-style.css';


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

const SingleButtonSupplier: React.FC<SingleButtonSupplierPorps> = ({ data, quarter, index, HandleDistToInsert,
    ChangeValueOnQuarters, openedBy, DeletePropsOnItem,
}) => {
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
        backgroundColor: '#e0ebfd', p: 2, borderRadius: 5, display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 2,
    }} style={{ opacity: 1 }}>
        <Stack alignItems='center'>
            <Typography variant='body2' sx={{ color: '#000', fontSize: '0.7rem' }}>
                Attiva
            </Typography>
        </Stack>

        <Divider orientation='vertical' sx={{ backgroundColor: '#000', width: '1px', height: '100%' }} />

        <Typography variant='h5' sx={{ color: '#000' }}>
            {quarter}
        </Typography>

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
                        startAdornment: <InputAdornment position="start">€</InputAdornment>,
                    }}
                />
            </Stack>

        </Stack>
    </Stack>
}



interface SupplierToEditProps {
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
export const SupplierToEdit: React.FC<SupplierToEditProps> = ({ statusMode, ChangeStatus, HandleDistToInsert,
    ChangeValueOnQuarters, UpdateSuppliersActived, openedBy,
    DeletePropsOnItem, RetriveDistData, SaveChangedConfiguration
}) => {

    const quarter: string[] = ['Q1', 'Q2', 'Q3', 'Q4']

    const Brige_ChangeStatus = () => {
        SaveChangedConfiguration();
        ChangeStatus();
    }

    return <Backdrop open={statusMode} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        {statusMode && <Stack p={3} sx={{
            height: '80%', width: '50%', maxWidth: 800, minWidth: 580, maxHeight: 800, minHeight: 580,
            backgroundColor: '#fff', borderRadius: 4
        }}
            alignItems="center" translate="no">
            <Stack gap={1} height='100%' width='100%' >
                <Stack direction='row'>
                    <Typography variant='h4' sx={{ color: '#000' }}>
                        Previsioni Annuali
                    </Typography>
                    <IconButton sx={{ ml: 'auto' }} onClick={() => Brige_ChangeStatus()}>
                        {icon_close()}
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

                <Button variant='contained' fullWidth sx={{ color: '#fff', mt: 'auto' }}
                    onClick={() => Brige_ChangeStatus()}>Fatto</Button>
            </Stack>
        </Stack>}
    </Backdrop>
}