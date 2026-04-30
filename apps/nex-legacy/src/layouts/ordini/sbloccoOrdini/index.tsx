import React, { useEffect } from 'react';
import { UsersRequests } from './requests';
import { useUserContext } from 'context/UserContext';

import { Tooltip } from 'react-tooltip';

import { GeneralError } from 'components/NoData/generalError';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import ErrorIMG from 'assets/images/5203299_trasparent.webp';
import { CheckAdminPermissions } from 'utils/checkAdminPermissions';
import { ManagementsRequests } from './management';

//tour
import { useSectionTour } from 'tour/useSectionTour';
import { Role } from 'tour/types';
import { useGeneralDataContext } from 'context/GeneralDataContext';

type TourAction = (arg1?: any, arg2?: (to: number) => void, arg3?: boolean) => void;
type ActionsMap = Record<number, TourAction>;

const SbloccoOrdini: React.FC<{}> = () => {
    const [userContext] = useUserContext();
    //Errore Fetch iniziale (Emoji Error)
    const [err, setErr] = React.useState<boolean>(false);

    //tour
    const { setOpenChat } = useGeneralDataContext();
    const [overviewOpen, setOverviewOpen] = React.useState(false);
    const [commentsOpen, setCommentsOpen] = React.useState(false);
    const [requestPanelOpen, setRequestPanelOpen] = React.useState(false);

    // API esposta da UsersRequests per il commerciale
    const commTourApiRef = React.useRef<{
        restoreLastDetail: ({ single, group, both }: { single?: boolean; group?: boolean; both?: boolean }) => void;
    } | null>(null);

    const CheckAdminDev = userContext?.details
        ? CheckAdminPermissions({
            userRole: userContext.details.ruolo,
            rolesToCheck: [0, 1, 4],
            permissions: userContext.details.permissions,
            panelToCheck: 'sblocco_ordini',
            where: 0,
        })
        : false;

    const openComments = () => setCommentsOpen(true);
    const closeComments = () => setCommentsOpen(false);
    const openRequestPanel = () => setRequestPanelOpen(true);
    const closeRequestPanel = () => setRequestPanelOpen(false);

    //const [isGroupedItems, setIsGroupedItems] = React.useState<boolean>(false);
    const isGroupedItems = React.useRef<boolean>(false);
    const searchForSingleItem = React.useRef<boolean>(false);

    //tour
    // ref per la funzione di skip del tour (esposta dal TourProvider)
    const commTourSkipRef = React.useRef<((to: number) => void) | null>(null);
    const actionsShareTour: Record<number, (arg1?: any, arg2?: (to: number) => void, arg3?: boolean) => void> = {
        4: () => { setOverviewOpen(false) },
        5: () => { setOverviewOpen(true) },
        6: () => { setOverviewOpen(true); },
        11: () => { setOverviewOpen(true); },
        13: () => { setOverviewOpen(true); },
        14: (_, skip, reqFromBack) => {
            if (!isGroupedItems.current && typeof skip === 'function' && searchForSingleItem.current) {
                return skip(reqFromBack ? 13 : 15);
            };
        },
        // 19: () => { setOverviewOpen(true); setOpenChat(false); },
        // 20: () => { setOverviewOpen(false); setOpenChat(false); },
        // 21: () => { setOverviewOpen(true); setOpenChat(true); },
        // 22: () => { setOverviewOpen(false); setOpenChat(false); },
    };
    const actionsAgentTour: Record<number, (arg1?: any, arg2?: (to: number) => void, arg3?: boolean) => void> = {
        3: (_, skip) => { if (typeof skip === 'function') { commTourSkipRef.current = skip; } },
        8: () => { setRequestPanelOpen(true); },
        6: () => { setRequestPanelOpen(false); },
        12: (_, skip, reqFromBack) => {
            if (!isGroupedItems.current && typeof skip === 'function') { return skip(reqFromBack ? 11 : 13); };
            if (reqFromBack) {
                commTourApiRef.current?.restoreLastDetail({ group: true });
            };
        },
        13: () => { !isGroupedItems.current && commTourApiRef.current?.restoreLastDetail({ single: true }); },
        14: () => {
            commTourApiRef.current?.restoreLastDetail({ single: true });
        },
        15: (_) => {
            setTimeout(() => commTourApiRef.current?.restoreLastDetail(searchForSingleItem.current ? { single: true } : { group: true }), 0);
        },
        17: closeComments,
        18: openComments,
        19: () => { openComments(); setOverviewOpen(true); setOpenChat(false); },
        20: () => { closeComments(); setOverviewOpen(false); setOpenChat(false); },
        21: () => { setOverviewOpen(true); setOpenChat(true); },
        22: () => { setOverviewOpen(false); setOpenChat(false); },
    };
    const actionsAdminTour: Record<number, (arg1?: any, arg2?: (to: number) => void, arg3?: boolean) => void> = {
        7: () => { closeComments(); setOverviewOpen(true) },
        8: () => { openComments(); setOverviewOpen(true); },
        9: () => { openComments(); setOverviewOpen(true); },
        10: () => { closeComments(); setOverviewOpen(true); setRequestPanelOpen(false) },
        12: () => { setOverviewOpen(true); setRequestPanelOpen(true); },
        16: (_, skip, reqFromBack) => {
            if (!isGroupedItems.current && typeof skip === 'function') { return skip(reqFromBack ? 15 : 17); };
            if (reqFromBack) {
                commTourApiRef.current?.restoreLastDetail({ group: true });
            };
        },
        // 18: (_, skip, reqFromBack) => { if (reqFromBack) { setOverviewOpen(true); setOpenChat(false); } },
        18: () => { console.log('STEP 18 admin'); setOverviewOpen(true); setOpenChat(false); },
        19: () => { console.log('STEP 19 admin'); setOverviewOpen(false); setOpenChat(false); },
        20: () => { setOverviewOpen(true); setOpenChat(true); },
        21: () => { setOverviewOpen(false); setOpenChat(false); },

    };

    /**
     * Unisce N mappe di azioni.
     * - Le chiavi vengono unite.
     * - Se una chiave è presente più volte, le funzioni vengono composte
     *   e verranno eseguite tutte, in ordine di merge.
     */
    function mergeTourActions(...sources: ActionsMap[]): ActionsMap {
        const result: ActionsMap = {};

        for (const source of sources) {
            for (const [keyStr, fn] of Object.entries(source)) {
                const key = Number(keyStr);

                const existing = result[key];
                if (!existing) {
                    // Nessuna funzione ancora presente per questa chiave → la assegno direttamente
                    result[key] = fn;
                } else {
                    // Esiste già una funzione per questa chiave → compongo le due
                    result[key] = (arg1?: any, skip?: (to: number) => void, reqFromBack?: boolean) => {
                        existing(arg1, skip, reqFromBack);
                        fn(arg1, skip, reqFromBack);
                    };
                }
            }
        }

        return result;
    };

    const tour = useSectionTour({
        id: 'nex_v2_sbloccoOrdini',
        version: '2.0.0',
        user: {
            id: userContext?.details?._id ?? '',
            role: (userContext?.details?.ruolo as Role) ?? 'Tester',
        },
        keys: 'sbloccoOrdini',
        /** unisci i due oggetti e dove le proprietà hanno lo stesso nome, unisci le funzioni, in actions actionsShareTour con actionsAgentTour o con actionsAdminTour in base a checkadminDev*/
        actions: CheckAdminDev
            ? mergeTourActions(actionsShareTour, actionsAdminTour)
            : mergeTourActions(actionsShareTour, actionsAgentTour),
        /*actions: {
            3: (_, skip) => { if (!CheckAdminDev && typeof skip === 'function') { commTourSkipRef.current = skip; } },
            4: () => { setOverviewOpen(false) },
            5: () => { setOverviewOpen(true) },
            6: () => { setOverviewOpen(true); !CheckAdminDev && setRequestPanelOpen(false); },
            7: () => { CheckAdminDev && setCommentsOpen(false); CheckAdminDev && setOverviewOpen(true) },
            8: () => { CheckAdminDev && setCommentsOpen(true); CheckAdminDev && setOverviewOpen(true); !CheckAdminDev && setRequestPanelOpen(true); },
            9: () => { CheckAdminDev && setCommentsOpen(true); CheckAdminDev && setOverviewOpen(true); },
            10: () => { CheckAdminDev && setCommentsOpen(false); CheckAdminDev && setOverviewOpen(true); CheckAdminDev && setRequestPanelOpen(false) },
            11: () => { setOverviewOpen(true); },
            12: (_, skip) => {
                if (!isGroupedItems.current && typeof skip === 'function') { return skip(13); };
                CheckAdminDev && setOverviewOpen(true);
                CheckAdminDev && setRequestPanelOpen(true);
            },
            13: () => { setOverviewOpen(true); },

            //torna indietro
            14: (_, skip) => { if (!isGroupedItems.current && typeof skip === 'function') { return skip(15); }; !CheckAdminDev && commTourApiRef.current?.restoreLastDetail?.(); },
            15: () => { !CheckAdminDev && commTourApiRef.current?.restoreLastDetail?.(); },

            17: () => { !CheckAdminDev && setCommentsOpen(false); },
            18: () => { !CheckAdminDev && setCommentsOpen(true); },
            19: () => { !CheckAdminDev && setCommentsOpen(true); setOverviewOpen(true); setOpenChat(false) },
            20: () => { !CheckAdminDev && setCommentsOpen(false); setOverviewOpen(false); setOpenChat(false) },
            21: () => { setOverviewOpen(true); setOpenChat(true) },
            22: () => { setOverviewOpen(false); setOpenChat(false) },
        }*/
    });

    if (!userContext?.details) return <GeneralError img={ErrorIMG} />;


    return <DashboardLayout>
        {!err ? <React.Fragment>
            {CheckAdminDev ?
                <ManagementsRequests setErr={setErr} userContext={userContext}
                    checkAdminDev={CheckAdminDev} overviewStatus={overviewOpen}
                    setOverviewStatus={setOverviewOpen} commentsPanelStatus={commentsOpen}
                    openCommentsPanel={openComments} closeCommentsPanel={closeComments}
                    requestPanelStatus={requestPanelOpen} openRequestPanel={openRequestPanel}
                    closeRequestPanel={closeRequestPanel} isGroupedItems={isGroupedItems} />
                : <UsersRequests setErr={setErr} userContext={userContext}
                    checkAdminDev={CheckAdminDev} commentsPanelStatus={commentsOpen} openCommentsPanel={openComments} closeCommentsPanel={closeComments} requestPanelStatus={requestPanelOpen}
                    openRequestPanel={openRequestPanel} closeRequestPanel={closeRequestPanel}
                    isGroupedItems={isGroupedItems} searchForSingleItem={searchForSingleItem}
                    tourRegister={(api) => {
                        commTourApiRef.current = {
                            restoreLastDetail: api.restoreLastDetail,
                        };
                    }} onFbSearchErrorDuringTour={() => {
                        if (CheckAdminDev) return;
                        if (!tour.isOpen) return;
                        if (!commTourSkipRef.current) return;
                        commTourSkipRef.current(1);
                    }} />
            }
        </React.Fragment> : <GeneralError img={ErrorIMG} />}
        <Tooltip id="general-confg-suppliers-tooltip" place="bottom" style={{
            maxWidth: "15vw", minWidth: 150, fontSize: '0.87rem', zIndex: 9999,
            textAlign: 'center'
        }} />
    </DashboardLayout>
}

export default SbloccoOrdini; 