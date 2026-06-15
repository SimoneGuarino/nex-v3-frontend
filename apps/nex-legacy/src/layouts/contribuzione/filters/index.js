import { Backdrop, Button, Card, Divider, Stack } from '@mui/material';
import React from 'react';
import VirtualizedList from "./virtualizedCategoryFilter";
import { icon_close } from 'config/icons';
import { icon_info } from 'config/icons';

import AdminFilter from './admin';
import MDTypography from 'components/MDTypography';
import FDIconButton from 'components/UI/buttons/FDIconButton';




const TypeCode = [{name: 'Codici REL', index: "1"}, {name: 'Codici EOL', index: "2"},
{name: 'Codici Discontinui', index: "3"}, {name: 'Codici ADJ', index: "4"},
{name: 'Codici Slow Moving', index: "5"}, {name: 'Codici su Ordinazione', index: "E"}];



export function Filters(props) {
    const {
        buyerTarget,
        setBuyerTarget,
        brandSelected,
        setBrandSelected,
        brandPrefix,
        setBrandPrefix,
        categorySelected,
        setCategorySelected,
        subcategorySelected,
        setSubCategorySelected,
        typeSelected,
        setTypeSelected,
        contributionsPersonalList,
    } = props;
    const { searchDataContext } = props;
    const { filterOpen, ChangeStatusFilters, composeFiltersFunc, loadState } = props;


    const data = [
        {
            label: "Brand",
            ref: "Brand",
            stateRef: brandSelected,
            noneOnClick: () => {
                setBrandSelected(() => null);
                setBrandPrefix(() => null);
            },
            menuItemOnClick: (item, id) => {
                setBrandSelected(() => item);
            },
            dataArray: searchDataContext.brand
        },
        {
            label: "Prefissi",
            ref: "",
            stateRef: brandPrefix,
            noneOnClick: () => {
                setBrandPrefix(() => null);
            },
            menuItemOnClick: (item, id) => {
                setBrandPrefix(() => item);
            },
            dataArray: props.brandSelected?.PrefissiFornitore
        },
        {
            label: "Categorie",
            ref: "DescrizioneLinea",
            stateRef: categorySelected,
            noneOnClick: () => {
                setCategorySelected(() => null);
                setSubCategorySelected(() => null);
            },
            menuItemOnClick: (item, id) => {
                setCategorySelected(() => item);
            },
            dataArray: searchDataContext.categories
        },
        {
            label: "Gruppo",
            ref: "DescrizioneGruppo",
            stateRef: subcategorySelected,
            noneOnClick: () => {
                setSubCategorySelected(() => null);
            },
            menuItemOnClick: (item, id) => {
                setSubCategorySelected(() => item);
            },
            dataArray: props.categorySelected?.SubCategory
        },
        {
            label: "Tipo Flag",
            ref: "name",
            stateRef: typeSelected,
            noneOnClick: () => {
                setTypeSelected(() => null);
            },
            menuItemOnClick: (item, id) => {
                setTypeSelected(() => item);
            },
            dataArray: TypeCode
        }
    ];


    const filterRender = React.useMemo(() => (
        <Stack gap={1} sx={{
            flexDirection: 'row',
            maxWidth: "20em",
            alignItems: "center",
            flexWrap: "wrap",
        }}>
            {data.map((data, index) => {
                let component;
                if(data.label == 'Tipo Flag'){
                    component = <Stack key={index} width='100%' color='#979797' gap={0.5}>
                        <Stack direction='row' alignItems='center' gap={1}>
                            {icon_info({color: 'inherit', width: 15, height: 15})}
                            <MDTypography sx={{color:'inherit', fontSize:'0.665em'}}>
                                Flag Gestione dei Codici</MDTypography>
                        </Stack>
                        <VirtualizedList key={index} data={data} index={index}
                        brandSelected={brandSelected} categorySelected={categorySelected} />
                    </Stack>
                }else{
                    component = <VirtualizedList key={index} data={data} index={index}
                    brandSelected={brandSelected} categorySelected={categorySelected} />
                }
                
                return component
            })}
        </Stack>
    ), [searchDataContext, brandSelected, categorySelected, brandPrefix, typeSelected])

    return (<Backdrop open={filterOpen} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Card sx={{height: '100%', width: '400px', position: 'inherit', 
        right: 0, top: 0}}>
        <Stack dismissible="true" p={2} height='100%' width='100%' alignItems="center" translate="no">
            <Stack direction='row' width='100%'>
                <MDTypography fontSize={'1.3em'} pl='10px'>Filtri</MDTypography>
                <FDIconButton icon={icon_close()} className="ml-auto" onClick={() => ChangeStatusFilters()} />
            </Stack>

            <Divider sx={{backgroundColor: '#ccc', width: '100%'}}/>

            <MDTypography fontSize='0.765em' mb={3}>
                {icon_info()} Seleziona un brand o una categoria in modo da far apparire gli altri box correlati.</MDTypography>
            {filterRender}
            <AdminFilter buyerTarget={buyerTarget} setBuyerTarget={setBuyerTarget}/>
            <Button disabled={loadState} onClick={() => composeFiltersFunc()} 
            sx={{marginTop: 'auto', marginLeft: 'auto', color: '#fff', marginBottom: 2}}  variant="contained">
                Cerca
            </Button>
        </Stack></Card>
    </Backdrop>

    )
} 