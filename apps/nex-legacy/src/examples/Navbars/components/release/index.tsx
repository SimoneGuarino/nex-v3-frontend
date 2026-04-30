// release/index.tsx
import React from "react";
import {
    Stack, IconButton, Divider,
    Menu, MenuItem, ListItemIcon, ListItemText
} from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { MainTheme } from "assets/settingsTheme";
import MDTypography from "components/MDTypography";
import { LoadScreen } from "components/Load";
import {
    LoadReleaseNotesPubblicheAPI, LoadReleaseNotesBozzeAPI,
    normalizeReleaseNotesDatesMany, ReleaseNote, ReleaseNoteAPI
} from "./fetchdata/getReleaseNotes";
import { useUserContext } from "context/UserContext";
import { icon_back } from "config/icons";
import ReleaseCard from "./components/ReleaseCard";
import ReleaseDetailsModal from "./components/ReleaseDetailsModal";
import FDBox from "components/UI/box/FDBox";
import { FDBackdrop } from "components/UI/box/FDBackdrop";
import { LazyMotion, domAnimation, m } from "framer-motion";
import FDButton from "components/UI/buttons/FDButton";
import FDIconButton from "components/UI/buttons/FDIconButton";
//icons components
import { IoCloseSharp, IoNewspaperOutline } from "react-icons/io5";
import { useNexTheme } from "@nex/theme-system";

const CloseIcon = IoCloseSharp as React.FC<{ size?: number, className?: string }>;
const NewspaperIcon = IoNewspaperOutline as React.FC<{ size?: number, className?: string }>;


type DateFilter = "none" | "7" | "30";
type ViewKind = "pubbliche" | "bozze";
const paletteOf = () => MainTheme().palette;
const dateFilterLabel: Record<DateFilter, string> = {
    none: "Tutto", "7": "Ultimi 7g", "30": "Ultimi 30g"
};
const ease = [0.2, 0.8, 0.2, 1];

function effectiveDateOf(n: ReleaseNote): Date {
    return (n.dataUltimaModifica ?? n.dataCreazione) as Date;
}
function sortDescByEffectiveDate(a: ReleaseNote, b: ReleaseNote) {
    return +effectiveDateOf(b) - +effectiveDateOf(a);
}
function normalizeManyIfNeeded(
    data: ReleaseNoteAPI[] | ReleaseNote[],
    parseDates: boolean
): ReleaseNote[] {
    if (!parseDates) return normalizeReleaseNotesDatesMany(data as ReleaseNoteAPI[]);
    return data as ReleaseNote[];
}

