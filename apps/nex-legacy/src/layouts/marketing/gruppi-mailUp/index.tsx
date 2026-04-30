import "./style/index.css";

import React from "react";
import { isKeyInObject, isString } from "vdck";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import { Checkbox, IconButton, TextField } from '@mui/material';
import { Tooltip } from "react-tooltip";

import { useUserContext } from "context/UserContext";

import { icon_add, icon_delete, icon_edit, icon_save, icon_search, icon_send, icon_update } from "../../../config/icons";
import DeleteImage from "assets/images/delete-concept-tiny-people.webp";

import fetchGroups from "./fetch/fetchGroups";
import fetchTotalGroups from "./fetch/fetchTotalsGroups";
import { useMaterialUIController } from "context/index";
import { MainTheme } from "assets/settingsTheme";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import editGroup from "./fetch/editGroup";
import Allert from "examples/Allert";
import { CheckAdminPermissions } from "utils/checkAdminPermissions";
import { UserContextType } from "types/UserContext";
import { useNexTheme } from "@nex/theme-system";

// Types & interfaces
interface groupTableInterface {
    idGruppo?: number,
    nome?: string,
    bloccato?: boolean
};

interface newGroupInterface {
    nome?: string,
    bloccato?: boolean,
    attivo?: boolean
};

interface newGroupErrorInterface {
    ok: boolean,
    msg: string
};

const TableData: React.FC<{
    data: any,
    idx: number,
    updateRow: (id: string, data: { nome: string, bloccato: boolean }) => void,
    loadingStatus: React.MutableRefObject<boolean>,
    setAllert: React.Dispatch<React.SetStateAction<boolean>>,
    indexDelete: React.MutableRefObject<string>,
}> = React.memo(({
    data,
    idx,
    updateRow,
    loadingStatus,
    setAllert,
    indexDelete
}: {
    data: any,
    idx: number,
    updateRow: (id: string, data: { nome: string, bloccato: boolean }) => void,
    loadingStatus: React.MutableRefObject<boolean>,
    setAllert: React.Dispatch<React.SetStateAction<boolean>>,
    indexDelete: React.MutableRefObject<string>

}) => {
    // User context
    const [userContext, setUserContext] = useUserContext();
    const { preferences } = useNexTheme();
    const darkMode = preferences.mode === "dark";
    const CheckAdminDev: boolean = CheckAdminPermissions({
        userRole: (userContext as any)?.details?.ruolo,
        permissions: (userContext as any)?.details?.permissions, panelToCheck: 'gruppi_mailUp', where: 0
    });

    const abortController = React.useRef<any>(null);
    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
        }
    };

    // Edit row states
    const [editMode, setEditMode] = React.useState(false);
    const [onHover, setOnHover] = React.useState(false);

    // Edit row data
    const [rowData, setRowData] = React.useState({ nome: data.nome, bloccato: data.bloccato });

    /** Handle values changes
     * 
     * @param {React.ChangeEvent<HTMLInputElement> | { target: { value: any } }} e HTMLInputElement 
     * @param {string} keyName Key's name
     * @returns {void}
     */
    function handleChanges(e: React.ChangeEvent<HTMLInputElement> | { target: { value: any } }, keyName: string): void {
        if (keyName === "nome") {
            if (isString(e.target.value, true) && e.target.value !== rowData.nome) {
                setRowData((prev) => ({ ...prev, nome: e.target.value }));
            }
        } else if (keyName === "bloccato") {
            const isChecked =
                typeof e.target.value === "boolean"
                    ? e.target.value
                    : e.target.value === "true";
            setRowData((prev) => ({ ...prev, bloccato: isChecked }));
        }
    }

    /** Handle various edit actions
     * 
     * @param {number} type Ops type
     * @param {string} id Row's id 
     * @returns {void}
     */
    function editAction(type: number, id?: string, data?: any): void {
        if (!loadingStatus.current) {
            if (type == 0 && id) {
                indexDelete.current = id;
                setAllert(true);
            } else if (type == 1) {
                setRowData({ nome: data.nome, bloccato: data.bloccato });
            } else if (id) {
                updateRow(id, rowData);
                setRowData({ nome: data.nome, bloccato: data.bloccato });
            }
        }
        setEditMode(false);
    }

    // Return table data
    return (
        <tr key={idx} id={`${idx}-${data.idGruppo}`} className="mailUp-table-row" onMouseEnter={() => setOnHover(true)} onMouseLeave={() => setOnHover(false)}>
            <td style={{ width: "18rem", backgroundColor: darkMode ? "#333" : "#fff", color: darkMode ? "#fff" : "#000" }}>{data.idGruppo}</td>
            <td style={{ width: "30rem", backgroundColor: darkMode ? "#333" : "#fff", color: darkMode ? "#fff" : "#000" }}>
                {!editMode ?
                    data.nome ?? "n.d."
                    :
                    <TextField
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChanges(e, "nome")}
                        value={rowData.nome}
                        placeholder={data.nome}
                    />
                }
            </td>
            <td style={{ width: "100%", backgroundColor: darkMode ? "#333" : "#fff", color: darkMode ? "#fff" : "#000" }}>
                <input type="checkbox" checked={rowData.bloccato} className="mailUp-table-check" disabled={
                    !editMode || !CheckAdminDev} onClick={(e: React.MouseEvent<HTMLInputElement>) => handleChanges({ target: { value: e.currentTarget.checked } }, "bloccato")} />
                {onHover ?
                    editMode ?
                        <>
                            {!CheckAdminDev && data.bloccato ?
                                null :
                                <IconButton sx={{ height: "1.1rem", margin: "-0.2rem 0.5rem 0 0.5rem", width: "1.1rem" }} onClick={() => editAction(0, `${idx}-${data.idGruppo}`)}>{icon_delete({})}</IconButton>
                            }
                            <IconButton sx={{ height: "1.1rem", margin: "-0.2rem 0.5rem 0 0.5rem", width: "1.1rem" }} onClick={() => editAction(1, `${idx}-${data.idGruppo}`, data)}>{icon_add({ transform: "rotate(45deg)" })}</IconButton>
                            <IconButton sx={{ height: "1.1rem", margin: "-0.2rem 0.5rem 0 0.5rem", width: "1.1rem" }} onClick={() => editAction(2, `${idx}-${data.idGruppo}`, data)}>{icon_save({})}</IconButton>
                        </>
                        :
                        <IconButton sx={{ height: "1.1rem", margin: "-0.2rem 0.5rem 0 0.5rem", width: "1.1rem" }} onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();

                            setEditMode(!editMode);
                            setRowData({ nome: data.nome, bloccato: data.bloccato });
                        }}>{icon_edit({})}</IconButton>
                    : null
                }
            </td>
        </tr>
    );
})

