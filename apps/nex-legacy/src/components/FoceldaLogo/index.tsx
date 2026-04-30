import { Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import type { CSSProperties, ReactElement } from 'react';

type LogoType = 'avatar' | 'default';

interface FoceldaLogoProps {
    color: string;
    type?: LogoType;
    background?: string;
    sx?: SxProps<Theme>;
}

type StyleConfig = {
    pos_left: number;
    baseWidth: number;
    baseHeigth: number;     // mantenuto come nell’originale
    maxWidth?: number;
    maxHeigth?: number;     // mantenuto come nell’originale
    borderRadius: CSSProperties['borderRadius'];
    contentHeights: number;
    before: { width: number; top: number };
    after: { width: number; top: number };
    baseLine: { width: number; top: number };
};

export default function FoceldaLogo({
    color,
    type = 'default',
    background,
    sx,
}: FoceldaLogoProps): ReactElement {
    const styleBasedOnType: StyleConfig =
        type === 'avatar'
            ? {
                pos_left: 19,
                baseWidth: 82,
                baseHeigth: 58,
                maxWidth: 60,
                maxHeigth: 57,
                borderRadius: '50%',
                contentHeights: 7,
                before: { width: 21, top: 25 },
                after: { width: 27, top: 12 },
                // la linea base ha le variabili invertite
                baseLine: { width: 18, top: 28 },
            }
            : {
                pos_left: 3,
                baseWidth: 45,
                baseHeigth: 55,
                borderRadius: 0,
                contentHeights: 10,
                before: { width: 30, top: 25 },
                after: { width: 40, top: 8 },
                // la linea base ha le variabili invertite
                baseLine: { width: 20, top: 30 },
            };

    const style: SxProps<Theme> = {
        ...sx,
        width: styleBasedOnType.baseWidth,
        height: styleBasedOnType.baseHeigth,
        maxWidth: styleBasedOnType.maxWidth,
        maxHeight: styleBasedOnType.maxHeigth,
        borderRadius: styleBasedOnType.borderRadius,
        fontFamily: 'sans-serif',
        fontWeight: 900,
        fontSize: 'xxx-large',
        backgroundColor: background || '#ccc',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignSelf: 'center',
        '&::before': {
            content: '""',
            position: 'absolute',
            top: styleBasedOnType.before.top,
            left: styleBasedOnType.pos_left,
            width: styleBasedOnType.before.width,
            height: styleBasedOnType.contentHeights,
            background: color,
            zIndex: 1,
            transition: 'background 1s ease-in',
        },
        '&::after': {
            content: '""',
            position: 'absolute',
            top: styleBasedOnType.after.top,
            left: styleBasedOnType.pos_left,
            width: styleBasedOnType.after.width,
            height: styleBasedOnType.contentHeights,
            background: color,
            zIndex: 1,
            transition: 'background 1s ease-in',
        },
    };

    const styleBase: SxProps<Theme> = {
        backgroundColor: color,
        position: 'absolute',
        width: styleBasedOnType.contentHeights,
        height: styleBasedOnType.baseLine.width,
        top: styleBasedOnType.baseLine.top,
        left: styleBasedOnType.pos_left,
    };

    return (
        <Box component="div" sx={style}>
            <Box component="div" sx={styleBase} />
        </Box>
    );
}
