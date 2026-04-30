// src/layouts/compare/filter/virtualizedCategoryFilter.tsx
import React, {
    memo,
    useState,
    useEffect,
    useCallback,
    forwardRef,
    createContext,
    useContext,
} from "react";
import TextField from "@mui/material/TextField";
import Autocomplete, { autocompleteClasses } from "@mui/material/Autocomplete";
import useMediaQuery from "@mui/material/useMediaQuery";
import ListSubheader from "@mui/material/ListSubheader";
import Popper from "@mui/material/Popper";
import { useTheme, styled } from "@mui/material/styles";
import { VariableSizeList } from "react-window";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";

const LISTBOX_PADDING = 8; // px

// ---------------------- tipi utili ----------------------

type DataArrayItem = string | number | Record<string, unknown>;

type VirtualizedCategoryData = {
    label: string;
    /** nome della chiave da leggere quando gli elementi dell'array sono oggetti */
    ref: string;
    /** array opzioni: può contenere stringhe, numeri o oggetti */
    dataArray?: DataArrayItem[];
    /** stato "selezionato" (può essere string/number o oggetto con chiave `ref`) */
    stateRef?: unknown;
    /** callback quando si seleziona una voce */
    menuItemOnClick: (item: DataArrayItem, index: number) => void;
    /** callback “None” */
    noneOnClick: () => void;
};

type VirtualizeProps = {
    data: VirtualizedCategoryData;
    brandSelected: unknown;    // serve solo per mostrare "Prefissi" quando c'è un brand
    categorySelected: unknown; // serve solo per mostrare "Gruppo" quando c'è una categoria
    existValue?: boolean;      // compatibilità
    loading: boolean;         // per future implementazioni
};

// ---------------------- listbox virtualizzata ----------------------

type GroupHeader = { group: React.ReactNode; key: string };
type OptionTuple = [React.HTMLAttributes<HTMLLIElement>, string];
type ItemData = GroupHeader | OptionTuple;

function isGroupHeader(item: ItemData): item is GroupHeader {
    return typeof item === "object" && item !== null && "group" in item;
}

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
        fontSize: "calc(100% - 8px)",
    };

    if (isGroupHeader(dataSet)) {
        return (
            <ListSubheader key={dataSet.key} component="div" style={inlineStyle}>
                {dataSet.group}
            </ListSubheader>
        );
    }

    const [liProps, option] = dataSet as OptionTuple;
    return (
        <Typography component="li" {...liProps} noWrap style={inlineStyle}>
            {option}
        </Typography>
    );
};

const OuterElementContext = createContext<Record<string, unknown>>({});

const OuterElementType = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(
    function OuterElementType(props, ref) {
        const outerProps = useContext(OuterElementContext);
        return <div ref={ref} {...props} {...(outerProps as any)} />;
    }
);

function useResetCache(data: unknown) {
    const ref = React.useRef<import("react-window").VariableSizeList | null>(null);
    React.useEffect(() => {
        if (ref.current != null) {
            ref.current.resetAfterIndex(0, true);
        }
    }, [data]);
    return ref;
}

// ⚠️ ADATTATORE per react-window
// non usiamo React.Children.* perché appiattisce le tuple [liProps, option]!
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

// stile Popper coerente con Autocomplete
const StyledPopper = memo(
    styled(Popper)({
        [`& .${autocompleteClasses.listbox}`]: {
            boxSizing: "border-box",
            "& ul": {
                padding: 0,
                margin: 0,
            },
        },
    })
);

// ---------------------- componente principale ----------------------

function Virtualize(props: VirtualizeProps) {
    const { data, brandSelected, categorySelected, loading } = props;

    const [OPTIONS, setOptions] = useState<string[]>([]);

    useEffect(() => {
        if (!data.dataArray) {
            setOptions([]);
            return;
        }

        const options = data.dataArray
            .map((elm) => {
                if (elm == null) return null;
                if (typeof elm === "string" || typeof elm === "number") return String(elm);
                const val = (elm as Record<string, unknown>)[data.ref];
                return val != null ? String(val) : null;
            })
            .filter((v): v is string => !!v && v.trim() !== "")
            .sort((a, b) => a.toUpperCase().localeCompare(b.toUpperCase()));

        setOptions(options);
    }, [data.dataArray, data.ref]);

    const handleChange = (event: React.SyntheticEvent, newValue: string | null) => {
        if (newValue === null) {
            data.noneOnClick();
        } else if (data.dataArray && data.dataArray.length) {
            const idx = data.dataArray.findIndex((elm) => {
                const raw = typeof elm === "object" && elm !== null ? (elm as any)[data.ref] : elm;
                return String(raw) === newValue;
            });
            if (idx >= 0) data.menuItemOnClick(data.dataArray[idx], idx);
        }
    };

    // value visualizzato (string | null)
    const currentValue =
        data.stateRef != null
            ? String(
                (typeof data.stateRef === "object" && data.stateRef
                    ? (data.stateRef as any)[data.ref]
                    : data.stateRef) ?? ""
            )
            : null;

    const Render = () => (
        <Stack
            sx={{
                width: "100%",
                minWidth: "11rem",
                maxWidth: "11rem",
                margin: "auto",
                justifyContent: "center",
                padding: "0 0 10px",
            }}
        >
            {loading ? <div className="h-9 w-full rounded bg-gray-200 dark:bg-gray-800 animate-pulse mb-2" /> : <Autocomplete<string, false, false, false>
                id="virtualize-demo"
                value={currentValue}
                disableListWrap
                PopperComponent={StyledPopper as any}
                ListboxComponent={ListboxComponent as any}
                options={OPTIONS}
                renderInput={(params) => (
                    <TextField placeholder={String(data.label)} {...params} sx={{ cursor: "pointer" }} size="small" />
                )}
                // restituisce una TUPLA che poi la listbox renderizza come <li {...props}>{option}</li>
                renderOption={(liProps, option) => [liProps, option] as unknown as React.ReactNode}
                onChange={handleChange}
                noOptionsText="Nessun risultato"
            />}
        </Stack>
    );

    // condizioni di visualizzazione come nel codice originale
    const showForPrefissi = data.label === "Prefissi" ? brandSelected != null : true;

    const showForGruppo =
        data.label === "Gruppo"
            ? categorySelected != null &&
            typeof categorySelected === "object" &&
            Object.prototype.hasOwnProperty.call(categorySelected, "SubCategory")
            : true;

    return showForPrefissi && showForGruppo ? Render() : null;
}

export default memo(Virtualize);
