import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import {
    TextField, Autocomplete, useMediaQuery, ListSubheader,
    Popper, Typography, Stack, Button,
    Card
} from '@mui/material';

import { useTheme, styled } from '@mui/material/styles';
import { VariableSizeList } from 'react-window';

import LoadingButton from '@mui/lab/LoadingButton';

//@internal packages
import { icon_extraPanel } from 'config/icons';
import MDTypography from "components/MDTypography";
import { icon_search } from 'config/icons';
import { MainTheme } from 'assets/settingsTheme';
import { enqueueSnackbar } from 'components/MessageBox';
import { Box } from '@mui/material';
import { useNexTheme } from '@nex/theme-system';


const LISTBOX_PADDING = 8; // px

function renderRow(props) {
    const { data, index, style } = props;
    const dataSet = data[index];
    const inlineStyle = {
        ...style,
        top: style.top + LISTBOX_PADDING,
    };

    if (dataSet.hasOwnProperty('group')) {
        return (
            <ListSubheader key={dataSet.key} component="div" style={inlineStyle}>
                {dataSet.group}
            </ListSubheader>
        );
    }

    return (
        <Typography component="li" {...dataSet[0]} noWrap style={inlineStyle}>
            {`${dataSet[2]} - ${dataSet[1]}`}
        </Typography>
    );
}
const OuterElementContext = React.createContext({});

const OuterElementType = React.forwardRef((props, ref) => {
    const outerProps = React.useContext(OuterElementContext);
    return <div ref={ref} {...props} {...outerProps} />;
});

function useResetCache(data) {
    const ref = React.useRef(null);
    React.useEffect(() => {
        if (ref.current != null) {
            ref.current.resetAfterIndex(0, true);
        }
    }, [data]);
    return ref;
}

// Adapter for react-window
const ListboxComponent = React.forwardRef(function ListboxComponent(props, ref) {
    const { children, ...other } = props;
    const itemData = [];
    children.forEach((item) => {
        itemData.push(item);
        itemData.push(...(item.children || []));
    });

    const theme = useTheme();
    const smUp = useMediaQuery(theme.breakpoints.up('sm'), {
        noSsr: true,
    });
    const itemCount = itemData.length;
    const itemSize = smUp ? 36 : 48;

    const getChildSize = (child) => {
        if (child.hasOwnProperty('group')) {
            return 48;
        }

        return itemSize;
    };

    const getHeight = () => {
        if (itemCount > 8) {
            return 8 * itemSize;
        }
        return itemData.map(getChildSize).reduce((a, b) => a + b, 0);
    };

    const gridRef = useResetCache(itemCount);

    return (
        <div ref={ref}>
            <OuterElementContext.Provider value={other}>
                <VariableSizeList
                    itemData={itemData}
                    height={getHeight() + 2 * LISTBOX_PADDING}
                    width="100%"
                    ref={gridRef}
                    outerElementType={OuterElementType}
                    innerElementType="ul"
                    itemSize={(index) => getChildSize(itemData[index])}
                    overscanCount={5}
                    itemCount={itemCount}
                >
                    {renderRow}
                </VariableSizeList>
            </OuterElementContext.Provider>
        </div>
    );
});

ListboxComponent.propTypes = {
    children: PropTypes.node,
};

const StyledPopper = styled((props) => <Popper {...props} data-tour-allow />)({
    [`& .${VariableSizeList.defaultProps.className}`]: {
        boxSizing: 'border-box',
        '& ul': {
            padding: 0,
            margin: 0,
        },
    },
});


