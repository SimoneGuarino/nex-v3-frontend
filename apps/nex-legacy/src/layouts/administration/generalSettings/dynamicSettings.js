import React, { useState, memo, useCallback } from "react";

import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import Box from '@mui/material/Box';

//@Component
import Stack from '@mui/material/Stack';
import MDTypography from "components/MDTypography";
import { Card, Divider } from "@mui/material";

import AdactiveReturn from "./adactiveReturn";

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`vertical-tabpanel-${index}`}
            aria-labelledby={`vertical-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box component="div"  sx={{ p: 3 }}>
                    <Box component="div" >{children}</Box>
                </Box>
            )}
        </div>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
};

function a11yProps(index) {
    return {
        id: `vertical-tab-${index}`,
        'aria-controls': `vertical-tabpanel-${index}`,
    };
}


function DynamicSettings(props) {
    const { data } = props;
    const [value, setValue] = useState({ key: 'generals', value: 0 });


    //componi l'oggetto da inviare al server
    //passando setDataToSend a adactiveReturn avverrà la composizione del nuovo oggetto
    //per poi essere passato a sua volta all'index il quale inviare i dati
    const [dataToSend, setDataToSend] = useState({});

    const handleChange = useCallback((event, newValue) => {
        setValue({ key: data[0].tabs[newValue].key, value: newValue });
    }, []);

    return (
        <Card>
            <Stack direction="row" sx={{ flexGrow: 1, borderRadius: 2, height: "100%" }}>
                {data.map((tabMenu, index) => {
                    return (
                        <Stack direction="row" key={index} sx={{ width: "100%" }}>
                            <Stack sx={{ height: "100%" }}>
                                <MDTypography variant="h6" fontSize="0.9rem" textTransform="uppercase" 
                                style={{ opacity: "0.6", padding: '1em', borderRight: "1px solid rgba(0, 0, 0, 0.12)" }}>{tabMenu.generalTitle}</MDTypography>
                                <Tabs
                                    orientation="vertical"
                                    value={value.value}
                                    onChange={handleChange}
                                    aria-label="Vertical tabs example"
                                    sx={{ minWidth: "10em", flexBasis: '100%', borderRight: 1, borderColor: 'divider', borderRadius: "10px 0 0 10px" }}
                                >
                                    {tabMenu.tabs.map((tab, i) => {
                                        return (
                                            <Tab key={i} sx={{ maxHeight: "2.8em" }} icon={tab.icon} iconPosition="start" label={tab.label} {...a11yProps(i)} />
                                        )
                                    })}
                                </Tabs>
                            </Stack>
                            {tabMenu.tabPanel.map((contain, y) => (
                                <TabPanel key={y} value={tabMenu.tabPanel.findIndex(elm => elm.key == value.key)} index={y} style={{ width: "100%", padding: '0 30px', overflowX: "auto" }}>
                                    <Stack gap={5}>
                                        {contain.section.map((section, m) => {
                                            return (
                                                <Stack key={m}>
                                                    <MDTypography variant="h5" sx={{ fontWeight: 500 }} >{section.title}</MDTypography>
                                                    <Divider style={{ background: '#ccc' }} />
                                                    <Stack gap={0.7}>
                                                        {section.subElm.map((elm, j) => {
                                                            if (elm.typology === "MiniGroup") {
                                                                return (
                                                                    <AdactiveReturn type={elm.typology} refer={elm.ref} group={elm.group} list={elm.list} label={elm.label} title={elm.title} desc={elm.desc} />
                                                                )
                                                            } else {
                                                                return (
                                                                    <AdactiveReturn type={elm.typology} refer={elm.ref} label={elm.label} title={elm.title} desc={elm.desc} keys={elm.key} func={elm.func} varMother={elm.var} />
                                                                )
                                                            }
                                                        })}
                                                    </Stack>
                                                </Stack>
                                            )
                                        })}
                                    </Stack>
                                </TabPanel>
                            )
                            )}
                        </Stack>
                    )
                })}
            </Stack>
        </Card>
    )
}

export default memo(DynamicSettings)