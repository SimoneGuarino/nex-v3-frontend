import React, { useEffect, useMemo, useRef, useState, useContext } from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import FiltersPanel, { type FilterValues } from "./components/FiltersPanel";
import { TableVirtualized } from "components/Virtualized/table";

import { fetchSelloutList, type SelloutFile } from "layouts/sellout/fetchdata/list";
import { UserContext } from "context/UserContext";
import { CheckAdminPermissions } from "utils/checkAdminPermissions";

import { triggerSelloutDownload } from "layouts/sellout/fetchdata/download";
import { approveSellout, rejectSellout } from "layouts/sellout/fetchdata/changeStatus";
import { uploadAlternativeCsv } from "layouts/sellout/fetchdata/uploadCsv";
import { enqueueSnackbar } from "components/MessageBox";

import ControlButtons from "./components/ControlButtons";
import UploadPanel from "./components/UploadPanel";

import { useSectionTour } from 'tour/useSectionTour';
import { Role } from 'tour/types';
import { useUserContext } from 'context/UserContext';


type ColumnDef = {
    label: string;
    key: string | string[];
    width?: number;
    maxWidth?: number;
};

function centerCell(content: React.ReactNode) {
    return (
        <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
            {content}
        </div>
    );
}

const isObjectIdLike = (v: unknown): v is string =>
    typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v);

const getMongoId = (row: SelloutFile): string | null => {
    const cand1 = (row as any)?._id;
    if (isObjectIdLike(cand1)) return cand1;
    const cand2 = (row as any)?.id;
    if (isObjectIdLike(cand2)) return cand2;
    return null;
};

function basename(p?: string | null): string {
    if (!p) return "";
    const parts = String(p).split(/[\\/]+/);
    return parts[parts.length - 1] || "";
}

// helpers UserContext
function pickUserEmail(userState: any): string | null {
    const candidates = [
        userState?.details?.email,
        userState?.details?.username,
        userState?.email,
        userState?.username,
        userState?.user?.email,
        userState?.user?.username,
    ];
    const found = candidates.find((v) => typeof v === "string" && v.trim() !== "");
    return found ? String(found).trim().toLowerCase() : null;
}
function pickUserRoleNum(userState: any): number | null {
    const candidates = [userState?.details?.ruolo, userState?.ruolo, userState?.role];
    for (const c of candidates) {
        const n = Number(c);
        if (Number.isFinite(n)) return n;
    }
    return null;
}
function pickPermissions(userState: any): any {
    return userState?.permissions ?? userState?.details?.permissions ?? {};
}
function isPrivilegedUser(userState: any): boolean {
    const userRoleStr = String(userState?.details?.ruolo ?? userState?.ruolo ?? userState?.role ?? "").trim();
    const permissions = pickPermissions(userState);
    let isAdminDev = false;
    try {
        isAdminDev = CheckAdminPermissions({
            userRole: userRoleStr,
            permissions,
            panelToCheck: "Sellout",
            where: 0,
        });
    } catch {
        isAdminDev = false;
    }
    const userRoleNum = pickUserRoleNum(userState);
    return isAdminDev || userRoleNum === 0 || userRoleNum === 1;
}

