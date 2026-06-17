import React from "react";
import { isKeyInObject } from "vdck";

import { UserContext } from "context/UserContext";

import { Card, Divider, IconButton, Select, MenuItem, Stack, TextField, FormControl, InputLabel } from '@mui/material';
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import { Tooltip } from "react-tooltip";

import { getData } from "./fetch/getData";
import { icon_filter, icon_search, icon_update } from 'config/icons';

import { FDButton } from "@nex/fd-ui";
import MDTypography from "components/MDTypography";

/* importa FDButton dove preferisci tu */
// import FDButton from "components/FDButton";

import "./style/index.css";
import { getTotals } from "./fetch/getTotals";
import Loader from "../../../Loader";

import { addToGroup } from "./fetch/addToGroup";
import { getFilters } from "./fetch/filters";
import { useGeneralDataContext } from "context/GeneralDataContext";
import { useNexTheme } from "@nex/theme-system";

interface TextFieldUIProps {
    disabled?: boolean;
    title: string;
    value: string | number;
    onChange: ({ from, event }: { from: string, event: any }) => void;
    nameFromParams: string;
    sx?: any
};

const TextFieldUI: React.FC<TextFieldUIProps> = ({ disabled, title, value, nameFromParams, onChange, sx }) => (
    <TextField sx={sx} label={title} variant="outlined" value={value}
        onChange={(e: any) => onChange({ from: nameFromParams, event: e })} disabled={disabled} />
)

/* ===== FILTRI: identici all’implementazione originale ===== */
function Filters({ filters, params, setParams, fetchData }: {
    filters: { [key: string]: any }
    params: { [key: string]: any; },
    setParams: React.Dispatch<React.SetStateAction<{ [key: string]: any; }>>,
    fetchData: (resetOffset: boolean, params_?: { [key: string]: any }) => void
}) {
    const { globalData } = useGeneralDataContext();

    const HandleParamsData = ({ from, event }: { from: string, event: any }) => {
        let value = event.target.value;

        setParams((prev: any) => {
            if (from == "tp" && value == "mtf") {
                return { [from]: value, st: "", cd: "", em: "", grp: "", agt: "" };
            } else {
                return { ...prev, [from]: value };
            }
        });
    };

    const ResetCall = () => {
        setParams((prev: any) => {
            fetchData(true, {
                st: "",
                cd: "",
                em: "",
                tp: "",
                grp: "",
                agt: ""
            });
            return { ...prev, st: "", cd: "", em: "", tp: "", grp: "", agt: "" }
        });
    };

    return <Card>
        <Stack p={1} sx={{ borderRadius: 4 }} direction='row' alignItems="center" translate="no" height='100%'>
            {icon_filter({ mr: 1.5, })}
            <Stack direction='row' gap={2} height='100%'>
                <FormControl sx={{ minWidth: "10rem" }}>
                    <InputLabel>Tipo</InputLabel>
                    <Select
                        sx={{ "height": "100%" }}
                        value={params.tp}
                        label="Tipo"
                        onChange={(e: any) => HandleParamsData({ from: "tp", event: e })}
                    >
                        <MenuItem value="tt">Tutti i clienti</MenuItem>
                        <MenuItem value="ftm">Iscritti Focelda disiscritti MailUp</MenuItem>
                        <MenuItem value="mtf">Iscritti MailUp disiscritti Focelda</MenuItem>
                    </Select>
                </FormControl>
                <Divider orientation='vertical' sx={{ height: '100%', width: '1px', backgroundColor: '#ccc' }} />
                <FormControl sx={{ minWidth: "10rem" }}>
                    <InputLabel>Stato utenti</InputLabel>
                    <Select
                        sx={{ "height": "100%" }}
                        value={params.st}
                        label="Stato utenti"
                        onChange={(e: any) => HandleParamsData({ from: "st", event: e })}
                        disabled={params.tp == "mtf" ? true : false}
                    >
                        <MenuItem value="-1">Tutti</MenuItem>
                        <MenuItem value="0">Iscritti</MenuItem>
                        <MenuItem value="1">Disiscritti</MenuItem>
                        <MenuItem value="2">Vuoto</MenuItem>
                    </Select>
                </FormControl>
                <Divider orientation='vertical' sx={{ height: '100%', width: '1px', backgroundColor: '#ccc' }} />
                <FormControl sx={{ minWidth: "10rem" }}>
                    <InputLabel>Gruppi</InputLabel>
                    <Select
                        sx={{ "height": "100%" }}
                        value={params.grp}
                        label="Gruppi"
                        onChange={(e: any) => HandleParamsData({ from: "grp", event: e })}
                        disabled={params.tp == "mtf" ? true : false}
                    >
                        <MenuItem value=" ">Tutti</MenuItem>
                        {("groups" in filters) && filters.groups.length > 0 ?
                            filters.groups.map((group: any, index: number) => {
                                return <MenuItem key={index} value={group.idGruppo}>{group.nome}</MenuItem>
                            }) : null
                        }
                    </Select>
                </FormControl>
                <FormControl sx={{ minWidth: "10rem" }}>
                    <InputLabel>Agente</InputLabel>
                    <Select
                        sx={{ "height": "100%" }}
                        value={params.agt}
                        label="Gruppi"
                        onChange={(e: any) => HandleParamsData({ from: "agt", event: e })}
                        disabled={params.tp == "mtf" ? true : false}
                    >
                        <MenuItem value="-1">Tutti</MenuItem>
                        {("agents" in globalData) && globalData.agents.length > 0 ?
                            globalData.agents.map((agent: any, index: number) => {
                                if (agent.codici.agente) {
                                    return <MenuItem key={index} value={agent.codici.agente}>{agent.codici.agente} | {agent.cognome} {agent.nome}</MenuItem>
                                }
                            }) : null
                        }
                    </Select>
                </FormControl>
                <TextFieldUI
                    title='Codice'
                    value={params.cd}
                    nameFromParams='cd'
                    onChange={HandleParamsData}
                    disabled={params.tp == "mtf" ? true : false}
                />
                <TextFieldUI
                    title='E-mail'
                    value={params.em}
                    nameFromParams='em'
                    onChange={HandleParamsData}
                    disabled={params.tp == "mtf" ? true : false}
                />
            </Stack>
            <Stack direction='row' ml='auto' height='100%'>
                <Divider orientation='vertical'
                    sx={{ height: '100%', width: '1px', backgroundColor: '#ccc' }} />
                <IconButton data-tooltip-id="general-compare-tooltip" onClick={() => ResetCall()}
                    data-tooltip-content='Reset delle proprietà'>
                    {icon_update()}</IconButton>
                <IconButton data-tooltip-id="general-compare-tooltip" onClick={() => fetchData(true)}
                    data-tooltip-content='Cerca i prodotti'>
                    {icon_search()}</IconButton>
            </Stack>
        </Stack>
    </Card>
};

