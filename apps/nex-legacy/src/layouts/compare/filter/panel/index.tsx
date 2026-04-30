import React, { useRef, useCallback } from "react";

import { useUserContext } from "context/UserContext";
import { useSearchData } from "context/SearchDataContext";
import { useFiltersContext } from "context/filtersContext";

import { SendFilters } from "../../virtualziedTable/fetchData/sendFilters";
import { ExcludeElements } from "../../virtualziedTable/fetchData/excludeElements";
import { ComposeFilters } from "../composeFilters";

import { WarehouseData } from "layouts/compare/virtualziedTable/fetchData/warehouse";
import { CategoriesData } from "layouts/compare/virtualziedTable/fetchData/categories";

import Icon from "@mui/material/Icon";
import { IoSearch } from "react-icons/io5";
import { Backdrop, Card, Divider, Stack } from "@mui/material";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import Filter from "layouts/compare/filter";

import { SearchDataContextLike } from "layouts/compare";
import FDButton from "components/UI/buttons/FDButton";
import { useNexTheme } from "@nex/theme-system";

const SearchIcon = IoSearch as React.FC<{ size?: number; className?: string }>;

type CodiceListino = { codice?: string | number } | null;

type FiltersPanelProps = {
    ChangeFilterPanelStatus: () => void;
    loadStatus: { [key: string]: any };
    ChangeLoadStatus: (params: { from: string; bool: boolean }) => void;
    codicePromo: string;
    setCodicePromo: React.Dispatch<React.SetStateAction<string>>;
    codiceListino: CodiceListino;
    setCodiceListino: React.Dispatch<React.SetStateAction<CodiceListino>>;
    offset: React.MutableRefObject<number>;
};

