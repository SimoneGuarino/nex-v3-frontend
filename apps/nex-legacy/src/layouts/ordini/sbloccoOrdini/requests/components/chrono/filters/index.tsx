import React from 'react';

// @external components
import {
    Card,
    Checkbox,
    Divider, Fade, FormControl, IconButton,
    InputLabel, MenuItem, Select, Skeleton, Stack,
    Typography
} from '@mui/material';
import { icon_request, icon_search } from 'config/icons';

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { it } from 'date-fns/locale';
import { format } from 'date-fns';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { GetDate, NumberToEuro } from 'utils/index';
import { statusList } from 'layouts/ordini/sbloccoOrdini/statusToColor';
import { ChronoAPI } from '../../../fetchData/chronoData';
import { CustomersAPI } from '../../../fetchData/customers';
import { Tag } from 'components/Tag/Tag';
import { MainTheme } from 'assets/settingsTheme';
import MDTypography from 'components/MDTypography';
import { useNexTheme } from '@nex/theme-system';


interface GenSelectProps {
    label: string;
    value: string | number;
    onLoadFilters: boolean;
    onChange: (value: string | number) => void;
    items: Array<string>;
    width?: string;
    propToTakeFromData?: any;
};
const GenSelect: React.FC<GenSelectProps> = ({ label, propToTakeFromData, value, onChange, items, width, onLoadFilters }) => {
    return !onLoadFilters ?
        items.length > 0 ? <FormControl>
            <InputLabel>{label}</InputLabel>
            <Select
                id="data-select-typology"
                sx={{ height: 40, width: `${width ? width : '10rem'}` }}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                autoWidth
                label="Tipologia"
            >
                <MenuItem value={""}>
                    <Typography variant='body2' sx={{ display: 'flex', gap: 0.5 }}>
                        Nessuno</Typography>
                </MenuItem>
                {items.map((data: string, index: number) => (
                    <MenuItem value={index} key={index}>
                        <Typography variant='body2' sx={{ display: 'flex', gap: 0.5 }}>
                            {propToTakeFromData ?
                                propToTakeFromData.map((prop: any, y: number) => (
                                    <p key={y}>{data[prop]}</p>
                                ))
                                : data}</Typography>
                    </MenuItem>
                ))}
            </Select></FormControl> : <Stack alignItems='center' justifyContent='center'>
            <Tag text={`Non ci sono ${label}`} fontSize='0.8rem' />
        </Stack>
        :
        <Skeleton sx={{ width: `${width ? width : '10rem'}`, padding: 0 }} />
};


interface ArrayDataProps {
    customersFromRequest: Array<any>;
    customers: Array<any>;
};
interface FiltersBarProps {
    userContext: any;
    onLoadFilters: boolean;
    ofs: any;

    tableTotalData: number;
    loadedNumberData: number;
    tableEuroTotal: number;
    setTableEuroTotal: (prev: number) => void;
    setTableTotalData: (prev: number) => void;

    customersList: ArrayDataProps;
    stateSelected: any;
    dateRangeStatus: any;
    dateState: any;
    userSelected_Cliente: any;
    setDateState: (prev: any) => void;
    setCustomersList: (prev: any) => void;
    setStateSelected: (prev: any) => void;
    setUserSelected_Cliente: (prev: any) => void;
    ChangeDateRangeStatus: () => void;

