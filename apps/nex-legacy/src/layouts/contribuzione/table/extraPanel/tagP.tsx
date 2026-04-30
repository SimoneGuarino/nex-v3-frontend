import React from 'react';
import {
    Backdrop, IconButton, Checkbox, Stack,
    FormControl, MenuItem, InputLabel, OutlinedInput, Divider, Typography,
    FormControlLabel, Radio, RadioGroup
} from '@mui/material';

import Select from '@mui/material/Select';
import { icon_close, icon_info } from '../../../../config/icons';
import { PopupInfo } from '../../../../components/PopupInfo';



interface warehouseObject {
    Codice: string;
    Nome: string;
    Quantita: number;
}

interface TagPProps {
    status: boolean;
    ChangeStatusTagP: () => void;
    warehouses_selected: string[];
    setWarehouses_selected: (prev: any) => void;
    warehouses_list: Array<warehouseObject>;
    noDataWEBP: any;
    warehousesFilterType: number;
    HandleFlipWarehouseType: () => void;
}

interface TagBoxProps {
    children: React.ReactNode;
}


const TagBox: React.FC<TagBoxProps> = ({ children }) => {
    return <Typography sx={{ borderRadius: 4, backgroundColor: '#e9e9e9', p: '0 10px', fontSize: '0.75rem' }}>
        {children}</Typography>
}

export const TagP: React.FC<TagPProps> = ({ status, ChangeStatusTagP, warehouses_selected,
    setWarehouses_selected, warehouses_list, noDataWEBP, warehousesFilterType, HandleFlipWarehouseType }) => {

    const AddElementToList = (name: string) => {
        setWarehouses_selected((prev: string[]) => {
            const copy = [...prev];
            if (prev) {
                if (!prev.includes(name)) {
                    return [...copy, name]
                } else {
                    const index = copy.indexOf(name);
                    copy.splice(index, 1)
                    return copy;
                }
            }
            return copy;
        })
    }

    return <Backdrop open={status} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Stack sx={{ width: '40%', maxHeight: '60%', borderRadius: 5, transition: 'all 200ms ease-in', p: 2, backgroundColor: '#fff' }}>
            <Stack direction='row' alignItems='center' mb={2}>
                <Typography color='#000' sx={{ fontSize: '1rem', fontWeight: 'bold' }}>Filtro Magazzini</Typography>
                <RadioGroup
                    sx={{ marginLeft: '1rem' }}
                    row
                    value={warehousesFilterType}
                    onChange={HandleFlipWarehouseType}
                >
                    <FormControlLabel
                        sx={{ margin: 0 }}
                        value={0}
                        control={<Radio />}
                        label="Filtra"
                    />
                    <Divider orientation='vertical' sx={{ height: 40, backgroundColor: '#000' }} />
                    <FormControlLabel
                        sx={{ margin: 0 }}
                        value={1}
                        control={<Radio />}
                        label="Aggiungi"
                        labelPlacement="start"
                    /></RadioGroup>
                <IconButton sx={{ ml: 'auto' }} onClick={() => ChangeStatusTagP()}>
                    {icon_close()}
                </IconButton>
            </Stack>

            <FormControl fullWidth sx={{ marginBottom: 1 }}>
                <InputLabel id="demo-multiple-checkbox-label">Lista</InputLabel>
                <Select
                    disabled
                    labelId="demo-multiple-checkbox-label"
                    id="demo-multiple-checkbox"
                    value={warehouses_selected}
                    input={<OutlinedInput sx={{ height: 40, backgroundColor: '#fff' }} label="Lista" />}
                    renderValue={(selected) => {
                        return <Stack direction='row' gap={0.3}>{selected.map((name, index) => (
                            <TagBox key={index}>{name}</TagBox>
                        ))}</Stack>
                    }}
                />
            </FormControl>

            <PopupInfo title='Tags' body='seleziona uno o piu elementi per filtrare i prodotti con disponibilità provenienti dai magazzini selezionati'
                icon={icon_info({ color: '#327df7' })} close={false} />

            <Divider sx={{ width: '100%', backgroundColor: '#000' }} />
            <Stack sx={{ overflow: 'auto' }}>
                {warehouses_list.length > 0 ? warehouses_list.map((e: warehouseObject) => (
                    <MenuItem key={e.Nome} value={e.Codice} onClick={() => AddElementToList(e.Nome)}>
                        <Checkbox checked={warehouses_selected.includes(e.Nome)} />
                        <Typography sx={{ fontSize: '1rem' }}>{e.Codice + " - " + e.Nome}</Typography>
                    </MenuItem>
                )) : <React.Fragment>
                    <img src={noDataWEBP} className='avoid-drag' loading='lazy' style={{
                        width: 300,
                        alignSelf: 'center', filter: "grayscale(1)", opacity: "0.4"
                    }} />
                    <Typography sx={{ fontSize: '0.94rem', color: '#ccc', alignSelf: 'center', fontWeight: 'bold' }}>Nessun Magazzino trovato.</Typography>
                </React.Fragment>}
            </Stack>

        </Stack></Backdrop>
}