export function FileSellout() {
    const [rows, setRows] = useState<SelloutFile[]>([]);
    const [loading, setLoading] = useState<boolean>(false); // loader SOLO per prima pagina
    const [paging, setPaging] = useState<boolean>(false);   // flag per append senza smontare la tabella

    // 👇 paginazione
    const [ofs, setOfs] = useState<number>(0);
    const [limit] = useState<number>(50);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [nextOfs, setNextOfs] = useState<number | null>(0);
    const infiniteOffsetRef = useRef<number>(0); // richiesto dall’infiniteScroll del componente

    const ctx = useContext(UserContext);
    const userState = ctx?.[0] ?? null;

    const userEmail = useMemo(() => pickUserEmail(userState), [userState]);
    const userRoleNum = useMemo(() => pickUserRoleNum(userState), [userState]);
    const isAdminDev = useMemo(() => isPrivilegedUser(userState), [userState]);

    const [filters, setFilters] = useState<FilterValues>({
        prfor: null,
        anno: null,
        settimana: null,
        da: null,
        a: null,
        inviato: null,
    });

    const [busyId, setBusyId] = useState<string | number | null>(null);
    const [uploadedOkMap, setUploadedOkMap] = useState<Record<string, true>>({});

    const [uploadOpen, setUploadOpen] = useState(false);
    const [uploadRow, setUploadRow] = useState<SelloutFile | null>(null);
    const [selectedFile, setSelectedFile] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);

    const [columns, setColumns] = useState<ColumnDef[]>([
        { label: "Opzioni", key: "opzioni", width: 250 },
        { label: "Filename", key: "filename", width: 240 },
        { label: "Fornitore", key: "prfor", width: 140 },
        { label: "Settimana", key: "settimana", width: 110 },
        { label: "Anno", key: "anno", width: 100 },
        { label: "Data inizio", key: "data_inizio", width: 140 },
        { label: "Data fine", key: "data_fine", width: 140 },
        { label: "Data creazione", key: "data_creazione", width: 180 },
        { label: "Stato", key: "stato", width: 140 },
        { label: "Stato invio", key: "inviato", width: 120 },
        { label: "Mail destinatari", key: "mail_sellout", width: 300 },
    ]);

    const abortRef = useRef<AbortController | null>(null);
    const downloadAbortRef = useRef<AbortController | null>(null);
    const uploadAbortRef = useRef<AbortController | null>(null);


    //tour-system
    const [filtersOpen, setFiltersOpen] = useState(false);

    const [userContext] = useUserContext() as any;
    const tour = useSectionTour({
        id: 'nex_v2_sellout',
        version: '2.0.0',
        user: {
            id: userContext?.details?._id ?? '',
            role: (userContext?.details?.ruolo as Role) ?? 'Tester',
        },
        keys: 'sellout',
        actions: {
            1: () => { setFiltersOpen(false) },
            2: () => { setFiltersOpen(true) },
            8: () => { setFiltersOpen(true) },
            9: () => { setFiltersOpen(false) },
        }
    });

    type CloseReason = "clickAway" | "escapeKeyDown" | "backdropClick" | "itemClick";

    const shouldIgnoreClose = (reason?: CloseReason) => {
        if (!tour.isOpen) return false;
        if (!reason) return false;
        return (
            reason === "backdropClick" ||
            reason === "clickAway" ||
            reason === "escapeKeyDown"
        );
    };
    //

    // filtro FE: se non admin/dev, mostra solo righe dove mail contiene userEmail
    const filterRowsForUser = React.useCallback(
        (list: SelloutFile[], email: string | null, privileged: boolean): SelloutFile[] => {
            if (privileged) return list;
            if (!email) return [];
            const e = email.toLowerCase();
            return list.filter((r) => Array.isArray(r.mail_sellout) && r.mail_sellout.includes(e));
        },
        []
    );

    // ------ fetch pagina (riutilizzabile per prima pagina e paginate) ------
    const fetchPage = React.useCallback(
        async (pageOfs: number, append: boolean) => {
            // loader visivo SOLO alla prima pagina; per append usiamo paging
            if (!append) setLoading(true);
            if (append) setPaging(true);

            try {
                const params: any = {
                    ofs: pageOfs,
                    lim: limit,
                    userEmail: userEmail ?? undefined,
                    userRole: userRoleNum ?? undefined,
                    isPrivileged: isAdminDev ? 1 : undefined
                };

                // filtri attivi
                if (filters.prfor) params.prfor = filters.prfor;
                if (filters.anno) params.anno = Number(filters.anno);
                if (filters.settimana) params.settimana = Number(filters.settimana);
                if (filters.inviato) params.inviato = filters.inviato;
                if (filters.da) params.data_inizio = filters.da;
                if (filters.a) params.data_fine = filters.a;

                const res = await fetchSelloutList(params, abortRef);
                if (!res.ok) {
                    console.error(res.error || "Errore nel recupero della lista");
                    if (!append) setRows([]);
                    setHasMore(false);
                    setNextOfs(null);
                    return;
                }

                const privilegedFromServer = Boolean(res.meta?.isPrivileged);
                const serverAppliedFilter = Boolean(res.meta?.appliedEmailFilter);
                const serverAppliedBuyerFilter = Boolean(res.meta?.appliedBuyerFilter); // nuovo: dati dal BE - serve per autorizzare i buyer con codice buyer a visionare i dati relativi al codice
                const effectivePrivileged = privilegedFromServer || isAdminDev;

                // Retrocompatibilità:
                // - se il BE ha già applicato filtro buyer, NON rifiltrare lato FE per email
                // - altrimenti mantieni comportamento legacy invariato (aggiunto serverAppliedBuyerFilter)
                const batch = (res.files || []) as SelloutFile[];
                const safeBatch =
                    effectivePrivileged || serverAppliedFilter || serverAppliedBuyerFilter
                        ? batch
                        : filterRowsForUser(batch, userEmail ?? null, false);

                setRows(prev => append ? [...prev, ...safeBatch] : safeBatch);

                // aggiorna meta paginazione
                setHasMore(Boolean(res.meta?.hasMore));
                setNextOfs(res.meta?.next_ofs ?? null);
                setOfs(res.meta?.ofs ?? pageOfs);
            } catch (e) {
                console.error(e);
                if (!append) setRows([]);
                setHasMore(false);
                setNextOfs(null);
            } finally {
                if (!append) setLoading(false);
                if (append) setPaging(false);
            }
        },
        [filters, userEmail, userRoleNum, isAdminDev, limit, filterRowsForUser]
    );

    // ------ prima pagina al mount e quando cambia il contesto utente ------
    useEffect(() => {
        // reset paginazione
        setRows([]);
        setOfs(0);
        setNextOfs(0);
        setHasMore(true);
        infiniteOffsetRef.current = 0;

        fetchPage(0, false);

        return () => {
            abortRef.current?.abort();
            downloadAbortRef.current?.abort();
            uploadAbortRef.current?.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userEmail, userRoleNum, isAdminDev]);

    // ------ applica filtri: ricarica da pagina 0 ------
    const applyFilters = React.useCallback(
        async (fv: FilterValues) => {
            setFilters(fv);
            // reset e prima pagina
            setRows([]);
            setOfs(0);
            setNextOfs(0);
            setHasMore(true);
            infiniteOffsetRef.current = 0;
            await fetchPage(0, false);
        },
        [fetchPage]
    );

    const resetFilters = React.useCallback(async () => {
        const empty: FilterValues = { prfor: null, anno: null, settimana: null, da: null, a: null, inviato: null };
        setFilters(empty);
        setRows([]);
        setOfs(0);
        setNextOfs(0);
        setHasMore(true);
        infiniteOffsetRef.current = 0;
        await fetchPage(0, false);
    }, [fetchPage]);

    // ------ infinite scroll: carica la pagina successiva ------
    const loadNextPage = React.useCallback(async (): Promise<boolean> => {
        if (loading || paging) return false;        // evita richieste multiple e, soprattutto, il jump
        if (!hasMore || nextOfs == null) return false;
        await fetchPage(nextOfs, true);
        return true;
    }, [loading, paging, hasMore, nextOfs, fetchPage]);

    const formatDateLike = React.useCallback((text: string | null) => {
        if (!text) return text;
        const d = new Date(text);
        if (isNaN(+d)) return text;
        return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
    }, []);

    const handleDownload = React.useCallback(async (row: SelloutFile, e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const id = (row as any)?._id ?? (row as any)?.id;
        if (id == null) {
            console.warn("Nessun id disponibile per il download", row);
            return;
        }
        try {
            await triggerSelloutDownload(id as any, downloadAbortRef);
        } catch (err) {
            console.error("Download fallito:", err);
        }
    }, []);

    const handleApprove = React.useCallback(async (row: SelloutFile, e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const mongoId = getMongoId(row);
        if (!mongoId) {
            console.warn("Approve: id Mongo mancante o non valido.");
            return;
        }
        try {
            setBusyId(mongoId);
            const res = await approveSellout(mongoId, abortRef);
            if (!res.ok) {
                console.error(res.error || "Cambio stato (approva) fallito");
                enqueueSnackbar(res.error || "Errore nell'approvazione", { type: "error", title: "Approva" });
                return;
            }
            setRows((prev) =>
                prev.map((r) => {
                    const rid = getMongoId(r) ?? (r as any)?.id;
                    if (rid !== mongoId) return r;
                    const sentOk = Boolean((res as any)?.upload?.sent === true);
                    return { ...(r as SelloutFile), stato: "Approvato", ...(sentOk ? { inviato: "S" } : {}) };
                })
            );
            setUploadedOkMap((prev) => {
                const { [mongoId]: _, ...rest } = prev;
                return rest;
            });
            enqueueSnackbar("File approvato", { type: "success", title: "Approva" });
        } catch (err: any) {
            console.error(err);
            enqueueSnackbar(err?.message || "Errore inatteso", { type: "error", title: "Approva" });
        } finally {
            setBusyId(null);
        }
    }, []);

    const handleReject = React.useCallback(async (row: SelloutFile, e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const mongoId = getMongoId(row);
        if (!mongoId) {
            console.warn("Reject: id Mongo mancante o non valido.");
            return;
        }
        try {
            setBusyId(mongoId);
            const res = await rejectSellout(mongoId, abortRef);
            if (!res.ok) {
                console.error(res.error || "Cambio stato (boccia) fallito");
                enqueueSnackbar(res.error || "Errore nella bocciatura", { type: "error", title: "Boccia" });
                return;
            }
            setRows((prev) =>
                prev.map((r) => {
                    const rid = getMongoId(r) ?? (r as any)?.id;
                    return rid === mongoId ? { ...(r as SelloutFile), stato: "Bocciato" } : r;
                })
            );
            enqueueSnackbar("File bocciato", { type: "warning", title: "Boccia" });
        } catch (err: any) {
            console.error(err);
            enqueueSnackbar(err?.message || "Errore inatteso", { type: "error", title: "Boccia" });
        } finally {
            setBusyId(null);
        }
    }, []);

    const handleUploadClick = React.useCallback((row: SelloutFile, e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const mongoId = getMongoId(row);
        const stato = String(row.stato || "");
        if (!mongoId || stato !== "Bocciato") {
            enqueueSnackbar("Upload disponibile solo per file Bocciati (Mongo).", { type: "info", title: "Upload CSV" });
            return;
        }
        setUploadRow(row);
        setSelectedFile([]);
        setUploadOpen(true);
    }, []);

    const handleUploadSubmit = React.useCallback(async () => {
        if (!uploadRow) return;
        const mongoId = getMongoId(uploadRow);
        if (!mongoId) {
            enqueueSnackbar("Id Mongo non valido.", { type: "error", title: "Upload CSV" });
            return;
        }
        if (selectedFile.length !== 1) {
            enqueueSnackbar("Seleziona un solo file .csv.", { type: "error", title: "Upload CSV" });
            return;
        }
        const f = selectedFile[0];
        if (!f.name.toLowerCase().endsWith(".csv")) {
            enqueueSnackbar("Sono accettati solo file .csv.", { type: "error", title: "Upload CSV" });
            return;
        }
        const expectedName = basename((uploadRow as any).filename);
        if (!expectedName) {
            enqueueSnackbar("Nome atteso non disponibile (filename mancante).", { type: "error", title: "Upload CSV" });
            return;
        }
        if (f.name !== expectedName) {
            enqueueSnackbar(`Il nome del file deve essere "${expectedName}".`, { type: "error", title: "Upload CSV" });
            return;
        }

        try {
            setUploading(true);
            const res = await uploadAlternativeCsv(mongoId, f, uploadAbortRef);
            if (!res.ok) {
                enqueueSnackbar(res.error || "Upload fallito", { type: "error", title: "Upload CSV" });
                return;
            }
            if (res.saved) {
                setRows((prev) =>
                    prev.map((r) => {
                        const rid = getMongoId(r) ?? (r as any)?.id;
                        if (rid === mongoId) return { ...(r as SelloutFile), filepath: res.saved } as SelloutFile;
                        return r;
                    })
                );
            }
            setUploadedOkMap((prev) => ({ ...prev, [mongoId]: true }));
            enqueueSnackbar(res.message || "CSV caricato correttamente.", { type: "success", title: "Upload CSV" });
            setUploadOpen(false);
            setUploadRow(null);
            setSelectedFile([]);
        } catch (err: any) {
            console.error(err);
            enqueueSnackbar(err?.message || "Errore inatteso", { type: "error", title: "Upload CSV" });
        } finally {
            setUploading(false);
        }
    }, [uploadRow, selectedFile]);

    const tableData = useMemo(() => {
        return rows.map((r) => {
            const data_inizio = formatDateLike(r.data_inizio);
            const data_fine = formatDateLike(r.data_fine);
            const data_creazione = formatDateLike(r.data_creazione);
            const inviatoTxt = r.inviato === "S" ? "Inviato" : "Non inviato";
            const statoTxt = r.stato ?? "-";
            const rid = (getMongoId(r) ?? (r as any)?.id) as string | number | null;
            const busy = busyId != null && busyId === rid;

            const mongoId = getMongoId(r);
            const uploadedOk = !!(mongoId && uploadedOkMap[mongoId]);

            const mailJoined = Array.isArray(r.mail_sellout) && r.mail_sellout.length ? r.mail_sellout.join(", ") : "-";

            return {
                ...r,
                opzioni: centerCell(
                    <ControlButtons
                        row={r}
                        onDownload={handleDownload}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onUploadClick={handleUploadClick}
                        busy={busy}
                        uploadedOk={uploadedOk}
                    />
                ),
                filename: centerCell(r.filename ?? ""),
                prfor: centerCell(r.prfor ?? ""),
                settimana: centerCell(r.settimana ?? ""),
                anno: centerCell(r.anno ?? ""),
                data_inizio: centerCell(data_inizio ?? ""),
                data_fine: centerCell(data_fine ?? ""),
                data_creazione: centerCell(data_creazione ?? ""),
                stato: centerCell(statoTxt),
                inviato: centerCell(inviatoTxt),
                mail_sellout: centerCell(mailJoined),
            };
        });
    }, [rows, formatDateLike, handleDownload, handleApprove, handleReject, handleUploadClick, busyId, uploadedOkMap]);

    return (
        <DashboardLayout>
            <FiltersPanel values={filters} onChange={setFilters} onApply={applyFilters} onReset={resetFilters} open={filtersOpen} onOpenChange={setFiltersOpen} shouldIgnoreClose={shouldIgnoreClose} />
            <div className="mt-5 h-full">
                <TableVirtualized
                    data={tableData}
                    setData={setRows as any}
                    columns={columns as any}
                    setColumns={setColumns as any}
                    loadStatus={loading} // solo per prima pagina, così non smontiamo la tabella durante l'append
                    results={hasMore ? rows.length + 1 : rows.length} // ferma il trigger quando non c'è più nulla
                    tableType="bottom-line"
                    cookie="sellout_table_visible_columns"
                    className="h-full"
                    minColWidth={100}
                    lastDateDist={undefined}
                    footerSettings={{ showColSettings: true, showResults: true }}
                    // 👇 abilita infinite scroll: chiama il backend quando arrivi in fondo
                    infiniteScroll={{
                        func: async () => {
                            const ok = await loadNextPage();
                            if (ok && typeof infiniteOffsetRef.current === "number") {
                                infiniteOffsetRef.current += 1; // per il componente (non usato altrove)
                            }
                            return ok;
                        },
                        offset: infiniteOffsetRef
                    }}
                />
            </div>

            <UploadPanel
                open={uploadOpen}
                row={uploadRow}
                uploading={uploading}
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
                onClose={() => {
                    if (!uploading) {
                        setUploadOpen(false);
                        setUploadRow(null);
                        setSelectedFile([]);
                    }
                }}
                onSubmit={handleUploadSubmit}
            />
        </DashboardLayout>
    );
}

export default FileSellout;
