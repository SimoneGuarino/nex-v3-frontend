import { Box, Paper, IconButton, Button, MenuItem, Menu } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import React, { Fragment, useState } from "react";
import { DataOverviewProps, tabType } from "..";
import MDTypography from "components/MDTypography";
import { icon_Keyboard_ArrowUp, icon_download, icon_Keyboard_ArrowDown } from "config/icons";
import { Tag } from "components/Tag/Tag";
import { User } from "types/user";
import { FDIconButton } from "@nex/fd-ui";
import { GetTableDataAPI } from "../fetchData/get/getTableData";
import { enqueueSnackbar } from "components/MessageBox";


type defaultStylesType = {
    bg: { [key: number]: string };
    [key: number]: string;
    icon: string;
    button: {
        default: string;
        active: string;
    };
};

interface TopBarProps {
    data: DataOverviewProps | null;
    tableData: DataOverviewProps[] | null;
    tabActived: { key: number, roleRef: number, prop_key: 'acquisto' | 'vendita', label: string };
    currentUser: User | null;
    defaultStyles: defaultStylesType;
    loadStatus: { [key: string]: any };
    userList: User[];
    CheckAdminDev: boolean;
    setData: React.Dispatch<React.SetStateAction<null | DataOverviewProps>>;
    setTableData: React.Dispatch<React.SetStateAction<DataOverviewProps[] | null>>;
    setBackUpTableData: React.Dispatch<React.SetStateAction<DataOverviewProps[] | null>>;
    setCurrentUser: (user: User | null) => void;
    changeTab: ({ index }: { index: number }) => void;
    onExport: (format: 'xlsx' | 'csv', utenteId: string) => void;
    setObjectiveDialog: (open: boolean) => void;
    ChangeLoadStatus: ({ from, bool }: { from: string, bool: boolean }) => void;
    CreateOverviewData: (data?: DataOverviewProps[] | null) => void;
};
/**
 * TopBar component for the SWOT dashboard.
 * @param data - Dati di overview da visualizzare
 * @param tabActived - Tab attivo corrente
 * @param currentUser - Utente corrente selezionato
 * @param setCurrentUser - Funzione per impostare l'utente corrente
 * @param changeTab - Funzione per cambiare tab
 * @param defaultStyles - Stili di default per il componente
 * @param onExport - Funzione per esportare i dati
 * @param loadStatus - Stato di caricamento per diverse operazioni
 * @param ChangeLoadStatus - Funzione per cambiare lo stato di caricamento
 * @param categoryData - Dati delle categorie per l'obiettivo
 * @param userList - Lista degli utenti disponibili
 * @param CheckAdminDev - Flag per verificare se l'utente ha permessi di amministratore
 * @param setObjectiveDialog - Funzione per aprire/chiudere il dialog degli obiettivi
 * @param setData - Funzione per impostare i dati di overview
 * @param setTableData - Funzione per impostare i dati della tabella
 * @returns JSX.Element
 */
