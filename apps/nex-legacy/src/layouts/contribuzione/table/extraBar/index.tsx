import { Card, Divider, Fade, FormControlLabel, FormGroup, 
    IconButton, Stack, Switch, Typography } from '@mui/material';
import { icon_Shuffle, icon_TrendingDown, icon_TrendingUp, icon_megaphone, 
    icon_quantity, icon_reportProblem } from '../../../../config/icons';
import React from 'react';
// themes
import theme from "../../../../assets/theme";
import { TagWarehouses } from './tag';
import { ContributionOnBar } from './components/contribution_comp';
import { MainTheme } from 'assets/settingsTheme';
import { Tag } from 'components/Tag/Tag';
import { useMaterialUIController } from 'context/index';
import { useNexTheme } from '@nex/theme-system';




interface ExtraBarProps {
    totalOfData: number;
    ChangeAllCheckedState: (e: Boolean) => void;
    selecteAllFilter: boolean;
    ChangeStatusTagP: () => void;
    warehouses_selected: string[];
    sortFiltersIndex: number;
    sortFilterList: Array<string>;
    SwapSortData: () => void;
    promoIndexToText: Array<string>;
    promoFilterIndex: number;
    PromoFilter: () => void;

    contribution_selected: object;
    ChangeStatusContributionP: () => void;
    contribution_company_selected: string[];
    contributionsList: any;
}


function ChooseSortIcon(index: number) {
    let ret;
    switch (index) {
        case 1:
            ret = icon_TrendingUp();
            break;
        case 2:
            ret = icon_TrendingDown();
            break;
        case 0:
            ret = icon_Shuffle();
            break;
    };
    return ret;
}

const promoIndexToText = ['Misti (in Promo e Non)', 'in Promo', 'non in Promo']

export const ExtraBar: React.FC<ExtraBarProps> = ({ totalOfData, ChangeAllCheckedState, selecteAllFilter,
ChangeStatusTagP, warehouses_selected, sortFiltersIndex, sortFilterList, SwapSortData, promoFilterIndex, 
PromoFilter, ChangeStatusContributionP, contribution_selected, contribution_company_selected, contributionsList}) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";

    const palette = MainTheme().palette;
    const { info } = palette;



    return <Fade in={true}><Card>
        <Stack direction='row'
            style={{ padding: '2px 15px', borderRadius: 15 }}
            justifyContent='flex-start' alignItems='center'>
            <FormGroup>
                <FormControlLabel control={<Switch checked={selecteAllFilter} onChange={(e) => ChangeAllCheckedState(e.target.checked)}/>} label="Seleziona Tutti" />
            </FormGroup>
            <Divider orientation='vertical' sx={{ backgroundColor: '#ccc', height: 25 }} />

            <Stack direction='row' gap={0.5}>
                    <IconButton sx={{ backgroundColor: `${sortFiltersIndex == 1 ? "#0080001c"
                        : sortFiltersIndex == 2 && "#ff00001c"
                    }`, width: 43}} onClick={() => SwapSortData()}
                        data-tooltip-id="general-compare-tooltip"
                        data-tooltip-content={`Solo elementi Margine ${sortFilterList[sortFiltersIndex]}`}>
                        {ChooseSortIcon(sortFiltersIndex)}
                    </IconButton>

                    <IconButton sx={{ backgroundColor: `${promoFilterIndex == 1 ? "#0080001c"
                        : promoFilterIndex == 2 && "#ff00001c"
                    }`, borderRadius: 4}} onClick={() => PromoFilter()}
                        data-tooltip-id="general-compare-tooltip"
                        data-tooltip-content={`Solo prodotti ${promoIndexToText[promoFilterIndex]}`}>
                        {icon_megaphone()} <span style={{fontSize: '1rem', fontWeight: 'bold',
                        height: '100%', alignContent: 'center'}}>{promoFilterIndex == 1 ? "+" : promoFilterIndex == 2 && "-"}</span>
                    </IconButton>
            </Stack>

            <Divider orientation='vertical' sx={{ backgroundColor: '#ccc', height: 25 }} />
            <TagWarehouses ChangeStatusTagP={ChangeStatusTagP} warehouses_selected={warehouses_selected} theme={theme}/>

            <Divider orientation='vertical' sx={{ backgroundColor: '#ccc', height: 25 }} />
            {(contributionsList && contributionsList.length > 0) ? <ContributionOnBar ChangeStatusPanel={ChangeStatusContributionP} contribution_selected={contribution_selected} 
            contribution_company_selected={contribution_company_selected} theme={theme} /> : 
            <Tag text="L'utente non ha contribuzioni"
            icon={icon_reportProblem({ width: 20, height: 20, color:`${darkMode ? palette.info.main : 'black'}`})}/>}

            <Stack direction='row' sx={{ backgroundColor: info.main, p: 1, borderRadius: 2 }} alignItems='center' gap={0.5} ml='auto'>
                {icon_quantity()}
                <Typography sx={{ fontSize: '0.76rem', fontWeight: 'bold'}}
                    data-tooltip-id='general-compare-tooltip' data-tooltip-content='Totale degli elementi'>
                    {totalOfData}</Typography>
            </Stack>
        </Stack></Card>
    </Fade>
}