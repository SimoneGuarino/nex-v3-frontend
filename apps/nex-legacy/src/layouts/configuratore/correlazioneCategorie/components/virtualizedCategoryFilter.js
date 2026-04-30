import React, { useState, memo, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import { Autocomplete } from '@mui/material';
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


export default function Virtualize(props) {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;
    const { data } = props;

    const [OPTIONS, setOptions] = useState([]);
    const [indexMap, setIndexMap] = useState([]);

    useEffect(() => {
        if (data.dataArray) {
            if (typeof data.dataArray[0] !== 'object') {
                const options = data.dataArray.map(elm => elm)
                    .filter(Boolean) // Rimuovi elementi vuoti o non validi
                    .sort((a, b) => a.toUpperCase().localeCompare(b.toUpperCase()));
                setOptions(options);
            } else {
                const options = data.dataArray.map(elm => data.secRef ?
                    elm[data.ref] +
                    `${elm[data.secRef] ? ' - ' + elm[data.secRef] : ''}`
                    : elm[data.ref])
                    .filter(Boolean) // Rimuovi elementi vuoti o non validi
                    .sort((a, b) => a.toUpperCase().localeCompare(b.toUpperCase()));
                setOptions(options);

                //fai la mappatura per poi risalira all'index successivamente
                const indexMap = new Map(
                    data.dataArray.map((value, index) => [
                        data.secRef ?
                            value[data.ref] + `${value[data.secRef] ? ' - ' + value[data.secRef] : ''}`
                            : value[data.ref],
                        index])
                );
                setIndexMap(indexMap);
            }
        }
    }, [data.dataArray]);

    const handleChange = (_, newValue) => {
        if (!newValue || newValue === null) {
            data.noneOnClick();
        } else {
            if(indexMap.size === 0) {
                console.log('indexMap di CategoryFilter è empty');
                return;
            };
            const value = indexMap.get(newValue);
            data.menuItemOnClick(data.dataArray[value], value);
        }
    };

    const Render = () => (
        <Stack key={props.index} sx={{
            width: "100%",
            minWidth: "11rem",
            maxWidth: "15rem",
        }}>
            <Autocomplete
                id="virtualize-demo"
                disabled={OPTIONS.length === 0}
                value={data.stateRef ? (data.stateRef[data.ref] || data.stateRef) : null}
                disableListWrap
                PopperComponent={StyledPopper}
                ListboxComponent={ListboxComponent}
                options={OPTIONS}
                renderInput={(params) => <TextField placeholder={[data.label].toString()} {...params} sx={{
                    backgroundColor: `${OPTIONS.length === 0 ? darkMode ? palette.grey[800] : palette.grey[300] : ''}`,
                    borderRadius: 2,

                    '&.MuiFormControl-root div .MuiButtonBase-root ': {
                        fontSize: '1.1rem',
                    },
                    '&.MuiFormControl-root div .MuiInputBase-input': { fontSize: '0.8rem' },
                    cursor: "pointer"
                }} />}
                renderOption={(props, option, state) => [props, option, state.index]}
                renderGroup={(params) => params}
                onChange={handleChange}
            />
        </Stack>
    );

    return Render();
};