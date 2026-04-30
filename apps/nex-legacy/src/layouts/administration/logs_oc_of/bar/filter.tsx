import React, { EventHandler } from 'react';

import {
    Card,
    Divider, FormControl, IconButton,
    InputLabel, MenuItem, Select, Stack,
    TextField
} from '@mui/material';

import { icon_Shuffle, icon_all, icon_filter, icon_request, icon_reset, icon_search, icon_update } from 'config/icons';


interface ParamProps {
    tp: number; // se è di tipo OC = 0 || OF = 1
    ord: string; // numero dell'ordine
    car: string; //codice articolo
    ops: number; // 1 => update | 2 => insert | 3 = delete, parametro di ricerca 
}



interface SelectUIProps {
    title: string;
    value: string | number;
    onChange: ({ from, event }: { from: string, event: any }) => void;
    items: Array<string>;
    nameFromParams: string;
    sx?: any
};
const SelectUI: React.FC<SelectUIProps> = ({ title, value, nameFromParams, onChange, items, sx }) => (
    <FormControl sx={{ height: 45, width: 100, ...sx }}>
        <InputLabel id="select-label">{title}</InputLabel>
        <Select
            labelId="select-label"
            sx={{ height: '100%' }}
            value={value}
            label={title}
            onChange={(e: any) => onChange({ from: nameFromParams, event: e })}
        >
            {items.map((data: string, index: number) => (
                <MenuItem value={index} key={index}>{data}</MenuItem>
            ))}
        </Select>
    </FormControl>
)



interface TextFieldUIProps {
    title: string;
    value: string | number;
    onChange: ({ from, event }: { from: string, event: any }) => void;
    nameFromParams: string;
    sx?: any
};
const TextFieldUI: React.FC<TextFieldUIProps> = ({ title, value, nameFromParams, onChange, sx }) => (
    <TextField sx={sx} label={title} variant="outlined" value={value}
        onChange={(e: any) => onChange({ from: nameFromParams, event: e })} />
)



interface FilterPanelProps {
    params: ParamProps;
    setParams: (prev: any) => void;
    SendRequestAPI: (firstCall: boolean) => void;
}
export const FiltersPanel: React.FC<FilterPanelProps> = ({ params, setParams, SendRequestAPI }) => {
    const HandleParamsData = ({ from, event }: { from: string, event: any }) => {
        const value = event.target.value;
        setParams((prev: any) => {
            return { ...prev, [from]: value };
        });
    };


    const ResetCall = () => {
        setParams((prev: any) => {
            return { ...prev, car: "", ord: "" }
        });
        SendRequestAPI(true)
    }

    return <Card><Stack p={1} sx={{ borderRadius: 4 }} direction='row'
        alignItems="center" translate="no" height='100%'>
        {icon_filter({ mr: 1.5, })}
        <Stack direction='row' gap={2}>
            <TextFieldUI title='*Cod.Articolo' value={params.car}
                nameFromParams='car' onChange={HandleParamsData} />

            <TextFieldUI title='Num.Ordine' value={params.ord}
                nameFromParams='ord' onChange={HandleParamsData} />

            <SelectUI title='Tipo Logs' value={params.tp} nameFromParams={'tp'}
                onChange={HandleParamsData} items={['OC', 'FB']} />

            <SelectUI title='Tipo Operazione' value={params.ops} nameFromParams={'ops'}
                onChange={HandleParamsData} items={['Update', 'Insert', 'Delete', 'Nessun Valore', 'Tutti']} sx={{ width: 150 }} />

        </Stack>

        <Stack direction='row' ml='auto' height='100%'>
            <Divider orientation='vertical'
                sx={{ height: '100%', width: '1px', backgroundColor: '#ccc' }} />
            <IconButton data-tooltip-id="general-compare-tooltip" onClick={() => ResetCall()}
                data-tooltip-content='Reset delle proprietà'>
                {icon_update()}</IconButton>
            <IconButton data-tooltip-id="general-compare-tooltip" onClick={() => SendRequestAPI(false)}
                data-tooltip-content='Cerca i prodotti'>
                {icon_search()}</IconButton>
        </Stack>

    </Stack></Card>
};