import React, {
    useState,
    memo,
    useCallback,
    useEffect,
    forwardRef,
    useContext,
    createContext,
} from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete, {
    autocompleteClasses,
    AutocompleteRenderOptionState,
} from '@mui/material/Autocomplete';
import useMediaQuery from '@mui/material/useMediaQuery';
import ListSubheader from '@mui/material/ListSubheader';
import Popper from '@mui/material/Popper';
import { useTheme, styled } from '@mui/material/styles';
import { VariableSizeList } from 'react-window';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

import { useFiltersContext } from 'context/filtersContext';
import { Buyer } from 'context/GeneralDataContext';
import { UserState } from 'types/UserContext';

const LISTBOX_PADDING = 8; // px

// ---------------------- tipi utili ----------------------
type GroupHeader = {
    group: React.ReactNode;
    key: string;
};

type OptionTuple = [React.HTMLAttributes<HTMLLIElement>, string, number];
type ItemData = GroupHeader | OptionTuple;

function isGroupHeader(item: ItemData): item is GroupHeader {
    return typeof item === 'object' && item !== null && 'group' in item;
}

// narrow per buyerTargetObject proveniente dal context (Record<string, unknown>)
function isBuyer(obj: unknown): obj is Buyer {
    return (
        !!obj &&
        typeof obj === 'object' &&
        'nome' in (obj as any) &&
        'cognome' in (obj as any)
    );
}

// ---------------------- row renderer ----------------------
const renderRow = ({
    data,
    index,
    style,
}: {
    data: ItemData[];
    index: number;
    style: React.CSSProperties;
}) => {
    const dataSet = data[index];
    const inlineStyle: React.CSSProperties = {
        ...style,
        top: (style.top as number) + LISTBOX_PADDING,
        fontSize: 'calc(100% - 8px)',
    };

    if (isGroupHeader(dataSet)) {
        return (
            <ListSubheader key={dataSet.key} component="div" style={inlineStyle}>
                {dataSet.group}
            </ListSubheader>
        );
    }

    const [liProps, option] = dataSet;
    return (
        <Typography component="li" {...liProps} noWrap style={inlineStyle}>
            {option}
        </Typography>
    );
};

// ---------------------- outer element per react-window ----------------------
const OuterElementContext = createContext<Record<string, unknown>>({});

const OuterElementType = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
    function OuterElementType(props, ref) {
        const outerProps = useContext(OuterElementContext);
        return <div ref={ref} {...props} {...(outerProps as any)} />;
    }
);

function useResetCache(data: unknown) {
    const ref = React.useRef<import('react-window').VariableSizeList | null>(null);
    React.useEffect(() => {
        if (ref.current != null) {
            ref.current.resetAfterIndex(0, true);
        }
    }, [data]);
    return ref;
}


