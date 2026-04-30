import React from 'react';

import {
    Card,
    Divider, FormControl, IconButton,
    InputLabel, MenuItem, Select, Stack,
    TextField
} from '@mui/material';

import { icon_filter, icon_search, icon_update } from 'config/icons';
import { Select_ } from 'components/Select';
import { useGeneralDataContext } from 'context/GeneralDataContext';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { it } from 'date-fns/locale';
import { format } from 'date-fns';
import { GetDate } from 'utils/index';

interface ParamProps {
    by: string | number;
    cd: string; //codice articolo
    ls: string; //codice listino
    yy: {
        da: any;
        a: any
    };
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
    const { globalData } = useGeneralDataContext();

    const HandleParamsData = ({ from, event }: { from: string, event: any }) => {
        const value = event.target.value;
        setParams((prev: any) => ({ ...prev, [from]: value }));
    };

    const handleFilterChange = (from: string, e: any) => {
        const composeDate = format(new Date(e), 'yyyy-MM-dd');
        setParams((prev: ParamProps) => ({ ...prev, yy: { ...prev.yy, [from]: composeDate } }));
    };

    const ResetCall = () => {
        setParams((prev: any) => ({ ...prev, car: "", ord: "" }));
        SendRequestAPI(true);
    };

    // -----------------------------
    // valori primitivi per i Select_
    // -----------------------------
    const buyerIdx = React.useMemo(
        () => globalData.buyers.findIndex((e: any) => e?.codici?.agente == params.by),
        [globalData.buyers, params.by]
    );
    const buyerValue: string | number =
        buyerIdx >= 0 ? (globalData.buyers[buyerIdx]?.codici?.buyer ?? '') : '';

    const plIdx = React.useMemo(
        () => globalData.pricesLists.findIndex((e: any) => e?.codice == params.ls),
        [globalData.pricesLists, params.ls]
    );
    const plValue: string | number =
        plIdx >= 0 ? (globalData.pricesLists[plIdx]?.codice ?? '') : '';

    return (
        <Card>
            <Stack p={1} sx={{ borderRadius: 4 }} direction='row'
                alignItems="center" translate="no" height='100%'>
                {icon_filter({ mr: 1.5, })}
                <Stack direction='row' gap={2} height='100%'>
                    <TextFieldUI
                        title='Cod.Articolo'
                        value={params.cd}
                        nameFromParams='cd'
                        onChange={HandleParamsData}
                    />

                    <Select_
                        label='Buyer'
                        value={buyerValue}
                        propToTakeFromData={['nome', 'cognome']}
                        onChange={(val: string | number) => {
                            const i = typeof val === 'number'
                                ? val
                                : globalData.buyers.findIndex((e: any) => e?.codici?.agente == val);
                            HandleParamsData({
                                from: 'by',
                                event: { target: { value: (globalData.buyers[i]?.codici?.buyer ?? '') } }
                            });
                        }}
                        items={globalData.buyers}
                    />

                    <Select_
                        label='Listino'
                        value={plValue}
                        propToTakeFromData={['descrizione']}
                        onChange={(val: string | number) => {
                            const i = typeof val === 'number'
                                ? val
                                : globalData.pricesLists.findIndex((e: any) => e?.codice == val);
                            HandleParamsData({
                                from: 'ls',
                                event: { target: { value: (globalData.pricesLists[i]?.codice ?? '') } }
                            });
                        }}
                        items={globalData.pricesLists}
                    />

                    <Divider orientation='vertical'
                        sx={{ height: '100%', width: '1px', backgroundColor: '#ccc' }} />

                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
                        <DatePicker
                            defaultValue={new Date(params.yy.da)}
                            onChange={e => handleFilterChange('da', e)}
                            maxDate={new Date(GetDate().today)} />
                        -
                        <DatePicker
                            defaultValue={new Date(params.yy.a)}
                            onChange={e => handleFilterChange('a', e)}
                            maxDate={new Date(GetDate().today)} />
                    </LocalizationProvider>

                </Stack>

                <Stack direction='row' ml='auto' height='100%'>
                    <Divider orientation='vertical'
                        sx={{ height: '100%', width: '1px', backgroundColor: '#ccc' }} />
                    <IconButton data-tooltip-id="general-compare-tooltip" onClick={() => ResetCall()}
                        data-tooltip-content='Reset delle proprietà'>
                        {icon_update()}
                    </IconButton>
                    <IconButton data-tooltip-id="general-compare-tooltip" onClick={() => SendRequestAPI(false)}
                        data-tooltip-content='Cerca i prodotti'>
                        {icon_search()}
                    </IconButton>
                </Stack>

            </Stack>
        </Card>
    );
};
