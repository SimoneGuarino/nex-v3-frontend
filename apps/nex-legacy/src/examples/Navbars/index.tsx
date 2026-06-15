import React, {
    FC,
    memo,
    useState,
    useEffect,
    useContext,
    useRef,
    useCallback,
    Fragment,
    MutableRefObject,
} from "react";

// Global State Hook User
import { UserContext } from "../../context/UserContext";

// UI components
import InfoMenu from "examples/infoPoupUpMenu";
import { Tooltip } from "react-tooltip";

// @mui
import Badge from "@mui/material/Badge";

// Icons
import { AiOutlineMessage, AiOutlineUser } from "react-icons/ai";
import { IoNotificationsOutline, IoLogOutOutline, IoDiamondSharp, IoSettingsOutline, IoList, IoCodeOutline, IoDownloadOutline } from "react-icons/io5";
import { BsLayoutSidebar, BsStars } from "react-icons/bs";
import { MdOutlineFiberNew } from "react-icons/md";

import defaultAvatar from "assets/images/blank-profile-picture-973460_960_720.webp";

// React context (MUI controller del tema)
import {
    useMaterialUIController,
    setTransparentNavbar,
    setMiniSidenav,
} from "context/index";

import { Chat } from "./components/chat";
import { useGeneralDataContext } from "context/GeneralDataContext";
import FDIconButton from "components/UI/buttons/FDIconButton";
import { UserInfo } from "./components/userInfo";
import { ChangeSessionGroupContext } from "classes/log-out";
import { OnlineUsers } from "examples/Navbars/components/usersOnline";
import FDButton from "components/UI/buttons/FDButton";
import { AIContext } from "context/AIContext";
import { ContextMenu } from "components/UI/menu/ContextMenu";
import { useNavigate } from "react-router-dom";
import ReleaseNotesPanel from "./components/release/index";
import clsx from "clsx";
import { useNTIFContext } from "context/NotificationContext";
import LatestRelease from "./components/release/LatestRelease";
import MDBox from "components/MDBox";
import { useLocation } from "react-router-dom";
import TourModal from "tour/components/UI/TourModal";
import { MdOutlineExplore as MdOutlineExploreRaw } from "react-icons/md";
import { clearSession, getAnchorRectFromElement, navigateToApp, toggleGlobalPanel } from "@nex/shared-platform";
import { useNexTheme } from "@nex/theme-system";
import { useAuthz } from "authz/useAuthz";
import { CAPS } from "authz/caps";

const MdOutlineExploreIcon = MdOutlineExploreRaw as React.FC<{ size?: number }>;

const MessageIcon = AiOutlineMessage as React.FC<{ size?: number }>;
const NotificationIcon = IoNotificationsOutline as React.FC<{ size?: number }>;
const SidebarIcon = BsLayoutSidebar as React.FC<{ size?: number }>;
const LogoutIcon = IoLogOutOutline as React.FC<{ size?: number }>;
const StarIcon = BsStars as React.FC<{ size?: number; className?: string }>;
const UserIcon = AiOutlineUser as React.FC<{ size?: number; className?: string }>;
const DiamondIcon = IoDiamondSharp as React.FC<{ size?: number; className?: string }>;
const SettingsIcon = IoSettingsOutline as React.FC<{ size?: number; className?: string }>;
const NewIcon = MdOutlineFiberNew as React.FC<{ size?: number; className?: string }>;
const ListIcon = IoList as React.FC<{ size?: number; className?: string }>;
const IoCodeOutlineIcon = IoCodeOutline as React.FC<{ size?: number; className?: string }>;
const IoDownloadOutlineIcon = IoDownloadOutline as React.FC<{ size?: number; className?: string }>;


/* =========================
 *       Tipi locali
 * ========================= */
interface UserDetails {
    _id: string;
    username?: string;
    nome: string;
    cognome?: string;
    fullName: string;
    system?: boolean;
    [key: string]: any;
};

interface UserContextState {
    details?: UserDetails;
    token?: string;
    [key: string]: any;
};

