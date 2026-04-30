import React, { useContext } from "react";

import { UserContext } from "../../../../context/UserContext";

import { useMaterialUIController } from "context";

import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

//@mui components
import MDTypography from "components/MDTypography";
import MDAvatar from "components/MDAvatar";
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';

import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';

export default function CommentItemTopic (props) {
    const [userContext , setUserContext] = useContext(UserContext);

    const [controller, dispatch] = useMaterialUIController();
    const {
        transparentSidenav,
    } = controller;

    return (
        <Stack direction="row" width="100%" spacing={2} style={{transition: "color 500ms ease-in, padding 120ms ease-in"}} sx={!transparentSidenav && {backgroundColor:"#fff", padding:"0 10px 15px", borderRadius:"15px", maxWidth:"45em"}}>
            <MDAvatar style={{minWidth: "2em", minHeight: "2em", marginTop:"1rem"}} src={props?.avatar} alt={props.firstName + " " + props.lastName} shadow="md" />
            <Stack>
                <Stack direction="row" useFlexGap flexWrap="wrap" style={{justifyContent: "left", padding:"20px 0px 7px"}}>
                    <Stack justifyContent="center">
                        <MDTypography component="p" style={{fontSize: "0.7em", fontWeight:"500"}}>{props?.firstName + " " + props?.lastName}</MDTypography>
                        <MDTypography component="p" style={{fontSize: "0.57em", fontWeight:"300"}}>{props.postedDate !== undefined && formatDistanceToNow(new Date(props.postedDate), { locale: it }) + " fa"}</MDTypography>
                    </Stack>
                    {(userContext.details.username === props.username || userContext.details?.ruolo === "Admin" || userContext.details?.ruolo === "Dev") && <IconButton onClick={() => props.deleteComment(props.index, props._id, props.postedDate, props.body)} aria-label="delete" size="medium" sx={{alignItems: "flex-start", color:"#b32c2c"}}>
                        <DeleteOutlineOutlinedIcon />
                    </IconButton>}
                </Stack>
                <MDTypography component="p" style={{fontSize: "0.7em", fontWeight:"400", maxWidth:"60em"}}>{props?.body}</MDTypography>
            </Stack>
        </Stack>
    )
}