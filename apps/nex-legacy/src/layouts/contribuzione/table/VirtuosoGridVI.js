import React, { Fragment } from 'react';
//@Internal Packages
import styled from '@emotion/styled'

//@External Packages
import { Virtuoso, VirtuosoGrid } from 'react-virtuoso';
import { Stack } from '@mui/material';
import BlockViewCard from './BlockView_Card';
import { TableViewCard } from './TableView_Card';

import './main.css';


const gridComponents = {
    List: React.forwardRef(({ style, children, ...props }, ref) => (
      <div
        ref={ref}
        {...props}
        style={{
          display: "flex",
          flexWrap: "wrap",
          ...style,
        }}
      >
        {children}
      </div>
    )),
    Item: ({ children, ...props }) => (
      <div
        {...props}
        style={{
          padding: "0.5rem",
          width: "33%",
          height: '440px',
          display: "flex",
          flex: "none",
          alignContent: "stretch",
          boxSizing: "border-box",
        }}
      >
        {children}
      </div>
    )
}


const ItemContainerTable = styled.div`
    width: 100%;
    flex: 100%;
    height: 260px;

    padding: 0.5rem 0.5rem 0.5rem 0;
    display: flex;
    align-content: stretch;
    box-sizing: border-box;
    transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms !important;
`
const ListContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    width: 100%;
`

const RenderRow = ({ index, elm, setData, AdvisedPrice, param,
    handleClick, PickLowest, selectedFile, grindView, SaveCheckedBlockonElement,
    HandleProductExpandedDist, ChangeDetailsDistPanelVisibility, Contribuzione, 
    ReduceEuroContributions, setContribution_selected}) => {

    const advicedObject = AdvisedPrice(elm, (elm.margin || param.margin), (elm.ribasso || param.ribasso), 
    elm.Fornitori, elm.CostoMedioGestionale);
    
    const chooseChecked = elm.checked == undefined ? advicedObject.checked 
    : elm.checked;
    const [checked, setChecked] = React.useState(elm.checked || advicedObject.checked);

    
    React.useEffect(() => {
        setChecked(chooseChecked);
    }, [advicedObject.checked, elm])

    const ChangeCheckedBlock = () => {
        if (advicedObject.checked) {
            setChecked(!checked);
            SaveCheckedBlockonElement(elm.CodiceProduttore, !checked);
            if(elm.contributed){
                setContribution_selected((prev) => {
                    if(prev.restante){
                        const rest_ = prev.restante;
                        const euro = (elm.contributed.euro * elm.Disponibilita.Totali);
                        const sum = (rest_ + euro);
                        const minus = (rest_ - euro);
                        console.log("RES", checked, (!checked ? minus : sum));
                        return {...prev, restante: (!checked ? minus : sum) };
                    }
                    return {...prev, restante: prev.restante}
                });
            };
        };
    };


    return grindView ? <BlockViewCard key_prop={index} index={index} elm={elm} 
        handleClick={handleClick} setData={setData}
        selectedFile={selectedFile} PickLowest={PickLowest}
        checked={checked} ChangeCheckedBlock={ChangeCheckedBlock}
        advicedPrice={advicedObject} HandleProductExpandedDist={HandleProductExpandedDist}
        ChangeDetailsDistPanelVisibility={ChangeDetailsDistPanelVisibility}
        Contribuzione={Contribuzione} ReduceEuroContributions={ReduceEuroContributions} 
        setContribution_selected={setContribution_selected}/>
    :   
        <TableViewCard key_prop={index} index={index} elm={elm} 
        handleClick={handleClick} setData={setData}
        selectedFile={selectedFile} PickLowest={PickLowest}
        checked={checked} ChangeCheckedBlock={ChangeCheckedBlock}
        advicedPrice={advicedObject} Contribuzione={Contribuzione} 
        ReduceEuroContributions={ReduceEuroContributions} setContribution_selected={setContribution_selected}
        HandleProductExpandedDist={HandleProductExpandedDist}
        ChangeDetailsDistPanelVisibility={ChangeDetailsDistPanelVisibility}/>
};


const VirtuosoGridVI = ({ data, setData, handleClick, selectedFile, setSelectedFile,
    param, AdvisedPrice, PickLowest, grindView, SaveCheckedBlockonElement, HandleProductExpandedDist,
    ChangeDetailsDistPanelVisibility, Contribuzione, ReduceEuroContributions, setContribution_selected}) => {

    const virtuosoGridRef = React.useRef(null);

    return <Stack direction='row' height={`calc(100vh - ${selectedFile.length > 0 ? '320px' : '247px'})`}
        width='100%' translate="no">
        {grindView ? <VirtuosoGrid
            ref={virtuosoGridRef}
            id='focelda-virtualized-grind'
            overscan={10}
            totalCount={data.length}
            components={gridComponents}
            itemContent={index => <RenderRow index={index} elm={data[index]} setData={setData} AdvisedPrice={AdvisedPrice}
            param={param} setSelectedFile={setSelectedFile} selectedFile={selectedFile}
            PickLowest={PickLowest} handleClick={handleClick} grindView={grindView}
            SaveCheckedBlockonElement={SaveCheckedBlockonElement} HandleProductExpandedDist={HandleProductExpandedDist}
            ChangeDetailsDistPanelVisibility={ChangeDetailsDistPanelVisibility} Contribuzione={Contribuzione} 
            ReduceEuroContributions={ReduceEuroContributions} setContribution_selected={setContribution_selected}/>}
        /> :
            <Virtuoso
                ref={virtuosoGridRef}
                id='focelda-virtualized-table'
                overscan={10}
                totalCount={data.length}
                components={{
                    Item: ItemContainerTable,
                    List: ListContainer
                }}
                itemContent={index => <RenderRow index={index} elm={data[index]} setData={setData} AdvisedPrice={AdvisedPrice}
                param={param} setSelectedFile={setSelectedFile} selectedFile={selectedFile}
                PickLowest={PickLowest} handleClick={handleClick} grindView={grindView}
                SaveCheckedBlockonElement={SaveCheckedBlockonElement} Contribuzione={Contribuzione} 
                ReduceEuroContributions={ReduceEuroContributions} setContribution_selected={setContribution_selected}
                HandleProductExpandedDist={HandleProductExpandedDist}
                ChangeDetailsDistPanelVisibility={ChangeDetailsDistPanelVisibility}  />}
            />}
    </Stack>;
};

export default VirtuosoGridVI;