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
import MDTypography from "components/MDTypography";

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


function Virtualize(props) {
    const {
        setBrandSelected,
        brandSelected,
        setBrandPrefix,
        setCategorySelected,
        setSubCategorySelected,
      } = useFiltersContext();

    //const { setSubCategorySelected, setCategorySelected, setBrandSelected, setBrandPrefix } = props;
    const { data, setBuyerTarget, buyerTarget} = props;

    //const [value, setValue] = useState(data.find(elm => elm.firstName === existValue));

    const [OPTIONS, setOptions] = useState([]);

    useEffect(() => {
        if (data) {
            const options = data.map(elm => elm.name)
                .sort((a, b) => a.toUpperCase().localeCompare(b.toUpperCase()))
            setOptions(options);
        }
    }, [data]);

    const handleChange = (event, newValue) => {
        setBrandSelected(() => null);
        setBrandPrefix(null);
        setSubCategorySelected(null);
        setCategorySelected(null);

        //setValue(newValue);
        
        if(newValue === null){
            setBuyerTarget(() => null);
        }else{
            const value_id = data.findIndex(elm => (elm.name) === newValue);
            setBuyerTarget(() => data[value_id]);
        }
    };

    const Render = () => (
        <Stack sx={{
            width: "100%",
            margin: "auto",
            justifyContent: "center",
            padding: "0 0 10px",
        }}>
            <Autocomplete
                id="virtualize-demo"
                value={buyerTarget ? buyerTarget?.name : null}
                disableListWrap
                PopperComponent={StyledPopper}
                ListboxComponent={ListboxComponent}
                options={OPTIONS}
                renderInput={(params) => <TextField placeholder='buyers' {...params} sx={{cursor:"pointer"}} size="small"  />}
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

export default memo(Virtualize);