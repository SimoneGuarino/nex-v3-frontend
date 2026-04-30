import { useMemo } from 'react';

//#External Components
// ## @React Virtualized
import { List, AutoSizer, CellMeasurer, CellMeasurerCache } from 'react-virtualized';
// ## @MUI Components
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MDTypography from "components/MDTypography";
import Divider from '@mui/material/Divider';
import QueryBuilderOutlinedIcon from '@mui/icons-material/QueryBuilderOutlined';
import { MainTheme } from 'assets/settingsTheme';
import { useNexTheme } from '@nex/theme-system';



export default function Virtualized({ data, value, setValue }) {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const cache = useMemo(() => {
        return new CellMeasurerCache({
            fixedWidth: true,
            defaultHeight: 120
        });
    }, [data]); // [] come dipendenza per creare la cache solo una volta

    const calcTimeWorked = dataObjects => {
        if (dataObjects.length === 0) {
            return '00:00';
        }

        const firstDate = new Date(dataObjects[0].date);
        const lastDate = new Date(dataObjects[dataObjects.length - 1].date);

        // Calcola la differenza tra le date in millisecondi
        const timeDiffMilliseconds = Math.abs(lastDate - firstDate);

        // Estrai ore, minuti e secondi dalla differenza
        const totalSeconds = Math.floor(timeDiffMilliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };


    function renderRow({ index, key, style, parent }) {
        const dataRow = data[index];

        return (
            <CellMeasurer
                key={key}
                cache={cache}
                parent={parent}
                columnIndex={0}
                rowIndex={index}>
                {({ registerChild, measure }) => (
                    <Stack ref={registerChild} onChange={measure} onClick={() => setValue(index)}
                    className='transition-all-css-100'
                    style={{ ...style, paddingTop: 2, border: 'none', margin: 0, padding: 0, borderBottom: `1px solid ${`${darkMode ? palette.grey[700] : palette.grey[500]}`}` }}
                    sx={value == index ? { backgroundColor: `${darkMode ? palette.grey[800] : palette.grey[300]}` }
                            : { '&:hover': { backgroundColor: `${darkMode ? palette.grey[800] : palette.grey[300]}` } }}>
                        <Button direction='row' gap={1} pl={5} pr={5} sx={{ width: '100%' }}>
                            <Stack sx={{ width: 45 }}>
                                <MDTypography component="h4" style={{ fontWeight: "400", textAlign: "center", color: "#ccc" }}>{dataRow.dayOfWeek.slice(0, 3)}</MDTypography>
                                <MDTypography component="h4" style={{ fontWeight: "600", textAlign: "center", textTransform: 'uppercase' }}>{dataRow.monthOfYear?.slice(0, 3)}</MDTypography>
                                <MDTypography component="h2" style={{ fontWeight: "800", textAlign: "center", fontSize: "3em", fontFamily: 'system-ui, sans-serif' }}>{dataRow.numberDay}</MDTypography>
                            </Stack>
                            <Divider orientation="vertical" variant="middle" flexItem style={{ background: '#ccc', height: 80, alignSelf: 'center' }} />
                            <Stack sx={{ alignItems: 'center', justifyContent: 'center' }}>
                                <MDTypography component="h4" style={{ fontWeight: "400", textAlign: "center" }}>{dataRow.elements.length} Azioni</MDTypography>
                                <Stack >
                                    <MDTypography component="h4" style={{ fontWeight: "300", textAlign: "center", fontSize: '0.8em' }}>
                                        Tempo trascorso sull'applicativo
                                    </MDTypography>
                                    <MDTypography component="h4" style={{ fontWeight: "400", alignSelf: 'center', fontSize: '0.8em' }}>
                                        <QueryBuilderOutlinedIcon sx={{ marginRight: 1 }} />
                                        {calcTimeWorked(dataRow.elements) + ' min'}
                                    </MDTypography>
                                </Stack>
                            </Stack>
                        </Button>
                    </Stack>
                )}
            </CellMeasurer>
        );
    }

    return (
        <Stack className="App" style={{ textAlign: "center" }}>
            <Stack className="list" style={{
                height: "calc(100vh - 250px)",
                maxHeight: 700,
                minHeight: 200,
            }}>
                <AutoSizer>
                    {
                        ({ width, height }) => (<List
                            width={width}
                            height={height}
                            deferredMeasurementCache={cache}
                            rowHeight={cache.rowHeight}
                            rowRenderer={renderRow}
                            rowCount={data.length}
                            overscanRowCount={5} />
                        )
                    }
                </AutoSizer>
            </Stack>
        </Stack>
    );
}