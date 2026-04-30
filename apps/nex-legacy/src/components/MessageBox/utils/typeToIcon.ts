import { useNexTheme } from "@nex/theme-system";
import { MainTheme } from "assets/settingsTheme";
import { icon_allertContained, icon_infoContained, icon_sucessContained, icon_warningContained } from "config/icons";

export function TypeToIcon({ type } : {type: string}){
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    let icon;
    const style_ = {
        width: 50, height: 50, p: 1.5, borderRadius: "50%"
    }
    switch (type) {
        case 'warning':
            icon = icon_warningContained({...style_, color: '#f2a13a',
                backgroundColor: darkMode ? '#897e6336' : '#fffaef'});
        break;
        case 'success':
            icon = icon_sucessContained({...style_, color: darkMode ? '#5b76e9' : '#5cbb69',
                backgroundColor: darkMode ? '#6d896336' : '#f3ffef'});
        break;
        case 'error':
            icon = icon_allertContained({...style_, color: '#e35c55',
                backgroundColor: darkMode ? '#f8837b21' : '#fff0ef'});
        break;
        case 'info':
                icon = icon_infoContained({...style_, color: '#3455e3',
                    backgroundColor: darkMode ? '#24446557' : palette.grey[200]});
            break;
        default:
                icon = icon_infoContained({...style_, color: '#3455e3',
                    backgroundColor: darkMode ? '#24446557' : palette.grey[200]});
            break;
    }
    return icon;
} 