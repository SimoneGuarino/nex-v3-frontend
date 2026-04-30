import React, { Fragment } from 'react';
import { UserContext } from "context/UserContext";

import { Card, Divider, Fade, IconButton, Skeleton, Stack } from '@mui/material';

import { PopupInfo } from 'components/PopupInfo';
import LoadingButton from '@mui/lab/LoadingButton';
import { icon_search, icon_travelExplore, icon_request, icon_extraPanel, icon_back } from 'config/icons';
import CustomersAutocomplete from './customersAutocomplete';


import SearchCustomers from './searchCustomers/index.js';
import { ListCustomers } from '../fetch/list_customers_data';

import { useParams } from 'react-router-dom';
import { Tooltip } from 'react-tooltip';
import { enqueueSnackbar } from 'components/MessageBox';
import { MainTheme } from 'assets/settingsTheme';

import { useSectionTour } from 'tour/useSectionTour';
import { useNexTheme } from '@nex/theme-system';



export function FiltersFido({ abortController, setFidoStatusPanel,
    saerchStatus, setListOfCustomers, handleOpenReqFido, handleCloseReqFido, cancelMainRequest,
    data, setCustomerData,
    CustomerDataAPI,
    reqCustomersDataStatus,
    setReqCustomersDataStatus,
    customersSelected, setCustomersSelected,
    Payments,
    setStatusPanelContentDisabled,
    setStatusPanelCloseDisabled,
    setRequestPanelContentDisabled,
    setRequestPanelCloseDisabled,
    hasPendingFido,
    setTourOpen,
}) {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const { id } = useParams();

    const [lockedByTour, setLockedByTour] = React.useState(false);


    const [userContext, setUserContext] = React.useContext(UserContext);
    //stato che definisce la presenza dell'infobar
    const [info, setInfo] = React.useState(true);
    const handleChangeinfo = (event) => setInfo(false);
    //per abort controller
    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
        }
    };


    //tour-system
    const hasPendingFidoRef = React.useRef(!!hasPendingFido);
    hasPendingFidoRef.current = !!hasPendingFido;

    const lastStepRef = React.useRef(0);
    const later = (fn) => window.setTimeout(fn, 0);
    const jump = (skip, to) => later(() => skip?.(to));
    const PENDING_MSG = "Nota: per questo cliente risulta già una richiesta fido in corso; il tour salta la parte di richiesta.";

    // factory per gli step 7/8/9/10
    const stepReq = (step, { open = false, close = false, back = null, fwd = null } = {}) => (_curr, skip) => {
        const goingBack = lastStepRef.current > step;
        lastStepRef.current = step;
        const pending = !!hasPendingFidoRef.current;

        if (close) later(() => { handleCloseReqFido?.(); setFidoStatusPanel(false); });

        if (pending) {
            if (goingBack && back != null) return jump(skip, back);
            if (!goingBack && fwd != null) {
                jump(skip, fwd);
                return later(() => enqueueSnackbar(PENDING_MSG, { title: "Richiesta già presente", type: "info" }));
            }
            return;
        }

        if (open) later(() => handleOpenReqFido?.());
    };

    const tour = useSectionTour({
        id: 'nex_v2_fido',
        version: '2.0.0',
        user: {
            id: userContext?.details?._id ?? '',
            role: userContext?.details?.ruolo ?? 'Tester',
        },
        keys: 'fido',
        actions: {
            1: () => { lastStepRef.current = 1; setLockedByTour?.(false); cancelMainRequest?.(); setCustomerData?.(null); setFidoStatusPanel?.(false); setCustomersSelected?.(null); },
            2: (curr, skip) => { const goingBack = lastStepRef.current > 2; lastStepRef.current = 2; if (goingBack) return jump(skip, 1); setLockedByTour?.(false); cancelMainRequest?.(); setCustomerData?.(null); setFidoStatusPanel?.(false); setCustomersSelected?.(null); },
            3: () => { lastStepRef.current = 3; setLockedByTour?.(true); },
            4: () => { setLockedByTour?.(false); setFidoStatusPanel(false); },
            5: () => { setLockedByTour?.(false); setFidoStatusPanel(true); setStatusPanelContentDisabled?.(true); setStatusPanelCloseDisabled?.(true); setRequestPanelContentDisabled?.(false); setRequestPanelCloseDisabled?.(false) },
            6: () => { lastStepRef.current = 6; setStatusPanelContentDisabled?.(true); setStatusPanelCloseDisabled?.(false); setFidoStatusPanel(true); setRequestPanelContentDisabled?.(false); setRequestPanelCloseDisabled?.(false) },
            // 7 chiude pannelli; con pending: avanti → 10 (nessun back speciale)
            7: (curr, skip) => { stepReq(7, { close: true, fwd: 10 })(curr, skip); setRequestPanelContentDisabled?.(false); setRequestPanelCloseDisabled?.(false); },
            // 8/9 aprono modale se non pending; con pending: back → 6, avanti → 10
            8: (curr, skip) => { stepReq(8, { open: true, close: true, back: 6, fwd: 10 })(curr, skip); setRequestPanelContentDisabled?.(true); setRequestPanelCloseDisabled?.(true); },
            9: (curr, skip) => { stepReq(9, { open: true, close: true, back: 6, fwd: 10 })(curr, skip); setRequestPanelContentDisabled?.(true); setRequestPanelCloseDisabled?.(false); },
            // 10 solo chiusura
            10: (curr, skip) => { stepReq(10, { close: true })(curr, skip); setRequestPanelContentDisabled?.(false); setRequestPanelCloseDisabled?.(false); },
        }
    });

    const tourOpenRef = React.useRef(false);
    const isTourOpen = !!tour?.isOpen;
    if (tourOpenRef.current !== isTourOpen) {
        tourOpenRef.current = isTourOpen;
        setTourOpen?.(isTourOpen);

        if (!isTourOpen) {
            setRequestPanelContentDisabled?.(false);
            setRequestPanelCloseDisabled?.(false);
        }
    }

    //

    React.useEffect(() => {
        if (userContext.details === undefined) { return; }
        ListCustomersAPI();

        return () => {
            cancelRequest();
        }
    }, [userContext.details])

    React.useEffect(() => {
        if (!id) { return; }
        SendReq();
    }, [id])

    const ListCustomersAPI = React.useCallback(() => {
        if (data !== null && data.length > 0) { return; };
        ListCustomers(userContext, abortController, setListOfCustomers, setReqCustomersDataStatus);
    }, [userContext.details, abortController.current, data, reqCustomersDataStatus])

    const SendReq = React.useCallback(() => {
        if ((!id || (id && id.length !== 6))) {
            if ((customersSelected === '' || customersSelected == null)) {
                return enqueueSnackbar('Per poter visualizzare il profilo del cliente, perfavore selezionane almeno uno.', {
                    title: 'Cliente',
                    type: 'warning',
                });
            }
        }

        const idCustomerSelected = {
            CodiceCliente: id
        }
        setReqCustomersDataStatus(true);

        setCustomersSelected(() => { return (customersSelected || idCustomerSelected) });
        CustomerDataAPI((customersSelected || idCustomerSelected));
    }, [customersSelected])

    const SearchCustomersMEMO = React.useMemo(() => (
        <SearchCustomers data={data}
            setCustomersSelected={setCustomersSelected}
            customersSelectedMain={customersSelected}
            CustomerDataAPI={CustomerDataAPI}
            Payments={Payments}
            reqCustomersDataStatus={reqCustomersDataStatus}
            setReqCustomersDataStatus={setReqCustomersDataStatus}
            setFidoStatusPanel={setFidoStatusPanel}
            cancelMainRequest={cancelMainRequest}
            setCustomerData={setCustomerData}
            setLockedByTour={setLockedByTour}
            setStatusPanelContentDisabled={setStatusPanelContentDisabled}
            setStatusPanelCloseDisabled={setStatusPanelCloseDisabled}
            hasPendingFido={hasPendingFido}
            tour={tour}
        />
    ), [data, customersSelected, reqCustomersDataStatus, cancelMainRequest, setCustomerData, tour])

    const GenIconButton = React.memo(({ tooltip_content, type, icon, func, status }) => {
        let elmToReturn;
        switch (type) {
            case 'IconButton':
                elmToReturn = <Fragment><Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
                    <IconButton sx={{ padding: 0 }}
                        data-tooltip-id="general-actionBar-tooltip"
                        data-tooltip-content={tooltip_content}
                        onClick={func}>
                        {icon}
                    </IconButton></Fragment>
                break;
            case 'LoadingButton':
                elmToReturn = <Fragment><Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
                    <LoadingButton sx={{ padding: 0, width: 30, height: 30, minWidth: 30, color: '#666b72' }}
                        loading={status}
                        data-tooltip-id="general-actionBar-tooltip"
                        data-tooltip-content={tooltip_content}
                        onClick={func}>
                        <span style={{ width: 'inherit', height: 'inherit' }}>{icon}</span>
                    </LoadingButton></Fragment>
                break;
        }
        return elmToReturn;
    });


    const isSearchLocked = !!tour?.isOpen && !!lockedByTour;

    return (
        <React.Fragment>
            {
                customersSelected ? <Stack gap={2}>
                    {/* {info && <PopupInfo handleChangeinfo={handleChangeinfo} title='Cerca i clienti che vuoi!'
                        body='Ora hai la possibilità di interagire e richiedere i vari fidi per i tuoi clienti, in maniera facile, semplice e sicura' />} */}
                    <Fade in={true}>
                        <Card sx={{
                            pl: 1, pr: 1, alignItems: 'center', minHeight: 50, pointerEvents: isSearchLocked ? 'none' : 'auto',
                            opacity: isSearchLocked ? 0.6 : 1,
                        }} data-tour="fido-filter">
                            <Stack direction='row' width='100%' height='100%' gap={1} alignItems='center'>
                                {icon_travelExplore({ color: '#9f9f9f', width: 30, height: 30 })}

                                <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />

                                <Stack direction='row' alignItems='center'
                                    sx={{ width: '100%', height: '100%' }} >
                                    <CustomersAutocomplete data={data}
                                        setCustomersSelected={setCustomersSelected}
                                        customersSelected={customersSelected}
                                        CustomerDataAPI={CustomerDataAPI}
                                        reqCustomersDataStatus={reqCustomersDataStatus}
                                        setReqCustomersDataStatus={setReqCustomersDataStatus} />
                                    <Stack direction='row' sx={{ marginLeft: 'auto' }} alignItems='center' gap={0.5}>
                                        <GenIconButton tooltip_content="Torna alla ricerca del cliente" type='IconButton'
                                            icon={icon_back({ color: `${palette.error.main}` })} func={() => {
                                                cancelMainRequest(); setCustomersSelected(null); setCustomerData(null)
                                            }} />

                                        <Stack direction='row' data-tour="fido-open-status">
                                            <GenIconButton tooltip_content="Status dei Fidi richiesti" type='IconButton'
                                                icon={icon_extraPanel()} func={() => setFidoStatusPanel(true)} /></Stack>

                                        {!reqCustomersDataStatus ?
                                            <Stack direction='row' data-tour="fido-open-request">
                                                <GenIconButton tooltip_content="Richiedi un fido per questo Cliente" type='IconButton'
                                                    icon={icon_request()} func={() => handleOpenReqFido()} /> </Stack> : <Fragment><Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
                                                <Skeleton sx={{ width: 30, height: 50 }} /></Fragment>}

                                        <GenIconButton tooltip_content="Esegui la Ricerca" type='LoadingButton'
                                            icon={icon_search({
                                                width: 30, height: 30, alignSelf: 'center',
                                                justifyContent: 'flex-end'
                                            })} func={() => SendReq()} status={saerchStatus} />

                                    </Stack>
                                </Stack>
                            </Stack>
                        </Card></Fade>
                </Stack>
                    : SearchCustomersMEMO
            }
            <Tooltip id="general-actionBar-tooltip" place="bottom" style={{
                maxWidth: "15vw", minWidth: 150, fontSize: '0.87rem',
                textAlign: 'center', zIndex: 9999,
            }} />
        </React.Fragment>

    )
}