function FiltersPanel({
    codicePromo,
    codiceListino,
    offset,
    loadStatus,
    ChangeLoadStatus,
    setCodicePromo,
    ChangeFilterPanelStatus,
    setCodiceListino,
}: FiltersPanelProps) {
    const [searchDataContext, setSearchDataContext] =
        useSearchData() as unknown as [
            SearchDataContextLike,
            React.Dispatch<React.SetStateAction<SearchDataContextLike>>
        ];
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const [userContext] = useUserContext();

    const abortController = useRef<AbortController | null>(null);

    const {
        brandSelected,
        setBrandSelected,
        brandPrefix,
        setBrandPrefix,
        categorySelected,
        setCategorySelected,
        subcategorySelected,
        setSubCategorySelected,
        buyerTarget,
        setBuyerTarget,
        priceFilter,
        DispWithout0,
        setDispWithout0,
        dfValue,
        setdfValue,
        status,
        setStatus,
        panelMode,
        setPanelMode,
        noteWith,
        setNoteWith,
    } = useFiltersContext();

    const composeFiltersFunc = () => {
        const query = ComposeFilters({
            brandSelected,
            brandPrefix,
            categorySelected,
            subcategorySelected,
            priceFilter,
            DispWithout0,
            dfValue,
            noteWith,
            codicePromo,
            codiceListino
        });
        SendFiltersAPI(query);
    };

    const CategoriesRetriveData = useCallback(
        (queryColumns: unknown) => {
            CategoriesData({
                setSearchDataContext,
                userContext,
                buyerTarget,
                abortController,
                queryColumns,
                ChangeLoadStatus,
            });
        },
        [userContext, buyerTarget, setSearchDataContext]
    );

    const WarehouseRetriveData = useCallback(
        ({ query, queryColumns }: { query: string; queryColumns: { Name: string }[] }) => {
            ChangeLoadStatus({ from: "warehouse", bool: true });
            WarehouseData({
                userContext: (userContext as unknown) as { token: string; details?: any | null },
                buyerTarget: buyerTarget ?? null,
                abortController,
                query,
                queryColumns,
                setSearchDataContext,
                CategoriesRetriveData,
            });
        },
        [userContext, buyerTarget, setSearchDataContext, CategoriesRetriveData]
    );

    const SendFiltersAPI = useCallback(
        (query: string) => {
            offset.current = 0;
            ChangeLoadStatus({ from: "table", bool: true });
            SendFilters({
                setSearchDataContext,
                userContext: (userContext as unknown) as { token: string; details?: any | null },
                buyerTarget: buyerTarget ?? null,
                query,
                abortController,
                setPanelMode,
                WarehouseRetriveData,
                ChangeLoadStatus,
                offset,
            });
            ChangeFilterPanelStatus();
        },
        [userContext, buyerTarget, setPanelMode, setSearchDataContext, offset]
    );

    const ExcludeElementsAPI = useCallback(async () => {
        ChangeFilterPanelStatus();
        ChangeLoadStatus({ from: "table", bool: true });
        setPanelMode(1);

        try {
            await ExcludeElements(
                setSearchDataContext as any,
                userContext!,
                buyerTarget,
                abortController,
                setPanelMode
            );
        } catch (e) {
            // opzionale: notifica errore
        } finally {
            ChangeLoadStatus({ from: "table", bool: false });
        }
    }, [
        userContext,
        buyerTarget,
        setPanelMode,
        setSearchDataContext,
        ChangeLoadStatus,
    ]);

    return (
        <Backdrop
            open={true}
            sx={{
                color: "#fff",
                zIndex: (theme: any) => theme.zIndex.drawer + 1,
            }}
            // tailwind per assicurare layout mobile-friendly
            className="!p-0"
        >
            {/* Pannello: full width su mobile, drawer a destra da sm in su */}
            <Card
                data-tour="filters-panel"
                sx={{
                    position: "fixed",
                    top: 0,
                    right: 0,
                    height: "100dvh",
                    width: { xs: "100vw", sm: 420 }, // sm: drawer, xs: full screen
                    maxWidth: "100vw",
                    borderRadius: { xs: 0, sm: 0 }, // senza angoli per effetto drawer
                    display: "flex",
                    flexDirection: "column",
                }}
                className="w-screen sm:w-[420px] h-[100dvh] max-h-[100dvh]"
            >
                {/* contenitore colonna: header + body scroll + footer */}
                <Stack
                    p={2}
                    className="w-full h-full overflow-hidden"
                    alignItems="stretch"
                    translate="no"
                    spacing={1.5}
                >
                    {/* header */}
                    <Stack
                        direction="row"
                        width="100%"
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        className="sticky top-0 z-10 bg-white/90 dark:bg-neutral-900/90 backdrop-blur px-1 py-2"
                    >
                        <MDBox>
                            <MDTypography variant="h5">Filtri</MDTypography>
                        </MDBox>
                        <Icon
                            data-tour="filters-close"
                            sx={({ typography: { size }, palette: { dark, white } }: any) => ({
                                fontSize: `${size.lg} !important`,
                                color: darkMode ? white.main : dark.main,
                                stroke: "currentColor",
                                strokeWidth: "2px",
                                cursor: "pointer",
                            })}
                            onClick={ChangeFilterPanelStatus}
                        >
                            close
                        </Icon>
                    </Stack>

                    <Divider sx={{ width: "100%", backgroundColor: "#000", mb: 1 }} />

                    {/* body scrollabile */}
                    <div className="flex-1 min-h-0 overflow-y-auto pr-1 -mr-1">
                        <Filter
                            brandPrefix={brandPrefix}
                            searchDataContext={searchDataContext}
                            setBrandPrefix={setBrandPrefix}
                            setSubCategorySelected={setSubCategorySelected}
                            setCategorySelected={setCategorySelected}
                            categorySelected={categorySelected}
                            brandSelected={brandSelected}
                            setBrandSelected={setBrandSelected}
                            setdfValue={setdfValue}
                            dfValue={dfValue}
                            setBuyerTarget={setBuyerTarget}
                            priceFilter={priceFilter}
                            setStatus={setStatus}
                            status={status}
                            setDispWithout0={setDispWithout0}
                            ExcludeElementsAPI={ExcludeElementsAPI}
                            codicePromo={codicePromo}
                            setCodicePromo={setCodicePromo}
                            codiceListino={codiceListino}
                            setCodiceListino={setCodiceListino}
                        />
                    </div>

                    {/* footer fisso con CTA */}
                    <div className="pt-2">
                        <span
                            data-tour="filters-panel-cerca"
                            className="inline-flex"
                            style={{ width: 'fit-content' }}
                        >
                            <FDButton
                                variant="solid"
                                color="primary"
                                className="w-full sm:w-auto"
                                icon={<SearchIcon />}
                                onClick={composeFiltersFunc}
                            >
                                Cerca
                            </FDButton>
                        </span>
                    </div>
                </Stack>
            </Card>
        </Backdrop>
    );
}

export default FiltersPanel;