export default function SearchCustomers(props) {
    const { data, customersSelectedMain, CustomerDataAPI, Payments } = props;
    const { reqCustomersDataStatus, setReqCustomersDataStatus, setFidoStatusPanel } = props;
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;
    const { setCustomersSelected: setCustomersSelectedParent } = props;
    const { tour } = props;

    const [customerSelected, setCustomerSelectedLocal] = useState(customersSelectedMain ? customersSelectedMain : '');
    const [inputValue, setInputValue] = useState('');
    const canSearch = Boolean(customerSelected) || inputValue.trim().length >= 2;
    const tourGateActive = Boolean(tour?.isOpen);
    const searchDisabled = tourGateActive && !canSearch;


    const OPTIONS = data.map(data => data)
        .sort((a, b) => a.RagioneSociale.toUpperCase().localeCompare(b.RagioneSociale.toUpperCase()));


    const SendReq = useCallback(() => {
        if (customerSelected === '' || customerSelected == null) {
            return enqueueSnackbar('Per poter visualizzare il profilo del cliente, per favore selezionane almeno uno.', {
                title: 'Cliente',
                type: 'warning',
            });
        }
        setReqCustomersDataStatus(true);
        //props.setCustomersSelected(() => { return customerSelected });
        setCustomersSelectedParent?.(customerSelected);
        Payments();
        CustomerDataAPI(customerSelected);
    }, [customerSelected, setCustomersSelectedParent]) //[customerSelected])

    const filterOptions = (options, { inputValue }) => {
        return options.filter((option) => {
            // Cerca per tutti i parametri dell'oggetto stesso.
            return (
                option?.PartitaIVA?.includes(inputValue) ||
                option?.CodiceFiscale?.includes(inputValue) ||
                option?.CodiceCliente?.includes(inputValue) ||
                option.RagioneSociale.toLowerCase().includes(inputValue.toLowerCase())
            );
        });
    };



    return (
        <Stack sx={{ height: '86vh', transition: 'opacity 200ms ease-in' }}
            style={data.length > 0 ? {} : { opacity: 0.434 }} translate="no">
            <Card


                sx={{
                    width: "100%",
                    minHeight: 200,
                    maxWidth: "45rem",
                    margin: "auto",
                    justifyContent: "center",
                    padding: 2.5,
                    borderRadius: "10px",
                    gap: 3,
                }}>
                <Stack height='100%' width='100%'>
                    <Stack>
                        <Stack direction='row'>
                            <Stack>
                                <MDTypography variant="h5">Clienti</MDTypography>
                                <MDTypography variant="body2" color="text">
                                    Seleziona il cliente in modo da poter visualizzare il profilo fido!
                                </MDTypography>
                            </Stack>
                            <Button data-tooltip-id="general-actionBar-tooltip" onClick={() => { setFidoStatusPanel(true); }}
                                data-tooltip-content='Status dei Fidi richiesti' variant='contained'
                                sx={{
                                    marginLeft: 'auto', p: 0, minHeight: 40, height: 40,
                                    backgroundColor: `${darkMode ? palette.primary.main : palette.secondary.main} !important`,
                                    '&:focus': { backgroundColor: `${darkMode ? palette.primary.light : palette.secondary.light}` },
                                    '&:hover': { backgroundColor: `${darkMode ? palette.primary.light : palette.secondary.light}` }
                                }}>
                                {icon_extraPanel({ color: '#fff', width: 25, height: 25 })}
                            </Button>
                        </Stack>
                    </Stack>
                    <Stack direction="row" translate="no" gap={1} mt='auto'>
                        <Autocomplete
                            data-tour="fido-card-clienti"
                            id="virtualize-demo"
                            sx={{ width: "100%" }}
                            disableListWrap
                            disabled={data.length > 0 ? false : true}
                            PopperComponent={StyledPopper}
                            ListboxComponent={ListboxComponent}
                            options={OPTIONS}
                            getOptionLabel={(option) => option.RagioneSociale}
                            data-tour-allow
                            inputValue={inputValue}
                            onInputChange={(_, v) => setInputValue(v)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Clienti"
                                    translate="no"
                                    // blocca Enter durante il tour
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && searchDisabled) e.preventDefault();
                                    }}
                                />
                            )}
                            //renderInput={(params) => <TextField {...params} label="Clienti" translate="no" />}
                            renderOption={(props, option, state) => [props, option.RagioneSociale, option.CodiceCliente, state.index]} //[props, option.RagioneSociale, state.index]
                            renderGroup={(params) => params}

                            filterOptions={filterOptions}
                            onChange={(_, newValue) => {
                                //setCustomersSelected(()
                                //setCustomerSelectedLocal(() => {
                                // return newValue ?
                                //     data[data.findIndex(data => data.RagioneSociale === newValue?.RagioneSociale)]
                                //     : null
                                setCustomerSelectedLocal(() => newValue
                                    ? data[data.findIndex(d => d.RagioneSociale === newValue?.RagioneSociale)]
                                    : null)
                            }}
                        />
                        <Box
                            component="span"
                            data-tooltip-id="general-actionBar-tooltip"
                            data-tooltip-content={searchDisabled ? 'Digita o seleziona un cliente' : 'Esegui la ricerca'}
                            sx={{ display: 'inline-flex', alignItems: 'center' }}
                        >
                            <LoadingButton
                                size="small"
                                loading={reqCustomersDataStatus}
                                variant="contained"
                                disabled={searchDisabled}
                                sx={{
                                    transition: 'background-color 200ms ease-in', border: "none", padding: 0, minWidth: 64, minHeight: 54,
                                    backgroundColor: `${darkMode ? palette.primary.main : palette.secondary.main}`,
                                    '&:hover': {
                                        color: "#fff", border: 'none',
                                        backgroundColor: `${darkMode ? palette.primary.light : palette.secondary.light}`
                                    },
                                    '&.Mui-disabled': {
                                        opacity: 1,
                                        backgroundColor: `${darkMode ? palette.primary.main : palette.secondary.main}`,
                                        color: '#fff',
                                        cursor: 'not-allowed',
                                    },
                                }}
                                onClick={() => SendReq()}
                                data-tour="fido-card-clienti-search"
                            >
                                <span>{icon_search({ width: "2em", height: "2em", color: '#fff' })}</span>
                            </LoadingButton>
                        </Box>
                    </Stack>
                </Stack>
            </Card>
        </Stack>
    )
}


export { SearchCustomers }