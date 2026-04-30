import { useState } from 'react';
import PropTypes from 'prop-types';

//import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import Tabs from '@mui/material/Tabs';
import TabPanel from './tabPanel';
//import UserLastAction from '../userLastAction';

import VirtualizedTable from './virtualizedTable';
import TabVI from './TabVI';



TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
};


export default function MainTab(props) {
    const { data } = props;
    const [value, setValue] = useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    // Funzione di confronto per ordinare in base al campo "date"
    const confrontaPerDataDecrescente = (a, b) => new Date(b.date) - new Date(a.date);

    // Ordina l'array utilizzando la funzione di confronto
    const arrayOrdinato = data.sort(confrontaPerDataDecrescente);

    return (
        <Stack direction='row' sx={{ flexGrow: 1, height: '100%', width: '100%' }}>
            <Tabs
                orientation="vertical"
                id='vertcals-logs-tabs'
                variant="scrollable"
                value={value}
                onChange={handleChange}
                aria-label="Vertical tabs"
                sx={{ borderRight: 1, borderColor: 'divider', width: '40%'}}
            >
                <TabVI data={arrayOrdinato} setValue={setValue} value={value} />
            </Tabs>

            {data.map((elm, index) => {
                return <TabPanel value={value} index={index} style={{ width: '100%' }}>
                    <VirtualizedTable data={elm} />
                </TabPanel>
            })}
        </Stack>
    );
}
