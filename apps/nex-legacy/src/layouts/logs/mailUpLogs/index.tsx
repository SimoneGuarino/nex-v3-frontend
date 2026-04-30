import  { Dispatch, MutableRefObject, SetStateAction, useContext, useEffect, useRef, useState } from 'react';
import { UserContext } from "context/UserContext";

import { Stack } from '@mui/material';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import MDTypography from 'components/MDTypography';
import { Tooltip } from 'react-tooltip';
import { FiltersPanel } from './filters';
import { TableVirtualized } from 'components/Virtualized/table';

import getData from './fetch/getData';
import InfiniteScrollAPI from './fetch/InfiniteScroll';
import getTotals from './fetch/getTotals';

// Types and interfaces
export interface filtersInterface {
  az: string, // azione
  fm: string, // da
  by: string, // emailAzione
  tp: string, // tipo
  dt: { // il
    fm: any,
    to: any
  };
}

export interface logsDocs {
  il: Date,
  email: string,
  emailAzione?: string,
  azione: string, // "iscritto", "disiscritto", "pending"
  dettagli: string, // "'Data' | Iscrizione al gruppo 1448 con nome conferma cell (Modulo di profilazione 10)""
  tipo: string // "esistente", "nuovo"
  da: string // "m", "i", "mo"
}

export default function MailUpLogs(): JSX.Element {
  // User context and Abort controller
  const [userContext, setUserContext] = useContext<any>(UserContext);
  const abortController: MutableRefObject<any> = useRef(null);
  const cancelRequest: () => void = (): void => {
    if (abortController.current) {
      abortController.current.abort();
    }
  };
  
  // Filters states
  const emptyParams: filtersInterface = {
    az: "",
    fm: "",
    by: "",
    tp: "",
    dt: {
      fm: "",
      to: ""
    }
  };
  const [params, setParams]: [filtersInterface, Dispatch<SetStateAction<filtersInterface>>] = useState(emptyParams);

  // Table data
  const loading: MutableRefObject<boolean> = useRef(true);
  const [tableData, setTableData]: [any[], Dispatch<SetStateAction<any[]>>] = useState<any>([]);
  const [total, setTotal]: [number, Dispatch<SetStateAction<number>>] = useState(0);

  // Columns
  const [columns, setColumns]: [any[], Dispatch<SetStateAction<any[]>>] = useState([
    { key: 'il', label: 'Data azione', sort: true, sortType: 'String', width: 200, type: 'date', sx: { alignItems: 'center' }},
    { key: 'ragioneSociale', label: 'Rag. sociale', sort: true, sortType: 'String', width: 450, type: 'string', onHover: true, sxText: {
      width: "400px",
      display: "-webkit-box",
      "-webkit-box-orient": "vertical",
      overflow: "hidden",
      textOverflow: "ellipsis",
      "-webkit-line-clamp": "1"
    }},
    { key: 'email', label: 'Email', sort: true, sortType: 'String', width: 450, type: 'string', sx: { alignItems: 'center' } },
    { key: 'azione', label: 'Azione', sort: true, sortType: 'String', width: 150, type: 'default', sx: { alignItems: 'center' } },
    { key: 'dettagli', label: 'Dettagli', sort: true, sortType: 'String', width: 400, type: 'string', onHover: true, sxText: {
      width: "400px",
      display: "-webkit-box",
      "-webkit-box-orient": "vertical",
      overflow: "hidden",
      textOverflow: "ellipsis",
      "-webkit-line-clamp": "1"
    }},
    { key: 'tipo', label: 'Tipo', sort: true, sortType: 'String', width: 150, type: 'default', sx: { alignItems: 'center' } },
    { key: 'da', label: 'Da', sort: true, sortType: 'String', width: 150, type: 'default', sx: { alignItems: 'center' } }
  ]);

  useEffect(() => {
    if (userContext.details === undefined) return;
    SendRequestAPI(true);

    return () => cancelRequest();
  }, [userContext.details]);

  /** Data retreive
   * 
   * @param {boolean} firstCall First call?
   * @return {void}
   */
  const SendRequestAPI = (firstCall: boolean): void => {
    if (!loading.current || firstCall) {
      loading.current = true;

      // Abort prev request
      offset.current = 0;

      // Send API requests
      getTotals(userContext, abortController, setTotal, firstCall ? emptyParams : params);
      getData(userContext, abortController, setTableData, firstCall ? emptyParams : params, offset, loading);
    }
  };

  // Handle infinite scroll
  const offset: MutableRefObject<number> = useRef(0);
  const infiniteScroll = () => {
    return InfiniteScrollAPI(userContext, abortController, setTableData, params, offset, loading);
  };

  return (
    <DashboardLayout>
      <Stack gap={2} height='100%'>
        <MDTypography variant="h2">Lista dei logs di MailUp</MDTypography>
        <MDTypography variant="body2" sx={{ fontSize: "1rem", margin: "-1rem 0 1rem 0" }}>In questa sezione puoi trovare i logs degli stati dei clienti</MDTypography>
        <FiltersPanel params={params} setParams={setParams} SendRequestAPI={SendRequestAPI} />
        <TableVirtualized
          tableType='bottom-line'
          data={tableData}
          setData={setTableData}
          columns={columns}
          setColumns={setColumns}
          results={total}
          whereToFindData={false}
          infiniteScroll={{
            func: infiniteScroll,
            offset: offset
          }}
        />
      </Stack>
      <Tooltip id="general-confg-suppliers-tooltip" place="bottom" style={{
        maxWidth: "15vw", minWidth: 150, fontSize: '0.87rem', zIndex: 9999,
        textAlign: 'center'
      }} />
    </DashboardLayout>
  );
}