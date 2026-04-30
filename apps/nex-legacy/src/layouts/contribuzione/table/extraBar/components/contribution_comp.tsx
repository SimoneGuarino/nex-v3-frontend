import { IconButton, Stack, Typography } from '@mui/material';
import { icon_edit, icon_saveMoney } from 'config/icons';
import React from 'react';
import { NumberToEuro } from 'utils/numberToEuro';

interface ContributionProps {
    ChangeStatusPanel: () => void;
    contribution_company_selected: string[];
    contribution_selected: {codRaggruppamento?: string; importoBudget?: number; importoConsolidato?: number, restante?: number};
    theme: any;
};

interface TagBoxProps {
    children: React.ReactNode;
    data_tooltip_id?: String;
    data_tooltip_content?: String;
}


const TagBox: React.FC<TagBoxProps> = ({children, data_tooltip_id, data_tooltip_content}) => {
    return <Typography data-tooltip-id='general-compare-tooltip' data-tooltip-content='Modifica Contribuzione'
    sx={{borderRadius: 4, backgroundColor: '#ffedad', p: '0 10px', fontSize: '0.75rem'}}>
        {children}</Typography>
}

export const ContributionOnBar: React.FC<ContributionProps> = ({ ChangeStatusPanel, 
    contribution_company_selected, contribution_selected, theme }) => {
    const { palette } = theme;
    const { primary } = palette;


    return <Stack direction='row' alignItems='center' gap={0.5}>
        {contribution_company_selected.slice(0, 3).map((name: any, index: number) => (
            <TagBox key={index}>{name.idBudget}</TagBox>
        ) )}
        {(Object.keys(contribution_selected).length > 0 && contribution_selected?.importoBudget && contribution_selected?.importoConsolidato) ?
        <TagBox>{contribution_selected?.codRaggruppamento} | {
            contribution_selected.restante ? 
                NumberToEuro({ convert: contribution_selected.restante}) 
            :
                NumberToEuro({ convert: (contribution_selected.importoBudget - contribution_selected.importoConsolidato) })
        }
        </TagBox> : <TagBox>nessuna contribuzione</TagBox>}

        {/*TODO: Lista delle contribuzioni aziendali. */}
        {/*<React.Fragment>contribution_company_selected.length > 3 ? <Typography sx={{fontSize: '0.78rem', 
        backgroundColor: primary.main, p: 0.5, borderRadius: 3}}>
            +{contribution_company_selected.length - 3}
        </Typography> : contribution_company_selected.length == 0 && <TagBox>nessuna contribuzione</TagBox></React.Fragment>*/}

        <IconButton onClick={() => ChangeStatusPanel()}
        data-tooltip-id='general-compare-tooltip' data-tooltip-content='Modifica Contribuzione'>
            {icon_saveMoney()} {icon_edit()}
        </IconButton>
    </Stack>
}