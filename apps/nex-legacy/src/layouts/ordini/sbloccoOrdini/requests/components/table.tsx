import React from 'react';

import { TableVirtualized } from 'components/Virtualized/table';
import { Fade, Stack } from '@mui/material';


interface TableProps {
    data: any;
    setData: (prev: any) => void;
}
export const Table: React.FC<TableProps> = ({ data, setData }) => {
    const [columns, setColumns] = React.useState([
        { key: 'codice', label: 'codice', sort: true, sortType:'Number', type: 'default', sx:{textAlign: 'center'}},
        { key: 'tipoOrdine', sort: true, sortType:'String', label: 'Tipo Ord', type: 'default', info: {text: "Tipo dell'ordine"}, sx: {fontWeigth: '600', textAlign: 'center'}},

        { key: 'codiceArticolo', sort: true, sortType:'String', label: 'Cod.Art', type:'default', sx:{textAlign:'center', width: '100%'}, width: 150},
		{ key: 'descrizione', sort: true, sortType:'String', label: 'Descrizione', type:'default', sx:{textAlign:'center', width: '100%'}, width: 300 },

        { key: 'dataOrdine', label: 'Data Ord', sort: true, sortType:'String', type:'default', width: 110, sx:{textAlign: 'center'}},
        { key: ['prezzo', 'quantita'], label: 'Prezzo', fieldToTake: [
            { key: 'prezzo', label: 'Prezzo', sort:true, sortType: 'Number', type: 'eur', sx:{textAlign: 'right'}},
            { key: 'quantita', label: 'Quantità', sort:true, sortType: 'Number', type: 'pz', sx:{textAlign: 'right'}},
            {key: {multiplay: [{ key: 'prezzo' }, { key: 'quantita' }]}, label: 'PrezzoTot', hideInRow:true, sort:true, sortType:'Multiplay', type: 'eur'},
        ], type: 'multiple', sort: true, sortType:'Number', multiSort: 'true'},

        { key: ['promo', 'finePromo'], sort: true, sortType:'String', label: 'Promo', fieldToTake: [
            { key: 'promo', sort: true, sortType:'String', label: 'Promo', type: 'default', info: {text: 'Promo'}, sx: {fontWeight: '600'}},
            { key: 'finePromo', label: 'Fine Promo', type: 'default', info: {text: 'Data Fine Promo'}, sx: {fontWeigth: '300'}},
        ], type: 'multiple'},
      
        { key: 'magazzino', label: 'Magazzino', sort: true, sortType:'String', type:'default', sx: {textAlign: 'center',width:'100%'}, width: 200},
    ]);

    return <Fade in={true} timeout={1000}>
        <Stack>
            <TableVirtualized
            columns={columns}
            setColumns={setColumns}
            data={data}
            setData={setData}
            results={data.length}
            />
        </Stack>
    </Fade>
}