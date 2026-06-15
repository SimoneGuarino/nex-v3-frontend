import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, LazyMotion, domAnimation } from "framer-motion";

// context
import { useUserContext } from "context/UserContext";
import { enqueueSnackbar } from "components/MessageBox";

// components
import { FDBox, FDIconButton, FDButton, FDBackdrop } from "@nex/fd-ui";
import { Tag } from "components/Tag/Tag";

// icons
import { IoCloseSharp } from "react-icons/io5";
import type { ReleaseNote, ReleaseNoteAPI } from "../fetchdata/getReleaseNotes";
import { ToggleReleaseNoteVisibilitaAPI } from "../fetchdata/updateReleaseNotes";

const CloseIcon = IoCloseSharp as React.FC<{ size?: number; className?: string }>;

function useLockBodyScroll(active: boolean) {
    React.useEffect(() => {
        if (!active) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [active]);
}

const panelVariants = {
    hidden: { opacity: 0, y: 24, scale: 0.98 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 360, damping: 32, mass: 0.8 },
    },
    exit: { opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.18, ease: "easeOut" } },
};

// overlay scroll
const wrapperClass =
    "fixed inset-0 z-[1000] grid items-start sm:items-center justify-items-center p-4 sm:p-6 overflow-y-auto overscroll-contain [--fd-modal-w:theme(spacing.11)]";

/* ===========================================
   risoluzione asset per CRA/Webpack (no Vite)
   - raccogliamo file in src/assets/**
   - alias webpack richiesto: assets -> src/assets
=========================================== */
const IMAGES = import.meta.glob(
  "/src/assets/**/*.{png,jpg,jpeg,gif,svg,webp,avif}",
  {
    eager: true,
    import: "default",
    query: "?url",
  }
) as Record<string, string>;

const imageEntries = Object.entries(IMAGES);

export function getImageByFileName(fileName: string): string | undefined {
  return imageEntries.find(([path]) => path.endsWith(`/${fileName}`))?.[1];
}

