import React, { memo, useCallback } from "react";

import { CellMeasurer } from 'react-virtualized';
import NestedElement from './nestedElement';

function RenderRow(props){
    const { 
        index,
        indexRow,
        keyAutoSizer,
        style,
        parent,
        data,
        cache,
        dataFornitori, 
        DefineElmGroup, 
        ExcludeElmFromSubCat 
    } = props;
    const dataRow = data[index];

    const PassDefineElmGroupMemoized = useCallback((value, nameFornitore) => {
        DefineElmGroup(value, nameFornitore, indexRow, index);
      }, [DefineElmGroup, index]);
      
      const excludeElmFromSubCatMemoized = useCallback((index, nomeFornitore) => {
        ExcludeElmFromSubCat(index, nomeFornitore);
      }, [ExcludeElmFromSubCat]);

    return (
      <CellMeasurer
        key={keyAutoSizer}
        cache={cache}
        parent={parent}
        columnIndex={0}
        rowIndex={index}>
        {({ registerChild }) => (
          <NestedElement 
            style={style} 
            dataFornitori={dataFornitori} 
            registerChild={registerChild} 
            PassDefineElmGroup={PassDefineElmGroupMemoized}
            ExcludeElmFromSubCat={excludeElmFromSubCatMemoized} 
            dataRow={dataRow} 
            data={data}
            />
        )}
      </CellMeasurer>
    );
}

export default memo(RenderRow);