type UserContextType = [
    UserContextState,
    React.Dispatch<React.SetStateAction<UserContextState>>
];

interface DashboardNavbarProps {
    isMini?: boolean;
};

export interface CreateNTIF {
    user_from: string;
    user_from_details: UserDetails | Record<string, never>;
    user_target: string[] | null;
    type: string;
    modality: string;
    usersTargetStatus: string;
    desc: string;
    timerMode: boolean;
    timer?: string;
    targetRole: string;
};

interface Message {
    user: { _id: string };
    viewed: boolean;
    [key: string]: any;
};

interface MessageBlock {
    messages: Message[];
    [key: string]: any;
};

interface GeneralDataCtx {
    messagesData: MessageBlock[];
    privateMessagesData: MessageBlock[];
    overviewMessage: any;
    setOverviewMessage: (v: any) => void;
    openChat: boolean;
    setOpenChat: (v: boolean) => void;
};

//funzione che definesce se release notes è stato già mostrato la prima volta, se non lo è mostra il pannello al caricamento della
//pagina, poi imposta il cookie per non farlo più vedere
const checkReleaseNotesFirstTime = () => {
    const releaseNotesSeen = document.cookie
        .split('; ')
        .find(row => row.startsWith('releaseNotesSeen='));
    if (!releaseNotesSeen) {
        document.cookie = "releaseNotesSeen=true; path=/; max-age=" + 60 * 60 * 24 * 365; // 1 anno
        return true;
    }
    return false;
};

/** Funzione che determina se l'utente non ha ancora visto il tour guidato 
 * @true non l'ha visto 
 * @false l'ha già visto
*/
export const checkTourSeen = () => {
    const tourSeen = document.cookie
        .split('; ')
        .find(row => row.startsWith('tourSeen='));
    if (!tourSeen) {
        //document.cookie = "tourSeen=true; path=/; max-age=" + 60 * 60 * 24 * 365; // 1 anno
        return true;
    }
    return false;
};

export const SaveCookieWithAge = (name: string) => document.cookie = `${name}=true; path=/; max-age=` + 60 * 60 * 24 * 365; // 1 anno

/* =========================
 *     Componente TSX
 * ========================= */
