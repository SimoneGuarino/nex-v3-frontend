// src/layouts/queryAS400/index.tsx
/**
 * descrizione: pagina contenitore del layout "Queries AS400"; gestisce stato, permessi e chiamate API,
 *              delegando la presentazione ai componenti estratti (header, lista, risultati, modali, editor).
 * dipendenze:  context utente/tema, fetcher (Load/Exec/Update/Delete/Create), componenti in ./components, hook use-surface-tokens.
 */
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import { FDBox } from "@nex/fd-ui";
import { enqueueSnackbar } from "components/MessageBox";
import { CheckAdminPermissions } from "utils/checkAdminPermissions";
import { UserContext } from "context/UserContext";

import { LoadQueriesAPI } from "./fetchData/getQueries";
import { UpdateQueryAPI } from "./fetchData/updateQuery";
import { DeleteQueryAPI } from "./fetchData/deleteQuery";
import { ExecSavedQueryAPI, ExecAdHocQueryAPI } from "./fetchData/execQuery";
import { CreateQueryAPI } from "./fetchData/postQuery";

import type { QueryAS400, ExecSavedResponse, ExecAdHocResponse } from "./types";

import HeaderBar from "./components/header-bar";
import ResultsViewer from "./components/results-viewer";
import EditQueryDialog from "./components/edit-query-dialog";
import DeleteQueryDialog from "./components/delete-query-dialog";
import SaveAdhocDialog from "./components/save-adhoc-dialog";
import SavedQueriesList from "./components/saved-queries-list";
import AdhocEditor from "./components/adhoc-editor";
import { useSurfaceTokens } from "./hooks/use-surface-tokens";

// Tooltip globale (solo per pulsanti, NON per le celle: le celle sono gestite da TableVirtualized)
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import { getRolesOptionsFromEnv } from "utils";
import { getRolesMappedByIndex, RoleOption } from "utils/ruoli";

// * util */
const startsWithSelect = (v: string) => /^\s*select\b/i.test(v || "");

type ExecResult =
    | ({ mode: "saved"; titolo?: string; title?: string; queryId?: string } & ExecSavedResponse)
    | ({ mode: "adhoc" } & ExecAdHocResponse)
    | null;

