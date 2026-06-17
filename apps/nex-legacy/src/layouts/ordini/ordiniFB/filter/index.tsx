//src\layouts\ordini\ordiniFB\filter\index.tsx
import { useState, memo, useContext, useRef, useCallback, Fragment } from 'react';

import { UserContext, useUserContext } from "../../../../context/UserContext";
//import { FbUserData } from '../fetchData/fb_userData';
import { FBSendEmail } from '../fetchData/actions/fbSendEmail';


import FBFiltersVI from './FBFiltersVI';


import { SendEmail } from 'layouts/ordini/sendEmail';
import { Success } from 'components/Success';
import { icon_send } from 'config/icons';
import { CheckAdminPermissions } from 'utils/checkAdminPermissions';
import { useGeneralDataContext } from 'context/GeneralDataContext';
import { Autocomplete, TextField } from '@mui/material';
import { FDIconButton } from "@nex/fd-ui";


interface Agent {
    codici: { agente: string | null };
    nome: string;
    cognome: string;
}
interface FiltersProps {
    copyDataContext: any;
    codiceCommerciale: Agent | null;
    setCodiceCommerciale: (agent: Agent | null) => void;
    UpdateTablePrice: () => void;
    setDaysSelected: (days: string) => void;
    loadingSendFilter: boolean;
}
interface SafeUserContext {
    details: {
        ruolo: string;
        permissions: string[];
    };
}


// tp => 0 email client || tp => 1 email commerciale
function Filters({ copyDataContext, codiceCommerciale, setCodiceCommerciale, UpdateTablePrice, setDaysSelected, loadingSendFilter }: FiltersProps) {
    const { globalData } = useGeneralDataContext();

    const ctx = useContext(UserContext);
    if (!ctx) {
        throw new Error("useRetrieveUserInfo deve essere usato dentro <UserProvider>.");
    }
    const [userContext] = ctx;

    // Array numeri 1-31 per filtro giorni
    const [dataTime] = useState(Array.from({ length: 31 }, (_, i) => (i + 1).toString()));

    // Stati interni
    const [sendingEmailStatus, setSendingEmailStatus] = useState(false);
    const [operationResults, setOperationResults] = useState(false)
    const [panelSendEmail, setSendEmail] = useState(false);
    const [commentBody, setCommentBody] = useState("");
    const closePanelClean = () => {
        setCommentBody("");
        setSendEmail(false);
        setOperationResults(true);
    };
    // Abort il panding del fetch all server
    const abortController = useRef<AbortController | null>(null);
    // Controllo permessi admin
    const checkAdmin = CheckAdminPermissions({
        userRole: userContext?.details?.ruolo ?? "",
        permissions: userContext?.details?.permissions,
        panelToCheck: "fb",
        where: 0
    });


    // Callback invio email
    const SendEmailToAgent = useCallback(
        (tp: 0 | 1) => {
            setSendingEmailStatus(true);
            // Passo .current perché FBSendEmail si aspetta un AbortController, 
            // non un ref. Se current è null, passo undefined, così FetchData gestisce correttamente il controller.
            // Se non c'è un controller, ne creo uno nuovo e lo assegno a ref.current
            // In questo modo posso eventualmente abortare il fetch in un useEffect cleanup

            if (!abortController.current) abortController.current = new AbortController();

            FBSendEmail(
                userContext!,
                abortController.current,
                tp,
                copyDataContext,
                codiceCommerciale?.codici.agente ?? null,
                commentBody,
                closePanelClean,
                setSendingEmailStatus
            );


        },
        [codiceCommerciale, copyDataContext, commentBody]
    );

    // Filtro solo agenti con codice valido per evitare errori TS
    const agentsOptions: Agent[] = globalData.agents.filter(
        (agent): agent is Agent => !!agent.codici?.agente
    );


    return (
        <Fragment>
            <div className="flex flex-row items-center gap-2">
                {checkAdmin && <Fragment>
                    <Autocomplete
                        id="tags"
                        options={agentsOptions}
                        value={codiceCommerciale}
                        onChange={(_, value: any) => setCodiceCommerciale(value)}
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
                    {/* codiceCommerciale && (
                        <FDIconButton
                        onClick={() => setSendEmail(true)}
                        aria-label="sendEmail"
                        title="Invia l'email al commerciale selezionato"
                        icon={icon_email()}
                        />
                        ) */}
                    <div className="border-l border-gray-300 h-auto" />
                </Fragment>}
                <FBFiltersVI data={dataTime} setUTMTarget={setDaysSelected} minWidth='12rem' existValue='3' maxWidth='12rem' placeholder='Quanti GG a scad. Promo' type='Number' />

                <FDIconButton
                    onClick={UpdateTablePrice}
                    className="self-center"
                    icon={icon_send()}
                    disabled={loadingSendFilter}
                />
            </div>
            {panelSendEmail && (
                <SendEmail
                    codTarget={codiceCommerciale ? { nome: `${codiceCommerciale.nome} ${codiceCommerciale.cognome}`, id: undefined } : { nome: "Non selezionato" }}
                    setSendEmail={setSendEmail}
                    SendEmailToAgent={SendEmailToAgent}
                    commentBody={commentBody}
                    setCommentBody={setCommentBody}
                    sendingEmailStatus={sendingEmailStatus}
                />
            )}

            <Success success={operationResults} setSuccess={setOperationResults} />
        </Fragment>
    )
}

export default memo(Filters);