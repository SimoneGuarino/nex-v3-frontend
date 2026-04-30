import theme from "./theme";
import themeDark from "./theme-dark";
import colors from "assets/theme/base/colors";
import colorsDark from "assets/theme-dark/base/colors";

import { useNexTheme } from "@nex/theme-system";

export const MainTheme: any = () => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";

    return darkMode ? themeDark : theme;
}

export const MainColors: any = () => {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";

    return darkMode ? colorsDark : colors;
}