// ---------------------- Listbox virtualizzata ----------------------
const ListboxComponent = memo(
    forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(function ListboxComponent(
        props,
        ref
    ) {
        const { children, ...other } = props;

        // prendiamo direttamente l'array dei children come "ItemData[]"
        const itemData = (children as unknown as ItemData[]) ?? [];

        const theme = useTheme();
        const smUp = useMediaQuery(theme.breakpoints.up("sm"), { noSsr: true });
        const itemCount = itemData.length;
        const itemSize = smUp ? 36 : 48;

        const getChildSize = (child: ItemData) => (isGroupHeader(child) ? 48 : itemSize);

        const getHeight = useCallback(() => {
            if (itemCount > 8) return 8 * itemSize;
            return itemData.map(getChildSize).reduce((a, b) => a + b, 0);
        }, [itemCount, itemSize, itemData]);

        const gridRef = useResetCache(itemCount);

        return (
            <Stack ref={ref}>
                <OuterElementContext.Provider value={other}>
                    <VariableSizeList
                        itemData={itemData}
                        height={getHeight() + 2 * LISTBOX_PADDING}
                        width="100%"
                        ref={gridRef}
                        outerElementType={OuterElementType as any}
                        innerElementType="ul"
                        itemSize={(index) => getChildSize(itemData[index])}
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

const StyledPopper = memo(
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


// ---------------------- props del componente principale ----------------------
// allineate al FiltersContext (Record<string, unknown> | null)
type VirtualizeProps = {
    userContext: UserState;
    data?: Buyer[] | null;
    existValue?: boolean;
    setBuyerTarget: React.Dispatch<React.SetStateAction<string | null>>;
    setBuyerTargetObject: React.Dispatch<React.SetStateAction<Record<string, unknown> | null>>;
    buyerTargetObject: Record<string, unknown> | null;
};


// ---------------------- componente principale ----------------------
function Virtualize(props: VirtualizeProps) {
    const { setBrandSelected, setBrandPrefix, setCategorySelected, setSubCategorySelected } = useFiltersContext();

    const { data, setBuyerTarget, setBuyerTargetObject, buyerTargetObject, userContext } = props;

    const [OPTIONS, setOptions] = useState<string[]>([]);

    useEffect(() => {
        if (data && Array.isArray(data)) {
            const options = data
                .map((elm) => `${elm.nome} ${elm.cognome}`)
                .sort((a, b) => a.toUpperCase().localeCompare(b.toUpperCase()));
            setOptions(options);
        } else {
            setOptions([]);
        };
    }, [data]);

    // [PATCH] L'impersonazione tramite filtro admin è solo UI state (non shareable).
    // Per evitare mismatch tra URL e stato, se siamo arrivati dal widget con `widget` in querystring,
    // lo rimuoviamo appena l'admin cambia buyer dal filtro.
    const removeWidgetFromUrlIfPresent = useCallback(() => {
        const url = new URL(window.location.href);
        if (!url.searchParams.has("widget")) return;
        url.searchParams.delete("widget");
        // replaceState: non aggiunge entry in history (utente non "torna indietro" a un URL con widget)
        window.history.replaceState({}, "", url.toString());
    }, []);

    const handleChange = (_: React.SyntheticEvent, newValue: string | null) => {
        setBrandSelected(() => null);
        setBrandPrefix(null);
        setSubCategorySelected(null);
        setCategorySelected(null);

        // [PATCH] Admin impersonation: assicurati che widget NON sia mai persistito in URL.
        // Se arrivo dal widget con widget in URL, lo ripulisco subito.
        removeWidgetFromUrlIfPresent();

        if (!newValue) {
            setBuyerTarget(() => null);
            setBuyerTargetObject(() => null);
            return;
        };

        if (data && data.length) {
            const idx = data.findIndex((elm) => `${elm.nome} ${elm.cognome}` === newValue);

            if (idx >= 0) {
                const id = data[idx]._id;

                setBuyerTarget(() => id);
                setBuyerTargetObject(() => data[idx]);
                return;
            }
        };

        // [PATCH] fallback: se non trovo match, pulisco stato (URL già ripulito sopra).
        setBuyerTarget(() => null);
        setBuyerTargetObject(() => null);
    };

    const displayValue = isBuyer(buyerTargetObject)
        ? `${buyerTargetObject.nome} ${buyerTargetObject.cognome}`
        : null;


    const Render = () => (
        <Stack
            sx={{
                width: '100%',
                minWidth: '11rem',
                margin: 'auto',
                justifyContent: 'center',
                padding: '0 0 10px',
            }}
        >
            <Autocomplete
                id="virtualize-demo"
                value={displayValue}
                disableListWrap
                PopperComponent={StyledPopper as any}
                ListboxComponent={ListboxComponent as any}
                options={OPTIONS}
                renderInput={(params) => (
                    <TextField placeholder="buyers" {...params} sx={{ cursor: 'pointer' }} size="small" />
                )}
                renderOption={(
                    props: React.HTMLAttributes<HTMLLIElement>,
                    option: string,
                    state: AutocompleteRenderOptionState
                ) => [props, option, state.index] as unknown as React.ReactNode}
                renderGroup={(params) => params as unknown as React.ReactNode}
                onChange={handleChange}
            />
        </Stack>
    );

    return Render();
}

export default memo(Virtualize);
