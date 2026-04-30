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

const LISTBOX_PADDING = 8; // px

const renderRow = ({ data, index, style }) => {
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
            {`#${dataSet[2] + 1} - ${dataSet[1]}`}
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
    const { data, reqFrom, DefineElmLine, PassDefineElmGroup, ExcludeElmFromSubCat, existValue } = props;

    const [value, setValue] = useState(data?.Categorie?.find(elm => elm.Linea === existValue)?.DescrizioneLinea);

    // Memorizza il valore di "value" e "OPTIONS" usando useMemo
    /*const OPTIONS = useMemo(() => {
        return data?.Categorie.map(data => data.DescrizioneLinea)
            .sort((a, b) => a.toUpperCase().localeCompare(b.toUpperCase()));
    }, [data]);*/

    const [OPTIONS, setOptions] = useState([]);

    useEffect(() => {
        if (data) {
            const options = data.Categorie.map(data => data.DescrizioneLinea)
                .sort((a, b) => a.toUpperCase().localeCompare(b.toUpperCase()));
            setOptions(options);
        }
    }, [data]);
    
    const PassElmLine = useCallback((value, nomeFornitore, index) => {
        DefineElmLine(value, nomeFornitore, index);
    }, [DefineElmLine]);

    const PassElmGroup = useCallback((value, nomeFornitore, indexRow, indexNestElm) => {
        PassDefineElmGroup(value, nomeFornitore, indexRow, indexNestElm);
    }, [PassDefineElmGroup]);

    /*const ExcludeElm = useCallback((index) => {
        ExcludeElmFromSubCat(index, data?.nomeFornitore);
    }, [ExcludeElmFromSubCat, data?.nomeFornitore]);*/


    const handleChange = (event, newValue) => {
        setValue(newValue);
        // Early return se "newValue" è undefined o nullo
        if (!newValue) { return; }

        //In base a quale elemento fa la richiesta assegna l'oggetto in Fornitori delle sottocategorie 
        //o nelle categorie di quel elemento specifico.
        if (newValue !== "") {
            const lineValue = data?.Categorie.find(elm => elm.DescrizioneLinea === newValue)?.Linea;

            if (reqFrom !== "subElm") {
                PassElmLine(lineValue, [data?.nomeFornitore], props.index);
            } else {
                PassElmGroup(lineValue, [data?.nomeFornitore]);
            }
        }
    };

    return (
        <Stack sx={{
            width: "100%",
            maxWidth: "45rem",
            margin: "auto",
            justifyContent: "center",
            padding: "0 0 10px",
        }}>
            <Stack direction="row">
                <MDTypography variant={reqFrom !== "subElm" ? "h5" : "p"} sx={{fontSize: "0.75em", fontWight: "500"}}>{data?.nomeFornitore}</MDTypography>
            </Stack>
            <Autocomplete
                id="virtualize-demo"
                value={value}
                disableListWrap
                PopperComponent={StyledPopper}
                ListboxComponent={ListboxComponent}
                options={OPTIONS}
                renderInput={(params) => <TextField {...params} sx={{cursor:"pointer"}} size="small"  />}
                renderOption={(props, option, state) => [props, option, state.index]}
                renderGroup={(params) => params}
                onChange={handleChange}
            />
        </Stack>
    )
}

export default memo(Virtualize);