const TopBar: React.FC<TopBarProps> = ({
    data, tabActived, currentUser, defaultStyles, loadStatus, userList, CheckAdminDev,
    setObjectiveDialog, setCurrentUser, onExport, changeTab, setData, setTableData, ChangeLoadStatus, setBackUpTableData, CreateOverviewData
}) => {
    const abortController = React.useRef<AbortController | null>(null);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const [anchorElExport, setAnchorElExport] = useState<null | HTMLElement>(null);
    const openExport = Boolean(anchorElExport);

    const isInspecting: boolean = Boolean(data && data.brand && data.linea && data.gruppo && data.famiglia);

    // Funzione per aprire il menu di esportazione
    const handleExportMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElExport(event.currentTarget);
    };
    const handleExportMenuClose = () => {
        setAnchorElExport(null);
    };

    // Funzione per esportare i dati
    const onExportBrige = (format: 'xlsx' | 'csv', utenteId: string) => {
        if (loadStatus.download) return; // Prevent multiple clicks while downloading
        handleExportMenuClose();
        onExport(format, utenteId);
    }
    // Funzione per aprire il menu degli utenti
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    // Funzione per chiudere il menu degli utenti
    const handleMenuClose = () => {
        setAnchorEl(null);
    };
    // Funzione per cambiare l'utente corrente
    const handleUserSwitch = (user: User | null) => {
        if (!user) {
            return enqueueSnackbar("Utente non trovato", {
                title: 'Ops..',
                type: 'error',
            });
        };

        setCurrentUser(user);
        handleMenuClose();

        ChangeLoadStatus({ from: 'overview', bool: true });
        ChangeLoadStatus({ from: 'table', bool: true });

        //TODO: Quando avviene lo switch dell'utente, ricaricare i dati della tabella e del overview
        GetTableDataAPI({
            abortController,
            userId: user._id,
            setOverviewData: setData,
            setTableData,
            setBackUpTableData,
            ChangeLoadStatus
        });
    };

    // Componente per il bottone di cambio tab
    const ButtonComponent: React.FC<{
        index?: number | string;
        onClick: () => void;
        disabled?: boolean;
        children: React.ReactNode;
    }> = ({ index, onClick, disabled, children }) => (
        <button disabled={disabled || false} onClick={onClick}
            className={`flex items-center text-xs !px-4 !py-3 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${index !== undefined && (index == tabActived.key ? defaultStyles.button.active : defaultStyles.button.default)}`}>
            {children}
        </button>
    );


    return (
        <Box component='div' height="5%" minHeight={60}>
            <Paper
                elevation={0}
                sx={{
                    height: "100%",
                    bgcolor: defaultStyles.bg[100],
                    px: 2,
                    borderRadius: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                {/* SINISTRA */}
                <div className="flex flex-row gap-2 items-center">
                    {isInspecting && <>
                        <IconButton
                            onClick={() => CreateOverviewData()}
                            size="medium" sx={{ mr: 1, color: defaultStyles.icon }}>
                            <ArrowBackIcon fontSize="medium" />
                        </IconButton>
                        <div className="flex flex-row items-center gap-1">
                            {data && [data.brand, data.linea?.descrizione, data.gruppo?.descrizione, data.famiglia?.descrizione].map((item, index) => (
                                <Fragment key={index}>
                                    <Tag text={item || "N/A"} />
                                    {index < 3 && <span className="text-sm">/</span>}
                                </Fragment>
                            ))}
                        </div>
                        <span className="!mx-2 border-l h-10 w-1 border-gray-300 dark:border-gray-700" />
                    </>}

                    {/* Tab Switcher */}
                    <div className="flex flex-row items-center rounded-md overflow-hidden">
                        {['Acquisto', 'Vendite'].map((label, index) => (
                            <ButtonComponent key={index}
                                index={index} onClick={() => changeTab({ index })}>
                                {label}
                            </ButtonComponent>
                        ))}
                    </div>
                </div>

                {/* DESTRA */}
                <div className="flex flex-row items-center gap-2">
                    {/* Objective */}
                    {CheckAdminDev && (<>
                        {currentUser && <Fragment>
                            {!(!data?.brand || !data?.linea || !data?.gruppo || !data?.famiglia) &&<Button
                                onClick={() => setObjectiveDialog(true)}
                                variant="contained"
                                size="medium"
                                sx={{
                                    bgcolor: "#EDE7F6",
                                    color: "#7C7B87",
                                    textTransform: "none",
                                    fontWeight: 500,
                                    borderRadius: "20px",
                                    minWidth: 100,
                                    height: 40,
                                    boxShadow: "none",
                                    mr: 4, // spazio tra Objective e John Doe
                                    "&:hover": {
                                        bgcolor: "#e0d9f0",
                                        boxShadow: "none",
                                    },
                                }}
                            >
                                + Obiettivo
                            </Button>}
                            <div className="flex items-center gap-1">
                                <FDIconButton
                                    icon={icon_download({ width: 20, height: 20 })}
                                    loading={loadStatus.download}
                                    disabled={loadStatus.download}
                                    onClick={handleExportMenuOpen} />

                                <Menu
                                    anchorEl={anchorElExport}
                                    open={openExport}
                                    onClose={handleExportMenuClose}
                                    anchorOrigin={{
                                        vertical: "bottom",
                                        horizontal: "right",
                                    }}
                                    transformOrigin={{
                                        vertical: "top",
                                        horizontal: "right",
                                    }}
                                >
                                    {['csv', 'xlsx'].map((label: string) => (
                                        <MenuItem
                                            key={label}
                                            onClick={() => onExportBrige((label as any), currentUser._id)}
                                            sx={{ gap: 1.5, px: 2 }}
                                        >
                                            <MDTypography variant="body2" sx={{ color: defaultStyles.icon }}>
                                                {label.toUpperCase()}
                                            </MDTypography>
                                        </MenuItem>
                                    ))}
                                </Menu>
                            </div>
                        </Fragment>}

                        <div className="flex items-center gap-1">
                            {loadStatus.users ? <div className="h-full w-[150px] bg-gray-200 dark:bg-neutral-700 rounded-md col-span-1 !p-6 animate-pulse" />
                                : <div className={`flex items-center gap-1 cursor-pointer`} onClick={(e: React.MouseEvent<HTMLDivElement>) => !loadStatus.users && handleMenuOpen(e)}>
                                    <div className={`flex items-center gap-2 ${defaultStyles.button.default} !px-2 !py-1.5 rounded-s-3xl min-h-[45px]`}>
                                        {currentUser ? <Fragment>
                                            <span className='bg-gray-300 dark:bg-gray-800 text-gray-700 dark:text-gray-300 !w-8 !h-8 !text-sm rounded-full flex items-center justify-center'>
                                                {currentUser.nome[0] + currentUser.cognome[0] || ""}
                                            </span>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {currentUser.nome + " " + currentUser.cognome}
                                            </p>
                                        </Fragment> : loadStatus.users ?
                                            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 dark:border-gray-500 dark:border-t-white rounded-full animate-spin" />
                                            : <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Seleziona l'utente
                                            </p>}
                                    </div>
                                    <div className={`flex items-center justify-center ${defaultStyles.button.default} !px-2 !py-3 rounded-e-3xl`}>
                                        {open ? (
                                            icon_Keyboard_ArrowUp({ width: 20, height: 20 })
                                        ) : (
                                            icon_Keyboard_ArrowDown({ width: 20, height: 20 })
                                        )}
                                    </div>
                                </div>}
                            <Menu
                                sx={{
                                    "& ul": {
                                        maxHeight: "300px",
                                        overflowY: "auto",
                                    },
                                }}
                                anchorEl={anchorEl}
                                open={open}
                                onClose={handleMenuClose}
                                anchorOrigin={{
                                    vertical: "bottom",
                                    horizontal: "right",
                                }}
                                transformOrigin={{
                                    vertical: "top",
                                    horizontal: "right",
                                }}
                            >
                                <MenuItem
                                    onClick={() => handleUserSwitch(null)}
                                    sx={{ gap: 1.5, px: 2 }}
                                >
                                    <div className={`flex items-center gap-2 !px-2 !py-1.5`}>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Deseleziona
                                        </p>
                                    </div>
                                </MenuItem>
                                {userList.map((user: User) => (
                                    <MenuItem
                                        key={user._id}
                                        onClick={() => handleUserSwitch(user)}
                                        sx={{ gap: 1.5, px: 2 }}
                                    >
                                        <div className={`flex items-center gap-2 !px-2 !py-1.5`}>
                                            <span className='bg-gray-300 dark:bg-gray-800 text-gray-700 dark:text-gray-300 !w-8 !h-8 !text-sm rounded-full flex items-center justify-center'>
                                                {user.nome[0] || ""}{user.cognome[0] || ""}
                                            </span>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {user.nome} {user.cognome}
                                            </p>
                                        </div>
                                    </MenuItem>
                                ))}
                            </Menu>
                        </div>
                    </>)}
                </div>
            </Paper>

        </Box>
    );
};

export default TopBar;
