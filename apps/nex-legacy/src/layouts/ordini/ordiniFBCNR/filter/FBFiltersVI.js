import React, { useState, memo, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';

import { useTheme, styled } from '@mui/material/styles';
import {Typography, Stack, Popper, ListSubheader,
    useMediaQuery, Autocomplete, TextField} from '@mui/material';

import MDTypography from "components/MDTypography";

import { VariableSizeList } from 'react-window';
import { useFiltersContext } from '../../../../context/filtersContext';




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


function FBFiltersVI(props) {
    const {
        setBrandSelected,
        brandSelected,
        setBrandPrefix,
        setCategorySelected,
        setSubCategorySelected,
    } = useFiltersContext();

    //const { setSubCategorySelected, setCategorySelected, setBrandSelected, setBrandPrefix } = props;
    const { data = [], existValue, setUTMTarget } = props;
    const { minWidth, maxWidth, placeholder, type, valueToTake, valueToInsert } = props;

    const [value, setValue] = useState((data ?? [])?.find(elm => (elm.firstName || elm) === existValue));

    const [OPTIONS, setOptions] = useState([]);

    useEffect(() => {
        if (data) {
            if (type === 'String') {
                const options = data.map(elm => elm)
                    .sort((a, b) => a.toUpperCase().localeCompare(b.toUpperCase()))
                setOptions(options);
            }else if(type === 'Object'){
                if(valueToTake === undefined){return;}
                const options = data.map(elm => elm[valueToTake])
                    .sort((a, b) => a.localeCompare(b))
                setOptions(options);
            }else{
                const options = data.map(elm => elm)
                setOptions(options);
            }
        }
    }, [data]);

    const handleChange = (event, newValue) => {
        setBrandSelected(() => null);
        setBrandPrefix(null);
        setSubCategorySelected(null);
        setCategorySelected(null);


        setValue(newValue);

        if(type === 'Object'){
            if (newValue === null) {
                setUTMTarget(() => null);
            } else {
                const value_id = data.findIndex(elm => elm[valueToTake] === newValue);
                setUTMTarget(() => data[value_id][valueToInsert]);
            }
        }else{
            if (newValue === null) {
                setUTMTarget(() => null);
            } else {
                const value_id = data.findIndex(elm => elm === newValue);
                setUTMTarget(() => data[value_id]);
            }
        }
    };

    const Render = () => (
        <Stack sx={{
            width: "100%",
            minWidth: minWidth,
            maxWidth: maxWidth,
            margin: "auto",
            justifyContent: "center",
        }}>
            <Stack direction="row">
                <MDTypography variant="p" sx={{ fontSize: "0.75em", fontWight: "500" }}>{data.firstName}</MDTypography>
            </Stack>
            <Autocomplete
                id="virtualize-demo"
                value={value}
                disableListWrap
                PopperComponent={StyledPopper}
                ListboxComponent={ListboxComponent}
                options={OPTIONS}
                renderInput={(params) => <TextField placeholder={placeholder} {...params} sx={{ cursor: "pointer" }} size="small" />}
                renderOption={(props, option, state) => [props, option, state.index]}
                renderGroup={(params) => params}
                onChange={handleChange}
            />
        </Stack>
    )


    return (
        Render()
    )
}

export default memo(FBFiltersVI);