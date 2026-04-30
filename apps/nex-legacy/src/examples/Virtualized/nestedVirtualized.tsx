import React from "react";
import {
  List,
  AutoSizer,
  CellMeasurer,
  CellMeasurerCache,
  type ListRowProps,
} from "react-virtualized";
import Stack from "@mui/material/Stack";

/* tipi condivisi con il padre (dedotti) */
export interface CartItem {
  Nome?: string;
  Desc?: string;
  [key: string]: unknown;
}
export interface QuoteItem {
  _id: string;
  Nome: string;
  Cart?: CartItem[];
  [key: string]: unknown;
}

interface NestedVirtualizedProps {
  data: QuoteItem;
}

const rowCount = 20; // non usato, lo lascio per fedeltà

export default function NestedVirtualized({ data }: NestedVirtualizedProps): JSX.Element {
  const cartLength = data?.Cart?.length ?? 0;

  const cache = new CellMeasurerCache({
    fixedWidth: true,
    defaultHeight: 100,
  });

  function renderRow({ index, key, style, parent }: ListRowProps & { parent: any }) {
    const dataRow = data.Cart?.[index];
    return (
      <CellMeasurer
        key={key}
        cache={cache}
        parent={parent}
        columnIndex={0}
        rowIndex={index}
      >
        {({ registerChild }: { registerChild: (el?: Element | null) => void }) => (
          <Stack
            direction="row"
            style={style as React.CSSProperties}
            className="row"
            ref={registerChild as any}
          >
            <div className="image">
              <img src="http://via.placeholder.com/40" alt={dataRow?.Nome} />
            </div>
            <Stack sx={{ containerType: "inline-size" }} className="content">
              <p>{dataRow?.Nome}</p>
              <p style={{ fontSize: "0.7em" }}>{dataRow?.Desc}</p>
            </Stack>
          </Stack>
        )}
      </CellMeasurer>
    );
  }

  return (
    <div className="App" style={{ textAlign: "center", width: "100%" }}>
      <Stack
        className="list"
        style={{
          padding: 10,
          height: "auto",
        }}
      >
        <AutoSizer>
          {({ width, height }: { width: number; height: number }) => (
            <List
              width={width}
              height={height}
              deferredMeasurementCache={cache}
              rowHeight={cache.rowHeight}
              rowRenderer={renderRow}
              rowCount={cartLength}
              overscanRowCount={3}
            />
          )}
        </AutoSizer>
      </Stack>
    </div>
  );
}