function resolveAssetUrl(input: string): string {
    if (!input) return input;
    if (/^(https?:|data:|mailto:|tel:|#)/i.test(input)) return input;

    // normalizza: accettiamo "assets/..." o "src/assets/..."
    let rel = input.replace(/^\/+/, "");
    if (!/^src\/assets\//.test(rel) && !/^assets\//.test(rel)) return input;

    rel = rel.replace(/^src\//, ""); // -> inizia con "assets/"
    const key = "./" + rel.replace(/^assets\//, ""); // context usa chiavi "./..."

    try {
        const url = getImageByFileName(key);
        return url || input;
    } catch {
        return input; // fallback: lascio com'è (utile per debuggare in Network)
    }
}

function rewriteHtmlAssets(html: string): string {
    if (!html) return html;
    if (typeof document === "undefined") return html; // SSR-safe

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;

    // <img|source src>
    wrapper.querySelectorAll<HTMLImageElement | HTMLSourceElement>("img[src], source[src]").forEach((el) => {
        const src = el.getAttribute("src");
        if (!src) return;
        const resolved = resolveAssetUrl(src);
        if (resolved !== src) el.setAttribute("src", resolved);
    });

    // srcset
    wrapper.querySelectorAll<HTMLImageElement | HTMLSourceElement>("img[srcset], source[srcset]").forEach((el) => {
        const srcset = el.getAttribute("srcset");
        if (!srcset) return;
        const rewritten = srcset
            .split(",")
            .map((part) => {
                const trimmed = part.trim();
                if (!trimmed) return trimmed;
                const [url, descriptor] = trimmed.split(/\s+/, 2);
                const resolved = resolveAssetUrl(url);
                return descriptor ? `${resolved} ${descriptor}` : resolved;
            })
            .join(", ");
        el.setAttribute("srcset", rewritten);
    });

    // inline style background-image
    wrapper.querySelectorAll<HTMLElement>("[style*='url(']").forEach((el) => {
        const style = el.getAttribute("style");
        if (!style) return;
        const rewritten = style.replace(
            /url\((['"]?)(?!https?:|data:|#)(\/?)([^'")]+)\1\)/gi,
            (_m, q, _s, path) => {
                const resolved = resolveAssetUrl(path);
                const quote = q || "";
                return `url(${quote}${resolved}${quote})`;
            }
        );
        if (rewritten !== style) el.setAttribute("style", rewritten);
    });

    return wrapper.innerHTML;
}

/* ===========================================
   enhancement del contenuto iniettato (riusabile)
   - grid-shot -> classi responsive
   - lightbox con <dialog id="fd-lightbox"> (autocrea se manca)
=========================================== */
type EnhanceOptions = {
    zoomAttr?: string;      // attributo per abilitare lo zoom sulle img
    gridShotClass?: string; // classe sentinella per i layout griglia
    lightboxId?: string;
};

function useInjectedHtmlEnhancements(
    rootRef: React.RefObject<HTMLDivElement>,
    options: EnhanceOptions,
    deps: any[]
) {
    const {
        zoomAttr = "data-zoom",
        gridShotClass = "grid-shot",
        lightboxId = "fd-lightbox",
    } = options;

    React.useEffect(() => {
        const root = rootRef.current;
        if (!root) return;

        // grid-shot → layout responsive
        root.querySelectorAll<HTMLElement>(`.${gridShotClass}`).forEach((el) => {
            el.classList.add("grid", "gap-3", "sm:grid-cols-2");
        });

        // lightbox: assicurati che il dialog esista (o crealo), poi lavora con una ref non-nullable
        let dlg = root.querySelector<HTMLDialogElement>(`#${lightboxId}`);
        if (!dlg) {
            dlg = document.createElement("dialog");
            dlg.id = lightboxId;
            dlg.className = "backdrop:bg-black/80 rounded-xl open:backdrop:backdrop-blur-sm p-0 place-self-center";
            dlg.innerHTML = `
                <div class="relative">
                  <img alt="" src="" class="max-h-[85vh] max-w-[90vw] object-contain">
                  <form method="dialog">
                    <button
                      class="absolute right-2 top-2 rounded-md bg-slate-900/90 px-2 py-1 text-xs font-medium text-slate-200 bg-red-400 shadow hover:bg-slate-900">
                      Chiudi ✕
                    </button>
                  </form>
                </div>`;
            root.appendChild(dlg);
        }
        const dialog = dlg as HTMLDialogElement;
        const dlgImg = dialog.querySelector<HTMLImageElement>("img");

        // collega click su immagini con l'attributo `zoomAttr`
        const imgHandlers: Array<{ el: HTMLImageElement; fn: (e: Event) => void }> = [];
        root.querySelectorAll<HTMLImageElement>(`img[${zoomAttr}]`).forEach((img) => {
            const onClick = () => {
                if (!dlgImg) return;
                dlgImg.src = (img as any).currentSrc || img.src;
                dlgImg.alt = img.alt || "";
                if (typeof (dialog as any).showModal === "function") dialog.showModal();
                else dialog.setAttribute("open", "true");
            };
            img.addEventListener("click", onClick);
            imgHandlers.push({ el: img, fn: onClick });
        });

        // chiusura al click fuori dall'immagine
        const onDlgClick = (e: MouseEvent) => {
            if (!dlgImg) return;
            const r = dlgImg.getBoundingClientRect();
            const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
            if (!inside) dialog.close();
        };
        dialog.addEventListener("click", onDlgClick);

        // cleanup
        return () => {
            imgHandlers.forEach(({ el, fn }) => el.removeEventListener("click", fn));
            dialog.removeEventListener("click", onDlgClick);
            // se vuoi rimuovere il dialog creato ad-hoc ad ogni smontaggio:
            // dialog.remove();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}

/* ===========================================
   componente
=========================================== */
const ReleaseDetailsModal: React.FC<{
    open: boolean;
    note: ReleaseNote | ReleaseNoteAPI | null;
    onClose: () => void;
    onVisibilityUpdated?: (updated: ReleaseNote) => void;
    loading?: boolean;
}> = ({ open, note, onClose, onVisibilityUpdated, loading = false }) => {
    const [userState] = useUserContext();
    const isDev = (userState?.details?.ruolo || "").toString().toLowerCase().trim() === "dev";

    const [saving, setSaving] = React.useState(false);
    const abortRef = React.useRef<AbortController | null>(null);
    const panelRef = React.useRef<HTMLDivElement | null>(null);
    const contentRef = React.useRef<HTMLDivElement | null>(null);

    const canToggle = isDev && !!note?.id;
    const isBozza = note?.visibilita === "Bozza";

    useLockBodyScroll(open);

    React.useEffect(() => {
        if (open && panelRef.current) panelRef.current.focus();
    }, [open]);

    React.useEffect(() => {
        setSaving(false);
    }, [note?.id]);

    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (!open) return;
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    const handleToggle = async () => {
        if (!note?.id || !canToggle || saving) return;
        setSaving(true);
        if (!abortRef.current) abortRef.current = new AbortController();
        const updated = await ToggleReleaseNoteVisibilitaAPI({
            id: note.id,
            abortLike: abortRef,
            parseDates: true,
        });
        setSaving(false);
        if (updated) {
            enqueueSnackbar(isBozza ? "Release pubblicata con successo." : "Release archiviata come bozza.", {
                title: "OK",
                type: "success",
            });
            onVisibilityUpdated?.(updated as ReleaseNote);
            onClose();
        }
    };

    const dataCreazione = note ? new Date(note.dataCreazione) : null;

    // patch asset nell'HTML iniettato
    const patchedHtml = React.useMemo(() => {
        const raw = note?.contenuto ?? "";
        try {
            return rewriteHtmlAssets(raw);
        } catch {
            return raw;
        }
    }, [note?.contenuto]);

    // enhancement del contenuto (riusabile e senza script iniettati)
    useInjectedHtmlEnhancements(
        contentRef,
        {
            zoomAttr: "data-zoom",
            gridShotClass: "grid-shot",
            lightboxId: "fd-lightbox",
        },
        [open, patchedHtml]
    );

    if (!open) return null;

    return createPortal(
        <LazyMotion features={domAnimation}>
            <AnimatePresence>
                {open && (
                    <>
                        <FDBackdrop onClick={onClose} />

                        <div className={wrapperClass} aria-live="polite">
                            <motion.div
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="release-modal-title"
                                aria-busy={loading ? "true" : "false"}
                                tabIndex={-1}
                                ref={panelRef}
                                className="relative z-[1010] w-full max-w-6xl outline-none md:my-6 pointer-events-auto"
                                variants={panelVariants as any}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                <FDBox
                                    color="dark"
                                    className="relative rounded-2xl shadow-2xl shadow-black/30 ring-1 ring-white/10 overflow-hidden"
                                >
                                    <div className="relative max-h-[min(92vh,1200px)] overflow-y-auto">
                                        {loading ? (
                                            /* scheletro */
                                            <div className="animate-pulse text-white">
                                                {/* ... il tuo skeleton come prima ... */}
                                            </div>
                                        ) : (
                                            note && (
                                                <main className="relative text-white antialiased">
                                                    <FDIconButton
                                                        className="fixed right-4 top-2 z-10"
                                                        variant="danger"
                                                        size="small"
                                                        icon={<CloseIcon size={20} className="text-gray-100" />}
                                                        onClick={onClose}
                                                        aria-label="Chiudi"
                                                    />

                                                    <div className="absolute right-10 top-10">
                                                        <div className="grid h-20 w-20 place-items-center rounded-full bg-black/70 backdrop-blur text-xs font-bold text-white shadow-xl shadow-black/30">
                                                            <span className="font-mono text-3xl tracking-tight">&lt;/&gt;</span>
                                                        </div>
                                                    </div>

                                                    <section
                                                        className="relative mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 md:flex-row md:items-start md:gap-10 md:py-10"
                                                        id="release-modal-title"
                                                    >
                                                        <div
                                                            className="corner-triangle absolute right-0 top-0 h-2/3 w-[60%] bg-teal-400"
                                                            style={{ clipPath: "polygon(35% 0%, 100% 0%, 100% 100%)" }}
                                                        />
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <Tag className="mb-4" text={note?.visibilita ?? ""} />
                                                                {Array.isArray(note.targetUtenti) &&
                                                                    note.targetUtenti.map((t, i) => <Tag key={i} className="mb-4" text={t} />)}
                                                            </div>

                                                            <div className="mb-12 flex items-center gap-3">
                                                                <div className="grid h-9 w-9 place-items-center rounded-full bg-white text-xs font-bold text-black">
                                                                    NX
                                                                </div>
                                                                <div className="text-2xl font-semibold">
                                                                    <span className="text-white">NEX</span>
                                                                    <span className="ml-2 text-white/80">Team</span>
                                                                </div>
                                                            </div>

                                                            {dataCreazione && (
                                                                <div className="mb-4 font-semibold tracking-[0.25em] text-teal-400">
                                                                    {dataCreazione.toLocaleString("it-IT", { day: "numeric" }).toUpperCase()}_
                                                                    {dataCreazione.toLocaleString("it-IT", { month: "long" }).toUpperCase()}_
                                                                    <span className="tabular-nums">
                                                                        {dataCreazione.toLocaleString("it-IT", { year: "numeric" }).toUpperCase()}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            <h1 className="text-6xl font-extrabold leading-[0.9] sm:text-7xl md:text-8xl">
                                                                {note.tags.toLocaleUpperCase()}
                                                                <br />
                                                                NOTES
                                                                <span className="ml-6 text-5xl">v{note.versione}</span>
                                                            </h1>
                                                        </div>

                                                        <div className="hidden h-56 w-px bg-white/20 md:block self-center" />

                                                        <div className="flex-1 md:pt-24">
                                                            <ul className="space-y-8 text-lg sm:text-xl">
                                                                <li className="flex items-start gap-4">
                                                                    <span className="mt-1 inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-teal-400/20 ring-2 ring-teal-400">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 stroke-[3] stroke-teal-300" fill="none">
                                                                            <path d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    </span>
                                                                    <div>
                                                                        <div className="font-semibold">Novità</div>
                                                                        <div className="text-white/80 -mt-0.5">Strumenti e pannelli</div>
                                                                    </div>
                                                                </li>
                                                                <li className="flex items-start gap-4">
                                                                    <span className="mt-1 inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-teal-400/20 ring-2 ring-teal-400">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 stroke-[3] stroke-teal-300" fill="none">
                                                                            <path d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    </span>
                                                                    <div>
                                                                        <div className="font-semibold">Miglioramenti</div>
                                                                        <div className="text-white/80 -mt-0.5">UI e performance</div>
                                                                    </div>
                                                                </li>
                                                                <li className="flex items-start gap-4">
                                                                    <span className="mt-1 inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-teal-400/20 ring-2 ring-teal-400">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 stroke-[3] stroke-teal-300" fill="none">
                                                                            <path d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    </span>
                                                                    <div>
                                                                        <div className="font-semibold">Sicurezza</div>
                                                                        <div className="text-white/80 -mt-0.5">Dati e stabilità</div>
                                                                    </div>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </section>

                                                    <div className="p-6 z-[10] relative">
                                                        <p className="text-3xl">{note?.titolo ?? ""}</p>
                                                        {note.descrizione && <p className="mb-4 mt-2 text-lg text-white/80">{note.descrizione}</p>}

                                                        <div
                                                            ref={contentRef}
                                                            className="text-sm"
                                                            // da qui in poi niente script: tutta la logica è in useInjectedHtmlEnhancements
                                                            dangerouslySetInnerHTML={{ __html: patchedHtml }}
                                                        />
                                                    </div>

                                                    {canToggle && (
                                                        <FDButton
                                                            variant="outline"
                                                            color="dark"
                                                            onClick={handleToggle}
                                                            disabled={saving}
                                                            loading={saving}
                                                            className="fixed bottom-4 right-4 ml-auto block md:absolute hover:bg-gray-800 z-[20]"
                                                        >
                                                            {saving ? "Salvataggio..." : isBozza ? "Pubblica" : "Archivia"}
                                                        </FDButton>
                                                    )}
                                                </main>
                                            )
                                        )}
                                    </div>
                                </FDBox>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </LazyMotion>,
        document.body
    );
};

export default ReleaseDetailsModal;
