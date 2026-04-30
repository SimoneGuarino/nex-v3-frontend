import React, { useState, memo, useCallback, useEffect } from 'react';
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
import { MainTheme } from 'assets/settingsTheme';
import { useNexTheme } from '@nex/theme-system';

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


function Virtualize(props) {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const { data, dataToInsert } = props;

    //const [value, setValue] = useState();
    const [OPTIONS, setOptions] = useState([]);

    useEffect(() => {
        if (data.dataArray) {
            if (typeof data.dataArray[0] !== 'object') {
                const options = data.dataArray.map(elm => elm)
                    .filter(Boolean) // Rimuovi elementi vuoti o non validi
                    .sort((a, b) => a.toUpperCase().localeCompare(b.toUpperCase()));
                setOptions(options);
            } else {
                const options = data.dataArray.map(elm => elm[data.ref])
                    .filter(Boolean) // Rimuovi elementi vuoti o non validi
                    .sort((a, b) => a.toUpperCase().localeCompare(b.toUpperCase()));
                setOptions(options);
            }
        }
    }, [data]);

    const handleChange = (event, newValue) => {
        //setValue(newValue);

        if (newValue === null) {
            data.noneOnClick();
        } else {
            const findIndex = data.dataArray.findIndex(elm => (elm[data.ref] || elm) === newValue)
            data.menuItemOnClick(data.dataArray[findIndex], findIndex)
        }
    };

    const condition = data.label === 'Famiglia' ?
        dataToInsert.categorySelected !== null && dataToInsert.categorySelected !== undefined ?
            Object.keys(dataToInsert.categorySelected).find(elm => elm === "SubCategory") !== undefined ?
                false
                : true
            : true
        : data.label === 'Categorie' ?
            dataToInsert.brandSelected !== null && dataToInsert.brandSelected !== undefined ?
                Object.keys(dataToInsert.brandSelected).find(elm => elm === "Categories") !== undefined ?
                    false
                    : true
                : true
            : data.label === 'Marca' ?
                dataToInsert.buyerSelected !== null && dataToInsert.buyerSelected !== undefined ?
                    Object.keys(dataToInsert.buyerSelected).find(elm => elm === "Codice") !== undefined ?
                        false
                        : true
                    : true
                : false


    const Render = (condition) => (
        <Stack sx={{
            width: data.width ? data.width : "31%",
            justifyContent: "center",
        }}>
            <Autocomplete
                id="virtualize-demo"
                disabled={Boolean(condition | false)}
                value={data.stateRef ? data.stateRef[data.ref] : null}
                disableListWrap
                PopperComponent={StyledPopper}
                ListboxComponent={ListboxComponent}
                options={OPTIONS}
                renderInput={(params) => <TextField
                    placeholder={[data.label].toString()} {...params}
                    sx={{
                        cursor: "pointer", backgroundColor: `${Boolean(condition | false) ?
                            darkMode ? palette.grey[900] : palette.grey[400]
                            : darkMode ? palette.grey[800] : palette.grey[200]}`, borderRadius: 2
                    }}
                    size="small" />}
                renderOption={(props, option, state) => [props, option, state.index]}
                renderGroup={(params) => params}
                onChange={handleChange}
            />
        </Stack>
    )


    return (
        data.label === 'Prefissi' ?
            dataToInsert.brandSelected !== null ?
                Render()
                : null
            : Render(condition)
    )
}

export default memo(Virtualize);