import React from 'react';
import { SendLogs } from "../logs/index.js";
import { RemoveCookie } from 'utils/cookie';
import { enqueueSnackbar } from "components/MessageBox";
import { UserState } from 'types/UserContext';
import { ChangeRoleAPI } from 'examples/Sidenav/footer/multiRole/fetchData/changeRole';
import { setAuthToken } from 'utils/auth/authToken';
import { broadcastLogout, clearSession, persistSessionSnapshot, readRememberMePreference } from '@nex/shared-platform';

interface LogoutLogicProps {
    userContext: any | null;
    setUserContext: React.Dispatch<React.SetStateAction<any | null>>;
    abortController?: any | null;
    type?: string;
}

type ChangeRoleFuncProps = {
    userContext: any | null;
    setUserContext: React.Dispatch<React.SetStateAction<any | null>>;
    abortController?: any | null;
    role_: string;
    loadStatus: { [key: string]: boolean };
    ChangeLoadStatus?: any;
};

export function LogoutLogic({ userContext, setUserContext }: LogoutLogicProps) {
    SendLogs(userContext.token, `Log-out`, window.location.href.toString());

    setUserContext((_: any) => {
        RemoveSessions();
        return null;
    });

    broadcastLogout();
}

export function RemoveSessions() {
    clearSession();
    RemoveCookie({ name: "rsa" });
    RemoveCookie({ name: "aes" });
    RemoveCookie({ name: "vi" });
};

export function ChangeSessionRole({ userContext, setUserContext, abortController, role_, loadStatus, ChangeLoadStatus }: ChangeRoleFuncProps) {
    if (!userContext || !userContext.details) return;
    if (!role_) {
        enqueueSnackbar("Il ruolo selezionato non sembra essere valido.", {
            title: 'Ops..',
            type: 'error',
        });
        return;
    }
    if (!userContext.details.multiRuolo || userContext.details.multiRuolo.length === 0) {
        enqueueSnackbar("Nessun ruolo disponibile per la selezione.", {
            title: 'Attenzione',
            type: 'info',
        });
        return;
    }
    if (role_ === userContext.details.ruolo) {
        enqueueSnackbar("Il ruolo selezionato è già attivo.", {
            title: 'Attenzione',
            type: 'info',
        });
        return;
    }
    if (loadStatus && loadStatus.new_role) {
        enqueueSnackbar("Cambio ruolo già in corso...", {
            title: 'Attendere',
            type: 'info',
        });
        return;
    }

    if (ChangeLoadStatus) {
        ChangeLoadStatus({ from: 'new_role', bool: true });
    }

    function HandleComplete(props: { newToken: string, ruolo: string; descrizione: string }) {
        setUserContext((prev: UserState | null) => {
            if (!prev) return null;
            if (!prev.details) return prev;
            const nextState: UserState = {
                ...prev,
                token: props.newToken,
                details: {
                    ...prev.details,
                    ruolo: props.ruolo,
                    descrizioneRuolo: props.descrizione,
                }
            };

            persistSessionSnapshot({
                token: props.newToken,
                details: nextState.details,
                issuedAt: Date.now(),
            }, {
                rememberMe: readRememberMePreference(),
            });

            return nextState;
        });

        setAuthToken(props.newToken);
        if (ChangeLoadStatus) {
            ChangeLoadStatus({ from: 'new_role', bool: false });
        }
    }

    function HandleError(errorMessage: string) {
        console.error("ChangeRoleAPI error:", errorMessage);
        enqueueSnackbar(errorMessage, {
            title: 'Errore',
            type: 'error',
        });
        ChangeLoadStatus({ from: 'new_role', bool: false });
    }

    ChangeRoleAPI({ role: role_, abortController, HandleComplete, HandleError });
};