/** Main component
 * 
 * @returns {JSX}
 */
export const GruppiMailUpClienti: React.FC<{}> = () => {
    // Context and abort controller
    const [userContext, setUserContext] = useUserContext();
    const CheckAdminDev: boolean = CheckAdminPermissions({
        userRole: (userContext as any)?.details?.ruolo,
        permissions: (userContext as any)?.details?.permissions, panelToCheck: 'gruppi_mailUp', where: 0
    });
    const [error, setError]: [boolean, React.Dispatch<React.SetStateAction<boolean>>] = React.useState(false);
    const [allert, setAllert]: [boolean, React.Dispatch<React.SetStateAction<boolean>>] = React.useState(false);
    const loading: React.MutableRefObject<boolean> = React.useRef(false);

    const abortController = React.useRef<any>(null);
    const cancelRequest = () => {
        if (abortController.current) {
            abortController.current.abort();
        }
    };

    // Dark mode
    const [controller, dispatch] = useMaterialUIController();
    const { darkMode } = controller;
    const palette = MainTheme().palette;

    // Main table
    const [groupsTable, setGroupsTable]: [groupTableInterface[], React.Dispatch<React.SetStateAction<groupTableInterface[]>>] = React.useState([{}]);
    const [totalGroupsTable, setTotalGroupsTable]: [number, React.Dispatch<React.SetStateAction<number>>] = React.useState(0);
    const groupsTableOffset: React.MutableRefObject<number> = React.useRef(0);

    /** Fetch existing groups
     * 
     * @param {string} searchParam Group's id or name
     * @return {void}
     */
    function getGroups(searchParam: string, firstCall: boolean = false): void {
        if (!loading.current && (firstCall || groupsTable.length < totalGroupsTable)) {
            loading.current = true;
            if (firstCall) groupsTableOffset.current = 0;

            fetchGroups({
                userContext,
                abortController,
                searchParam,
                setGroupsTable,
                groupsTableOffset,
                firstCall,
                loading,
                setError
            });

            if (firstCall) {
                fetchTotalGroups({
                    userContext,
                    abortController,
                    searchParam,
                    setTotalGroupsTable,
                    setError
                });
            }
        }
    }

    // Search group
    const [search, setSearch]: [string, React.Dispatch<React.SetStateAction<string>>] = React.useState("");

    /** Check and change search input value
     * 
     * @param {React.ChangeEvent<HTMLInputElement>} event Element event
     * @return {void}
     */
    function changeSearchValue(event: React.ChangeEvent<HTMLInputElement>): void {
        if (isString(event.target.value, true) && event.target.value != search) {
            setSearch(event.target.value);
        }
    }

    /** Check and change search input value
     * 
     * @param {React.ChangeEvent<HTMLInputElement>} event Element event
     * @return {void}
     */
    function searchGroup(): void {
        if (!loading.current) {
            // Reset create group fields if user was creating a group
            resetEditGroupFields();

            // Check fields
            if (isString(search, true, 1)) {
                getGroups(search, true);
            }
        }
    }

    /** Reset all fields and panels
     * 
     * @returns {void}
     */
    function resetAllFields(): void {
        groupsTableOffset.current = 0;
        resetEditGroupFields();
        setSearch("");
        getGroups("", true);

        // Scroll to the top of the element
        const table: Element | null = document.querySelector('.mailUp-table-con');
        if (table) table.scrollTop = 0;
    }

    // Create group
    const [showeditGroup, setShoweditGroup]: [boolean, React.Dispatch<React.SetStateAction<boolean>>] = React.useState(false);
    const [newGroup, setNewGroup]: [newGroupInterface, React.Dispatch<React.SetStateAction<newGroupInterface>>] = React.useState({ nome: "", bloccato: false } as newGroupInterface);
    const [newGroupStatus, setNewGroupStatus]: [newGroupErrorInterface, React.Dispatch<React.SetStateAction<newGroupErrorInterface>>] = React.useState({ ok: true, msg: "" } as newGroupErrorInterface);

    /** Reset create group panel and values
     * 
     * @returns {void}
     */
    function resetEditGroupFields(): void {
        if (Object.keys(newGroup).length > 0) {
            for (const key in newGroup) {
                if (Object.prototype.hasOwnProperty.call(newGroup, key)) {
                    const element: any = newGroup[key as keyof newGroupInterface];

                    let newValue: string | boolean | null = null;
                    if (typeof element == "string") {
                        newValue = "";
                    } else if (typeof element == "boolean") {
                        newValue = false;
                    } else {
                        newValue = null;
                    }

                    if (newValue != element) {
                        setNewGroup((prev: newGroupInterface) => {
                            return { ...prev, [key]: newValue };
                        });
                    }
                }
            }
        }

        setShoweditGroup(false);
    }

    /** Change values
     * 
     * @param {React.ChangeEvent<HTMLInputElement>} event Element's event
     */
    function changeCreateValues(event: { key: string, value: any }) {
        if (newGroup[event.key as keyof newGroupInterface] != event.value) {
            setNewGroup((prev: newGroupInterface) => {
                if (event.key == "nome") {
                    if (!isString(event.value, true, 2)) {
                        setNewGroupStatus({ ok: false, msg: "Il nome inserito è vuoto, non è una stringa, o è troppo corto" });
                    } else {
                        setNewGroupStatus({ ok: true, msg: "" });
                    }
                }

                return { ...prev, [event.key]: event.value };
            });
        }
    }

    /** Send a fetch request toCreate a new group
     * 
     * @returns {void}
     */
    function createNewGroup(): void {
        if (newGroupStatus.ok && !loading.current) {
            loading.current = true;

            editGroup(
                userContext,
                abortController,
                1,
                newGroup,
                loading,
                setGroupsTable,
                (groupsTable.length == totalGroupsTable),
                setNewGroupStatus
            );

            if (groupsTable.length == totalGroupsTable) {
                setTotalGroupsTable((prev: number) => prev + 1);
            }
        }
    }

    /** Update group/row
     * 
     * @param {string} id Group's id
     * @returns {void}
     */
    function updateRow(id: string, data: { nome: string, bloccato: boolean }): void {
        if (!loading.current) {
            loading.current = true;

            // Update table
            const groupId = Number(id.split("-")[1]);
            setGroupsTable((prevGroup: groupTableInterface[]) => {
                const copy = [...prevGroup];
                const foundIndexRow = copy.findIndex((row: groupTableInterface, index: number) => `${index}-${row.idGruppo}` === id);

                if (foundIndexRow !== -1) {
                    copy[foundIndexRow].nome = data.nome;
                    copy[foundIndexRow].bloccato = data.bloccato;
                }

                return copy;
            });

            // Fetch
            editGroup(
                userContext,
                abortController,
                2,
                { id: groupId, ...data },
                loading,
                null,
                null
            );

            loading.current = false;
        }
    }

    const indexMustDelete: React.MutableRefObject<string> = React.useRef("");
    /** Delete group/row
     * 
     * @returns {void}
     */
    function deleteRow(): void {
        if (!loading.current && indexMustDelete.current.length > 0) {
            loading.current = true;

            // Update table
            setGroupsTable((prevGroup: groupTableInterface[]) => {
                const copy = [...prevGroup];
                const foundIndexRow = copy.findIndex((row: groupTableInterface, index: number) => `${index}-${row.idGruppo}` === indexMustDelete.current);

                if (foundIndexRow !== -1) copy.splice(foundIndexRow, 1);

                return copy;
            });

            setTotalGroupsTable((prevTotal: number) => prevTotal - 1);

            // Fetch
            const groupId = Number(indexMustDelete.current.split("-")[1]);
            editGroup(
                userContext,
                abortController,
                0,
                { id: groupId },
                loading,
                null,
                null
            );

            indexMustDelete.current = "";
            setAllert(false);
        }
    }

    // Check context
    React.useEffect(() => {
        if (!userContext) return;

        // Check details key/value
        if (!isKeyInObject(userContext, "details", "o")) {
            setError(true);
            return;
        }

        getGroups(search, true);
    }, [userContext]);

    React.useEffect(() => {
        const usersTableDiv: Element | null = document.querySelector('.mailUp-table-con');

        const handleScroll = () => {
            if (usersTableDiv) {
                const table: Element | null = usersTableDiv.querySelector('.mailUp-table');
                if (table) {
                    const divBottom: number = usersTableDiv.getBoundingClientRect().bottom;
                    const tableBottom: number = table.getBoundingClientRect().bottom;

                    if (tableBottom <= divBottom + 1 && !loading.current) {
                        getGroups(search);
                    }
                }
            }
        };

        if (usersTableDiv && !loading.current) {
            usersTableDiv.addEventListener("scroll", handleScroll);
        }

        return () => {
            if (usersTableDiv) usersTableDiv.removeEventListener("scroll", handleScroll);
        };
    }, [loading.current, groupsTable, totalGroupsTable]);

    // darkMode ? palette.grey[800] : palette.grey[200]

    // Render
    return (
        <DashboardLayout>
            <>
                {!error ? (
                    <>
                        <MDTypography variant="h2" className="mailUp-title">Crea, modifica o disabilita gruppi</MDTypography>
                        <MDTypography variant="body2" className="mailUp-desc">In questa sezione puoi creare, modificare o disabilitare i gruppi MailUp</MDTypography>

                        {/* Search */}
                        <div className="mailUp-groups">
                            <div className="mailUp-search">
                                <TextField
                                    className="mailUp-search-text"
                                    value={search}
                                    label="Cerca gruppo..."
                                    aria-label="Campo testuale per ricercare gruppo"
                                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => changeSearchValue(event)}
                                />
                                <MDButton variant="text" color="secondary" sx={{ padding: "0.5rem 0.7rem", position: "absolute", right: "0", top: "50%", transform: "translateY(-50%)" }} className="mailUp-search-button" onClick={() => searchGroup()} aria-label="Button per iniziare la ricerca del gruppo">{icon_search({ height: "1.4rem", width: "1.4rem" })}</MDButton>
                            </div>
                            <MDButton variant="text" color="secondary" sx={{ padding: "0.5rem" }} onClick={() => resetAllFields()} aria-label="Button per ripristinare tutto da capo">{icon_update({ height: "1.4rem", width: "1.4rem" })}</MDButton>
                            <MDButton variant="contained" sx={{ borderRadius: "0.3rem", padding: "0.5rem 1rem 0.4rem 0.5rem", textTransform: "lowercase" }} color={darkMode ? "primary" : "secondary"} onClick={() => setShoweditGroup(showeditGroup ? false : true)} aria-label="Button per aprire la sezione della creazione di un nuovo gruppo">
                                <span className="mailUp-create-span">{icon_add({ color: "#fff", height: "1.4rem", margin: "0 0.3rem 0 0", width: "1.4rem", transform: showeditGroup ? "rotate(45deg)" : "none", transition: "0.2s" })} crea gruppo</span>
                            </MDButton>
                        </div>

                        {/* Create */}
                        <span className="mailUp-create" style={{ backgroundColor: darkMode ? "#333" : "#fff", display: showeditGroup ? "inline-block" : "none" }}>
                            <MDTypography variant="h4" className="mailUp-create-title">Crea nuovo gruppo</MDTypography>
                            <MDTypography variant="body1" sx={{ fontSize: "0.8rem", marginTop: "0.3rem" }}>Tutti i campi sono obbligatori</MDTypography>
                            <div className="mailUp-create-form">
                                <TextField
                                    className="mailUp-create-name-text"
                                    value={newGroup.nome}
                                    label="Nome del nuovo gruppo..."
                                    aria-label="Campo testuale per inserire il nome del nuovo gruppo"
                                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => changeCreateValues({ key: "nome", value: event.target.value })}
                                />
                                {CheckAdminDev ?
                                    <div className="mailUp-create-blocked">
                                        <Checkbox checked={newGroup.bloccato} sx={{ paddingLeft: "0" }} onClick={() => changeCreateValues({ key: "bloccato", value: !newGroup.bloccato })} disabled={CheckAdminDev ? false : true} />
                                        <span style={{ color: darkMode ? "#fff" : "#000" }}>Non cancellabile?</span>
                                    </div>
                                    :
                                    null
                                }
                            </div>
                            {!newGroupStatus.ok || newGroupStatus.ok && newGroupStatus.msg.length > 0 ?
                                <MDTypography color={!newGroupStatus.ok ? "error" : undefined} variant="body2" sx={{ fontWeight: "bold", fontSize: "0.8rem", margin: "0.5rem 0 0.5rem 0" }}>{newGroupStatus.msg}</MDTypography>
                                :
                                null
                            }
                            <MDButton variant="contained" color={darkMode ? "primary" : "secondary"} sx={{ marginTop: "1rem", padding: "0.7rem 1.4rem 0.6rem 1.3rem", textTransform: "lowercase" }} onClick={() => createNewGroup()} aria-label="Button per inviare la creazione del gruppo">
                                <span className="mailUp-send-span">{icon_send({ color: "#fff", height: "1rem", margin: "-0.1rem 0.5rem 0 0", width: "1rem" })} crea</span>
                            </MDButton>
                        </span>

                        {/* Table */}
                        {groupsTable.length > 0 ? (
                            <>
                                <div className="mailUp-table-con">
                                    <table className="mailUp-table" style={{ backgroundColor: darkMode ? "#333" : "#fff" }}>
                                        <thead>
                                            <tr>
                                                <th style={{ borderTopLeftRadius: "1rem", width: "18rem", backgroundColor: darkMode ? "#333" : "#fff", color: darkMode ? "#fff" : "#000" }}>id</th>
                                                <th style={{ width: "30rem", backgroundColor: darkMode ? "#333" : "#fff", color: darkMode ? "#fff" : "#000" }}>nome</th>
                                                <th style={{ borderTopRightRadius: "1rem", width: "100%", backgroundColor: darkMode ? "#333" : "#fff", color: darkMode ? "#fff" : "#000" }}>bloccato</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupsTable.map((data: any, idx: number) => {
                                                return (<TableData
                                                    idx={idx}
                                                    data={data}
                                                    setAllert={setAllert}
                                                    updateRow={updateRow}
                                                    loadingStatus={loading}
                                                    indexDelete={indexMustDelete}

                                                />);
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="table-end" style={{ backgroundColor: darkMode ? "#333" : "#fff", color: darkMode ? "#fff" : "#000" }}>{groupsTable.length} di <b>{totalGroupsTable}</b></div>
                            </>
                        ) : (
                            <p className="mailUp-no-group">Non ci sono gruppi che rispettano i filtri inseriti</p>
                        )}
                        <Tooltip
                            id="general-confg-suppliers-tooltip"
                            place="bottom"
                            style={{
                                maxWidth: "15vw",
                                minWidth: 150,
                                fontSize: "0.87rem",
                                zIndex: 9999,
                                textAlign: "center",
                            }}
                        />
                        {allert &&
                            <Allert title="Sei Sicuro?" body="Una volta cancellato il gruppo verrà registrata questa azione"
                                image={DeleteImage}
                                close={setAllert}
                                action={deleteRow}
                                icon={icon_delete()}
                            />
                        }
                    </>
                ) : (
                    <p></p>
                )}
            </>
        </DashboardLayout>
    );
}