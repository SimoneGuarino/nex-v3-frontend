// src/components/UI/panels/customerNotes/hooks/useCustomerNotesManager.ts
/**
 * descrizione: Hook orchestratore del dominio "note cliente".
 * include:     fetch lista, filtri locali, create/update/delete, gestione discussione, permessi.
 */
import React from "react";
import type { FDSelectOption } from "components/UI/input/FDSelect";
import { enqueueSnackbar } from "components/MessageBox";
import SendLogs from "logs";
import { SearchCustomersAPI } from "layouts/clienti/fetchData/V2/serchCustomers";
import { getData as getNoteClientiData } from "layouts/clienti/fetchData/reportProfilazione/noteClienti/getData";
import { getNoteDetails } from "layouts/clienti/fetchData/reportProfilazione/noteClienti/getNoteDetails";
import { deleteCustomerNote } from "layouts/clienti/fetchData/reportProfilazione/noteClienti/deleteNote";
import { deleteCustomerNoteHistoryChange } from "layouts/clienti/fetchData/reportProfilazione/noteClienti/deleteNoteHistoryChange";
import { addCustomerNote, getCustomerNoteTypes } from "../fetchdata/addNotes";
import updateCustomerNote from "../fetchdata/updateNote";
import type {
    ChangeLoadArgs,
    DeleteChangeState,
    DeleteNoteState,
    DiscussionState,
    ImpaginationState,
    NotesFederatedCursor,
    NotesGroup,
    NotesManagerLoadStatus,
    NotesScopeFilter,
    NotesSummary,
    SortPresetValue,
    UseCustomerNotesManagerParams,
} from "../types";
import { EMPTY_NOTE_TYPE_OPTIONS } from "../constants";
import {
    asDigitString,
    buildDiscussionStateFromRow,
    buildRequesterIdentityKeys,
    extractCustomerCode,
    extractCustomerLabel,
    extractHistoryEntryDate,
    extractHistoryEntryNoteText,
    extractHistoryEntryUserLabel,
    extractHistoryRows,
    extractNoteId,
    extractNoteOwnerLabel,
    extractNoteText,
    extractNoteTypeCode,
    extractNoteTypeLabel,
    isAdministrativeNote,
    isAdministrativeRole,
    isAdministrativeTypeCode,
    isAdminRole,
    isDevRole,
    isEntryOwnedByRequester,
    isMongoNote,
    mergeDetailInDiscussion,
    normalizeIdentity,
    normalizeListRows,
    normalizeText,
    parseSortPreset,
} from "../utils";
import { getTotals } from "layouts/clienti/fetchData/reportProfilazione/noteClienti/getTotal";

/**
 * Centralizza tutta la logica del Customer Notes Manager:
 * fetch dati, filtri locali, CRUD note e dialoghi.
 */
