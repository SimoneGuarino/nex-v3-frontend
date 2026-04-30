import React from 'react';

// @external components
import {
    Card,
    Checkbox,
    Divider, Fade, FormControl,
    InputLabel, MenuItem, Select, Skeleton, Stack,
    Typography
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { it } from 'date-fns/locale';
import { format } from 'date-fns';

import theme from 'assets/theme';
import { icon_request, icon_search } from 'config/icons';
import { statusList } from '../../../statusToColor';
import { GetDate, NumberToEuro } from 'utils/index';
import { TableDataAPI } from '../../fetchData/tableData';
import { CustomersAPI } from 'layouts/ordini/sbloccoOrdini/requests/fetchData/customers';
import { Tag } from 'components/Tag/Tag';
import { MainTheme } from 'assets/settingsTheme';
import { useGeneralDataContext } from 'context/GeneralDataContext';
import MDTypography from 'components/MDTypography';
import { useNexTheme } from '@nex/theme-system';


interface SearchParam {
    stato: any;
    com: string | null;
    amm: string | null;
    cli: string | number | null;
    dateRange: {
        da: any;
        a: any;
    } | null;
};

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
}


interface ArrayDataProps {
    amministrativi: Array<any>;
    commerciali: Array<any>;
    customersFromRequest: Array<any>;
}
interface FiltersBarProps {
    tableTotalData: number;
    loadedNumberData: number;
    ofs: any;
    stateSelected: any;
    userSelected_Amministrativi: any;
    userSelected_Commerciali: any;
    userSelected_Clienti: any;
    dateRangeStatus: any;
    dateState: any;
    setUserSelected_Commerciali: (prev: any) => void;
    setUserSelected_Clienti: (prev: any) => void;
    setDateState: (prev: any) => void;
    ChangeDateRangeStatus: () => void;
    setStateSelected: (prev: any) => void;
    setArrayData: (prev: any) => void;
    setTableTotalData: (prev: number) => void;

    arrayData: ArrayDataProps;
    userContext: any;
    onLoadFilters: boolean;
    onLoad: boolean;
    tableEuroTotal: number;

