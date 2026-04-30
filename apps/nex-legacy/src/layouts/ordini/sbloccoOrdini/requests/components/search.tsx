import React from 'react';

import { Autocomplete, Card, Stack, TextField } from '@mui/material';
import { icon_travelExplore } from 'config/icons';
import { ExitinigOrderAPI, FindOrderAPI } from '../fetchData/findOrder';
import { enqueueSnackbar } from 'components/MessageBox';
import { CustomersOrdersAPI } from '../fetchData/customersOrders';
import { UserState } from 'types/UserContext';
import Popper, { PopperProps } from '@mui/material/Popper';

import { MdSearch } from 'react-icons/md';
import { IoReturnDownBack } from "react-icons/io5";
import FDIconButton from 'components/UI/buttons/FDIconButton';

const MdSearchIcon = MdSearch as React.FC<{ size?: number; className?: string }>;
const IoReturnDownBackIcon = IoReturnDownBack as React.FC<{ size?: number; className?: string }>;
const TourPopper = (props: PopperProps) => (
    <Popper {...props} data-tour-allow />
);


interface ArrayDataProps {
    customers: Array<any>;
};

interface SearchProps {
    userContext: UserState
    onLoad: boolean;
    customersList: ArrayDataProps;
    abortController: React.MutableRefObject<AbortController | null>;
    showGoBack: boolean;
    searchForSingleItem?: React.MutableRefObject<boolean>;
    GoBack: () => void;

    setGeneralDataOrders: (prev: any) => void;
    setGeneralData: (prev: any) => void;
    setOnLoad: (prev: boolean) => void;
    setErr: (prev: boolean) => void;
    setTableData: (prev: any) => void;
    setFBAlreadyInRequest: (prev: boolean) => void;
    onFbSearchErrorDuringTour?: () => void;
    saveLastDetailForTour: (data: { groupData?: any; singleData?: any }) => void;
}

export const Search: React.FC<SearchProps> = ({
    userContext, onLoad, customersList, setGeneralDataOrders, setOnLoad, searchForSingleItem,
    setErr, setGeneralData, setTableData, setFBAlreadyInRequest, abortController, GoBack, showGoBack, onFbSearchErrorDuringTour, saveLastDetailForTour }) => {
    const [customersCode, setCustomersCode] = React.useState<string | null>(null);

    const [handleOrderNumber, setHandleOrderNumber] = React.useState<string>("");

    const Search = () => {
        if (!customersCode && (!handleOrderNumber || handleOrderNumber.trim() === "")) {
            onFbSearchErrorDuringTour?.();
            return enqueueSnackbar("Per favore inserisci un Numero FB o seleziona un Cliente, prima di poter fare una ricerca.", {
                title: 'Nessun parametro di ricerca inserito.',
                type: 'warning',
            });
        };

        setGeneralData(null);
        setTableData([]);
        setGeneralDataOrders(null);
        setFBAlreadyInRequest(false);

        setOnLoad(true);

        if (handleOrderNumber && handleOrderNumber?.trim() !== "") {
            ExitinigOrderAPI({
                userContext, abortController, setFBAlreadyInRequest,
                setErr, nord: handleOrderNumber
            });
            return FindOrderAPI({
                userContext, abortController, setGeneralData: setGeneralData, setTableData: setTableData,
                setErr, setOnLoad, nord: handleOrderNumber,
                handleComplete: ({ singleData }) => { saveLastDetailForTour({singleData}); searchForSingleItem && (searchForSingleItem.current = true); }
            });
        } else if (customersCode && customersCode?.trim() !== "") {
            return CustomersOrdersAPI({
                userContext, abortController, setGeneralDataOrders,
                setOnLoad: setOnLoad, csc: customersCode, onFbSearchErrorDuringTour,
                handleComplete: ({ groupData }) => { saveLastDetailForTour({groupData}); searchForSingleItem && (searchForSingleItem.current = false); }
            });
        } else {
            onFbSearchErrorDuringTour?.();
            return enqueueSnackbar("Per favore inserisci un Numero FB valido, prima di poter fare una ricerca.", {
                title: 'Numero FB non valido.',
                type: 'warning',
            });
        };
    };

    return <Stack gap={1}>
        <Card>
            <Stack direction='row' gap={2} sx={{
                pl: 1, pr: 1, alignItems: 'center',
                borderRadius: 5, minHeight: 50,
            }}>
                {icon_travelExplore({ width: 30, height: 30 })}
                <Autocomplete
                    PopperComponent={TourPopper}
                    data-tour-allow
                    data-tour="sblocco-comm-search-cust"
                    sx={{ width: '100%', height: 42, '& .MuiInputBase-root': { height: '100%' } }}
                    disableListWrap
                    value={customersCode ?
                        customersList.customers.find((x: { CodiceCliente: { Focelda: string } }) => x.CodiceCliente.Focelda === customersCode)
                        : null}
                    options={customersList.customers || []}
                    renderInput={(params: any) => (
                        <TextField {...params} label="Clienti" translate="no" sx={{ height: '100%' }} />
                    )}
                    getOptionLabel={(option: any) => option.RagioneSociale}
                    onChange={(_: any, value: any) => {
                        if (handleOrderNumber) {
                            setHandleOrderNumber("");
                        }
                        // Verifica che l'elemento selezionato non sia nullo
                        if (value) {
                            setCustomersCode(value.CodiceCliente.Focelda);
                        } else {
                            setCustomersCode(null);
                        }
                    }}
                />
                <TextField
                    data-tour="sblocco-comm-search-nfb"
                    id="outlined-controlled"
                    label="Numero FB Focelda"
                    fullWidth
                    value={handleOrderNumber}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        if (customersCode) {
                            setCustomersCode(null);
                        };
                        setHandleOrderNumber(event.target.value);
                    }}
                />
                <div className='flex space-x-2'>
                    {showGoBack && <FDIconButton variant='text' rounded='md' dataTour="sblocco-comm-back"
                        dataTooltipContent='Ricerca Mirata' dataTooltipId='general-documents-tooltip'
                        className='border border-neutral-200 dark:border-neutral-800'
                        onClick={GoBack} icon={<IoReturnDownBackIcon size={18} />} />}

                    <FDIconButton variant='text' rounded='md' disabled={onLoad} dataTour="sblocco-comm-details"
                        dataTooltipContent='Ricerca Mirata' dataTooltipId='general-documents-tooltip'
                        className='border border-neutral-200 dark:border-neutral-800'
                        onClick={Search} icon={<MdSearchIcon size={18} />} />
                </div>
            </Stack>
        </Card>
    </Stack>
}