const ReleaseNotesPanel: React.FC<{ onClose: () => void; openReleaseNotes: boolean }> =
    ({ onClose, openReleaseNotes }) => {
        const { preferences } = useNexTheme();
        const darkMode = preferences.mode === "dark";
        const palette = paletteOf();

        const [userState] = useUserContext();
        const isDev = String(userState?.details?.ruolo || "").trim().toLowerCase() === "dev";

        const [view, setView] = React.useState<ViewKind>("pubbliche");
        const [pubbliche, setPubbliche] = React.useState<ReleaseNote[]>([{
            "id": "68b98a9f425055bd590aa895",
            descrizione: "Prima versione stabile di NEX.",
            "titolo": "Rilascio NEX v2",
            "versione": "1.0.0",
            "dataCreazione": new Date(),
            "dataUltimaModifica": new Date("2025-09-04T00:00:02.025Z"),
            "tags": "Release",
            "visibilita": "Pubblico",
            "targetUtenti": ["dev"],
            "contenuto": "<h2>novità</h2><ul><li>prima versione stabile</li></ul>"
        }]);
        const [bozze, setBozze] = React.useState<ReleaseNote[]>([]);
        const [loading, setLoading] = React.useState<boolean>(false);

        const [search, setSearch] = React.useState<string>("");
        const deferredSearch = React.useDeferredValue(search);
        const [dateFilter, setDateFilter] = React.useState<DateFilter>("none");

        const [anchorFilter, setAnchorFilter] = React.useState<null | HTMLElement>(null);
        const openFilter = Boolean(anchorFilter);
        const handleOpenFilterMenu = (e: React.MouseEvent<HTMLElement>) => setAnchorFilter(e.currentTarget);
        const handleCloseFilterMenu = () => setAnchorFilter(null);
        const setFilterAndClose = (v: DateFilter) => { setDateFilter(v); handleCloseFilterMenu(); };

        const [selected, setSelected] = React.useState<ReleaseNote | null>(null);
        const abortRef = React.useRef<AbortController | null>(null);

        const getId = (o: any): string => {
            const raw = o?.id ?? (typeof o?._id === "string" ? o._id : o?._id?.$oid);
            return typeof raw === "string" ? raw : "";
        };
        const toDateOr = (val: any, fallback: Date): Date => {
            if (val instanceof Date) return val;
            if (typeof val === "string" && val) {
                const d = new Date(val); return isNaN(+d) ? fallback : d;
            }
            return fallback;
        };

        const mergeWithExisting = React.useCallback(
            (patch: Partial<ReleaseNoteAPI | ReleaseNote>): ReleaseNote => {
                const id = getId(patch);
                const existing =
                    (pubbliche || []).find((x) => getId(x) === id) ||
                    (bozze || []).find((x) => getId(x) === id) ||
                    selected;

                const base: ReleaseNote = existing || {
                    id, titolo: "", versione: "", descrizione: null,
                    dataCreazione: new Date(), dataUltimaModifica: new Date(),
                    tags: "Release", visibilita: "Bozza", targetUtenti: [], contenuto: "",
                };

                return {
                    id: id || base.id,
                    titolo: (patch as any).titolo ?? base.titolo,
                    versione: (patch as any).versione ?? base.versione,
                    descrizione: (patch as any).descrizione !== undefined ? (patch as any).descrizione : base.descrizione,
                    dataCreazione: toDateOr((patch as any).dataCreazione, base.dataCreazione),
                    dataUltimaModifica: (patch as any).dataUltimaModifica !== undefined
                        ? toDateOr((patch as any).dataUltimaModifica, base.dataUltimaModifica || base.dataCreazione)
                        : base.dataUltimaModifica || base.dataCreazione,
                    tags: (patch as any).tags ?? base.tags,
                    visibilita: (patch as any).visibilita ?? base.visibilita,
                    targetUtenti: (patch as any).targetUtenti ?? base.targetUtenti,
                    contenuto: (patch as any).contenuto ?? base.contenuto,
                };
            },
            [pubbliche, bozze, selected]
        );

        React.useEffect(() => {
            let alive = true;
            setLoading(true);
            LoadReleaseNotesPubblicheAPI({
                abortLike: abortRef, parseDates: true,
                onComplete: (res) => {
                    if (!alive) return;
                    const items = res ? normalizeManyIfNeeded(res, true).sort(sortDescByEffectiveDate) : [];
                    setPubbliche(items);
                }
            });
            LoadReleaseNotesBozzeAPI({
                abortLike: abortRef, parseDates: true,
                onComplete: (res) => {
                    if (!alive) return;
                    const items = res ? normalizeManyIfNeeded(res, true).sort(sortDescByEffectiveDate) : [];
                    setBozze(items);
                    setLoading(false);
                }
            });
            return () => { alive = false; abortRef.current?.abort(); };
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        const filtered = React.useMemo(() => {
            const data = view === "pubbliche" ? pubbliche : bozze;
            if (!data) return [];
            const q = deferredSearch.trim().toLowerCase();

            const now = new Date();
            const minDate =
                dateFilter === "7" ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) :
                    dateFilter === "30" ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) : null;

            return data.filter((n) => {
                if (minDate) {
                    const when = effectiveDateOf(n);
                    if (when < minDate) return false;
                }
                if (!q) return true;
                const titolo = (n.titolo ?? "").toLowerCase();
                const versione = (n.versione ?? "").toLowerCase();
                const tag = String(n.tags ?? "").toLowerCase();
                return tag.startsWith(q) || titolo.includes(q) || versione.includes(q);
            }).sort(sortDescByEffectiveDate);
        }, [pubbliche, bozze, view, deferredSearch, dateFilter]);

        const handleVisibilityUpdated = React.useCallback((patch: Partial<ReleaseNoteAPI | ReleaseNote>) => {
            const merged = mergeWithExisting(patch);
            const idFromPatch = getId(patch);
            const idFromMerged = getId(merged);
            const idsToRemove = new Set([idFromPatch, idFromMerged].filter(Boolean));
            const vis = String((merged as any).visibilita).toLowerCase() === "pubblico" ? "Pubblico" : "Bozza";

            setPubbliche((prev: any) => {
                const without = prev.filter((x: any) => !idsToRemove.has(getId(x)));
                return vis === "Pubblico" ? [{ ...merged, visibilita: "Pubblico" }, ...without].sort(sortDescByEffectiveDate) : without;
            });
            setBozze((prev: any) => {
                const without = prev.filter((x: any) => !idsToRemove.has(getId(x)));
                return vis === "Bozza" ? [{ ...merged, visibilita: "Bozza" }, ...without].sort(sortDescByEffectiveDate) : without;
            });
            setSelected(null);
        }, [mergeWithExisting]);

        return (
            <div className="fixed inset-0 z-10">
                <FDBackdrop onClick={onClose} passThrough={!openReleaseNotes} />
                <LazyMotion features={domAnimation}>
                    {/* Shell con hero gradient */}
                    <FDBox
                        radius="xl"
                        className="fixed z-10 w-[min(1100px,92vw)] h-[min(88vh,980px)] top-1/2 left-1/2 
                        -translate-x-1/2 -translate-y-1/2 overflow-hidden"
                    >
                        <div
                            className="relative h-full w-full"
                            style={{
                                background:
                                    "radial-gradient(1200px 500px at 20% -20%, rgba(0, 153, 255, 0.95), transparent 60%)," +
                                    "radial-gradient(1200px 600px at 120% -20%, rgba(55, 0, 255, 0.94), transparent 60%)," +
                                    (darkMode ? "#0B0B0C" : "#dfdfdfff"),
                            }}
                        >
                            {/* header */}
                            <div className="relative">
                                <div className="absolute inset-0 top-[-40%] blur-2xl opacity-70 pointer-events-none"
                                    style={{ background: "conic-gradient(from 45deg, rgba(34, 174, 255, 0.35), rgba(236,72,153,.35), rgba(0, 255, 242, 0.59))" }} />
                                <div className="flex relative px-5 sm:px-8 pt-6 pb-5 border-b border-neutral-400/90 dark:border-neutral-700">
                                    {view === "bozze" && (
                                        <IconButton onClick={() => setView("pubbliche")} sx={{ mr: 0.5 }}>
                                            {icon_back()}
                                        </IconButton>
                                    )}

                                    <h1 className="text-4xl dark:text-gray-200 text-gray-700 pl-4 font-extrabold px-5 sm:px-8 select-none">
                                        <NewspaperIcon className="inline-block mr-2 mb-0.5" />{view === "pubbliche" ? "Release Notes" : "Bozze"}
                                    </h1>

                                    <FDIconButton className="ml-auto h-fit" onClick={onClose} icon={<CloseIcon />} />
                                </div>
                            </div>

                            {/* content */}
                            {loading ? (
                                <LoadScreen />
                            ) : filtered.length ? (
                                <div
                                    className="h-full overflow-auto px-4 sm:px-6 py-6 space-y-6"
                                    style={{ contentVisibility: "auto", containIntrinsicSize: "800px" }}
                                >
                                    {filtered.map((n, i) => (
                                        <m.div
                                            key={getId(n)}
                                            initial={{ opacity: 0, y: 12 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true, amount: 0.3 }}
                                            transition={{ duration: 0.35, ease: (ease as any), delay: Math.min(i, 6) * 0.02 }}
                                        >
                                            <ReleaseCard
                                                note={n}
                                                onClick={() => setSelected(n)}
                                                palette={palette}
                                            />
                                            {i < filtered.length - 1 && <Divider sx={{ opacity: 0.08 }} />}
                                        </m.div>
                                    ))}
                                    <div className="h-2" />
                                </div>
                            ) : (
                                <Stack
                                    justifyContent="center"
                                    sx={{ alignItems: "center", filter: "grayscale(1)", opacity: 0.65, height: "calc(100% - 148px)" }}
                                >
                                    <MDTypography component="h3" sx={{ fontWeight: "normal", textAlign: "center", fontSize: "1em", maxWidth: "60%" }}>
                                        Nessuna release note trovata con i filtri correnti.
                                    </MDTypography>
                                </Stack>
                            )}

                            {isDev && (
                                <FDButton
                                    size="small" variant="outline" color={!darkMode ? "light" : "dark"}
                                    onClick={() => setView(view === "pubbliche" ? "bozze" : "pubbliche")}
                                    className="absolute bottom-5 right-5 z-10"
                                >
                                    {view === "pubbliche" ? "Bozze" : "Pubbliche"}
                                </FDButton>
                            )}

                            {/* menu filtri (mobile) */}
                            <Menu
                                anchorEl={anchorFilter} open={openFilter} onClose={handleCloseFilterMenu}
                                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                transformOrigin={{ vertical: "top", horizontal: "right" }} keepMounted
                            >
                                <MenuItem onClick={() => setFilterAndClose("none")}>
                                    <ListItemIcon sx={{ minWidth: 28 }}>{dateFilter === "none" ? <CheckRoundedIcon fontSize="small" /> : null}</ListItemIcon>
                                    <ListItemText>{dateFilterLabel.none}</ListItemText>
                                </MenuItem>
                                <MenuItem onClick={() => setFilterAndClose("7")}>
                                    <ListItemIcon sx={{ minWidth: 28 }}>{dateFilter === "7" ? <CheckRoundedIcon fontSize="small" /> : null}</ListItemIcon>
                                    <ListItemText>{dateFilterLabel["7"]}</ListItemText>
                                </MenuItem>
                                <MenuItem onClick={() => setFilterAndClose("30")}>
                                    <ListItemIcon sx={{ minWidth: 28 }}>{dateFilter === "30" ? <CheckRoundedIcon fontSize="small" /> : null}</ListItemIcon>
                                    <ListItemText>{dateFilterLabel["30"]}</ListItemText>
                                </MenuItem>
                            </Menu>
                        </div>
                    </FDBox>
                </LazyMotion>

                {/* modal dettagli */}
                <ReleaseDetailsModal
                    open={!!selected} note={selected}
                    onClose={() => setSelected(null)}
                    onVisibilityUpdated={handleVisibilityUpdated}
                />
            </div>
        );
    };
export default ReleaseNotesPanel;
