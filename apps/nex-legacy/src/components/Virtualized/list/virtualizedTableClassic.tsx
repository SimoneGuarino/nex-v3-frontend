import React, { useState, useEffect, useMemo } from 'react';

// @React Virtualized
import {
  List,
  AutoSizer,
  CellMeasurer,
  CellMeasurerCache,
  ListRowProps,
} from 'react-virtualized';

// @MUI
import Stack from '@mui/material/Stack';

type VirtualizedProps<T = any> = {
  data: T[];
  // componente che renderizza ogni riga; riceve { data: T }
  ComposedToRender: React.ComponentType<{ data: T }>;
};

export default function Virtualized<T = any>({
  data,
  ComposedToRender,
}: VirtualizedProps<T>): JSX.Element {
  const cache = useMemo<CellMeasurerCache>(() => {
    return new CellMeasurerCache({
      fixedWidth: true,
      defaultHeight: 100,
    });
  }, []);

  // Row madre "collassabile"
  function Collapsible({
    children,
    indexRow,
    onChange,
    elm,
  }: {
    children?: React.ReactNode;
    indexRow: number;
    onChange?: () => void;
    elm?: T;
  }) {
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
      onChange && onChange();
    }, [expanded, onChange]);

    return (
      <Stack sx={{ width: '100%' }}>
        <Stack
          direction="row"
          gap={5}
          sx={{ padding: '0 20px', width: '100%' }}
          alignItems="center"
        >
          <ComposedToRender data={data[indexRow]} />
        </Stack>
        <Stack style={expanded ? { backgroundColor: '#f7f7f7' } : {}} sx={{ width: '100%' }}>
          {expanded && children}
        </Stack>
      </Stack>
    );
  }

  const renderRow = ({ index, key, style, parent }: ListRowProps) => {
    const dataRow = data[index];

    return (
      <CellMeasurer
        key={key}
        cache={cache}
        parent={parent}
        columnIndex={0}
        rowIndex={index}
      >
        {({ registerChild, measure }) => (
          <Stack
            style={style}
            sx={{ paddingTop: 2, border: 'none', margin: 0, padding: 0 }}
            className="row"
            ref={registerChild as any} // tipo compatibile con callback ref di CellMeasurer
          >
            <Collapsible indexRow={index} elm={dataRow} onChange={measure} />
          </Stack>
        )}
      </CellMeasurer>
    );
  };

  return (
    <Stack className="App" style={{ textAlign: 'center' }}>
      <Stack
        className="list"
        style={{
          height: 'calc(100vh - 280px)',
          maxHeight: 700,
          minHeight: 200,
        }}
      >
        <AutoSizer>
          {({ width, height }) => (
            <List
              width={width}
              height={height}
              deferredMeasurementCache={cache}
              rowHeight={cache.rowHeight}
              rowRenderer={renderRow}
              rowCount={data.length}
              overscanRowCount={3}
            />
          )}
        </AutoSizer>
      </Stack>
    </Stack>
  );
}