    setData: (prev: any) => void;
    seOnLoadFilters: (prev: boolean) => void;
    setErr: (prev: boolean) => void;
    setOnLoadTable: (prev: boolean) => void;
};
export const FiltersBar: React.FC<FiltersBarProps> = ({ userContext, onLoadFilters, setData, ofs,
    seOnLoadFilters, setErr, setOnLoadTable, tableEuroTotal, loadedNumberData, tableTotalData,
    customersList,
    stateSelected,
    dateRangeStatus,
    dateState,
    userSelected_Cliente,
    setUserSelected_Cliente,
    setDateState,
    setCustomersList,
    setStateSelected,
    ChangeDateRangeStatus,
    setTableEuroTotal,
    setTableTotalData
}) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;


    // Abort il panding del fetch all server
    const abortController = React.useRef<AbortController | null>(null);
    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
        }
    };


    React.useEffect(() => {
        FetchParams();
        return () => cancelRequest();
    }, []);

    const handleFilterChange = React.useCallback((from: string, e: any) => {
        const composeDate = format(new Date(e), 'yyyy-MM-dd');
        setDateState((prev: any) => {
            return { ...prev, [from]: composeDate };
        });
    }, []);

    const FetchParams = () => {
        seOnLoadFilters(true);
        //richiama i parametri da dover visualizzare all'interno di ogni blocco
        CustomersAPI({ //attualmente vengono richiamati solo i clienti come parametro dal DB
            userContext, abortController, setData: setCustomersList,
            setErr, setOnLoad: seOnLoadFilters, com: userContext.details._id
        });
    };

    const Search = () => {
        setOnLoadTable(true);
        ofs.current = 0;

        const searchParam = {
            stato: ((stateSelected as number) !== undefined && stateSelected !== "") ? stateSelected : null,
            com: userContext.details.username,
            dateRange: dateRangeStatus ?
                { da: new Date(dateState.da), a: new Date(dateState.a).setHours(23, 59, 59, 999) }
                : null,
        };

        //invia la ricerca per filtrare i parametri
        ChronoAPI({
            userContext, abortController, setData, setErr,
            setOnLoad: setOnLoadTable, searchParam: searchParam, setTableTotalData, setTableEuroTotal, ofs
        });
    };




    return <Fade in={true}>
        <Card>
            <Stack direction='row' style={{ padding: 5, borderRadius: 15 }} alignItems='center' gap={3} data-tour="sblocco-comm-filters">
                <Stack direction='row' gap={1}>
                    <GenSelect label='Stati' value={stateSelected} onChange={setStateSelected} items={[...statusList, 'tutti']} onLoadFilters={onLoadFilters} />
                    <GenSelect label='Clienti' value={userSelected_Cliente} propToTakeFromData={['ragioneSociale']}
                        onChange={setUserSelected_Cliente} items={customersList.customersFromRequest} onLoadFilters={onLoadFilters} />
                    <Divider orientation='vertical' sx={{ backgroundColor: `${darkMode ? palette.grey[500] : palette.black.main}`, height: 40 }} />
                </Stack>

                <Stack direction='row' gap={1} alignItems='center'>
                    <Checkbox className='checkbox-suppliers' checked={dateRangeStatus} onChange={() => ChangeDateRangeStatus()} color="secondary" />
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
                        <DatePicker
                            sx={!dateRangeStatus ? {
                                backgroundColor: `${darkMode ? palette.grey[700] : palette.grey[400]}`,
                                borderRadius: 2, opacity: 0.8, width: 150
                            } : { width: 150 }}
                            disabled={!dateRangeStatus}
                            defaultValue={new Date(dateState.da)}
                            onChange={e => handleFilterChange('da', e)}
                            maxDate={new Date(GetDate().today)} />
                        <MDTypography variant='body1'>-</MDTypography>
                        <DatePicker
                            sx={!dateRangeStatus ? {
                                backgroundColor: `${darkMode ? palette.grey[700] : palette.grey[400]}`,
                                borderRadius: 2, opacity: 0.8, width: 150
                            } : { width: 150 }}
                            disabled={!dateRangeStatus}
                            defaultValue={new Date(dateState.a)}
                            onChange={e => handleFilterChange('a', e)}
                            maxDate={new Date(GetDate().today)} />
                    </LocalizationProvider>
                </Stack>

                <Stack direction='row' sx={{ ml: 'auto' }}>
                    <Divider orientation='vertical' sx={{ backgroundColor: `${darkMode ? palette.grey[500] : palette.black.main}`, height: 40 }} />

                    <Stack alignItems='center' direction='row'>
                        <Stack direction='row' gap={0.5} alignItems='center'
                            data-tooltip-id='general-confg-suppliers-tooltip' data-tooltip-content='Somma Totale degli ordini'>
                            {icon_request({ width: 20, height: 20 })}
                            <MDTypography variant='body2' fontSize='0.9rem'>
                                {NumberToEuro({ convert: tableEuroTotal })}
                            </MDTypography>
                        </Stack>
                        <Divider orientation='vertical' sx={{ backgroundColor: `${darkMode ? palette.grey[500] : palette.black.main}`, height: 40 }} />
                        <MDTypography variant='body2' fontSize='0.9rem'>
                            {loadedNumberData} di {tableTotalData}
                        </MDTypography>
                    </Stack>

                    <Divider orientation='vertical' sx={{ backgroundColor: `${darkMode ? palette.grey[500] : palette.black.main}`, height: 40 }} />
                    <IconButton sx={{ backgroundColor: `${darkMode ? palette.grey[800] : palette.grey[200]}` }} onClick={() => Search()}>
                        {icon_search()}
                    </IconButton>
                </Stack>
            </Stack>
        </Card>
    </Fade>
}