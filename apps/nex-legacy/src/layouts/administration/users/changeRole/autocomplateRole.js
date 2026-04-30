import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import useMediaQuery from '@mui/material/useMediaQuery';
import ListSubheader from '@mui/material/ListSubheader';
import Popper from '@mui/material/Popper';
import { useTheme, styled } from '@mui/material/styles';
import { VariableSizeList } from 'react-window';
import Typography from '@mui/material/Typography';

import LoadingButton from '@mui/lab/LoadingButton';
import Stack from '@mui/material/Stack';
import MDTypography from "components/MDTypography";
import SendIcon from '@mui/icons-material/Send';



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
            {`${dataSet[1]}`}
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

const StyledPopper = styled(Popper)({
    [`& .${VariableSizeList.defaultProps.className}`]: {
        boxSizing: 'border-box',
        '& ul': {
            padding: 0,
            margin: 0,
        },
    },
});


export default function AutocompleteRole(props) {
    const { data, openErrorSB, changeRole} = props;

    const [customerSelected, setCustomersSelected] = useState('');

    const SendReq = useCallback(() => {
        if(customerSelected === '' || customerSelected == null){
            openErrorSB('warning', 'Per poter visualizzare il profilo del cliente, perfavore selezionane almeno uno.');
            return;}
        changeRole(customerSelected);
    },[customerSelected])

    
    const OPTIONS = data.map(data => data)
        .sort((a, b) => a.ruolo.toUpperCase().localeCompare(b.ruolo.toUpperCase()));

    const filterOptions = (options, { inputValue }) => {
        return options.filter((option) => {
            // Cerca per tutti i parametri dell'oggetto stesso.
            return (
                option?.PartitaIVA?.includes(inputValue) ||
                option?.CodiceFiscale?.includes(inputValue) ||
                option?.CodiceCliente?.includes(inputValue) ||
                option.ruolo.toLowerCase().includes(inputValue.toLowerCase())
            );
        });
    };

    return ( 
        <Stack sx={{marginTop: 5, transition: 'opacity 200ms ease-in'}} style={data.length > 0 ? {} : {opacity: 0.434}} translate="no">
            <Stack sx={{
                width: "100%",
                maxWidth: "45rem",
                margin: "auto",
                justifyContent: "center",
                padding: 4.5,
                borderRadius: "10px",
                gap: 3,
            }}>          
                <Stack>
                    <MDTypography variant="h5">Ruoli</MDTypography>
                    <MDTypography variant="body2" color="text">
                        Seleziona un nuovo ruolo da assegnare all'utente selezionato!.
                    </MDTypography>
                </Stack>
                <Stack direction="row" translate="no">
                    <Autocomplete
                        id="virtualize-demo"
                        sx={{ width: "100%" }}
                        disableListWrap
                        disabled={data.length > 0 ? false : true}
                        PopperComponent={StyledPopper}
                        ListboxComponent={ListboxComponent}
                        options={OPTIONS}
                        getOptionLabel={(option) => option.ruolo}

                        renderInput={(params) => <TextField {...params} label="Ruoli" translate="no"/>}
                        renderOption={(props, option, state) => [props, option.ruolo, state.index]} //[props, option.ruolo, state.index]
                        renderGroup={(params) => params}
                       
                        filterOptions={filterOptions}
                        onChange={(event, newValue) => {
                            setCustomersSelected(() => {
                                return newValue ? 
                                    data[data.findIndex(data => data.ruolo === newValue?.ruolo)].ruolo
                                : null});
                        }}
                    />
                    <LoadingButton
                        size="small"
                        loading={false}
                        variant="outlined"
                        sx={{transition:'color 100ms ease-in, background-color 200ms ease-in' , 
                        border: "none", padding: 0, color: "#1597c1", '&:hover':{
                            color: "#fff", border: 'none', backgroundColor: '#1597c1'} }}
                        onClick={() => SendReq()}
                    >
                        <span><SendIcon sx={{ width: "2em", height: "2em"}} /></span>
                    </LoadingButton>
                </Stack>
            </Stack>
        </Stack>
    )
}


export { AutocompleteRole }