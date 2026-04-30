import React, { useState, memo, useMemo, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Autocomplete, { autocompleteClasses } from '@mui/material/Autocomplete';
import useMediaQuery from '@mui/material/useMediaQuery';
import ListSubheader from '@mui/material/ListSubheader';
import Popper from '@mui/material/Popper';
import { useTheme, styled } from '@mui/material/styles';
import { VariableSizeList } from 'react-window';
import Typography from '@mui/material/Typography';

import Stack from '@mui/material/Stack';
import './style.css';

const LISTBOX_PADDING = 8; // px

const renderRow = ({ data, index, style }) => {
    const dataSet = data[index];
    const inlineStyle = {
        ...style,
        top: style.top + LISTBOX_PADDING,
        fontSize: 'calc(100% - 8px)',
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
};

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
const ListboxComponent = React.memo(React.forwardRef(function ListboxComponent(props, ref) {
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

    const getHeight = useCallback(() => {
        if (itemCount > 8) {
            return 8 * itemSize;
        }
        return itemData.map(getChildSize).reduce((a, b) => a + b, 0);
    });

    const gridRef = useResetCache(itemCount);

    return (
        <Stack ref={ref}>
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
        </Stack>
    );
}));

ListboxComponent.propTypes = {
    children: PropTypes.node,
};

const StyledPopper = React.memo(styled(Popper)({
    [`& .${VariableSizeList.defaultProps.className}`]: {
        boxSizing: 'border-box',
        '& ul': {
            padding: 0,
            margin: 0,
        },
    },
}));


function AutocompleteVI(props) {
    const { data, brandSelected, categorySelected, existValue } = props;

    //const [value, setValue] = useState();
    const [OPTIONS, setOptions] = useState([]);

    useEffect(() => {
        if (data.dataArray) {
            if(typeof data.dataArray[0] !== 'object'){
                const options = data.dataArray.map(elm => elm)
                    .filter(Boolean) // Rimuovi elementi vuoti o non validi
                    .sort((a, b) => a.toUpperCase().localeCompare(b.toUpperCase()));
                setOptions(options);
            }else{
                const options = data.dataArray.map(elm => elm[data.ref])
                .filter(Boolean) // Rimuovi elementi vuoti o non validi
                .sort((a, b) => a.toUpperCase().localeCompare(b.toUpperCase()));
                setOptions(options);
            }
        }
    }, [data]);


    const handleChange = (event, newValue) => {
        //setValue(newValue);

        if(newValue === null){
            data.noneOnClick();
        }else{
            const findIndex = data.dataArray.findIndex(elm => (elm[data.ref] || elm) === newValue)
            data.menuItemOnClick(data.dataArray[findIndex], findIndex)
        }
    };

    const Render = () => (
        <Stack className='transition-all-css' sx={{
            width: "100%",
            minWidth: "11rem",
            maxWidth: "11rem",
            justifyContent: "center",
        }} style={Boolean(data.dataArray == null && data.dataArray == undefined) ? {opacity: 0.5, background: '#ccc', borderRadius: 5} : {}}>
            <Autocomplete
                disabled={Boolean(data.dataArray == null && data.dataArray == undefined)}
                id="virtualize-demo"
                value={(data.stateRef !== null && data.stateRef !== undefined) ? 
                    (data.stateRef[data.ref] || data.stateRef) : data.label !== 'Gruppo' ? null : undefined}
                disableListWrap
                PopperComponent={StyledPopper}
                ListboxComponent={ListboxComponent}
                options={OPTIONS}
                renderInput={(params) => <TextField placeholder={[data.label].toString()} {...params} sx={{cursor:"pointer"}} size="small"  />}
                renderOption={(props, option, state) => [props, option, state.index]}
                renderGroup={(params) => params}
                onChange={handleChange}
            />
        </Stack>
    )

    
    return (
        data.label === 'Prefissi' ?  
            brandSelected !== null ? 
                Render()
            : null
        : data.label === 'Gruppo' ? 
            categorySelected !== null && categorySelected !== undefined ?
                Object.keys(categorySelected).find(elm => elm === "SubCategory") !== undefined ?
                    Render()
                : null
            : null
        :
        Render()
    )
}

export default memo(AutocompleteVI);