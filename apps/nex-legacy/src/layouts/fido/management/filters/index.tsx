import React from 'react';

// @external components
import { Divider } from '@mui/material';
import { icon_download, icon_request, icon_search } from 'config/icons';

import { format } from 'date-fns';

// RIMOSSI: AdapterDateFns, LocalizationProvider, DatePicker
import { listOfRequestStatus } from 'layouts/fido/status';
import { ParamsDataAPI } from '../fetch/filters/parmsData';
import { SearchAPI } from '../fetch/filters/search';
import { GetDate, NumberToEuro } from 'utils/index';
import { MainTheme } from 'assets/settingsTheme';
import { DwdExcelAPI } from '../fetch/excel';
import { useTour } from "tour/TourProvider";

import { FDBox } from '@nex/fd-ui';
import FDSelect, { FDSelectOption } from 'components/UI/input/FDSelect';
import FDDate, { FDDateRangeValue } from 'components/UI/input/FDDate';
import FDIconButton from 'components/UI/buttons/FDIconButton';
import { useNexTheme } from '@nex/theme-system';

interface ArrayDataProps {
    amministrativi: Array<any>;
    commerciali: Array<any>;
}
interface FiltersBarProps {
    userContext: any;
    totalNumber: number;
    euroTotal: any;

    setData: (prev: any) => void;
    setLoadState: (prev: boolean) => void;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
    userContext,
    totalNumber = 0,
    euroTotal = 0,
    setData,
    setLoadState,
}) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    // Abort il panding del fetch all server
    const abortController = React.useRef<AbortController | null>(null);
    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
            abortController.current = null; // Reset after abort
        }
    };

    const [arrayData, setSelectsData] = React.useState<ArrayDataProps>({
        amministrativi: [],
        commerciali: [],
    });
    const [stateSelected, setStateSelected] = React.useState<string | number>('');
    const [userSelected_Amministrativi, setUserSelected_Amministrativi] =
        React.useState<string | number>('');
    const [userSelected_Commerciali, setUserSelected_Commerciali] =
        React.useState<string | number>('');

    const [dateRangeStatus, setDateRangeStatus] =
        React.useState<boolean>(false);
    const ChangeDateRangeStatus = () =>
        setDateRangeStatus(!dateRangeStatus);

    const [dateState, setDateState] = React.useState({
        da: format(new Date('2025-01-01'), 'yyyy-MM-dd'),
        a: format(new Date(GetDate().today), 'yyyy-MM-dd'),
    });

    React.useEffect(() => {
        FetchParams();
        return () => cancelRequest();
    }, []);

    // nuovo handler per FDDate in modalità range
    const handleDateRangeFD = React.useCallback(
        (range: FDDateRangeValue) => {
            setDateState(prev => ({
                da: range.from ?? '',
                a: range.to ?? '',
            }));
        },
        []
    );

    const FetchParams = () => {
        setLoadState(true);
        ParamsDataAPI({
            userContext,
            abortController,
            setData: setSelectsData,
            setLoadState,
        });
    };

    const Search = () => {
        setLoadState(true);
        const searchParam = {
            state: stateSelected,
            amm:
                arrayData.amministrativi[
                    userSelected_Amministrativi as number
                ]?._id || null,
            com:
                arrayData.commerciali[
                    userSelected_Commerciali as number
                ]?._id || null,
            dateRange: dateRangeStatus
                ? {
                    da: new Date(dateState.da),
                    a: new Date(dateState.a).setHours(23, 59, 59, 999),
                }
                : null,
        };
        SearchAPI({
            userContext,
            abortController,
            setData,
            searchParam,
            setLoadState,
        });
    };

    const DwdExcel = () => {
        DwdExcelAPI(userContext, abortController);
    };

    // helpers per costruire le options (mantengo value = indice; '' = Nessuno)
    const toOptions = React.useCallback(
        (items: any[], labelKeys?: string[]): FDSelectOption<string | number>[] => {
            const labelFromItem = (item: any) => {
                if (labelKeys?.length) {
                    return labelKeys
                        .map((k) => String(item?.[k] ?? ''))
                        .filter(Boolean)
                        .join(' ');
                }
                return String(item);
            };
            const base: FDSelectOption<string | number>[] = [];
            const mapped = items.map((it, idx) => ({ value: idx, label: labelFromItem(it) }));
            return [...base, ...mapped];
        },
        []
    );

    const statiOptions = React.useMemo(
        () => toOptions([...listOfRequestStatus, 'tutti']),
        [toOptions]
    );
    const ammOptions = React.useMemo(
        () => toOptions(arrayData.amministrativi, ['nome', 'cognome']),
        [toOptions, arrayData.amministrativi]
    );
    const comOptions = React.useMemo(
        () => toOptions(arrayData.commerciali, ['nome', 'cognome']),
        [toOptions, arrayData.commerciali]
    );

    const { isOpen, index: tourIndex } = useTour();
    const lockInteractions = isOpen && tourIndex === 1;

    return (
        <FDBox
            className="flex items-center flex-col gap-3"
            pad="md"
            radius="xl"
        >
            <div className='flex gap-3 w-full items-center' data-tour="barra-filtri-sac">
                <FDSelect
                    label="Stati"
                    options={statiOptions}
                    value={stateSelected}
                    onChange={(v) => setStateSelected(v as string | number)}
                    placeholder=""
                    fullWidth
                    size="md"
                    variant="outline"
                    radius="xl"
                    containerClassName="w-[10rem]"
                    clearable
                />
                {lockInteractions && (
                    <div
                        aria-hidden="true"
                        style={{
                            position: 'absolute',
                            inset: 0,
                            zIndex: 10,
                            pointerEvents: 'auto',
                        }}
                        onClickCapture={(e) => e.stopPropagation()}
                    />
                )}
                <FDSelect
                    label="Amministrativi"
                    options={ammOptions}
                    value={userSelected_Amministrativi}
                    onChange={(v) => setUserSelected_Amministrativi(v as string | number)}
                    placeholder=""
                    fullWidth
                    size="md"
                    variant="outline"
                    radius="xl"
                    containerClassName="w-[10rem]"
                    loading={!arrayData.amministrativi.length}
                    clearable
                    searchable
                />
                <FDSelect
                    label="Commerciali"
                    options={comOptions}
                    value={userSelected_Commerciali}
                    onChange={(v) => setUserSelected_Commerciali(v as string | number)}
                    placeholder=""
                    fullWidth
                    size="md"
                    variant="outline"
                    radius="xl"
                    containerClassName="w-[10rem]"
                    loading={!arrayData.commerciali.length}
                    clearable
                    searchable
                />
            </div>

            <div className='flex w-full justify-between flex-col md:flex-row gap-3'>
                <div className='flex gap-3 w-full items-center' data-tour="barra-filtri-data">
                    <input
                        type="checkbox"
                        checked={dateRangeStatus}
                        onChange={ChangeDateRangeStatus}
                        className="
                          h-4 w-4
                          rounded-md
                          border border-neutral-300 dark:border-neutral-600
                          accent-blue-600 dark:accent-yellow-500
                          bg-white dark:bg-neutral-800
                          transition
                          hover:border-neutral-400 dark:hover:border-neutral-500
                          focus:outline-none focus:ring-2 focus:ring-yellow-500/40
                          disabled:opacity-60 disabled:cursor-not-allowed
                        "
                        data-tooltip-id='general-fido-tooltip'
                        data-tooltip-content="Attiva il filtro per data"
                    />

                    <FDDate
                        range
                        fromLabel="Da"
                        toLabel="A"
                        value={{ from: dateState.da || undefined, to: dateState.a || undefined }}
                        onChange={handleDateRangeFD}
                        disabled={!dateRangeStatus}
                        fullWidth
                        size="md"
                        variant="outline"
                        color="neutral"
                        radius="xl"
                        clearable
                    />
                </div>

                <div className='flex gap-3 items-center w-full flex-end justify-between md:justify-end' data-tour="barra-filtri-view">
                    <div className='flex items-center'>
                        <div className='flex gap-1 items-center'>
                            {icon_request({ width: 20, height: 20 })}
                            <span className="text-[0.9rem]">
                                {NumberToEuro({ convert: euroTotal })}
                            </span>
                        </div>
                        <Divider
                            orientation="vertical"
                            sx={{
                                backgroundColor: `${darkMode ? palette.grey[500] : palette.black.main}`,
                                height: 40,
                            }}
                        />
                        <span className="text-[0.9rem]">{totalNumber} risultati</span>

                        <Divider
                            orientation="vertical"
                            sx={{
                                backgroundColor: `${darkMode ? palette.grey[500] : palette.black.main}`,
                                height: 40,
                            }}
                            className="hidden md:block"
                        />
                    </div>
                    <div className='flex items-center'>
                        <FDIconButton
                            icon={icon_download({ width: 20, height: 20 })}
                            dataTooltipId='general-fido-tooltip'
                            dataTooltipContent='Download Excel Indicatori'
                            onClick={() => DwdExcel()}
                        />

                        <FDIconButton
                            icon={icon_search({ width: 20, height: 20 })}
                            dataTooltipId='general-fido-tooltip'
                            dataTooltipContent="Esegui la ricerca"
                            onClick={() => Search()}
                        />
                    </div>
                </div>
            </div>
        </FDBox>
    );
};
