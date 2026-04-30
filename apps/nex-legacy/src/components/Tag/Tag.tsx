import React from 'react';
import { Stack } from '@mui/material';
import { MainTheme } from 'assets/settingsTheme';
import MDTypography from 'components/MDTypography';
import { useNexTheme } from '@nex/theme-system';


interface TagProps {
    text: string | number;
    color?: string;
    textColor?: string;
    data_tooltip_id?: string;
    data_tooltip_content?: string;
    icon?: any;
    rightIcon?: any;
    fontSize?: any;
    sx?: any;
    className?: string;
}

/**
 * 
 * @param text String Or Number | Stringa di Testo.
 * @param color String | Colore del background.
 * @param textColor String | Colore del testo.
 * @param data_tooltip_id
 * @param data_tooltip_content
 * @param icon Component | Icona da far visualizzare nel tag.
 * @param fontSize String | Grandezza del font Text.
 * @param sx Object | Stile Aggiuntivo.
 * @param className String | Classe CSS Aggiuntiva.
 * @returns 
 */
export const Tag: React.FC<TagProps> = ({ text, color, textColor, data_tooltip_id, data_tooltip_content, icon, rightIcon, fontSize, sx, className }) => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const bgColor = darkMode ? palette.grey[800] : palette.grey[200];
    const color_ = darkMode ? palette.grey[500] : palette.grey[600];
    const fontSize_ = fontSize ? fontSize : 'inherit'

    return <Stack data-tooltip-id={data_tooltip_id} className={className}
        data-tooltip-content={data_tooltip_content} direction='row' alignItems='center' gap={1}
        sx={{
            borderRadius: 4, backgroundColor: `${color ? color : bgColor}`, p: '0 10px',
            fontSize: '0.7rem', width: 'fit-content', ...sx
        }}>
        {icon && icon}
        <MDTypography sx={{ fontSize: fontSize_, color: `${textColor ? textColor : color_}` }}>{text}</MDTypography>
        {rightIcon && rightIcon}
    </Stack>
}