import React, { useState, useMemo, useCallback, memo } from "react";
import MDBox from "components/MDBox";
import AdminFilter from "./admin";
import { useFiltersContext } from "context/filtersContext";

import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Stack from "@mui/material/Stack";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputAdornment from "@mui/material/InputAdornment";
import InventoryIcon from "@mui/icons-material/Inventory";
import PanToolOutlinedIcon from "@mui/icons-material/PanToolOutlined";
import SpeakerNotesOutlinedIcon from "@mui/icons-material/SpeakerNotesOutlined";
import Switch from "@mui/material/Switch";
import Icon from "@mui/material/Icon";
import VirtualizedList from "./virtualizedCategoryFilter";
import { Divider, TextField } from "@mui/material";
import MDTypography from "components/MDTypography";
import { MainTheme } from "assets/settingsTheme";
import { icon_eurSymbol, icon_percent } from "config/icons";
import { useGeneralDataContext } from "context/GeneralDataContext";
import { useNexTheme } from "@nex/theme-system";

// ---------------------- tipi ----------------------

// più flessibile: descrizione è opzionale (il tuo CodiceListino spesso ha solo "codice")
type PriceListLike = {
    codice?: string | number;
    descrizione?: string;
} & Record<string, unknown>;

type FilterProps = {
    // dati esterni (shape dinamico in app)
    searchDataContext: any;

    ExcludeElementsAPI: () => void;

    // promo/listino
    codicePromo: string;
    setCodicePromo: React.Dispatch<React.SetStateAction<string>>;
    codiceListino: PriceListLike | null;
    setCodiceListino: React.Dispatch<React.SetStateAction<PriceListLike | null>>;

    // toggle € / %
    dfValue: boolean;
    setdfValue: React.Dispatch<React.SetStateAction<boolean>>;

    // per popolare “Prefissi” e “Gruppo” (possono anche essere stringhe/null)
    brandSelected?: { PrefissiFornitore?: string[] } | string | null;
    categorySelected?: { SubCategory?: unknown[] } | string | null;

    // props extra (passate dal pannello; le accetto per compatibilità)
    brandPrefix?: string | null;
    setBrandPrefix?: React.Dispatch<React.SetStateAction<string | null>>;
    setSubCategorySelected?: React.Dispatch<React.SetStateAction<any>>;
    setCategorySelected?: React.Dispatch<React.SetStateAction<any>>;
    setBrandSelected?: React.Dispatch<React.SetStateAction<any>>;
    setBuyerTarget?: React.Dispatch<React.SetStateAction<string | null>>;
    priceFilter?: number;
    setStatus?: React.Dispatch<React.SetStateAction<boolean>>;
    status?: boolean;
    setDispWithout0?: React.Dispatch<React.SetStateAction<boolean>>;
};

// stato locale per gli input prezzo (logica originale)
type DFValueLocalState = {
    negativeValue?: number | string;
    positiveValue?: number | string;
};

// ---------------------- componente ----------------------

