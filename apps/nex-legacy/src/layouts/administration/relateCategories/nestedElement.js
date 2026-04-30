import React, { useState, useMemo, memo, useEffect } from "react";
import Stack from '@mui/material/Stack';
import MDTypography from "components/MDTypography";
import VirtualizedFornitoriList from "./virtualizedList";
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import MenuAddMore from "./menuAddMore";

function NestedElement(props) {
  const { data, style, registerChild, dataRow, dataFornitori, ExcludeElmFromSubCat, PassDefineElmGroup } = props;
  const [anchorEl, setAnchorEl] = useState(null);
  
  // Aggiungi la dichiarazione di `setData` e inizializzala con un array vuoto
  // in questo stateHook è presente la lista attuale dei fornitori con possibile aggiunta in maniera dinamica degli altri
  const [ElmListDist, setElmListDist] = useState(dataFornitori);

  // Usa useMemo per memorizzare i valori delle prop che non cambieranno tra le renderizzazioni
  //in memorizedData sono contenuti la lista delle sottocategorie presenti in quella categoria,
  //quindi i singoli elementi.
  const memoizedData = useMemo(() => data, [data]);
  //in memorizedDataFornitori sono presenti la lista fissa dei fornitori
  const memoizedDataFornitori = useMemo(() => dataFornitori, [dataFornitori]);

  const handleOpenMenu = (event) => setAnchorEl(event.currentTarget);

  const addMore = (name) => {
    const retriDataForAddAgain = memoizedDataFornitori.findIndex(elm => elm.nomeFornitore === name);
    setElmListDist(prev => { return [...prev, memoizedDataFornitori[retriDataForAddAgain]] });
  };

  const info = (e) => (
    <MenuAddMore anchorEl={anchorEl} setAnchorEl={setAnchorEl} addMore={addMore} permaData={memoizedDataFornitori} />
  );

  const memoizedDataFornitoriList = useMemo(() => {
    return ElmListDist.map((elm, index) => (
      <VirtualizedFornitoriList 
        key={index} 
        existValue={dataRow.Fornitori[elm.nomeFornitore]} 
        ExcludeElmFromSubCat={ExcludeElmFromSubCat} 
        data={elm} 
        dataRow={dataRow} 
        reqFrom={"subElm"} 
        PassDefineElmGroup={PassDefineElmGroup} 
      />
    ));
  }, [dataRow, ExcludeElmFromSubCat, ElmListDist]);

  return (
    <Stack direction="row" style={style} gap={5} sx={{ padding: "0 10px 0 64px", width: "100%", flexWrap: "nowrap" }} className="row" ref={registerChild}>
      <MDTypography variant="p" sx={{ fontSize: "0.7em", fontWeight: "300", maxWidth: 100, minWidth: 100, overflowWrap: "break-word" }}>{dataRow?.DescrizioneGruppo}</MDTypography>
      {memoizedDataFornitoriList}
      <Tooltip title="Aggiungi una Categoria">
        <IconButton onClick={e => handleOpenMenu(e)} color="primary" aria-label="addMoreCategory">
          <AddCircleOutlineOutlinedIcon sx={{ color: "#ae62d38c", '&:hover': { color: "#ae62d3" } }} />
        </IconButton>
      </Tooltip>
      {anchorEl !== null && info()}
    </Stack>
  );
}
export default memo(NestedElement);
