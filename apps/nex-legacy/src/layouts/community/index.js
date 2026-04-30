import { useState, useContext, useEffect, useRef, useCallback } from "react";

//@User Details Fetched From Server
import { UserContext } from "../../context/UserContext";
import { SendLogs } from "../../logs/index.js"

//@Components
import MDBox from "components/MDBox";

//@MUI Components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import Stack from '@mui/material/Stack';

//@internal components
import Allert from "../../examples/Allert"
import MinLoader from "minLoader";
import EmojiError from "emojiError";

import PostBox from "./itemBox/postBox";
import HeaderCmty from "./headerCmty";

import NoPost from "assets/images/no-post.webp"
import MDTypography from "components/MDTypography";
import Divider from '@mui/material/Divider';

import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import DeleteImage from "assets/images/delete-concept-tiny-people.webp";


function UserManagement () {
    const [userContext , setUserContext] = useContext(UserContext);
    const [posts, setPosts] = useState([]);
    const [copyData, setCopyData] = useState(null);

    const [allert, setAllert] = useState(false);
    const [indexPostClicked, setIndexPostClicked] = useState();

    const [err, setErr] = useState(false);
    //stato di caricamento dei dati
    const [loader, setLoader] = useState(false);    
    // Abort il panding del fetch all server
    const abortController = useRef(null);

    const cancelRequest = () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };


    useEffect(()=>{
        if(!userContext.details){ return };
        console.log(userContext)
        updateAllPost();

        return () => {
            cancelRequest();
        }
    },[userContext])

    const updateAllPost = () => {
        abortController.current = new AbortController();
        
        setLoader(true)
        fetch(import.meta.env.VITE_API_COMMUNITY + "community/posts/read/allposts", {
            signal: abortController.current.signal,
            method: "GET",
            headers: {"Content-Type": "application/JSON"},
        }).then(response => {
            if (!response.ok) {
                throw new Error(response);
            }
            return response.json();
        })
        .then(data => {
            setPosts(()=> data);
            setCopyData(() => data);
            setLoader(false)
        }).catch(err => {
            setErr(true);
        })

        return cancelRequest;
    }

    /**
     * @param key valore in input Key del campo da cui proviene l'oggetto.
     * @param status valore in input dello stato del sort se è [0, 1, 2].
     */
    const SortBy = useCallback((key, status) => {
        setPosts(prev => {
        let nextPostsContext = [...prev];

        switch(key){
            case "like":
                //sort il prezzo più basso o piu alto in base a cosa dice lo status se è true o false
                status === 0 ? 
                    nextPostsContext.sort((a, b) => parseInt(a.like.length) > parseInt(b.like.length) ? -1 : 1)
                        : status === 1 ?
                            nextPostsContext.sort((a, b) => parseInt(a.like.length) > parseInt(b.like.length) ? 1 : -1)
                :
                  nextPostsContext = [...copyData];
                break;
            case 'priority':
                //sort gli elementi con priorità true o false
                console.log(nextPostsContext)
                status === 0 ? 
                    nextPostsContext.sort((a, b) => (a.priority === b.priority ? 0 : a.priority ? -1 : 1))
                        : status === 1 ?
                            nextPostsContext.sort((a, b) => (a.priority === b.priority ? 0 : a.priority ? 1 : -1))
                :
                  nextPostsContext = [...copyData];
                break;
            case 'comments':
                //sort dei post con numero di commenti minori o inferiori
                status === 0 ? 
                    nextPostsContext.sort((a, b) => parseInt(a.comments.length) > parseInt(b.comments.length) ? -1 : 1)
                        : status === 1 ?
                            nextPostsContext.sort((a, b) => parseInt(a.comments.length) > parseInt(b.comments.length) ? 1 : -1)
                :
                    nextPostsContext = [...copyData];
            break;
        }
        
            return nextPostsContext;
        });

    }, [posts, copyData]);

    const AddLike = (id, post_creator) => {
        const post_dettails = {
            id_post: id,
            post_creator: post_creator
        }

        fetch(import.meta.env.VITE_API_COMMUNITY + "community/posts/create/like", {
            method: "POST",
            body: JSON.stringify({
                postId: id,
                username: userContext?.details?.username,
                firstName: userContext?.details?.firstName,
                lastName: userContext?.details?.lastName,
                avatar: userContext?.details?.imageProfile,
            }),
            headers: {"Content-Type": "application/JSON"},
      }).then(response => {
            if (!response.ok) {
                throw new Error(response);
            }
            return response.json();
      }).then(_ => {
            //Invia il log dell'Add Like al servizio dedicato
            SendLogs(userContext.token, "Add Like", window.location.href.toString(), "", "", post_dettails);
      })
    }

    const RemoveLike = (id, post_creator) => {
        const post_dettails = {
            id_post: id,
            post_creator: post_creator
        }

        fetch(import.meta.env.VITE_API_COMMUNITY + "community/posts/delete/like", {
            method: "POST",
            body: JSON.stringify({
                postId: id,
                username: userContext?.details?.username,
            }),
            headers: {"Content-Type": "application/JSON"},
        }).then(response => {
            if (!response.ok) {
                throw new Error(response);
            }
            return response.json();
        }).then(_ => {
          //Invia il log dell'Remove Like al servizio dedicato
          SendLogs(userContext.token, "Remove Like", window.location.href.toString(), "", "", post_dettails);
        })
    }

    const StallDelete = (index, post_id, post_creator, post_title, post_body) => {
        setAllert(() => { return true });
        setIndexPostClicked(() => { return { index: index, post_id: post_id, post_creator: post_creator, post_title: post_title, post_body: post_body} });
    }

    const DeletePost = () => {
        const post_dettails = {
            id_post: indexPostClicked.post_id,
            post_creator: indexPostClicked.post_creator,
            post_title: indexPostClicked.post_title,
            post_body: indexPostClicked.post_body,
        }

        fetch(import.meta.env.VITE_API_COMMUNITY + "community/posts/delete/post", {
            method: "POST",
            body: JSON.stringify({
                postId: indexPostClicked.post_id,
                userRole: userContext?.details?.role,
                username: userContext?.details?.username,
                userId: userContext?.details._id,
            }),
            headers: {"Content-Type": "application/JSON"},
        }).then(response => {
            if (!response.ok) {
                throw new Error(response);
            }
            return response.json();
        }).then(data => {
            if(data.status !== undefined && data.status === "Ok"){
                //Invia il log dell'Remove Post al servizio dedicato
                SendLogs(userContext.token, "Remove Post", window.location.href.toString(), "", "", post_dettails);
                
                setPosts(prev => {
                    return prev.filter((_, i) => i !== indexPostClicked.index);
                })
            }
        })
        setAllert(() => { return false })
    }


    return <DashboardLayout>
        <MDBox pt={6} pb={3} translate="no">
            {allert && <Allert title="Sei Sicuro?" body="Una volta cancellato il post, ne tu ne nessun altro potrà rigenerare il post che hai eliminato, ti raccomandiamo di pensarci un po di piu." 
                image={DeleteImage} 
                close={setAllert} 
                action={DeletePost}
                icon={<DeleteOutlineOutlinedIcon />} 
            />}
            <HeaderCmty 
                updateAllPost={updateAllPost} 
                SortBy={SortBy}
                loader={loader} 
            />
            <Divider component="div" variant="inset" style={{marginBottom: "2em"}}/>
                {!err ?
                    (loader ? <MinLoader /> : 
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" style={{justifyContent: "center"}}>
                            {posts.length !== 0 ? posts.map((post, index) => {
                                return <PostBox
                                  key={post._id}
                                  index={index}
                                  _id={post._id}
                                  userDettails={post.userDettails}
                                  type={post.type} 
                                  title={post.title}
                                  body={post.body}
                                  like={post.like}
                                  url={post.url}
                                  addLike={AddLike}
                                  removeLike={RemoveLike}
                                  deletePost={DeletePost}
                                  stallDelete={StallDelete}
                                  comments={post.comments}
                                  createDate={post.createDate}
                                  priority={post.priority !== undefined ? post.priority : false}
                                />
                            })
                            :
                                <Stack>
                                    <img src={NoPost} alt="No Post yet" style={{opacity: "0.36"}}/>
                                    <MDTypography component="h3" style={{fontWeight:"bold", textAlign:"center", marginTop:"0.3em", opacity: 0.67}}>Per il momento non ci sono Post, ripassa piu tardi!</MDTypography>
                                </Stack>
                            }
                        </Stack>
                    ) 
                    : <EmojiError />
                }
        </MDBox>
    </DashboardLayout>
}
export default UserManagement;