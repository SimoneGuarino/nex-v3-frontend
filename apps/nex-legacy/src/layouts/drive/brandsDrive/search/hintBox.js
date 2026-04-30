import { memo } from "react";

import { Stack } from "@mui/material";
import MDTypography from "components/MDTypography";
import theme from "assets/theme";
import { icon_file } from "config/icons";
import { useNexTheme } from "@nex/theme-system";

function HintBox(props) {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const { data, SendDataAPI, setInfiniteScrollAnim, setHandleSearchText } = props;

    const dataToDisplay = [
        { key: 'cartella', value: data.nomeCartella },
        { key: 'estensione file', value: data.tipo },
        { key: 'data creazione file', value: new Date(data.creato).toLocaleDateString('it') },
    ]

    const callRequestData = () => {
        setInfiniteScrollAnim(true);
        SendDataAPI(data);
    };


    return (
        <div onClick={callRequestData} className="itemHintBox">
            <Stack direction='row' gap={2} alignItems='center' width='100%'>
                {icon_file({ color: '#9f9f9f', width: 30, height: 30 })}
                <Stack gap={1} width='100%'>
                    <Stack direction='row' width='100%' alignItems='center' gap={1}>
                        <MDTypography component="h5" style={{
                            fontSize: '1rem',
                            color: `${darkMode ? theme.palette.grey[300] : '#333e4b'}`, fontWeight: 400
                        }}>
                            {data.nome}
                        </MDTypography>
                        <MDTypography variant="body2" sx={{ml: 'auto', fontSize: '0.7rem'}}>
                            {data.dimensione} MB
                        </MDTypography>
                    </Stack>
                    <Stack direction='row' gap={3}>
                        {dataToDisplay.map((item, y) => (
                            <Stack key={y}>
                                <MDTypography component="h5" style={{ color: "#838383", fontSize: '0.67rem', textAlign: "center" }}>
                                    {item.key}
                                </MDTypography>
                                <MDTypography component="h5" style={{
                                    color: `${darkMode ? theme.palette.grey[500] : '#333e4b'}`,
                                    fontSize: '0.82rem', fontWeight: 100, textAlign: "center"
                                }}>
                                    {item.value}
                                </MDTypography>
                            </Stack>
                        ))}
                    </Stack>
                </Stack>
            </Stack>
        </div>
    )
}
export default memo(HintBox);