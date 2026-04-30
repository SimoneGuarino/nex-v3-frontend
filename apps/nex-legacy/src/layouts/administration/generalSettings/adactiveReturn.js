import React, { memo, useCallback, useState } from 'react';

// @MUI components
import MDTypography from "components/MDTypography";
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import Switch from '@mui/material/Switch';


import ExpandMore from '@mui/icons-material/ExpandMore';
import ChipVirtualized from "./chipVirtualized";

function AdactiveReturn(props) {
    const { type, refer, group, label, title, desc, keys, func, varMother } = props;

    const Adactive = (type, label, list, index) => {
        return (
            type === "TextField" ?
                <TextField key={index} 
                    id="outlined-required"
                    label={label}
                />
                : type === "NumberField" ? 
                    <TextField key={index}
                        id="outlined-required"
                        label={label}
                        type="number"
                    />
                    : type === "Info" ? <Stack key={index} sx={{ paddingBottom: 2 }}>
                        <MDTypography variant="h6" sx={{ fontWeight: 500 }} >{title}</MDTypography>
                        <MDTypography variant="h6" sx={{ fontWeight: 300 }} >{desc}</MDTypography></Stack>
                        : type === "MiniGroup" ?
                            MiniGroup()
                            : type === "List" ?
                                List(label, list)
                                : type === "Chip" ?
                                    <ChipVirtualized key={index} label={label}/>
                                : type.toLowerCase() === 'switch' ?
                                    <Stack key={index} direction='row' gap={2} alignItems='center'>
                                        <MDTypography variant="span" sx={{ fontWeight: 300, fontSize: '0.7em' }} >{title}</MDTypography>
                                        <Switch checked={varMother[keys]} onChange={e => func(keys, e.target.checked)}/>
                                    </Stack>
                                : null
        )
    }

    const List = (label, list) => {
        const [expanded, setExpanded] = useState(false);
        return (
            <Stack sx={{marginTop: 2, marginBottom: 2}} >
                <Stack direction="row" gap={2} onClick={() => setExpanded(() => !expanded)} sx={{userSelect: "none", cursor: "pointer"}}>
                    <ExpandMore className={expanded ? "rotate-up" : "rotate-down"} />
                    <MDTypography variant="h6" sx={{ fontWeight: 500 }} >{label}</MDTypography>
                </Stack>
                {expanded ? <Stack direction="row" sx={{paddingLeft: 5}} gap={0.7}>
                    {list.map((elm, index) => {
                        return (
                            Adactive(elm.typology, elm.label, index)
                        )
                    })}
                </Stack> : null}
            </Stack>
        )
    }

    const MiniGroup = () => {
        const [value, setValue] = React.useState(0);

        const handleChange = (event, newValue) => {
            setValue(newValue);
        };

        return (
            <Stack sx={{ paddingBottom: 2 }} gap={2}>
                <Stack>
                    <MDTypography variant="h6" sx={{ fontWeight: 500 }} >{title}</MDTypography>
                    <MDTypography variant="h6" sx={{ fontWeight: 300 }} >{desc}</MDTypography>
                </Stack>
                <Stack gap={0.7} sx={{padding: "0 30% 0 0"}}>
                    <TabContext value={value}>
                        <Box component="div"  sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <TabList onChange={handleChange} aria-label="lab API tabs example">
                                {
                                    group.map((elm, index) => {
                                        return (
                                            <Tab label={elm.ref} value={index} />
                                        )
                                    })
                                }
                            </TabList>
                        </Box>
                        <Stack>
                            {
                                group.map((elm, index) => {
                                    return (
                                        <TabPanel key={index} value={index} sx={{ display: "flex", flexDirection: "column", padding: 0}}>
                                            <Stack gap={0.7}>
                                                {elm.list.map((elm, i) => {
                                                    return (
                                                        Adactive(elm.typology, elm.label, elm.list)
                                                    )
                                                })}
                                            </Stack>
                                        </TabPanel>
                                    )
                                })
                            }
                        </Stack>
                    </TabContext>
                </Stack>
            </Stack>
        )
    }

    return (
        Adactive(type, label)
    )
}

export default memo(AdactiveReturn);