const DashboardNavbar: FC<DashboardNavbarProps> = ({
    isMini = false,
}) => {
    const { toggleMode } = useNexTheme();
    const {
        messagesData,
        privateMessagesData,
        overviewMessage,
        setOverviewMessage,
        openChat,
        setOpenChat,
    } = (useGeneralDataContext() as unknown) as GeneralDataCtx;
    const navigate = useNavigate();

    const { hasCap } = useAuthz();

    const canUseBuyerAssistant = hasCap(CAPS.BUYER_ASSISTANT_USE);
    const canViewOnlineUsers = hasCap(CAPS.USERS_ONLINE_VIEW);

    // Data about User
    const [userContext, setUserContext] = useContext(UserContext) as unknown as UserContextType;
    const { open, setOpen, aiUnreadCount } = useContext(AIContext);

    const [NTIFdata] = useNTIFContext();

    //tour-system
    const [openTourResetModal, setOpenTourResetModal] = useState(false);
    // stato usato dal tour per bloccare la chiusura automatica del menu profilo
    const [menuAutoLock, setMenuAutoLock] = useState<boolean>(false);
    // bridge globale per permettere al TourProvider di controllare menu profilo e modale tour
    ; (window as any).__fdUI = {
        setUserMenu: (v: boolean) => setUserMenu(v),
        setTourModal: (v: boolean) => setOpenTourResetModal(v),
        setMenuAutoLock: (v: boolean) => setMenuAutoLock(v),
    };
    const location = useLocation();

    const hasTourHere =
        typeof window !== "undefined" &&
        (window as any).__fdCurrentTourPath === location.pathname &&
        typeof (window as any).__fdCurrentTourRestart === "function";


    const [controller, dispatch] = useMaterialUIController();
    const { miniSidenav, fixedNavbar } = controller;

    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";

    const chatRef = useRef<HTMLDivElement | null>(null) as MutableRefObject<HTMLDivElement | null>; // Riferimento per il menu contestuale della chat

    const [userMenu, setUserMenu] = useState<boolean>(false);
    const userMenuRef = useRef<HTMLDivElement>(null) as MutableRefObject<HTMLDivElement | null>; // Riferimento per il menu contestuale dei messaggi fissati

    // release notes panel
    const [releaseNotesMenu, setReleaseNotesMenu] = useState<boolean>(false); //stato per aprire il menu contestuale dei release notes
    const [openReleaseNotes, setOpenReleaseNotes] = useState<boolean>(false); //stato per aprire il pannello delle release notes
    const [openLatestNotes, setOpenLatestNotes] = useState<boolean>(checkReleaseNotesFirstTime()); //stato per aprire il pannello delle ultime release notes
    const [openWelcomeTour, setOpenWelcomeTour] = useState<boolean>(checkTourSeen()); //stato per aprire il pannello di benvenuto al tour guidato
    const releaseNotesRef = useRef<HTMLDivElement | null>(null) as MutableRefObject<HTMLDivElement | null>; // Riferimento per il menu contestuale dei release notes

    // Stati di caricamento generali
    const [loadStatus, setLoadStatus] = React.useState<{ [key: string]: any }>({
        new_role: false, // Stato di caricamento per i messaggi
    });

    // Funzione per cambiare lo stato di caricamento
    // 'from' è il tipo di caricamento, 'bool' è il nuovo stato
    const ChangeLoadStatus = ({ from, bool }: { from: string, bool: boolean }) => {
        setLoadStatus((prev) => ({ ...prev, [from]: bool !== undefined ? bool : !prev[from] }))
    };

    // Abort il pending del fetch al server (passato giù ai figli)
    const abortController = useRef<AbortController | null>(null);

    // Gestione trasparenza navbar con scroll (throttled via rAF)
    useEffect(() => {
        let ticking = false;
        const handleTransparentNavbar = () => {
            const run = () => {
                setTransparentNavbar(
                    dispatch,
                    (fixedNavbar && window.scrollY === 0) || !fixedNavbar
                );
                ticking = false;
            };
            if (!ticking) {
                ticking = true;
                window.requestAnimationFrame(run);
            }
        };

        window.addEventListener("scroll", handleTransparentNavbar, { passive: true });
        handleTransparentNavbar();

        return () => window.removeEventListener("scroll", handleTransparentNavbar);
    }, [dispatch, fixedNavbar]);

    // per essere chiusa il sideNav deve essere settato su True
    const handleMiniSidenav = useCallback(
        () => setMiniSidenav(dispatch, !miniSidenav),
        [dispatch, miniSidenav]
    );

    const handleOpenChat = (event: React.MouseEvent<HTMLElement>) => { setOpenChat(true); };
    const handleCloseChat = useCallback(() => {
        setOpenChat(false);
        setOverviewMessage(null);
    }, [setOpenChat, setOverviewMessage]);

    const [newMessageCount, setNewMessageCount] = useState<number>(0);


    useEffect(() => {
        const uc = userContext;

        const calculateUnseenMessages = (data: MessageBlock[]) =>
            data.reduce((total, block) => {
                const unseen = (block.messages || []).filter(
                    (message) => message.user?._id !== uc?.details?._id && message.viewed === false
                );
                return total + unseen.length;
            }, 0);

        const m1 = calculateUnseenMessages(messagesData || []);
        const m2 = calculateUnseenMessages(privateMessagesData || []);
        setNewMessageCount(m1 + m2);
    }, [userContext, messagesData, privateMessagesData, overviewMessage]);

    /*********************************************************************************
   * Logout Logic => Close the session by deleate Tokens */
    const logoutHandler = React.useCallback(() => {
        clearSession();
        return navigateToApp("login");
    }, [userContext, abortController]);


    const groupContexts = Array.isArray(userContext?.details?.authz?.groupContexts)
        ? userContext.details.authz.groupContexts
        : [];
    const activeGroupId = userContext?.details?.authz?.activeGroupId ?? null;

    // ----------------------------------------
    // CONTEXT USER MENU
    // ----------------------------------------
    const contextMenuUSER = [
        {
            title: '',
            className: '!p-0',
            icon: <div className="w-60 h-25 flex relative mb-4">
                <MDBox
                    position="relative"
                    className="h-full w-full absolute -left-1 -top-1"
                    sx={{
                        overflow: "hidden",
                        background: userContext.details?.immagini?.cover
                            ? `url(${`${import.meta.env.VITE_API_USERS}${userContext?.details?.immagini?.cover}`}) center/cover no-repeat`
                            : "radial-gradient(1000px 400px at -10% -20%, rgba(169, 85, 247, 0.52), transparent 60%), radial-gradient(1000px 450px at 110% -15%, rgba(59, 131, 246, 0.59), transparent 60%), #0d0e124d",
                    }}
                >
                    <MDBox
                        sx={{
                            position: "absolute", inset: 0,
                            background: "linear-gradient(to bottom, rgba(0,0,0,.25), rgba(0,0,0,.35))",
                        }}
                    />
                </MDBox>
                <div className="w-full self-end justify-items-center absolute -bottom-4">
                    <div className="rounded-full w-14 h-14 overflow-hidden">
                        <img src={(userContext && userContext?.details && userContext?.details?.immagini?.avatar) ?
                            `${import.meta.env.VITE_API_USERS}${userContext?.details.immagini.avatar}` : defaultAvatar} />
                    </div>
                </div>
            </div>,
            action: false
        },
        {
            title: 'Profilo',
            icon: <UserIcon size={20} />,
            onClick: () => navigate('/profile'),
        },
        {
            title: 'Cambia team',
            icon: <DiamondIcon size={20} />,
            hide: groupContexts.length <= 1,
            childrenMenu: [
                {
                    component: (
                        <div className="flex max-w-72 flex-col items-start gap-2">
                            <div className="px-2 pb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                                Gruppo operativo attivo
                            </div>
                            {groupContexts.map((group: { _id: string; name?: string; key?: string; description?: string }) => {
                                const active = activeGroupId === group._id;
                                return (
                                    <FDButton
                                        key={group._id}
                                        variant="ghost"
                                        color="primary"
                                        icon={<UserIcon size={16} />}
                                        className={
                                            `${active ? "!bg-blue-600 hover:!bg-blue-700 "
                                                : "hover:!bg-[#2e2e2e] focus:!bg-[#2e2e2e] focus:!outline-none"} justify-start w-full !px-3 !py-2`
                                        }
                                        onClick={() => ChangeSessionGroupContext({ userContext, setUserContext, abortController, groupId: group._id, loadStatus, ChangeLoadStatus })}
                                    >
                                        <span className="flex min-w-0 flex-col items-start text-left">
                                            <span className="max-w-56 truncate text-sm">{group.name || group.key || group._id}</span>
                                            {group.description ? <span className="max-w-56 truncate text-[11px] text-neutral-400">{group.description}</span> : null}
                                        </span>
                                    </FDButton>
                                );
                            })}
                        </div>
                    )
                }
            ]
        },
        //tour
        {
            title: "Avvia il Tour",
            icon: <MdOutlineExploreIcon size={20} />,
            className: "tour-menu-start",
            onClick: () => setOpenTourResetModal(true),
        },
        {
            title: 'Tema',
            icon: <SettingsIcon size={20} />,
            childrenMenu: [{
                component: (
                    <div className="flex items-start gap-2">
                        <button
                            type="button"
                            onClick={() => toggleMode("light")}
                            className={clsx(
                                `w-${5} h-${5} rounded-full flex-shrink-0`,
                                "transition-transform duration-200 hover:scale-110 cursor-pointer",
                                "bg-neutral-200",
                                !darkMode && "ring-2 ring-offset-2 ring-violet-500"
                            )}
                        />
                        <button
                            type="button"
                            onClick={() => toggleMode("dark")}
                            className={clsx(
                                `w-${5} h-${5} rounded-full flex-shrink-0`,
                                "transition-transform duration-200 hover:scale-110 cursor-pointer",
                                "bg-neutral-700",
                                darkMode && "ring-2 ring-offset-2 ring-violet-500"
                            )}
                        />
                    </div>
                )
            }]
        },
        //
        {
            title: 'Esci',
            icon: <LogoutIcon size={20} />,
            onClick: logoutHandler,
        }
    ];

    // ----------------------------------------
    // CONTEXT RELEASE NOTES MENU
    // ----------------------------------------
    //download masterplan e log anomalie
    const contextMenuReleaseNotes = [
        {
            title: 'Lista dei Rilasci',
            icon: <ListIcon size={20} />,
            onClick: () => setOpenReleaseNotes(true),
        },
        {
            title: 'Ultimo Rilascio',
            icon: <IoCodeOutlineIcon size={20} />,
            onClick: () => setOpenLatestNotes(true),
        },
        {
            title: 'Scarica il Masterplan',
            icon: <IoDownloadOutlineIcon size={20} />,
            onClick: () => {
                window.open('/files/MOD_Masterplan_EXT.xlsx?t=' + Date.now(), '_blank');
                setReleaseNotesMenu(false);
            },
        },
        {
            title: 'Scarica il Log Anomalie',
            icon: <IoDownloadOutlineIcon size={20} />,
            onClick: () => {
                window.open('/files/LOG_Anomalie_EXT.xlsx?t=' + Date.now(), '_blank');
                setReleaseNotesMenu(false);
            },
        }
    ];


    return (
        <Fragment>
            <header
                className={`sticky w-full top-0 py-2 z-1 flex justify-between items-center pl-4
                    border-b border-gray-200 dark:bg-stone-900 min-h-[4rem]
                    bg-white dark:border-stone-800 overflow-hidden
                    ${miniSidenav ? "xl:pl-[7rem]" : "xl:pl-[19rem]"} transition-padding duration-200`}
                translate="no"
            >
                <div className="flex items-center gap-2">
                    {/*---------------AI*/}
                    {canUseBuyerAssistant && (
                        <div className="inline-flex gradient-border-animated rounded-full overflow-hidden p-[3px]">
                            <FDButton
                                variant="ghost"
                                className="bg-white dark:bg-neutral-800 text-black dark:text-white !rounded-full relative z-10 px-4 py-2"
                                onClick={() => setOpen(!open)}
                            >
                                <StarIcon size={20} className="mr-1 text-black dark:text-white" />
                                <span className="text-lg font-semibold">AI</span>
                                <Badge
                                    badgeContent={aiUnreadCount}
                                    color="error"
                                    max={999}
                                    overlap="rectangular"
                                    className="left-2"
                                >
                                </Badge>
                            </FDButton>
                        </div>
                    )}
                    
                    {window.innerWidth > 1280 && <OnlineUsers miniSidenav={miniSidenav} canViewOnlineUsers={canViewOnlineUsers} />}
                </div>

                {!isMini && (
                    <div className="flex justify-end items-center" translate="no">
                        {window.innerWidth < 1280 && <FDIconButton
                            icon={<SidebarIcon size={20} />}
                            variant="text"
                            dataTooltipId="btn-sidenav-icon-tooltip"
                            dataTooltipContent={`${miniSidenav ? "apri" : "chiudi"} barra di navigazione`}
                            onClick={handleMiniSidenav}
                            className="h-fit"
                        />}
                        <div ref={releaseNotesRef}>
                            <FDIconButton
                                size="small"
                                icon={<NewIcon size={30} />}
                                variant="text"
                                dataTooltipId="btn-sidenav-icon-tooltip"
                                dataTooltipContent="Release notes"
                                onClick={() => setReleaseNotesMenu(true)}
                                className="h-fit"
                            />
                        </div>

                        <div ref={chatRef}>
                            <FDIconButton
                                icon={<Badge badgeContent={newMessageCount} color="error" max={999}><MessageIcon size={22} /></Badge>}
                                variant="text"
                                dataTooltipId="btn-sidenav-icon-tooltip"
                                dataTooltipContent="Messaggi Privati"
                                onClick={handleOpenChat}
                                className="h-fit"
                            />
                        </div>

                        <FDIconButton
                            icon={<Badge badgeContent={NTIFdata.filter((elm) => elm.Viewd === false).length || 0} color="error" max={999}>
                                <NotificationIcon size={22} /></Badge>}
                            variant="text"
                            dataTooltipId="btn-sidenav-icon-tooltip"
                            dataTooltipContent="Notifiche"
                            onClick={(event: React.MouseEvent<HTMLButtonElement>) => toggleGlobalPanel("notifications", {
                                source: "legacy-navbar-notifications",
                                placement: "bottom-end",
                                anchorRect: getAnchorRectFromElement(event.currentTarget),
                                offset: 10,
                                modal: false,
                            })} // prima usava handleOpenMenu
                            className="h-fit"
                        />

                        <span className="h-8 mx-4 bg-gray-300 dark:bg-neutral-700 block w-[1px] rounded-md" />

                        <UserInfo menuRef={userMenuRef} open={() => setUserMenu(true)} status={userMenu} />
                    </div>
                )}
            </header>

            {openReleaseNotes && <ReleaseNotesPanel
                onClose={() => setOpenReleaseNotes(false)}
                openReleaseNotes={openReleaseNotes} />}

            {/* Componente per l'Ultima Release Notes */}
            {openLatestNotes && <LatestRelease onClose={() => setOpenLatestNotes(false)} />}

            {/* Context Menu per i Release Notes */}
            <ContextMenu
                openFor={releaseNotesMenu}
                pos={releaseNotesRef}
                onClose={() => setReleaseNotesMenu(false)}
                menuButtons={contextMenuReleaseNotes}
            />

            {openChat && (
                <InfoMenu
                    anchorEl={chatRef.current}
                    sx={{
                        height: "90%",
                        width: { xs: "92vw", sm: 520, md: 650 },
                        maxWidth: 650,
                        minWidth: 320,
                    }}
                    //right={{ md: "43%" }}
                    handleCloseMenu={handleCloseChat}
                    contain={<Chat />}
                />
            )}

            {userContext && userContext.details && <ContextMenu
                openFor={userMenu}
                pos={userMenuRef}
                // onClose={() => setUserMenu(false)} sostituito per evitare la chiusura automatica durante gli step guidati del tour
                onClose={() => {
                    if (menuAutoLock) return;           // se il tour ha bloccato il menu, ignora il click fuori
                    setUserMenu(false);
                }}
                menuButtons={contextMenuUSER}
            />}

            {/* tour */}
            {(openWelcomeTour || openTourResetModal) && (
                <TourModal
                    open={(openWelcomeTour || openTourResetModal)}
                    onClose={() => {
                        if (openWelcomeTour) {
                            SaveCookieWithAge("tourSeen");
                        };
                        setOpenWelcomeTour(false);
                        setOpenTourResetModal(false);
                    }}
                    hasTourHere={hasTourHere}
                    onStart={() => {
                        setOpenTourResetModal(false);
                        const w = window as any;
                        if (typeof w.__fdCurrentTourRestart === "function") {
                            w.__fdCurrentTourRestart();
                        }
                    }}
                    firstOpen={openWelcomeTour}
                />
            )}

            {/* Tooltip globale per i bottoni della navbar */}
            <Tooltip
                id="btn-sidenav-icon-tooltip"
                place="bottom"
                style={{
                    maxWidth: "15vw",
                    minWidth: 150,
                    fontSize: "0.87rem",
                    textAlign: "center",
                    zIndex: 9999,
                }}
            />

        </Fragment>
    );
};

export default memo(DashboardNavbar);