import React, { useEffect, useState, useMemo, memo, useCallback } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Grid } from 'react-virtualized';
import type { GridCellProps } from 'react-virtualized';

// #Internal Components
import { Filters, type SortType } from './filters';
import InfoMenu from '../infoPoupUpMenu';
import MDTypography from 'components/MDTypography';

// #External Components
import Stack from '@mui/material/Stack';
import HeaderFiled from './headerFIled';
import MenuItem from '@mui/material/MenuItem';
// --@Mui icons
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';

// ---- tipi minimi fedeli a come sono usati qui ----
export type StatusItem = { label: string; sortStatus: number };

export type FieldEntry = {
  // questi campi sono quelli che usi nel menu e per il sort
  key?: string | { multiplay?: string[] } | unknown;
  label?: string;
  sort?: boolean;
  sortType?: SortType;
  // il tuo schema ammette nidificazione
  fieldToTake?: FieldEntry[];
};

export type ColumnForHeader = {
  label: string;
  key: string | string[];
  width: number;
  sort?: boolean;
  sortType?: SortType;
  multiSort?: boolean;
  type?: 'supplier' | string;
  fieldToTake?: FieldEntry[];
};

type StylesBag = {
  HeaderGrid?: string;
  [k: string]: unknown;
};

type HeaderState = {
  columnCount: number;
  rowHeight: number;
  overscanColumnCount: number;
  [k: string]: unknown;
};

type HeaderVirtualizedProps = {
  setData: (updater: (prev: any) => any) => void;
  whereToFindData?: string;
  copyData: any;
  columns: ColumnForHeader[];
  visibleColumns: string[];
  styles: StylesBag;
  state: HeaderState;
  width: number;
  scrollbarSize: () => number;
  scrollLeft: number;
  lastDateDist?: { LastRetrieve?: string };
};

