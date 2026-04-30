// src/layouts/queryAS400/hooks/use-surface-tokens.ts
/** 
 * descrizione: hook condiviso che espone i “token di superficie” (colori/border/background/testo)
 *               in base al tema MUI e al dark mode del controller UI.
 * dipendenze:  useMaterialUIController (per darkMode), useTheme di MUI.
 * ritorna:     { theme, darkMode, borderColor, paperBg, mutedText, stripeBg, stickyHeaderBg, stickyHeaderText, tableBorderColor, codeBg }.
 */
import { alpha, useTheme } from "@mui/material/styles";
import { useNexTheme } from "@nex/theme-system";

export function useSurfaceTokens() {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const theme = useTheme();

    const borderColor = darkMode ? theme.palette.grey[800] : theme.palette.divider;
    const paperBg = darkMode ? theme.palette.background.default : theme.palette.background.paper;
    const mutedText = darkMode ? theme.palette.grey[400] : theme.palette.text.secondary;
    const stripeBg = darkMode ? alpha(theme.palette.common.white, 0.03) : alpha(theme.palette.common.black, 0.02);
    const stickyHeaderBg = darkMode ? theme.palette.grey[900] : theme.palette.grey[100];
    const stickyHeaderText = darkMode ? theme.palette.grey[100] : theme.palette.text.primary;
    const tableBorderColor = borderColor;
    const codeBg = darkMode ? theme.palette.grey[900] : theme.palette.grey[100];

    return {
        theme,
        darkMode: !!darkMode,
        borderColor,
        paperBg,
        mutedText,
        stripeBg,
        stickyHeaderBg,
        stickyHeaderText,
        tableBorderColor,
        codeBg,
    };
}
