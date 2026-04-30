import { Box } from '@mui/material';

/**
 * 
 * @param {*} color 
 * @param {*} type avatar | default
 * @param {*} background 
 * @param {*} sx 
 * @returns 
 */
export default function FoceldaLogo ({color, type, background, sx}){
    const tp_position = type?.toLowerCase() != 'avatar' ? 3 : 12;
    const styleBasedOnType = {before:{}, after:{}, baseLine:{}}

    switch(type){
        case 'avatar':
            styleBasedOnType.pos_left = 19;
            styleBasedOnType.baseWidth = 82;
            styleBasedOnType.baseHeigth = 58;
            styleBasedOnType.maxWidth = 60;
            styleBasedOnType.maxHeigth = 57;

            styleBasedOnType.borderRadius = '50%';
            styleBasedOnType.contentHeights = 7;

            styleBasedOnType.before.width = 21;
            styleBasedOnType.before.top = 25;

            styleBasedOnType.after.width = 27;
            styleBasedOnType.after.top = 12;

            //la linea base ha le variabili invertite 
            styleBasedOnType.baseLine.width = 18;
            styleBasedOnType.baseLine.top = 28;
            break;
        default:
            styleBasedOnType.pos_left = 3;
            styleBasedOnType.baseWidth = 45;
            styleBasedOnType.baseHeigth = 55;
            styleBasedOnType.borderRadius = 0;
            styleBasedOnType.contentHeights = 10;

            styleBasedOnType.before.width = 30;
            styleBasedOnType.before.top = 25;

            styleBasedOnType.after.width = 40;
            styleBasedOnType.after.top = 8;

            //la linea base ha le variabili invertite 
            styleBasedOnType.baseLine.width = 20;
            styleBasedOnType.baseLine.top = 30;
            break;
    }

    const style = {
        ...sx,
        width: styleBasedOnType.baseWidth,
        height: styleBasedOnType.baseHeigth,
        maxWidth: styleBasedOnType.maxWidth,
        maxHeight: styleBasedOnType.maxHeigth,
        borderRadius: styleBasedOnType.borderRadius,
        fontFamily: 'sans-serif', fontWeight: 900, fontSize: 'xxx-large',
        backgroundColor: (background || '#ccc'),
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignSelf: 'center',
        "&::before": {
            content: `""`,
            position: "absolute",
            top: styleBasedOnType.before.top,
            left: styleBasedOnType.pos_left,
            width: styleBasedOnType.before.width,
            height: styleBasedOnType.contentHeights,
            background: color,
            zIndex: 1,
            transition: `background 1s ease-in`,
        },
        "&::after": {
            content: `""`,
            position: "absolute",
            top: styleBasedOnType.after.top,
            left: styleBasedOnType.pos_left,
            width: styleBasedOnType.after.width,
            height: styleBasedOnType.contentHeights,
            background: color,
            zIndex: 1,
            transition: `background 1s ease-in`,
        },
    }

    const styleBase = {
        backgroundColor: color,
        position: 'absolute',
        width: styleBasedOnType.contentHeights,
        height: styleBasedOnType.baseLine.width,
        top: styleBasedOnType.baseLine.top,
        left: styleBasedOnType.pos_left,
    }

    return (
        <Box component="div" sx={style}>
            <Box component="div"  sx={styleBase}>
            </Box>
        </Box>
    )
}