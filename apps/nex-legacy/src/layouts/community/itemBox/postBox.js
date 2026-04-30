import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

//@User Details Fetched From Server
import { UserContext } from "../../../context/UserContext";

//@Component 
import MDTypography from "components/MDTypography";
import Card from "@mui/material/Card";
import MDAvatar from "components/MDAvatar";
import Stack from '@mui/material/Stack';

//@MUI Component
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

//@MUI Icons
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ReadMoreIcon from '@mui/icons-material/ReadMore';
import SmsOutlinedIcon from '@mui/icons-material/SmsOutlined';
import StarOutlinedIcon from '@mui/icons-material/StarOutlined';

import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import MDButton from "components/MDButton";
import { IconButton } from "@mui/material";
import { icon_moreSettings } from "config/icons";
import { MainTheme } from "assets/settingsTheme";
import { useNexTheme } from "@nex/theme-system";

function PostBox(props) {
    const [userContext, setUserContext] = useContext(UserContext);
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;

    const [like, setLike] = useState(props.like);
    const [priority, setPriority] = useState(props.priority);

    const [showMorePannel, setShowMorePannel] = useState(false);
    const handleOpenMenu = (event) => setShowMorePannel(event.currentTarget);
    const handleCloseMenu = () => setShowMorePannel(false);
    const navigate = useNavigate()
    const obj = {
        username: userContext.details.username,
        firstName: userContext.details.nome,
        lastName: userContext.details.cognome,
        avatar: userContext.details.imageProfile,
    };
    const checkifAlreadyLiked = like.find(element => element.username === obj.username);




    const AddLike = () => {
        if (!checkifAlreadyLiked) {
            setLike(prev => {
                return [...prev, obj];
            })
            props.addLike(props._id, props.userDettails?.username);
        }
    };

    const RemoveLike = () => {
        if (checkifAlreadyLiked) {
            setLike(prev => {
                const updatedArray = prev.filter(item => item.username !== obj.username);
                return updatedArray;
            });
            props.removeLike(props._id, props.userDettails?.username);
        }
    };

    const UpdatePriority = () => {
        handleCloseMenu();
        fetch(import.meta.env.VITE_API_COMMUNITY + "community/posts/update/priority", {
            method: "POST",
            body: JSON.stringify({
                postId: props._id,
                priorityActualStatus: !priority,
            }),
            headers: { "Content-Type": "application/JSON" },
        }).then(response => {
            if (!response.ok) {
                throw new Error(response);
            }
            return response.json();
        }).then(data => {
            if (data.status === "Ok") {
                setPriority(() => { return !priority });
            }
        })
    }


    const renderMenu = (
        <Menu
            id="simple-menu"
            anchorEl={showMorePannel}
            anchorOrigin={{
                vertical: "top",
                horizontal: "left",
            }}
            transformOrigin={{
                vertical: "top",
                horizontal: "right",
            }}
            open={Boolean(showMorePannel)}
            onClose={handleCloseMenu}
        >
            {(userContext.details?.ruolo === "Dev" || userContext.details?.ruolo === "Admin" || userContext.details.username === props.userDettails.username) &&
                <MenuItem onClick={() => {/*props.deletePost(props.index, props._id);*/ props.stallDelete(props.index, props._id, props.userDettails.username, props.title, props.body); handleCloseMenu(); }}>Cancella</MenuItem>
            }
            {(userContext.details?.ruolo === "Dev" || userContext.details?.ruolo === "Admin") &&
                <MenuItem onClick={UpdatePriority}>{!priority ? "Rendi in evidenza" : "Togli evidenza"}</MenuItem>
            }
            <MenuItem onClick={handleCloseMenu}>Segnala il post</MenuItem>
        </Menu>
    );




    return (
        <Card sx={{ alignItems: "center", minWidth: 400 }}>
            <Stack sx={{ maxWidth: 400, alignItems: "center", padding: 10 }} spacing={2}>
                <Stack direction="row" spacing={1} sx={{ position: "Absolute", top: "15px", right: "15px" }} alignItems="center">
                    {priority && <StarOutlinedIcon sx={{ color: "#ffab2c" }} />}
                    <IconButton onClick={(e) => handleOpenMenu(e)}>
                        {icon_moreSettings()}
                    </IconButton>
                </Stack>

                <MDButton disabled={false} size="large" variant="filled" className={props.type !== "Develop" ? "css-community-type css-community-type-support" : "css-community-type css-community-type-develop"} >
                    {props.type}
                </MDButton>

                <Stack sx={{ alignItems: "center", marginBottom: 1 }}>
                    <MDAvatar style={{ minWidth: "5em", minHeight: "5em" }} src={props.userDettails?.avatar} alt="Test" shadow="md" />
                    <MDTypography component="span" sx={{ fontWeight: "light", fontSize: "0.8rem" }}>
                        {props.userDettails?.firstName + " " + props.userDettails?.lastName}</MDTypography>
                </Stack>

                <Stack alignItems='center' gap={1}>
                    <MDTypography component="h3" style={{
                        fontWeight: "bold",
                        textAlign: "center",
                        marginTop: "0.3em",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        width: "100%",
                        whiteSpace: "nowrap",
                        textAlign: "left",
                    }}>{props.title}</MDTypography>
                    <p style={{ color: `${darkMode ? palette.grey[500] : palette.grey[700]}`, 
                        minHeight: "100px", maxWidth: "100%", fontWeight: 200, fontSize: "0.7rem" }}
                        dangerouslySetInnerHTML={{ __html: props.body?.slice(0, 150) }} ></p>
                </Stack>


                <Stack direction="row" spacing={1}>
                    <MDButton onClick={checkifAlreadyLiked ? RemoveLike : AddLike} 
                    color={darkMode ? "primary" : 'secondary'}
                    size="medium" 
                    variant={checkifAlreadyLiked ? "contained" : "outlined"} 
                    startIcon={<ThumbUpIcon />}>
                        {like.length}
                    </MDButton>
                    <MDButton 
                    color="secondary"
                    onClick={() =>  navigate("/community/" + props._id)} 
                    size="medium" variant="outlined" startIcon={<ReadMoreIcon />}>
                        Leggi
                    </MDButton>
                </Stack>

                <Stack direction="row" spacing={3} sx={{ position: "absolute", bottom: "15px", right: "15px" }} alignItems="center">
                    <MDTypography component="span" sx={{ color: "#ccc", fontSize: "0.8rem" }} ><SmsOutlinedIcon sx={{ fontSize: "2em" }} /> {props.comments?.length !== undefined ? props.comments.length : 0}</MDTypography>
                    <MDTypography component="p" sx={{ color: "#ccc", fontSize: "0.8rem" }} >{formatDistanceToNow(new Date(props.createDate), { locale: it }) + " fa"}</MDTypography>
                </Stack>
            </Stack>
            {renderMenu}
        </Card>
    )
};
export default PostBox;