function HeaderVirtualized(props: HeaderVirtualizedProps) {
  const { setData, whereToFindData, copyData, columns, visibleColumns } = props;
  const { styles, state, width, scrollbarSize, scrollLeft, lastDateDist } = props;

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [sortMenuData, setSortMenuData] = useState<FieldEntry[]>([]);

  // apertura/chiusura infobox
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, data: FieldEntry[]) => {
    setAnchorEl(event.currentTarget);
    setSortMenuData(data);
  };
  const handleCloseMenu = () => setAnchorEl(null);

  const sortBy = useCallback(
    (type: SortType | undefined, field: string, status: number, multiplay?: string[]) => {
      Filters(type as SortType, field, status as 0 | 1 | 2, multiplay, setData, copyData, whereToFindData);
    },
    [visibleColumns, setData, copyData, whereToFindData]
  );

  const [test, setTest] = useState<StatusItem[]>([]);

  const changeSortStatus = (index: number, sortType?: SortType, label?: string, listofRowElements?: FieldEntry[]) => {
    const newArr = [...test];

    const statusAvaible = ['disabled', 'up', 'down'] as const;
    const sortStatus = newArr[index]?.sortStatus ?? 0;

    newArr[index].sortStatus = sortStatus >= statusAvaible.length - 1 ? 0 : sortStatus + 1;

    const multiplay = listofRowElements?.find((elm) => elm.label === label)?.key as
      | { multiplay?: string[] }
      | undefined;

    // azzera gli altri
    for (let i = 0; i < newArr.length; i++) {
      if (i !== index) newArr[i].sortStatus = 0;
    }
    setTest(() => newArr);

    // richiama il sort
    sortBy(sortType, label ?? String(columns[index]?.label ?? ''), sortStatus, multiplay?.multiplay);
  };

  const trovaOggettiConSortTrue = useCallback(
    (arr: ColumnForHeader[]): StatusItem[] => {
      const risultato: StatusItem[] = [];

      function esaminaElemento(elemento: ColumnForHeader | FieldEntry) {
        // caso "colonna" top-level
        const isTop = 'key' in elemento && ('label' in elemento || 'sort' in elemento);

        // se ha sort === true e NON ha fieldToTake, lo includi
        if ((elemento as any).sort === true && (elemento as any).fieldToTake === undefined) {
          const label = (elemento as any).label ?? (elemento as any).key;
          risultato.push({ label: String(label), sortStatus: 0 });
        }
        // se ha fieldToTake, scendi di livello
        const children = (elemento as any).fieldToTake as FieldEntry[] | undefined;
        if (children && Array.isArray(children)) children.forEach(esaminaElemento);
      }

      arr.forEach(esaminaElemento);
      return risultato;
    },
    [columns]
  );

  useEffect(() => {
    setTest(() => trovaOggettiConSortTrue(columns));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // render del pannello infoBox
  const multipleSortMenu = () => (
    <InfoMenu
      anchorEl={anchorEl}
      handleCloseMenu={handleCloseMenu}
      contain={
        Array.isArray(sortMenuData) &&
        sortMenuData?.map((data, index) => {
          const label = (data.label ?? (typeof data.key !== 'object' ? (data.key as string) : undefined)) ?? '';
          const indexSort = test.findIndex((el) => el.label === label);
          const e = test[indexSort]?.sortStatus ?? 0;

          return (
            <MenuItem
              key={index}
              onClick={() => changeSortStatus(indexSort, data.sortType, data.label ?? (data.key as string), sortMenuData)}
            >
              <Stack direction="row" gap={2} alignItems="center">
                <ArrowUpwardRoundedIcon
                  style={{ transition: 'rotate 100ms ease-in' }}
                  sx={
                    e !== 0 ? (e !== 1 ? { color: '#7f55da', rotate: '180deg' } : { color: '#7f55da' }) : { color: '#ccc' }
                  }
                />
                <MDTypography
                  style={{ color: '#344767', alignSelf: 'center' }}
                  variant="body2"
                  fontSize="0.76em"
                  textTransform="uppercase"
                  textAlign="right"
                  width="100%"
                  className="flexBasis"
                >
                  {typeof data.key !== 'object' ? (data.key as string) : data.label}
                </MDTypography>
              </Stack>
            </MenuItem>
          );
        })
      }
    />
  );

  const _renderHeaderCell = ({ columnIndex, key, rowIndex, style }: GridCellProps) => {
    return _renderLeftHeaderCell({ columnIndex, key, style });
  };

  const _renderLeftHeaderCell = ({
    columnIndex,
    key,
    style,
  }: Pick<GridCellProps, 'columnIndex' | 'key' | 'style'>) => {
    const col = columns[columnIndex];
    const label = visibleColumns.find((elm) => elm === col.label) ?? '';

    const sortStatus = test.find((el) => el.label === label)?.sortStatus ?? 0;
    const indexSort = test.findIndex((el) => el.label === label);

    const fieldsFiltersStatus = test.filter((item1) =>
      col.fieldToTake !== undefined
        ? col.fieldToTake.some(
          (item2) => (typeof item2.key !== 'object' ? (item2.key as string) : item2.label) === item1.label
        )
        : (col.label || (col.key as string)) === item1.label
    );

    const checkifInvisibleColumns = visibleColumns.includes(col.label);
    const cellWidth = checkifInvisibleColumns ? (col.width < 100 ? 100 : col.width) : 0;

    // calcola left in base alle visibili
    let left = 0;
    for (let i = 0; i < columnIndex; i++) {
      if (visibleColumns.includes(columns[i].label)) {
        left += columns[i].width < 100 ? 100 : columns[i].width;
      }
    }
    if (!checkifInvisibleColumns) left += cellWidth;

    return (
      <HeaderFiled
        style={style as CSSProperties}
        key={key}
        label={label}
        column={col}
        visibleColumns={visibleColumns}
        sortBy={sortBy}
        listOfStatus={test}
        sortStatus={sortStatus}
        indexSort={indexSort}
        setSortStatus={setTest}
        handleOpenMenu={handleOpenMenu}
        fieldsFiltersStatus={fieldsFiltersStatus}
        cellWidth={cellWidth}
        left={left}
        LastDateData={lastDateDist}
      />
    );
  };

  return (
    <>
      <Grid
        key={JSON.stringify(visibleColumns)}
        style={{ overflow: 'hidden', overflowX: 'hidden' }}
        className={styles.HeaderGrid as string}
        columnWidth={(params) => {
          const column = columns[params.index];
          return visibleColumns.includes(column.label) ? (column.width < 100 ? 100 : column.width) : 0;
        }}
        columnCount={state.columnCount}
        height={(state.rowHeight as number) - 10}
        overscanColumnCount={state.overscanColumnCount as number}
        cellRenderer={_renderHeaderCell}
        rowHeight={(state.rowHeight as number) - 20}
        rowCount={1}
        scrollLeft={scrollLeft}
        width={width - scrollbarSize()}
      />
      {multipleSortMenu()}
    </>
  );
}

export default memo(HeaderVirtualized);
