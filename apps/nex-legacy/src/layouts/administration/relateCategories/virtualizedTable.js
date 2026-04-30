import React, { useState, useEffect, useMemo } from 'react';

//#Internal Components
import VirtualizedList from "./virtualizedList"
import VirtualizedInside from "./virtualizedInside";
import MenuAddMore from './menuAddMore';

//#External Components
// ## @React Virtualized
import { List, AutoSizer, CellMeasurer, CellMeasurerCache } from 'react-virtualized';
// ## @MUI Components
import Stack from '@mui/material/Stack';
import MDTypography from "components/MDTypography";
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

// ## @MUI Icons
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';

export default function Virtualized(props) {
  const { data, focData, distData, defineElmLine, defineElmGroup } = props;  

  //StateHook utilizzati per lo split del dato madre ricevuto dal server.
  //const [distData, setDistData] = useState(data.datiFornitori);
  //const [focData, setFocData] = useState(data.dati);

  //i dati vengono composti in base al selezionamento delle categorie
  //componendo un altro stato invece che quello principale evita il refrash del componente e la chiusura
  //del Expanded State, sendData viene composto e inviato al server.
  //const [sendData, setSendData] = useState(data.dati);

  //usato per la prova dell'esclusione degli elementi presenti nelle varie liste Fornitori.
  const [dataFornitori, setDataFornitori] = useState(distData);

  const cache = useMemo(() => {
    return new CellMeasurerCache({
      fixedWidth: true,
      defaultHeight: 100
    });
  }, []); // [] come dipendenza per creare la cache solo una volta


  //funzione dedicata all'esclusione degli elementi dalle liste.
  const ExcludeElmFromSubCat = (index, nomeFornitore) => {
    setDataFornitori(prev => {
      const copy = [...prev];
      const indexTarget = dataFornitori.findIndex(elm => elm.nomeFornitore === nomeFornitore);
      copy[indexTarget].Categorie.splice(index, 1);
      return copy;
    })
  }

  //Callapsible => Row Madre 
  function Collapsible({ children, indexRow, title, elm, onChange }) {
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
      onChange && onChange();
    }, [expanded, onChange]);

    const [anchorEl, setAnchorEl] = useState(null)
    //Array con base dati dei fornitori che può variare all'agiunta degli altri elementi da parte dell'utente
    const [dynamicDistData, setDynamicDistData] = useState(distData);
    //questo Stato è dedicato ad avere i fornitori disponibile in maniera fissa, senza calcolare gli elementi
    //aggiunti dinamicamente => successivamente bisognerà fare un dinstinct dei dati per renderli unifoci 
    const [permaData, setPermaData] = useState(distData);

    const handleOpenMenu = (event) => setAnchorEl(event.currentTarget);

    const addMore = (name) => {
        const retriDataForAddAgain = dynamicDistData.findIndex(elm => elm.nomeFornitore === name);
        const numberNameCalc =  dynamicDistData.filter(elm => elm.nomeFornitore.split(" ")[0]  === dynamicDistData[retriDataForAddAgain].nomeFornitore).length;
        
        setDynamicDistData(prev => {
          const newDist = {
            nomeFornitore: dynamicDistData[retriDataForAddAgain].nomeFornitore + " " + numberNameCalc, 
            Categorie : dynamicDistData[retriDataForAddAgain].Categorie
          }
          return [...prev, newDist] 
        });
    }

    //menu di aggiunta piu fornitori alla correlazione della categoria
    const info = (e) => (
        <MenuAddMore anchorEl={anchorEl} setAnchorEl={setAnchorEl} dynamicDistData={dynamicDistData} addMore={addMore} permaData={permaData}/>
    )

    return (
      <Stack sx={{width:"100%"}}>
        <Stack direction="row" gap={5} sx={{padding: "0 20px", width: "100%"}} alignItems="center">
          <Stack direction="row" sx={{alignItems: "center"}} gap={2}>
          <Tooltip title="Vedi le SottoCategorie di questo elemento">
            <IconButton color="primary" aria-label="expand" onClick={() => setExpanded(() => !expanded)}>
              <ExpandMoreIcon className={expanded ? "rotate-up" : "rotate-down"} />
            </IconButton>
          </Tooltip>
            <MDTypography variant="h5" sx={{ fontSize: "0.75em", fontWight: "500", maxWidth: 100, minWidth: 100, overflowWrap: "break-word" }}>{title}</MDTypography>
          </Stack>
          {dynamicDistData.map((data, index)=>{
            return <VirtualizedList 
              key={index} 
              data={data}
              index={indexRow} 
              existValue={elm.Fornitori[data.nomeFornitore]} 
              DefineElmLine={defineElmLine} 
              addMore={addMore}/>
          })}
          <Tooltip title="Aggiungi una Categoria">
            <IconButton onClick={e => handleOpenMenu(e)} color="primary" aria-label="addMoreCategory">
              <AddCircleOutlineOutlinedIcon sx={{ color: "#ae62d38c", '&:hover': { color: "#ae62d3" } }} />
            </IconButton>
          </Tooltip>
          {anchorEl !== null && info()}
        </Stack>
        <Stack style={expanded ? {backgroundColor:"#f7f7f7"} : {}} sx={{width:"100%"}}>
          {expanded && children}
        </Stack>
      </Stack>
    );
  }

  function renderRow({ index, key, style, parent }) {
    const dataFocRow = focData.Categorie[index];

    /*const dynamicDistData = [...data.datiFornitori];
    dynamicDistData.splice(foceldaIndex, 1);*/

    return (
      <CellMeasurer
        key={key}
        cache={cache}
        parent={parent}
        columnIndex={0}
        rowIndex={index}>
        {({ registerChild, measure }) => (
          <Stack style={style} sx={{paddingTop:2}} className="row" ref={registerChild}>
            <Collapsible indexRow={index} title={dataFocRow?.DescrizioneLinea} elm={dataFocRow} onChange={measure}>
              <VirtualizedInside indexRow={index} cache={cache} dataFornitori={distData} data={dataFocRow.SottoCategoria} elm={dataFocRow} ExcludeElmFromSubCat={ExcludeElmFromSubCat} DefineElmGroup={defineElmGroup}/>
            </Collapsible>
          </Stack>
        )}
      </CellMeasurer>
    );
  }

  return (
    <Stack className="App" style={{ textAlign: "center"}}>
      <Stack className="list" style={{
        height: "calc(100vh - 340px)",
      }}>
        <AutoSizer>
          {
            ({ width, height }) => (<List
              width={width}
              height={height}
              deferredMeasurementCache={cache}
              rowHeight={cache.rowHeight}
              rowRenderer={renderRow}
              rowCount={focData.Categorie.length}
              overscanRowCount={3} />
            )
          }
        </AutoSizer>
      </Stack>
    </Stack>
  );
}