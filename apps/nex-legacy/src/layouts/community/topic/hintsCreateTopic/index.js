import { useMaterialUIController } from "context";

import MDTypography from "components/MDTypography";
import Stack from '@mui/material/Stack';

import CreateOutlinedIcon from '@mui/icons-material/CreateOutlined';
import { MainTheme } from "assets/settingsTheme";
import { icon_edit } from "config/icons";
import { useNexTheme } from "@nex/theme-system";

export default function HintsBox(props) {
    const [controller, dispatch] = useMaterialUIController();
    const {
        transparentSidenav,
    } = controller;
    const palette = MainTheme().palette;

    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";

    return (
        <Stack spacing={2} className={!transparentSidenav ? "css-color-bgwhite" : null} sx={{
            border: `1px solid ${darkMode ? palette.grey[800] : palette.grey[400]}`,
            borderRadius: "10px", padding: "20px", maxWidth: "16.9em"
        }} alignItems="center">
            <MDTypography component="h6" style={{ fontSize: "1rem", fontWeight: "500" }}>
                {props.title}
            </MDTypography>
            <Stack direction="row" spacing={3}>
                {icon_edit({ fontSize: "2em !important" })}
                <MDTypography component="p" style={{ fontSize: "1rem", fontWeight: "300" }}>
                    {props.body}
                </MDTypography>
            </Stack>
        </Stack>
    )
}