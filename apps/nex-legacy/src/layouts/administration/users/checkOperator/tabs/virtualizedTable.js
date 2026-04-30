import React, { useState, useEffect, useMemo } from 'react';

//#Internal Components
import UserLastAction from "../userLastAction";

//#External Components
// ## @React Virtualized
import { List, AutoSizer, CellMeasurer, CellMeasurerCache } from 'react-virtualized';
// ## @MUI Components
import Stack from '@mui/material/Stack';

export default function Virtualized(props) {
  const { data } = props;  

  const cache = useMemo(() => {
    return new CellMeasurerCache({
      fixedWidth: true,
      defaultHeight: 100
    });
  }, []); // [] come dipendenza per creare la cache solo una volta


  //Callapsible => Row Madre 
  function Collapsible({ children, indexRow, onChange }) {
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
      onChange && onChange();
    }, [expanded, onChange]);

    return (
      <Stack sx={{width:"100%"}}>
        <Stack direction="row" gap={5} sx={{padding: "0 20px", width: "100%"}} alignItems="center">
          <UserLastAction data={data.elements[indexRow]} />
        </Stack>
        <Stack style={expanded ? {backgroundColor:"#f7f7f7"} : {}} sx={{width:"100%"}}>
          {expanded && children}
        </Stack>
      </Stack>
    );
  }

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
          <Stack style={style} sx={{paddingTop:2, border: 'none', margin: 0, padding: 0}} className="row" ref={registerChild}>
            <Collapsible indexRow={index} elm={dataRow} onChange={measure}/>
          </Stack>
        )}
      </CellMeasurer>
    );
  }

  return (
    <Stack className="App" style={{ textAlign: "center"}}>
      <Stack className="list" style={{
        height: "calc(100vh - 280px)",
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
              rowCount={data.elements.length}
              overscanRowCount={3} />
            )
          }
        </AutoSizer>
      </Stack>
    </Stack>
  );
}