function Filter(props: FilterProps) {
    const { globalData } = useGeneralDataContext() as any;
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const {
        brandSelected,
        setBrandSelected,
        brandPrefix,
        setBrandPrefix,
        categorySelected,
        setCategorySelected,
        subcategorySelected,
        setSubCategorySelected,
        DispWithout0,
        setDispWithout0,
        noteWith,
        setNoteWith,
        priceFilter,
        setPriceFilter,
    } = useFiltersContext();

    const { searchDataContext, ExcludeElementsAPI } = props;

    const [dfvalue, setdfvalue] = useState<DFValueLocalState>({
        negativeValue: 0,
        positiveValue: 0,
    });

    const data = [
        {
            label: "Brand",
            ref: "Brand",
            stateRef: brandSelected,
            noneOnClick: () => {
                setBrandSelected(() => null);
                setBrandPrefix(() => null);
            },
            menuItemOnClick: (item: any) => setBrandSelected(() => item),
            dataArray: searchDataContext?.brand,
        },
        {
            label: "Prefissi",
            ref: "",
            stateRef: brandPrefix,
            noneOnClick: () => setBrandPrefix(() => null),
            menuItemOnClick: (item: any) => setBrandPrefix(() => item),
            dataArray:
                props.brandSelected && typeof props.brandSelected === "object"
                    ? props.brandSelected.PrefissiFornitore
                    : undefined,
        },
        {
            label: "Categorie",
            ref: "DescrizioneLinea",
            stateRef: categorySelected,
            noneOnClick: () => {
                setCategorySelected(() => null);
                setSubCategorySelected(() => null);
            },
            menuItemOnClick: (item: any) => setCategorySelected(() => item),
            dataArray: searchDataContext?.categories,
        },
        {
            label: "Gruppo",
            ref: "DescrizioneGruppo",
            stateRef: subcategorySelected,
            noneOnClick: () => setSubCategorySelected(() => null),
            menuItemOnClick: (item: any) => setSubCategorySelected(() => item),
            dataArray:
                props.categorySelected && typeof props.categorySelected === "object"
                    ? (props.categorySelected as any).SubCategory
                    : undefined,
        },
    ];

    const handleChangeNumber = useCallback(
        (tp: "negativeValue", e: string) => {
            const onlyDashes = /^-*$/.test(e);
            if (onlyDashes) {
                setdfvalue(() => ({ [tp]: Math.abs(0) }));
                setPriceFilter(0);
                return;
            }

            const isValidInput = /^-?\d*\.?\d*$/.test(e) || e === "0";
            setdfvalue((prev) => ({ ...prev, [tp]: isValidInput ? e : prev[tp] }));
            if (!isValidInput) return;

            const parsed = parseFloat(e);
            setPriceFilter(Number.isNaN(parsed) ? 0 : -Math.abs(parsed));
        },
        [setPriceFilter]
    );

    // memo per evitare render inutili
    // Render del filtro (brand, prefissi, categorie, gruppo)
    const filterRender = useMemo(
        () => (
            <Stack
                direction="row"
                gap={1}
                sx={{ maxWidth: "20em", alignItems: "center", flexWrap: "wrap" }}
                className="w-full md:max-w-none flex-wrap"
            >
                {data.map((d, index) => (
                    <VirtualizedList
                        key={index}
                        data={d}
                        brandSelected={brandSelected}
                        categorySelected={categorySelected}
                        loading={!!!(Array.isArray(searchDataContext?.brand) && searchDataContext?.brand.length > 0)}
                    />
                ))}
            </Stack>
        ),
        [searchDataContext, brandSelected, categorySelected, brandPrefix]
    );

    return (
        <Stack
            width="100%"
            sx={{ marginTop: 2 }}
            gap="1em"
            alignItems="center"
            translate="no"
            className="w-full mt-2"
        >
            {/* blocco filtri (brand/prefissi/categorie/gruppo) */}
            <div className="w-full" data-tour="filters-panel-brand-cat">{filterRender}</div>

            <Divider className="w-full" sx={{ margin: 0, width: "100%", backgroundColor: "#ccc", marginBottom: 2 }} />

            {/* griglia responsive: 1 col -> 2 col -> 3 col */}
            <Stack
                direction="row"
                flexWrap="wrap"
                gap={1}
                alignItems="center"
                className="grid w-full grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 items-start"
            >
                {/* blocco: doppi input prezzo (€/%), mantiene MUI ma aggiunge classi */}
                <div
                    data-tour="filters-panel-var"
                    className="col-span-full grid grid-cols-2 gap-3 items-start w-full">
                    <MDBox className="col-span-2 flex flex-row gap-2 items-end flex-nowrap">
                        <FormControl style={{ maxWidth: "5.5em" }} className="w-24 sm:w-28">
                            <Tooltip title="Prezzo Focelda più alto di..">
                                <InputLabel htmlFor="outlined-adornment-amount">
                                    <Icon fontSize="small" color="inherit">payments</Icon> Focelda
                                    <Icon fontSize="small" color="inherit">arrow_upward</Icon>
                                </InputLabel>
                            </Tooltip>
                            <OutlinedInput
                                id="outlined-adornment-amount"
                                startAdornment={
                                    <InputAdornment
                                        position="start"
                                        style={{ cursor: "pointer" }}
                                        onClick={() => props.setdfValue((v) => !v)}
                                    >
                                        {props.dfValue ? icon_eurSymbol({ width: 20, height: 20 }) : icon_percent({ width: 20, height: 20 })}
                                    </InputAdornment>
                                }
                                label="number"
                                type="number"
                                value={priceFilter > 0 ? priceFilter : 0}
                                onClick={() => setdfvalue(() => ({ negativeValue: 0 }))}
                                onChange={(e) => {
                                    setdfvalue(() => ({ positiveValue: e.target.value }));
                                    setPriceFilter(Math.abs(Number(e.target.value)));
                                }}
                            />
                        </FormControl>

                        <FormControl style={{ maxWidth: "5.5em" }} className="w-24 sm:w-28">
                            <Tooltip title="Prezzo Focelda più basso di..">
                                <InputLabel htmlFor="outlined-adornment-amount">
                                    <Icon fontSize="small" color="inherit">payments</Icon> Focelda
                                    <Icon fontSize="small" color="inherit">arrow_downward</Icon>
                                </InputLabel>
                            </Tooltip>
                            <OutlinedInput
                                id="outlined-adornment-amount"
                                startAdornment={
                                    <InputAdornment
                                        position="start"
                                        style={{ cursor: "pointer" }}
                                        onClick={() => props.setdfValue((v) => !v)}
                                    >
                                        {props.dfValue ? icon_eurSymbol({ width: 20, height: 20 }) : icon_percent({ width: 20, height: 20 })}
                                    </InputAdornment>
                                }
                                label="number"
                                type="text"
                                value={priceFilter < 0 ? priceFilter : 0}
                                onChange={(e) => handleChangeNumber("negativeValue", e.target.value)}
                                onClick={() => setdfvalue(() => ({ positiveValue: 0 }))}
                            />
                        </FormControl>
                    </MDBox>

                    {/* toggle disponibilità */}
                    <div className="col-span-1 flex flex-row gap-1 items-center flex-nowrap">
                        <Stack
                            flexDirection="column"
                            alignItems="center"
                            data-tooltip-id="general-compare-tooltip"
                            data-tooltip-content="Disponibilità Focelda superiori a 0"
                            className="flex flex-col items-center"
                        >

                            <MDBox display="flex" style={{ fontSize: "0.72em" }}>
                                <InventoryIcon sx={darkMode ? { color: palette.grey[500] } : {}} />
                                <p style={{ fontFamily: "monospace", fontSize: "0.81em", color: `${darkMode ? palette.grey[500] : ""}` }}>
                                    {">0"}
                                </p>
                            </MDBox>
                            <Switch checked={DispWithout0} onChange={() => setDispWithout0((v) => !v)} name="gilad" />
                        </Stack>

                        {/* toggle con note */}
                        <Stack
                            flexDirection="column"
                            alignItems="center"
                            data-tooltip-id="general-compare-tooltip"
                            data-tooltip-content="Trova gli elementi che hanno almeno 1 nota"
                            className="flex flex-col items-center"
                        >
                            <MDBox display="flex" style={{ fontSize: "0.72em" }}>
                                <SpeakerNotesOutlinedIcon
                                    sx={{ width: "1.3em", height: "1.3em", color: `${darkMode ? palette.grey[500] : ""}` }}
                                />
                            </MDBox>
                            <Switch checked={noteWith} onChange={() => setNoteWith((v) => !v)} name="gilad" />
                        </Stack></div>


                    {/* riga: pulsante elementi esclusi → span full width */}
                    <Stack direction="row" width="100%" alignItems="center" className="col-span-3">
                        <MDTypography fontSize="0.8rem" variant="body2">
                            Visualizza gli elementi esclusi dalla lista
                        </MDTypography>
                        <IconButton
                            sx={{ ml: "auto" }}
                            data-tooltip-id="general-compare-tooltip"
                            data-tooltip-content="Visualizza gli elementi esclusi"
                            onClick={() => ExcludeElementsAPI()}
                            aria-label="excluded"
                        >
                            <PanToolOutlinedIcon sx={darkMode ? { color: palette.grey[500] } : {}} />
                        </IconButton>
                    </Stack></div>

                {/* divider a tutta larghezza */}
                <Divider className="col-span-full" sx={{ backgroundColor: "#000" }} />

                {/* input promo a tutta larghezza */}
                <Stack width="100%" gap={0.5} className="col-span-full" data-tour="filters-panel-cod">
                    <MDTypography fontSize="0.8rem" variant="body2">Cerca un Codice Promo del listino 03</MDTypography>
                    <TextField
                        className="w-full"
                        value={props.codicePromo}
                        onChange={(e) => props.setCodicePromo(e.target.value?.toUpperCase())}
                        label="Codice Promo"
                        variant="outlined"
                    />
                </Stack>

                {/* autocomplete listino a tutta larghezza (con margine top già presente) */}
                {/*<Autocomplete<PriceListLike, false, true, false>
                    disablePortal
                    disableClearable
                    sx={{ width: "100%", mt: 1.5 }}
                    className="col-span-full"
                    value={props.codiceListino ?? undefined} // disableClearable → T | undefined
                    onChange={(_event, newValue) => props.setCodiceListino(newValue ?? null)}
                    options={(globalData?.pricesLists || []) as PriceListLike[]}
                    isOptionEqualToValue={(opt, val) =>
                        (opt.codice ?? opt.descrizione) === (val.codice ?? val.descrizione)
                    }
                    getOptionLabel={(option) => option.descrizione ?? String(option.codice ?? "")}
                    renderInput={(params) => <TextField {...params} label="Codice Listino" className="w-full" />}
                />*/}
            </Stack>

            <AdminFilter />
        </Stack>
    );
}

export default memo(Filter);
