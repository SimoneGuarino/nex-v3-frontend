import React from 'react';
import {
    Backdrop, IconButton, Slide, Stack, Autocomplete,
    TextField, Checkbox,
    Card
} from "@mui/material";
import MDTypography from "components/MDTypography";
import VirtualizedList from "./virtualizedCategoryFilter";
import { format } from 'date-fns';

import { icon_close, icon_search } from 'config/icons';
import LoadingButton from '@mui/lab/LoadingButton';
import { MainTheme } from 'assets/settingsTheme';
import { useNexTheme } from '@nex/theme-system';


const label = { inputProps: { 'aria-label': 'Checkbox demo' } };


export function FiltersStock({ filterStatus, setFilterStatus, filtersData, DataRetrive, userContext,
userChoose, setUserChoose, CheckAdminDev, categorySelected, setCategorySelected, tableLoad }) {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const handleFilterChange = React.useCallback((type, from, e) => {
        switch (type) {
            case 'date':
                const composeDate = format(new Date(e), 'dd/MM/yyyy');//'dd/MM/yy');//e.$D + "/" + e.$M + "/" + e.$y;
                setUserChoose(prev => {
                    return { ...prev, [from]: composeDate };
                });
                break;
            case 'string':
                if (from == 'brand') {
                    //cerca il brand e assegna il CODBRAND da poi poter inviare al server.
                    const findE = e ? filtersData.brands.find(elm => elm.marca == e).codice : null;
                    setUserChoose(prev => {
                        return { ...prev, [from]: findE };
                    });
                } else {
                    setUserChoose(prev => {
                        return { ...prev, [from]: e };
                    });
                }
                break;
            case 'bool':
                setUserChoose(prev => {
                    return { ...prev, [from]: e };
                });
                break;
        }
    }, [userChoose]);

    const data = [
        {
            label: "Categorie",
            ref: "descrizioneLinea",
            stateRef: categorySelected,
            noneOnClick: () => {
                setCategorySelected(() => null);
            },
            menuItemOnClick: (item, id) => {
                setCategorySelected(() => item);
            },
            dataArray: filtersData?.categories
        },
    ];

    const filterRender = React.useMemo(() => (
        <Stack gap={1} sx={{
            flexDirection: 'row',
            alignItems: "center",
            flexWrap: "wrap",
        }}>
            {filtersData?.categories && data.map((data, index) => {
                let component;
                component = <VirtualizedList key={index} data={data} index={index}
                brandSelected={null} categorySelected={categorySelected} />
                return component
            })}
        </Stack>
    ), [filtersData, categorySelected])


    return (
        <Backdrop open={filterStatus} sx={{ color: '#fff', justifyContent: 'flex-end', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Slide direction="left" in={filterStatus} timeout={700}>
                <Card sx={{
                    zIndex: 2, padding: 5, width: "25%", height: "100%", minWidth: '350px', borderTopRightRadius: 2, borderBottomRightRadius: 2,
                    maxWidth: '400px', position: 'relative', boxShadow: '0 1rem 6rem rgba(0, 0, 0, 0.1)',
                }}>
                <Stack gap={3} sx={{ width: '100%', height: '100%' }}
                    alignItems="center"
                    overflow='hidden'
                    justifyContent="center">
                    <IconButton onClick={() => setFilterStatus(false)} sx={{ position: 'absolute', top: 10, right: 10 }}>
                        {icon_close()}</IconButton>
                    {CheckAdminDev && <Stack gap={1}>
                        <MDTypography component='p' sx={{ fontSize: '0.79rem', fontWeight: 300,  }}>
                            Seleziona il buyer di interesse o lascia vuoto per selezionarli tutti</MDTypography>
                        <Autocomplete
                            disablePortal
                            value={userChoose.byr}
                            disabled={filtersData == null ? true : false}
                            onChange={(_, newValue) => handleFilterChange('string', 'byr', newValue)}
                            options={
                                (filtersData?.buyers || []).map(elm => elm.codice)
                                    .sort((a, b) => a.toUpperCase().localeCompare(b.toUpperCase()))
                            }
                            sx={{ width: '100%' }}
                            renderInput={(params) => <TextField {...params} label="Codice Buyers" />}
                        />
                    </Stack>}

                    {/*<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
                        <DemoContainer
                            components={['DatePicker', 'DatePicker']}
                        >
                            <Stack gap={1}>
                                <Stack>
                                    <MDTypography component='p' sx={{ fontSize: '0.79rem', fontWeight: 300,   }}>
                                        Seleziona una data per vedere i stock di quel giorno</MDTypography>
                                    <DatePicker
                                        defaultValue={new Date(format(parse(userChoose.dsd, 'dd/MM/yyyy', new Date()), 'yyyy-MM-dd'))}
                                        onChange={e => handleFilterChange('date', 'dsd', e)} />
                                </Stack>
                                <Stack>
                                    <MDTypography component='p' sx={{ fontSize: '0.79rem', fontWeight: 300,   }}>
                                        Scegli una data per selezionare i fatturati dal</MDTypography>
                                    <DatePicker //value={format(parse(userChoose.dateFatturato, 'dd/MM/yyyy', new Date()), 'yy/MM/dd') }
                                        defaultValue={new Date(format(parse(userChoose.dft, 'dd/MM/yyyy', new Date()), 'yyyy-MM-dd'))}
                                        onChange={e => handleFilterChange('date', 'dft', e)} />
                                </Stack>
                            </Stack>
                        </DemoContainer>
                    </LocalizationProvider>*/}
                    <Stack gap={1}>
                        <MDTypography component='p' sx={{ fontSize: '0.79rem', fontWeight: 300,   }}>
                            Seleziona il brand di interesse o lascia vuoto per selezionarli tutti</MDTypography>
                        <Autocomplete
                            disablePortal
                            disabled={filtersData == null ? true : false}
                            options={
                                (filtersData?.brands || []).map(elm => elm.marca)
                                    .sort((a, b) => a.toUpperCase().localeCompare(b.toUpperCase()))
                            }
                            value={(userChoose.brd || null)}
                            onChange={(_, newValue) => handleFilterChange('string', 'brd', newValue)}
                            sx={{ width: '100%' }}
                            renderInput={(params) => <TextField {...params} label="Brands" />}
                        />
                    </Stack>
                    <Stack direction='row'>
                        <MDTypography component='p' sx={{ fontSize: '0.79rem', fontWeight: 400 }}>
                            Visualizza tutti gli articoli e i dettagli annessi, che compongono i vari Stock</MDTypography>
                        <Checkbox
                            value={userChoose.detailsCheck}
                            defaultChecked
                            onChange={e => handleFilterChange('bool', 'detailsCheck', e.target.checked)}
                            {...label}
                            sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }}
                        />
                    </Stack>
                    
                    {filterRender}
                    
                    <LoadingButton variant='contained' loading={tableLoad} onClick={() => {
                        setFilterStatus(false);
                        DataRetrive(userChoose);
                    }} sx={{ marginTop: 'auto', backgroundColor: palette.primary.main, mb: 1 }}>
                        {icon_search({ color: `${darkMode ? palette.white.main : ''}`})}
                    </LoadingButton>
                </Stack>
                </Card>
            </Slide>
        </Backdrop>

    )
}