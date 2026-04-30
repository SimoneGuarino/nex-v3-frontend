import React from 'react';

import { Card, Divider, IconButton, Stack } from '@mui/material';
import VirtualizedList from "./virtualizedCategoryFilter";

import { icon_filter, icon_search } from 'config/icons';
import FDIconButton from 'components/UI/buttons/FDIconButton';
import FDBox from 'components/UI/box/FDBox';


interface FilterPanelProps {
    generalLoad: boolean;
    brandSelected: object;
    setBrandSelected: (prev: any) => void;
    brandPrefix: object;
    setBrandPrefix: (prev: any) => void;
    categorySelected: object;
    setCategorySelected: (prev: any) => void;
    subcategorySelected: object;
    setSubCategorySelected: (prev: any) => void;

    searchDataContext: any;
    composeFiltersFunc: (from: string) => void;
}

interface FilterRenderProps {
    data: Array<object>;
    brandSelected: object;
    categorySelected: object;
}



const FilterRender: React.FC<FilterRenderProps> = ({ data, brandSelected, categorySelected }) => (
    <Stack direction="row" gap={1} sx={{
        alignItems: "center",
        flexWrap: "wrap",
    }}>
        {data.map((elm: any, index: number) => {
            return <VirtualizedList key={index} data={elm}
                brandSelected={brandSelected} categorySelected={categorySelected} />
        })}
    </Stack>
)


export const FiltersPanel: React.FC<FilterPanelProps> = ({
    generalLoad,
    brandSelected, setBrandSelected,
    brandPrefix, setBrandPrefix,
    categorySelected, setCategorySelected,
    subcategorySelected, setSubCategorySelected, searchDataContext,
    composeFiltersFunc
}) => {


    let data = [
        {
            label: "Marca",
            ref: "Marca",
            stateRef: brandSelected,
            noneOnClick: () => {
                setBrandSelected(() => null);
                setBrandPrefix(() => null);
            },
            menuItemOnClick: (item: object) => {
                setBrandSelected(() => item);
            },
            dataArray: searchDataContext.categories
        },
        {
            label: "Prefissi",
            ref: "",
            stateRef: brandPrefix,
            noneOnClick: () => {
                setBrandPrefix(() => null);
            },
            menuItemOnClick: (item: object) => {
                setBrandPrefix(() => item);
            },
            dataArray: (brandSelected as any)?.PrefissiFornitore
        },
        {
            label: "Categorie",
            ref: "DescrizioneLinea",
            stateRef: categorySelected,
            noneOnClick: () => {
                setCategorySelected(() => null);
                setSubCategorySelected(() => null);
            },
            menuItemOnClick: (item: object) => {
                setCategorySelected(() => item);
            },
            dataArray: (brandSelected as any)?.Categories
        },
        {
            label: "Gruppo",
            ref: "DescrizioneGruppo",
            stateRef: subcategorySelected,
            noneOnClick: () => {
                setSubCategorySelected(() => null);
            },
            menuItemOnClick: (item: object) => {
                setSubCategorySelected(() => item);
            },
            dataArray: (categorySelected as any)?.SubCategory
        }
    ];


    return <FDBox radius='2xl' className="flex items-center gap-2 p-2
    bg-white/90 dark:bg-neutral-900/80
    backdrop-blur supports-[backdrop-filter]:backdrop-blur border border-black/5 dark:border-white/10" translate="no">
        {icon_filter({ mr: 1.5, })}
        <FilterRender data={data} brandSelected={brandSelected} categorySelected={categorySelected} />
        <Stack direction='row' ml='auto' height='100%'>
            <Divider orientation='vertical'
                sx={{ height: '100%', width: '1px', backgroundColor: '#ccc' }} />
            <FDIconButton
                variant='text'
                dataTooltipId='general-compare-tooltip'
                dataTooltipContent='Cerca i prodotti'
                disabled={generalLoad}
                onClick={() => composeFiltersFunc('table')}
                icon={icon_search({ width: 20, height: 20 })} />
        </Stack>
    </FDBox>
}