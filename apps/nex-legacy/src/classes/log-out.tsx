import React from 'react';
import { SendLogs } from "../logs/index.js";
import { RemoveCookie } from 'utils/cookie';
import { enqueueSnackbar } from "components/MessageBox";
import { UserState } from 'types/UserContext';
import { ChangeGroupContextAPI, GroupContextOption } from 'examples/Sidenav/footer/multiRole/fetchData/changeGroupContext';
import { setAuthToken } from 'utils/auth/authToken';
import { broadcastLogout, clearSession, persistSessionSnapshot, readRememberMePreference } from '@nex/shared-platform';

interface LogoutLogicProps {
    userContext: any | null;
    setUserContext: React.Dispatch<React.SetStateAction<any | null>>;
    abortController?: any | null;
    type?: string;
}



type ChangeGroupContextFuncProps = {
    userContext: any | null;
    setUserContext: React.Dispatch<React.SetStateAction<any | null>>;
    abortController?: any | null;
    groupId: string;
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

export function ChangeSessionGroupContext({ userContext, setUserContext, abortController, groupId, loadStatus, ChangeLoadStatus }: ChangeGroupContextFuncProps) {
    if (!userContext || !userContext.details) return;
    if (!groupId) {
        enqueueSnackbar("Il team selezionato non sembra essere valido.", { title: 'Ops..', type: 'error' });
        return;
    }

    const currentActiveGroupId = userContext.details?.authz?.activeGroupId;
    if (groupId === currentActiveGroupId) {
        enqueueSnackbar("Il team selezionato è già attivo.", { title: 'Attenzione', type: 'info' });
        return;
    }

    if (loadStatus && loadStatus.new_group_context) {
        enqueueSnackbar("Cambio team già in corso...", { title: 'Attendere', type: 'info' });
        return;
    }

    if (ChangeLoadStatus) ChangeLoadStatus({ from: 'new_group_context', bool: true });

    function HandleComplete(payload: { newToken: string; activeGroupId: string; activeGroupKey?: string; actorTeamKey?: string; activeGroup: GroupContextOption; groupContexts: GroupContextOption[] }) {
        setUserContext((prev: UserState | null) => {
            if (!prev?.details) return prev;

            const nextState: UserState = {
                ...prev,
                token: payload.newToken,
                details: {
                    ...prev.details,
                    authz: {
                        ...(prev.details as any).authz,
                        activeGroupId: payload.activeGroupId,
                        activeGroupKey: payload.activeGroupKey ?? payload.actorTeamKey ?? payload.activeGroup?.key ?? null,
                        actorTeamKey: payload.actorTeamKey ?? payload.activeGroupKey ?? payload.activeGroup?.key ?? null,
                        activeGroup: payload.activeGroup,
                        groupContexts: payload.groupContexts,
                        version: `${(prev.details as any).authz?.version || 'authz'}:group:${payload.activeGroupId}:${Date.now()}`,
                    },
                },
            };

            persistSessionSnapshot({
                token: payload.newToken,
                details: nextState.details,
                issuedAt: Date.now(),
            }, {
                rememberMe: readRememberMePreference(),
            });

            return nextState;
        });

        setAuthToken(payload.newToken);
        enqueueSnackbar(`Team attivo: ${payload.activeGroup?.name || 'selezionato'}`, { title: 'Team aggiornato', type: 'success' });
        if (ChangeLoadStatus) ChangeLoadStatus({ from: 'new_group_context', bool: false });
    }

    function HandleError(errorMessage: string) {
        console.error("ChangeGroupContextAPI error:", errorMessage);
        enqueueSnackbar(errorMessage, { title: 'Errore', type: 'error' });
        if (ChangeLoadStatus) ChangeLoadStatus({ from: 'new_group_context', bool: false });
    }

    ChangeGroupContextAPI({ groupId, abortController, HandleComplete, HandleError });
}
