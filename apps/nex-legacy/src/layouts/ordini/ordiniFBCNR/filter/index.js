import { useState, useEffect, memo, useContext, useRef, useCallback, Fragment } from 'react';

import { UserContext } from "../../../../context/UserContext";
import { FBSendEmail } from '../fetchData/actions/fbSendEmail';

import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';

import FBFiltersVI from './FBFiltersVI';
import Divider from "@mui/material/Divider";

import LoadingButton from '@mui/lab/LoadingButton';

import { SendEmail } from 'layouts/ordini/sendEmail';
import { Success } from 'components/Success';
import { icon_update } from 'config/icons';
import { icon_send } from 'config/icons';
import { CheckAdminPermissions } from 'utils/checkAdminPermissions';
import { useGeneralDataContext } from 'context/GeneralDataContext';
import { Autocomplete, TextField } from '@mui/material';
import { ChannelsAPI } from '../fetchData/channels';



// tp => 0 email client || tp => 1 email commerciale
function Filters(props) {
    const { globalData } = useGeneralDataContext();

    const { copyDataContext, UpdateTablePrice } = props;
    const { channelsCode, setChannelsCode, codiceCommerciale, setCodiceCommerciale, loadingSendFilter } = props;

    const [userContext, setUserContext] = useContext(UserContext);

    const [channels, setChannels] = useState([]);

    const [sendingEmailStatus, setSendingEmailStatus] = useState(false);
    const [operationResults, setOperationResults] = useState(false)
    const [panelSendEmail, setSendEmail] = useState(false);
    const [commentBody, setCommentBody] = useState("");
    const closePanelClean = () => { setCommentBody(""); setSendEmail(false); setOperationResults(true) };
    // Abort il panding del fetch all server
    const abortController = useRef(null);
    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
            abortController.current = null; // Reset after abort
        }
    };
    const checkAdmin = CheckAdminPermissions({
        userRole: userContext.details.ruolo,
        permissions: userContext.details.permissions, panelToCheck: "fb_cnr", where: 0
    });

    const ChannelsData = useCallback(() => {
        ChannelsAPI({
            abortController,
            HandleComplete: ({ response }) => {
                if(response && response.data && Array.isArray(response.data) && response.data.length > 0){
                    setChannels(response.data);
                };
            },
            HandleError: (errorMessage) => {
                console.error("Error fetching channels:", errorMessage);
            },
        });
    }, [channels])

    const SendEmailToAgent = useCallback((tp) => {
        if(userContext.details === undefined){return;}
        if(!codiceCommerciale || codiceCommerciale.codici.agente == undefined || codiceCommerciale.codici.agente === ""){return;}
        
        FBSendEmail(userContext, abortController, tp, copyDataContext, codiceCommerciale.codici.agente,
            commentBody, closePanelClean, setSendingEmailStatus)
    }, [codiceCommerciale, copyDataContext, channelsCode, commentBody])

    useEffect(() => {
        if(userContext.details === undefined){return;}
        ChannelsData();

        return () => {
            cancelRequest();
        }
    }, [userContext.details]);


    
    return (
        <Fragment>
            <Stack direction='row' gap={1}>
                {checkAdmin ? <Fragment>
                    <Autocomplete
                    id="tags"
                    options={globalData.agents}
                    value={codiceCommerciale}
                    onChange={(_, value) => setCodiceCommerciale(value)}
                    getOptionLabel={(option) => option?.codici?.agente + " - " + option?.nome + " " + option?.cognome}
                    renderInput={(params) => (
                        <TextField {...params} sx={{
                            '&.MuiFormControl-root div .MuiButtonBase-root ': {
                                fontSize: '1.1rem',
                            },
                            '&.MuiFormControl-root div .MuiInputBase-input': { fontSize: '0.8rem' },
                        }}
                            placeholder="Commerciali" />
                    )}
                    sx={{ width: 300 }}
                    />
                </Fragment> : null}

                <Divider orientation="vertical" flexItem sx={{ height: "auto" }} />
                <FBFiltersVI data={channels ?? []} setUTMTarget={setChannelsCode} minWidth='12rem' maxWidth='12rem'
                    placeholder='Canale' type='Object' valueToTake='Canale' valueToInsert='CodiceCanale' />
                <LoadingButton
                    onClick={UpdateTablePrice}
                    loading={loadingSendFilter}
                    variant="filled"
                    style={{ alignSelf: 'center' }}
                >
                    {icon_send({ width: '1.5em', height: '1.5em' })}
                </LoadingButton>
                <IconButton data-tooltip-id='general-fb-cnr-tooltip'
                    data-tooltip-content='Aggiorna la tabella'
                    aria-label="update" onClick={UpdateTablePrice}>
                    {icon_update()}</IconButton>
            </Stack>
            {panelSendEmail && <SendEmail dataComm={globalData.agents} codTarget={codiceCommerciale} setSendEmail={setSendEmail}
                SendEmailToAgent={SendEmailToAgent} commentBody={commentBody} setCommentBody={setCommentBody}
                sendingEmailStatus={sendingEmailStatus} />}
            <Success success={operationResults} setSuccess={setOperationResults} />
        </Fragment>
    )
}

export default memo(Filters);