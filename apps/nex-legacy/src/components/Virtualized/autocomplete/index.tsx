import React, { useState, memo, useCallback, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete, { autocompleteClasses } from '@mui/material/Autocomplete';
import useMediaQuery from '@mui/material/useMediaQuery';
import ListSubheader from '@mui/material/ListSubheader';
import Popper from '@mui/material/Popper';
import { useTheme, styled } from '@mui/material/styles';
import { VariableSizeList, ListChildComponentProps } from 'react-window';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

const LISTBOX_PADDING = 8; // px

// tipo per i dati della prop "data"
type DataConfig = {
  dataArray: Array<string | Record<string, any>>;
  ref: string;
  label: string;
  stateRef?: Record<string, any> | null;
  noneOnClick: () => void;
  menuItemOnClick: (item: any, index: number) => void;
  width?: number | string;
};

type DataToInsert = {
  categorySelected?: Record<string, any> | null;
  brandSelected?: Record<string, any> | null;
};

type VirtualizeProps = {
  data: DataConfig;
  dataToInsert: DataToInsert;
};

// row renderer per react-window
const renderRow = ({ data, index, style }: ListChildComponentProps<any>) => {
  const dataSet = data[index];
  const inlineStyle: React.CSSProperties = {
    ...style,
    top: (style.top as number) + LISTBOX_PADDING,
    fontSize: 'calc(100% - 8px)',
  };

  if (Object.prototype.hasOwnProperty.call(dataSet, 'group')) {
    // header di gruppo
    return (
      <ListSubheader key={dataSet.key} component="div" style={inlineStyle}>
        {dataSet.group}
      </ListSubheader>
    );
  }

  // opzione
  return (
    <Typography component="li" {...dataSet[0]} noWrap style={inlineStyle}>
      {`${dataSet[1]}`}
    </Typography>
  );
};

const OuterElementContext = React.createContext<React.HTMLAttributes<HTMLElement>>({});

const OuterElementType = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function OuterElementType(props, ref) {
    const outerProps = React.useContext(OuterElementContext);
    return <div ref={ref} {...props} {...outerProps} />;
  }
);

function useResetCache(data: unknown) {
  const ref = React.useRef<VariableSizeList>(null);
  useEffect(() => {
    ref.current?.resetAfterIndex(0, true);
  }, [data]);
  return ref;
}

// Adapter per react-window
const ListboxComponent = React.memo(
  React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLElement>>(function ListboxComponent(
    props,
    ref
  ) {
    const { children, ...other } = props as any;

    const itemData: any[] = [];
    React.Children.forEach(children, (item: any) => {
      itemData.push(item);
      itemData.push(...(item?.children || []));
    });

    const theme = useTheme();
    const smUp = useMediaQuery(theme.breakpoints.up('sm'), { noSsr: true });
    const itemCount = itemData.length;
    const itemSize = smUp ? 36 : 48;

    const getChildSize = (child: any) => {
      if (Object.prototype.hasOwnProperty.call(child, 'group')) {
        return 48;
      }
      return itemSize;
    };

    const getHeight = useCallback(() => {
      if (itemCount > 8) {
        return 8 * itemSize;
      }
      return itemData.map(getChildSize).reduce((a: number, b: number) => a + b, 0);
    }, [itemCount, itemSize, itemData]);

    const gridRef = useResetCache(itemCount);

    return (
      <Stack ref={ref}>
        <OuterElementContext.Provider value={other}>
          <VariableSizeList
            itemData={itemData}
            height={getHeight() + 2 * LISTBOX_PADDING}
            width="100%"
            ref={gridRef as any}
            outerElementType={OuterElementType as any}
            innerElementType="ul"
            itemSize={(index: number) => getChildSize(itemData[index])}
            overscanCount={5}
            itemCount={itemCount}
          >
            {renderRow as any}
          </VariableSizeList>
        </OuterElementContext.Provider>
      </Stack>
    );
  })
);

// Popper stilizzato (aggancio alla listbox di Autocomplete)
const StyledPopper = React.memo(
  styled(Popper)({
    [`& .${autocompleteClasses.listbox}`]: {
      boxSizing: 'border-box',
      '& ul': {
        padding: 0,
        margin: 0,
      },
    },
  })
);

function Virtualize({ data, dataToInsert }: VirtualizeProps) {
  // const [value, setValue] = useState<string | null>(null);
  const [OPTIONS, setOptions] = useState<string[]>([]);

  useEffect(() => {
    if (data.dataArray) {
      if (typeof data.dataArray[0] !== 'object') {
        const options = (data.dataArray as string[])
          .map((elm) => elm)
          .filter(Boolean)
          .sort((a, b) => a.toUpperCase().localeCompare(b.toUpperCase()));
        setOptions(options);
      } else {
        const options = (data.dataArray as Record<string, any>[])
          .map((elm) => elm[data.ref] as string)
          .filter(Boolean)
          .sort((a, b) => a.toUpperCase().localeCompare(b.toUpperCase()));
        setOptions(options);
      }
    }
  }, [data]);

  const handleChange = (_event: React.SyntheticEvent, newValue: string | null) => {
    // setValue(newValue);

    if (newValue === null) {
      data.noneOnClick();
    } else {
      const findIndex = data.dataArray.findIndex((elm: any) => (elm[data.ref] || elm) === newValue);
      data.menuItemOnClick(data.dataArray[findIndex], findIndex);
    }
  };

  const condition =
    data.label === 'Gruppo'
      ? dataToInsert.categorySelected !== null && dataToInsert.categorySelected !== undefined
        ? Object.keys(dataToInsert.categorySelected).find((elm) => elm === 'SubCategory') !== undefined
          ? false
          : true
        : true
      : data.label === 'Categorie'
        ? dataToInsert.brandSelected !== null && dataToInsert.brandSelected !== undefined
          ? Object.keys(dataToInsert.brandSelected).find((elm) => elm === 'Categories') !== undefined
            ? false
            : true
          : true
        : false;

  // funzione di render (param opzionale per mantenere le chiamate come nell'originale)
  const Render = (cond?: boolean) => (
    <Stack
      sx={{
        width: data.width ? data.width : '31%',
        justifyContent: 'center',
      }}
    >
      <Autocomplete<string, false, false, false>
        id="virtualize-demo"
        disabled={Boolean((cond || false))}
        value={(data.stateRef ? (data.stateRef as any)[data.ref] : null) as string | null}
        disableListWrap
        PopperComponent={StyledPopper as any}
        ListboxComponent={ListboxComponent as any}
        options={OPTIONS}
        renderInput={(params) => (
          <TextField
            placeholder={[data.label].toString()}
            {...params}
            sx={{ cursor: 'pointer', backgroundColor: '#fff', borderRadius: 2 }}
            size="small"
          />
        )}
        // pattern di virtualizzazione MUI: ritorniamo una tupla consumata dal Listbox custom
        renderOption={(props, option, state) => [props, option, state.index] as unknown as React.ReactNode}
        renderGroup={(params) => params as unknown as React.ReactNode}
        onChange={handleChange}
      />
    </Stack>
  );

  return data.label === 'Prefissi'
    ? dataToInsert.brandSelected !== null
      ? Render()
      : null
    : Render(condition);
}

export default memo<VirtualizeProps>(Virtualize);
