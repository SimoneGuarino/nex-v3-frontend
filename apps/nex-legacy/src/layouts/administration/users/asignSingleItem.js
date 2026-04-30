import React, {useState, useEffect} from "react";

//@MUI Components
import Stack from '@mui/material/Stack';

import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
//@MUI Icons 
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';


export default function AsignSingleItem(props) {
    //definisci i valori Brand 
    //di default inviati dal DB sull'oggetto univoco in modo tale da individuare l'index sulla lista generale delle categorie
    //e assegnali alle selectBox.
    const [runEffect, setRunEffect] = useState(false);
    const findBrandOnData = Object.keys(props.element)?.length !== 0 ? props.catData?.findIndex(elm => elm.Marca === props.element.Marca) : ``;
    
    const initialState = props.element?.Categories?.length > 1;

    const [brandIndex, setBrandIndex] = useState(findBrandOnData !== -1 && findBrandOnData !== undefined ? findBrandOnData : ``);
    const handlebrandIndexChange = (event) => {
        if(brandIndex !== event.target.value){
            setCategoryIndex(() => ``); 
            setSubCategoryIndex(``);
        }
        setBrandIndex(event.target.value);
    };

    const [categoryIndex, setCategoryIndex] = useState(!initialState ? (Object.keys(props.element).length !== 0 ? (brandIndex !== -1 ? props.catData[brandIndex]?.Categories?.findIndex(elm => elm?.Linea === props.element?.Categories?.Linea) : ``) : ``) : ``);
    const handleCategoryIndexChange = (event) => {
        setCategoryIndex(event.target.value);
        if(categoryIndex === ``) {
            setSubCategoryIndex(() => ``);
        }
    };
    const [subCategoryIndex, setSubCategoryIndex] = useState(!initialState ? (Object.keys(props.element).length !== 0 ? (categoryIndex !== -1 ? props.catData[brandIndex]?.Categories[categoryIndex]?.SubCategory?.findIndex(elm => elm.Gruppo === props.element?.Categories?.SubCategory?.Gruppo) : ``) : ``) : ``);
    const handleSubCategoryIndexChange = (event) => {
        const newValue = event.target.value;
        setSubCategoryIndex(newValue);
    };
    
    useEffect(() => {
        if(runEffect){
            if(brandIndex !== undefined && props.catData !== undefined && props.catData[brandIndex] !== undefined){
                props.composeItemAddList(props.index, props.catData[brandIndex].Marca)
            }else if(brandIndex !== undefined && props.catData[brandIndex] === undefined){
                props.composeItemAddList(props.index)
            }
        }else{
            setRunEffect(true);
        }
    },[brandIndex]);
    useEffect(() => {
        if(runEffect){
            if(brandIndex !== undefined && props.catData !== undefined && props.catData[brandIndex] !== undefined && props.catData[brandIndex].Categories[categoryIndex] !== undefined){
                props.composeItemAddList(props.index, props.catData[brandIndex].Marca, props.catData[brandIndex].Categories[categoryIndex].Linea)
            }else if (brandIndex !== undefined && props.catData !== undefined && props.catData[brandIndex] !== undefined && props.catData[brandIndex].Categories[categoryIndex] === undefined){
                props.composeItemAddList(props.index, props.catData[brandIndex].Marca, undefined)
            }
        }
    },[categoryIndex]);
    useEffect(() => {
        if(runEffect){
            if(brandIndex !== undefined && props.catData !== undefined && props.catData[brandIndex] !== undefined && props.catData[brandIndex].Categories[categoryIndex] !== undefined && props.catData[brandIndex].Categories[categoryIndex].SubCategory[subCategoryIndex] !== undefined){
                props.composeItemAddList(props.index, props.catData[brandIndex].Marca, props.catData[brandIndex].Categories[categoryIndex].Linea, props.catData[brandIndex].Categories[categoryIndex].SubCategory[subCategoryIndex].Gruppo)
            }else if (brandIndex !== undefined && props.catData !== undefined && props.catData[brandIndex] !== undefined && props.catData[brandIndex].Categories[categoryIndex] !== undefined && props.catData[brandIndex].Categories[categoryIndex].SubCategory[subCategoryIndex] === undefined){
                props.composeItemAddList(props.index, props.catData[brandIndex].Marca, props.catData[brandIndex].Categories[categoryIndex].Linea, undefined)
            }
        } 
    },[subCategoryIndex]);

    return (
        <Stack direction="row">
            <IconButton size="small" sx={{minWidth:"30px", maxWidth:"50px", alignSelf: "center", marginRight: "20px", height: 30, color: "#fff", backgroundColor: "#cd5a40 !important", borderRadius: "8px"}} onClick={() => props.delItemCatList(props.index)}>
                <CloseOutlinedIcon />
            </IconButton>
            <FormControl sx={{ m: 1, minWidth: 80}}>
                <InputLabel id="demo-simple-select-autowidth-label">Brands</InputLabel>
                <Select
                  labelId="demo-simple-select-autowidth-label"
                  id="demo-simple-select-autowidth"
                  value={brandIndex}
                  onChange={handlebrandIndexChange}
                  autoWidth
                  label="Brands"
                  sx={{minHeight: 40}}
                >
                    <MenuItem value="">
                        <em>none</em>
                    </MenuItem>
                    {props.catData.map((data, i) => {
                        return (
                            <MenuItem key={i} value={i}>{Object.values(data)[1]}</MenuItem>
                        )
                    })}
                </Select>
            </FormControl>

            {brandIndex !== "" && <FormControl sx={{ m: 1, minWidth: 100}}>
                <InputLabel id="demo-simple-select-autowidth-label">Categorie</InputLabel>
                <Select
                  labelId="demo-simple-select-autowidth-label"
                  id="demo-simple-select-autowidth"
                  value={categoryIndex}
                  onChange={handleCategoryIndexChange}
                  autoWidth
                  label="Categorie"
                  sx={{minHeight: 40}}
                >
                    <MenuItem value="">
                        <em>All</em>
                    </MenuItem>
                    {props.catData[brandIndex]?.Categories.map((data, i) => {
                        return (
                            <MenuItem key={i} value={i}>{Object.values(data)[1]}</MenuItem>
                        )
                    })}
                </Select>
            </FormControl>}
            {(categoryIndex !== "" && props.catData[brandIndex]?.Categories[categoryIndex]?.SubCategory?.length > 0) && <FormControl sx={{ m: 1, minWidth: 120}}>
                <InputLabel id="demo-simple-select-autowidth-label">Sottocategorie</InputLabel>
                <Select
                  labelId="demo-simple-select-autowidth-label"
                  id="demo-simple-select-autowidth"
                  value={subCategoryIndex}
                  onChange={handleSubCategoryIndexChange}
                  autoWidth
                  label="SubCategorys"
                  sx={{minHeight: 40}}
                >
                    <MenuItem value="">
                        <em>All</em>
                    </MenuItem>
                    {props.catData[brandIndex]?.Categories[categoryIndex]?.SubCategory?.map((data, i) => {
                        return (
                            <MenuItem key={i} value={i}>{Object.values(data)[1]}</MenuItem>
                        )
                    })}
                </Select>
            </FormControl>}
        </Stack>
    )
}