export const NewsletterClienti: React.FC<{}> = () => {
    const [userContext, setUserContext] = React.useContext<any>(UserContext);
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";

    const [params, setParams] = React.useState<{ [key: string]: any }>({
        st: "", cd: "", em: "", tp: "", grp: "", agt: ""
    });

    const [tableData, setTableData] = React.useState<{ [key: string]: any }[]>([]);
    const [totalData, setTotalData] = React.useState<number>(0);
    const [generalFilters, setGeneralFilters] = React.useState<{ [key: string]: any }>({});

    const dataEnd = React.useRef<boolean>(false);
    const offset = React.useRef<number>(0);

    const [loadStatus, setLoadStatus] = React.useState<boolean>(false);
    const abortController = React.useRef<any>(null);
    const cancelRequest = () => { if (abortController.current) abortController.current.abort(); };

    React.useEffect(() => () => cancelRequest(), []);

    const fetchData = async (resetOffset: boolean, params_?: { [key: string]: any }) => {
        if (resetOffset) { offset.current = 0; dataEnd.current = false; }
        if (!loadStatus && !dataEnd.current) {
            setLoadStatus(true);
            if (resetOffset) {
                getTotals({ userContext, abortController, params: params_ ? params_ : params, setTotalData });
            }
            getData({
                userContext, abortController, params: params_ ? params_ : params,
                offset: offset, setTableData, setLoadStatus, dataEnd, resetOffset
            });
            offset.current += 1;
        }
    };

    async function loadFilters() { await getFilters(userContext, abortController, setGeneralFilters); }

    const [addToAGroupMode, setAddToAGroupMode] = React.useState(false);
    const [searchGroup, setSearchGroup] = React.useState("");
    const [addToGroupParams, setAddToGroupParams] = React.useState({ id: -1, name: "" });

    function handleSearchValue(e: React.ChangeEvent<HTMLInputElement>): void {
        if (searchGroup != e.target.value) setSearchGroup(() => e.target.value);
    }

    function executeAddToAGroup() {
        if (!loadStatus) {
            addToGroup({ userContext, abortController, params, groupData: addToGroupParams, setLoadStatus });
            setAddToGroupParams(() => ({ id: -1, name: "" }));
            setAddToAGroupMode(false);
            setSearchGroup("");
        }
    }

    React.useEffect(() => {
        const usersTableDiv: Element | null = document.querySelector('.users-table-div');
        const handleScroll = () => {
            if (usersTableDiv) {
                const table: Element | null = usersTableDiv.querySelector('.users-table');
                if (table) {
                    const divBottom: number = usersTableDiv.getBoundingClientRect().bottom;
                    const tableBottom: number = table.getBoundingClientRect().bottom;
                    if (tableBottom <= divBottom + 100 && !loadStatus && !dataEnd.current) {
                        fetchData(false);
                        usersTableDiv.removeEventListener("scroll", handleScroll);
                    }
                }
            }
        };
        if (usersTableDiv) usersTableDiv.addEventListener("scroll", handleScroll);
        return () => { if (usersTableDiv) usersTableDiv.removeEventListener("scroll", handleScroll); };
    }, [loadStatus]);

    React.useEffect(() => {
        if (!isKeyInObject(userContext, "details", "o")) return;
        fetchData(true);
        loadFilters();
        return () => cancelRequest();
    }, [userContext.details]);

    return (
        <DashboardLayout>
            <div className={darkMode ? "theme-dark" : "theme-light"}>
                <Filters params={params} filters={generalFilters} setParams={setParams} fetchData={fetchData} />

                <div className="add-to-group-wrap">
                    <FDButton
                        variant="solid"
                        color={darkMode ? "primary" : "secondary"}
                        size="medium"
                        radius="md"
                        className="add-to-group-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            setAddToAGroupMode(prev => !prev);
                        }}
                        dataTooltipId="general-compare-tooltip"
                        dataTooltipContent="Aggiungi gli utenti filtrati a un gruppo"
                    >
                        aggiungi tutti a...
                    </FDButton>
                </div>

                <p className="legend">
                    <span className="active-dot-f"></span>= iscritto Focelda |&nbsp;
                    <span className="disabled-dot-f"></span>= disiscritto Focelda<br />
                    <span className="active-dot-m"></span>= iscritto MailUp |&nbsp;
                    <span className="disabled-dot-m"></span>= disiscritto MailUp
                </p>

                {loadStatus && tableData.length == 0 ? (
                    <Loader />
                ) : tableData.length > 0 ? (
                    <>
                        <div className="users-table-div">
                            <table className="users-table">
                                <thead>
                                    <tr>
                                        <th>codice</th>
                                        <th>email</th>
                                        <th>rag. sociale</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableData.map((data: any, index: any) => {
                                        const newsletter = typeof data.newsletter === "boolean" ? data.newsletter : null;

                                        return (
                                            <React.Fragment key={index}>
                                                <tr className="users-focelda-row">
                                                    <td
                                                        data-tooltip-id="general-confg-newsletters-tooltip"
                                                        data-tooltip-content="Codice cliente Focelda"
                                                    >
                                                        {data.codice ?? "non definito"}
                                                    </td>
                                                    <td
                                                        className={
                                                            newsletter === true
                                                                ? "news-active-row"
                                                                : newsletter === false
                                                                    ? "news-disabled-row"
                                                                    : "news-unknown-row"
                                                        }
                                                    >
                                                        {data.email ?? "non definito"}
                                                    </td>
                                                    <td>{data.denominazione ?? ""}</td>
                                                </tr>

                                                <tr className="users-mailup-row">
                                                    {data.mailUp?.map((mailUpData: any) => (
                                                        <React.Fragment key={`${data.email}-${mailUpData.id}`}>
                                                            <td
                                                                data-tooltip-id="general-confg-newsletters-tooltip"
                                                                data-tooltip-content="Codice cliente MailUp"
                                                            >
                                                                {mailUpData.id ?? "non definito"}
                                                            </td>

                                                            {/* secondo TD del secondo TR */}
                                                            <td className="mailup-groups-cell">
                                                                {mailUpData.gruppi?.map((groupsData: any) => {
                                                                    const mailUp =
                                                                        groupsData.stato === "iscritto"
                                                                            ? true
                                                                            : groupsData.stato === "disiscritto"
                                                                                ? false
                                                                                : null;

                                                                    return (
                                                                        <p
                                                                            key={`${mailUpData.id}-${groupsData.idGruppo}`}
                                                                            className={
                                                                                mailUp === true
                                                                                    ? "news-active-group"
                                                                                    : mailUp === false
                                                                                        ? "news-disabled-group"
                                                                                        : "news-unknown-group"
                                                                            }
                                                                        >
                                                                            {groupsData.idGruppo ?? "non definito"}&nbsp;|&nbsp;
                                                                            {groupsData.nomeGruppo ?? "non definito"}
                                                                        </p>
                                                                    );
                                                                })}
                                                            </td>

                                                            <td>&nbsp;</td>
                                                        </React.Fragment>
                                                    ))}
                                                </tr>
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="users-table-stats">
                            <span className="users-totals">{tableData.length} di <b>{totalData}</b></span>
                        </div>

                        {addToAGroupMode ?
                            <div
                                className="users-group-section"
                                onClick={(e: React.MouseEvent<HTMLInputElement>) => {
                                    e.stopPropagation();
                                    setAddToGroupParams(() => ({ id: -1, name: "" }));
                                    setAddToAGroupMode(false);
                                }}
                            >
                                <div
                                    className="users-group-container"
                                    onClick={(e: React.MouseEvent<HTMLInputElement>) => {
                                        e.stopPropagation();
                                    }}
                                >
                                    <MDTypography variant="body1" className="overlay-intro-text">
                                        Ricerca il gruppo e aggiungi gli utenti filtrati nel gruppo selezionato
                                    </MDTypography>

                                    <TextField
                                        className="group-search-text"
                                        value={searchGroup}
                                        label="Cerca gruppo..."
                                        aria-label="Campo testuale per ricercare gruppo"
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearchValue(e)}
                                        sx={{ width: "100%" }}
                                    />

                                    <div className="groups-list">
                                        {("groups" in generalFilters) && generalFilters.groups.length > 0 ?
                                            generalFilters.groups.map((group: any, index: number) => {
                                                const regex = new RegExp(`${searchGroup}`, "i");
                                                if (regex.test(group.nome)) {
                                                    return (
                                                        <MenuItem
                                                            key={index}
                                                            value={group.idGruppo}
                                                            onClick={() => setAddToGroupParams(() => ({ id: group.idGruppo, name: group.nome }))}
                                                        >
                                                            {group.nome}
                                                        </MenuItem>
                                                    );
                                                }
                                            })
                                            : null
                                        }
                                    </div>

                                    {addToGroupParams.id != -1 ?
                                        <MDTypography variant="body1" className="overlay-warning-text">
                                            Stai per aggiungere gli utenti filtrati al gruppo <b>{addToGroupParams.name}</b>
                                        </MDTypography>
                                        : null
                                    }

                                    <FDButton
                                        variant="solid"
                                        color={darkMode ? "primary" : "secondary"}
                                        onClick={() => executeAddToAGroup()}
                                        disabled={loadStatus}
                                    >
                                        aggiungi
                                    </FDButton>
                                </div>
                            </div>
                            : null
                        }
                    </>
                ) : (
                    <p className="no-data-text">
                        Sembra non ci siano dati con i filtri impostati, riprova modificandone qualcuno
                    </p>
                )}

                <Tooltip
                    id="general-confg-newsletters-tooltip"
                    place="bottom"
                    className="general-tooltip"
                />
            </div>
        </DashboardLayout>
    );
}
