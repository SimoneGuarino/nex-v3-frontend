import { useNexTheme } from "@nex/theme-system";

export const listOfRequestStatus = ["in attesa", "in lavorazione", "approvata", "rifiutata"];

export function GenStatusColor (type){
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";

    let style = {};

    switch (type) {
        case 'in lavorazione':
            style.color = '#b9981f';
            style.backgroundColor = darkMode ? '#fdd85140' : '#fdd851' ;
            break;
        case 'approvata':
            style.color = '#689503';
            style.backgroundColor = darkMode ? '#9eff001c' : '#8de30045' ;
            break;
        case 'rifiutata':
            style.color = '#b94d1f';
            style.backgroundColor = darkMode ? '#ff280026' : '#ffbfb3' ;
            break;
        default:
            style.color = '#9a9a9a';
            style.backgroundColor = darkMode ? '#cccccc26' : '#ccc' ;
            break;
    }
    return style;
};