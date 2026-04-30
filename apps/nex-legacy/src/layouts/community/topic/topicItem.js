import { useState, useContext, useEffect } from "react";
//@User Details Fetched From Server
import { UserContext } from "../../../context/UserContext";
import { useParams } from 'react-router-dom';

import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

import { SendLogs } from "../../../logs/index.js"

//@Component 
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDAvatar from "components/MDAvatar";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";

//@MUI Component
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import InputBase from '@mui/material/InputBase';
import Backdrop from '@mui/material/Backdrop';

//@Mui Icon
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import FlagIcon from '@mui/icons-material/Flag';
import AddCommentIcon from '@mui/icons-material/AddComment';
import StarOutlinedIcon from '@mui/icons-material/StarOutlined';

import MinLoader from "minLoader";
import EmojiError from "emojiError";
import CommentItemTopic from "./comment/commentItemTopic";
import { MainTheme } from "assets/settingsTheme";
import MDButton from "components/MDButton";
import { icon_send } from "config/icons";
import { useNexTheme } from "@nex/theme-system";


function TopicItem() {
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const palette = MainTheme().palette;
    const [userContext, setUserContext] = useContext(UserContext);
    const [postData, setPostData] = useState([]);

    const [like, setLike] = useState([]);

    const [addCommentPannel, setAddCommentPannel] = useState(false);

    const [err, setErr] = useState(false);
    const [loader, setLoader] = useState(false);

    const { id } = useParams();


    const [comments, setComments] = useState(postData.comments);
    const [commentBodyToSend, setCommentBodyToSend] = useState("");

    const [attacheds, setAttacheds] = useState();
    const [selectedImage, setSelectedImage] = useState();
    const [openPopUpImage, setOpenPopUpImage] = useState(false);

    const handleImageClose = () => {
        setOpenPopUpImage(false);
    };
    const handleImageOpen = () => {
        setOpenPopUpImage(true);
    };

    const obj = {
        username: userContext.details?.username,
        firstName: userContext.details?.firstName,
        lastName: userContext.details?.lastName,
        avatar: userContext.details?.imageProfile,
    };

    const checkifAlreadyLiked = like.find(element => element.username === obj.username);


    const openImage = (
        <Backdrop
            sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={openPopUpImage}
            onClick={handleImageClose}
        >
            <img
                src={selectedImage}
                srcSet={selectedImage}
                alt={selectedImage}
                loading="lazy"
                style={{ borderRadius: 8 }}
            />
        </Backdrop>
    )

    useEffect(() => {
        setAttacheds(() => { return postData.attacheds })
    }, [postData.attacheds]);

    useEffect(() => {
        if (!userContext?.details) { return };
        setLoader(true);
        fetch(import.meta.env.VITE_API_COMMUNITY + "community/posts/read/post?id=" + id, {
            method: "GET",
            headers: { "Content-Type": "application/JSON" },
        }).then(response => {
            if (!response.ok) {
                throw new Error(response);
            }
            return response.json();
        })
            .then(data => {
                setPostData(() => { return data });
                setLike(() => { return data.like });
                setComments(() => { return data.comments });

                setLoader(false);
            }).catch(err => {
                setErr(true);
            })
    }, [userContext]);

    const AddComment = (post_id) => {
        const commentItemToPush = {
            firstName: userContext.details.nome,
            lastName: userContext.details.cognome,
            username: userContext.details.username,
            avatar: userContext.details.imageProfile,
            body: commentBodyToSend,
            postedDate: Date.now(),
            priority: false,
        }

        const post_dettails = {
            id_post: id,
            post_creator: postData.userDettails.username,
            body_comment: commentBodyToSend,
        }

        fetch(import.meta.env.VITE_API_COMMUNITY + "community/posts/create/comment", {
            method: "POST",
            body: JSON.stringify({
                post_id: post_id,
                comment: commentItemToPush,
            }),
            headers: { "Content-Type": "application/JSON" },
        }).then(response => {
            if (!response.ok) {
                throw new Error(response);
            }
            return response.json();
        }).then(_ => {
            setComments(prev => {
                return [...prev, commentItemToPush]
            })
            //Invia il log dell'Add Comment al servizio dedicato
            SendLogs(userContext.token, "Add Comment", window.location.href.toString(), "", "", post_dettails);
        })
    };

    const RemoveComment = (index, comment_id, postedDate, body) => {

        const post_dettails = {
            id_post: id,
            post_creator: postData.userDettails.username,
            body_comment: body,
        }

        fetch(import.meta.env.VITE_API_COMMUNITY + "community/posts/delete/comment", {
            method: "POST",
            body: JSON.stringify({
                post_id: id,
                comment_id: comment_id,
                postedDate: postedDate,
                username: userContext.details.username,
            }),
            headers: { "Content-Type": "application/JSON" },
        }).then(response => {
            if (!response.ok) {
                throw new Error(response);
            }
            return response.json();
        }).then(_ => {
            setComments(prev => {
                return prev.filter((_, i) => i !== index);
            })
            //Invia il log dell'Remove Comment al servizio dedicato
            SendLogs(userContext.token, "Remove Comment", window.location.href.toString(), "", "", post_dettails);
        })
    };

    const AddLike = () => {
        if (!checkifAlreadyLiked) {
            setLike(prev => {
                const updatedArray = prev.filter(item => item.username !== obj.username);
                return updatedArray;
            })

            fetch(import.meta.env.VITE_API_COMMUNITY + "community/posts/create/like", {
                method: "POST",
                body: JSON.stringify({
                    postId: id,
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
            })
        }
    };

    const RemoveLike = () => {
        if (checkifAlreadyLiked) {
            setLike(prev => {
                const updatedArray = prev.filter(item => item.username !== obj.username);
                return updatedArray;
            });

            fetch(import.meta.env.VITE_API_COMMUNITY + "community/posts/delete/like", {
                method: "POST",
                body: JSON.stringify({
                    postId: id,
                    username: userContext.details?.username,
                }),
                headers: { "Content-Type": "application/JSON" },
            }).then(response => {
                if (!response.ok) {
                    throw new Error(response);
                }
                return response.json();
            })
        }
    };





    return <DashboardLayout>
        <MDBox pt={6} pb={3}>
            {!err ?
                (loader ? <MinLoader /> :
                    <Stack spacing={1} useFlexGap flexWrap="wrap" style={{ justifyContent: "left", padding: "0px 20px" }}>
                        <Stack direction="row" spacing={3} alignItems="center">
                            {postData.priority && <StarOutlinedIcon sx={{ color: "#ffab2c" }} />}
                            <MDTypography component="h2" style={{ fontSize: "2em", fontWeight: "500", marginTop: "0.3em" }}>{postData?.title}</MDTypography>
                        </Stack>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" style={{ justifyContent: "left", padding: "20px 0px" }}>
                            <MDAvatar style={{ minWidth: "2em", minHeight: "2em" }} src={postData?.userDettails?.avatar} alt={postData.firstName + " " + postData.lastName} shadow="md" />
                            <Stack justifyContent="center">
                                <MDTypography component="p" style={{ fontSize: "0.7em", fontWeight: "500" }}>{postData?.userDettails?.firstName + " " + postData?.userDettails?.lastName}</MDTypography>
                                <MDTypography component="p" style={{ fontSize: "0.57em", fontWeight: "300" }}>{postData?.createDate !== undefined && formatDistanceToNow(new Date(postData?.createDate), { locale: it }) + " fa"}</MDTypography>
                            </Stack>
                        </Stack>
                        {attacheds?.length > 0 && <Stack>
                            <ImageList sx={{ width: 500, height: 180 }} cols={3} rowHeight={164}>
                                {attacheds.map((item, index) => (
                                    <ImageListItem key={index}>
                                        <img
                                            src={import.meta.env.VITE_API_COMMUNITY + item}
                                            srcSet={import.meta.env.VITE_API_COMMUNITY + item}
                                            alt={item.name}
                                            loading="lazy"
                                            style={{ cursor: "pointer", borderRadius: 8 }}
                                            onClick={() => {
                                                setSelectedImage(_ => { return import.meta.env.VITE_API_COMMUNITY + item });
                                                handleImageOpen();
                                            }}
                                        />
                                    </ImageListItem>
                                ))
                                }
                            </ImageList>
                        </Stack>}
                        <p style={{ color: `${darkMode ? palette.grey[500] : palette.grey[700]}`,
                        fontSize: "0.7em", fontWeight: "300", marginTop: "1rem", maxWidth: "60em" }} 
                        dangerouslySetInnerHTML={{ __html: postData?.body }}></p>
                        
                        <Stack direction="row" sx={{ marginTop: "5em" }}>
                            <MDButton onClick={checkifAlreadyLiked ? RemoveLike : AddLike} 
                            color={darkMode ? "primary" : 'secondary'}
                            variant={checkifAlreadyLiked ? "contained" : "outlined"}
                            size="medium" startIcon={<ThumbUpIcon />}>
                                {like.length}
                            </MDButton>

                            <Button sx={{ color: "#bbb" }} size="medium" startIcon={<FlagIcon />}>
                                Segnala questo Topic
                            </Button>
                        </Stack>
                        
                        <Stack direction="row" spacing={3} sx={{ marginTop: "4em", marginBottom: "20px", alignItems: "center",
                            borderBottom: `1px solid ${darkMode ? palette.grey[700] : palette.grey[500]}`, paddingBottom: "25px" }}>
                            <MDTypography component="p" style={{ fontSize: "0.86rem", fontWeight: "500" }}>{comments?.length + " Risposte"}</MDTypography>
                            <MDButton onClick={() => setAddCommentPannel(() => { return !addCommentPannel })} 
                            color={darkMode ? "primary" : 'secondary'}
                            variant={addCommentPannel ? "contained" : "outlined"}
                            size="medium" startIcon={<AddCommentIcon />}>
                                Aggiungi un commento
                            </MDButton>
                        </Stack>


                        {addCommentPannel && <Stack id='addComment'>
                                <Stack direction="row" spacing={2} sx={{ maxWidth: "44em" }}>
                                    <MDAvatar style={{ minWidth: "1em", minHeight: "1em" }} src={userContext?.details?.imageProfile} alt={userContext?.details?.firstName + " " + userContext?.details?.lastName} shadow="md" />
                                    <Stack direction="row" sx={{ border: "1px solid #ccc", borderRadius: "10px", width: "100%" }}>
                                        <InputBase
                                            sx={{ ml: 1, fontSize: "0.9rem", maxWidth: "45em", width: "100%", 
                                                color: `${darkMode ? palette.grey[300] : palette.grey[800]}` }}
                                            placeholder="Inserisci un tuo commento"
                                            inputProps={{ 'aria-label': 'Inserisci un tuo commento' }}
                                            value={commentBodyToSend}
                                            onChange={e => { setCommentBodyToSend(_ => { return e.target.value }) }}
                                        />
                                        {/*<IconButton aria-label="TextFormatIcon">
                                            <TextFormatIcon />
                                        </IconButton>
                                        <IconButton aria-label="SentimentSatisfiedAltIcon">
                                            <SentimentSatisfiedAltIcon />
                                        </IconButton>
                                        <IconButton aria-label="AttachFileIcon">
                                            <AttachFileIcon />
                                        </IconButton>*/}
                                        <IconButton onClick={() => { AddComment(postData._id); setCommentBodyToSend(_ => { return "" }); }} 
                                        aria-label="sendPost"
                                        variant="outlined"
                                        color="secondary"
                                        style={{marginLeft: "auto", marginRight: 8}}>
                                            {icon_send({width: 25, height: 25, color: `${darkMode ? palette.grey[300] : palette.grey[700]}`,})}
                                        </IconButton>
                                    </Stack>
                                </Stack>
                        </Stack> }

                        {(comments && (comments || []).length > 0) && <Stack spacing={1} sx={{ marginTop: "1.1em" }}>
                            {comments?.map((data, index) => {
                                return <CommentItemTopic
                                    key={index}
                                    index={index}
                                    _id={data._id}
                                    firstName={data.firstName}
                                    lastName={data.lastName}
                                    username={data.username}
                                    avatar={data.avatar}
                                    body={data.body}
                                    postedDate={data.postedDate}
                                    priority={data.priority}
                                    deleteComment={RemoveComment}
                                />
                            })}
                        </Stack>}
                        {openImage}
                    </Stack>
                )
                : <EmojiError />
            }
        </MDBox>
    </DashboardLayout>
}
export default TopicItem;