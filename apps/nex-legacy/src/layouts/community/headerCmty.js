import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate  } from "react-router-dom";

//@Component 
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';

//@Mui Icon
import ThumbsUpDownOutlinedIcon from '@mui/icons-material/ThumbsUpDownOutlined';
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined';
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined';

import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import CachedIcon from '@mui/icons-material/Cached';
import { icon_forum, icon_time } from "config/icons";
import MDButton from "components/MDButton";
import { MainTheme } from "assets/settingsTheme";
import { useNexTheme } from "@nex/theme-system";




function HeaderCmty (props) {
    const { SortBy, updateAllPost, loader } = props;
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;
    const navigate = useNavigate();
    const filtersData = [
        {key: 'priority', title: 'Priorità', sort: true, icon: <StarBorderOutlinedIcon />}, 
        {key: 'datePost', title: 'Nuovi Post', sort: true, icon: icon_time()}, 
        {key: 'like', title: 'Numero di Like', sort: true, icon: <ThumbsUpDownOutlinedIcon />},
        {key: 'comments', title: 'Numero di Commenti', sort: true, icon: icon_forum()},
    ]

    const statusAvaible = ['disabled', 'up', 'down'];
    const [test, setTest] = useState([]);

    const trovaOggettiConSortTrue = useCallback((arr) => {
        const risultato = [];
    
        function esaminaElemento(elemento) {
          if (elemento.sort === true && elemento.fieldToTake === undefined) {
            risultato.push({
              key: elemento.key,
              sortStatus: 0
            });
          }
          if (elemento.fieldToTake && Array.isArray(elemento.fieldToTake)) {
            elemento.fieldToTake.forEach(esaminaElemento);
          }
        }
    
        arr.forEach(esaminaElemento);
    
        return risultato;
    }, [filtersData])


    useEffect(() => {
        setTest(() => trovaOggettiConSortTrue(filtersData))
    },[])


    const changeSortStatus = (index, key, listofRowElements) => {
        const newArr = [...test]
    
        const statusAvaible = ['disabled', 'up', 'down'];
        const sortStatus = newArr.find(el => el.key === key)?.sortStatus;
        // Imposta il sortStatus dell'oggetto selezionato a 1
        newArr[index].sortStatus = sortStatus >= (statusAvaible.length - 1) ? 0 : sortStatus + 1;
    
        // Imposta il sortStatus di tutti gli altri oggetti a 0
        for (let i = 0; i < newArr.length; i++) {
          if (i !== index) {
            newArr[i].sortStatus = 0;
          }
        }
        setTest(() => newArr)
    
        //richiama la funzione per il sort specificando
        // - label di rifirimento del campo, ovvero su quale campo dei dati deve fare il sort.
        // - lo stato attuale del sort.
        SortBy(key, sortStatus);
      }

    const FiltersRender = useMemo(() => (
        filtersData.map((data, index) => (
            <MDButton key={index} 
            color={statusAvaible[test[index]?.sortStatus] !== 'disabled' ? 
                darkMode ? "primary" : 'warning' : "secondary"}
            onClick={() => changeSortStatus(index, data.key)} 
            size="medium" variant="outlined" startIcon={data.icon}>
                <span>{data.title}</span>
                {statusAvaible[test[index]?.sortStatus] !== 'disabled' && 
                    <ArrowUpwardRoundedIcon
                        style={{ transition: 'rotate 100ms ease-in', marginLeft: 5 }}
                        sx={
                            statusAvaible[test[index]?.sortStatus] !== 'disabled' &&
                                statusAvaible[test[index]?.sortStatus] !== 'up' ?
                                    { color: `${darkMode ? palette.primary.main : palette.warning.main}`, rotate: '180deg' }
                                    :
                                    { color: `${darkMode ? palette.primary.main : palette.warning.main}` }
                        } />}
            </MDButton>
        ))
    ),[test, palette, darkMode])




    return (
        <Stack translate="no">
            <Stack direction="row" spacing={3} useFlexGap flexWrap="wrap" style={{justifyContent: "left", borderRadius: "10px"}}>
                {FiltersRender}
                <Button onClick={() => {
                        return navigate("/community/create_post");
                    }} className="css-community-createPost" size="medium" variant="outlined" startIcon={<NotesOutlinedIcon />}>
                    Crea un Post
                </Button>
                <IconButton onClick={() => updateAllPost()} sx={{marginLeft: 'auto'}} aria-label="Cached">
                    <CachedIcon className={loader ? "reverseSpin" : ""}/>
                </IconButton>
            </Stack>
        </Stack>

    )
}

export default HeaderCmty;