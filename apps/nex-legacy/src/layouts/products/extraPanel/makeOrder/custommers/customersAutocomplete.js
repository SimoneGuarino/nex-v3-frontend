import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import useMediaQuery from '@mui/material/useMediaQuery';
import ListSubheader from '@mui/material/ListSubheader';
import Popper from '@mui/material/Popper';
import { useTheme, styled } from '@mui/material/styles';
import { VariableSizeList } from 'react-window';
import Typography from '@mui/material/Typography';

import Stack from '@mui/material/Stack';

import { Skeleton } from '@mui/material';



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

    const CodClienteUNION = [];

    if(dataSet[2]?.Focelda){
        CodClienteUNION.push(`${dataSet[2]?.Focelda}`)
    }
    if(dataSet[2]?.IOT){
        CodClienteUNION.push(`${dataSet[2]?.IOT}`)
    }

    return (
        <Typography component="li" {...dataSet[0]} noWrap style={inlineStyle}>
            {`${CodClienteUNION.join(' - ')} -- ${dataSet[1]}`}
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


export default function CustomersAutocomplete(props) {
    const { data, clientSelected, setClientSelected, } = props;
    
    const OPTIONS = data.map(data => data)
        .sort((a, b) => a.RagioneSociale?.toUpperCase().localeCompare(b.RagioneSociale?.toUpperCase()));

    const filterOptions = (options, { inputValue }) => {
        return options.filter((option) => {
            const CodClienteUNION = [];

            if(option?.CodiceCliente?.Focelda){
                CodClienteUNION.push(`${option?.CodiceCliente?.Focelda}`)
            }
            if(option?.CodiceCliente?.IOT){
                CodClienteUNION.push(`${option?.CodiceCliente?.IOT}`)
            }

            if(CodClienteUNION.includes(inputValue)){
                console.log(inputValue);
            };
            // Cerca per tutti i parametri dell'oggetto stesso.
            return (
                option?.PartitaIVA?.includes(inputValue) ||
                option?.CodiceFiscale?.includes(inputValue) ||
                CodClienteUNION?.join(' - ')?.toString().includes(inputValue) ||
                option.RagioneSociale?.toLowerCase().includes(inputValue?.toLowerCase())
            );
        });
    };

    return ( 
        <Stack sx={{width: '100%', transition: 'opacity 200ms ease-in', height: 40,}} 
        style={data.length > 0 ? {} : {opacity: 0.434}} translate="no">
            {data.length > 0 ? <Autocomplete
                value={clientSelected}
                sx={{ width: "100%"}}
                disableListWrap
                disabled={data.length > 0 ? false : true}
                PopperComponent={StyledPopper}
                ListboxComponent={ListboxComponent}
                options={OPTIONS}
                getOptionLabel={(option) => option.RagioneSociale}

                renderInput={(params) => <TextField {...params} label="Clienti" translate="no"/>}
                renderOption={(props, option, state) => [props, option.RagioneSociale, option.CodiceCliente, state.index]} //[props, option.RagioneSociale, state.index]
                renderGroup={(params) => params}
               
                filterOptions={filterOptions}
                onChange={(event, newValue) => {
                    setClientSelected(() => {
                        return newValue ? 
                            data[data.findIndex(data => data.RagioneSociale === newValue?.RagioneSociale)] 
                        : null});
                }}
            /> : <Skeleton sx={{minWidth: '100%', height: 40}} variant="rounded" />}
        </Stack>
    )
}