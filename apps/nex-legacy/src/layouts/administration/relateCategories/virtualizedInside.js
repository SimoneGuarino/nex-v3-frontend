import React, { memo, useCallback } from 'react';
//#Internal Components
import NestedElement from './nestedElement';
import RenderRowVirtInside from './renderRowVirtInside';

//#External Components
// ## @React Virtualized
import { List, AutoSizer, CellMeasurer } from 'react-virtualized';
// ## @MUI Components
import Stack from '@mui/material/Stack';


function VirtualizedInside(props) {
  const { data, indexRow, cache, dataFornitori, DefineElmGroup, ExcludeElmFromSubCat } = props;
  const dataLenght = data?.length;

  return (
    <div className="App" style={{ textAlign: "center", width: "100%" }}>
      <Stack className="list" style={{
        padding: 10,
        height: 230
      }}>
        <AutoSizer>
          {
            ({ width, height }) => (<List
              width={width}
              height={height}
              deferredMeasurementCache={cache}
              rowHeight={82}
              rowRenderer={({ index, key, style, parent }) => <RenderRowVirtInside
                key={key}
                indexRow={indexRow} 
                index={index}
                keyAutoSizer={key}
                style={style}
                parent={parent}
                data={data}
                cache={cache}
                dataFornitori={dataFornitori}
                DefineElmGroup={DefineElmGroup}
                ExcludeElmFromSubCat={ExcludeElmFromSubCat}
              />}
              rowCount={dataLenght}
              overscanRowCount={3} />
            )
          }
        </AutoSizer>
      </Stack>
    </div>
  )
}

export default memo(VirtualizedInside);