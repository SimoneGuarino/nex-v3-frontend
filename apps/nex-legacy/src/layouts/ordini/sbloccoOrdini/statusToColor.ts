import { MainTheme } from "assets/settingsTheme";

export const statusList = ['in Attesa', 'Accettata', 'Rifiutata'];

export function StatusToColor(type: string, darkMode: boolean) {
    const palette = MainTheme().palette;

    let style: any = {}
    switch (type.toLowerCase()) {
        case 'in lavorazione':
            style.color = '#b9981f';
            style.backgroundColor = '#fdd851';
            break;
        case 'accettata':
            style.color = '#689503';
            style.backgroundColor = '#72b70038';
            break;
        case 'rifiutata':
            style.color = '#b94d1f';
            style.backgroundColor = '#ff28003b';
            break;
        default:
            style.color = '#9a9a9a';
            style.backgroundColor = darkMode ? '#ffffff38' : palette.grey[400];
            break;
    }
    return style;
}