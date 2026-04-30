import { useEffect, useState } from "react";

import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';

import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

export default function FormControlElm (props) {
    const index = props.objects.indexOf(props.singleElm);

    const elm = props.singleElm
    
    const [dataKeysElm, setDataKeysElm] = useState(  
      props.data.reduce((acc, obj) => {
        if (obj.hasOwnProperty("key")) {
          acc.push(obj["key"]);
        }
        return acc;
      }, [])
    );
    const [dataKeysIndex, setdataKeysIndex] = useState(props.data.findIndex(elm => elm.key === props.data[props.i].key));
    const handleKeysIndexChange = (event) => {
      const selectedIndex = event.target.value;
      setdataKeysIndex(() => { return selectedIndex });
    };

    const [dataValuesElm, setDataValuesElm] = useState(   
      props.data.reduce((acc, obj) => {
        if (obj.hasOwnProperty("value")) {
          acc.push(obj["value"]);
        }
        return acc;
      }, [])
    );
    const [dataValuesIndex, setdataValuesIndex] = useState(props.fieldCurrentCollection?.findIndex(elm => elm === props.data[props.i].value));
    const handleValuesIndexChange = (event) => {
      const selectedIndex = event.target.value;
      setdataValuesIndex(() => { return selectedIndex });
      //MoveOnNotAvailableItem(selectedIndex);
    };


    useEffect(()=>{
      props.setElmOnScreen(prev => {
        return [...prev, elm.key]
      })
    },[])


    ////////////////////
   /* const MoveOnNotAvailableItem = (i) => {
      setDataValuesElm(prev => {
        const valuesElmArr = [...prev]; // Create a copy of the array
        const elm = valuesElmArr.splice(i, 1); // Remove the element at the specified index
        setDataValuesNotAvailable(previus => {
          return [...previus, elm.toString()];
        })
        return valuesElmArr; // Return the updated array
    })
  }*/

    return (
      <Stack direction={"row"} alignItems={"center"}>
         <IconButton onClick={(i) => props.removeSettings(i)} aria-label="add" size="large" sx={{maxWidth: 50}}>
             <CloseOutlinedIcon fontSize="inherit" />
         </IconButton>
         <FormControl fullWidth style={{minHeight:"100", maxWidth: 200 }} >
             <Select
               value={dataKeysIndex}
               onChange={handleKeysIndexChange}
               displayEmpty
               style={{ minHeight: "40px"}}
             >
               {dataKeysElm?.map((data, index) => {
                 return (
                   <MenuItem value={index} key={index}>
                     {data}
                   </MenuItem>
                 );
               })}
             </Select>
         </FormControl>
         <KeyboardArrowRightIcon />
         <FormControl fullWidth style={{minHeight:"100", maxWidth: 200 }} >
             <Select
               value={dataValuesIndex}
               onChange={handleValuesIndexChange}
               displayEmpty
               style={{ minHeight: "40px"}}
             >
               {props.fieldCurrentCollection?.map((data, index) => {
                 return (data !== "" &&
                   <MenuItem value={index} key={index}>
                     {data}
                   </MenuItem>
                 );
               })}
             </Select>
         </FormControl>
      </Stack>
    )
}