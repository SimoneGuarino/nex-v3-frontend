import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

import { SendLogs } from "../../../logs/index.js"

//Context
//@User Details Fetched From Server
import { UserContext } from "../../../context/UserContext";
import { useMaterialUIController } from "context";

//@Component 
import MDBox from "components/MDBox";
import MDSnackbar from "components/MDSnackbar";
import MDTypography from "components/MDTypography";
import Stack from '@mui/material/Stack';
import LoadingButton from '@mui/lab/LoadingButton';

import InputBase from '@mui/material/InputBase';

import MinLoader from "minLoader";
import EmojiError from "emojiError";

import HintsBox from "./hintsCreateTopic/index.js";

//@MUI Component
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import IconButton from '@mui/material/IconButton';

//@Mui Icon
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

import AddAPhotoOutlinedIcon from '@mui/icons-material/AddAPhotoOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { MainTheme } from "assets/settingsTheme.tsx";
import MDButton from "components/MDButton";
import { icon_send } from "config/icons.js";
import { useNexTheme } from "@nex/theme-system";




export default function CreateTopic() {
    const [userContext, setUserContext] = useContext(UserContext);

    const [controller, dispatch] = useMaterialUIController();
    const {
        transparentSidenav,
    } = controller;
    const palette = MainTheme().palette;
    const navigate = useNavigate();
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";

    const [oneTimeSend, setOneTimeSend] = useState(false);

    const [type, setType] = useState("");
    const [postTypology, setPostTypology] = useState(null);
    const [commentTitle, setCommentTilte] = useState("");
    const [commentBody, setCommentBody] = useState("");


    //Notifica Generale di Error/Info/Success
    //--- Messaggio di Errore
    const [error, setError] = useState("");
    //--- Stato del Messaggio se aperto o meno
    const [errorSB, setErrorSB] = useState(false);
    const closeErrorSB = () => setErrorSB(false);
    const openErrorSB = () => setErrorSB(true);
    // --- Richiamando e settando uno di questi valori definisce il colore e l'icona in utilizzo dal pop-up
    const [dymIcon, setDymIcon] = useState("warning");
    const renderErrorSB = (
        <MDSnackbar
            color={dymIcon}
            icon={dymIcon}
            title="Focelda Dashboard"
            content={error}
            dateTime="1 sec fa"
            open={errorSB}
            onClose={closeErrorSB}
            close={closeErrorSB}
            bgWhite
        />
    );
    //Errore nel primo fetch     
    const [err, setErr] = useState(false);
    const [loader, setLoader] = useState(false);
    //Importazione dell'imagine
    const [selectedFile, setSelectedFile] = useState([]);

    const formData = new FormData();
    formData.append("postImage", selectedFile);





    const onSelectFile = e => {
        if (!e.target.files || e.target.files.length === 0) {
            setSelectedFile(undefined)
            return
        }

        //multiple image
        setSelectedFile(() => { return [...e.target.files] });
    };

    const deleteAttached = (index) => {
        setSelectedFile(prev => {
            const newSelectedFile = [...prev]; // Create a copy of the array
            newSelectedFile.splice(index, 1); // Remove the element at the specified index
            return newSelectedFile; // Return the updated array
        });
    }

    const saveAttacheds = (e) => {
        //Invia le immagini e storage all'interno del server
        const formData = new FormData();
        selectedFile.forEach((file, index) => {
            formData.append("postImage", file);
        });

        fetch(import.meta.env.VITE_API_COMMUNITY + "attached", {
            method: "POST",
            body: formData,
        })

            .then((response) => response.json())
            .catch((err) => console.error(err))
            .finally(() => {
                setOneTimeSend(false);
            });
    };

    const handlePostTypologyChange = (event) => {
        setPostTypology(event.target.value);
    };

    const sendCreate = (e) => {
        e.preventDefault();

        setOneTimeSend(() => { return true })
        let typology = document.getElementById("data-select-typology").innerText;

        if (postTypology == null || postTypology === '') {
            setDymIcon("warning")
            setError("Perfavore seleziona almeno una categoria.");
            openErrorSB();
            setOneTimeSend(() => { return false })
        } else if (commentTitle === "") {
            setDymIcon("warning")
            setError("Perfavore definisci un titolo seguendo le linee guida nei tips.");
            openErrorSB();
            setOneTimeSend(() => { return false })
        } else if (commentBody === "") {
            setDymIcon("warning")
            setError("Perfavore inserisci un testo, spiegando nel dettaglio la tua idea o la tua problematica.");
            openErrorSB();
            setOneTimeSend(() => { return false })
        } else {
            if (commentTitle.length < 10) {
                setDymIcon("warning")
                setError("Perfavore inserisci un titolo di almeno 10 Caratteri.");
                openErrorSB();
                setOneTimeSend(() => { return false })
            } else if (commentBody.length < 20) {
                setDymIcon("warning")
                setError("Perfavore inserisci un testo di almeno 40 Caratteri, spiegando la tua domanda/suggerimento.");
                openErrorSB();
                setOneTimeSend(() => { return false })
            } else {
                if (commentTitle.length > 100) {
                    setDymIcon("warning")
                    setError("Perfavore ristruttura il titolo della tua domanda/consiglio, con un massimo di 100 caratteri.");
                    openErrorSB();
                    setOneTimeSend(() => { return false })
                } else {

                    const post_dettails = {
                        post_creator: userContext.details?.username,
                        title_post: commentTitle,
                        body_post: commentBody,
                    }

                    fetch(import.meta.env.VITE_API_COMMUNITY + "community/posts/create/post", {
                        method: "POST",
                        body: JSON.stringify({
                            type: typology,
                            title: commentTitle,
                            body: commentBody,
                            attacheds: selectedFile.map(oggetto => "upload/" + oggetto.name),
                            username: userContext.details?.username,
                            firstName: userContext.details?.firstName,
                            lastName: userContext.details?.lastName,
                            avatar: userContext.details?.imageProfile,
                        }),
                        headers: { "Content-Type": "application/JSON" },
                    }).then(response => {
                        if (!response.ok) {
                            throw new Error(response);
                        }
                        return response.json();
                    }).then(_ => {
                        //Invia il log dell'Add Post al servizio dedicato
                        SendLogs(userContext.token, "Add Post", window.location.href.toString(), "", "", post_dettails);
                        saveAttacheds();
                        setOneTimeSend(() => { return false })
                        navigate("/community/");
                    }).catch(err => {
                        setDymIcon("error")
                        setError("Ops!, sembra che tu ci sia un problema con il server.");
                        openErrorSB();
                        setOneTimeSend(() => { return false })
                    })
                }
            }
        }
    }





    return <DashboardLayout>
        <MDBox pt={6} pb={3} translate="no">
            {!err ?
                (loader ? <MinLoader /> :
                    <Stack spacing={1} useFlexGap flexWrap="wrap" style={{ justifyContent: "left", padding: "0px 20px" }}>
                        <Stack sx={{
                            backgroundColor: `${darkMode ? palette.primary.dark : palette.primary.light}`,
                            padding: "20px", borderRadius: "10px"
                        }}>
                            <MDTypography component="h2" style={{ fontSize: "1.2em", fontWeight: "500", marginTop: "0.3em" }}>
                                Scrivi una buona domanda
                            </MDTypography>
                            <MDTypography component="p" style={{ fontSize: "1rem", fontWeight: "300", marginTop: "0.3em" }}>
                                hai in mente un idea da applicare al sito?, oppure hai riscontrato un BUG e ce lo vuoi comunicare?,
                                ti guideremo attraverso questo processo.
                            </MDTypography>
                            <MDTypography component="h6" style={{ fontSize: "0.8rem", fontWeight: "500", marginTop: "1em" }}>
                                Steps
                            </MDTypography>
                            <MDTypography component="ul" style={{ fontSize: "1rem", marginTop: "0.3em", paddingLeft: "2rem" }}>
                                <MDTypography component="li" style={{ fontSize: "0.8rem", fontWeight: "300", marginTop: "0.3em" }}>
                                    Riassumi il tuo problema in un titolo di una riga.
                                </MDTypography>
                                <MDTypography component="li" style={{ fontSize: "0.8rem", fontWeight: "300", marginTop: "0.3em" }}>
                                    Descrivi il tuo problema o il tuo consiglio in modo più dettagliato.
                                </MDTypography>
                                <MDTypography component="li" style={{ fontSize: "0.8rem", fontWeight: "300", marginTop: "0.3em" }}>
                                    Descrivi cosa hai provato e cosa ti aspettavi che accadesse.
                                </MDTypography>
                                <MDTypography component="li" style={{ fontSize: "0.8rem", fontWeight: "300", marginTop: "0.3em" }}>
                                    Aggiungi "tag" che aiutano a far emergere la tua domanda ai membri della comunità.
                                </MDTypography>
                                <MDTypography component="li" style={{ fontSize: "0.8rem", fontWeight: "300", marginTop: "0.3em" }}>
                                    Rivedi la tua domanda e pubblicala sul sito.
                                </MDTypography>
                            </MDTypography>
                        </Stack>

                        <Stack useFlexGap flexWrap="wrap" direction="row" spacing={3} >
                            <Stack className={!transparentSidenav ? "css-color-bgwhite" : null}
                                sx={{
                                    border: `1px solid ${darkMode ? palette.grey[800] : palette.grey[400]}`,
                                    borderRadius: "10px", padding: "20px", height: "auto", minWidth: "calc(100% - 18.1em)", maxWidth: "calc(100% - 18.1em)"
                                }}>
                                <MDTypography component="h6" style={{ fontSize: "1rem", fontWeight: "500" }}>
                                    Seleziona la tipologia.
                                </MDTypography>
                                <MDTypography component="p" style={{ fontSize: "0.8rem", fontWeight: "300" }}>
                                    Seleziona la categoria dove pensi il tuo problema o la tua domanda ne faccia parte.
                                </MDTypography>
                                <FormControl sx={{ m: 1, minWidth: 80, height: "2em", marginTop: "1.5rem" }}>
                                    <InputLabel>Tipologia</InputLabel>
                                    <Select
                                        id="data-select-typology"
                                        sx={{ height: "100%" }}
                                        value={postTypology}
                                        onChange={e => handlePostTypologyChange(e)}
                                        autoWidth
                                        label="Tipologia"
                                    >
                                        <MenuItem value={null}><em>None</em></MenuItem>
                                        <MenuItem name="Develop" value={10}>Nuove Funzionalità</MenuItem>
                                        <MenuItem name="Support" value={20}>Supporto</MenuItem>
                                        <MenuItem name="Errori" value={20}>Errori</MenuItem>
                                    </Select>
                                </FormControl>
                            </Stack>
                            <HintsBox title="Seleziona la Categoria" body="Dove pensi che sia posizionata la tua domanda/problema all'interno delle tipologie?" />
                        </Stack>


                        <Stack useFlexGap flexWrap="wrap" direction="row" spacing={3} >
                            <Stack className={!transparentSidenav ? "css-color-bgwhite" : null} sx={{
                                border: `1px solid ${darkMode ? palette.grey[800] : palette.grey[400]}`,
                                borderRadius: "10px", padding: "20px", minWidth: "calc(100% - 18.1em)", maxWidth: "calc(100% - 18.1em)"
                            }}>
                                <MDTypography component="h6" style={{ fontSize: "1rem", fontWeight: "500" }}>
                                    Titolo
                                </MDTypography>
                                <MDTypography component="p" style={{ fontSize: "0.8rem", fontWeight: "300" }}>
                                    Sii specifico e immagina di star ponendo la domanda ad un altra persona. Minimo 10 caratteri e un massimo di 100 caratteri
                                </MDTypography>
                                <Stack direction="row" spacing={1} sx={{
                                    border: `1px solid ${darkMode ? palette.grey[800] : palette.grey[400]}`,
                                    pl: 1.5, minWidth: "100%", borderRadius: "10px", minHeight: "2em", marginTop: "1.5rem"
                                }}>
                                    <InputBase
                                        sx={{ ml: 1, fontSize: "0.9rem", minWidth: "92%", color: `${darkMode ? palette.grey[300] : palette.grey[800]}` }}
                                        placeholder="Inserisci il tuo titolo"
                                        inputProps={{ 'aria-label': 'Inserisci il tuo titolo' }}
                                        onChange={(e) => { return setCommentTilte(e.target.value) }}
                                    />
                                </Stack>
                            </Stack>
                            <HintsBox title="Scrivi un buon titolo" body="Potresti scoprire di avere un'idea migliore del tuo titolo dopo aver scritto il resto della domanda." />
                        </Stack>

                        <Stack useFlexGap flexWrap="wrap" direction="row" spacing={3} >
                            <Stack className={!transparentSidenav ? "css-color-bgwhite" : null} sx={{
                                border: `1px solid ${darkMode ? palette.grey[800] : palette.grey[400]}`,
                                borderRadius: "10px", padding: "20px 20px 70px", height: "auto", minWidth: "calc(100% - 18.1em)", maxWidth: "calc(100% - 18.1em)"
                            }}>
                                <MDTypography component="h6" style={{ fontSize: "1rem", fontWeight: "500" }}>
                                    Quale sono i dettagli del tuo problema?
                                </MDTypography>
                                <MDTypography component="p" style={{ fontSize: "0.8rem", fontWeight: "300" }}>
                                    Introduci il problema e spiega quello che hai scritto nel titolo. Minimo 40 caratteri.
                                </MDTypography>
                                <RichTextEditor
                                    value={commentBody || ""}
                                    onChange={(html) => setCommentBody(html)}
                                    placeholder="Scrivi il messaggio…"
                                    className="w-full h-full"
                                    debounceMs={120}
                                    actions={["bold", "italic", "underline", "strike", "h1", "h2", "ul", "ol", "quote", "code", "link", "clear"]}
                                />
                            </Stack>
                            <HintsBox title="Introduci il tuo Problema" body="Spiega come hai incontrato il problema che stai cercando di risolvere e le eventuali difficoltà che ti hanno impedito di risolverlo da solo." />
                        </Stack>

                        <form encType="multipart/form-data" method="post">
                            <Stack direction='row' mb={2}>
                                <Stack spacing={1} className={!transparentSidenav ? "css-color-bgwhite" : null} sx={{
                                    border: `1px solid ${darkMode ? palette.grey[800] : palette.grey[400]}`,
                                    borderRadius: "10px", padding: "20px 20px 20px", height: "auto", width: "auto", maxWidth: "calc(100% - 20.1em)"
                                }}>
                                    <MDButton color="secondary" variant="contained" component="label">
                                        <AddAPhotoOutlinedIcon style={{ marginRight: 5 }} />
                                        <MDTypography component="p" style={{ fontSize: "1rem", fontWeight: "500", color: `${darkMode ? '' : palette.white.main}` }}>
                                            Upload
                                        </MDTypography>
                                        <input onChange={onSelectFile} hidden accept="image/*" type="file" name="postImage" multiple />
                                    </MDButton>
                                    <ImageList style={{ width: 500 }} sx={selectedFile?.length > 0 ? { height: 180 } : { height: 0 }} cols={3} rowHeight={164}>
                                        {selectedFile.map((item, index) => (
                                            <ImageListItem key={index}>
                                                <IconButton onClick={() => deleteAttached(index)} sx={{ position: "absolute", right: 0, color: "#d34242", padding: "3px" }} aria-label="delete" size="small">
                                                    <CloseRoundedIcon />
                                                </IconButton>
                                                <img
                                                    src={URL.createObjectURL(item)}
                                                    srcSet={URL.createObjectURL(item)}
                                                    alt={item.name}
                                                    loading="lazy"
                                                    style={{ borderRadius: 8 }}
                                                />
                                            </ImageListItem>
                                        ))}
                                    </ImageList>
                                </Stack>

                                <LoadingButton type="submit" loading={oneTimeSend} onClick={(e) => sendCreate(e)}
                                    color="primary"
                                    sx={{ ml: 'auto', mt: 'auto' }}
                                    variant='contained'
                                    size="medium" loadingPosition="end">
                                    <span style={{ color: `${darkMode ? palette.grey[800] : palette.grey[300]}`, marginRight: 8 }}>Crea!</span>
                                    {icon_send({ color: `${darkMode ? palette.grey[800] : palette.grey[300]}` })}
                                </LoadingButton>
                            </Stack>
                        </form>
                        {renderErrorSB}
                    </Stack>
                )
                : <EmojiError />
            }
        </MDBox>
    </DashboardLayout>
}