export function useCustomerNotesManager({
    userContext,
    queryBody,
    enabled = true,
    changeMainLoadStatus,
}: UseCustomerNotesManagerParams) {
    /** Lista note correntemente caricate (paginazione incrementale). */
    const [rows, setRows] = React.useState<any[]>([]);
    /** Totale remoto note disponibili, usato per capire se esistono altre pagine. */
    /** Stato della paginazione corrente. */
    const [pagination, setPagination] = React.useState<ImpaginationState>(null);
    /** Loading del primo caricamento/refresh completo lista. */
    const [loadingInitial, setLoadingInitial] = React.useState(false);
    /** Loading della paginazione "carica altre note". */
    const [loadingMore, setLoadingMore] = React.useState(false);
    /** Preset ordinamento selezionato dall'utente (convertito poi in payload API). */
    const [sortPreset, setSortPreset] = React.useState<SortPresetValue>("DATA_NOTA:desc");
    /** Filtro locale tipologia note: tutte/commerciali/amministrative. */
    const [scopeFilter, setScopeFilter] = React.useState<NotesScopeFilter>("all");
    /** Testo ricerca locale full-text applicato alle righe in memoria. */
    const [searchText, setSearchText] = React.useState("");

    /** Apertura/chiusura del dialog di creazione nuova nota. */
    const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
    /** Loading della mutation di creazione nota (submit dialog). */
    const [createNoteLoading, setCreateNoteLoading] = React.useState(false);
    /** Codice cliente selezionato nel dialog create. */
    const [createCustomerCode, setCreateCustomerCode] = React.useState("");
    /** Query digitata nel search clienti del dialog create. */
    const [createCustomerSearch, setCreateCustomerSearch] = React.useState("");
    /** Loading della ricerca clienti nel select del dialog create. */
    const [createCustomerSearchLoading, setCreateCustomerSearchLoading] = React.useState(false);
    /** Opzioni clienti provenienti dalla ricerca remota (debounced). */
    const [searchedCustomerCodeOptions, setSearchedCustomerCodeOptions] = React.useState<
        FDSelectOption<string>[]
    >([]);
    /** Tipologia nota selezionata nel dialog create (es. AMMI/COMM). */
    const [createNoteType, setCreateNoteType] = React.useState("");
    /** Testo nota inserito nel dialog create. */
    const [createNoteText, setCreateNoteText] = React.useState("");
    /** Loading recupero tipologie nota dal backend. */
    const [loadingNoteTypes, setLoadingNoteTypes] = React.useState(false);
    /** Opzioni tipologia disponibili nel dialog create (con eventuale filtro permessi). */
    const [noteTypeOptions, setNoteTypeOptions] =
        React.useState<FDSelectOption<string>[]>(EMPTY_NOTE_TYPE_OPTIONS);

    /** Contesto discussione attiva (nota selezionata + storico + metadati). */
    const [discussion, setDiscussion] = React.useState<DiscussionState | null>(null);
    /** Loading del fetch dettaglio/discussione nota aperta. */
    const [discussionLoading, setDiscussionLoading] = React.useState(false);
    /** Testo dell'aggiornamento in scrittura nel footer discussione. */
    const [discussionText, setDiscussionText] = React.useState("");
    /** Loading della mutation che aggiunge un aggiornamento alla discussione. */
    const [savingDiscussion, setSavingDiscussion] = React.useState(false);

    /** Payload del dialog conferma eliminazione nota intera (null = dialog chiuso). */
    const [deletingNote, setDeletingNote] = React.useState<DeleteNoteState>(null);
    /** Loading della request di eliminazione nota intera. */
    const [deletingNoteLoading, setDeletingNoteLoading] = React.useState(false);
    /** Payload del dialog conferma eliminazione singola modifica storico. */
    const [deletingChange, setDeletingChange] = React.useState<DeleteChangeState>(null);
    /** Loading della request di eliminazione singola modifica storico. */
    const [deletingChangeLoading, setDeletingChangeLoading] = React.useState(false);

    /** Offset corrente server-side usato dalla paginazione incrementale lista. */
    const offsetRef = React.useRef(0);
    const cursorRef = React.useRef<NotesFederatedCursor | null>(null);
    /** Controller ultimo fetch lista (prima pagina o pagine successive). */
    const listAbortRef = React.useRef<AbortController | null>(null);
    /** Controller fetch tipologie nota nel dialog create. */
    const noteTypesAbortRef = React.useRef<AbortController | null>(null);
    /** Controller fetch dettaglio/discussione nota aperta. */
    const detailAbortRef = React.useRef<AbortController | null>(null);
    /** Controller condiviso per mutation create/update discussione. */
    const saveAbortRef = React.useRef<AbortController | null>(null);
    /** Controller mutation delete nota intera. */
    const deleteNoteAbortRef = React.useRef<AbortController | null>(null);
    /** Controller mutation delete singolo messaggio storico. */
    const deleteChangeAbortRef = React.useRef<AbortController | null>(null);

    /** Controller Loader centralizzati del layout. */
    const [loadStatus, setLoadStatus] = React.useState<NotesManagerLoadStatus>({
        total: false,
    });

    /** Derivazione permessi ruolo utente corrente. */
    const role = userContext?.details?.ruolo;
    const canDeleteAsDev = React.useMemo(() => isDevRole(role), [role]);
    const canManageAdministrativeNotes = React.useMemo(
        () => isDevRole(role) || isAdminRole(role) || isAdministrativeRole(role),
        [role]
    );
    const requesterIdentityKeys = React.useMemo(
        () => buildRequesterIdentityKeys(userContext),
        [userContext]
    );
    const requesterLabel = React.useMemo(() => {
        const details = userContext?.details ?? {};
        const firstName = normalizeText(details?.nome);
        const lastName = normalizeText(details?.cognome);
        const fullName = `${firstName} ${lastName}`.trim();
        if (fullName) return fullName;

        return (
            normalizeText(details?.username) ||
            normalizeText(userContext?.claims?.username) ||
            normalizeText(userContext?.user?.claims?.username) ||
            normalizeText(userContext?.security?.username) ||
            ""
        );
    }, [userContext]);

    const sortPayload = React.useMemo(() => parseSortPreset(sortPreset), [sortPreset]);
    const isCursorSort = React.useMemo(() => {
        const field = sortPayload?.profilazioneSortField;
        return field === "DATA_NOTA" || field === "ULTIMA_MODIFICA";
    }, [sortPayload]);
    const requestBody = React.useMemo(
        () => ({
            ...(queryBody ?? {}),
            ...sortPayload,
        }),
        [queryBody, sortPayload]
    );
    const requestSignature = React.useMemo(() => JSON.stringify(requestBody), [requestBody]);

    /** Body ridotto per mutation (solo campi utili ai log/permessi backend). */
    const mutationBody = React.useMemo(() => {
        const body: Record<string, any> = {};
        if (queryBody && queryBody.cmp !== undefined && queryBody.cmp !== null) {
            body.cmp = queryBody.cmp;
        }
        const agentCode = normalizeText(queryBody?.ccom);
        if (agentCode) {
            body.ccom = agentCode;
        }
        return body;
    }, [queryBody]);


    /**
     * Aggiorna in modo centralizzato il singolo loader richiesto.
     */
    const changeLoadStatus = React.useCallback(({ from, bool }: ChangeLoadArgs) => {
        setLoadStatus((prev: NotesManagerLoadStatus) => ({
            ...prev,
            [from]: bool !== undefined ? bool : !prev[from as keyof NotesManagerLoadStatus],
        }));
    }, []);

    /** Setter rows con normalizzazione uniforme date/list payload. */
    const setRowsWithFormatting = React.useCallback((updater: React.SetStateAction<any[]>) => {
        setRows((prev) => {
            const next = typeof updater === "function" ? (updater as any)(prev) : updater;
            if (!Array.isArray(next)) return [];
            return normalizeListRows(next);
        });
    }, []);

    /** Carica la prima pagina lista note resettando completamente lo stato paginazione. */
    const fetchFirstPage = React.useCallback(async (firstLoad?: boolean) => {
        if (!enabled) return;
        if (!userContext?.token) return;

        listAbortRef.current?.abort();
        listAbortRef.current = null;
        offsetRef.current = 0;
        cursorRef.current = null;
        setRows([]);
        setPagination(null);
        setLoadingInitial(true);
        setLoadingMore(false);
        changeLoadStatus({ from: "total", bool: true });

        try {
            await getNoteClientiData({
                userContext,
                abortController: listAbortRef,
                body: requestBody,
                offset: offsetRef,
                cursor: cursorRef,
                useCursor: isCursorSort,
                setData: setRowsWithFormatting,
                setErr: () => { },
                ChangeLoadStatus: changeLoadStatus,
                changeMainLoadStatus,
                setPagination,
            });

            if (firstLoad) {
                await getTotals({
                    userContext,
                    abortController: listAbortRef,
                    body: { ...requestBody, tt: true },
                    setErr: () => { },
                    ChangeLoadStatus: changeLoadStatus,
                    setPagination,
                });
            };

        } catch (error: any) {
            if (error?.name !== "AbortError") {
                console.error(error);
            }
        } finally {
            setLoadingInitial(false);
        }
    }, [changeLoadStatus, enabled, requestBody, setRowsWithFormatting, userContext]);

    /** Carica pagina successiva rispettando lock loading e limite `total`. */
    const fetchMore = React.useCallback(async () => {
        if (!enabled) return;
        if (!userContext?.token) return;
        if (loadingInitial || loadingMore) return;
        if (!pagination?.hasMore) return;

        setLoadingMore(true);
        try {
            await getNoteClientiData({
                userContext,
                abortController: listAbortRef,
                body: requestBody,
                offset: offsetRef,
                cursor: cursorRef,
                useCursor: isCursorSort,
                setData: setRowsWithFormatting,
                setErr: () => { },
                ChangeLoadStatus: () => { },
                setPagination,
            });
        } catch (error: any) {
            if (error?.name !== "AbortError") {
                console.error(error);
            }
        } finally {
            setLoadingMore(false);
        }
    }, [
        loadingInitial,
        loadingMore,
        requestBody,
        rows.length,
        setRowsWithFormatting,
        pagination,
        userContext,
        enabled,
    ]);


    /** Refetch automatico quando cambia firma richiesta o stato enabled. */
    React.useEffect(() => {
        if (!enabled) return;
        fetchFirstPage(true).catch(() => { });
    }, [enabled, fetchFirstPage, requestSignature]);

    /** Cleanup centralizzato: abort di tutte le request pendenti allo smontaggio. */
    React.useEffect(() => {
        return () => {
            listAbortRef.current?.abort();
            noteTypesAbortRef.current?.abort();
            detailAbortRef.current?.abort();
            saveAbortRef.current?.abort();
            deleteNoteAbortRef.current?.abort();
            deleteChangeAbortRef.current?.abort();
        };
    }, []);

    /** Regola permessi cancellazione nota intera (owner o dev; solo note mongo). */
    const canDeleteNoteRow = React.useCallback((row: any): boolean => {
        if (!isMongoNote(row)) return false;
        if (canDeleteAsDev) return true;

        const ownerCandidates = [
            row?.OWNER_USER_ID,
            row?.OwnerUserId,
            row?.ownerUserId,
            row?.NOTE_OWNER_ID,
            row?.noteOwnerId,
            row?.OWNER_ID,
            row?.ownerId,
            row?.USER_ID,
            row?.UserId,
        ]
            .map((value) => normalizeIdentity(value))
            .filter((value) => value.length > 0);

        return ownerCandidates.some((value) => requesterIdentityKeys.has(value));
    }, [canDeleteAsDev, requesterIdentityKeys]);

    /** Regola permessi cancellazione singola entry storico (owner entry o dev). */
    const canDeleteHistoryEntry = React.useCallback((entry: any): boolean => {
        if (canDeleteAsDev) return true;
        return isEntryOwnedByRequester(entry, requesterIdentityKeys);
    }, [canDeleteAsDev, requesterIdentityKeys]);

    /** Regola edit nota: note amministrative modificabili solo da ruoli autorizzati. */
    const canEditNote = React.useCallback((row: any): boolean => {
        if (!isMongoNote(row)) return false;
        if (!isAdministrativeNote(row)) return true;
        return canManageAdministrativeNotes;
    }, [canManageAdministrativeNotes]);

    /** Regola edit discussione basata su tipologia nota attualmente aperta. */
    const canEditDiscussion = React.useMemo(() => {
        if (!discussion) return false;
        if (!isAdministrativeTypeCode(discussion.noteTypeCode)) return true;
        return canManageAdministrativeNotes;
    }, [canManageAdministrativeNotes, discussion]);

    /** Filtraggio locale full-text + scope commerciale/amministrativo. */
    const filteredRows = React.useMemo(() => {
        const normalizedSearch = normalizeText(searchText).toLowerCase();
        return rows.filter((row) => {
            const adminNote = isAdministrativeNote(row);

            if (scopeFilter === "commerciali" && adminNote) return false;
            if (scopeFilter === "amministrative" && !adminNote) return false;

            if (!normalizedSearch) return true;
            const searchBlob = [
                extractCustomerCode(row),
                extractCustomerLabel(row),
                extractNoteTypeCode(row),
                extractNoteTypeLabel(row),
                extractNoteText(row),
                extractNoteOwnerLabel(row),
                normalizeText(row?.DATA_NOTA || row?.Data),
            ]
                .join(" ")
                .toLowerCase();

            return searchBlob.includes(normalizedSearch);
        });
    }, [rows, scopeFilter, searchText]);

    /** Raggruppa note filtrate per codice cliente per rendering sezioni lista. */
    const groupedNotes = React.useMemo<NotesGroup[]>(() => {
        const groupsMap = new Map<string, NotesGroup>();

        filteredRows.forEach((row) => {
            const customerCode = extractCustomerCode(row) || "-";
            const key = customerCode;
            const label = extractCustomerLabel(row);

            if (!groupsMap.has(key)) {
                groupsMap.set(key, {
                    customerCode,
                    customerLabel: label,
                    notes: [],
                });
            }

            const group = groupsMap.get(key);
            if (group) {
                group.notes.push(row);
                if (!group.customerLabel && label) {
                    group.customerLabel = label;
                }
            }
        });

        return Array.from(groupsMap.values()).sort((a, b) =>
            a.customerCode.localeCompare(b.customerCode, "it")
        );
    }, [filteredRows]);

    /** KPI header basati sulle sole righe correntemente caricate. */
    const summary = React.useMemo<NotesSummary>(() => {
        let ammi = 0;

        rows.forEach((row) => {
            if (isAdministrativeNote(row)) ammi += 1;
        });

        return {
            total: pagination?.total ?? rows.length,
            ammi,
            commerciali: Math.max(0, rows.length - ammi),
        };
    }, [rows, pagination?.total]);

    /** Opzioni cliente base derivate da query iniziale + righe lista presenti. */
    const baseCustomerCodeOptions = React.useMemo<FDSelectOption<string>[]>(() => {
        const byCode = new Map<string, FDSelectOption<string>>();
        /** Inserisce opzione cliente solo se il codice e valido. */
        const addOption = (codeInput: unknown, labelInput?: unknown) => {
            const code = asDigitString(codeInput);
            if (!code) return;

            const label = normalizeText(labelInput);
            byCode.set(code, {
                value: code,
                label: label ? `${code} - ${label}` : code,
            });
        };

        const selectedCustomers = queryBody?.ccli;
        if (Array.isArray(selectedCustomers)) {
            selectedCustomers.forEach((item: any) => {
                addOption(item?.codice || item?.CLIENTE || item?.customerCode, item?.ragioneSociale);
            });
        } else {
            addOption(selectedCustomers);
        }

        rows.forEach((row) => {
            addOption(extractCustomerCode(row), extractCustomerLabel(row));
        });

        return Array.from(byCode.values()).sort((a, b) => a.value.localeCompare(b.value, "it"));
    }, [queryBody?.ccli, rows]);

    /** Ricerca remota clienti nel dialog create con debounce e abort su cambio input. */
    React.useEffect(() => {
        if (!createDialogOpen) return;

        const query = normalizeText(createCustomerSearch);
        const abortController = new AbortController();
        const timer = window.setTimeout(async () => {
            try {
                setCreateCustomerSearchLoading(true);

                const params = new URLSearchParams({
                    query,
                    context: "quotations",
                    limit: "20",
                });

                const items = await SearchCustomersAPI({
                    abortController,
                    params: params.toString(),
                    ChangeLoadStatus: () => { },
                });

                if (!items) return;

                setSearchedCustomerCodeOptions((prev) => {
                    const byCode = new Map<string, FDSelectOption<string>>();
                    prev.forEach((option) => byCode.set(option.value, option));

                    items.forEach((item: any) => {
                        const code = asDigitString(item?.codiceCliente);
                        if (!code) return;

                        const label = normalizeText(item?.ragioneSociale);
                        byCode.set(code, {
                            value: code,
                            label: label ? `${code} - ${label}` : code,
                        });
                    });

                    return Array.from(byCode.values());
                });
            } catch (error: any) {
                if (error?.name !== "AbortError") {
                    console.error("Errore ricerca clienti note:", error);
                }
            } finally {
                setCreateCustomerSearchLoading(false);
            }
        }, 300);

        return () => {
            window.clearTimeout(timer);
            abortController.abort();
        };
    }, [createCustomerSearch, createDialogOpen]);

    /** Merge opzioni cliente base + risultati ricerca remota con selezionato in testa. */
    const customerCodeOptions = React.useMemo<FDSelectOption<string>[]>(() => {
        const byCode = new Map<string, FDSelectOption<string>>();

        baseCustomerCodeOptions.forEach((option) => byCode.set(option.value, option));
        searchedCustomerCodeOptions.forEach((option) => byCode.set(option.value, option));

        const selectedCode = asDigitString(createCustomerCode);
        if (selectedCode && !byCode.has(selectedCode)) {
            byCode.set(selectedCode, {
                value: selectedCode,
                label: selectedCode,
            });
        }

        const ordered = Array.from(byCode.values()).sort((a, b) =>
            a.value.localeCompare(b.value, "it")
        );

        if (!selectedCode) return ordered;

        const selectedOption = ordered.find((option) => option.value === selectedCode);
        if (!selectedOption) return ordered;

        return [
            selectedOption,
            ...ordered.filter((option) => option.value !== selectedCode),
        ];
    }, [baseCustomerCodeOptions, createCustomerCode, searchedCustomerCodeOptions]);

    /** Apre il dialog create inizializzando stato form e codice cliente preferito. */
    const openCreateDialog = React.useCallback(
        (customerCode?: string) => {
            const preferredCode = asDigitString(customerCode);
            const firstAvailableCode = baseCustomerCodeOptions[0]?.value;

            setCreateCustomerCode(preferredCode || firstAvailableCode || "");
            setCreateCustomerSearch("");
            setSearchedCustomerCodeOptions([]);
            setCreateNoteText("");
            setCreateNoteType("");
            setCreateDialogOpen(true);
        },
        [baseCustomerCodeOptions]
    );

    /** Chiude il dialog create interrompendo eventuali save in corso. */
    const closeCreateDialog = React.useCallback(() => {
        if (createNoteLoading) return;
        saveAbortRef.current?.abort();
        setCreateCustomerSearch("");
        setSearchedCustomerCodeOptions([]);
        setCreateDialogOpen(false);
    }, [createNoteLoading]);

    /** Carica tipologie nota all'apertura dialog e applica filtro permessi AMMI. */
    React.useEffect(() => {
        if (!createDialogOpen) return;

        noteTypesAbortRef.current?.abort();
        const abortController = new AbortController();
        noteTypesAbortRef.current = abortController;
        setLoadingNoteTypes(true);

        getCustomerNoteTypes({
            abortController,
            cmp: queryBody?.cmp,
            silentErrorToast: true,
        })
            .then((types) => {
                const options = types.map((type) => ({
                    value: type.code,
                    label:
                        type.description && type.description !== type.code
                            ? `${type.description} (${type.code})`
                            : type.code,
                }));

                const filtered = canManageAdministrativeNotes
                    ? options
                    : options.filter((option) => normalizeText(option.value).toUpperCase() !== "AMMI");

                setNoteTypeOptions([EMPTY_NOTE_TYPE_OPTIONS[0], ...filtered]);

                if (
                    !canManageAdministrativeNotes &&
                    normalizeText(createNoteType).toUpperCase() === "AMMI"
                ) {
                    setCreateNoteType("");
                }
            })
            .catch((error: any) => {
                if (error?.name === "AbortError") return;
                console.error(error);
                setNoteTypeOptions(EMPTY_NOTE_TYPE_OPTIONS);
                enqueueSnackbar("Tipologie nota non disponibili: salvataggio senza tipologia.", {
                    title: "Attenzione",
                    type: "warning",
                });
            })
            .finally(() => {
                if (noteTypesAbortRef.current === abortController) {
                    noteTypesAbortRef.current = null;
                }
                setLoadingNoteTypes(false);
            });
    }, [
        canManageAdministrativeNotes,
        createDialogOpen,
        createNoteType,
        queryBody?.cmp,
    ]);

    /** Valida e crea una nuova nota cliente, poi refresha la lista. */
    const handleCreateNote = React.useCallback(async () => {
        if (createNoteLoading) return;

        const customerCode = asDigitString(createCustomerCode);
        if (!customerCode) {
            enqueueSnackbar("Seleziona un cliente valido", {
                title: "Attenzione",
                type: "warning",
            });
            return;
        }

        const noteText = normalizeText(createNoteText);
        if (!noteText) {
            enqueueSnackbar("La nota non puo essere vuota", {
                title: "Attenzione",
                type: "warning",
            });
            return;
        }

        const noteType = normalizeText(createNoteType);
        if (isAdministrativeTypeCode(noteType) && !canManageAdministrativeNotes) {
            enqueueSnackbar("Non puoi creare note amministrative", {
                title: "Permessi",
                type: "warning",
            });
            return;
        }

        saveAbortRef.current?.abort();
        const abortController = new AbortController();
        saveAbortRef.current = abortController;
        setCreateNoteLoading(true);

        let attemptedRequest = false;
        try {
            attemptedRequest = true;
            await addCustomerNote({
                abortController,
                customerCode,
                noteText,
                noteType,
                body: mutationBody,
                silentErrorToast: false,
            });

            enqueueSnackbar("Nota creata con successo", {
                title: "OK",
                type: "success",
            });

            setCreateDialogOpen(false);
            setCreateNoteText("");
            setCreateNoteType("");
            await fetchFirstPage();
        } catch (error: any) {
            if (error?.name !== "AbortError") {
                console.error(error);
            }
        } finally {
            if (saveAbortRef.current === abortController) {
                saveAbortRef.current = null;
            }
            setCreateNoteLoading(false);
            if (attemptedRequest) {
                SendLogs(
                    userContext?.token,
                    "Add Customer Note",
                    window.location.href.toString(),
                    null,
                    customerCode
                );
            }
        }
    }, [
        canManageAdministrativeNotes,
        createCustomerCode,
        createNoteLoading,
        createNoteText,
        createNoteType,
        fetchFirstPage,
        mutationBody,
        userContext?.token,
    ]);

    /** Aggiorna il dettaglio discussione per la nota attualmente aperta. */
    const refreshDiscussion = React.useCallback(async () => {
        if (!discussion?.noteId) return;

        detailAbortRef.current?.abort();
        const abortController = new AbortController();
        detailAbortRef.current = abortController;
        setDiscussionLoading(true);

        try {
            const response = await getNoteDetails({
                abortController,
                noteId: discussion.noteId,
            });

            if (response?.status && response?.item) {
                setDiscussion((prev) => (prev ? mergeDetailInDiscussion(prev, response.item) : prev));
            }
        } catch (error: any) {
            if (error?.name !== "AbortError") {
                console.error(error);
            }
        } finally {
            if (detailAbortRef.current === abortController) {
                detailAbortRef.current = null;
            }
            setDiscussionLoading(false);
        }
    }, [discussion?.noteId]);

    /** Apre il panel discussione partendo dalla riga selezionata in lista. */
    const openDiscussion = React.useCallback((row: any) => {
        const noteId = extractNoteId(row);
        if (!noteId) return;

        setDiscussionText("");
        setDiscussion(buildDiscussionStateFromRow(row));
    }, []);

    /** Refetch automatico dettaglio ogni volta che cambia la nota in discussione. */
    React.useEffect(() => {
        if (!discussion?.noteId) return;
        refreshDiscussion().catch(() => { });
    }, [discussion?.noteId, refreshDiscussion]);

    /** Chiude discussione e resetta stati locali correlati. */
    const closeDiscussion = React.useCallback(() => {
        if (savingDiscussion || deletingChangeLoading || deletingNoteLoading) return;
        detailAbortRef.current?.abort();
        setDiscussion(null);
        setDiscussionText("");
        setDeletingChange(null);
    }, [deletingChangeLoading, deletingNoteLoading, savingDiscussion]);

    /** Aggiunge un nuovo aggiornamento alla discussione corrente e refresha i dati. */
    const handleAddDiscussionChange = React.useCallback(async () => {
        if (!discussion?.noteId || !discussion?.customerCode) return;
        if (savingDiscussion) return;
        if (!canEditDiscussion) {
            enqueueSnackbar("Non hai i permessi per modificare questa nota", {
                title: "Permessi",
                type: "warning",
            });
            return;
        }

        const text = normalizeText(discussionText);
        if (!text) {
            enqueueSnackbar("La modifica non puo essere vuota", {
                title: "Attenzione",
                type: "warning",
            });
            return;
        }

        saveAbortRef.current?.abort();
        const abortController = new AbortController();
        saveAbortRef.current = abortController;
        setSavingDiscussion(true);

        let attemptedRequest = false;
        try {
            attemptedRequest = true;
            await updateCustomerNote({
                abortController,
                customerCode: discussion.customerCode,
                noteText: text,
                noteId: discussion.noteId,
                body: mutationBody,
                silentErrorToast: false,
            });

            enqueueSnackbar("Modifica aggiunta con successo", {
                title: "OK",
                type: "success",
            });

            setDiscussionText("");
            await Promise.all([refreshDiscussion(), fetchFirstPage()]);
        } catch (error: any) {
            if (error?.name !== "AbortError") {
                console.error(error);
            }
        } finally {
            if (saveAbortRef.current === abortController) {
                saveAbortRef.current = null;
            }
            setSavingDiscussion(false);
            if (attemptedRequest) {
                SendLogs(
                    userContext?.token,
                    "Edit Customer Note",
                    window.location.href.toString(),
                    null,
                    discussion.customerCode
                );
            }
        }
    }, [
        canEditDiscussion,
        discussion?.customerCode,
        discussion?.noteId,
        discussionText,
        fetchFirstPage,
        mutationBody,
        refreshDiscussion,
        savingDiscussion,
        userContext?.token,
    ]);

    /** Prepara il dialog conferma eliminazione nota con i dati contestuali della riga. */
    const openDeleteNoteDialog = React.useCallback(
        (row: any) => {
            const noteId = extractNoteId(row);
            if (!noteId) return;

            if (!canDeleteNoteRow(row)) {
                enqueueSnackbar("Non sei autorizzato ad eliminare questa nota", {
                    title: "Permessi",
                    type: "warning",
                });
                return;
            }

            setDeletingNote({
                noteId,
                customerCode: extractCustomerCode(row),
                noteText: extractNoteText(row),
                ownerLabel: extractNoteOwnerLabel(row),
            });
        },
        [canDeleteNoteRow]
    );

    /** Chiude dialog eliminazione nota interrompendo eventuale request pendente. */
    const closeDeleteNoteDialog = React.useCallback(() => {
        if (deletingNoteLoading) return;
        deleteNoteAbortRef.current?.abort();
        setDeletingNote(null);
    }, [deletingNoteLoading]);

    /** Elimina la nota selezionata, sincronizzando lista e discussione aperta. */
    const handleDeleteNote = React.useCallback(async () => {
        if (deletingNoteLoading || !deletingNote?.noteId) return;

        deleteNoteAbortRef.current?.abort();
        const abortController = new AbortController();
        deleteNoteAbortRef.current = abortController;
        setDeletingNoteLoading(true);

        let attemptedRequest = false;
        try {
            attemptedRequest = true;
            await deleteCustomerNote({
                abortController,
                noteId: deletingNote.noteId,
                body: mutationBody,
            });

            enqueueSnackbar("Nota eliminata con successo", {
                title: "OK",
                type: "success",
            });

            if (discussion?.noteId === deletingNote.noteId) {
                setDiscussion(null);
            }
            setDeletingNote(null);
            await fetchFirstPage();
        } catch (error: any) {
            if (error?.name !== "AbortError") {
                console.error(error);
            }
        } finally {
            if (deleteNoteAbortRef.current === abortController) {
                deleteNoteAbortRef.current = null;
            }
            setDeletingNoteLoading(false);
            if (attemptedRequest) {
                SendLogs(
                    userContext?.token,
                    "Delete Customer Note",
                    window.location.href.toString(),
                    null,
                    deletingNote.customerCode
                );
            }
        }
    }, [
        deletingNote,
        deletingNoteLoading,
        discussion?.noteId,
        fetchFirstPage,
        mutationBody,
        userContext?.token,
    ]);

    /** Prepara il dialog conferma eliminazione entry storico (con validazione permessi). */
    const openDeleteChangeDialog = React.useCallback(
        (entry: any, historyIndex: number) => {
            if (!discussion?.noteId || !discussion?.customerCode) return;
            if (!canDeleteHistoryEntry(entry)) {
                enqueueSnackbar("Puoi eliminare solo modifiche create da te (o sei dev)", {
                    title: "Permessi",
                    type: "warning",
                });
                return;
            }

            setDeletingChange({
                noteId: discussion.noteId,
                historyIndex,
                customerCode: discussion.customerCode,
                ownerLabel: extractHistoryEntryUserLabel(entry),
                modifiedAt: extractHistoryEntryDate(entry),
                noteText: extractHistoryEntryNoteText(entry),
            });
        },
        [canDeleteHistoryEntry, discussion?.customerCode, discussion?.noteId]
    );

    /** Chiude dialog eliminazione modifica interrompendo eventuale request pendente. */
    const closeDeleteChangeDialog = React.useCallback(() => {
        if (deletingChangeLoading) return;
        deleteChangeAbortRef.current?.abort();
        setDeletingChange(null);
    }, [deletingChangeLoading]);

    /** Elimina una modifica dallo storico e riallinea lista + discussione locale. */
    const handleDeleteChange = React.useCallback(async () => {
        if (!deletingChange?.noteId || !Number.isInteger(deletingChange?.historyIndex)) return;
        if (deletingChangeLoading) return;

        deleteChangeAbortRef.current?.abort();
        const abortController = new AbortController();
        deleteChangeAbortRef.current = abortController;
        setDeletingChangeLoading(true);

        let attemptedRequest = false;
        try {
            attemptedRequest = true;
            const response = await deleteCustomerNoteHistoryChange({
                abortController,
                noteId: deletingChange.noteId,
                historyIndex: deletingChange.historyIndex,
                body: mutationBody,
            });

            const responseHistory = extractHistoryRows(response?.item);

            setDiscussion((prev) => {
                if (!prev || prev.noteId !== deletingChange.noteId) return prev;
                if (responseHistory.length) {
                    return {
                        ...prev,
                        history: responseHistory,
                    };
                }

                return {
                    ...prev,
                    history: prev.history.filter(
                        (_: any, index: number) => index !== deletingChange.historyIndex
                    ),
                };
            });

            setDeletingChange(null);
            enqueueSnackbar("Modifica eliminata con successo", {
                title: "OK",
                type: "success",
            });
            await fetchFirstPage();
        } catch (error: any) {
            if (error?.name !== "AbortError") {
                console.error(error);
            }
        } finally {
            if (deleteChangeAbortRef.current === abortController) {
                deleteChangeAbortRef.current = null;
            }
            setDeletingChangeLoading(false);
            if (attemptedRequest) {
                SendLogs(
                    userContext?.token,
                    "Edit Customer Note",
                    window.location.href.toString(),
                    null,
                    deletingChange.customerCode
                );
            }
        }
    }, [
        deletingChange,
        deletingChangeLoading,
        fetchFirstPage,
        mutationBody,
        userContext?.token,
    ]);

    /** API pubblica dell'hook: stato, selector, guardie permessi e action handlers. */
    return {
        rows,
        pagination,
        loadingInitial,
        loadingMore,
        sortPreset,
        setSortPreset,
        scopeFilter,
        setScopeFilter,
        searchText,
        setSearchText,
        summary,
        groupedNotes,
        requesterIdentityKeys,
        requesterLabel,

        loadStatus, changeLoadStatus,

        createDialogOpen,
        createNoteLoading,
        createCustomerCode,
        setCreateCustomerCode,
        setCreateCustomerSearch,
        createCustomerSearchLoading,
        createNoteType,
        setCreateNoteType,
        createNoteText,
        setCreateNoteText,
        loadingNoteTypes,
        noteTypeOptions,
        customerCodeOptions,

        discussion,
        discussionLoading,
        discussionText,
        setDiscussionText,
        savingDiscussion,
        canEditDiscussion,

        deletingNote,
        deletingNoteLoading,
        deletingChange,
        deletingChangeLoading,

        canManageAdministrativeNotes,
        canDeleteNoteRow,
        canDeleteHistoryEntry,
        canEditNote,

        fetchFirstPage,
        fetchMore,
        refreshDiscussion,

        openCreateDialog,
        closeCreateDialog,
        handleCreateNote,

        openDiscussion,
        closeDiscussion,
        handleAddDiscussionChange,

        openDeleteNoteDialog,
        closeDeleteNoteDialog,
        handleDeleteNote,

        openDeleteChangeDialog,
        closeDeleteChangeDialog,
        handleDeleteChange,
    };
}

export default useCustomerNotesManager;
