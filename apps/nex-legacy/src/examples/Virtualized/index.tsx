import React, { useState, useEffect } from "react";
import {
  List,
  AutoSizer,
  CellMeasurer,
  CellMeasurerCache,
  type ListRowProps,
} from "react-virtualized";
import Stack from "@mui/material/Stack";
import VirtualizedinsideCart from "./nestedVirtualized";
import MDTypography from "components/MDTypography";
import InputBase from "@mui/material/InputBase";
import IconButton from "@mui/material/IconButton";

import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ReadMoreIcon from "@mui/icons-material/ReadMore";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DoneOutlinedIcon from "@mui/icons-material/DoneOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";

/* =========================
 * tipi dedotti dal codice
 * =========================
 * - QuoteItem: contiene almeno `_id`, `Nome` e (opz.) `Cart` con elementi che hanno `Nome` e `Desc`
 * - Le callback sono quelle che già usi nel componente padre
 */
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
interface VirtualizedProps {
  data: QuoteItem[];
  sendTitleChange: (quote_id: string, title: string) => void | (() => void);
  deleteQuoteCart: (quote_id: string) => void | (() => void);
}

const rowCount = 5; // non usato, lo lascio per fedeltà al sorgente

export default function Virtualized(props: VirtualizedProps): JSX.Element {
  const { data, sendTitleChange, deleteQuoteCart } = props;

  // NB: nel JS originale il cache viene ricreato ad ogni render.
  // Mantengo questo comportamento per fedeltà.
  const cache = new CellMeasurerCache({
    fixedWidth: true,
    defaultHeight: 100,
  });

  function send(quote_id?: string, title?: string) {
    if (quote_id && typeof title === "string") {
      sendTitleChange(quote_id, title);
    }
  }
  function del(quote_id?: string) {
    if (quote_id) deleteQuoteCart(quote_id);
    // altrimenti no-op, fedele all'uso originale con optional chaining
  }

  // componente interno come nell’originale
  function Collapsible({
    children,
    title,
    onChange,
  }: {
    // children è il VirtualizedinsideCart con prop { data: QuoteItem }
    children: React.ReactElement<{ data: QuoteItem }>;
    title: string;
    onChange?: () => void;
  }) {
    const [expanded, setExpanded] = useState(false);

    const [editMode, setEditMode] = useState(false);
    const [titleState, setTitle] = useState<string>(title);
    const [titlePreSave, setTitlePreSave] = useState<string>("");

    useEffect(() => {
      onChange && onChange();
    }, [expanded, onChange]);

    useEffect(() => {
      // fedele al codice: se cambia il titolo locale, invia
      if (titleState === title) return;
      send(children?.props?.data._id, titleState);
      // eslint-disable-next-line no-param-reassign
      (title as unknown as { value: string }) = titleState as unknown as any; // mantiene l'assegnazione sul parametro come nel JS (no-op tipico)
    }, [titleState]); // eslint-disable-line react-hooks/exhaustive-deps

    const Save = () => {
      setTitle(() => titlePreSave);
      setTitlePreSave(() => "");
      setEditMode(() => false);
    };

    const Cancell = () => {
      del(children?.props?.data._id);
    };

    return (
      <>
        <Stack
          direction="row"
          sx={{ userSelect: "none", height: 50 }}
          alignItems="center"
          className="accordHeader"
        >
          <Stack
            direction="row"
            gap={3}
            sx={{ height: "100%", alignItems: "center", width: "100%", paddingLeft: 2 }}
            className="css-selectQuotationCart-elm"
            onClick={() => (!editMode ? setExpanded(!expanded) : null)}
          >
            <ShoppingCartOutlinedIcon />

            {!editMode ? (
              <>
                <MDTypography
                  sx={{
                    textTransform: "uppercase",
                    fontSize: "0.7em",
                    fontWeight: "500",
                    color: "#3d3c5d",
                  }}
                >
                  {titleState}
                </MDTypography>
                <MDTypography
                  sx={{
                    textTransform: "uppercase",
                    fontSize: "0.45em",
                    fontWeight: "500",
                    color: "#3d3c5d",
                    marginRight: "30px",
                    alignSelf: "center",
                  }}
                >
                  Prodotti: {children?.props?.data?.Cart?.length}
                </MDTypography>
              </>
            ) : (
              <Stack direction="row">
                <InputBase
                  sx={{ ml: 0.5, flex: 1, fontSize: "0.7em" }}
                  placeholder={titleState}
                  inputProps={{ "aria-label": "search google maps" }}
                  value={titlePreSave}
                  onChange={(e) => setTitlePreSave(() => e.target.value)}
                />
                <IconButton
                  type="button"
                  sx={{ p: "10px" }}
                  aria-label="accept change name"
                  onClick={() => Save()}
                >
                  <DoneOutlinedIcon />
                </IconButton>
                <IconButton
                  type="button"
                  sx={{ p: "10px" }}
                  aria-label="close edit mode"
                  onClick={() => setEditMode(() => false)}
                >
                  <CloseOutlinedIcon />
                </IconButton>
              </Stack>
            )}
          </Stack>

          <Stack direction="row" sx={{ marginLeft: "auto", marginRight: 2 }}>
            <EditOutlinedIcon
              className="css-editElmQuoteCart-btn"
              sx={{ color: "#7239c9b5" }}
              onClick={() => setEditMode(() => !editMode)}
            />
            <ReadMoreIcon className="css-editElmQuoteCart-btn" />
            <DeleteOutlineOutlinedIcon
              className="css-editElmQuoteCart-btn"
              sx={{ color: "#cd5757" }}
              onClick={() => Cancell()}
            />
          </Stack>
        </Stack>
        {expanded && children}
      </>
    );
  }

  function renderRow({ index, key, style, parent }: ListRowProps & { parent: any }) {
    const dataRow = data[index];
    return (
      <CellMeasurer
        key={key}
        cache={cache}
        parent={parent}
        columnIndex={0}
        rowIndex={index}
      >
        {({ registerChild, measure }: { registerChild: (el?: Element | null) => void; measure: () => void }) => (
          <div style={style as React.CSSProperties} className="row" ref={registerChild as any}>
            <Collapsible title={dataRow?.Nome} onChange={measure}>
              <VirtualizedinsideCart data={dataRow} />
            </Collapsible>
          </div>
        )}
      </CellMeasurer>
    );
  }

  return (
    <div className="App" style={{ textAlign: "center" }}>
      <div
        className="list"
        style={{
          // padding: 10,
          height: "calc(100vh - 65px)",
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
              rowCount={data.length}
              overscanRowCount={3}
            />
          )}
        </AutoSizer>
      </div>
    </div>
  );
}
