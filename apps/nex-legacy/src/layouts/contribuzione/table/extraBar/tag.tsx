import { IconButton, Stack, Typography } from '@mui/material';
import FDIconButton from '../../../../components/FDIconButton';
import { icon_edit } from '../../../../config/icons';
import React from 'react';

interface TagProps {
    ChangeStatusTagP: () => void;
    warehouses_selected: string[];
    theme: any;
};

interface TagBoxProps {
    children: React.ReactNode;
}


const TagBox: React.FC<TagBoxProps> = ({children}) => {
    return <Typography sx={{borderRadius: 4, backgroundColor: '#e9e9e9', p: '0 10px', fontSize: '0.75rem'}}>
        {children}</Typography>
}

export const TagWarehouses: React.FC<TagProps> = ({ChangeStatusTagP, warehouses_selected, theme}) => {
    const { palette } = theme;
    const { primary } = palette;

    return <Stack direction='row' alignItems='center' gap={0.5}>
        {warehouses_selected.slice(0, 3).map((name: string, index: number) => (
            <TagBox key={index}>{name}</TagBox>
        ) )}
        {warehouses_selected.length > 3 ? <Typography sx={{fontSize: '0.78rem', 
        backgroundColor: primary.main, p: 0.5, borderRadius: 3}}>
            +{warehouses_selected.length - 3}
        </Typography> : warehouses_selected.length == 0 && <TagBox>tutti i magazzini</TagBox>}
        <IconButton onClick={() => ChangeStatusTagP()}
        data-tooltip-id='general-compare-tooltip' data-tooltip-content='Filtro Magazzini'>
            {icon_edit()}
        </IconButton>
    </Stack>
}