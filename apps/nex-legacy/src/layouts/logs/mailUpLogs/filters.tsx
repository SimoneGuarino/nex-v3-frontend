import { FC } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

import { Card, Divider, FormControl, IconButton, InputLabel, MenuItem, Select, Stack } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

import { icon_filter, icon_search, icon_update } from "config/icons";
import { GetDate } from "utils/index";

import { filtersInterface } from "./index";

// Types and interfaces
interface FilterPanelProps {
  params: filtersInterface;
  setParams: (prev: any) => void;
  SendRequestAPI: (firstCall: boolean) => void;
}

/** Filters panel
 * 
 * @param {filtersInterface} params.params Filters' object
 * @param {(prev: any) => void} params.setParams State object
 * @param {(firstCall: boolean) => void} params.SendRequestAPI Function to fetch data
 * @returns {JSX.Element}
 */
export const FiltersPanel: FC<FilterPanelProps> = ({ params, setParams, SendRequestAPI }: {
  params: filtersInterface;
  setParams: (prev: any) => void;
  SendRequestAPI: (firstCall: boolean) => void;
}): JSX.Element => {
  const HandleParamsData = ({ from, event }: { from: string, event: any }) => {
    const value: any = event.target.value;
    setParams((prev: any) => {
      return { ...prev, [from]: value };
    });
  };

  /** Reset function
   * 
   * @param {string} from From which param
   * @param {any} e Target value
   * @returns {void}
   */
  const handleFilterChange = (from: string, e: any): void => {
    const composeDate = format(new Date(e), 'yyyy-MM-dd');
    setParams((prev: filtersInterface) => {
      return { ...prev, dt: { ...prev.dt, [from]: composeDate } };
    });
  };

  /** Reset function
   * 
   * @returns {void}
   */
  const ResetCall = (): void => {
    setParams(() => {
      return { az: "",
        fm: "",
        by: "",
        tp: "",
        dt: {
          fm: "",
          to: ""
        }
      };
    });

    SendRequestAPI(true);
  };

  return (
    <Card>
      <Stack p={1} sx={{ borderRadius: 4 }} direction='row' alignItems="center" translate="no" height='100%'>
        {icon_filter({ mr: 1.5, })}
        <Stack direction='row' gap={2} height='100%'>
          <FormControl sx={{ minWidth: "10rem" }}>
            <InputLabel>Azione</InputLabel>
            <Select
              sx={{ "height": "100%" }}
              value={params.az}
              label="Azione"
              onChange={(e: any) => HandleParamsData({ from: "az", event: e })}
            >
              <MenuItem value="-1">Tutti</MenuItem>
              <MenuItem value="i">Iscritti</MenuItem>
              <MenuItem value="d">Disiscritti</MenuItem>
              <MenuItem value="p">In attesa</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: "10rem" }}>
            <InputLabel>Tipo</InputLabel>
            <Select
              sx={{ "height": "100%" }}
              value={params.tp}
              label="Tipo"
              onChange={(e: any) => HandleParamsData({ from: "tp", event: e })}
            >
              <MenuItem value="-1">Tutti</MenuItem>
              <MenuItem value="0">Nuovo</MenuItem>
              <MenuItem value="1">Esistente</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: "10rem" }}>
            <InputLabel>Da</InputLabel>
            <Select
              sx={{ "height": "100%" }}
              value={params.fm}
              label="Da"
              onChange={(e: any) => HandleParamsData({ from: "fm", event: e })}
            >
              <MenuItem value="-1">Tutti</MenuItem>
              <MenuItem value="f">Focelda</MenuItem>
              <MenuItem value="m">MailUp</MenuItem>
            </Select>
          </FormControl>
          <Divider orientation='vertical' sx={{ height: '100%', width: '1px', backgroundColor: '#ccc' }} />
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
            <DatePicker
              onChange={e => handleFilterChange('fm', e)}
              maxDate={new Date(GetDate().today)} />
            <span style={{ marginTop: "0.3rem" }}>-</span>
            <DatePicker
              onChange={e => handleFilterChange('to', e)}
              maxDate={new Date(GetDate().today)} />
          </LocalizationProvider>
        </Stack>
        {/* <!-- --> */}
        <Stack direction='row' ml='auto' height='100%'>
          <Divider orientation='vertical'
            sx={{ height: '100%', width: '1px', backgroundColor: '#ccc' }} />
          <IconButton data-tooltip-id="general-compare-tooltip" onClick={() => ResetCall()}
            data-tooltip-content='Reset delle proprietà'>
            {icon_update()}</IconButton>
          <IconButton data-tooltip-id="general-compare-tooltip" onClick={() => SendRequestAPI(false)}
            data-tooltip-content='Cerca i prodotti'>
            {icon_search()}</IconButton>
        </Stack>
      </Stack>
    </Card>
  );
};