// componente principale
export function QueryAS400() {
    const abortRef = useRef<AbortController | null>(null); // ref per abort delle chiamate fetch di alcune API

    // context utente
    const ctx = useContext(UserContext);
    const userState = ctx?.[0] ?? null; // stato utente (null se non loggato)

    // permessi (string-based per CheckAdminPermissions)
    const userRole = useMemo(
        () =>
            String(
                (userState as any)?.details?.ruolo ??
                (userState as any)?.ruolo ??
                (userState as any)?.role ??
                ""
            ).trim(),
        [userState]
    );
    const permissions = useMemo(
        () =>
            (userState as any)?.permissions ??
            (userState as any)?.details?.permissions ??
            {},
        [userState]
    );
    // controllo permessi admin/dev
    // (se fallisce il controllo, si assume "non admin/dev" per sicurezza)
    // (dipendenze: userRole, permissions)
    const isAdminDev = useMemo(() => {
        try {
            return CheckAdminPermissions({
                userRole,
                permissions,
                panelToCheck: "QueriesAS400",
                where: 0,
            });
        } catch {
            return false;
        }
    }, [userRole, permissions]);

    // ref per ruolo corrente in async
    const userRoleRef = useRef(userRole);
    useEffect(() => {
        userRoleRef.current = userRole;
    }, [userRole]);

    // theme tokens
    const { mutedText } = useSurfaceTokens(); // per stili coerenti col layout

    // stati
    const [activeView, setActiveView] = useState<"saved" | "adhoc">("saved"); // view attiva
    const [loadingList, setLoadingList] = useState<boolean>(false); // stato di caricamento lista queries salvate
    const [queries, setQueries] = useState<QueryAS400[]>([]); // raw delle queries salvate
    const [execLoading, setExecLoading] = useState<string | null>(null); // mantiene l'id della query in esecuzione (o "__adhoc__" per ad-hoc), o null se nessuna in modo da disabilitare bottoni di esecuzione eventualmente
    const [result, setResult] = useState<ExecResult>(null); // risultato dell'ultima esecuzione (saved o ad-hoc)

    const [filter, setFilter] = useState<string>(""); // filtro locale (testo) per lista queries salvate, mantiene il testo del input di ricerca.

    // ruoli (UI select): solo da .env
    const [rolesOptions] = useState<RoleOption[]>(() => getRolesOptionsFromEnv());
    const rolesMap = useMemo(() => getRolesMappedByIndex(rolesOptions), [rolesOptions]); // mappa i ruoli per permettere la visualizzazione di tali su i singoli risultati.

    // modali
    const [editOpen, setEditOpen] = useState<boolean>(false); // stato di apertura dialog modifica query salvata
    const [editTarget, setEditTarget] =
        useState<
            Pick<QueryAS400, "id" | "titolo" | "query" | "descrizione" | "tags"> | null
        >(null); // stato che mantiene l'elemento selezionato per modifica

    // conferma eliminazione modale
    const [confirmDelete, setConfirmDelete] = useState<{
        open: boolean;
        id?: string;
        titolo?: string;
        loading?: boolean;
    }>({ open: false });

    // editor ad-hoc
    const [adhocSql, setAdhocSql] = useState<string>(""); // stato che tiene traccia del testo query in editor (input utente controllato)
    const [adhocError, setAdhocError] = useState<string | null>(null); // stato che tiene traccia dell'errore di validazione (se presente)
    const [adhocTitolo, setAdhocTitolo] = useState<string>(""); // stato che tiene traccia del titolo in editor (input utente controllato)
    const [adhocTitoloError, setAdhocTitoloError] = useState<string | null>(null); // stato che tiene traccia dell'errore di validazione (se presente)
    const [adhocDescrizione, setAdhocDescrizione] = useState<string>(""); // descrizione (opzionale)
    const [adhocTags, setAdhocTags] = useState<string[]>([]); // tags (opzionale)
    const [askConfirmSave, setAskConfirmSave] = useState<boolean>(false); // stato di apertura dialog conferma salvataggio
    const [saveLoading, setSaveLoading] = useState<boolean>(false); // stato di caricamento salvataggio

    // load iniziale
    useEffect(() => {
        setLoadingList(true); //caricamento iniziale generale
        // API dedicata al caricamento delle queries salvate in precedenza
        LoadQueriesAPI({
            abortLike: abortRef,
            parseDates: true,
            onComplete: (data) => {
                setLoadingList(false);
                if (Array.isArray(data)) setQueries(data as QueryAS400[]);
            },
        });
        return () => abortRef.current?.abort(); //abort su unmount della chiamata
    }, []);

    // reload su cambio ruolo (con guardia "stale")
    useEffect(() => {
        if (!userRole) return;
        setLoadingList(true);
        const roleAtStart = userRole;

        LoadQueriesAPI({
            abortLike: abortRef,
            parseDates: true,
            onComplete: (data) => {
                if (userRoleRef.current !== roleAtStart) return;
                setLoadingList(false);
                if (Array.isArray(data)) setQueries(data as QueryAS400[]);
            },
        });
    }, [userRole]);

    // azioni
    const refreshList = () => {
        setLoadingList(true);
        LoadQueriesAPI({
            abortLike: abortRef,
            parseDates: true,
            onComplete: (data) => {
                setLoadingList(false);
                if (Array.isArray(data)) setQueries(data as QueryAS400[]);
            },
        });
    };

    const execSaved = async (id: string) => {
        setExecLoading(id);
        try {
            let res = await ExecSavedQueryAPI({ id, abortLike: abortRef });
            if (!res) {
                // @ts-expect-error
                res = await ExecSavedQueryAPI({ queryId: id, abortLike: abortRef });
            }
            if (res) {
                const titolo = queries.find((q) => q.id === id)?.titolo;
                setResult({ mode: "saved", ...(titolo ? { titolo, title: titolo } : {}), ...res });
            } else {
                enqueueSnackbar("impossibile eseguire la query salvata", {
                    title: "Ops…",
                    type: "error",
                });
            }
        } catch (err) {
            console.error("ExecSavedQueryAPI error:", err);
            enqueueSnackbar("errore durante l’esecuzione della query salvata", {
                title: "Errore",
                type: "error",
            });
        } finally {
            setExecLoading(null);
        }
    };

    const execAdhoc = async () => {
        setAdhocError(null);
        if (!adhocSql.trim()) {
            setAdhocError("query obbligatoria");
            return;
        }
        if (!/^\s*select\b/i.test(adhocSql)) {
            setAdhocError("la query deve iniziare con SELECT");
            return;
        }
        setExecLoading("__adhoc__");
        const res = await ExecAdHocQueryAPI({
            sql: adhocSql.trim(),
            abortLike: abortRef,
        });
        setExecLoading(null);
        if (res) setResult({ mode: "adhoc", ...res });
    };

    const openEdit = (q: QueryAS400) => {
        setEditTarget({
            id: q.id,
            titolo: q.titolo,
            query: q.query,
            descrizione: q.descrizione,
            tags: q.tags,
        });
        setEditOpen(true);
    };

    const submitEdit = async (patch: {
        titolo: string;
        query: string;
        descrizione: string | null;
        tags: string[];
    }) => {
        if (!editTarget) return;
        const { id } = editTarget;
        const updated = await UpdateQueryAPI({
            id,
            patch,
            abortLike: abortRef,
            parseDates: true,
        });
        if (updated) {
            setQueries((prev) => prev.map((x) => (x.id === id ? (updated as QueryAS400) : x)));
            enqueueSnackbar("query aggiornata", { title: "ok", type: "success" });
            setEditOpen(false);
            setEditTarget(null);
        }
    };

    const askDelete = (q: QueryAS400) =>
        setConfirmDelete({ open: true, id: q.id, titolo: q.titolo, loading: false });

    const doDelete = async () => {
        if (!confirmDelete.id) return;
        setConfirmDelete((s) => ({ ...s, loading: true }));
        const res = await DeleteQueryAPI({ id: confirmDelete.id, abortLike: abortRef });
        setConfirmDelete((s) => ({ ...s, loading: false }));
        if (res?.deleted) {
            setQueries((prev) => prev.filter((x) => x.id !== confirmDelete.id));
            enqueueSnackbar("query eliminata", { title: "ok", type: "success" });
            setConfirmDelete({ open: false });
        }
    };

    const validateAdhocForSave = () => {
        let ok = true;
        setAdhocTitoloError(null);
        setAdhocError(null);
        if (!adhocTitolo.trim()) {
            setAdhocTitoloError("titolo obbligatorio");
            ok = false;
        }
        if (!adhocSql.trim()) {
            setAdhocError("query obbligatoria");
            ok = false;
        } else if (!startsWithSelect(adhocSql)) {
            setAdhocError("la query deve iniziare con SELECT");
            ok = false;
        }
        return ok;
    };

    const submitAdhocSave = () => {
        if (!validateAdhocForSave()) return;
        setAskConfirmSave(true);
    };

    const doAdhocSave = async () => {
        setSaveLoading(true);
        const created = await CreateQueryAPI({
            body: {
                titolo: adhocTitolo.trim(),
                query: adhocSql.trim(),
                descrizione: adhocDescrizione.trim() ? adhocDescrizione.trim() : null,
                tags: adhocTags,
            },
            abortLike: abortRef,
            parseDates: true,
        });
        setSaveLoading(false);
        setAskConfirmSave(false);
        if (created) {
            setQueries((prev) => [created as QueryAS400, ...prev]);
            enqueueSnackbar("query salvata", { title: "ok", type: "success" });
            // opzionale: pulizia campi
            // setAdhocTitolo(""); setAdhocDescrizione(""); setAdhocSql(""); setAdhocTags([]);
        }
    };

    // filtro locale (testo)
    const visibleQueries = useMemo(() => {
        const f = filter.trim().toLowerCase();
        if (!f) return queries;
        return queries.filter(
            (q) =>
                q.titolo.toLowerCase().includes(f) ||
                (q.descrizione ?? "").toLowerCase().includes(f)
        );
    }, [queries, filter]);

    return (
        <DashboardLayout>
            <FDBox variant="ghost" className="flex flex-col space-y-4 h-full px-2 md:px-4">
                <HeaderBar
                    className="shrink-0"
                    activeView={activeView}
                    canAdhoc={isAdminDev}
                    onChangeView={setActiveView}
                    onRefresh={refreshList}
                    refreshDisabled={loadingList}
                    filter={filter}
                    onFilterChange={setFilter}
                />

                {activeView === "saved" ? (
                    <div className="grid grid-cols-12 gap-2 md:gap-4">
                        <div className="col-span-12 md:col-span-6 lg:col-span-5">
                            <SavedQueriesList
                                queries={visibleQueries}
                                loading={loadingList}
                                onExec={execSaved}
                                onEdit={openEdit}
                                onDelete={askDelete}
                                execLoadingId={execLoading}
                                canManage={isAdminDev}
                                rolesMap={rolesMap}
                            />
                        </div>

                        <div className="col-span-12 md:col-span-6 lg:col-span-7">
                            <ResultsViewer
                                result={result}
                                style={{ color: mutedText }}
                                mode="auto"
                                virtualizeAt={50}
                                height="60vh"
                            />
                        </div>
                    </div>
                ) : (
                    isAdminDev && (
                        <div className="grid grid-cols-12 gap-2 md:gap-4">
                            <div className="col-span-12">
                                <AdhocEditor
                                    titolo={adhocTitolo}
                                    descrizione={adhocDescrizione}
                                    sql={adhocSql}
                                    selectedTags={adhocTags}
                                    rolesOptions={rolesOptions}
                                    onChangeTitolo={(v) => {
                                        setAdhocTitolo(v);
                                        if (adhocTitoloError) setAdhocTitoloError(null);
                                    }}
                                    onChangeDescrizione={setAdhocDescrizione}
                                    onChangeSql={(v) => {
                                        setAdhocSql(v);
                                        if (adhocError) setAdhocError(null);
                                    }}
                                    onChangeTags={setAdhocTags}
                                    onExec={execAdhoc}
                                    onAskSave={submitAdhocSave}
                                    execLoading={execLoading === "__adhoc__"}
                                    saveLoading={saveLoading}
                                    titoloError={adhocTitoloError}
                                    sqlError={adhocError}
                                />
                            </div>

                            <div className="col-span-12">
                                <ResultsViewer result={result} />
                            </div>
                        </div>
                    )
                )}

                {/* dialog modifica */}
                {editTarget && (
                    <EditQueryDialog
                        open={editOpen}
                        initial={editTarget}
                        rolesOptions={rolesOptions}
                        onClose={() => setEditOpen(false)}
                        onSubmit={submitEdit}
                    />
                )}

                {/* conferma eliminazione */}
                <DeleteQueryDialog
                    open={confirmDelete.open}
                    title={confirmDelete.titolo ?? confirmDelete.id}
                    onClose={() => setConfirmDelete({ open: false })}
                    onConfirm={doDelete}
                    loading={!!confirmDelete.loading}
                />

                {/* conferma salvataggio ad-hoc */}
                <SaveAdhocDialog
                    open={askConfirmSave}
                    onClose={() => setAskConfirmSave(false)}
                    onConfirm={doAdhocSave}
                    loading={saveLoading}
                    titolo={adhocTitolo}
                    sql={adhocSql}
                    descrizione={adhocDescrizione}
                    tags={adhocTags}
                    rolesOptions={rolesOptions}
                />
            </FDBox>

            <Tooltip
                anchorSelect='[data-tt="btn"]'
                place="bottom"
                style={{
                    maxWidth: "15vw",
                    minWidth: 150,
                    fontSize: "0.87rem",
                    textAlign: "center",
                    zIndex: 999999,
                }}
            />
        </DashboardLayout>
    );
}

export default QueryAS400;