    setData: (prev: any) => void;
    seOnLoadFilters: (prev: boolean) => void;
    setErr: (prev: boolean) => void;
    setOnLoad: (prev: boolean) => void;
    setTableEuroTotal: (prev: number) => void;
};
export const FiltersBar: React.FC<FiltersBarProps> = ({ userContext, onLoadFilters, setData,
    seOnLoadFilters, setErr, setOnLoad, onLoad, ofs, tableTotalData, loadedNumberData, tableEuroTotal,
    setArrayData,
    arrayData,
    stateSelected,
    userSelected_Amministrativi,
    userSelected_Commerciali,
    userSelected_Clienti,
    dateRangeStatus,
    dateState,
    setDateState,
    setUserSelected_Commerciali,
    setUserSelected_Clienti,
    ChangeDateRangeStatus,
    setStateSelected,
    setTableTotalData,
    setTableEuroTotal
}) => {
    const { globalData, setGlobalData } = useGeneralDataContext();

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

    //Storicizza il dato all'interno dello useState in modo ta poi utilizzarlo per
    //le scelte filtro utente.
    const handleFilterChange = React.useCallback((from: string, date: any) => {
        if (date instanceof Date && !isNaN(date.getTime())) {
            const formattedDate = format(date, 'yyyy-MM-dd');
            setDateState((prev: any) => ({ ...prev, [from]: formattedDate }));
        } else {
            // Se l'utente cancella la data, impostiamo un valore di default o la rimuoviamo
            setDateState((prev: any) => ({ ...prev, [from]: "" }));
        }
    }, []);

    const FetchParams = () => {
        seOnLoadFilters(true);
        //attualmente vengono richiamati solo i clienti come parametro dal DB
        CustomersAPI({
            userContext, abortController, setData: setArrayData,
            setErr, setOnLoad: seOnLoadFilters
        });

    };

    const Search = () => {
        setOnLoad(true);
        ofs.current = 0;

        const searchParam: SearchParam = {
            stato: ((stateSelected as number) !== undefined && stateSelected !== "") ? stateSelected : null,
            amm: (arrayData.amministrativi[(userSelected_Amministrativi as number)]?._id || null),
            com: ((globalData?.agents || arrayData.commerciali)[(userSelected_Commerciali as number)]?.username || null),
            cli: (userSelected_Clienti !== undefined || arrayData?.customersFromRequest) ? arrayData.customersFromRequest[(userSelected_Clienti as number)]?.codiceCliente?.Focelda : null,
            dateRange: dateRangeStatus ?
                { da: new Date(dateState.da), a: new Date(dateState.a).setHours(23, 59, 59, 999) }
                : null,
        };
        //invia la ricerca per filtrare i parametri
        TableDataAPI({
            userContext, abortController, setTableData: setData, setErr, setOnLoad,
            setTableTotalData, setTableEuroTotal, searchParam, ofs
        });
    };

    const styleDataPicker = {
        width: 170,
        "& .MuiOutlinedInput-root div button": { color: `${darkMode ? palette.grey[600] : ''}` }
    }



    return <Fade in={true} timeout={1000}>
        <Card sx={{ p: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 3, background: `${darkMode && palette.dark.main}` }}>
            <Stack direction='row' gap={1} flexWrap='wrap' data-tour="sblocco-amm-filters-scc">
                <GenSelect label='Stati' value={stateSelected} onChange={setStateSelected} items={[...statusList, 'tutti']} onLoadFilters={onLoadFilters} />
                <GenSelect label='Commerciali' value={userSelected_Commerciali} propToTakeFromData={['nome', 'cognome']}
                    onChange={setUserSelected_Commerciali} items={(globalData as any).agents || []} onLoadFilters={onLoadFilters} />
                <GenSelect label='Clienti' value={userSelected_Clienti} propToTakeFromData={['ragioneSociale']}
                    onChange={setUserSelected_Clienti} items={arrayData.customersFromRequest} onLoadFilters={onLoadFilters} />
                <Divider orientation='vertical' sx={{ backgroundColor: `${darkMode ? palette.grey[500] : palette.black.main}`, height: 40, }} />
            </Stack>

            <Stack direction='row' gap={1} alignItems='center' data-tour="sblocco-amm-filters-date">
                <Checkbox className='checkbox-suppliers' checked={dateRangeStatus} onChange={() => ChangeDateRangeStatus()} color="secondary" />
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
                    <DatePicker
                        disabled={!dateRangeStatus}
                        sx={!dateRangeStatus ? {
                            backgroundColor: `${darkMode ? palette.grey[700] : palette.grey[400]}`,
                            width: 170, borderRadius: 2, opacity: 0.8
                        } : styleDataPicker}
                        defaultValue={new Date(dateState.da)}
                        onChange={e => handleFilterChange('da', e)}
                        maxDate={new Date(GetDate().today)} />
                    <MDTypography variant='body1'>-</MDTypography>
                    <DatePicker
                        sx={!dateRangeStatus ? {
                            backgroundColor: `${darkMode ? palette.grey[700] : palette.grey[400]}`,
                            width: 170, borderRadius: 2, opacity: 0.8
                        } : styleDataPicker}
                        disabled={!dateRangeStatus}
                        defaultValue={new Date(dateState.a)}
                        onChange={e => handleFilterChange('a', e)}
                        maxDate={new Date(GetDate().today)} />
                </LocalizationProvider>
            </Stack>

            <Stack direction='row' sx={{ ml: 'auto', alignItems: 'center' }} data-tour="sblocco-amm-filters-search">
                <Divider orientation='vertical' sx={{ backgroundColor: `${darkMode ? palette.grey[500] : palette.black.main}`, height: 40, }} />

                <Stack alignItems='center' direction='row'>
                    <Stack direction='row' gap={0.5} alignItems='center'
                        data-tooltip-id='general-confg-suppliers-tooltip' data-tooltip-content='Somma Totale degli ordini'>
                        {icon_request({ width: 20, height: 20 })}
                        <MDTypography variant='body2' fontSize='0.9rem'>
                            {NumberToEuro({ convert: tableEuroTotal })}
                        </MDTypography>
                    </Stack>
                    <Divider orientation='vertical' sx={{ backgroundColor: `${darkMode ? palette.grey[500] : palette.black.main}`, height: 40, }} />
                    <MDTypography variant='body2' fontSize='0.9rem'>
                        {loadedNumberData} di {tableTotalData}
                    </MDTypography>
                </Stack>

                <Divider orientation='vertical' sx={{ backgroundColor: `${darkMode ? palette.grey[500] : palette.black.main}`, height: 40, }} />
                <LoadingButton loading={onLoad}
                    sx={{
                        backgroundColor: `${darkMode ? theme.palette.grey[800] : theme.palette.grey[200]}`,
                        borderRadius: 10, minWidth: 40, padding: 0
                    }} onClick={() => Search()}>
                    {icon_search({ width: 25, height: 25 })}
                </LoadingButton>
            </Stack>
        </Card>
    </Fade>
}